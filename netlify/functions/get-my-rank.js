const { supabase } = require('./_utils/supabase');
const {
  cleanupOldBuckets,
  enforceRateLimit,
  getClientIp,
  handlePreflight,
  isValidDeviceId,
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
    const byIp = enforceRateLimit(`get-my-rank:ip:${ip}`, 90, 60 * 1000);
    if (!byIp.allowed) {
      return response(429, { error: 'Too many rank requests', retryAfterSec: byIp.retryAfterSec });
    }

    const url = new URL(event.rawUrl || `http://x${event.path}`);
    const deviceId = url.searchParams.get('deviceId');

    if (!isValidDeviceId(deviceId || '')) {
      return response(400, { error: 'Valid deviceId is required' });
    }

    // 1) Get this player’s best
    const { data: me, error: meErr } = await supabase
      .from('player_best_scores')
      .select('name, best_score, first_achieved_at')
      .eq('device_id', deviceId)
      .single();

    if (meErr || !me) {
      return response(200, { hasScore: false });
    }

    // 2) Count how many players are ahead of me:
    // - higher best_score
    // - or same best_score but achieved earlier (tie-break)
    const { count: higherCount, error: higherErr } = await supabase
      .from('player_best_scores')
      .select('*', { count: 'exact', head: true })
      .gt('best_score', me.best_score);

    if (higherErr) {
      return response(500, { error: higherErr.message });
    }

    const { count: tieEarlierCount, error: tieErr } = await supabase
      .from('player_best_scores')
      .select('*', { count: 'exact', head: true })
      .eq('best_score', me.best_score)
      .lt('first_achieved_at', me.first_achieved_at);

    if (tieErr) {
      return response(500, { error: tieErr.message });
    }

    const { count: totalPlayers, error: totalErr } = await supabase
      .from('player_best_scores')
      .select('*', { count: 'exact', head: true });

    if (totalErr) {
      return response(500, { error: totalErr.message });
    }

    const rank = (higherCount || 0) + (tieEarlierCount || 0) + 1;

    return response(200, {
      hasScore: true,
      rank,
      totalPlayers: totalPlayers || 0,
      name: me.name,
      bestScore: me.best_score,
    });
  } catch (e) {
    return response(500, { error: e.message || 'Internal Server Error' });
  }
};
