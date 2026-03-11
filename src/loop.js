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
const sceneSurface = {
  canvas: null,
  ctx: null,
  w: 0,
  h: 0,
  dpr: 0,
};

function ensureSceneSurface(vw, vh) {
  const dpr = renderer.DPR || 1;
  const needRebuild =
    !sceneSurface.canvas ||
    !sceneSurface.ctx ||
    sceneSurface.w !== vw ||
    sceneSurface.h !== vh ||
    sceneSurface.dpr !== dpr;

  if (!needRebuild) return sceneSurface;

  sceneSurface.canvas = document.createElement('canvas');
  sceneSurface.canvas.width = Math.max(1, Math.round(vw * dpr));
  sceneSurface.canvas.height = Math.max(1, Math.round(vh * dpr));
  sceneSurface.ctx = sceneSurface.canvas.getContext('2d');
  sceneSurface.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  sceneSurface.w = vw;
  sceneSurface.h = vh;
  sceneSurface.dpr = dpr;

  return sceneSurface;
}

function drawCompositedScene(outputCtx, sceneCanvas, vw, vh, invertAlpha) {
  if (invertAlpha <= 0) {
    outputCtx.drawImage(sceneCanvas, 0, 0, vw, vh);
    return;
  }

  if (invertAlpha >= 1) {
    outputCtx.save();
    outputCtx.filter = 'invert(1)';
    outputCtx.drawImage(sceneCanvas, 0, 0, vw, vh);
    outputCtx.restore();
    return;
  }

  outputCtx.save();
  outputCtx.globalAlpha = 1 - invertAlpha;
  outputCtx.drawImage(sceneCanvas, 0, 0, vw, vh);
  outputCtx.restore();

  outputCtx.save();
  outputCtx.globalAlpha = invertAlpha;
  outputCtx.filter = 'invert(1)';
  outputCtx.drawImage(sceneCanvas, 0, 0, vw, vh);
  outputCtx.restore();
}

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
  let bgReady = {
    2: bgEntity.backgroundReady[2],
    3: bgEntity.backgroundReady[3],
    4: bgEntity.backgroundReady[4],
    5: bgEntity.backgroundReady[5],
  };
  // Debug: force bgReady for selected themes and stub backgrounds if missing
  if (C.DEBUG.FORCE_BG_READY && Array.isArray(C.DEBUG.FORCE_BG_READY)) {
    for (const tid of C.DEBUG.FORCE_BG_READY) {
      bgReady[tid] = true;
      // If background object is missing, create a stub to prevent crashes
      if (!bgEntity.backgrounds) bgEntity.backgrounds = {};
      if (!bgEntity.backgrounds[tid]) {
        // Create a minimal stub with a dummy canvas
        const dummyCanvas = document.createElement('canvas');
        dummyCanvas.width = 32;
        dummyCanvas.height = 32;
        const ctx = dummyCanvas.getContext('2d');
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, 32, 32);
        bgEntity.backgrounds[tid] = { canvas: dummyCanvas, w: 32, h: 32 };
      }
    }
  }

  const themeTransition = themeSys.shouldTransitionTheme(state.gameState.theme, state.gameState.score, bgReady);
  if (themeTransition) {
    // If a transition is in progress, immediately complete it
    if (state.gameState.themeTransition) {
      state.gameState.theme = state.gameState.themeTransition.to;
      state.gameState.themeTransition = null;
      bgRender.invalidateBgCache();
    }
    // Start the new transition
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
  const outputCtx = renderer.getBaseContext();
  const vw = renderer.getCanvasWidth();
  const vh = renderer.getCanvasHeight();
  const temporaryInvertEnabled =
    C.VISUAL.TEMP_INVERT_THEME.ENABLED &&
    state.gameState.mode === 'playing' &&
    state.gameState.score >= C.VISUAL.TEMP_INVERT_THEME.ACTIVATE_AT_SCORE;
  const themeInvertAlpha =
    state.gameState.mode === 'playing'
      ? themeSys.getInvertThemeAlpha(state.gameState.theme, state.gameState.themeTransition, state.gameState.frameNow)
      : 0;
  // Apply special filter for themes 4 and 5, invert for 6
  let filterType = null;
  if (state.gameState.theme === C.THEME.INVERT_THEME2_ID) filterType = 'sepia';
  else if (state.gameState.theme === C.THEME.INVERT_THEME3_ID) filterType = 'dream';
  else if (state.gameState.theme === C.THEME.INVERT_THEME1_ID) filterType = 'invert';
  const invertAlpha = Math.max(themeInvertAlpha, temporaryInvertEnabled ? 1 : 0, filterType ? 1 : 0);
  const scene = ensureSceneSurface(vw, vh);
  const sceneCtx = scene.ctx;

  renderer.startFrame();
  sceneCtx.clearRect(0, 0, vw, vh);
  renderer.setActiveContext(sceneCtx);

  try {
    // Background
    bgRender.drawBackground(state.gameState.theme, state.gameState.themeTransition, state.gameState.frameNow);

    // Water particles (Theme 2)
    if (themeSys.getTheme2Alpha(state.gameState.theme, state.gameState.themeTransition, state.gameState.frameNow) > 0) {
      sceneCtx.save();
      particlesRender.drawParticles(
        state.gameState.waterParticles.particles,
        themeSys.getTheme2Alpha(state.gameState.theme, state.gameState.themeTransition, state.gameState.frameNow)
      );
      sceneCtx.restore();
    }

    // Theme 3: medallion rain effect at 1000+
    if (
      state.gameState.theme === 3 &&
      state.gameState.medallionRain.active &&
      state.gameState.score >= C.THEME.MEDALLION_RAIN_EFFECT_SCORE
    ) {
      import('./render/medallion-rain.js').then(rainMod => {
        rainMod.drawMedallionRain(state.gameState.medallionRain.particles, 1);
      });
    } else if (themeSys.getTheme3Alpha(state.gameState.theme, state.gameState.themeTransition, state.gameState.frameNow) > 0) {
      sceneCtx.save();
      particlesRender.drawTheme3Motes(
        state.gameState.theme3Motes.particles,
        themeSys.getTheme3Alpha(state.gameState.theme, state.gameState.themeTransition, state.gameState.frameNow)
      );
      sceneCtx.restore();
    }

    // Ready state shows overlay instead
    if (state.gameState.mode !== 'ready') {
      // Pipes
      spiresRender.drawAllPipes(state.gameState.pipes, state.gameState.theme, vh);

      // Medallions
      medallionsRender.drawMedallions(state.gameState.medallions);

      // Bird: always draw here for all themes
      birdRender.drawBird(
        state.gameState.bird,
        state.gameState.currentSkinIndex,
        state.gameState.bird.flapTimer > 0
      );
    }
  } finally {
    renderer.setActiveContext(null);
  }


  // Apply filter for special themes
  if (invertAlpha > 0 && filterType) {
    outputCtx.save();
    if (filterType === 'sepia') {
      outputCtx.filter = 'sepia(0.8)';
    } else if (filterType === 'dream') {
      outputCtx.filter = 'hue-rotate(90deg) saturate(1.5) brightness(1.2)';
    } else if (filterType === 'invert') {
      outputCtx.filter = 'invert(1)';
    }
    outputCtx.drawImage(scene.canvas, 0, 0, vw, vh);
    outputCtx.restore();
  } else {
    outputCtx.drawImage(scene.canvas, 0, 0, vw, vh);
  }

  // ...existing code...

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
