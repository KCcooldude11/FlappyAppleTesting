import * as C from '../constants.js';
import * as renderer from './index.js';
import * as state from '../state.js';
import * as skin from '../systems/skin-manager.js';
import { glitchBirdImage } from './bird-glitch.js';

let cachedGlitch = null;
let glitchTimer = 0;
let glitchBurst = false;

export function getBirdDrawSize(skinIndex) {
  const s = renderer.getScale();
  const baseH = C.PHYSICS.BIRD_BASE_H * s * skin.getSkinScale(skinIndex);
  const { idle, flap } = skin.getSkinImages(skinIndex);
  const img = idle || flap;
  const aspect = img && img.width && img.height ? img.width / img.height : 1;

  return { w: Math.round(baseH * aspect), h: Math.round(baseH) };
}

export function drawBird(bird, skinIndex, isFlapTiming, ctxOverride) {
  const ctx = ctxOverride || renderer.getContext();

  const { idle, flap } = skin.getSkinImages(skinIndex);
  const img = isFlapTiming ? flap : idle;
  if (!img || !img.width || !img.height) return;

  const { w: birdW, h: birdH } = getBirdDrawSize(skinIndex);

  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate(bird.rot * C.BIRD.ROTATION_FACTOR);

  let drawImg = img;

  if (state.gameState.theme === 11) {

  glitchTimer -= 1 / 60;

  if (glitchTimer <= 0) {

    if (!glitchBurst) {
      // start glitch burst
      glitchBurst = true;
      glitchTimer = 0.6 + Math.random() * 0.6; // burst lasts 0.6–1.2s
    } else {
      // return to calm
      glitchBurst = false;
      cachedGlitch = null;
      glitchTimer = 2.5 + Math.random() * 3.5; // calm for ~2.5–6s
    }
  }

  if (glitchBurst) {

    // only generate a new glitch sometimes during the burst
    if (!cachedGlitch || Math.random() < 0.35) {

      const bigGlitch = Math.random() < 0.22;

      const bands = bigGlitch
        ? 8 + Math.floor(Math.random() * 8)     // bigger corruption
        : 3 + Math.floor(Math.random() * 5);

      const maxOffset = bigGlitch
        ? 12 + Math.random() * 16
        : 2 + Math.random() * 8;

      const rgb = Math.random() < 0.45;

      cachedGlitch = glitchBirdImage(img, birdW, birdH, {
        bands,
        maxOffset,
        rgb,
        glitchChance: 1
      });
    }

    drawImg = cachedGlitch;
  }

} else {
  cachedGlitch = null;
  glitchBurst = false;
}


  ctx.drawImage(drawImg, -birdW / 2, -birdH / 2, birdW, birdH);

  ctx.restore();
}
