import * as C from '../constants.js';

export function createBird(x, y, radius) {
  return {
    x,
    y,
    vy: 0,
    rot: 0,
    flapTimer: 0,
    r: radius,
  };
}

export function resetBirdPosition(bird, x, y) {
  bird.x = x;
  bird.y = y;
  bird.vy = 0;
  bird.rot = 0;
  bird.flapTimer = 0;
}

export function updateBirdPhysics(bird, gravityScaled, dt) {
  bird.vy += gravityScaled * dt;
  bird.y += bird.vy * dt;
  bird.rot = Math.atan2(bird.vy, 300);

  if (bird.flapTimer > 0) {
    bird.flapTimer -= dt * 1000;
  }
}

export function flap(bird, jumpVyScaled) {
  bird.vy = jumpVyScaled;
  bird.flapTimer = C.BIRD.FLAP_TIMER_MS;
}
