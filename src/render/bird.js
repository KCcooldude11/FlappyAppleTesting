
import * as C from '../constants.js';
import * as renderer from './index.js';
import * as state from '../state.js';
import * as skin from '../systems/skin-manager.js';
import { glitchBirdImage } from './bird-glitch.js';

let cachedGlitch = null;
let glitchTimer = 0;


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

  // Always draw the normal bird first
  let drawImg = img;

  if (state.gameState.theme === 11) {

    // countdown timer
    glitchTimer -= 1 / 60;

    // generate a new glitch occasionally
    if (glitchTimer <= 0) {
      cachedGlitch = glitchBirdImage(img, birdW, birdH, {
        bands: 5,
        maxOffset: 6,
        rgb: Math.random() < 0.4,
        glitchChance: 1
      });

      // hold this glitch for ~80ms
      glitchTimer = 0.08;
    }

    drawImg = cachedGlitch || img;
  } else {
    cachedGlitch = null;
  }

  ctx.drawImage(drawImg, -birdW / 2, -birdH / 2, birdW, birdH);


  ctx.restore();
}
