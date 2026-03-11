import * as C from '../constants.js';
import * as cfg from '../config.js';

export function shouldTransitionTheme(currentTheme, score, bgReady) {
  // 1 -> 2 at 100
  if (currentTheme === 1 && score >= C.THEME.THRESHOLDS[0]) {
    return { from: 1, to: 2 };
  }
  // 2 -> 3 at 200
  if (currentTheme === 2 && score >= C.THEME.THRESHOLDS[1]) {
    return { from: 2, to: 3 };
  }
  // 2 or inverted 1 (6) -> inverted 2 (4) at 600
  if ((currentTheme === 2 || currentTheme === C.THEME.INVERT_THEME1_ID) && score >= C.THEME.THRESHOLDS[3]) {
    return { from: currentTheme, to: C.THEME.INVERT_THEME2_ID };
  }
  // inverted 2 (4) -> inverted 3 (5) at 700
  if (currentTheme === C.THEME.INVERT_THEME2_ID && score >= C.THEME.THRESHOLDS[4]) {
    return { from: C.THEME.INVERT_THEME2_ID, to: C.THEME.INVERT_THEME3_ID };
  }
  // inverted 3 (5) -> 8 at 850
  if (currentTheme === C.THEME.INVERT_THEME3_ID && score >= C.THEME.THRESHOLDS[5]) {
    return { from: C.THEME.INVERT_THEME3_ID, to: 8 };
  }
  // 8 -> 9 at 900
  if (currentTheme === 8 && score >= C.THEME.THRESHOLDS[6]) {
    return { from: 8, to: 9 };
  }
  // 9 -> 10 at 1000
  if (currentTheme === 9 && score >= C.THEME.THRESHOLDS[7]) {
    return { from: 9, to: 10 };
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
  // Treat theme 4 (inverted 2) as theme 2 for animation
  if (!transition) return (theme === 2 || theme === C.THEME.INVERT_THEME2_ID) ? 1 : 0;

  const a = Math.min(1, Math.max(0, (frameNow - transition.start) / C.THEME.FADE_MS));
  if (transition.to === 2 || transition.to === C.THEME.INVERT_THEME2_ID) return a;
  if (transition.from === 2 || transition.from === C.THEME.INVERT_THEME2_ID) return 1 - a;
  return 0;
}

export function getTheme3Alpha(theme, transition, frameNow) {
  if (!transition) return theme === 3 ? 1 : 0;

  const a = Math.min(1, Math.max(0, (frameNow - transition.start) / C.THEME.FADE_MS));
  if (transition.to === 3) return a;
  if (transition.from === 3) return 1 - a;
  return 0;
}

export function getInvertThemeAlpha(theme, transition, frameNow) {
  if (!transition) return theme === C.THEME.INVERT_THEME_ID ? 1 : 0;

  const a = Math.min(1, Math.max(0, (frameNow - transition.start) / C.THEME.FADE_MS));
  if (transition.to === C.THEME.INVERT_THEME_ID) return a;
  if (transition.from === C.THEME.INVERT_THEME_ID) return 1 - a;
  return theme === C.THEME.INVERT_THEME_ID ? 1 : 0;
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
