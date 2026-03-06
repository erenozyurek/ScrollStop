import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getRecentVideoJobs,
  getVideoJobStatus,
  type RecentVideoJob,
  type VideoJobStatus,
} from '../services/videoApi';
import { useAuth } from './AuthContext';

const STORAGE_KEY = 'scrollstop.video_jobs.v1';
const POLL_INTERVAL_MS = 3500;

type TerminalStatus = Extract<VideoJobStatus, 'success' | 'error'>;

const isTerminalStatus = (status: VideoJobStatus): status is TerminalStatus =>
  status === 'success' || status === 'error';

const normalizeStatus = (value: unknown): VideoJobStatus => {
  const status = String(value || '').trim().toLowerCase();
  if (status === 'processing' || status === 'success' || status === 'error') {
    return status;
  }
  return 'pending';
};

const toEpochMs = (value: unknown, fallback: number): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  if (value && typeof value === 'object') {
    const maybeTimestamp = value as { toMillis?: () => number; seconds?: number };
    if (typeof maybeTimestamp.toMillis === 'function') {
      const millis = maybeTimestamp.toMillis();
      if (Number.isFinite(millis)) {
        return millis;
      }
    }

    if (typeof maybeTimestamp.seconds === 'number') {
      return Math.floor(maybeTimestamp.seconds * 1000);
    }
  }

  return fallback;
};

export type TrackedVideoJob = {
  jobId: string;
  productName: string;
  createdAtMs: number;
  updatedAtMs: number;
  status: VideoJobStatus;
  videoUrl: string | null;
  error: string | null;
  notifiedAtMs: number | null;
};

type TrackJobInput = {
  jobId: string;
  productName?: string;
  initialStatus?: VideoJobStatus;
};

type VideoJobsContextValue = {
  jobs: TrackedVideoJob[];
  trackJob: (input: TrackJobInput) => void;
  refreshJob: (jobId: string) => Promise<void>;
  removeJob: (jobId: string) => void;
  getJobById: (jobId: string) => TrackedVideoJob | null;
};

const VideoJobsContext = createContext<VideoJobsContextValue>({
  jobs: [],
  trackJob: () => {},
  refreshJob: async () => {},
  removeJob: () => {},
  getJobById: () => null,
});

const parseJobs = (raw: string | null): TrackedVideoJob[] => {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(item => item && typeof item === 'object')
      .map(item => {
        const normalizedStatus = normalizeStatus(item.status);

        return {
          jobId: String(item.jobId || '').trim(),
          productName: String(item.productName || 'Video Ad').trim() || 'Video Ad',
          createdAtMs: Number(item.createdAtMs || Date.now()),
          updatedAtMs: Number(item.updatedAtMs || Date.now()),
          status: normalizedStatus,
          videoUrl: item.videoUrl ? String(item.videoUrl) : null,
          error: item.error ? String(item.error) : null,
          notifiedAtMs: item.notifiedAtMs ? Number(item.notifiedAtMs) : null,
        };
      })
      .filter(job => job.jobId.length > 0)
      .slice(0, 30);
  } catch {
    return [];
  }
};

const mapRecentVideoJobs = (items: RecentVideoJob[]): TrackedVideoJob[] => {
  const now = Date.now();

  return items
    .filter(item => item && typeof item === 'object')
    .map(item => {
      const status = normalizeStatus(item.status);
      const createdAtMs = toEpochMs(item.createdAt, now);
      const updatedAtMs = toEpochMs(item.updatedAt, createdAtMs);

      return {
        jobId: String(item.jobId || '').trim(),
        productName: String(item.inputPayload?.productName || '').trim() || 'Video Ad',
        createdAtMs,
        updatedAtMs,
        status,
        videoUrl: item.videoUrl ? String(item.videoUrl) : null,
        error: item.error ? String(item.error) : null,
        notifiedAtMs: isTerminalStatus(status) ? now : null,
      } satisfies TrackedVideoJob;
    })
    .filter(job => job.jobId.length > 0)
    .slice(0, 30);
};

const mergeJobs = (
  fromStorage: TrackedVideoJob[],
  fromFirestore: TrackedVideoJob[],
): TrackedVideoJob[] => {
  const byId = new Map<string, TrackedVideoJob>();

  [...fromStorage, ...fromFirestore].forEach(job => {
    const existing = byId.get(job.jobId);
    if (!existing) {
      byId.set(job.jobId, job);
      return;
    }

    const keep = existing.updatedAtMs >= job.updatedAtMs ? existing : job;
    byId.set(job.jobId, {
      ...keep,
      productName: keep.productName || existing.productName || job.productName,
      notifiedAtMs:
        keep.notifiedAtMs ?? existing.notifiedAtMs ?? job.notifiedAtMs ?? null,
    });
  });

  return Array.from(byId.values())
    .sort((a, b) => b.createdAtMs - a.createdAtMs)
    .slice(0, 30);
};

const isAuthError = (error: unknown): boolean => {
  const message =
    error instanceof Error ? error.message : String(error || '');
  return /401|token dogrulamasi basarisiz|oturum dogrulanamadi/i.test(message);
};

const isIgnorableRecentJobsError = (error: unknown): boolean => {
  const message =
    error instanceof Error ? error.message : String(error || '');

  return (
    isAuthError(error) ||
    /route .*api\/videos\/recent.*could not be found/i.test(message) ||
    /video endpoint bulunamadi \(404\)/i.test(message) ||
    (/\b404\b/.test(message) && /videos\/recent/i.test(message))
  );
};

export const VideoJobsProvider = ({ children }: { children: ReactNode }) => {
  const { isLoggedIn, user, loading } = useAuth();
  const [jobs, setJobs] = useState<TrackedVideoJob[]>([]);
  const jobsRef = useRef<TrackedVideoJob[]>([]);
  const pollingRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    jobsRef.current = jobs;
  }, [jobs]);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!isLoggedIn || !user?.uid) {
      setJobs([]);
      return;
    }

    let active = true;
    (async () => {
      try {
        const [stored, recentJobs] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          getRecentVideoJobs(30).catch(error => {
            if (!isIgnorableRecentJobsError(error)) {
              console.warn('Recent video jobs fetch failed:', error);
            }
            return [];
          }),
        ]);

        if (!active) {
          return;
        }

        const merged = mergeJobs(parseJobs(stored), mapRecentVideoJobs(recentJobs));
        setJobs(merged);
      } catch {
        if (active) {
          setJobs([]);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [loading, isLoggedIn, user?.uid]);

  useEffect(() => {
    if (loading || !isLoggedIn) {
      return;
    }

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(jobs)).catch(() => {});
  }, [loading, isLoggedIn, jobs]);

  const trackJob = useCallback((input: TrackJobInput) => {
    const jobId = String(input.jobId || '').trim();
    if (!jobId) {
      return;
    }

    const now = Date.now();
    const productName = String(input.productName || 'Video Ad').trim() || 'Video Ad';
    const initialStatus = input.initialStatus || 'pending';

    setJobs(prev => {
      const existing = prev.find(job => job.jobId === jobId);
      const nextJob: TrackedVideoJob = existing
        ? {
            ...existing,
            productName: existing.productName || productName,
            status: isTerminalStatus(existing.status) ? existing.status : initialStatus,
            updatedAtMs: now,
          }
        : {
            jobId,
            productName,
            createdAtMs: now,
            updatedAtMs: now,
            status: initialStatus,
            videoUrl: null,
            error: null,
            notifiedAtMs: null,
          };

      return [nextJob, ...prev.filter(job => job.jobId !== jobId)].slice(0, 30);
    });
  }, []);

  const removeJob = useCallback((jobId: string) => {
    const normalized = jobId.trim();
    if (!normalized) {
      return;
    }
    setJobs(prev => prev.filter(job => job.jobId !== normalized));
  }, []);

  const refreshJob = useCallback(async (jobId: string) => {
    const normalized = jobId.trim();
    if (!normalized) {
      return;
    }

    const existing = jobsRef.current.find(job => job.jobId === normalized);
    if (!existing) {
      trackJob({ jobId: normalized });
    }

    try {
      const result = await getVideoJobStatus(normalized);
      const now = Date.now();

      setJobs(prev =>
        prev.map(job =>
          job.jobId === normalized
            ? {
                ...job,
                status: result.status,
                videoUrl: result.videoUrl,
                error: result.error,
                updatedAtMs: now,
              }
            : job,
        ),
      );
    } catch {
      // Keep silent here; periodic poll will retry.
    }
  }, [trackJob]);

  const pollPendingJobs = useCallback(async () => {
    if (pollingRef.current || loading || !isLoggedIn) {
      return;
    }

    const snapshot = jobsRef.current;
    const pendingJobs = snapshot.filter(job => !isTerminalStatus(job.status));
    if (pendingJobs.length === 0) {
      return;
    }

    pollingRef.current = true;
    try {
      const updates = await Promise.all(
        pendingJobs.map(async job => {
          try {
            const status = await getVideoJobStatus(job.jobId);
            return {
              jobId: job.jobId,
              status: status.status,
              videoUrl: status.videoUrl,
              error: status.error,
            };
          } catch {
            return null;
          }
        }),
      );

      const now = Date.now();
      const updateMap = new Map(
        updates
          .filter((item): item is NonNullable<typeof item> => !!item)
          .map(item => [item.jobId, item]),
      );

      if (updateMap.size === 0) {
        return;
      }

      const completionNotifications: TrackedVideoJob[] = [];

      setJobs(prev => {
        const next = prev.map(job => {
          const incoming = updateMap.get(job.jobId);
          if (!incoming) {
            return job;
          }

          const nextJob: TrackedVideoJob = {
            ...job,
            status: incoming.status,
            videoUrl: incoming.videoUrl,
            error: incoming.error,
            updatedAtMs: now,
          };

          const becameTerminal =
            !isTerminalStatus(job.status) && isTerminalStatus(nextJob.status);

          if (becameTerminal && nextJob.notifiedAtMs === null) {
            nextJob.notifiedAtMs = now;
            completionNotifications.push(nextJob);
          }

          return nextJob;
        });

        return next;
      });

      if (appStateRef.current === 'active') {
        completionNotifications.forEach(job => {
          if (job.status === 'success') {
            Alert.alert(
              'Video ready',
              `${job.productName} videosu hazir. Preview ekranindan acabilirsin.`,
            );
          } else {
            Alert.alert(
              'Generation failed',
              job.error || `${job.productName} olusturulamadi.`,
            );
          }
        });
      }
    } finally {
      pollingRef.current = false;
    }
  }, [loading, isLoggedIn]);

  useEffect(() => {
    if (loading || !isLoggedIn) {
      return;
    }

    const subscription = AppState.addEventListener('change', nextState => {
      appStateRef.current = nextState;
      if (nextState === 'active') {
        pollPendingJobs();
      }
    });

    pollPendingJobs();
    const intervalId = setInterval(() => {
      pollPendingJobs();
    }, POLL_INTERVAL_MS);

    return () => {
      subscription.remove();
      clearInterval(intervalId);
    };
  }, [loading, isLoggedIn, pollPendingJobs]);

  const value = useMemo<VideoJobsContextValue>(
    () => ({
      jobs: [...jobs].sort((a, b) => b.createdAtMs - a.createdAtMs),
      trackJob,
      refreshJob,
      removeJob,
      getJobById: (jobId: string) =>
        jobs.find(job => job.jobId === jobId.trim()) || null,
    }),
    [jobs, refreshJob, removeJob, trackJob],
  );

  return (
    <VideoJobsContext.Provider value={value}>
      {children}
    </VideoJobsContext.Provider>
  );
};

export const useVideoJobs = () => useContext(VideoJobsContext);
