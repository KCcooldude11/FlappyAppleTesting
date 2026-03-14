import * as C from '../constants.js';
import * as renderer from './index.js';
import * as bg from '../entities/background.js';
import * as pipe from '../entities/pipe.js';
import * as state from '../state.js';
import { glitchBirdImage } from './bird-glitch.js';

// Glitch state for spires in theme 11 (per-pipe)
let spireGlitchState = {
  burst: false,
  timer: 0,
  pipeIndex: -1, // which pipe is glitching
  cachedTile: null,
  cachedCap: null
};
export function drawSpireSegmented(x, y, w, h, theme, orientation = 'up', glitch = false) {
  const ctx = renderer.getContext();
  const imgTile = bg.getSpireSet(theme).tile;
  const imgCap = bg.getSpireSet(theme).cap;
  const ready = bg.getSpireReady(theme);

  if (orientation === 'up') {
    drawStackUp(imgTile, imgCap, ready, x, y, w, h, 0, glitch);
  } else {
    ctx.save();
    ctx.translate(x + w, y + h);
    ctx.scale(-1, -1);
    drawStackUp(imgTile, imgCap, ready, 0, 0, w, h, C.SPIRE.TOP_CAP_NUDGE, glitch);
    ctx.restore();
  }
}

function drawStackUp(imgTile, imgCap, ready, x, y, w, h, capNudgeY = 0, glitch = false) {
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

  // Only use glitch if glitch param is true (for selected pipe)
  let useGlitch = glitch;
  // Use per-spire cached glitch images
  let cachedGlitchTile = glitch ? spireGlitchState.cachedTile : null;
  let cachedGlitchCap = glitch ? spireGlitchState.cachedCap : null;

  ctx.save();
  ctx.beginPath();
  ctx.rect(clipX, clipY, clipW, clipH);
  ctx.clip();
  ctx.imageSmoothingEnabled = false;

  const limit = capY + (ready.cap ? capH : 0) - C.SPIRE.TILE_OVERLAP;

  const shaftTop = Math.max(y, limit);
  const shaftHeight = Math.max(0, y + h - shaftTop);
  if (shaftHeight > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(clipX, shaftTop, clipW, shaftHeight);
    ctx.clip();

    let cursorY = y + h - tileH;
    while (cursorY + tileH > limit) {
      let tileToDraw = imgTile;
      if (useGlitch) {
        if (!cachedGlitchTile || Math.random() < 0.18) {
          const bigGlitch = Math.random() < 0.18;
          const bands = bigGlitch ? 7 + Math.floor(Math.random() * 6) : 3 + Math.floor(Math.random() * 4);
          const maxOffset = bigGlitch ? 10 + Math.random() * 12 : 2 + Math.random() * 6;
          const rgb = Math.random() < 0.35;
          cachedGlitchTile = glitchBirdImage(imgTile, imgTile.width, imgTile.height, {
            bands,
            maxOffset,
            rgb,
            glitchChance: 1
          });
          if (glitch) spireGlitchState.cachedTile = cachedGlitchTile;
        }
        tileToDraw = cachedGlitchTile;
      }
      ctx.drawImage(tileToDraw, x, cursorY, drawW, tileH);
      cursorY -= tileH - C.SPIRE.TILE_OVERLAP;
    }

    ctx.restore();
  }

  let capToDraw = imgCap;
  if (useGlitch && ready.cap) {
    if (!cachedGlitchCap || Math.random() < 0.18) {
      const bigGlitch = Math.random() < 0.18;
      const bands = bigGlitch ? 7 + Math.floor(Math.random() * 6) : 3 + Math.floor(Math.random() * 4);
      const maxOffset = bigGlitch ? 10 + Math.random() * 12 : 2 + Math.random() * 6;
      const rgb = Math.random() < 0.35;
      cachedGlitchCap = glitchBirdImage(imgCap, imgCap.width, imgCap.height, {
        bands,
        maxOffset,
        rgb,
        glitchChance: 1
      });
      if (glitch) spireGlitchState.cachedCap = cachedGlitchCap;
    }
    capToDraw = cachedGlitchCap;
  }
  if (ready.cap) ctx.drawImage(capToDraw, x, capY, drawW, capH);
  ctx.restore();
}

export function drawAllPipes(pipes, theme, screenHeight) {
  const pipeWidth = Math.round(C.PHYSICS.PIPE_WIDTH * renderer.getScale());

  // Theme 11: manage glitch burst for only one visible spire at a time
  if (state.gameState.theme === 11) {
    // Find visible pipes (in view)
    const vw = renderer.getCanvasWidth();
    const visible = [];
    for (let i = 0; i < pipes.length; i++) {
      const p = pipes[i];
      if (p.x + pipeWidth > 0 && p.x < vw) visible.push(i);
    }
    // If no pipe is glitching or the current one is out of view, pick a new one
    if (
      spireGlitchState.pipeIndex === -1 ||
      !visible.includes(spireGlitchState.pipeIndex)
    ) {
      spireGlitchState.burst = false;
      spireGlitchState.cachedTile = null;
      spireGlitchState.cachedCap = null;
      spireGlitchState.pipeIndex = visible.length > 0 ? visible[Math.floor(Math.random() * visible.length)] : -1;
      spireGlitchState.timer = 2 + Math.random() * 4; // wait before next burst
    }
    spireGlitchState.timer -= 1 / 60;
    if (spireGlitchState.pipeIndex !== -1 && spireGlitchState.timer <= 0) {
      if (!spireGlitchState.burst) {
        spireGlitchState.burst = true;
        spireGlitchState.timer = 0.4 + Math.random() * 0.5; // burst lasts 0.4–0.9s
      } else {
        spireGlitchState.burst = false;
        spireGlitchState.cachedTile = null;
        spireGlitchState.cachedCap = null;
        spireGlitchState.pipeIndex = -1;
        spireGlitchState.timer = 2 + Math.random() * 4;
      }
    }
  } else {
    spireGlitchState.burst = false;
    spireGlitchState.pipeIndex = -1;
    spireGlitchState.cachedTile = null;
    spireGlitchState.cachedCap = null;
    spireGlitchState.timer = 0;
  }

  for (let i = 0; i < pipes.length; i++) {
    const p = pipes[i];
    // Only glitch the selected pipe in theme 11
    const glitch = state.gameState.theme === 11 && spireGlitchState.burst && spireGlitchState.pipeIndex === i;
    drawSpireSegmented(p.x, 0, pipeWidth, p.topH, theme, 'down', glitch);
    drawSpireSegmented(p.x, p.gapY, pipeWidth, screenHeight - p.gapY, theme, 'up', glitch);
  }
}
