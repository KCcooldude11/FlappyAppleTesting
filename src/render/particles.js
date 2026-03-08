import * as C from '../constants.js';
import * as mathUtil from '../utils/math.js';
import * as renderer from './index.js';

class WaterParticle {
  constructor(w, h) {
    this.reset(w, h);
    this.y = Math.random() * h;
  }

  reset(w, h) {
    this.x = Math.random() * w;
    this.y = h + Math.random() * 50;
    this.r = Math.random() * (C.WATER_PARTICLES.RADIUS_MAX - C.WATER_PARTICLES.RADIUS_MIN) + C.WATER_PARTICLES.RADIUS_MIN;
    this.vy = Math.random() * (C.WATER_PARTICLES.VELOCITY_MAX - C.WATER_PARTICLES.VELOCITY_MIN) + C.WATER_PARTICLES.VELOCITY_MIN;
    this.opacity = this.r / 4;
    this.wobble = Math.random() * (C.WATER_PARTICLES.WOBBLE_MAX - C.WATER_PARTICLES.WOBBLE_MIN) + C.WATER_PARTICLES.WOBBLE_MIN;
    this.ang = Math.random() * Math.PI * 2;
  }

  step(w, h) {
    this.y -= this.vy;
    this.ang += this.wobble;
    this.x += Math.sin(this.ang) * 0.5;
    if (this.y < -this.r) this.reset(w, h);
  }
}

class Theme3Mote {
  constructor(w, h) {
    this.reset(w, h);
    this.y = Math.random() * h;
  }

  reset(w, h) {
    this.x = Math.random() * w;
    this.y = h + Math.random() * Math.max(40, h * 0.2);
    this.r = Math.random() * (C.THEME3_MOTES.SIZE_MAX - C.THEME3_MOTES.SIZE_MIN) + C.THEME3_MOTES.SIZE_MIN;
    this.vx = Math.random() * (C.THEME3_MOTES.VX_MAX - C.THEME3_MOTES.VX_MIN) + C.THEME3_MOTES.VX_MIN;
    this.vy = Math.random() * (C.THEME3_MOTES.VY_MAX - C.THEME3_MOTES.VY_MIN) + C.THEME3_MOTES.VY_MIN;
    this.baseOpacity = 0.35 + Math.random() * 0.45;
    this.twinkle = Math.random() * (C.THEME3_MOTES.TWINKLE_MAX - C.THEME3_MOTES.TWINKLE_MIN) + C.THEME3_MOTES.TWINKLE_MIN;
    this.ang = Math.random() * Math.PI * 2;
  }

  step(w, h) {
    this.x += this.vx;
    this.y += this.vy;
    this.ang += this.twinkle;

    if (this.y < -this.r || this.x < -this.r || this.x > w + this.r) {
      this.reset(w, h);
      this.x = Math.min(w + this.r, Math.max(-this.r, this.x));
    }
  }
}

export function desiredParticleCount(w, h) {
  const k = (w * h) / C.WATER_PARTICLES.DENSITY_DIVISOR;
  return mathUtil.clamp(Math.round(k), C.WATER_PARTICLES.TARGET_MIN, C.WATER_PARTICLES.TARGET_MAX);
}

export function ensureParticleCount(particles, w, h) {
  const target = desiredParticleCount(w, h);
  while (particles.length < target) particles.push(new WaterParticle(w, h));
  if (particles.length > target) particles.length = target;
}

export function updateParticles(particles, w, h, dt) {
  for (let i = 0; i < particles.length; i++) {
    particles[i].step(w, h);
  }
}

export function desiredTheme3MoteCount(w, h) {
  const k = (w * h) / C.THEME3_MOTES.DENSITY_DIVISOR;
  return mathUtil.clamp(Math.round(k), C.THEME3_MOTES.TARGET_MIN, C.THEME3_MOTES.TARGET_MAX);
}

export function ensureTheme3MoteCount(particles, w, h) {
  const target = desiredTheme3MoteCount(w, h);
  while (particles.length < target) particles.push(new Theme3Mote(w, h));
  if (particles.length > target) particles.length = target;
}

export function updateTheme3Motes(particles, w, h, dt) {
  for (let i = 0; i < particles.length; i++) {
    particles[i].step(w, h);
  }
}

export function drawParticles(particles, alpha = 1) {
  if (alpha <= 0 || !particles.length) return;

  const ctx = renderer.getContext();
  const a = Math.max(0, Math.min(1, alpha));

  ctx.save();
  for (const p of particles) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(173,216,230,${p.opacity * a})`;
    ctx.shadowColor = 'rgba(0,191,255,0.7)';
    ctx.shadowBlur = C.WATER_PARTICLES.SHADOW_BLUR;
    ctx.fill();
  }
  ctx.restore();
}

export function drawTheme3Motes(particles, alpha = 1) {
  if (alpha <= 0 || !particles.length) return;

  const ctx = renderer.getContext();
  const a = Math.max(0, Math.min(1, alpha));

  ctx.save();
  for (const p of particles) {
    const pulse = 0.65 + 0.35 * Math.sin(p.ang);
    const opacity = p.baseOpacity * pulse * a;
    const size = p.r;

    ctx.beginPath();
    ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,210,130,${opacity})`;
    ctx.shadowColor = `rgba(255,150,70,${Math.min(1, opacity * 1.6)})`;
    ctx.shadowBlur = C.THEME3_MOTES.SHADOW_BLUR;
    ctx.fill();
  }
  ctx.restore();
}
