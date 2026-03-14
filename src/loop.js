import { LightningEffect } from './render/lightning.js';
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
import * as rainMod from './render/medallion-rain.js';


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
    8: bgEntity.backgroundReady[8],
    9: bgEntity.backgroundReady[9],
    10: bgEntity.backgroundReady[10],
    11: bgEntity.backgroundReady[11],
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

  // Only allow one theme transition at a time
  if (!state.gameState.themeTransition) {
    const themeTransition = themeSys.shouldTransitionTheme(state.gameState.theme, state.gameState.score, bgReady);
    if (themeTransition) {
      console.debug('[ThemeTransition] Triggered:', {
        score: state.gameState.score,
        currentTheme: state.gameState.theme,
        transition: themeTransition
      });
      state.gameState.themeTransition = { ...themeTransition, start: t };
    }
  } else if (themeSys.isTransitionComplete(state.gameState.themeTransition, t)) {
    console.debug('[ThemeTransition] Completed:', {
      score: state.gameState.score,
      from: state.gameState.theme,
      to: state.gameState.themeTransition.to
    });
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
  // Treat 8, 9, 10 as clones of 1, 2, 3 for filterType
  let themeForFilter = state.gameState.theme;
  if (themeForFilter === 8) themeForFilter = 1;
  if (themeForFilter === 9) themeForFilter = 2;
  if (themeForFilter === 10) themeForFilter = 3;
  if (themeForFilter === C.THEME.INVERT_THEME2_ID) filterType = 'sepia';
  else if (themeForFilter === C.THEME.INVERT_THEME3_ID) filterType = 'dream';
  else if (themeForFilter === C.THEME.INVERT_THEME1_ID) filterType = 'invert';
  const invertAlpha = Math.max(themeInvertAlpha, temporaryInvertEnabled ? 1 : 0, filterType ? 1 : 0);
  const scene = ensureSceneSurface(vw, vh);
  const sceneCtx = scene.ctx;

  renderer.startFrame();
  sceneCtx.clearRect(0, 0, vw, vh);
  renderer.setActiveContext(sceneCtx);

  try {
    // Background
    bgRender.drawBackground(state.gameState.theme, state.gameState.themeTransition, state.gameState.frameNow);

    // --- Theme 3, 5, 10: Lightning overlay (draw behind spires) ---
    if (state.gameState.theme === 3 || state.gameState.theme === 5 || state.gameState.theme === 10) {
      if (!window._theme3Lightning) {
        window._theme3Lightning = {
          effect: new LightningEffect(),
          canvas: document.createElement('canvas'),
          ctx: null,
          lastW: 0,
          lastH: 0
        };
      }
      const lightning = window._theme3Lightning;
      if (lightning.lastW !== vw || lightning.lastH !== vh) {
        lightning.canvas.width = vw;
        lightning.canvas.height = vh;
        lightning.ctx = lightning.canvas.getContext('2d');
        lightning.lastW = vw;
        lightning.lastH = vh;
      }
      // Animate and draw lightning, with red color for theme 5
      if (state.gameState.theme === 5) {
        lightning.effect.animate(lightning.ctx, vw, vh, { color: 'red' });
      } else {
        lightning.effect.animate(lightning.ctx, vw, vh);
      }
      sceneCtx.drawImage(lightning.canvas, 0, 0, vw, vh);
    }

    // Water particles (Theme 2 and 9)
    let themeForParticles = state.gameState.theme === 9 ? 2 : state.gameState.theme;
    if (themeSys.getTheme2Alpha(themeForParticles, state.gameState.themeTransition, state.gameState.frameNow) > 0) {
      sceneCtx.save();
      particlesRender.drawParticles(
        state.gameState.waterParticles.particles,
        themeSys.getTheme2Alpha(themeForParticles, state.gameState.themeTransition, state.gameState.frameNow)
      );
      sceneCtx.restore();
    }

    // Theme 3, 5, 10: rain motes (old system)
    if (state.gameState.theme === 3 || state.gameState.theme === 5 || state.gameState.theme === 10) {
      sceneCtx.save();
      particlesRender.drawTheme3Motes(
        state.gameState.theme3Motes.particles,
        1
      );
      sceneCtx.restore();
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

  // Theme 11: CRT/VCR effect overlay
  if (state.gameState.theme === 11) {
    const ctx = renderer.getBaseContext();
    // 1. Apply clean CRT filter with RGB phosphor separation
    ctx.save();
    ctx.globalAlpha = 1.0;
    ctx.filter = 'contrast(1.2) brightness(1.1) saturate(1.25) blur(0.7px) drop-shadow(-1px 0 red) drop-shadow(1px 0 cyan)';
    ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform
    // slight curvature illusion
    ctx.transform(1.02, 0, 0, 1.02, vw * -0.01, vh * -0.01);
    ctx.drawImage(scene.canvas, 0, 0, vw, vh);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.filter = 'none';
    ctx.restore();

    // 2. Overlay scanlines
    ctx.save();
    ctx.globalAlpha = 0.22;
    for (let y = 0; y < vh; y += 3) {
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(0, y + 2, vw, 1);
    }
    ctx.restore();

    // 3. Overlay vignette / tube edges
    ctx.save();
    const grad = ctx.createRadialGradient(vw/2, vh/2, Math.min(vw, vh)*0.55, vw/2, vh/2, Math.max(vw, vh)*0.98);
    grad.addColorStop(0.55, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, vw, vh);
    ctx.restore();
  }

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
