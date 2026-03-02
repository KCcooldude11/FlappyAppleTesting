const { supabase } = require('./_utils/supabase');
const {
  cleanupOldBuckets,
  enforceRateLimit,
  getClientIp,
  handlePreflight,
  isValidDeviceId,
  parseJsonBody,
  requireMethod,
  response,
  toSafeInt,
} = require('./_utils/security');

const MAX_SCORE = 10000;
const MIN_PLAY_MS = 1000;
const MAX_PLAY_MS = 30 * 60 * 1000;

function isPlausibleScore(score, playMs) {
  if (typeof playMs !== 'number') return true;
  const maxByRunTime = Math.floor(playMs / 400);
  return score <= Math.max(5, maxByRunTime + 2);
}

exports.handler = async (event) => {
  try {
    cleanupOldBuckets();

    const preflight = handlePreflight(event);
    if (preflight) return preflight;

    const methodError = requireMethod(event, ['POST']);
    if (methodError) {
      return methodError;
    }

    const ip = getClientIp(event);
    const byIp = enforceRateLimit(`submit-score:ip:${ip}`, 25, 60 * 1000);
    if (!byIp.allowed) {
      return response(429, { error: 'Too many score submissions', retryAfterSec: byIp.retryAfterSec });
    }

    const body = parseJsonBody(event);
    if (!body) {
      return response(400, { error: 'Invalid JSON payload' });
    }

    const { deviceId } = body;
    const score = toSafeInt(body.score, { min: 0, max: MAX_SCORE });
    const playMs = body.playMs == null
      ? null
      : toSafeInt(body.playMs, { min: MIN_PLAY_MS, max: MAX_PLAY_MS });

    if (!isValidDeviceId(deviceId) || score == null) {
      return response(400, { error: 'Valid deviceId and numeric score are required' });
    }

    if (body.playMs != null && playMs == null) {
      return response(400, { error: 'playMs must be an integer between 1000 and 1800000' });
    }

    if (!isPlausibleScore(score, playMs)) {
      return response(400, { error: 'Score rejected by anti-cheat checks' });
    }

    const byDevice = enforceRateLimit(`submit-score:device:${deviceId}`, 8, 60 * 1000);
    if (!byDevice.allowed) {
      return response(429, { error: 'Too many submissions for this device', retryAfterSec: byDevice.retryAfterSec });
    }

    // Get the current name for this device (snapshot it into the score row)
    const { data: prof, error: profErr } = await supabase
      .from('profiles')
      .select('name')
      .eq('device_id', deviceId)
      .single();

    if (profErr || !prof) {
      return response(400, { error: 'Unknown device' });
    }

    const insert = {
      device_id: deviceId,
      name: prof.name,
      score,
    };

    const { error } = await supabase.from('scores').insert(insert);
    if (error) {
      return response(500, { error: error.message });
    }

    return response(200, { ok: true });
  } catch (e) {
    return response(500, { error: e.message || 'Internal Server Error' });
  }
};
