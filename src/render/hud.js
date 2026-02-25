import * as C from '../constants.js';
import * as fmt from '../utils/formatters.js';

export function setupScoreBadgeElement() {
  const scoreEl = document.getElementById('score');
  if (!scoreEl) return null;

  let t = scoreEl.querySelector('.txt');
  if (!t) {
    t = document.createElement('span');
    t.className = 'txt';
    t.textContent = scoreEl.textContent || '0';
    scoreEl.textContent = '';
    scoreEl.appendChild(t);
  }
  return t;
}

export function updateScoreBadge(scoreEl, scoreTextEl, score) {
  if (scoreTextEl) {
    scoreTextEl.textContent = String(score);
  }

  const { w, h } = fmt.getScoreBadgeDimensions(score);
  if (scoreEl) {
    scoreEl.style.setProperty('--w', `${w}px`);
    scoreEl.style.setProperty('--h', `${h}px`);
  }
}

export function updateBestBadge(bestEl, bestScore) {
  if (bestEl) {
    bestEl.textContent = 'Best: ' + bestScore;
  }
}
