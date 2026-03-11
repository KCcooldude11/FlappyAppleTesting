import * as C from '../constants.js';

// Prevent browser gestures
function preventDefaultGestures(canvas) {
  if (!canvas) return;

  // Prevent scrolling/zooming gestures only when interacting with the canvas.
  // Do NOT block touchstart globally or inputs/buttons won't work on iOS.
  ['touchmove', 'touchend', 'touchcancel'].forEach(type => {
    canvas.addEventListener(type, e => e.preventDefault(), { passive: false });
  });

  // Optional: block double-tap zoom on canvas
  canvas.addEventListener('dblclick', e => e.preventDefault(), { passive: false });
}

export function initializeInputHandlers(flappingCallback, startingCallback, renamingCallback, autoJumpToggleCallback, speedMultCallback) {
   const canvas = document.getElementById('game');
  
  preventDefaultGestures(canvas);
 
  const nameInput = document.getElementById('username');
  const btnPlay = document.getElementById('btn-play');
  const btnTry = document.getElementById('btn-try');
  const btnRestart = document.getElementById('btn-restart');

  // Keyboard input
  window.addEventListener('keydown', e => {
    const tag = e.target?.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    const autoJumpKey = C.DEBUG?.NO_DEATH_RUN?.AUTO_JUMP_TOGGLE_KEY || 'KeyQ';

    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      flappingCallback();
    } else if (e.code === autoJumpKey && !e.repeat) {
      e.preventDefault();
      autoJumpToggleCallback?.();
    } else if (!e.repeat && e.code >= 'Digit1' && e.code <= 'Digit9') {
      const mult = parseInt(e.code.replace('Digit', ''), 10);
      const min = C.DEBUG?.NO_DEATH_RUN?.SPEED_MULT_MIN ?? 1;
      const max = C.DEBUG?.NO_DEATH_RUN?.SPEED_MULT_MAX ?? 9;
      if (Number.isFinite(mult) && mult >= min && mult <= max) {
        e.preventDefault();
        speedMultCallback?.(mult);
      }
    } else if (e.code === 'Enter') {
      e.preventDefault();
      // Only start game if the play button is enabled
      if (btnPlay && !btnPlay.disabled) {
        startingCallback();
      }
    }
  });

  // Canvas pointer input
  if (canvas) {
    canvas.addEventListener('pointerdown', e => {
      e.preventDefault();
      flappingCallback();
    });
  }

  // Button clicks
  if (btnPlay) {
    btnPlay.addEventListener('click', e => {
      e.preventDefault();
      startingCallback();
    });
  }

  if (btnTry) {
    btnTry.addEventListener('click', e => {
      e.preventDefault();
      startingCallback();
    });
  }

  if (btnRestart) {
    btnRestart.addEventListener('click', e => {
      e.preventDefault();
      startingCallback();
    });
  }

  // Name input validation
  if (nameInput) {
    nameInput.addEventListener('input', () => {
      renamingCallback();
    });
  }
}

export function setPlayButtonDisabled(disabled) {
  const btnPlay = document.getElementById('btn-play');
  if (btnPlay) btnPlay.disabled = disabled;
}

export function getNameInputValue() {
  const nameInput = document.getElementById('username');
  return nameInput ? (nameInput.value || '').trim() : '';
}

export function setNameInputValue(value) {
  const nameInput = document.getElementById('username');
  if (nameInput) nameInput.value = value;
}
