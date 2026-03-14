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
        // Start a burst after calm period
        glitchBurst = true;
        glitchTimer = 0.25 + Math.random() * 0.35; // burst lasts ~0.25–0.6s
      } else {
        // End burst and return to calm
        glitchBurst = false;
        cachedGlitch = null;
        glitchTimer = 2 + Math.random() * 3; // calm for 2–5 seconds
      }
    }

    if (glitchBurst) {

      const bigGlitch = Math.random() < 0.18;

      const bands = bigGlitch
        ? 8 + Math.floor(Math.random() * 6)
        : 3 + Math.floor(Math.random() * 4);

      const maxOffset = bigGlitch
        ? 10 + Math.random() * 12
        : 2 + Math.random() * 6;

      const rgb = Math.random() < 0.4;

      cachedGlitch = glitchBirdImage(img, birdW, birdH, {
        bands,
        maxOffset,
        rgb,
        glitchChance: 1
      });

      drawImg = cachedGlitch;
    }

  } else {
    cachedGlitch = null;
    glitchBurst = false;
  }

  ctx.drawImage(drawImg, -birdW / 2, -birdH / 2, birdW, birdH);

  ctx.restore();
}
