import * as C from '../constants.js';
import * as renderer from './index.js';

const medalImg = new Image();
medalImg.src = C.ASSETS.MEDALLION;
let medalReady = false;
medalImg.onload = () => (medalReady = true);

export function getMedalImage() {
  return medalImg;
}

export function isMedalReady() {
  return medalReady;
}

export function drawMedallions(medallions) {
  if (!medalReady || !medallions.length) return;

  const ctx = renderer.getContext();
  const aspect = medalImg.width / medalImg.height;

  for (let m of medallions) {
    const hpx = m.size;
    const wpx = Math.round(hpx * aspect);
    const dx = Math.round(m.x - wpx / 2);
    const dy = Math.round(m.y - hpx / 2);
    ctx.drawImage(medalImg, dx, dy, wpx, hpx);
  }
}
