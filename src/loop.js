import * as C from './constants.js';
import * as state from './state.js';
import * as renderer from './render/index.js';
import * as bgRender from './render/background.js';
import * as spiresRender from './render/spires.js';
import * as birdRender from './render/bird.js';
import * as particlesRender from './render/particles.js';
import * as medallionsRender from './render/medallions.js';
import * as themeSys from './systems/theme-manager.js';
import * as bgEntity from './entities/background.js';
import * as updateModule from './update.js';

let lastTime = 0;
let onGameOverCallback = null;
let onScoreUpdateCallback = null;
let lastDisplayedScore = 0;

export function gameLoop(t) {
  state.updateFrameTimestamp(t);

  if (lastTime === 0) lastTime = t;
  const dt = Math.min(0.033, (t - lastTime) / 1000 || 0);
  lastTime = t;

  // Update game state
  const collisionResult = updateModule.update(state.gameState, dt, renderer.getScale());

  // Update score display if changed
  if (state.gameState.score !== lastDisplayedScore && onScoreUpdateCallback) {
    onScoreUpdateCallback(state.gameState.score);
    lastDisplayedScore = state.gameState.score;
  }

  if (collisionResult) {
    // Game over
    if (onGameOverCallback) {
      onGameOverCallback();
    }
    return false; // Stop loop
  }

  // Check theme transitions
  const bgReady = {
    2: bgEntity.backgroundReady[2],
    3: bgEntity.backgroundReady[3],
  };

  const themeTransition = themeSys.shouldTransitionTheme(state.gameState.theme, state.gameState.score, bgReady);
  if (themeTransition && !state.gameState.themeTransition) {
    state.gameState.themeTransition = { ...themeTransition, start: t };
  }

  if (themeSys.isTransitionComplete(state.gameState.themeTransition, t)) {
    state.gameState.theme = state.gameState.themeTransition.to;
    state.gameState.themeTransition = null;
    bgRender.invalidateBgCache();
  }

  // Draw
  render();

  // Continue loop
  if (state.gameState.mode === 'playing') {
    requestAnimationFrame(gameLoop);
  }

  return true;
}

export function render() {
  const ctx = renderer.getContext();
  const vw = renderer.getCanvasWidth();
  const vh = renderer.getCanvasHeight();

  renderer.startFrame();

  // Background
  bgRender.drawBackground(state.gameState.theme, state.gameState.themeTransition, state.gameState.frameNow);

  // Water particles (Theme 2)
  if (themeSys.getTheme2Alpha(state.gameState.theme, state.gameState.themeTransition, state.gameState.frameNow) > 0) {
    ctx.save();
    ctx.filter = 'none';
    particlesRender.drawParticles(
      state.gameState.waterParticles.particles,
      themeSys.getTheme2Alpha(state.gameState.theme, state.gameState.themeTransition, state.gameState.frameNow)
    );
    ctx.restore();
  }

  // Ready state shows overlay instead
  if (state.gameState.mode === 'ready') {
    return;
  }

  // Pipes
  spiresRender.drawAllPipes(state.gameState.pipes, state.gameState.theme, vh);

  // Medallions
  medallionsRender.drawMedallions(state.gameState.medallions);

  // Bird
  birdRender.drawBird(
    state.gameState.bird,
    state.gameState.currentSkinIndex,
    state.gameState.bird.flapTimer > 0
  );

  renderer.endFrame();
}

export function start(onGameOver, onScoreUpdate) {
  onGameOverCallback = onGameOver;
  onScoreUpdateCallback = onScoreUpdate;
  lastDisplayedScore = 0;
  renderer.startFrame();
  render();
  lastTime = 0;
  requestAnimationFrame(gameLoop);
}
