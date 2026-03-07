import * as C from '../constants.js';
import * as fmt from '../utils/formatters.js';

let sharePayload = {
  username: 'Player',
  score: 0,
  skinSrc: '',
};

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

export function setupSupportLink() {
  const wrap = document.getElementById('support-links');
  const supportLink = document.getElementById('btn-support');
  const patreonLink = document.getElementById('btn-patreon');
  if (!wrap || !supportLink || !patreonLink) return;

  const koFiUrl = (C.URLS.SUPPORT_CREATOR || '').trim();
  const patreonUrl = (C.URLS.PATREON_CREATOR || '').trim();

  if (koFiUrl) {
    supportLink.href = koFiUrl;
    supportLink.classList.remove('hide');
  } else {
    supportLink.classList.add('hide');
    supportLink.removeAttribute('href');
  }

  if (patreonUrl) {
    patreonLink.href = patreonUrl;
    patreonLink.classList.remove('hide');
  } else {
    patreonLink.classList.add('hide');
    patreonLink.removeAttribute('href');
  }

  const hasAnySupportLink = Boolean(koFiUrl || patreonUrl);
  wrap.classList.toggle('hide', !hasAnySupportLink);
}

export function setSharePayload(payload) {
  sharePayload = {
    username: (payload?.username || 'Player').trim() || 'Player',
    score: Number.isFinite(payload?.score) ? payload.score : 0,
    skinSrc: payload?.skinSrc || '',
  };
}

export function setupShareButton() {
  const btnShare = document.getElementById('btn-share');
  if (!btnShare) return;

  btnShare.addEventListener('click', async () => {
    const previousText = btnShare.textContent;
    btnShare.disabled = true;
    btnShare.textContent = 'Sharing...';

    try {
      const cardBlob = await generateShareCardBlob(sharePayload);
      const safeName = String(sharePayload.username || 'Player')
        .replace(/[^a-z0-9_-]+/gi, '_')
        .slice(0, 24);
      const filename = `flappy-apple-${safeName}-${sharePayload.score}.png`;
      const shareText = `${sharePayload.username} scored ${sharePayload.score} in Flappy Apple!`;
      const shareTitle = 'Flappy Apple';
      const shareUrl = window.location.href;

      if (navigator.share) {
        const file = new File([cardBlob], filename, { type: 'image/png' });
        const shareWithFile = { title: shareTitle, text: shareText, files: [file] };

        if (navigator.canShare && navigator.canShare(shareWithFile)) {
          await navigator.share(shareWithFile);
          btnShare.textContent = 'Shared!';
          return;
        }

        await navigator.share({ title: shareTitle, text: `${shareText} ${shareUrl}` });
        btnShare.textContent = 'Shared!';
        return;
      }

      triggerBlobDownload(cardBlob, filename);
      const copied = await copyToClipboard(`${shareText} ${shareUrl}`);
      btnShare.textContent = copied ? 'Downloaded + Copied' : 'Downloaded';
    } catch {
      btnShare.textContent = 'Share Failed';
    } finally {
      setTimeout(() => {
        btnShare.disabled = false;
        btnShare.textContent = previousText;
      }, 1600);
    }
  });
}

async function generateShareCardBlob(payload) {
  const width = 1080;
  const height = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, '#3D4973');
  bg.addColorStop(1, '#577DB5');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  const panelX = 90;
  const panelY = 170;
  const panelW = width - panelX * 2;
  const panelH = height - 260;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  roundRect(ctx, panelX, panelY, panelW, panelH, 42);
  ctx.fill();

  ctx.fillStyle = '#6e1d24';
  ctx.font = '700 82px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Flappy Apple', width / 2, 295);

  if (payload.skinSrc) {
    try {
      const sprite = await loadImage(payload.skinSrc);
      const maxW = 420;
      const maxH = 420;
      const scale = Math.min(maxW / sprite.width, maxH / sprite.height);
      const drawW = Math.round(sprite.width * scale);
      const drawH = Math.round(sprite.height * scale);
      const drawX = Math.round((width - drawW) / 2);
      const drawY = 380;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sprite, drawX, drawY, drawW, drawH);
    } catch {}
  }

  ctx.fillStyle = '#111111';
  ctx.font = '600 58px system-ui, sans-serif';
  ctx.fillText(payload.username || 'Player', width / 2, 890);

  ctx.font = '700 98px system-ui, sans-serif';
  ctx.fillStyle = '#c98512';
  ctx.fillText(String(payload.score ?? 0), width / 2, 1010);

  ctx.font = '500 38px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(17,17,17,0.8)';
  ctx.fillText('Score', width / 2, 1070);

  return await new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create share image'));
    }, 'image/png');
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 800);
}

async function copyToClipboard(text) {
  try {
    if (!navigator.clipboard?.writeText) return false;
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
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
