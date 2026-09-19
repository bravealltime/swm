// Live data: JSON documents in Supabase `live_data` that hourly jobs and the back-office write and
// the site reads through /api/live/<key> — fresh numbers without a redeploy. Bundled JSON in
// src/data stays as the offline fallback, refreshed by the nightly commit.
import crypto from 'node:crypto';
import { supabaseRest } from './admin.js';

export const LIVE_KEY = /^[a-z0-9-]{2,40}$/;

/** Keys the hourly / nightly jobs publish and where the bundled fallback lives (scripts/publish_live_data.mjs). */
export const LIVE_SOURCES = {
  'rta-tierlist': 'src/data/swrtTierList.json',
  'rta-cutoffs': 'src/data/swrtRankCutoffs.json',
  'rta-meta': 'src/data/swrtMetaMonsters.json',
  'guardian-meta': 'src/data/swrtGuardianMeta.json',
  patches: 'src/data/balancePatches.json',
  'patches-ai': 'src/data/balancePatchAi.json',
};

/** { ok, key, value, updatedAt, updatedBy } — ok:false with error 'NOT_FOUND' / 'TABLE_MISSING' / message */
export async function getLive(key) {
  if (!LIVE_KEY.test(key)) return { ok: false, error: 'BAD_KEY' };
  const r = await supabaseRest('live_data', { query: `?select=key,value,updated_at,updated_by&key=eq.${encodeURIComponent(key)}&limit=1` });
  if (!r.ok) return { ok: false, error: r.error };
  const row = Array.isArray(r.data) ? r.data[0] : null;
  if (!row) return { ok: false, error: 'NOT_FOUND' };
  return { ok: true, key: row.key, value: row.value, updatedAt: row.updated_at, updatedBy: row.updated_by };
}

/** Every key with its size and age (no values) for the back-office. */
export async function listLive() {
  const r = await supabaseRest('live_data', { query: '?select=key,updated_at,updated_by&order=key.asc' });
  if (!r.ok) return { ok: false, error: r.error, rows: [] };
  return { ok: true, rows: r.data || [] };
}

export async function setLive(key, value, by) {
  if (!LIVE_KEY.test(key)) return { ok: false, error: 'BAD_KEY' };
  const row = { key, value, updated_at: new Date().toISOString(), updated_by: by || null };
  const r = await supabaseRest('live_data', { method: 'POST', body: row, query: '?on_conflict=key' });
  return r.ok ? { ok: true, updatedAt: row.updated_at } : { ok: false, error: r.error };
}

export async function deleteLive(key) {
  if (!LIVE_KEY.test(key)) return { ok: false, error: 'BAD_KEY' };
  const r = await supabaseRest(`live_data?key=eq.${encodeURIComponent(key)}`, { method: 'DELETE' });
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}

// --- redeem-code submissions from visitors ---------------------------------------------------
const CODE_RE = /^[A-Z0-9]{4,40}$/;
const ipHash = (ip) => (ip ? crypto.createHash('sha256').update(String(ip)).digest('hex').slice(0, 16) : null);

/** Normalises a submitted code: upper-case, no spaces; null when it cannot be a redeem code. */
export function normalizeCode(input) {
  const code = String(input || '').trim().toUpperCase().replace(/\s+/g, '');
  return CODE_RE.test(code) ? code : null;
}

/**
 * Stores a visitor's code for moderation. Five per IP per day; a code already pending or already
 * live is reported as such instead of stored twice.
 */
export async function submitCode({ code: raw, note, ip }) {
  const code = normalizeCode(raw);
  if (!code) return { ok: false, status: 400, error: 'โค้ดต้องเป็นตัวอักษร/ตัวเลขอังกฤษ 4–40 ตัว' };
  const hash = ipHash(ip);
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const recent = await supabaseRest('code_submissions', { query: `?select=id,code,status&created_at=gte.${encodeURIComponent(since)}&or=(ip_hash.eq.${hash},code.eq.${code})&limit=50` });
  if (!recent.ok) return { ok: false, status: 503, error: recent.error === 'TABLE_MISSING' ? 'ระบบรับโค้ดยังไม่พร้อม' : recent.error };
  const rows = recent.data || [];
  if (rows.some((r) => r.code === code && r.status !== 'rejected')) return { ok: true, status: 200, duplicate: true, code };
  if (rows.filter((r) => r.status !== 'rejected').length >= 5) return { ok: false, status: 429, error: 'ส่งโค้ดได้ 5 ครั้งต่อวันต่อเครื่อง' };
  const live = await getLive('codes');
  const existing = live.ok && Array.isArray(live.value?.codes) ? live.value.codes : [];
  if (existing.some((c) => String(c.code || '').toUpperCase() === code)) return { ok: true, status: 200, duplicate: true, live: true, code };
  const r = await supabaseRest('code_submissions', { method: 'POST', body: { code, note: note ? String(note).slice(0, 200) : null, ip_hash: hash } });
  return r.ok ? { ok: true, status: 200, code } : { ok: false, status: 500, error: r.error };
}

export async function listSubmissions({ status = 'pending', limit = 100 } = {}) {
  const r = await supabaseRest('code_submissions', { query: `?select=id,created_at,code,note,status,resolved_by,resolved_at&status=eq.${status}&order=created_at.desc&limit=${Math.min(500, limit)}` });
  if (!r.ok) return { ok: false, error: r.error, rows: [] };
  return { ok: true, rows: r.data || [] };
}

/** approve → the code joins live_data.codes at the top; reject → marked and hidden. */
export async function resolveSubmission({ id, op, by, rewards = '' }) {
  const sub = await supabaseRest('code_submissions', { query: `?select=id,code,note,status&id=eq.${Number(id)}&limit=1` });
  const row = sub.ok && Array.isArray(sub.data) ? sub.data[0] : null;
  if (!row) return { ok: false, error: 'ไม่พบรายการ' };
  if (op === 'approve') {
    const live = await getLive('codes');
    const codes = live.ok && Array.isArray(live.value?.codes) ? live.value.codes : [];
    if (!codes.some((c) => String(c.code || '').toUpperCase() === row.code)) {
      codes.unshift({
        id: `code-${row.code.toLowerCase()}`,
        code: row.code,
        dateAdded: new Date().toISOString().slice(0, 10),
        expiry: 'มีผลใช้งานอยู่',
        status: 'active',
        rewardsText: String(rewards || row.note || '').slice(0, 200),
        rewards: [],
        redeemUrl: `http://withhive.me/313/${row.code}`,
      });
      const w = await setLive('codes', { codes, updatedAt: new Date().toISOString() }, by);
      if (!w.ok) return { ok: false, error: w.error };
    }
  } else if (op !== 'reject') return { ok: false, error: 'unknown op' };
  const r = await supabaseRest(`code_submissions?id=eq.${Number(id)}`, { method: 'PATCH', body: { status: op === 'approve' ? 'approved' : 'rejected', resolved_by: by || null, resolved_at: new Date().toISOString() } });
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}
