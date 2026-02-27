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

// === Viewport scaling with stable FOV and crisp DPR ===

const GAME_W = 480;   // logical width
const GAME_H = 640;   // logical height

const app = document.getElementById('app');
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });

// Keep world units stable; draw in logical pixels, not scaled values.
let view = {
  cssWidth: 0,
  cssHeight: 0,
  scale: 1,
  dpr: Math.max(1, Math.min(window.devicePixelRatio || 1, 3)), // cap DPR for perf
  offsetX: 0,
  offsetY: 0,
};

// Use VisualViewport when available for more accurate safe size on mobile
function getSafeViewport() {
  const vv = window.visualViewport;
  if (vv) return { w: vv.width, h: vv.height };
  return { w: window.innerWidth, h: window.innerHeight };
}

/**
 * Decide how to scale:
 * - Landscape: prioritize height (vertical FOV constant) -> pillarbox
 * - Portrait:  prioritize width (horizontal fit)         -> letterbox top/bottom if needed
 * You can switch portrait to height-based too if you prefer identical feel both ways.
 */
function computeScale(vpW, vpH) {
  const isLandscape = vpW > vpH;

  // Bias: landscape uses height, portrait uses width
  const scaleByHeight = vpH / GAME_H;
  const scaleByWidth  = vpW / GAME_W;

  let scale = isLandscape ? scaleByHeight : scaleByWidth;

  // Optional: clamp overall scale if you want to prevent extreme zoom-in/zoom-out
  const MIN_SCALE = 0.6;  // feel free to tweak
  const MAX_SCALE = 2.5;
  scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));

  return { scale, isLandscape };
}

function layout() {
  // Get safe viewport (in CSS px)
  const { w: vpW, h: vpH } = getSafeViewport();

  const { scale } = computeScale(vpW, vpH);

  view.scale = scale;

  // CSS size of the canvas we will render into
  view.cssWidth  = Math.round(GAME_W * scale);
  view.cssHeight = Math.round(GAME_H * scale);

  // Center the canvas (letterbox/pillarbox visually)
  view.offsetX = Math.floor((vpW - view.cssWidth) / 2);
  view.offsetY = Math.floor((vpH - view.cssHeight) / 2);

  // Backing store: keep logical resolution * DPR (NOT multiplied by scale!)
  // We draw with transforms so world units stay 1:1 to GAME_W x GAME_H.
  const dpr = view.dpr;
  canvas.width  = Math.round(GAME_W * dpr);
  canvas.height = Math.round(GAME_H * dpr);

  // CSS size we actually display on screen (this provides the "zoom")
  canvas.style.width  = `${view.cssWidth}px`;
  canvas.style.height = `${view.cssHeight}px`;

  // Center via CSS grid (place-items:center) on #app, but we also adjust
  // for visualViewport offset on mobile when the on-screen keyboard shows etc.
  // If you want pixel-perfect centering using absolute positioning, use:
  // canvas.style.position = 'absolute';
  // canvas.style.left = `${view.offsetX}px`;
  // canvas.style.top  = `${view.offsetY}px`;

  // Prepare transform to draw in LOGICAL pixels:
  // 1) scale by DPR so lines are crisp
  // 2) no scale by 'view.scale' here — we draw at world size and let CSS scale the element.
  // This keeps your physics/timings identical across sizes.
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

// Convert a pointer event (clientX/Y) into world coords (logical 480x640 space)
function screenToWorld(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const xInCanvas = clientX - rect.left;
  const yInCanvas = clientY - rect.top;

  // Undo CSS scale to get logical coords
  const scale = view.scale;
  const wx = xInCanvas / scale;
  const wy = yInCanvas / scale;
  return { x: wx, y: wy };
}

// Example: hook resize (and orientation change)
const ro = new ResizeObserver(layout);
ro.observe(app);

window.addEventListener('orientationchange', () => {
  // Recompute DPR (some devices change DPR across orientation)
  view.dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 3));
  layout();
});

window.addEventListener('resize', layout);
window.addEventListener('visualviewportresize', layout);

// Initial layout
layout();

// In your game loop, do NOT multiply your world positions/sizes by view.scale.
// Draw as if the game is 480x640. The CSS size provides the zoom.
function gameRender() {
  // Clear with DPR-aware transform already set:
  ctx.clearRect(0, 0, GAME_W, GAME_H);

  // Example draw (world units):
  // ctx.fillStyle = 'red';
  // ctx.fillRect(GAME_W/2 - 20, GAME_H/2 - 20, 40, 40);

  // Your existing render code here...
}

// Example pointer usage
canvas.addEventListener('pointerdown', (e) => {
  const p = screenToWorld(e.clientX, e.clientY);
  // use p.x, p.y in 480x640 logical space
});

function onCanvasResize() {
  const vw = renderer.getCanvasWidth();
  const vh = renderer.getCanvasHeight();

  // Update water particles
  particlesRender.ensureParticleCount(state.gameState.waterParticles.particles, vw, vh);

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

  loop.start(onGameOver, onScoreUpdate);
}

function onScoreUpdate(newScore) {
  hudRender.updateScoreBadge(document.getElementById('score'), scoreTextEl, newScore);
}

async function onGameOver() {
  state.setGameMode('gameover');

  const playMs = Math.round(state.gameState.frameNow - state.gameState.runStartTime);
  const score = state.gameState.score;
  const best = state.gameState.best;

  // Update best
  state.updateBestScore(score);
  hudRender.updateBestBadge(bestEl, state.gameState.best);

  // Post score
  const deviceId = storage.ensureDeviceId();
  const result = await api.postScore(deviceId, score, playMs);
  if (result?.error) {
    console.warn('submit-score error:', result.error);
  }

  // Refresh leaderboard
  await refreshLeaderboard();

  // Update UI
  const name = storage.getSavedName() || 'Player';
  uiOverlays.updateGameOverUsername(name);

  // Show skin image
  const skin = cfg.getSkinById(state.gameState.currentSkinIndex);
  if (skin?.flapReady && skin.flapImg.src) {
    uiOverlays.updateGameOverSkinImage(skin.flapImg.src, skin.name);
  } else {
    uiOverlays.updateGameOverSkinImage('');
  }

  uiOverlays.showGameOver();
}

async function refreshLeaderboard() {
  const scores = await api.getLeaderboard(10);
  await uiOverlays.renderLeaderboard(scores);

  const deviceId = storage.ensureDeviceId();
  const onBoard = Array.isArray(scores) && scores.some(r => r.device_id === deviceId);

  if (onBoard) {
    uiOverlays.hideYourRank();
  } else {
    uiOverlays.showYourRank();
    const myRank = await api.getMyRank(deviceId);
    if (myRank) {
      uiOverlays.updateYourRank(myRank);
    }
  }
}

// Start the app
initializeApp().catch(err => {
  console.error('App init error:', err);
});
