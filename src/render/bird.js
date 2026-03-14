
import * as C from '../constants.js';
import * as renderer from './index.js';
import * as state from '../state.js';
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
  ctx.drawImage(img, -birdW / 2, -birdH / 2, birdW, birdH);

  // Theme 11: glitch overlay
  if (state.gameState.theme === 11) {
    const bands = 4 + Math.floor(Math.random() * 2); // 4–5 glitch slices
    const maxOffset = 4 + Math.floor(Math.random() * 2); // small horizontal shift
    const rgb = Math.random() < 0.3; // occasional RGB split
    const glitched = glitchBirdImage(img, birdW, birdH, {
      bands,
      maxOffset,
      rgb,
      glitchChance: 0.7 // much more likely to glitch, matches demo
    });
    // Draw glitch slices on top of the original bird
    ctx.drawImage(glitched, -birdW / 2, -birdH / 2, birdW, birdH);
  }

  ctx.restore();
}
