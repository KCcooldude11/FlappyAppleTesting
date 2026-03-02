const { supabase } = require('./_utils/supabase');
const {
  cleanupOldBuckets,
  enforceRateLimit,
  getClientIp,
  handlePreflight,
  requireMethod,
  response,
} = require('./_utils/security');

exports.handler = async (event) => {
  try {
    cleanupOldBuckets();

    const preflight = handlePreflight(event);
    if (preflight) return preflight;

    const methodError = requireMethod(event, ['GET']);
    if (methodError) {
      return methodError;
    }

    const ip = getClientIp(event);
    const byIp = enforceRateLimit(`get-leaderboard:ip:${ip}`, 90, 60 * 1000);
    if (!byIp.allowed) {
      return response(429, { error: 'Too many leaderboard requests', retryAfterSec: byIp.retryAfterSec });
    }

    const url = new URL(event.rawUrl || `http://x${event.path}`);
    const requested = Number(url.searchParams.get('limit') || 10);
    const limit = Math.max(1, Math.min(25, Number.isFinite(requested) ? requested : 10));

    const { data, error } = await supabase
      .from('scores')
      .select('device_id, name, score, created_at')
      .order('score', { ascending: false })
      .order('created_at', { ascending: true }) // ties: first achieved wins
      .limit(limit);

    if (error) {
      return response(500, { error: error.message });
    }

    return response(200, { scores: data || [] });
  } catch (e) {
    return response(500, { error: e.message || 'Internal Server Error' });
  }
};
