import { NativeModules, Platform } from 'react-native';

export type CaptionGenerationInput = {
  productName: string;
  productDescription?: string;
  platforms: string[];
  tone: string;
  captionStyle?: string;

  language?: string;
  hashtagCount?: number;
  maxCaptionChars?: number;
  includeEmojis?: boolean;
  cta?: string;
  audience?: string;
  avoidClaims?: string[];
};

export interface GeneratedCaption {
  caption: string;
  hashtags: string;
}

const API_PORT_CANDIDATES = [8081, 8787, 8087];

const getDevHostCandidates = (): string[] => {
  const hosts = new Set<string>();

  if (Platform.OS === 'web') {
    const webHost = (globalThis as any)?.location?.hostname;
    hosts.add(webHost || 'localhost');
  } else {
    const scriptURL: string | undefined = NativeModules?.SourceCode?.scriptURL;
    if (scriptURL) {
      try {
        const parsed = new URL(scriptURL);
        if (parsed.hostname) {
          hosts.add(parsed.hostname);
        }
      } catch {
        // ignore parse errors, fall back to platform defaults.
      }
    }

    hosts.add(Platform.OS === 'android' ? '10.0.2.2' : 'localhost');
  }

  return Array.from(hosts);
};

const CAPTION_API_BASE_URLS = getDevHostCandidates().flatMap(host =>
  API_PORT_CANDIDATES.map(port => `http://${host}:${port}`),
);

const normalizeCaption = (item: any): GeneratedCaption | null => {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const caption = String(item.caption || '').trim();
  const hashtags = String(item.hashtags || '').trim();

  if (!caption) {
    return null;
  }

  return { caption, hashtags };
};

export const generateCaptions = async (
  input: CaptionGenerationInput,
): Promise<GeneratedCaption[]> => {
  let lastError: Error | null = null;
  let attemptedConnection = false;

  for (let i = 0; i < CAPTION_API_BASE_URLS.length; i += 1) {
    const baseUrl = CAPTION_API_BASE_URLS[i];
    const isLastCandidate = i === CAPTION_API_BASE_URLS.length - 1;

    try {
      const response = await fetch(`${baseUrl}/api/captions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      const rawText = await response.text();
      let payload: any = null;

      try {
        payload = rawText ? JSON.parse(rawText) : null;
      } catch {
        payload = null;
      }

      if (!response.ok) {
        const message =
          payload?.error ||
          payload?.message ||
          rawText ||
          `Caption API request failed with status ${response.status}.`;
        const isProbablyWrongService =
          response.status === 404 &&
          /Cannot POST \/api\/captions|Not Found/i.test(rawText);
        const shouldTryFallback =
          !isLastCandidate && (isProbablyWrongService || response.status >= 500);

        if (shouldTryFallback) {
          continue;
        }

        throw new Error(message);
      }

      const captions = Array.isArray(payload?.captions)
        ? payload.captions
            .map(normalizeCaption)
            .filter(
              (item: GeneratedCaption | null): item is GeneratedCaption => !!item,
            )
        : [];

      if (captions.length === 0) {
        throw new Error('Caption API did not return any captions.');
      }

      return captions;
    } catch (error) {
      attemptedConnection = true;
      lastError =
        error instanceof Error
          ? error
          : new Error('Failed to connect to the Caption API.');

      if (isLastCandidate) {
        throw lastError;
      }
    }
  }

  if (attemptedConnection && lastError?.message === 'Network request failed') {
    const hint = [
      'Caption API baglantisi kurulamadi.',
      'Backend calisiyor mu? (`npm run caption:api`)',
      `Denenen adresler: ${CAPTION_API_BASE_URLS.join(', ')}`,
    ].join(' ');
    throw new Error(hint);
  }

  throw lastError || new Error('Failed to connect to the Caption API.');
};
