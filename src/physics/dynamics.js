import * as C from '../constants.js';

export function updateBirdVelocity(bird, gravityScaled, dt) {
  bird.vy += gravityScaled * dt;
}

export function updateBirdPosition(bird, dt) {
  bird.y += bird.vy * dt;
}

export function updateBirdRotation(bird) {
  bird.rot = Math.atan2(bird.vy, 300);
}

export function decreaseFlapTimer(bird, dt) {
  if (bird.flapTimer > 0) {
    bird.flapTimer -= dt * 1000;
  }
}

export function flap(bird, jumpVyScaled) {
  bird.vy = jumpVyScaled;
  bird.flapTimer = C.BIRD.FLAP_TIMER_MS;
}

export function getScaledPhysics(scale) {
  return {
    gravity: C.PHYSICS.GRAVITY * scale,
    jumpVy: C.PHYSICS.JUMP_VY * scale,
    pipeSpeed: C.PHYSICS.PIPE_SPEED * scale,
    pipeGap: Math.round(C.PHYSICS.PIPE_GAP * scale),
    pipeWidth: Math.round(C.PHYSICS.PIPE_WIDTH * scale),
    birdBaseH: Math.round(C.PHYSICS.BIRD_BASE_H * scale),
  };
}
