import * as C from '../constants.js';
import * as renderer from './index.js';
import * as skin from '../systems/skin-manager.js';

export function getBirdDrawSize(skinIndex) {
  const baseH = C.PHYSICS.BIRD_BASE_H * skin.getSkinScale(skinIndex);
  const { idle, flap } = skin.getSkinImages(skinIndex);
  const img = idle || flap;
  const aspect = img && img.width && img.height ? img.width / img.height : 1;
  return { w: Math.round(baseH * aspect), h: Math.round(baseH) };
}

export function drawBird(bird, skinIndex, isFlapTiming) {
  const ctx = renderer.getContext();
  const { idle, flap } = skin.getSkinImages(skinIndex);
  const img = isFlapTiming ? flap : idle;

  if (!img || !img.width || !img.height) return;

  const { w: birdW, h: birdH } = getBirdDrawSize(skinIndex);

  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate(bird.rot * C.BIRD.ROTATION_FACTOR);
  ctx.drawImage(img, -birdW / 2, -birdH / 2, birdW, birdH);
  ctx.restore();
}
