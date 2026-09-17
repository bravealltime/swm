// Live reads from the public (no-login) SWRT endpoints that allow cross-origin requests.
// Responses are cached in sessionStorage so a browsing session hits SWRT at most once
// per TTL; callers always keep the bundled JSON snapshot as a fallback.

const API = 'https://m.swranking.com/api';
const TTL_MS = 10 * 60 * 1000;

function readCache(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    return Date.now() - ts < TTL_MS ? data : null;
  } catch {
    return null;
  }
}

function writeCache(key, data) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // storage may be unavailable (private mode); live data still returns
  }
}

async function get(pathname, signal) {
  const res = await fetch(API + pathname, { signal });
  if (!res.ok) throw new Error(`SWRT ${pathname} HTTP ${res.status}`);
  const json = await res.json();
  if (json.retCode !== 0) throw new Error(`SWRT ${pathname} retCode ${json.retCode}`);
  return json.data;
}

/**
 * Current rank cutoffs (+ history when available).
 * Resolves to { now, history, live: true } or throws when SWRT is unreachable.
 */
export async function fetchLiveCutoffs({ signal } = {}) {
  const cached = readCache('swrt:cutoffs');
  if (cached) return { ...cached, live: true, fromCache: true };

  const [now, history] = await Promise.allSettled([
    get('/player/nowline', signal),
    get('/player/historyLine', signal),
  ]);
  if (now.status !== 'fulfilled') throw now.reason;

  const data = {
    now: now.value,
    history: history.status === 'fulfilled' && Array.isArray(history.value) ? history.value : null,
  };
  writeCache('swrt:cutoffs', data);
  return { ...data, live: true };
}
