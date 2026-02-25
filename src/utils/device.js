import * as C from '../constants.js';

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
