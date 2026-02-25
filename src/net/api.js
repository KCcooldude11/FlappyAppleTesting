import * as C from '../constants.js';

function fetchWithTimeout(url, options = {}, ms = C.URLS.FETCH_TIMEOUT_MS) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...options, signal: ctrl.signal }).finally(() => clearTimeout(id));
}

export async function registerIdentity(deviceId, name) {
  try {
    await fetch(C.URLS.REGISTER_IDENTITY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, name }),
    });
  } catch (e) {
    console.warn('registerIdentity error:', e);
  }
}

export async function postScore(deviceId, score, playMs) {
  try {
    const res = await fetch(C.URLS.SUBMIT_SCORE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, score, playMs }),
    });
    return await res.json();
  } catch (e) {
    return { error: e.message };
  }
}

export async function getLeaderboard(limit = 10) {
  try {
    const res = await fetch(`${C.URLS.GET_LEADERBOARD}?limit=${limit}`);
    const data = await res.json();
    return data.scores || [];
  } catch (e) {
    console.warn('getLeaderboard error:', e);
    return [];
  }
}

export async function getMyRank(deviceId) {
  try {
    const res = await fetch(`${C.URLS.GET_MY_RANK}?deviceId=${encodeURIComponent(deviceId)}`);
    return await res.json();
  } catch (e) {
    console.warn('getMyRank error:', e);
    return null;
  }
}
