import * as C from '../constants.js';

export const backgrounds = {
  1: new Image(),
  2: new Image(),
  3: new Image(),
  4: new Image(),
  5: new Image(),
  6: new Image(),
  8: new Image(),
  9: new Image(),
  10: new Image(),
};

export const backgroundReady = {
  1: false,
  2: false,
  3: false,
  4: false,
  5: false,
  6: false,
  8: false,
  9: false,
  10: false,
};

export const spires = {
  1: { tile: new Image(), cap: new Image() },
  2: { tile: new Image(), cap: new Image() },
  3: { tile: new Image(), cap: new Image() },
  4: { tile: new Image(), cap: new Image() },
  5: { tile: new Image(), cap: new Image() },
  6: { tile: new Image(), cap: new Image() },
  8: { tile: new Image(), cap: new Image() },
  9: { tile: new Image(), cap: new Image() },
  10: { tile: new Image(), cap: new Image() },
};

export const spiresReady = {
  1: { tile: false, cap: false },
  2: { tile: false, cap: false },
  3: { tile: false, cap: false },
  4: { tile: false, cap: false },
  5: { tile: false, cap: false },
  6: { tile: false, cap: false },
  8: { tile: false, cap: false },
  9: { tile: false, cap: false },
  10: { tile: false, cap: false },
};

export function initializeBackgrounds() {
  for (const themeId of Object.keys(C.ASSETS.BACKGROUNDS).map(Number)) {
    backgrounds[themeId].src = C.ASSETS.BACKGROUNDS[themeId];
    backgrounds[themeId].onload = () => (backgroundReady[themeId] = true);
  }

  for (const themeId of Object.keys(C.ASSETS.SPIRES).map(Number)) {
    spires[themeId].tile.src = C.ASSETS.SPIRES[themeId].tile;
    spires[themeId].cap.src = C.ASSETS.SPIRES[themeId].cap;

    spires[themeId].tile.onload = () => (spiresReady[themeId].tile = true);
    spires[themeId].cap.onload = () => (spiresReady[themeId].cap = true);
  }
}

export function getBackground(theme) {
  return backgrounds[theme] || backgrounds[1];
}

export function getSpireSet(theme) {
  return spires[theme] || spires[1];
}

export function getSpireReady(theme) {
  return spiresReady[theme] || spiresReady[1];
}
