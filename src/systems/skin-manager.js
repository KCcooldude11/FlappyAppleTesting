import * as C from '../constants.js';
import * as cfg from '../config.js';

export function canUseSkin(index, merrikhUnlockedThisRun) {
  if (index === cfg.SKIN_INDICES.MERRIKH && !merrikhUnlockedThisRun) return false;
  return cfg.isSkinReady(index);
}

export function switchToSkin(gameState, index, birdRadiusRatio) {
  if (!canUseSkin(index, gameState.merrikhUnlockedThisRun)) return false;

  gameState.currentSkinIndex = index;
  const scale = cfg.getSkinScale(index);
  gameState.bird.r = Math.round(C.PHYSICS.BIRD_BASE_H * scale * birdRadiusRatio);
  return true;
}

export function advanceSkinOneStep(gameState, birdRadiusRatio) {
  const next = gameState.currentSkinIndex + 1;

  if (next >= cfg.SKINS.length) return false;
  if (!canUseSkin(next, gameState.merrikhUnlockedThisRun)) return false;

  return switchToSkin(gameState, next, birdRadiusRatio);
}

export function getSkinImages(index) {
  const skin = cfg.getSkinById(index);
  if (!skin) return { idle: null, flap: null };
  return { idle: skin.idleImg, flap: skin.flapImg };
}

export function getSkinScale(index) {
  return cfg.getSkinScale(index);
}
