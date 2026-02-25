import * as C from '../constants.js';

export const backgrounds = {
  1: new Image(),
  2: new Image(),
  3: new Image(),
};

export const backgroundReady = {
  1: false,
  2: false,
  3: false,
};

export const spires = {
  1: { tile: new Image(), cap: new Image() },
  2: { tile: new Image(), cap: new Image() },
  3: { tile: new Image(), cap: new Image() },
};

export const spiresReady = {
  1: { tile: false, cap: false },
  2: { tile: false, cap: false },
  3: { tile: false, cap: false },
};

export function initializeBackgrounds() {
  backgrounds[1].src = C.ASSETS.BACKGROUNDS[1];
  backgrounds[1].onload = () => (backgroundReady[1] = true);

  backgrounds[2].src = C.ASSETS.BACKGROUNDS[2];
  backgrounds[2].onload = () => (backgroundReady[2] = true);

  backgrounds[3].src = C.ASSETS.BACKGROUNDS[3];
  backgrounds[3].onload = () => (backgroundReady[3] = true);

  for (let t = 1; t <= 3; t++) {
    spires[t].tile.src = C.ASSETS.SPIRES[t].tile;
    spires[t].cap.src = C.ASSETS.SPIRES[t].cap;

    spires[t].tile.onload = () => (spiresReady[t].tile = true);
    spires[t].cap.onload = () => (spiresReady[t].cap = true);
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
