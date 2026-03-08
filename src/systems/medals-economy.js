import * as C from '../constants.js';
import * as pipe from '../entities/pipe.js';
import * as medal from '../entities/medallion.js';

export function shouldSpawnMerrikh(columnsSpawned, merrikhUnlockedThisRun = false) {
  if (columnsSpawned === C.PROGRESSION.INVERTED_MERRIKH_AT_COLUMN) return true;
  return columnsSpawned === C.MEDALS.MERRIKH_UNLOCK_COLUMN && !merrikhUnlockedThisRun;
}

export function shouldSpawnRegularMedal(columnsSpawned, nextMedalColumn, pipes) {
  if (columnsSpawned !== nextMedalColumn) return false;
  return pipes.length >= 2;
}

export function updateMedallionPositions(medallions, pipeSpeed, dt, screenW) {
  for (let m of medallions) {
    m.x -= pipeSpeed * dt;
  }
  return medallions.filter(m => !m.taken && m.x + m.size > -40);
}

export function getMedalCollisionRadius(medal) {
  return medal.r;
}
