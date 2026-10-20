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
    if (m.type === 'star_powerup') {
      drawStarPowerup(ctx, m);
      continue;
    }
    const hpx = m.size;
    const wpx = Math.round(hpx * aspect);
    const dx = Math.round(m.x - wpx / 2);
    const dy = Math.round(m.y - hpx / 2);
    ctx.drawImage(medalImg, dx, dy, wpx, hpx);
  }
}

function drawStarPowerup(ctx, medallion) {
  const spikes = 5;
  const outerRadius = medallion.size * 0.5;
  const innerRadius = outerRadius * 0.44;
  const pulse = 1 + Math.sin(performance.now() / 140) * 0.06;

  ctx.save();
  ctx.translate(medallion.x, medallion.y);
  ctx.scale(pulse, pulse);
  ctx.shadowColor = 'rgba(190, 75, 255, 0.95)';
  ctx.shadowBlur = medallion.size * 0.25;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = -Math.PI / 2 + (i * Math.PI) / spikes;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = '#a43dff';
  ctx.fill();
  ctx.lineWidth = Math.max(1, medallion.size * 0.045);
  ctx.strokeStyle = '#f2d8ff';
  ctx.stroke();
  ctx.restore();
}
