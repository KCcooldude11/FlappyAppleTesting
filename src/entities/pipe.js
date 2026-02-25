import * as C from '../constants.js';
import * as mathUtil from '../utils/math.js';

export function createPipe(x, topH, gapY) {
  return {
    x,
    topH,
    gapY,
    scored: false,
  };
}

export function quantizeSpireHeight(desiredH, imgTile, imgCap) {
  const sx = getSpireScaleX(imgTile);
  const tileH = (imgTile?.height ? imgTile.height : C.SPIRE.SEG_SRC_TILE_H) * sx;
  const capH = (imgCap?.height || 0) * sx;

  if (tileH <= 0) return desiredH;

  const usable = Math.max(0, desiredH - capH);
  const n = Math.max(0, Math.floor(usable / tileH + 1e-6));
  return n * tileH + capH;
}

export function getSpireScaleX(imgTile, pipeWidth) {
  if (!imgTile || !imgTile.width) return 1;
  return pipeWidth / imgTile.width;
}

export function getScaledSpireHeights(imgTile, imgCap, pipeWidth) {
  const sx = pipeWidth / (imgTile?.width || 1);
  const tileH = (imgTile?.height ? imgTile.height : C.SPIRE.SEG_SRC_TILE_H) * sx;
  const capH = (imgCap?.height || 0) * sx;
  return { tileH, capH, sx };
}

export function spawnPipePair(
  screenW,
  screenH,
  pipeGap,
  pipeWidth,
  lastPipe,
  segTile,
  segCap,
  segReady,
  scale
) {
  const marginTop = Math.round(C.COLLISION.BOUNDS_MARGIN_TOP * scale);
  const marginBot = Math.round(C.COLLISION.BOUNDS_MARGIN_BOT * scale);
  const maxTopRaw = screenH - marginBot - pipeGap - marginTop;

  let topY = marginTop + Math.random() * Math.max(40 * scale, maxTopRaw);

  // Quantize to current theme's tiles
  if (segReady.tile) {
    const qTop = quantizeSpireHeight(topY, segTile, segCap);
    const desiredBottomH = screenH - (qTop + pipeGap);
    const qBottom = quantizeSpireHeight(desiredBottomH, segTile, segCap);
    const total = qTop + pipeGap + qBottom;
    if (total <= screenH - marginBot) topY = qTop;
  }

  if (lastPipe) {
    const prevCenter = lastPipe.topH + pipeGap / 2;
    let thisCenter = topY + pipeGap / 2;
    const lim = Math.round(C.PHYSICS.MAX_CENTER_DELTA_RATIO * pipeGap);

    if (thisCenter > prevCenter + lim) thisCenter = prevCenter + lim;
    if (thisCenter < prevCenter - lim) thisCenter = prevCenter - lim;

    topY = thisCenter - pipeGap / 2;
    topY = Math.max(marginTop, Math.min(topY, screenH - marginBot - pipeGap));

    if (segReady.tile) {
      const qTop = quantizeSpireHeight(topY, segTile, segCap);
      const desiredBottomH = screenH - (qTop + pipeGap);
      const qBottom = quantizeSpireHeight(desiredBottomH, segTile, segCap);
      const total = qTop + pipeGap + qBottom;
      topY = total <= screenH - marginBot ? qTop : topY;
    }
  }

  const x = screenW + 40 * scale;
  return createPipe(x, topY, topY + pipeGap);
}
