import * as C from './constants.js';

// ===== Skins Configuration =====

export const SKINS = [
  { name: 'Apple', idle: './assets/Apple_Fly.png', flap: './assets/Apple_Regular.png' },
  { name: 'Comet', idle: './assets/Comet_Fly.png', flap: './assets/Comet_Regular.png' },
  { name: 'Theo', idle: './assets/Theo_Fly.png', flap: './assets/Theo_Regular.png' },
  { name: 'Orange', idle: './assets/Orange_Fly.png', flap: './assets/Orange_Regular.png', scale: 0.95 },
  { name: 'Lottie', idle: './assets/Lottie_Fly.png', flap: './assets/Lottie_Regular.png' },
  { name: 'Clovia', idle: './assets/Clovia_Fly.png', flap: './assets/Clovia_Regular.png' },
  { name: 'Salem', idle: './assets/Salem_Fly.png', flap: './assets/Salem_Regular.png', scale: 1.08 },
  { name: 'Roni', idle: './assets/Roni_Fly.png', flap: './assets/Roni_Regular.png' },
  { name: 'Knogle', idle: './assets/Knogle_Fly.png', flap: './assets/Knogle_Regular.png', scale: 1.08 },
  { name: 'Orchard', idle: './assets/Orchard_Fly.png', flap: './assets/Orchard_Regular.png', scale: 1.08 },
  { name: 'Ephedra', idle: './assets/Ephedra_Fly.png', flap: './assets/Ephedra_Regular.png', scale: 1.08 },
  { name: 'Merrikh', idle: './assets/Merrikh_Fly.png', flap: './assets/Merrikh_Regular.png', scale: 1.08 },
];

// Initialize skin images
for (const s of SKINS) {
  s.idleImg = new Image();
  s.flapImg = new Image();
  s.idleReady = false;
  s.flapReady = false;
  s.idleImg.onload = () => (s.idleReady = true);
  s.flapImg.onload = () => (s.flapReady = true);
  s.idleImg.onerror = () => (s.idleReady = false);
  s.flapImg.onerror = () => (s.flapReady = false);
  s.idleImg.src = s.idle;
  s.flapImg.src = s.flap;
}

export const SKIN_INDICES = {
  APPLE: SKINS.findIndex(s => s.name === 'Apple'),
  MERRIKH: SKINS.findIndex(s => s.name === 'Merrikh'),
};

export function getSkinById(index) {
  return SKINS[index] || null;
}

export function getSkinScale(index) {
  const s = SKINS[index];
  return (s && typeof s.scale === 'number') ? s.scale : 1;
}

export function isSkinReady(index) {
  const s = SKINS[index];
  return !!(s && s.idleReady && s.flapReady);
}

export function findDefaultSkin() {
  for (let i = 0; i < SKINS.length; i++) {
    if (isSkinReady(i)) return i;
  }
  if (SKIN_INDICES.APPLE >= 0 && isSkinReady(SKIN_INDICES.APPLE)) {
    return SKIN_INDICES.APPLE;
  }
  return 0;
}

// ===== Device & Display Configuration =====

export const DPR = C.CANVAS.DPR;

export function isMobileish() {
  return Math.min(window.innerWidth, window.innerHeight) < C.UI.MOBILE_BREAKPOINT;
}

export function getOffscreenDpr() {
  return Math.min(DPR, C.CANVAS.OFFSCREEN_DPR_CAP);
}

export function getCanvasSize() {
  const canvas = document.getElementById('game');
  if (!canvas) return { w: 480, h: 640 };
  return {
    w: canvas.clientWidth || canvas.width / DPR,
    h: canvas.clientHeight || canvas.height / DPR,
  };
}
