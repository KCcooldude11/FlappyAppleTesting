import * as C from './constants.js';
import * as cfg from './config.js';

let defaultSkinIndex = 0;

export function setDefaultSkinIndex(idx) {
  defaultSkinIndex = idx;
}

// Single source of truth for game state
export const gameState = {
  // Game mode
  mode: 'ready', // 'ready' | 'playing' | 'gameover'

  // Bird state
  bird: {
    x: 0,
    y: 0,
    vy: 0,
    rot: 0,
    flapTimer: 0,
    r: 0,
  },

  glitch: {
    active: false,
    intensity: 0,
    nextBurstAt: 0,
    burstUntil: 0,
    burstIntensity: 0,
  },

  debug: {
    autoJumpEnabled: false,
    autoJumpTargetY: 0,
    autoJumpCooldownMs: 0,
  },

  // Pipes and collision
  pipes: [],
  lastPipeAt: 0,

  // Scoring
  score: 0,
  best: Number(localStorage.getItem('flappy-best') || 0),

  // Medallions
  medallions: [],
  columnsSpawned: 0,
  nextMedalColumn: 16,

  // Themes
  theme: 1, // 1 | 2 | 3
  themeTransition: null, // {from, to, start} or null

  // Skins (will be set at init)
  currentSkinIndex: 0,
  merrikhUnlockedThisRun: false,
  skinLocked: false,
  awaitingPost500AppleReset: false,
  post500AppleResetDone: false,

  // Timing
  runStartTime: 0,
  frameNow: 0,

  // Water particles (Theme 2)
  waterParticles: {
    particles: [],
    target: 140,
    lastW: 0,
    lastH: 0,
  },

  theme3Motes: {
    particles: [],
    target: 72,
    lastW: 0,
    lastH: 0,
  },
};

export function resetGameState(newBirdX, newBirdY, birdRadius) {
  const autoJumpPreset = Boolean(C.DEBUG?.NO_DEATH_RUN?.AUTO_JUMP_START_ENABLED);
  const keepAutoJumpEnabled = Boolean(C.DEBUG?.NO_DEATH_RUN?.ENABLED && gameState.debug.autoJumpEnabled);

  gameState.bird.x = newBirdX;
  gameState.bird.y = newBirdY;
  gameState.bird.vy = 0;
  gameState.bird.rot = 0;
  gameState.bird.flapTimer = 0;
  gameState.bird.r = birdRadius;

  gameState.pipes = [];
  gameState.lastPipeAt = 0;
  gameState.score = 0;

  gameState.medallions = [];
  gameState.columnsSpawned = 0;
  gameState.nextMedalColumn = 16;

  gameState.theme = 1;
  gameState.themeTransition = null;

  gameState.merrikhUnlockedThisRun = false;
  gameState.skinLocked = false;
  gameState.awaitingPost500AppleReset = false;
  gameState.post500AppleResetDone = false;

  gameState.debug.autoJumpEnabled = keepAutoJumpEnabled || autoJumpPreset;
  gameState.debug.autoJumpTargetY = newBirdY;
  gameState.debug.autoJumpCooldownMs = 0;

  gameState.currentSkinIndex = cfg.findDefaultSkin();
}

export function setGameMode(newMode) {
  gameState.mode = newMode;
  document.body.dataset.state = newMode;
}

export function updateFrameTimestamp(t) {
  gameState.frameNow = t;
}

export function markRunStart(t) {
  gameState.runStartTime = t;
}

export function updateBestScore(newScore) {
  if (newScore > gameState.best) {
    gameState.best = newScore;
    localStorage.setItem('flappy-best', String(newScore));
  }
}

export function incrementScore() {
  gameState.score += 1;
  return gameState.score;
}
