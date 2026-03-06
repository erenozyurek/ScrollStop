import { BACKEND_VIDEO_URL } from '@env';
import { NativeModules, Platform } from 'react-native';
import { getFirebaseIdToken } from './authService';

export type VideoJobStatus = 'pending' | 'processing' | 'success' | 'error';

export type ProductImageInput = {
  uri: string;
  type?: string;
  name?: string;
  note?: string;
};

export type VideoGenerationInput = {
  productName: string;
  productDescription?: string;
  brandName?: string;
  platform: 'TikTok' | 'Instagram' | 'YouTube';
  durationSeconds: number;
  tone: string;
  language: 'English' | 'Turkish';
  voice?: {
    enabled: boolean;
    gender?: 'male' | 'female';
    style?: 'serious' | 'friendly' | 'energetic';
  };
  aspectRatio?: '9:16';
  includePrice?: boolean;
  priceText?: string;
  cta?: string;
  productImages?: ProductImageInput[];
  referenceImageUrls?: string[];
  referenceImageNotes?: string[];
};

export type VideoJobCreateResponse = {
  ok: true;
  jobId: string;
  status: VideoJobStatus;
};

export type VideoJobStatusResponse = {
  ok: true;
  jobId: string;
  status: VideoJobStatus;
  videoUrl: string | null;
  error: string | null;
};

export type RecentVideoJob = {
  jobId: string;
  status: VideoJobStatus;
  videoUrl: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  inputPayload: Record<string, any>;
  output: Record<string, any>;
};

const DEFAULT_VIDEO_BACKEND_URL =
  'https://scrollstop-video-263965967395.europe-west1.run.app';
const BACKEND_PORT_CANDIDATES = [8087, 8000, 8787, 8081];
const VIDEO_COLLECTION_PATH_CANDIDATES = ['/api/videos', '/videos'] as const;

const normalizeBaseUrl = (rawUrl: string): string => {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `http://${trimmed}`;
  return withProtocol.replace(/\/+$/, '');
};

const getDevHostCandidates = (): string[] => {
  const hosts = new Set<string>();

  if (Platform.OS === 'web') {
    const webHost = (globalThis as any)?.location?.hostname;
    hosts.add(webHost || 'localhost');
    hosts.add('localhost');
    return Array.from(hosts);
  }

  const scriptURL: string | undefined = NativeModules?.SourceCode?.scriptURL;
  if (scriptURL) {
    const match = scriptURL.match(/^[a-z]+:\/\/([^/:]+)/i);
    if (match?.[1]) {
      hosts.add(match[1]);
    }
  }

  hosts.add(Platform.OS === 'android' ? '10.0.2.2' : 'localhost');
  return Array.from(hosts);
};

const getMetroHost = (): string | null => {
  const scriptURL: string | undefined = NativeModules?.SourceCode?.scriptURL;
  if (!scriptURL) {
    return null;
  }

  const match = scriptURL.match(/^[a-z]+:\/\/([^/:]+)/i);
  return match?.[1] || null;
};

const isTestDomainBaseUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return /\.test$/i.test(parsed.hostname);
  } catch {
    return false;
  }
};

const getVideoApiBaseUrls = (): string[] => {
  const urls = new Set<string>();
  const envBase = normalizeBaseUrl(BACKEND_VIDEO_URL || DEFAULT_VIDEO_BACKEND_URL);

  if (envBase) {
    urls.add(envBase);

    if (isTestDomainBaseUrl(envBase)) {
      const metroHost = getMetroHost();
      if (metroHost) {
        urls.add(`http://${metroHost}:8087`);
        urls.add(`http://${metroHost}:8000`);
      }

      urls.add('http://localhost:8087');
      urls.add('http://127.0.0.1:8087');
      if (Platform.OS === 'android') {
        urls.add('http://10.0.2.2:8087');
        urls.add('http://10.0.2.2:8000');
      }
    }

    return Array.from(urls);
  }

  const hosts = getDevHostCandidates();
  for (const host of hosts) {
    for (const port of BACKEND_PORT_CANDIDATES) {
      urls.add(`http://${host}:${port}`);
    }
  }

  return Array.from(urls);
};

const extractTextFromHtml = (input: string): string =>
  input
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const toReadableErrorMessage = (
  responseStatus: number,
  rawText: string,
  endpointUrl: string,
): string => {
  const trimmed = rawText.trim();
  const isHtml = /<!doctype html>|<html/i.test(trimmed);
  const plainText = isHtml ? extractTextFromHtml(trimmed) : trimmed;

  if (responseStatus === 404) {
    return `Video endpoint bulunamadi (404): ${endpointUrl}`;
  }

  if (responseStatus === 401) {
    return 'Backend token dogrulamasi basarisiz (401). Tekrar giris yapip deneyin.';
  }

  if (!plainText) {
    return `Video API request failed with status ${responseStatus}.`;
  }

  return plainText;
};

const shouldTryFallback = (
  responseStatus: number,
  responseText: string,
  isLastCandidate: boolean,
): boolean => {
  if (isLastCandidate) {
    return false;
  }

  const looksLikeWrongService =
    responseStatus === 404 &&
    /Cannot POST \/api\/videos|Cannot GET \/api\/videos|Cannot POST \/videos|Cannot GET \/videos|The route api\/videos\/recent could not be found|The route api\/videos could not be found|The route videos\/recent could not be found|The route videos could not be found|Not Found/i.test(
      responseText,
    );

  return looksLikeWrongService || responseStatus >= 500;
};

const getVideoEndpointCandidates = (
  baseUrls: string[],
  pathBuilder: (rootPath: (typeof VIDEO_COLLECTION_PATH_CANDIDATES)[number]) => string,
): string[] => {
  const endpoints = new Set<string>();

  for (const baseUrl of baseUrls) {
    for (const rootPath of VIDEO_COLLECTION_PATH_CANDIDATES) {
      endpoints.add(`${baseUrl}${pathBuilder(rootPath)}`);
    }
  }

  return Array.from(endpoints);
};

const parseJsonSafe = (rawText: string): any => {
  try {
    return rawText ? JSON.parse(rawText) : null;
  } catch {
    return null;
  }
};

const normalizeStatus = (rawStatus: unknown): VideoJobStatus => {
  const status = String(rawStatus || '').trim().toLowerCase();
  if (status === 'processing') return 'processing';
  if (status === 'success') return 'success';
  if (status === 'error') return 'error';
  return 'pending';
};

const getAuthTokenOrThrow = async (forceRefresh = false): Promise<string> => {
  const idToken = await getFirebaseIdToken(forceRefresh);
  if (!idToken) {
    throw new Error('Oturum dogrulanamadi. Lutfen tekrar giris yap.');
  }
  return idToken;
};

const fetchWithBearerRetry = async (
  endpointUrl: string,
  init: Omit<RequestInit, 'headers'> & {
    headers?: Record<string, string>;
  },
  token: string,
): Promise<{ response: Response; token: string }> => {
  const withToken = (idToken: string) =>
    fetch(endpointUrl, {
      ...init,
      headers: {
        ...(init.headers || {}),
        Authorization: `Bearer ${idToken}`,
      },
    });

  let activeToken = token;
  let response = await withToken(activeToken);

  if (response.status !== 401) {
    return { response, token: activeToken };
  }

  const refreshedToken = await getAuthTokenOrThrow(true).catch(() => null);
  if (!refreshedToken || refreshedToken === activeToken) {
    return { response, token: activeToken };
  }

  activeToken = refreshedToken;
  response = await withToken(activeToken);
  return { response, token: activeToken };
};

const hasProductImages = (input: VideoGenerationInput): boolean =>
  Array.isArray(input.productImages) &&
  input.productImages.some(image => String(image?.uri || '').trim().length > 0);

const buildVideoCreateBody = (input: VideoGenerationInput): string | FormData => {
  if (!hasProductImages(input)) {
    return JSON.stringify(input);
  }

  const form = new FormData();
  form.append('productName', input.productName);

  if (input.productDescription) form.append('productDescription', input.productDescription);
  if (input.brandName) form.append('brandName', input.brandName);
  form.append('platform', input.platform);
  form.append('durationSeconds', String(input.durationSeconds));
  form.append('tone', input.tone);
  form.append('language', input.language);
  form.append('aspectRatio', input.aspectRatio || '9:16');
  form.append('includePrice', input.includePrice ? '1' : '0');
  if (input.priceText) form.append('priceText', input.priceText);
  if (input.cta) form.append('cta', input.cta);

  if (input.voice) {
    form.append('voice[enabled]', input.voice.enabled ? '1' : '0');
    if (input.voice.gender) {
      form.append('voice[gender]', input.voice.gender);
    }
    if (input.voice.style) {
      form.append('voice[style]', input.voice.style);
    }
  }

  (input.referenceImageUrls || [])
    .map(url => String(url || '').trim())
    .filter(url => url.length > 0)
    .slice(0, 5)
    .forEach(url => {
      form.append('referenceImageUrls[]', url);
    });

  (input.referenceImageNotes || [])
    .map(note => String(note || '').trim())
    .slice(0, 5)
    .forEach(note => {
      form.append('referenceImageNotes[]', note);
    });

  (input.productImages || [])
    .filter(image => String(image?.uri || '').trim().length > 0)
    .slice(0, 5)
    .forEach((image, index) => {
      const uri = String(image.uri).trim();
      const type = image.type || 'image/jpeg';
      const fallbackName = `product-${index + 1}.${type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg'}`;
      const name = image.name || fallbackName;

      form.append('productImages[]', {
        uri,
        type,
        name,
      } as any);

      if (image.note && image.note.trim().length > 0) {
        form.append('referenceImageNotes[]', image.note.trim());
      }
    });

  return form;
};

const buildVideoCreateHeaders = (body: string | FormData): Record<string, string> => {
  if (typeof body === 'string') {
    return {
      'Content-Type': 'application/json',
    };
  }

  return {
    Accept: 'application/json',
  };
};

export const createVideoJob = async (
  input: VideoGenerationInput,
): Promise<VideoJobCreateResponse> => {
  let idToken = await getAuthTokenOrThrow();
  const baseUrls = getVideoApiBaseUrls();
  const endpointUrls = getVideoEndpointCandidates(baseUrls, rootPath => rootPath);
  const explicitBase = normalizeBaseUrl(BACKEND_VIDEO_URL || DEFAULT_VIDEO_BACKEND_URL);
  const explicitIsTestDomain = isTestDomainBaseUrl(explicitBase);
  const hasExplicitBackendUrl = normalizeBaseUrl(BACKEND_VIDEO_URL || '') !== '';
  const canTryFallback =
    !hasExplicitBackendUrl || explicitIsTestDomain || endpointUrls.length > 1;
  const requestBody = buildVideoCreateBody(input);
  const requestHeaders = buildVideoCreateHeaders(requestBody);

  let lastError: Error | null = null;
  let attemptedConnection = false;

  for (let i = 0; i < endpointUrls.length; i += 1) {
    const endpointUrl = endpointUrls[i];
    const isLastCandidate = i === endpointUrls.length - 1;

    try {
      const requestResult = await fetchWithBearerRetry(
        endpointUrl,
        {
          method: 'POST',
          headers: requestHeaders,
          body: requestBody,
        },
        idToken,
      );
      idToken = requestResult.token;
      const response = requestResult.response;

      attemptedConnection = true;
      const rawText = await response.text();
      const payload = parseJsonSafe(rawText);

      if (!response.ok) {
        if (
          shouldTryFallback(response.status, rawText, isLastCandidate) &&
          canTryFallback
        ) {
          continue;
        }

        const message =
          payload?.error ||
          payload?.message ||
          toReadableErrorMessage(response.status, rawText, endpointUrl);
        throw new Error(message);
      }

      const jobId = String(payload?.jobId || '').trim();
      if (!jobId) {
        throw new Error('Video API jobId donmedi.');
      }

      return {
        ok: true,
        jobId,
        status: normalizeStatus(payload?.status),
      };
    } catch (error) {
      lastError =
        error instanceof Error
          ? error
          : new Error('Failed to connect to the Video API.');
    }
  }

  if (attemptedConnection && lastError?.message === 'Network request failed') {
    throw new Error(
      `Video API baglantisi kurulamadi. Denenen adresler: ${endpointUrls.join(', ')}`,
    );
  }

  if (hasExplicitBackendUrl && lastError) {
    throw new Error(
      `${lastError.message} (BACKEND_VIDEO_URL: ${normalizeBaseUrl(
        BACKEND_VIDEO_URL || '',
      )}, denenen adresler: ${endpointUrls.join(', ')})`,
    );
  }

  throw lastError || new Error('Failed to connect to the Video API.');
};

export const getVideoJobStatus = async (
  jobId: string,
): Promise<VideoJobStatusResponse> => {
  const normalizedJobId = jobId.trim();
  if (!normalizedJobId) {
    throw new Error('jobId bos olamaz.');
  }

  let idToken = await getAuthTokenOrThrow();
  const baseUrls = getVideoApiBaseUrls();
  const endpointUrls = getVideoEndpointCandidates(baseUrls, rootPath =>
    `${rootPath}/${encodeURIComponent(normalizedJobId)}`,
  );
  const explicitBase = normalizeBaseUrl(BACKEND_VIDEO_URL || DEFAULT_VIDEO_BACKEND_URL);
  const explicitIsTestDomain = isTestDomainBaseUrl(explicitBase);
  const hasExplicitBackendUrl = normalizeBaseUrl(BACKEND_VIDEO_URL || '') !== '';
  const canTryFallback =
    !hasExplicitBackendUrl || explicitIsTestDomain || endpointUrls.length > 1;

  let lastError: Error | null = null;
  let attemptedConnection = false;

  for (let i = 0; i < endpointUrls.length; i += 1) {
    const endpointUrl = endpointUrls[i];
    const isLastCandidate = i === endpointUrls.length - 1;

    try {
      const requestResult = await fetchWithBearerRetry(
        endpointUrl,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        },
        idToken,
      );
      idToken = requestResult.token;
      const response = requestResult.response;

      attemptedConnection = true;
      const rawText = await response.text();
      const payload = parseJsonSafe(rawText);

      if (!response.ok) {
        if (
          shouldTryFallback(response.status, rawText, isLastCandidate) &&
          canTryFallback
        ) {
          continue;
        }

        const message =
          payload?.error ||
          payload?.message ||
          toReadableErrorMessage(response.status, rawText, endpointUrl);
        throw new Error(message);
      }

      return {
        ok: true,
        jobId: String(payload?.jobId || normalizedJobId),
        status: normalizeStatus(payload?.status),
        videoUrl: payload?.videoUrl ? String(payload.videoUrl) : null,
        error: payload?.error ? String(payload.error) : null,
      };
    } catch (error) {
      lastError =
        error instanceof Error
          ? error
          : new Error('Failed to connect to the Video API.');
    }
  }

  if (attemptedConnection && lastError?.message === 'Network request failed') {
    throw new Error(
      `Video status API baglantisi kurulamadi. Denenen adresler: ${endpointUrls.join(', ')}`,
    );
  }

  if (hasExplicitBackendUrl && lastError) {
    throw new Error(
      `${lastError.message} (BACKEND_VIDEO_URL: ${normalizeBaseUrl(
        BACKEND_VIDEO_URL || '',
      )}, denenen adresler: ${endpointUrls.join(', ')})`,
    );
  }

  throw lastError || new Error('Failed to connect to the Video API.');
};

export const getRecentVideoJobs = async (
  limit: number = 20,
): Promise<RecentVideoJob[]> => {
  let idToken = await getAuthTokenOrThrow();
  const baseUrls = getVideoApiBaseUrls();
  const safeLimit = Math.max(1, Math.min(50, Math.floor(limit || 20)));
  const endpointUrls = getVideoEndpointCandidates(
    baseUrls,
    rootPath => `${rootPath}/recent?limit=${safeLimit}`,
  );
  const explicitBase = normalizeBaseUrl(BACKEND_VIDEO_URL || DEFAULT_VIDEO_BACKEND_URL);
  const explicitIsTestDomain = isTestDomainBaseUrl(explicitBase);
  const hasExplicitBackendUrl = normalizeBaseUrl(BACKEND_VIDEO_URL || '') !== '';
  const canTryFallback =
    !hasExplicitBackendUrl || explicitIsTestDomain || endpointUrls.length > 1;

  let lastError: Error | null = null;
  let attemptedConnection = false;

  for (let i = 0; i < endpointUrls.length; i += 1) {
    const endpointUrl = endpointUrls[i];
    const isLastCandidate = i === endpointUrls.length - 1;

    try {
      const requestResult = await fetchWithBearerRetry(
        endpointUrl,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        },
        idToken,
      );
      idToken = requestResult.token;
      const response = requestResult.response;

      attemptedConnection = true;
      const rawText = await response.text();
      const payload = parseJsonSafe(rawText);

      if (!response.ok) {
        if (
          shouldTryFallback(response.status, rawText, isLastCandidate) &&
          canTryFallback
        ) {
          continue;
        }

        const message =
          payload?.error ||
          payload?.message ||
          toReadableErrorMessage(response.status, rawText, endpointUrl);
        throw new Error(message);
      }

      const items: any[] = Array.isArray(payload?.items) ? payload.items : [];
      return items
        .filter((item: any) => item && typeof item === 'object')
        .map((item: any) => ({
          jobId: String(item.jobId || '').trim(),
          status: normalizeStatus(item.status),
          videoUrl: item.videoUrl ? String(item.videoUrl) : null,
          error: item.error ? String(item.error) : null,
          createdAt: item.createdAt ? String(item.createdAt) : '',
          updatedAt: item.updatedAt ? String(item.updatedAt) : '',
          inputPayload:
            item.inputPayload && typeof item.inputPayload === 'object'
              ? item.inputPayload
              : {},
          output: item.output && typeof item.output === 'object' ? item.output : {},
        }))
        .filter((item: RecentVideoJob) => item.jobId.length > 0);
    } catch (error) {
      lastError =
        error instanceof Error
          ? error
          : new Error('Failed to connect to the Video API.');
    }
  }

  if (attemptedConnection && lastError?.message === 'Network request failed') {
    throw new Error(
      `Video list API baglantisi kurulamadi. Denenen adresler: ${endpointUrls.join(', ')}`,
    );
  }

  if (hasExplicitBackendUrl && lastError) {
    throw new Error(
      `${lastError.message} (BACKEND_VIDEO_URL: ${normalizeBaseUrl(
        BACKEND_VIDEO_URL || '',
      )}, denenen adresler: ${endpointUrls.join(', ')})`,
    );
  }

  throw lastError || new Error('Failed to connect to the Video API.');
};
