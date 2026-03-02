const RATE_BUCKETS = new Map();

const NAME_MIN = 3;
const NAME_MAX = 16;
const RESERVED_NAMES = new Set(['guest']);

const DEVICE_ID_RE = /^[a-zA-Z0-9-]{12,64}$/;

function getClientIp(event) {
  const headers = event.headers || {};
  const xff = headers['x-forwarded-for'] || headers['X-Forwarded-For'];
  if (xff) return String(xff).split(',')[0].trim();
  return headers['client-ip'] || headers['Client-Ip'] || 'unknown';
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function response(statusCode, payload) {
  return {
    statusCode,
    headers: {
      ...corsHeaders(),
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify(payload),
  };
}

function handlePreflight(event) {
  if (event.httpMethod !== 'OPTIONS') return null;
  return {
    statusCode: 204,
    headers: {
      ...corsHeaders(),
      'Cache-Control': 'no-store',
    },
    body: '',
  };
}

function parseJsonBody(event) {
  try {
    return JSON.parse(event.body || '{}');
  } catch {
    return null;
  }
}

function requireMethod(event, allowed) {
  if (allowed.includes(event.httpMethod)) return null;
  return response(405, { error: 'Method Not Allowed' });
}

function normalizeName(name) {
  if (typeof name !== 'string') return '';
  return name.slice(0, NAME_MAX).trim();
}

function isValidName(name) {
  if (typeof name !== 'string') return false;
  const normalized = name.trim();
  if (normalized.length < NAME_MIN || normalized.length > NAME_MAX) return false;
  if (RESERVED_NAMES.has(normalized.toLowerCase())) return false;
  return true;
}

function isValidDeviceId(deviceId) {
  return typeof deviceId === 'string' && DEVICE_ID_RE.test(deviceId);
}

function toSafeInt(value, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const n = Math.trunc(value);
  if (n < min || n > max) return null;
  return n;
}

function enforceRateLimit(key, limit, windowMs) {
  const now = Date.now();
  const bucket = RATE_BUCKETS.get(key);

  if (!bucket || now - bucket.windowStart >= windowMs) {
    RATE_BUCKETS.set(key, { windowStart: now, count: 1 });
    return { allowed: true };
  }

  if (bucket.count >= limit) {
    const retryAfterSec = Math.max(1, Math.ceil((windowMs - (now - bucket.windowStart)) / 1000));
    return { allowed: false, retryAfterSec };
  }

  bucket.count += 1;
  return { allowed: true };
}

function cleanupOldBuckets(maxAgeMs = 10 * 60 * 1000) {
  const now = Date.now();
  for (const [key, bucket] of RATE_BUCKETS.entries()) {
    if (now - bucket.windowStart > maxAgeMs) {
      RATE_BUCKETS.delete(key);
    }
  }
}

module.exports = {
  cleanupOldBuckets,
  enforceRateLimit,
  getClientIp,
  handlePreflight,
  isValidDeviceId,
  isValidName,
  normalizeName,
  parseJsonBody,
  requireMethod,
  response,
  toSafeInt,
};
