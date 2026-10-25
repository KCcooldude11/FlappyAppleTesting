import * as C from '../constants.js';
import * as cfg from '../config.js';
import * as bg from '../entities/background.js';
import * as renderer from './index.js';

const bgCache = {
  1: { w: 0, h: 0, dpr: 0, canvas: null },
  2: { w: 0, h: 0, dpr: 0, canvas: null },
  3: { w: 0, h: 0, dpr: 0, canvas: null },
  4: { w: 0, h: 0, dpr: 0, canvas: null },
  5: { w: 0, h: 0, dpr: 0, canvas: null },
  6: { w: 0, h: 0, dpr: 0, canvas: null },
  8: { w: 0, h: 0, dpr: 0, canvas: null },
  9: { w: 0, h: 0, dpr: 0, canvas: null },
  10: { w: 0, h: 0, dpr: 0, canvas: null },
  11: { w: 0, h: 0, dpr: 0, canvas: null },
  12: { w: 0, h: 0, dpr: 0, canvas: null },
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
    if (C.UNDERWATER.THEMES.includes(theme)) drawUnderwaterEffects(ctx, vw, vh, frameNow);
    return;
  }

  // Crossfade both backgrounds throughout the transition. Ease the blend so
  // the new theme does not appear to snap in near the end.
  const progress = Math.min(1, Math.max(0, (frameNow - transition.start) / C.THEME.FADE_MS));
  const a = progress * progress * (3 - 2 * progress);
  const fromCan = ensureBgCached(transition.from, vw, vh);
  const toCan = ensureBgCached(transition.to, vw, vh);

  ctx.save();
  if (fromCan) ctx.drawImage(fromCan, 0, 0, vw, vh);
  if (toCan) {
    ctx.globalAlpha = a;
    ctx.drawImage(toCan, 0, 0, vw, vh);
  }
  ctx.restore();
  if (C.UNDERWATER.THEMES.includes(theme) || C.UNDERWATER.THEMES.includes(transition.to)) {
    drawUnderwaterEffects(ctx, vw, vh, frameNow);
  }
}

function drawUnderwaterEffects(ctx, vw, vh, frameNow) {
  const t = frameNow / 1000;
  ctx.save();
  ctx.globalAlpha = 0.2;
  for (let i = 0; i < 5; i++) {
    const x = vw * (0.12 + i * 0.22) + Math.sin(t * 0.35 + i) * 35;
    const gradient = ctx.createLinearGradient(x, 0, x + 70, vh);
    gradient.addColorStop(0, 'rgba(215, 255, 255, 0.7)');
    gradient.addColorStop(0.5, 'rgba(90, 220, 240, 0.08)');
    gradient.addColorStop(1, 'rgba(0, 100, 170, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(x - 35, 0);
    ctx.lineTo(x + 35, 0);
    ctx.lineTo(x + 95, vh);
    ctx.lineTo(x - 20, vh);
    ctx.closePath();
    ctx.fill();
  }

  ctx.globalAlpha = 0.32;
  for (let i = 0; i < 7; i++) {
    const x = ((i * 173 + t * (8 + i)) % (vw + 140)) - 70;
    const y = vh * (0.22 + (i % 4) * 0.18) + Math.sin(t * 0.8 + i) * 12;
    const length = 34 + (i % 3) * 16;
    ctx.fillStyle = 'rgba(12, 34, 58, 0.85)';
    ctx.beginPath();
    ctx.ellipse(x, y, length, 7, Math.sin(i) * 0.15, 0, Math.PI * 2);
    ctx.moveTo(x - length, y);
    ctx.lineTo(x - length - 15, y - 8);
    ctx.lineTo(x - length - 15, y + 8);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
