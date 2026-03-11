// Medallion rain effect for Theme 3 at 1000+
import * as C from '../constants.js';
import * as renderer from './index.js';

const medalImg = new Image();
medalImg.src = C.ASSETS.MEDALLION;
let medalReady = false;
medalImg.onload = () => (medalReady = true);

export function isMedalReady() {
  return medalReady;
}

export function ensureMedallionRain(rain, vw, vh, count = 32) {
  while (rain.length < count) {
    rain.push({
      x: Math.random() * vw,
      y: -Math.random() * vh,
      vy: 120 + Math.random() * 180,
      vx: (Math.random() - 0.5) * 40,
      size: 32 + Math.random() * 32,
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 0.04,
    });
  }
  rain.length = count;
}

export function updateMedallionRain(rain, vw, vh, dt) {
  for (let m of rain) {
    m.y += m.vy * dt;
    m.x += m.vx * dt;
    m.rot += m.vrot;
    if (m.y > vh + m.size) {
      m.x = Math.random() * vw;
      m.y = -m.size;
      m.vy = 120 + Math.random() * 180;
      m.vx = (Math.random() - 0.5) * 40;
      m.size = 32 + Math.random() * 32;
      m.rot = Math.random() * Math.PI * 2;
      m.vrot = (Math.random() - 0.5) * 0.04;
    }
  }
}

export function drawMedallionRain(rain, alpha = 1) {
  const ctx = renderer.getContext();
  ctx.save();
  ctx.globalAlpha = alpha;
  for (let m of rain) {
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.rotate(m.rot);
    if (medalReady) {
      ctx.drawImage(medalImg, -m.size / 2, -m.size / 2, m.size, m.size);
    } else {
      // fallback: draw gold circle
      ctx.beginPath();
      ctx.arc(0, 0, m.size / 2, 0, Math.PI * 2);
      ctx.fillStyle = 'gold';
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();
}
