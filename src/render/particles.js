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
    this.splatLife = 0;
    this.splatX = 0;
    this.splatY = 0;
    this.reset(w, h, true);
  }

  reset(w, h, initial = false) {
    const isBack = Math.random() < C.THEME3_MOTES.BACKROW_RATIO;
    const speedBase = Math.random() * (C.THEME3_MOTES.SPEED_MAX - C.THEME3_MOTES.SPEED_MIN) + C.THEME3_MOTES.SPEED_MIN;
    const lenBase = Math.random() * (C.THEME3_MOTES.LENGTH_MAX - C.THEME3_MOTES.LENGTH_MIN) + C.THEME3_MOTES.LENGTH_MIN;
    const opacityBase =
      Math.random() * (C.THEME3_MOTES.OPACITY_MAX - C.THEME3_MOTES.OPACITY_MIN) + C.THEME3_MOTES.OPACITY_MIN;

    this.isBackRow = isBack;
    this.x = Math.random() * w;
    this.y = initial ? Math.random() * h : -(Math.random() * h * 0.35 + 8);
    this.len = isBack ? lenBase * C.THEME3_MOTES.BACKROW_LENGTH_MULT : lenBase;
    this.vy = isBack ? speedBase * C.THEME3_MOTES.BACKROW_SPEED_MULT : speedBase;
    this.vx = Math.random() * (C.THEME3_MOTES.DRIFT_X_MAX - C.THEME3_MOTES.DRIFT_X_MIN) + C.THEME3_MOTES.DRIFT_X_MIN;
    this.opacity = isBack ? opacityBase * C.THEME3_MOTES.BACKROW_OPACITY_MULT : opacityBase;
    this.thickness =
      Math.random() * (C.THEME3_MOTES.THICKNESS_MAX - C.THEME3_MOTES.THICKNESS_MIN) +
      C.THEME3_MOTES.THICKNESS_MIN;
    this.splatSize =
      Math.random() * (C.THEME3_MOTES.SPLAT_SIZE_MAX - C.THEME3_MOTES.SPLAT_SIZE_MIN) +
      C.THEME3_MOTES.SPLAT_SIZE_MIN;
  }

  step(w, h, dt) {
    const dts = Math.max(0.001, dt || 0.016);
    this.y += this.vy * dts;
    this.x -= this.vx * dts;

    if (this.x < -20) this.x = w + 20;
    if (this.x > w + 20) this.x = -20;

    const groundY = h * (this.isBackRow ? C.THEME3_MOTES.BACKROW_GROUND_Y_RATIO : C.THEME3_MOTES.GROUND_Y_RATIO);
    if (this.y >= groundY) {
      if (Math.random() < C.THEME3_MOTES.SPLAT_PROBABILITY) {
        this.splatX = this.x;
        this.splatY = groundY;
        this.splatLife = 1;
      }
      this.reset(w, h);
    }

    if (this.splatLife > 0) {
      this.splatLife = Math.max(0, this.splatLife - C.THEME3_MOTES.SPLAT_FADE_PER_SEC * dts);
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
    particles[i].step(w, h, dt);
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
    const opacity = p.opacity * a;
    const dx = p.len * 0.16;

    ctx.beginPath();
    ctx.moveTo(p.x, p.y - p.len);
    ctx.lineTo(p.x - dx, p.y);
    ctx.lineWidth = p.thickness;
    ctx.strokeStyle = `rgba(210,220,255,${opacity})`;
    ctx.shadowColor = `rgba(185,200,255,${opacity * 0.8})`;
    ctx.shadowBlur = C.THEME3_MOTES.SHADOW_BLUR;
    ctx.stroke();

    if (p.splatLife > 0) {
      const splatOpacity = p.splatLife * opacity;
      ctx.beginPath();
      ctx.ellipse(
        p.splatX,
        p.splatY,
        p.splatSize * (1 + (1 - p.splatLife)),
        Math.max(0.8, p.splatSize * 0.42),
        0,
        0,
        Math.PI,
        true
      );
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(235,240,255,${splatOpacity * 0.85})`;
      ctx.shadowBlur = 0;
      ctx.stroke();
    }
  }
  ctx.restore();
}
