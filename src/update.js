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

  const noDeathDebug = C.DEBUG?.NO_DEATH_RUN;
  const ignorePipeCollisions = Boolean(noDeathDebug?.ENABLED && noDeathDebug.IGNORE_PIPE_COLLISIONS);
  const ignoreWorldBounds = Boolean(noDeathDebug?.ENABLED && noDeathDebug.IGNORE_WORLD_BOUNDS);
  const autoJumpEnabled = Boolean(noDeathDebug?.ENABLED && gameState.debug.autoJumpEnabled);
  const speedMult = noDeathDebug?.ENABLED ? Math.max(1, gameState.debug.speedMultiplier || 1) : 1;

  const physics_params = {
    gravity: C.PHYSICS.GRAVITY * scale,
    jumpVy: C.PHYSICS.JUMP_VY * scale,
    pipeSpeed: C.PHYSICS.PIPE_SPEED * scale * speedMult,
    pipeGap: Math.round(C.PHYSICS.PIPE_GAP * scale),
    pipeWidth: Math.round(C.PHYSICS.PIPE_WIDTH * scale),
  };

  if (gameState.debug.autoJumpCooldownMs > 0) {
    gameState.debug.autoJumpCooldownMs = Math.max(0, gameState.debug.autoJumpCooldownMs - dt * 1000);
  }

  if (autoJumpEnabled) {
    const targetY = Number.isFinite(gameState.debug.autoJumpTargetY) ? gameState.debug.autoJumpTargetY : gameState.bird.y;
    const tolerancePx = Math.max(8 * scale, (Number(noDeathDebug?.AUTO_JUMP_TOLERANCE_PX) || 18) * scale);
    const minDescentVy = (Number(noDeathDebug?.AUTO_JUMP_MIN_DESCENT_VY) || 30) * scale;
    const cooldownMs = Math.max(0, Number(noDeathDebug?.AUTO_JUMP_COOLDOWN_MS) || 120);

    if (
      gameState.debug.autoJumpCooldownMs <= 0 &&
      gameState.bird.y >= targetY + tolerancePx &&
      gameState.bird.vy >= minDescentVy
    ) {
      gameState.bird.vy = physics_params.jumpVy;
      gameState.bird.flapTimer = C.BIRD.FLAP_TIMER_MS;
      gameState.debug.autoJumpCooldownMs = cooldownMs;
    }
  }

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
    if (medalEcon.shouldSpawnMerrikh(gameState.columnsSpawned, gameState.merrikhUnlockedThisRun)) {
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
    } else if (
      gameState.score === C.PROGRESSION.RESET_TO_APPLE_AT_SCORE + 1 &&
      !gameState.post500AppleResetDone
    ) {
      // Force a medallion at 501 for apple/invert reset
      const prevPipe = gameState.pipes[gameState.pipes.length - 2];
      const thisPipe = gameState.pipes[gameState.pipes.length - 1];
      const medal_r = medalEntity.spawnRegularMedal(
        prevPipe,
        thisPipe,
        renderer.getCanvasHeight(),
        physics_params.pipeGap,
        scale
      );
      medal_r.type = 'apple_invert_reset';
      gameState.medallions.push(medal_r);
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
      // If apple/invert reset is still pending, mark this and all subsequent medallions until reset is done
      if (!gameState.post500AppleResetDone && gameState.score > C.PROGRESSION.RESET_TO_APPLE_AT_SCORE && gameState.theme < C.THEME.THRESHOLDS[3]) {
        medal_r.type = 'apple_invert_reset';
      }
      gameState.medallions.push(medal_r);
      gameState.nextMedalColumn = gameState.columnsSpawned + medalEntity.nextMedalJump();
    }

    gameState.lastPipeAt = C.PHYSICS.PIPE_INTERVAL_MS;
  } else {
    gameState.lastPipeAt -= dt * 1000 * speedMult;
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
  if (!ignoreWorldBounds && (gameState.bird.y - gameState.bird.r <= 0 || gameState.bird.y + gameState.bird.r >= screenHeight)) {
    return { collision: true, type: 'bounds' };
  }

  // Pipe collisions + scoring
  const hitInsetX = Math.round(C.COLLISION.HIT_INSET_X_RATIO * physics_params.pipeWidth);
  const capInsetY = C.COLLISION.CAP_INSET_Y;

  for (let p of gameState.pipes) {
    if (
      !ignorePipeCollisions &&
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
      const prevScore = gameState.score;
      gameState.score += 1;

      if (
        !gameState.post500AppleResetDone &&
        prevScore < C.PROGRESSION.RESET_TO_APPLE_AT_SCORE &&
        gameState.score >= C.PROGRESSION.RESET_TO_APPLE_AT_SCORE
      ) {
        gameState.awaitingPost500AppleReset = true;
      }
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


        if (m.type === 'apple_invert_reset') {
          skinSys.switchToSkin(
            gameState,
            cfg.SKIN_INDICES.APPLE,
            C.PHYSICS.BIRD_RADIUS_RATIO
          );
          gameState.theme = C.THEME.INVERT_THEME1_ID; // Switch to inverted theme 1 (theme 6)
          gameState.awaitingPost500AppleReset = false;
          gameState.post500AppleResetDone = true;
          gameState.skinLocked = false;
          continue;
        }

        if (gameState.awaitingPost500AppleReset) {
          skinSys.switchToSkin(
            gameState,
            cfg.SKIN_INDICES.APPLE,
            C.PHYSICS.BIRD_RADIUS_RATIO
          );
          gameState.awaitingPost500AppleReset = false;
          gameState.post500AppleResetDone = true;
          gameState.skinLocked = false;
          continue;
        }

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

  // Theme 3: medallion rain effect at 1000+
  if (gameState.theme === 3 && gameState.score >= C.THEME.MEDALLION_RAIN_EFFECT_SCORE) {
    if (!gameState.medallionRain.active) {
      gameState.medallionRain.active = true;
      gameState.medallionRain.startTime = performance.now();
    }
    // Update medallion rain
    const vw = renderer.getCanvasWidth();
    const vh = renderer.getCanvasHeight();
    const rain = gameState.medallionRain.particles;
    // Dynamically import to avoid circular deps
    import('./render/medallion-rain.js').then(rainMod => {
      rainMod.ensureMedallionRain(rain, vw, vh, 32);
      rainMod.updateMedallionRain(rain, vw, vh, dt);
    });
    // End effect after duration
    if (performance.now() - gameState.medallionRain.startTime > C.THEME.MEDALLION_RAIN_EFFECT_DURATION_MS) {
      gameState.medallionRain.active = false;
      gameState.medallionRain.startTime = 0;
      gameState.medallionRain.particles = [];
    }
  } else if (gameState.theme === 3) {
    particlesRender.updateTheme3Motes(gameState.theme3Motes.particles, renderer.getCanvasWidth(), renderer.getCanvasHeight(), dt);
  }

  return null; // no collision
}
