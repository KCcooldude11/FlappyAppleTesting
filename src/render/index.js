import * as C from '../constants.js';
import * as cfg from '../config.js';

export let canvas;
export let ctx;
export let DPR;
export let scale;

export function initializeCanvas() {
  canvas = document.getElementById('game');
  ctx = canvas.getContext('2d');

  DPR = C.CANVAS.DPR;
  resizeCanvas();
  computeScale();
}

export function resizeCanvas() {
  const cssW = canvas.clientWidth || canvas.width;
  const cssH = canvas.clientHeight || canvas.height;
  canvas.width = cssW * DPR;
  canvas.height = cssH * DPR;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}

export function computeScale() {
  const h = getCanvasHeight();
  scale = h / C.CANVAS.BASE_H;
  if (!Number.isFinite(scale) || scale <= 0) scale = 1;
}

export function getCanvasWidth() {
  return canvas.clientWidth || canvas.width / DPR;
}

export function getCanvasHeight() {
  return canvas.clientHeight || canvas.height / DPR;
}

export function getContext() {
  return ctx;
}

export function getScale() {
  return scale;
}

export function clearCanvas() {
  ctx.clearRect(0, 0, getCanvasWidth(), getCanvasHeight());
}

export function startFrame() {
  clearCanvas();
}

export function endFrame() {
  // Nothing needed per-frame currently; can add debug overlays here
}

export function onWindowResize(onResizeCallback) {
  window.addEventListener('resize', () => {
    resizeCanvas();
    computeScale();
    onResizeCallback();
  });

  window.addEventListener('orientationchange', () => {
    resizeCanvas();
    computeScale();
    onResizeCallback();
  });
}
