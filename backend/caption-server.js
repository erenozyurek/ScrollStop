require('dotenv').config();
const http = require('http');

const DEFAULT_PORT = 8081;
const FALLBACK_PORT = 8787;
const HAS_EXPLICIT_PORT =
  typeof process.env.PORT === 'string' && process.env.PORT.length > 0;
const PORT = Number(process.env.PORT || DEFAULT_PORT);

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
if (!OPENROUTER_API_KEY) {
  throw new Error('OPENROUTER_API_KEY is required (do not hardcode it).');
}

const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

const SYSTEM_PROMPT = [
  'You are an expert social media direct-response ad copywriter.',
  'Task: generate short-form ad captions for social platforms.',
  'Important:',
  '- Do NOT invent product features or claims not provided by the user.',
  '- If product details are missing, keep claims generic (e.g., "everyday protection").',
  '- Keep language natural, conversion-oriented, and platform-appropriate.',
  '',
  'Output rules:',
  '- Return ONLY valid JSON (no markdown, no extra text).',
  '- Provide exactly 3 caption options.',
  '- Each option must be meaningfully different in angle:',
  '  1) Feature/benefit focused',
  '  2) Problem/solution or pain-point hook',
  '  3) Urgency/offer/CTA focused (even if generic)',
  '',
  'JSON schema:',
  '{ "captions": [ { "caption": "string", "hashtags": "#tag1 #tag2 ..." } ] }',
].join('\n');

const setCorsHeaders = res => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
};

const sendJson = (res, statusCode, payload) => {
  setCorsHeaders(res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
};

const collectRequestBody = req =>
  new Promise((resolve, reject) => {
    let body = '';

    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error('Request body too large.'));
        req.destroy();
      }
    });

    req.on('end', () => resolve(body));
    req.on('error', reject);
  });

const stripCodeFence = text => {
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return fencedMatch ? fencedMatch[1] : text;
};

const parseJsonFromText = text => {
  const candidate = stripCodeFence(String(text || '')).trim();
  if (!candidate) throw new Error('AI response is empty.');

  try {
    return JSON.parse(candidate);
  } catch (_) {
    const firstBrace = candidate.indexOf('{');
    const lastBrace = candidate.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
      throw new Error('AI response does not contain valid JSON.');
    }
    return JSON.parse(candidate.slice(firstBrace, lastBrace + 1));
  }
};

const normalizeHashtags = value => {
  if (Array.isArray(value)) {
    return value
      .map(tag => String(tag || '').trim())
      .filter(Boolean)
      .map(tag => (tag.startsWith('#') ? tag : `#${tag.replace(/^#+/, '')}`))
      .join(' ');
  }

  if (typeof value === 'string') {
    const tags = value.match(/#[A-Za-z0-9_]+/g) || [];
    if (tags.length > 0) return tags.join(' ');

    return value
      .split(/[,\s]+/)
      .map(tag => tag.trim())
      .filter(Boolean)
      .map(tag => (tag.startsWith('#') ? tag : `#${tag.replace(/^#+/, '')}`))
      .join(' ');
  }

  return '';
};

const normalizeCaptions = (data, forceCount = 3) => {
  const rawCaptions = Array.isArray(data)
    ? data
    : Array.isArray(data?.captions)
      ? data.captions
      : [];

  const normalized = rawCaptions
    .map(item => {
      let captionText = '';
      let hashtagsText = '';

      if (typeof item === 'string') {
        captionText = item.trim();
      } else if (item && typeof item === 'object') {
        captionText = String(item.caption || '').trim();
        hashtagsText = normalizeHashtags(item.hashtags || item.tags || '');
      } else {
        return null;
      }

      const captionTags = captionText.match(/#[A-Za-z0-9_]+/g) || [];
      if (!hashtagsText && captionTags.length > 0) hashtagsText = captionTags.join(' ');
      if (captionTags.length > 0) captionText = captionText.replace(/\s*#[A-Za-z0-9_]+/g, '').trim();

      if (!captionText) return null;

      return { caption: captionText, hashtags: hashtagsText };
    })
    .filter(Boolean);

  return normalized.slice(0, forceCount);
};

const extractMessageContent = messageContent => {
  if (typeof messageContent === 'string') return messageContent;
  if (Array.isArray(messageContent)) {
    return messageContent
      .map(part => (typeof part === 'string' ? part : part?.text || ''))
      .join('\n');
  }
  return '';
};

// --- simple in-memory rate limiter (per IP) ---
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;
const ipHits = new Map();

const rateLimitOk = ip => {
  const now = Date.now();
  const entry = ipHits.get(ip) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };

  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + RATE_LIMIT_WINDOW_MS;
  }

  entry.count += 1;
  ipHits.set(ip, entry);

  return entry.count <= RATE_LIMIT_MAX;
};

const buildUserPrompt = payload => {
  const {
    productName,
    productDescription,
    platforms,
    tone,
    captionStyle,
    language,
    hashtagCount,
    maxCaptionChars,
    includeEmojis,
    cta,
    audience,
    avoidClaims,
  } = payload;

  const avoidClaimsText =
    Array.isArray(avoidClaims) && avoidClaims.length
      ? avoidClaims.map(s => String(s).trim()).filter(Boolean).join(', ')
      : '';

  return [
    `Language: ${language || 'English'}`,
    `Target platforms: ${platforms.join(', ')}`,
    `Tone: ${tone}`,
    `Caption style: ${captionStyle || 'General ad caption'}`,
    `Max caption length: ${Number.isFinite(maxCaptionChars) ? maxCaptionChars : 140} characters`,
    `Hashtag count: ${Number.isFinite(hashtagCount) ? hashtagCount : 8}`,
    `Emojis: ${includeEmojis ? 'Allowed (keep minimal)' : 'None'}`,
    `CTA: ${cta || 'Not provided (use a generic CTA like "Shop now")'}`,
    `Audience: ${audience || 'Not provided'}`,
    avoidClaimsText ? `Avoid claims/words: ${avoidClaimsText}` : '',
    '',
    `Product name: ${productName}`,
    `Product description: ${productDescription || 'Not provided.'}`,
    '',
    'Goal: drive clicks/conversions and improve in-platform discoverability.',
    'Include one explicit search keyword phrase in each caption in the requested language.',
  ]
    .filter(Boolean)
    .join('\n');
};

const fetchWithTimeout = async (url, options, timeoutMs = 20_000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
};

const requestCaptionsFromOpenRouter = async payload => {
  const response = await fetchWithTimeout(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.OPENROUTER_HTTP_REFERER || 'http://localhost:8081',
        'X-Title': 'ScrollStop Caption Generator',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        temperature: 0.55,
        max_tokens: 450,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(payload) },
        ],
      }),
    },
    20_000,
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const reason = data?.error?.message || data?.message || `OpenRouter error (${response.status})`;
    throw new Error(reason);
  }

  const content = extractMessageContent(data?.choices?.[0]?.message?.content);
  const parsed = parseJsonFromText(content);
  return normalizeCaptions(parsed, 3);
};

const validatePayload = payload => {
  const productName = String(payload?.productName || '').trim();
  const productDescription = String(payload?.productDescription || '').trim();

  const platforms = Array.isArray(payload?.platforms)
    ? payload.platforms.map(p => String(p || '').trim()).filter(Boolean)
    : [];

  const tone = String(payload?.tone || '').trim();
  const captionStyle = String(payload?.captionStyle || '').trim();

  const language = String(payload?.language || 'English').trim() || 'English';
  const hashtagCount = payload?.hashtagCount != null ? Number(payload.hashtagCount) : undefined;
  const maxCaptionChars = payload?.maxCaptionChars != null ? Number(payload.maxCaptionChars) : undefined;
  const includeEmojis = Boolean(payload?.includeEmojis);
  const cta = String(payload?.cta || '').trim();
  const audience = String(payload?.audience || '').trim();
  const avoidClaims = Array.isArray(payload?.avoidClaims)
    ? payload.avoidClaims.map(v => String(v || '').trim()).filter(Boolean)
    : [];

  if (!productName) throw new Error('productName is required.');
  if (platforms.length === 0) throw new Error('At least one platform is required.');
  if (!tone) throw new Error('tone is required.');

  return {
    productName,
    productDescription,
    platforms,
    tone,
    captionStyle,
    language,
    hashtagCount: Number.isFinite(hashtagCount) ? hashtagCount : undefined,
    maxCaptionChars: Number.isFinite(maxCaptionChars) ? maxCaptionChars : undefined,
    includeEmojis,
    cta,
    audience,
    avoidClaims,
  };
};

const createServer = () =>
  http.createServer(async (req, res) => {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url || '/', 'http://localhost');

    if (req.method === 'GET' && url.pathname === '/health') {
      sendJson(res, 200, { ok: true, service: 'caption-api', model: OPENROUTER_MODEL });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/captions') {
      const ip =
        (req.headers['x-forwarded-for'] || '').toString().split(',')[0].trim() ||
        req.socket.remoteAddress ||
        'unknown';

      if (!rateLimitOk(ip)) {
        sendJson(res, 429, { error: 'Rate limit exceeded. Try again later.' });
        return;
      }

      try {
        const rawBody = await collectRequestBody(req);
        const parsedBody = rawBody ? JSON.parse(rawBody) : {};
        const payload = validatePayload(parsedBody);

        let captions;
        try {
          captions = await requestCaptionsFromOpenRouter(payload);
          if (!Array.isArray(captions) || captions.length < 3) throw new Error('Too few captions.');
        } catch (_) {
          const retryPayload = { ...payload, includeEmojis: false };
          captions = await requestCaptionsFromOpenRouter(retryPayload);
        }

        sendJson(res, 200, { captions });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to generate captions.';
        sendJson(res, 400, { error: message });
      }
      return;
    }

    sendJson(res, 404, { error: 'Not found.' });
  });

const startServer = (preferredPort = PORT) => {
  const server = createServer();

  server.once('error', error => {
    if (error?.code === 'EADDRINUSE' && !HAS_EXPLICIT_PORT && preferredPort === DEFAULT_PORT) {
      console.warn(`Port ${DEFAULT_PORT} is already in use. Retrying on ${FALLBACK_PORT}...`);
      startServer(FALLBACK_PORT);
      return;
    }
    console.error(`Failed to start Caption API on port ${preferredPort}.`);
    throw error;
  });

  server.listen(preferredPort, () => {
    console.log(`Caption API running on http://localhost:${preferredPort}`);
  });

  return server;
};

if (require.main === module) {
  startServer();
}

module.exports = { createServer, startServer };