import * as C from '../constants.js';
import * as renderer from './index.js';
import * as skin from '../systems/skin-manager.js';
import { glitchBirdImage } from './bird-glitch.js';

export function getBirdDrawSize(skinIndex) {
  const s = renderer.getScale();
  const baseH = C.PHYSICS.BIRD_BASE_H * s * skin.getSkinScale(skinIndex);
  const { idle, flap } = skin.getSkinImages(skinIndex);
  const img = idle || flap;
  const aspect = img && img.width && img.height ? img.width / img.height : 1;
  return { w: Math.round(baseH * aspect), h: Math.round(baseH) };
}

  const ctx = ctxOverride || renderer.getContext();
  const { idle, flap } = skin.getSkinImages(skinIndex);
  const img = isFlapTiming ? flap : idle;
  if (!img || !img.width || !img.height) return;
  const { w: birdW, h: birdH } = getBirdDrawSize(skinIndex);
  // Theme 11: glitch effect
  let drawImg = img;
  if (window?.state?.gameState?.theme === 11) {
    drawImg = glitchBirdImage(img, birdW, birdH, { bands: 6, maxOffset: 8, rgb: true });
  }
  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate(bird.rot * C.BIRD.ROTATION_FACTOR);
  ctx.drawImage(drawImg, -birdW / 2, -birdH / 2, birdW, birdH);
  ctx.restore();
}
