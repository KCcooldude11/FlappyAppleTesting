import * as C from './constants.js';
import * as state from './state.js';
import * as renderer from './render/index.js';
import * as physics from './physics/collision.js';
import * as pipeEntity from './entities/pipe.js';
import * as medalEntity from './entities/medallion.js';
import * as medalEcon from './systems/medals-economy.js';
import * as skinSys from './systems/skin-manager.js';
import * as bgEntity from './entities/background.js';
import * as particlesRender from './render/particles.js';
import * as cfg from './config.js';

export function update(gameState, dt, scale) {
  if (gameState.mode !== 'playing') return null;

  const physics_params = {
    gravity: C.PHYSICS.GRAVITY * scale,
    jumpVy: C.PHYSICS.JUMP_VY * scale,
    pipeSpeed: C.PHYSICS.PIPE_SPEED * scale,
    pipeGap: Math.round(C.PHYSICS.PIPE_GAP * scale),
    pipeWidth: Math.round(C.PHYSICS.PIPE_WIDTH * scale),
  };

  // Bird physics
  gameState.bird.vy += physics_params.gravity * dt;
  gameState.bird.y += gameState.bird.vy * dt;
  gameState.bird.rot = Math.atan2(gameState.bird.vy, 300);
  if (gameState.bird.flapTimer > 0) {
    gameState.bird.flapTimer -= dt * 1000;
  }

  // Pipe spawning
  if (gameState.lastPipeAt <= 0) {
    const bgReady = bgEntity.getSpireReady(gameState.theme);
    const newPipe = pipeEntity.spawnPipePair(
      renderer.getCanvasWidth(),
      renderer.getCanvasHeight(),
      physics_params.pipeGap,
      physics_params.pipeWidth,
      gameState.pipes[gameState.pipes.length - 1],
      bgEntity.getSpireSet(gameState.theme).tile,
      bgEntity.getSpireSet(gameState.theme).cap,
      bgReady,
      scale
    );
    gameState.pipes.push(newPipe);
    gameState.columnsSpawned++;

    // Medallion spawning
    if (medalEcon.shouldSpawnMerrikh(gameState.columnsSpawned) && !gameState.merrikhUnlockedThisRun) {
      const prevPipe = gameState.pipes[gameState.pipes.length - 2];
      const thisPipe = gameState.pipes[gameState.pipes.length - 1];
      const medal_m = medalEntity.spawnMedalForMerrikh(
        prevPipe,
        thisPipe,
        renderer.getCanvasHeight(),
        physics_params.pipeGap,
        scale
      );
      gameState.medallions.push(medal_m);
    } else if (medalEcon.shouldSpawnRegularMedal(gameState.columnsSpawned, gameState.nextMedalColumn, gameState.pipes)) {
      const prevPipe = gameState.pipes[gameState.pipes.length - 2];
      const thisPipe = gameState.pipes[gameState.pipes.length - 1];
      const medal_r = medalEntity.spawnRegularMedal(
        prevPipe,
        thisPipe,
        renderer.getCanvasHeight(),
        physics_params.pipeGap,
        scale
      );
      gameState.medallions.push(medal_r);
      gameState.nextMedalColumn += medalEntity.nextMedalJump();
    }

    gameState.lastPipeAt = C.PHYSICS.PIPE_INTERVAL_MS;
  } else {
    gameState.lastPipeAt -= dt * 1000;
  }

  // Move pipes
  for (let p of gameState.pipes) {
    p.x -= physics_params.pipeSpeed * dt;
  }

  // Remove off-screen pipes
  while (gameState.pipes.length && gameState.pipes[0].x + physics_params.pipeWidth < -40 * scale) {
    gameState.pipes.shift();
  }

  // World bounds
  const screenHeight = renderer.getCanvasHeight();
  if (gameState.bird.y - gameState.bird.r <= 0 || gameState.bird.y + gameState.bird.r >= screenHeight) {
    return { collision: true, type: 'bounds' };
  }

  // Pipe collisions + scoring
  const hitInsetX = Math.round(C.COLLISION.HIT_INSET_X_RATIO * physics_params.pipeWidth);
  const capInsetY = C.COLLISION.CAP_INSET_Y;

  for (let p of gameState.pipes) {
    if (
      physics.checkPipeCollision(
        gameState.bird,
        p,
        physics_params.pipeWidth,
        screenHeight,
        hitInsetX,
        capInsetY
      )
    ) {
      return { collision: true, type: 'pipe' };
    }

    if (!p.scored && p.x + physics_params.pipeWidth < gameState.bird.x) {
      p.scored = true;
      gameState.score += 1;
    }
  }

  // Update medallions
  if (gameState.medallions.length) {
    for (let m of gameState.medallions) {
      m.x -= physics_params.pipeSpeed * dt;

      const dx = gameState.bird.x - m.x;
      const dy = gameState.bird.y - m.y;
      const rr = gameState.bird.r + m.r;

      if (!m.taken && dx * dx + dy * dy < rr * rr) {
        m.taken = true;

        if (m.type === 'merrikh') {
          gameState.merrikhUnlockedThisRun = true;
          skinSys.switchToSkin(gameState, cfg.SKIN_INDICES.MERRIKH, C.PHYSICS.BIRD_RADIUS_RATIO);
          if (C.MEDALS.LOCK_AFTER_MERRIKH) {
            gameState.skinLocked = true;
          }
        } else {
          skinSys.advanceSkinOneStep(gameState, C.PHYSICS.BIRD_RADIUS_RATIO);
        }
      }
    }

    gameState.medallions = gameState.medallions.filter(m => !m.taken && m.x + m.size > -40 * scale);
  }

  // Water particles
  if (gameState.theme === 2) {
    particlesRender.updateParticles(gameState.waterParticles.particles, renderer.getCanvasWidth(), renderer.getCanvasHeight(), dt);
  }

  return null; // no collision
}
