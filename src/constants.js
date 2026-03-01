// All magic numbers as named constants
// Organize by category for clarity

export const CANVAS = {
  BASE_H: 720,
  DPR: Math.max(1, Math.floor(window.devicePixelRatio || 1)),
  OFFSCREEN_DPR_CAP: 1.5,
  BLUR_PX: 6,
};

export const PHYSICS = {
  GRAVITY: 1200,
  JUMP_VY: -420,
  PIPE_SPEED: 160,
  PIPE_GAP: 160,
  PIPE_INTERVAL_MS: 1500,
  PIPE_WIDTH: 70,
  BIRD_BASE_H: 100,
  BIRD_RADIUS_RATIO: 0.20,
  MAX_CENTER_DELTA_RATIO: 0.99,
};

export const COLLISION = {
  HIT_INSET_X_RATIO: 0.14,
  CAP_INSET_Y: 8,
  BOUNDS_MARGIN_TOP: 40,
  BOUNDS_MARGIN_BOT: 40,
};

export const SPIRE = {
  SEG_SRC_TILE_H: 22,
  TOP_CAP_NUDGE: -6,
  TILE_OVERLAP: 1,
};

export const BIRD = {
  START_X_FRAC: 0.28,
  FLAP_TIMER_MS: 300,
  ROTATION_FACTOR: 0.45,
};

export const THEME = {
  FADE_MS: 800,
  THRESHOLDS: [5, 10],
  FOCUS: {
    1: { desktop: { cx: 0.50, cy: 0.50 }, mobile: { cx: 0.50, cy: 0.50 } },
    2: { desktop: { cx: 0.55, cy: 0.52 }, mobile: { cx: 0.72, cy: 0.52 } },
    3: { desktop: { cx: 0.50, cy: 0.50 }, mobile: { cx: 0.38, cy: 0.50 } },
  },
  EXTRA_ZOOM: {
    1: { desktop: 1.00, mobile: 1.00 },
    2: { desktop: 1.00, mobile: 1.08 },
    3: { desktop: 1.00, mobile: 1.04 },
  },
};

export const MEDALS = {
  MERRIKH_UNLOCK_COLUMN: 30,
  LOCK_AFTER_MERRIKH: true,
  MEDAL_SIZE_BASE: 28,
  MEDAL_SIZE_MIN: 68,
  MEDAL_RADIUS_RATIO: 0.42,
  SAFE_MARGIN_RATIO: 0.2,
  JITTER_RATIO: 0.4,
  MERRIKH_JITTER_RATIO: 0.3,
};

export const WATER_PARTICLES = {
  TARGET_BASE: 140,
  DENSITY_DIVISOR: 26000,
  TARGET_MIN: 90,
  TARGET_MAX: 220,
  WOBBLE_MIN: 0.01,
  WOBBLE_MAX: 0.03,
  RADIUS_MIN: 1,
  RADIUS_MAX: 4,
  VELOCITY_MIN: 0.5,
  VELOCITY_MAX: 1.5,
  SHADOW_BLUR: 10,
};

export const UI = {
  HUD_TOP: 8,
  HUD_LEFT: 8,
  HUD_RIGHT: 8,
  RESTART_BTN_PADDING: 6,
  MOBILE_BREAKPOINT: 700,
};

export const NAMES = {
  MIN_LEN: 3,
  MAX_LEN: 16,
  RESERVED: ['guest'],
};

export const URLS = {
  REGISTER_IDENTITY: '/.netlify/functions/register-identity',
  SUBMIT_SCORE: '/.netlify/functions/submit-score',
  GET_LEADERBOARD: '/.netlify/functions/get-leaderboard',
  GET_MY_RANK: '/.netlify/functions/get-my-rank',
  FETCH_TIMEOUT_MS: 2000,
  NETLIFY_TIMEOUT_MS: 1500,
};

export const ASSETS = {
  BACKGROUNDS: {
    1: './assets/Untitled_Artwork.png',
    2: './assets/background2.png',
    3: './assets/background3.png',
  },
  SPIRES: {
    1: { tile: './assets/rock_spire_bottom.png', cap: './assets/rock_spire_top.png' },
    2: { tile: './assets/rock_spire_bottom2.png', cap: './assets/rock_spire_top2.png' },
    3: { tile: './assets/rock_spire_bottom3.png', cap: './assets/rock_spire_top3.png' },
  },
  MEDALLION: './assets/medallion.png',
  APPLE_HOME: { regular: './assets/apple_regular.png', fly: './assets/apple_fly.png' },
};

export const HOME_APPLE = {
  TOTAL_MS: 2400,
  TO_REG_AT: Math.floor(2400 * 0.55),
  TO_FLY_AT: Math.floor(2400 * 0.98),
};
