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
  // Theme switching points:
  // 1: default
  // 2: at 100
  // 3: at 200
  // 6 (inverted 1): at 500
  // 4 (inverted 2): at 600
  // 5 (inverted 3): at 700
  // 8: at 850 (clone of 1)
  // 9: at 900 (clone of 2)
  // 10: at 1000 (clone of 3)
  // 11: at 1100 (spotlight/darkness)
  THRESHOLDS: [100, 200, 500, 600, 700, 850, 900, 1000, 1100],
  FOCUS: {
    1: { desktop: { cx: 0.50, cy: 0.50 }, mobile: { cx: 0.50, cy: 0.50 } },
    2: { desktop: { cx: 0.55, cy: 0.52 }, mobile: { cx: 0.72, cy: 0.52 } },
    3: { desktop: { cx: 0.50, cy: 0.50 }, mobile: { cx: 0.38, cy: 0.50 } },
    4: { desktop: { cx: 0.50, cy: 0.50 }, mobile: { cx: 0.50, cy: 0.50 } },
    5: { desktop: { cx: 0.50, cy: 0.50 }, mobile: { cx: 0.50, cy: 0.50 } },
    6: { desktop: { cx: 0.50, cy: 0.50 }, mobile: { cx: 0.50, cy: 0.50 } },
  },
  EXTRA_ZOOM: {
    1: { desktop: 1.00, mobile: 1.36 },
    2: { desktop: 1.00, mobile: 1.42 },
    3: { desktop: 1.00, mobile: 1.38 },
    4: { desktop: 1.00, mobile: 1.36 },
    5: { desktop: 1.00, mobile: 1.36 },
    6: { desktop: 1.00, mobile: 1.36 },
  },
  INVERT_THEME1_ID: 6, // inverted theme 1
  INVERT_THEME2_ID: 4, // inverted theme 2
  INVERT_THEME3_ID: 5, // inverted theme 3
  RESUME_THEME8_AT_SCORE: 850,
  RESUME_THEME9_AT_SCORE: 900,
  RESUME_THEME10_AT_SCORE: 1000,
  MEDALLION_RAIN_EFFECT_SCORE: 1000,
  MEDALLION_RAIN_EFFECT_DURATION_MS: 30000, // 30 seconds
};

export const VISUAL = {
  TEMP_INVERT_THEME: {
    ENABLED: false,
    ACTIVATE_AT_SCORE: 100,
  },
};

export const PROGRESSION = {
  RESET_TO_APPLE_AT_SCORE: 500,
  INVERTED_MERRIKH_AT_COLUMN: 800,
};

export const DEBUG = {
  TEST_START_NEAR_INVERT_ZONE: {
    ENABLED: false,
    START_SCORE: 990,
    START_COLUMNS: 990,
    START_THEME: 2,
    START_AS_MERRIKH: false,
    FORCE_MEDAL_EVERY_PIPE: true,
    NEXT_MEDAL_COLUMN: 992,
    MERRIKH_UNLOCK_COLUMN: 301,
  },
  // Force bgReady for themes in debug mode (array of theme numbers)
  // FORCE_BG_READY: [2, 3, 4, 5],
  NO_DEATH_RUN: {
    ENABLED: true,
    IGNORE_PIPE_COLLISIONS: true,
    IGNORE_WORLD_BOUNDS: false,
    AUTO_JUMP_TOGGLE_KEY: 'KeyQ',
    AUTO_JUMP_START_ENABLED: false,
    AUTO_JUMP_TOLERANCE_PX: 18,
    AUTO_JUMP_MIN_DESCENT_VY: 30,
    AUTO_JUMP_COOLDOWN_MS: 120,    SPEED_MULT_MIN: 1,
    SPEED_MULT_MAX: 9,  },
};

export const MEDALS = {
  MERRIKH_UNLOCK_COLUMN: 301,
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

export const THEME3_MOTES = {
  DENSITY_DIVISOR: 15000,
  TARGET_MIN: 90,
  TARGET_MAX: 170,
  LENGTH_MIN: 12,
  LENGTH_MAX: 26,
  SPEED_MIN: 420,
  SPEED_MAX: 760,
  DRIFT_X_MIN: 22,
  DRIFT_X_MAX: 84,
  THICKNESS_MIN: 0.8,
  THICKNESS_MAX: 1.5,
  OPACITY_MIN: 0.20,
  OPACITY_MAX: 0.55,
  BACKROW_RATIO: 0.42,
  BACKROW_SPEED_MULT: 0.72,
  BACKROW_LENGTH_MULT: 0.78,
  BACKROW_OPACITY_MULT: 0.55,
  GROUND_Y_RATIO: 1.06,
  BACKROW_GROUND_Y_RATIO: 1.03,
  SPLAT_PROBABILITY: 0,
  SPLAT_SIZE_MIN: 2,
  SPLAT_SIZE_MAX: 7,
  SPLAT_FADE_PER_SEC: 5.5,
  SHADOW_BLUR: 6,
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
  SUPPORT_CREATOR: 'https://ko-fi.com/kalidonia',
  PATREON_CREATOR: 'https://www.patreon.com/cw/Magmadoodle',
  FETCH_TIMEOUT_MS: 2000,
  NETLIFY_TIMEOUT_MS: 1500,
};

export const ASSETS = {
  BACKGROUNDS: {
    1: './assets/Untitled_Artwork.png',
    2: './assets/background2.png',
    3: './assets/background3.png',
    4: './assets/background2.png', // theme 4 uses theme 2's background
    5: './assets/background3.png', // theme 5 uses theme 3's background
    6: './assets/Untitled_Artwork.png', // theme 6 (inverted 1) uses theme 1's background
    8: './assets/Untitled_Artwork.png', // theme 8 uses theme 1's background
    9: './assets/background2.png',    // theme 9 uses theme 2's background
    10: './assets/background3.png',   // theme 10 uses theme 3's background
    11: './assets/Untitled_Artwork.png', // theme 11 uses theme 1's background (for now)
  },
  SPIRES: {
    1: { tile: './assets/rock_spire_bottom.png', cap: './assets/rock_spire_top.png' },
    2: { tile: './assets/rock_spire_bottom2.png', cap: './assets/rock_spire_top2.png' },
    3: { tile: './assets/rock_spire_bottom3.png', cap: './assets/rock_spire_top3.png' },
    4: { tile: './assets/rock_spire_bottom2.png', cap: './assets/rock_spire_top2.png' }, // theme 4 uses theme 2's spires
    5: { tile: './assets/rock_spire_bottom3.png', cap: './assets/rock_spire_top3.png' }, // theme 5 uses theme 3's spires
    6: { tile: './assets/rock_spire_bottom.png', cap: './assets/rock_spire_top.png' }, // theme 6 (inverted 1) uses theme 1's spires
    8: { tile: './assets/rock_spire_bottom.png', cap: './assets/rock_spire_top.png' }, // theme 8 uses theme 1's spires
    9: { tile: './assets/rock_spire_bottom2.png', cap: './assets/rock_spire_top2.png' }, // theme 9 uses theme 2's spires
    10: { tile: './assets/rock_spire_bottom3.png', cap: './assets/rock_spire_top3.png' }, // theme 10 uses theme 3's spires
    11: { tile: './assets/rock_spire_bottom.png', cap: './assets/rock_spire_top.png' }, // theme 11 uses theme 1's spires (for now)
  },
  MEDALLION: './assets/medallion.png',
  APPLE_HOME: { regular: './assets/apple_regular.png', fly: './assets/apple_fly.png' },
};

export const HOME_APPLE = {
  TOTAL_MS: 2400,
  TO_REG_AT: Math.floor(2400 * 0.40),
  TO_FLY_AT: Math.floor(2400 * 0.98),
};
