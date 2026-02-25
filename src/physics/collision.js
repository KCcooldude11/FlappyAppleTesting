import * as C from '../constants.js';

export function circleRectOverlap(cx, cy, cr, rx, ry, rw, rh) {
  const nx = Math.max(rx, Math.min(cx, rx + rw));
  const ny = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < cr * cr;
}

export function distanceSquared(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
}

export function checkBirdWorldBounds(bird, screenHeight) {
  return bird.y - bird.r <= 0 || bird.y + bird.r >= screenHeight;
}

export function checkPipeCollision(bird, pipe, pipeWidth, screenHeight, hitInsetX, capInsetY) {
  const topRect = {
    x: pipe.x + hitInsetX,
    y: 0,
    w: Math.max(0, pipeWidth - hitInsetX * 2),
    h: Math.max(0, pipe.topH - capInsetY),
  };

  const botRect = {
    x: pipe.x + hitInsetX,
    y: pipe.gapY + capInsetY,
    w: Math.max(0, pipeWidth - hitInsetX * 2),
    h: Math.max(0, screenHeight - (pipe.gapY + capInsetY)),
  };

  return (
    circleRectOverlap(bird.x, bird.y, bird.r, topRect.x, topRect.y, topRect.w, topRect.h) ||
    circleRectOverlap(bird.x, bird.y, bird.r, botRect.x, botRect.y, botRect.w, botRect.h)
  );
}
