import * as C from '../constants.js';
import * as mathUtil from '../utils/math.js';

export function createMedallion(x, y, size, special = false) {
  return {
    x,
    y,
    size,
    r: Math.round(size * C.MEDALS.MEDAL_RADIUS_RATIO),
    taken: false,
    type: special ? 'merrikh' : 'regular',
  };
}

export function nextMedalJump() {
  return 1; // TEST: spawn every column
}

export function spawnMedalForMerrikh(prevPipe, currentPipe, screenH, pipeGap, scale) {
  const mx = prevPipe
    ? Math.round((prevPipe.x + currentPipe.x) / 2)
    : Math.round(currentPipe.x - (C.PHYSICS.PIPE_WIDTH * scale) * 0.4);

  const gapTop = currentPipe.topH;
  const gapBot = currentPipe.gapY;
  const safeMargin = Math.round(C.MEDALS.SAFE_MARGIN_RATIO * pipeGap);
  const minY = gapTop + safeMargin;
  const maxY = gapBot - safeMargin;
  const centerY = (minY + maxY) / 2;
  const jitter = (Math.random() * C.MEDALS.MERRIKH_JITTER_RATIO - C.MEDALS.MERRIKH_JITTER_RATIO / 2) * (maxY - minY);
  const my = Math.round(Math.max(minY, Math.min(maxY, centerY + jitter)));

  const size = Math.max(72, Math.round(32 * scale));
  return createMedallion(mx, my, size, true);
}

export function spawnRegularMedal(prevPipe, currentPipe, screenH, pipeGap, scale) {
  const mx = Math.round((prevPipe.x + currentPipe.x) / 2);
  const gapTop = prevPipe.topH;
  const gapBot = prevPipe.gapY;
  const safeMargin = Math.round(C.MEDALS.SAFE_MARGIN_RATIO * pipeGap);
  const minY = gapTop + safeMargin;
  const maxY = gapBot - safeMargin;
  const centerY = (minY + maxY) / 2;
  const jitter = (Math.random() * C.MEDALS.JITTER_RATIO - C.MEDALS.JITTER_RATIO / 2) * (maxY - minY);
  const my = Math.round(centerY + jitter);

  const size = Math.max(C.MEDALS.MEDAL_SIZE_MIN, Math.round(C.MEDALS.MEDAL_SIZE_BASE * scale));
  return createMedallion(mx, my, size, false);
}
