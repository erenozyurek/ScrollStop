import { BACKEND_BASE_URL } from '@env';
import { NativeModules, Platform } from 'react-native';
import { getFirebaseIdToken } from './authService';

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

export interface RecentCaption {
  id: string;
  text: string;
  hashtags: string;
  captions: GeneratedCaption[];
  productName: string;
  platforms: string[];
  tone: string;
  captionStyle: string;
  language: string;
  createdAt: string;
}

const DEFAULT_HERD_BACKEND_URL = 'http://scrollstop-backend.test';
const BACKEND_PORT_CANDIDATES = [8087, 8000, 8787, 8081];
const CAPTION_ENDPOINT_PATHS = ['/api/captions'];
const RECENT_CAPTION_ENDPOINT_PATH = '/api/captions/recent';

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

const getCaptionApiBaseUrls = (): string[] => {
  const urls = new Set<string>();

  const envBase = normalizeBaseUrl(BACKEND_BASE_URL || DEFAULT_HERD_BACKEND_URL);
  if (envBase) {
    urls.add(envBase);

    // Some devices cannot resolve .test domains. Fallback to Metro host IP + common local ports.
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

const normalizeRecentCaption = (item: any): RecentCaption | null => {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const id = String(item.id || '').trim();
  const text = String(item.text || '').trim();
  if (!text) {
    return null;
  }

  const captions = Array.isArray(item.captions)
    ? item.captions
        .map(normalizeCaption)
        .filter(
          (caption: GeneratedCaption | null): caption is GeneratedCaption => !!caption,
        )
    : [];

  const platforms = Array.isArray(item.platforms)
    ? item.platforms
        .map((platform: any) => String(platform || '').trim())
        .filter((platform: string) => platform.length > 0)
    : [];

  return {
    id,
    text,
    hashtags: String(item.hashtags || '').trim(),
    captions,
    productName: String(item.productName || '').trim(),
    platforms,
    tone: String(item.tone || '').trim(),
    captionStyle: String(item.captionStyle || '').trim(),
    language: String(item.language || '').trim(),
    createdAt: String(item.createdAt || '').trim(),
  };
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
    /Cannot POST \/api\/captions|Not Found/i.test(
      responseText,
    );

  return looksLikeWrongService || responseStatus >= 500;
};

const extractTextFromHtml = (input: string): string => {
  return input
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const toReadableErrorMessage = (
  responseStatus: number,
  rawText: string,
  endpointUrl: string,
): string => {
  const trimmed = rawText.trim();
  const isHtml = /<!doctype html>|<html/i.test(trimmed);
  const plainText = isHtml ? extractTextFromHtml(trimmed) : trimmed;

  if (responseStatus === 404) {
    return `Backend endpoint bulunamadi (404): ${endpointUrl}`;
  }

  if (responseStatus === 401) {
    return 'Backend token dogrulamasi basarisiz (401). Tekrar giris yapip deneyin.';
  }

  if (responseStatus === 419) {
    return 'Backend CSRF (419) hatasi verdi. Caption endpoint API route uzerinden acilmali (/api/captions).';
  }

  if (!plainText) {
    return `Caption API request failed with status ${responseStatus}.`;
  }

  return plainText;
};

export const generateCaptions = async (
  input: CaptionGenerationInput,
): Promise<GeneratedCaption[]> => {
  const baseUrls = getCaptionApiBaseUrls();
  const explicitBase = normalizeBaseUrl(BACKEND_BASE_URL || DEFAULT_HERD_BACKEND_URL);
  const explicitIsTestDomain = isTestDomainBaseUrl(explicitBase);
  const targets = baseUrls.flatMap(baseUrl =>
    CAPTION_ENDPOINT_PATHS.map(path => ({ baseUrl, path })),
  );
  let lastError: Error | null = null;
  let attemptedConnection = false;
  const hasExplicitBackendUrl = normalizeBaseUrl(BACKEND_BASE_URL || '') !== '';

  const idToken = await getFirebaseIdToken();
  if (!idToken) {
    throw new Error('Oturum dogrulanamadi. Lutfen tekrar giris yap.');
  }

  for (let i = 0; i < targets.length; i += 1) {
    const { baseUrl, path } = targets[i];
    const isLastCandidate = i === targets.length - 1;

    try {
      const endpointUrl = `${baseUrl}${path}`;
      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(input),
      });

      attemptedConnection = true;
      const rawText = await response.text();
      let payload: any = null;

      try {
        payload = rawText ? JSON.parse(rawText) : null;
      } catch {
        payload = null;
      }

      if (!response.ok) {
        if (
          shouldTryFallback(response.status, rawText, isLastCandidate) &&
          (!hasExplicitBackendUrl || explicitIsTestDomain)
        ) {
          continue;
        }

        const message =
          payload?.error ||
          payload?.message ||
          toReadableErrorMessage(response.status, rawText, endpointUrl);
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
      lastError =
        error instanceof Error
          ? error
          : new Error('Failed to connect to the Caption API.');
    }
  }

  if (attemptedConnection && lastError?.message === 'Network request failed') {
    throw new Error(
      `Caption API baglantisi kurulamadi. Denenen adresler: ${baseUrls.join(', ')}`,
    );
  }

  if (hasExplicitBackendUrl && lastError) {
    throw new Error(
      `${lastError.message} (BACKEND_BASE_URL: ${normalizeBaseUrl(
        BACKEND_BASE_URL || '',
      )}, denenen adresler: ${baseUrls.join(', ')})`,
    );
  }

  throw lastError || new Error('Failed to connect to the Caption API.');
};

export const getRecentCaptions = async (
  limit = 10,
): Promise<RecentCaption[]> => {
  const safeLimit = Math.max(1, Math.min(30, Math.floor(limit)));
  const baseUrls = getCaptionApiBaseUrls();
  const explicitBase = normalizeBaseUrl(BACKEND_BASE_URL || DEFAULT_HERD_BACKEND_URL);
  const explicitIsTestDomain = isTestDomainBaseUrl(explicitBase);
  const targets = baseUrls.map(baseUrl => ({
    baseUrl,
    path: `${RECENT_CAPTION_ENDPOINT_PATH}?limit=${safeLimit}`,
  }));
  let lastError: Error | null = null;
  let attemptedConnection = false;
  const hasExplicitBackendUrl = normalizeBaseUrl(BACKEND_BASE_URL || '') !== '';

  const idToken = await getFirebaseIdToken();
  if (!idToken) {
    throw new Error('Oturum dogrulanamadi. Lutfen tekrar giris yap.');
  }

  for (let i = 0; i < targets.length; i += 1) {
    const { baseUrl, path } = targets[i];
    const isLastCandidate = i === targets.length - 1;

    try {
      const endpointUrl = `${baseUrl}${path}`;
      const response = await fetch(endpointUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      });

      attemptedConnection = true;
      const rawText = await response.text();
      let payload: any = null;

      try {
        payload = rawText ? JSON.parse(rawText) : null;
      } catch {
        payload = null;
      }

      if (!response.ok) {
        if (
          shouldTryFallback(response.status, rawText, isLastCandidate) &&
          (!hasExplicitBackendUrl || explicitIsTestDomain)
        ) {
          continue;
        }

        const message =
          payload?.error ||
          payload?.message ||
          toReadableErrorMessage(response.status, rawText, endpointUrl);
        throw new Error(message);
      }

      const items = Array.isArray(payload?.items)
        ? payload.items
            .map(normalizeRecentCaption)
            .filter(
              (caption: RecentCaption | null): caption is RecentCaption => !!caption,
            )
        : [];

      return items;
    } catch (error) {
      lastError =
        error instanceof Error
          ? error
          : new Error('Failed to connect to the Caption History API.');
    }
  }

  if (attemptedConnection && lastError?.message === 'Network request failed') {
    throw new Error(
      `Caption history API baglantisi kurulamadi. Denenen adresler: ${baseUrls.join(', ')}`,
    );
  }

  if (hasExplicitBackendUrl && lastError) {
    throw new Error(
      `${lastError.message} (BACKEND_BASE_URL: ${normalizeBaseUrl(
        BACKEND_BASE_URL || '',
      )}, denenen adresler: ${baseUrls.join(', ')})`,
    );
  }

  throw lastError || new Error('Failed to connect to the Caption History API.');
};
