import * as C from './constants.js';
import * as cfg from './config.js';
import * as state from './state.js';
import * as loop from './loop.js';
import * as renderer from './render/index.js';
import * as bgRender from './render/background.js';
import * as hudRender from './render/hud.js';
import * as uiOverlays from './render/ui-overlays.js';
import * as input from './input/handler.js';
import * as api from './net/api.js';
import * as storage from './storage/local-storage.js';
import * as fmt from './utils/formatters.js';
import * as bgEntity from './entities/background.js';
import * as particlesRender from './render/particles.js';
import * as skinSys from './systems/skin-manager.js';
import * as dynPhysics from './physics/dynamics.js';

let scoreTextEl, bestEl;

async function initializeApp() {
  // Canvas setup
  renderer.initializeCanvas();
  renderer.onWindowResize(onCanvasResize);

  // Background images
  bgEntity.initializeBackgrounds();

  // UI elements
  scoreTextEl = hudRender.setupScoreBadgeElement();
  bestEl = document.getElementById('best');

  // Initialize score display
  hudRender.updateScoreBadge(document.getElementById('score'), scoreTextEl, state.gameState.score);
  hudRender.updateBestBadge(bestEl, state.gameState.best);

  // Load initial data
  const existingName = storage.getSavedName();
  if (existingName) {
    input.setNameInputValue(existingName);
    uiOverlays.updateGameOverUsername(existingName);
  }

  // Setup input handlers
  input.initializeInputHandlers(onFlapped, onStartClicked, onNameInputChanged);

  // Setup rename modal
  uiOverlays.setupRenameModal(onRenameSubmitted);
  uiOverlays.setupSupportLink();
  uiOverlays.setupShareButton();

  // UI overlay startup
  uiOverlays.showOverlay();
  uiOverlays.startHomeAppleAnimation();

  // Load leaderboard on startup
  await refreshLeaderboard();

  // Register identity if name is valid
  const deviceId = storage.ensureDeviceId();
  const validName = fmt.isValidName(existingName);
  if (validName) {
    await api.registerIdentity(deviceId, existingName);
  }

  // Water particles setup (Theme 2)
  onCanvasResize();

  // Update name button state
  onNameInputChanged();

  // Initialize game state to ready (sets data-state attribute for CSS styling)
  state.setGameMode('ready');
}

function onCanvasResize() {
  const vw = renderer.getCanvasWidth();
  const vh = renderer.getCanvasHeight();

  // Update water particles
  particlesRender.ensureParticleCount(state.gameState.waterParticles.particles, vw, vh);
  particlesRender.ensureTheme3MoteCount(state.gameState.theme3Motes.particles, vw, vh);

  // Reset bird position if not playing
  if (state.gameState.mode !== 'playing') {
    const birdX = Math.round(vw * C.BIRD.START_X_FRAC);
    const birdY = Math.round(vh / 2 - 80 * renderer.getScale());
    state.gameState.bird.x = birdX;
    state.gameState.bird.y = birdY;
  }

  bgRender.invalidateBgCache();
}

function onFlapped() {
  // Only flap if actively playing
  // Game start should only happen via the Play button (onStartClicked)
  if (state.gameState.mode === 'playing') {
    dynPhysics.flap(state.gameState.bird, C.PHYSICS.JUMP_VY * renderer.getScale());
  }
}

async function onStartClicked() {
  if (state.gameState.mode === 'playing') return;

  const name = input.getNameInputValue() || storage.getSavedName();
  if (!fmt.isValidName(name)) {
    input.setNameInputValue('');
    input.setPlayButtonDisabled(true);
    return;
  }

  await storage.setSavedName(name);
  startGame(name);
}

function onNameInputChanged() {
  const name = input.getNameInputValue();
  const isValid = fmt.isValidName(name);
  input.setPlayButtonDisabled(!isValid);
}

async function onRenameSubmitted(name) {
  storage.setSavedName(name);
  uiOverlays.updateGameOverUsername(name);

  const deviceId = storage.ensureDeviceId();
  await api.registerIdentity(deviceId, name);
}

function startGame(name) {
  const vw = renderer.getCanvasWidth();
  const vh = renderer.getCanvasHeight();
  const scale = renderer.getScale();

  const birdX = Math.round(vw * C.BIRD.START_X_FRAC);
  const birdY = Math.round(vh / 2 - 80 * scale);
  const birdRadius = Math.round(C.PHYSICS.BIRD_BASE_H * scale * C.PHYSICS.BIRD_RADIUS_RATIO * skinSys.getSkinScale(state.gameState.currentSkinIndex));

  state.resetGameState(birdX, birdY, birdRadius);
  state.setGameMode('playing');
  state.markRunStart(state.gameState.frameNow);

  uiOverlays.hideOverlay();
  uiOverlays.hideGameOver();

  // Reset skin to Apple at start
  const appleIdx = cfg.SKIN_INDICES.APPLE;
  if (appleIdx >= 0 && cfg.isSkinReady(appleIdx)) {
    skinSys.switchToSkin(state.gameState, appleIdx, C.PHYSICS.BIRD_RADIUS_RATIO);
  }

  const testStartCfg = C.DEBUG.TEST_START_NEAR_INVERT_ZONE;
  if (testStartCfg?.ENABLED) {
    state.gameState.score = Math.max(0, Number(testStartCfg.START_SCORE) || 0);
    state.gameState.columnsSpawned = Math.max(0, Number(testStartCfg.START_COLUMNS) || state.gameState.score);
    state.gameState.theme = Number(testStartCfg.START_THEME) || 3;
    state.gameState.themeTransition = null;
    state.gameState.nextMedalColumn = Math.max(
      state.gameState.columnsSpawned + 1,
      Number(testStartCfg.NEXT_MEDAL_COLUMN) || state.gameState.columnsSpawned + 1
    );

    if (testStartCfg.START_AS_MERRIKH) {
      state.gameState.merrikhUnlockedThisRun = true;
      state.gameState.skinLocked = false;
      skinSys.switchToSkin(state.gameState, cfg.SKIN_INDICES.MERRIKH, C.PHYSICS.BIRD_RADIUS_RATIO);
    }

    hudRender.updateScoreBadge(document.getElementById('score'), scoreTextEl, state.gameState.score);
  }

  loop.start(onGameOver, onScoreUpdate);
}

function onScoreUpdate(newScore) {
  hudRender.updateScoreBadge(document.getElementById('score'), scoreTextEl, newScore);
}

async function onGameOver() {
  state.setGameMode('gameover');

  const playMs = Math.round(state.gameState.frameNow - state.gameState.runStartTime);
  const score = state.gameState.score;
  const isDebugTestRun = Boolean(C.DEBUG?.TEST_START_NEAR_INVERT_ZONE?.ENABLED);

  // Update best (skip in debug test runs)
  if (!isDebugTestRun) {
    state.updateBestScore(score);
  }
  hudRender.updateBestBadge(bestEl, state.gameState.best);

  // Post score (skip in debug test runs)
  if (!isDebugTestRun) {
    const deviceId = storage.ensureDeviceId();
    const result = await api.postScore(deviceId, score, playMs);
    if (result?.error) {
      console.warn('submit-score error:', result.error);
    }
  } else {
    console.info('Debug test run: score submission and best-score update skipped.');
  }

  // Refresh leaderboard
  await refreshLeaderboard();

  // Update UI
  const name = storage.getSavedName() || 'Player';
  uiOverlays.updateGameOverUsername(name);
  uiOverlays.updateGameOverScore(score);

  // Show skin image
  const skin = cfg.getSkinById(state.gameState.currentSkinIndex);
  const useInvertedSkin = state.gameState.theme === C.THEME.INVERT_THEME_ID;
  let shareSkinSrc = '';
  if (skin?.flapReady && skin.flapImg.src) {
    uiOverlays.updateGameOverSkinImage(skin.flapImg.src, skin.name, { invertSkin: useInvertedSkin });
    shareSkinSrc = skin.flapImg.src;
  } else {
    uiOverlays.updateGameOverSkinImage('');
  }

  uiOverlays.setSharePayload({
    username: name,
    score,
    skinSrc: shareSkinSrc,
    invertSkin: useInvertedSkin,
  });

  uiOverlays.showGameOver();
}

async function refreshLeaderboard() {
  const scores = await api.getLeaderboard(10);
  await uiOverlays.renderLeaderboard(scores);

  const deviceId = storage.ensureDeviceId();
  const myRank = await api.getMyRank(deviceId);

  if (myRank?.hasScore && Number.isFinite(myRank.bestScore)) {
    const serverBest = Math.max(0, Math.trunc(myRank.bestScore));
    if (serverBest !== state.gameState.best) {
      state.gameState.best = serverBest;
      localStorage.setItem('flappy-best', String(serverBest));
      hudRender.updateBestBadge(bestEl, state.gameState.best);
    }
  }

  const onBoard = Array.isArray(scores) && scores.some(r => r.device_id === deviceId);

  if (onBoard) {
    uiOverlays.hideYourRank();
  } else {
    uiOverlays.showYourRank();
    if (myRank) {
      uiOverlays.updateYourRank(myRank);
    }
  }
}

// Start the app
initializeApp().catch(err => {
  console.error('App init error:', err);
});
