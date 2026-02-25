import * as C from '../constants.js';
import * as renderer from './index.js';
import * as bg from '../entities/background.js';
import * as pipe from '../entities/pipe.js';

export function drawSpireSegmented(x, y, w, h, theme, orientation = 'up') {
  const ctx = renderer.getContext();
  const imgTile = bg.getSpireSet(theme).tile;
  const imgCap = bg.getSpireSet(theme).cap;
  const ready = bg.getSpireReady(theme);

  if (orientation === 'up') {
    drawStackUp(imgTile, imgCap, ready, x, y, w, h, 0);
  } else {
    ctx.save();
    ctx.translate(x + w, y + h);
    ctx.scale(-1, -1);
    drawStackUp(imgTile, imgCap, ready, 0, 0, w, h, C.SPIRE.TOP_CAP_NUDGE);
    ctx.restore();
  }
}

function drawStackUp(imgTile, imgCap, ready, x, y, w, h, capNudgeY = 0) {
  const ctx = renderer.getContext();
  const { tileH, capH, sx } = pipe.getScaledSpireHeights(imgTile, imgCap, w);

  if (!ready.tile || tileH <= 0 || w <= 0 || h <= 0) return;

  const drawW = imgTile.width * sx;
  const capY = y + capNudgeY;

  const pad = Math.max(2, Math.ceil(C.CANVAS.DPR));
  const clipTop = Math.min(y, capY);
  const clipBottom = Math.max(y + h, capY + (ready.cap ? capH : 0));
  const clipX = Math.floor(x) - pad;
  const clipY = Math.floor(clipTop) - pad;
  const clipW = Math.ceil(w) + pad * 2;
  const clipH = Math.ceil(clipBottom - clipTop) + pad * 2;

  ctx.save();
  ctx.beginPath();
  ctx.rect(clipX, clipY, clipW, clipH);
  ctx.clip();
  ctx.imageSmoothingEnabled = false;

  let cursorY = y + h - tileH;
  const limit = capY + (ready.cap ? capH : 0) - C.SPIRE.TILE_OVERLAP;

  while (cursorY + tileH > limit) {
    ctx.drawImage(imgTile, x, cursorY, drawW, tileH);
    cursorY -= tileH - C.SPIRE.TILE_OVERLAP;
  }

  if (ready.cap) ctx.drawImage(imgCap, x, capY, drawW, capH);
  ctx.restore();
}

export function drawAllPipes(pipes, theme, screenHeight) {
  const pipeWidth = Math.round(C.PHYSICS.PIPE_WIDTH * renderer.getScale());

  for (let p of pipes) {
    drawSpireSegmented(p.x, 0, pipeWidth, p.topH, theme, 'down');
    drawSpireSegmented(p.x, p.gapY, pipeWidth, screenHeight - p.gapY, theme, 'up');
  }
}
