// Live documents from /api/live/<key> (Supabase `live_data`), with the bundled JSON as fallback.
// One in-memory cache per key, and — when Supabase is configured — a Realtime subscription so a
// tab that is already open re-fetches the moment the hourly job or an admin writes a new version.
//
//   const { data, updatedAt, live } = useLiveData('rta-cutoffs', bundledCutoffs);  (src/hooks/useLiveData.js)
//   subscribeSettingsChanges(() => reloadPublicSettings());

const cache = new Map();      // key -> { value, updatedAt, at }
const listeners = new Map();  // key -> Set<fn>
const MAX_AGE_MS = 5 * 60 * 1000;

/** The document body: the publisher stores arrays as { items } and adds _hash; callers get the plain value back. */
export function unwrap(value) {
  if (!value || typeof value !== 'object') return value;
  const { _hash, ...rest } = value;
  void _hash;
  const keys = Object.keys(rest);
  return keys.length === 1 && keys[0] === 'items' && Array.isArray(rest.items) ? rest.items : rest;
}

export async function fetchLive(key, { force = false } = {}) {
  const hit = cache.get(key);
  if (!force && hit && Date.now() - hit.at < MAX_AGE_MS) return hit;
  try {
    const res = await fetch(`/api/live/${encodeURIComponent(key)}`, { cache: force ? 'no-store' : 'default' });
    if (!res.ok) return null;
    const json = await res.json();
    const entry = { value: unwrap(json.value), updatedAt: json.updatedAt || null, at: Date.now() };
    cache.set(key, entry);
    for (const fn of listeners.get(key) || []) fn(entry);
    return entry;
  } catch {
    return null;
  }
}

/** Calls `fn(entry)` whenever a fresh version of `key` arrives; returns an unsubscribe. */
export function onLiveUpdate(key, fn) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key).add(fn);
  ensureRealtime();
  return () => listeners.get(key)?.delete(fn);
}

// --- Supabase Realtime ------------------------------------------------------------------------
let channelPromise = null;
const settingsListeners = new Set();

async function ensureRealtime() {
  if (channelPromise) return channelPromise;
  channelPromise = (async () => {
    try {
      const { getSupabase } = await import('./supabaseClient');
      const supabase = await getSupabase();
      if (!supabase) return null;
      const channel = supabase
        .channel('swm-live')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'live_data' }, (payload) => {
          const key = payload.new?.key || payload.old?.key;
          if (key && listeners.get(key)?.size) fetchLive(key, { force: true });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, () => {
          for (const fn of settingsListeners) fn();
        })
        .subscribe();
      return channel;
    } catch {
      return null;
    }
  })();
  return channelPromise;
}

/** Announcement / maintenance / feature flags changed in the back-office → `fn()` (re-fetch the public settings). */
export function subscribeSettingsChanges(fn) {
  settingsListeners.add(fn);
  ensureRealtime();
  return () => settingsListeners.delete(fn);
}

/** Visitor-submitted redeem code → moderation queue. Resolves { ok, duplicate, live } or throws with a Thai message. */
export async function submitPromoCode(code, note = '') {
  const res = await fetch('/api/live/submit-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, note }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `ส่งโค้ดไม่สำเร็จ (${res.status})`);
  return json;
}
