
// Simple rain effect for Theme 3 and 10
import * as renderer from './index.js';

// Ensure the rain array has the right number of particles
export function ensureMedallionRain(rain, vw, vh, count) {
  while (rain.length < count) {
    rain.push({
      x: Math.random() * vw,
      y: -Math.random() * vh,
      vy: 120 + Math.random() * 180,
      vx: (Math.random() - 0.5) * 40,
      size: 16 + Math.random() * 16,
    });
  }
  rain.length = count;
}

// Update rain particle positions
export function updateMedallionRain(rain, vw, vh, dt) {
  for (let m of rain) {
    m.y += m.vy * dt;
    m.x += m.vx * dt;
    if (m.y > vh + m.size) {
      m.x = Math.random() * vw;
      m.y = -m.size;
      m.vy = 120 + Math.random() * 180;
      m.vx = (Math.random() - 0.5) * 40;
      m.size = 16 + Math.random() * 16;
    }
  }
}

// Draw the rain particles
export function drawMedallionRain(rain, alpha = 1) {
  const ctx = renderer.getContext();
  ctx.save();
  ctx.globalAlpha = alpha;
  for (let m of rain) {
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.size / 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(210,220,255,0.7)';
    ctx.shadowColor = 'rgba(185,200,255,0.8)';
    ctx.shadowBlur = 8;
    ctx.fill();
  }
  ctx.restore();
}
