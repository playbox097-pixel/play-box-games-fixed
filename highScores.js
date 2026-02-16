// highScores.js - tiny numeric storage + high score helpers for Game Hub

const PREFIX = 'gamehub:';

function safeStore() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getNumber(id, defaultValue = 0) {
  const store = safeStore();
  if (!store) return defaultValue;
  const raw = store.getItem(PREFIX + id);
  if (raw == null) return defaultValue;
  const n = Number(raw);
  return Number.isFinite(n) ? n : defaultValue;
}

export function setNumber(id, value) {
  const store = safeStore();
  if (!store) return;
  try {
    const v = Math.max(0, Math.floor(Number(value) || 0));
    store.setItem(PREFIX + id, String(v));
  } catch {
    // ignore quota / privacy errors
  }
}

export function getHighScore(gameId) {
  return getNumber('high:' + gameId, 0);
}

export function updateHighScore(gameId, candidate) {
  const key = 'high:' + gameId;
  const prev = getNumber(key, 0);
  if (candidate > prev) {
    setNumber(key, candidate);
    return candidate;
  }
  return prev;
}
