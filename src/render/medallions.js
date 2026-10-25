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

export function drawMedallions(medallions, theme = 1) {
  if (!medalReady || !medallions.length) return;

  const ctx = renderer.getContext();
  const aspect = medalImg.width / medalImg.height;

  for (let m of medallions) {
    if (C.UNDERWATER.THEMES.includes(theme)) {
      drawBubble(ctx, m);
      continue;
    }
    const hpx = m.size;
    const wpx = Math.round(hpx * aspect);
    const dx = Math.round(m.x - wpx / 2);
    const dy = Math.round(m.y - hpx / 2);
    ctx.drawImage(medalImg, dx, dy, wpx, hpx);
  }
}

function drawBubble(ctx, bubble) {
  const radius = bubble.size * 0.34;
  const pulse = 1 + Math.sin(performance.now() / 260 + bubble.x * 0.02) * 0.05;

  ctx.save();
  ctx.translate(bubble.x, bubble.y);
  ctx.scale(pulse, pulse);
  ctx.shadowColor = 'rgba(120, 235, 255, 0.8)';
  ctx.shadowBlur = bubble.size * 0.18;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(190, 245, 255, 0.32)';
  ctx.fill();
  ctx.lineWidth = Math.max(2, bubble.size * 0.055);
  ctx.strokeStyle = 'rgba(225, 252, 255, 0.95)';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(-radius * 0.3, -radius * 0.34, radius * 0.18, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fill();
  ctx.restore();
}
