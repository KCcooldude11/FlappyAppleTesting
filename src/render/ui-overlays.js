import * as C from '../constants.js';
import * as fmt from '../utils/formatters.js';

export function hideOverlay() {
  const overlay = document.getElementById('overlay');
  if (overlay) {
    overlay.classList.add('hide');
    overlay.classList.remove('show');
  }
}

export function showOverlay() {
  const overlay = document.getElementById('overlay');
  if (overlay) {
    overlay.classList.remove('hide');
    overlay.classList.add('show');
  }
}

export function showGameOver() {
  const gameoverEl = document.getElementById('gameover');
  if (gameoverEl) {
    gameoverEl.classList.remove('hide');
    gameoverEl.classList.add('show');
  }
}

export function hideGameOver() {
  const gameoverEl = document.getElementById('gameover');
  if (gameoverEl) {
    gameoverEl.classList.add('hide');
    gameoverEl.classList.remove('show');
  }
}

export function updateGameOverSkinImage(skinImageSrc, skinName = 'Character') {
  const goSkin = document.getElementById('gameover-skin');
  if (goSkin) {
    if (skinImageSrc) {
      goSkin.src = skinImageSrc;
      goSkin.alt = `${skinName} (Regular)`;
      goSkin.classList.remove('hide');
    } else {
      goSkin.src = '';
      goSkin.classList.add('hide');
    }
  }
}

export function updateGameOverUsername(name) {
  const goNameEl = document.getElementById('go-username');
  if (goNameEl) {
    goNameEl.textContent = name || 'Player';
  }
}

export async function renderLeaderboard(list) {
  const wrap = document.getElementById('leaderboard-rows');
  if (!wrap) return;

  if (!Array.isArray(list) || list.length === 0) {
    wrap.innerHTML = `<div style="opacity:.8">No scores yet.</div>`;
    return;
  }

  wrap.innerHTML = list
    .map(
      (r, i) => `
      <div class="row">
        <span class="rank"><span class="txt">${i + 1}</span></span>
        <span class="name">${fmt.escapeHtml(r.name ?? 'Player')}</span>
        <span class="score">${Number(r.score ?? 0)}</span>
      </div>`
    )
    .join('');
}

export function updateYourRank(info) {
  const el = document.getElementById('your-rank');
  if (!el) return;

  if (!info || !info.hasScore) {
    el.textContent = 'Play a run to earn a ranking.';
    return;
  }

  el.textContent = `Your ranking: #${info.rank} of ${info.totalPlayers} (Best ${info.bestScore})`;
}

export function showYourRank() {
  const yourRankEl = document.getElementById('your-rank');
  if (yourRankEl) {
    yourRankEl.classList.remove('hide');
  }
}

export function hideYourRank() {
  const yourRankEl = document.getElementById('your-rank');
  if (yourRankEl) {
    yourRankEl.classList.add('hide');
  }
}

export function setupRenameModal(onSave) {
  const btnEditName = document.getElementById('btn-edit-name');
  const renameDlg = document.getElementById('rename-dlg');
  const renameForm = document.getElementById('rename-form');
  const renameInput = document.getElementById('rename-input');
  const renameSave = document.getElementById('rename-save');

  if (btnEditName) {
    btnEditName.addEventListener('click', () => {
      if (!renameDlg) return;
      const current = (localStorage.getItem('playerName') || '').trim();
      if (renameInput) {
        renameInput.value = current || '';
        renameInput.select();
      }
      refreshRenameUI();
      renameDlg.showModal();
    });
  }

  if (renameInput) {
    renameInput.addEventListener('input', refreshRenameUI);
  }

  if (renameForm) {
    renameForm.addEventListener('submit', async e => {
      const submitterId = e.submitter?.id;
      if (submitterId !== 'rename-save') return;
      e.preventDefault();

      const name = (renameInput?.value || '').trim();
      if (!fmt.isValidName(name)) {
        renameInput?.focus();
        return;
      }

      onSave(name);
      try {
        renameDlg?.close();
      } catch {}
    });
  }

  function refreshRenameUI() {
    const ok = fmt.isValidName((renameInput?.value || '').trim());
    if (renameSave) renameSave.disabled = !ok;
  }
}

export function startHomeAppleAnimation() {
  const apple = document.getElementById('homeApple');
  if (!apple) return;

  const REG = C.ASSETS.APPLE_HOME.regular;
  const FLY = C.ASSETS.APPLE_HOME.fly;

  const img1 = new Image();
  img1.src = REG;
  const img2 = new Image();
  img2.src = FLY;

  const TOTAL = C.HOME_APPLE.TOTAL_MS;
  const TO_REG_AT = C.HOME_APPLE.TO_REG_AT;
  const TO_FLY_AT = C.HOME_APPLE.TO_FLY_AT;

  let flyTimer = null;
  let regTimer = null;
  let loopTimer = null;

  const clearTimers = () => {
    if (flyTimer) clearTimeout(flyTimer);
    if (regTimer) clearTimeout(regTimer);
    if (loopTimer) clearInterval(loopTimer);
    flyTimer = regTimer = loopTimer = null;
  };

  const scheduleSwaps = () => {
    apple.src = FLY;
    regTimer = setTimeout(() => {
      apple.src = REG;
    }, TO_REG_AT);
    flyTimer = setTimeout(() => {
      apple.src = FLY;
    }, TO_FLY_AT);
  };

  clearTimers();
  scheduleSwaps();
  loopTimer = setInterval(scheduleSwaps, TOTAL);

  const obs = new MutationObserver(() => {
    const showing = document.getElementById('overlay')?.classList.contains('show');
    if (!showing) clearTimers();
  });

  const overlay = document.getElementById('overlay');
  if (overlay) obs.observe(overlay, { attributes: true, attributeFilter: ['class'] });
}
