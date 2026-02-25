import * as C from '../constants.js';
import * as cfg from '../config.js';

export function shouldTransitionTheme(currentTheme, score, bgReady) {
  if (currentTheme === 1 && score >= C.THEME.THRESHOLDS[0] && bgReady[2]) {
    return { from: 1, to: 2 };
  } else if (currentTheme === 2 && score >= C.THEME.THRESHOLDS[1] && bgReady[3]) {
    return { from: 2, to: 3 };
  }
  return null;
}

export function isTransitionComplete(transition, frameNow) {
  if (!transition) return false;
  return frameNow - transition.start >= C.THEME.FADE_MS;
}

export function getThemeTransitionAlpha(transition, frameNow) {
  if (!transition) return 0;
  return Math.min(1, Math.max(0, (frameNow - transition.start) / C.THEME.FADE_MS));
}

export function getTheme2Alpha(theme, transition, frameNow) {
  if (!transition) return theme === 2 ? 1 : 0;

  const a = Math.min(1, Math.max(0, (frameNow - transition.start) / C.THEME.FADE_MS));
  if (transition.to === 2) return a;
  if (transition.from === 2) return 1 - a;
  return 0;
}

export function getBgFocusPoint(theme) {
  const mobile = cfg.isMobileish();
  return C.THEME.FOCUS[theme]
    ? mobile
      ? C.THEME.FOCUS[theme].mobile
      : C.THEME.FOCUS[theme].desktop
    : { cx: 0.5, cy: 0.5 };
}

export function getBgExtraZoom(theme) {
  const mobile = cfg.isMobileish();
  return (C.THEME.EXTRA_ZOOM[theme]
    ? mobile
      ? C.THEME.EXTRA_ZOOM[theme].mobile
      : C.THEME.EXTRA_ZOOM[theme].desktop
    : 1) || 1;
}
