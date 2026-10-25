import * as C from '../constants.js';
import * as fmt from '../utils/formatters.js';

export function setupScoreBadgeElement() {
  const scoreEl = document.getElementById('score');
  if (!scoreEl) return null;

  let t = scoreEl.querySelector('.txt');
  const valueEl = scoreEl.querySelector('.score-value');
  if (valueEl) {
    valueEl.classList.add('txt');
    return valueEl;
  }
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
    const valueEl = bestEl.querySelector('.best-value');
    if (valueEl) {
      valueEl.textContent = String(bestScore);
    } else {
      bestEl.textContent = 'Best: ' + bestScore;
    }
  }
}

export function updateBreathMeter(breath) {
  const meter = document.getElementById('breath-meter');
  if (!meter) return;
  const isUnderwater = C.UNDERWATER.THEMES.includes(breath.theme);
  meter.classList.toggle('hide', !isUnderwater);
  if (!isUnderwater) return;
  meter.setAttribute('aria-label', `Air bubbles remaining: ${breath.remaining} of ${breath.max}`);
  meter.innerHTML = Array.from({ length: breath.max }, (_, index) =>
    `<span class="breath-bubble${index < breath.remaining ? '' : ' empty'}" aria-hidden="true"></span>`
  ).join('');
}
