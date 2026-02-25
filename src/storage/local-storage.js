import * as C from '../constants.js';

export function ensureDeviceId() {
  let id = localStorage.getItem('deviceId');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('deviceId', id);
  }
  return id;
}

export function getSavedName() {
  return (localStorage.getItem('playerName') || '').trim();
}

export function setSavedName(name) {
  localStorage.setItem('playerName', name);
}

export function getSavedBestScore() {
  return Number(localStorage.getItem('flappy-best') || 0);
}

export function setSavedBestScore(score) {
  localStorage.setItem('flappy-best', String(score));
}
