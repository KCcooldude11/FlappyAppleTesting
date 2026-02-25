import * as C from '../constants.js';

export function isValidName(s) {
  if (typeof s !== 'string') return false;
  s = s.trim();
  if (s.length < C.NAMES.MIN_LEN || s.length > C.NAMES.MAX_LEN) return false;
  if (C.NAMES.RESERVED.includes(s.toLowerCase())) return false;
  return true;
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}

export function formatScore(score) {
  return String(score);
}

export function getScoreBadgeDimensions(score) {
  const digits = String(score).length;
  let w = 28, h = 44;
  if (digits > 2) {
    const extra = (digits - 2) * 10;
    w += extra;
    h += Math.round(extra * 1.2);
  }
  return { w, h };
}
