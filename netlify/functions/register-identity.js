const { supabase } = require('./_utils/supabase');
const {
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
} = require('./_utils/security');

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
    const byIp = enforceRateLimit(`register-identity:ip:${ip}`, 20, 60 * 1000);
    if (!byIp.allowed) {
      return response(429, { error: 'Too many identity updates', retryAfterSec: byIp.retryAfterSec });
    }

    const body = parseJsonBody(event);
    if (!body) {
      return response(400, { error: 'Invalid JSON payload' });
    }

    const { deviceId, name } = body;
    const cleanName = normalizeName(name);

    if (!isValidDeviceId(deviceId) || !isValidName(cleanName)) {
      return response(400, { error: 'Invalid deviceId or name' });
    }

    const byDevice = enforceRateLimit(`register-identity:device:${deviceId}`, 8, 60 * 1000);
    if (!byDevice.allowed) {
      return response(429, { error: 'Too many identity updates for this device', retryAfterSec: byDevice.retryAfterSec });
    }

    const { error } = await supabase
      .from('profiles')
      .upsert(
        { device_id: deviceId, name: cleanName },
        { onConflict: 'device_id' }
      );

    if (error) {
      return response(500, { error: error.message });
    }

    return response(200, { ok: true });
  } catch (e) {
    return response(500, { error: e.message || 'Internal Server Error' });
  }
};
