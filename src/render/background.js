import * as C from '../constants.js';
import * as cfg from '../config.js';
import * as bg from '../entities/background.js';
import * as renderer from './index.js';

const bgCache = {
  1: { w: 0, h: 0, dpr: 0, canvas: null },
  2: { w: 0, h: 0, dpr: 0, canvas: null },
  3: { w: 0, h: 0, dpr: 0, canvas: null },
};

export function invalidateBgCache() {
  for (const k in bgCache) {
    bgCache[k].canvas = null;
    bgCache[k].w = bgCache[k].h = bgCache[k].dpr = 0;
  }
}

export function ensureBgCached(themeIndex, vw, vh) {
  const img = bg.getBackground(themeIndex);
  if (!img || !img.width || !img.height) return null;

  const entry = bgCache[themeIndex];
  const ODR = cfg.getOffscreenDpr();
  const needRebuild = !entry.canvas || entry.w !== vw || entry.h !== vh || entry.dpr !== ODR;

  if (!needRebuild) return entry.canvas;

  entry.w = vw;
  entry.h = vh;
  entry.dpr = ODR;

  const off = document.createElement('canvas');
  off.width = Math.max(1, Math.round(vw * ODR));
  off.height = Math.max(1, Math.round(vh * ODR));
  const octx = off.getContext('2d');
  octx.setTransform(ODR, 0, 0, ODR, 0, 0);

  // Focused crop math
  const mobile = cfg.isMobileish();
  const f = C.THEME.FOCUS[themeIndex]
    ? mobile
      ? C.THEME.FOCUS[themeIndex].mobile
      : C.THEME.FOCUS[themeIndex].desktop
    : { cx: 0.5, cy: 0.5 };
  const extraZoom =
    (C.THEME.EXTRA_ZOOM[themeIndex]
      ? mobile
        ? C.THEME.EXTRA_ZOOM[themeIndex].mobile
        : C.THEME.EXTRA_ZOOM[themeIndex].desktop
      : 1) || 1;

  const coverScale = Math.max(vw / img.width, vh / img.height) * extraZoom;
  const sw = Math.min(img.width, Math.ceil(vw / coverScale));
  const sh = Math.min(img.height, Math.ceil(vh / coverScale));

  let sx = Math.round(f.cx * img.width - sw / 2);
  let sy = Math.round(f.cy * img.height - sh / 2);
  sx = Math.max(0, Math.min(sx, img.width - sw));
  sy = Math.max(0, Math.min(sy, img.height - sh));

  octx.imageSmoothingEnabled = true;
  octx.imageSmoothingQuality = 'high';
  const localBlur = Math.max(0, Math.min(C.CANVAS.BLUR_PX, 2));
  if (localBlur > 0) octx.filter = `blur(${localBlur}px)`;

  octx.drawImage(img, sx, sy, sw, sh, 0, 0, vw, vh);

  entry.canvas = off;
  return off;
}

export function drawBackground(theme, transition, frameNow) {
  const vw = renderer.getCanvasWidth();
  const vh = renderer.getCanvasHeight();
  const ctx = renderer.getContext();

  if (!transition) {
    const can = ensureBgCached(theme, vw, vh);
    if (can) ctx.drawImage(can, 0, 0, vw, vh);
    return;
  }

  // Crossfade
  const a = Math.min(1, Math.max(0, (frameNow - transition.start) / C.THEME.FADE_MS));
  const fromCan = ensureBgCached(transition.from, vw, vh);
  const toCan = ensureBgCached(transition.to, vw, vh);

  if (fromCan) ctx.drawImage(fromCan, 0, 0, vw, vh);
  if (toCan) {
    ctx.save();
    ctx.globalAlpha = a;
    ctx.drawImage(toCan, 0, 0, vw, vh);
    ctx.restore();
  }
}
