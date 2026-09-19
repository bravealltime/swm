// Back-office helpers: admin auth (Supabase user + ADMIN_EMAILS allowlist), site settings and
// AI usage logs in Supabase (service role, PostgREST), GitHub Actions control.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { loadEnv } from './ai.js';

const env = (k) => { loadEnv(); return process.env[k] || ''; };
const supabaseUrl = () => (env('VITE_SUPABASE_URL') || env('SUPABASE_URL')).replace(/\/+$/, '');
const anonKey = () => env('VITE_SUPABASE_ANON_KEY') || env('SUPABASE_ANON_KEY');
const serviceKey = () => env('SUPABASE_SERVICE_ROLE_KEY');

// The site owner is always an admin; ADMIN_EMAILS (comma separated) adds more.
const OWNER_EMAILS = ['pedictu@gmail.com'];
export function adminEmails() {
  return [...new Set([...OWNER_EMAILS, ...env('ADMIN_EMAILS').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)])];
}

/** Resolves the Supabase user behind a bearer token (null when anonymous / invalid). */
export async function userFromToken(token) {
  const url = supabaseUrl();
  const anon = anonKey();
  if (!token || !url || !anon) return null;
  try {
    const res = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    const user = await res.json();
    return user?.id ? { id: user.id, email: String(user.email || '').toLowerCase() } : null;
  } catch {
    return null;
  }
}

/** { ok, status, user, reason } — 401 when not logged in, 403 when not on the allowlist. */
export async function requireAdmin(token) {
  // local development only: ADMIN_DEV_BYPASS=1 in .env opens the back-office without a login.
  // Vercel always sets VERCEL=1, so this can never switch on in a deployment.
  if (env('ADMIN_DEV_BYPASS') === '1' && !process.env.VERCEL) return { ok: true, status: 200, user: { id: 'dev', email: 'dev@localhost' } };
  const emails = adminEmails();
  const user = await userFromToken(token);
  if (!user) return { ok: false, status: 401, reason: 'ต้องเข้าสู่ระบบก่อน' };
  if (!emails.includes(user.email)) return { ok: false, status: 403, reason: `บัญชี ${user.email} ไม่ใช่ผู้ดูแล` };
  return { ok: true, status: 200, user };
}

// --- Supabase REST (service role bypasses RLS) ----------------------------------------------
export function supabaseInfo() {
  const url = supabaseUrl();
  return { configured: Boolean(url && anonKey()), host: url ? new URL(url).host : '', serviceRole: Boolean(serviceKey()) };
}

export async function supabaseRest(pathname, opts) { return rest(pathname, opts); }

/** Which back-office tables exist (and why not): { site_settings: 'ok' | 'TABLE_MISSING' | '<error>' , ... } */
export async function tableStatus() {
  const out = {};
  for (const t of ['site_settings', 'ai_logs', 'guild_rankings']) {
    const r = await rest(t, { query: '?select=id&limit=1' });
    out[t] = r.ok ? 'ok' : `${r.error}${r.detail ? ` — ${r.detail}` : ''}`;
  }
  return out;
}

async function rest(pathname, { method = 'GET', body, query = '' } = {}) {
  const url = supabaseUrl();
  const key = serviceKey();
  // name the variable that is actually missing — the URL is easy to forget on Vercel because the browser has a built-in default
  if (!url) return { ok: false, status: 0, error: 'ไม่มี VITE_SUPABASE_URL บนเซิร์ฟเวอร์', data: null };
  if (!key) return { ok: false, status: 0, error: 'ไม่มี SUPABASE_SERVICE_ROLE_KEY บนเซิร์ฟเวอร์', data: null };
  // The tables live in the `public` schema; the project's Data API may default to another one
  const schema = env('SUPABASE_SCHEMA') || 'public';
  const res = await fetch(`${url}/rest/v1/${pathname}${query}`, {
    method,
    headers: {
      apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json',
      'Accept-Profile': schema, 'Content-Profile': schema,
      Prefer: method === 'POST' ? 'resolution=merge-duplicates,return=representation' : 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const msg = data?.message || data?.hint || String(text).slice(0, 200);
    const missing = res.status === 404 || /relation .* does not exist|Could not find the table/i.test(msg);
    return { ok: false, status: res.status, error: missing ? 'TABLE_MISSING' : msg, detail: `${res.status} ${msg}`, data: null };
  }
  return { ok: true, status: res.status, data };
}

export const DEFAULT_SETTINGS = {
  announcement: { enabled: false, text: '', level: 'info', link: '' },
  maintenance: { enabled: false, message: 'ระบบกำลังปรับปรุง กลับมาเร็ว ๆ นี้' },
  features: { ai: true, liveLink: true, cloudSync: true, patchNotes: true },
  // The coach costs money per call: members only, and a small per-day budget counted per account AND per IP
  ai: { requireLogin: true, dailyLimit: 3 },
  // contributor ids for the shared guild leaderboards (server-side only, see _lib/guildRankings.js)
  guildRankings: { trusted: [], blocked: [] },
};

let settingsCache = { at: 0, value: null };
export async function getSettings({ fresh = false } = {}) {
  if (!fresh && settingsCache.value && Date.now() - settingsCache.at < 30_000) return settingsCache.value;
  const r = await rest('site_settings', { query: '?select=id,value,updated_at' });
  const merged = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  let storage = 'defaults';
  let updatedAt = null;
  if (r.ok && Array.isArray(r.data)) {
    storage = 'supabase';
    for (const row of r.data) {
      if (row.id in merged && row.value && typeof row.value === 'object') merged[row.id] = { ...merged[row.id], ...row.value };
      if (row.updated_at && (!updatedAt || row.updated_at > updatedAt)) updatedAt = row.updated_at;
    }
  } else if (r.error === 'TABLE_MISSING') storage = 'missing-table';
  else if (!serviceKey()) storage = 'no-service-key';
  else storage = `error: ${r.error}`;
  const value = { ...merged, _meta: { storage, updatedAt } };
  settingsCache = { at: Date.now(), value };
  return value;
}

export async function saveSettings(patch, by) {
  const rows = Object.entries(patch || {})
    .filter(([k, v]) => k in DEFAULT_SETTINGS && v && typeof v === 'object')
    .map(([id, value]) => ({ id, value: { ...DEFAULT_SETTINGS[id], ...value }, updated_at: new Date().toISOString(), updated_by: by || null }));
  if (!rows.length) return { ok: false, error: 'ไม่มีอะไรให้บันทึก' };
  const r = await rest('site_settings', { method: 'POST', body: rows, query: '?on_conflict=id' });
  settingsCache = { at: 0, value: null };
  return r.ok ? { ok: true } : { ok: false, error: r.error === 'TABLE_MISSING' ? 'ยังไม่ได้สร้างตาราง site_settings — รัน supabase/admin_schema.sql ใน SQL Editor' : r.error };
}

// --- AI usage log ---------------------------------------------------------------------------
export const ipHash = (ip) => (ip ? crypto.createHash('sha256').update(String(ip)).digest('hex').slice(0, 16) : null);

// Columns added by supabase/admin_schema.sql after the first release; an older table rejects them
const GEO_COLUMNS = ['ip', 'country', 'region', 'city', 'timezone'];
const missingColumn = (err) => /column|schema cache/i.test(String(err || ''));

/**
 * Never throws. Returns a promise the caller should await before responding: Vercel freezes the
 * function as soon as the response is sent, so a fire-and-forget insert never reaches Supabase.
 * Capped at 4s so a slow log can't hold up the answer.
 */
export function logAiCall({ kind, question, userId, ip, geo, ok, ms, model, error, tokens }) {
  if (!serviceKey()) return Promise.resolve();
  const row = {
    kind: String(kind || 'unknown').slice(0, 20),
    question: question ? String(question).slice(0, 300) : null,
    user_id: userId || null,
    ip_hash: ipHash(ip),
    ip: ip ? String(ip).slice(0, 64) : null,
    country: geo?.country || null,
    region: geo?.region || null,
    city: geo?.city || null,
    timezone: geo?.timezone || null,
    ok: Boolean(ok),
    ms: Number(ms) || 0,
    model: model ? String(model).slice(0, 60) : null,
    error: error ? String(error).slice(0, 200) : null,
    tokens: Number(tokens) || null,
  };
  let timer;
  const timeout = new Promise((resolve) => { timer = setTimeout(resolve, 4000); });
  const write = rest('ai_logs', { method: 'POST', body: row })
    .then((res) => {
      // table not migrated yet: write the row without the geo columns rather than lose it
      if (!res.ok && missingColumn(res.error)) {
        const legacy = { ...row };
        for (const c of GEO_COLUMNS) delete legacy[c];
        return rest('ai_logs', { method: 'POST', body: legacy });
      }
      return res;
    })
    .catch(() => {});
  return Promise.race([write, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Successful coach calls today by this account and by this IP, for the daily quota.
 * `{ ok: false }` when the log table is unreachable — the caller decides whether to fail open.
 */
export async function aiUsageSince({ since, userId, ip }) {
  const hash = ipHash(ip);
  const filters = [userId ? `user_id.eq.${userId}` : '', hash ? `ip_hash.eq.${hash}` : ''].filter(Boolean);
  if (!filters.length) return { ok: true, byUser: 0, byIp: 0 };
  const r = await rest('ai_logs', { query: `?select=user_id,ip_hash&ok=eq.true&created_at=gte.${encodeURIComponent(since)}&or=(${filters.join(',')})&limit=1000` });
  if (!r.ok) return { ok: false, error: r.error, byUser: 0, byIp: 0 };
  let byUser = 0, byIp = 0;
  for (const row of r.data || []) {
    if (userId && row.user_id === userId) byUser += 1;
    if (hash && row.ip_hash === hash) byIp += 1;
  }
  return { ok: true, byUser, byIp };
}

/** Successful answers since `since`, grouped by account and by IP — what the daily quota is counting. */
export async function aiUsageGroups({ since }) {
  const r = await rest('ai_logs', { query: `?select=user_id,ip_hash,ip,country,created_at&ok=eq.true&created_at=gte.${encodeURIComponent(since)}&order=created_at.desc&limit=2000` });
  let rows = r.data || [];
  if (!r.ok && missingColumn(r.error)) {
    const r2 = await rest('ai_logs', { query: `?select=user_id,ip_hash,created_at&ok=eq.true&created_at=gte.${encodeURIComponent(since)}&order=created_at.desc&limit=2000` });
    if (!r2.ok) return { ok: false, error: r2.error, users: [], ips: [] };
    rows = r2.data || [];
  } else if (!r.ok) return { ok: false, error: r.error, users: [], ips: [] };
  const users = new Map(), ips = new Map();
  for (const row of rows) {
    if (row.user_id) { const u = users.get(row.user_id) || { userId: row.user_id, count: 0, last: row.created_at }; u.count += 1; users.set(row.user_id, u); }
    if (row.ip_hash) { const i = ips.get(row.ip_hash) || { ipHash: row.ip_hash, ip: row.ip || null, country: row.country || null, count: 0, last: row.created_at }; i.count += 1; if (!i.ip && row.ip) i.ip = row.ip; ips.set(row.ip_hash, i); }
  }
  const desc = (a, b) => b.count - a.count;
  return { ok: true, users: [...users.values()].sort(desc), ips: [...ips.values()].sort(desc) };
}

export async function aiLogs({ limit = 100 } = {}) {
  const base = 'id,created_at,kind,question,user_id,ip_hash,ok,ms,model,error,tokens';
  const tail = `&order=created_at.desc&limit=${Math.min(500, limit)}`;
  let r = await rest('ai_logs', { query: `?select=${base},${GEO_COLUMNS.join(',')}${tail}` });
  let geo = true;
  if (!r.ok && missingColumn(r.error)) { geo = false; r = await rest('ai_logs', { query: `?select=${base}${tail}` }); }
  if (!r.ok) return { ok: false, error: r.error, rows: [] };
  return { ok: true, geo, rows: r.data || [] };
}

export async function aiStats() {
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const r = await rest('ai_logs', { query: `?select=kind,ok,ms,tokens,user_id&created_at=gte.${since}&limit=5000` });
  if (!r.ok) return { ok: false, error: r.error };
  const rows = r.data || [];
  const byKind = {};
  let errors = 0, msSum = 0, tokens = 0;
  const users = new Set();
  for (const row of rows) {
    byKind[row.kind] = (byKind[row.kind] || 0) + 1;
    if (!row.ok) errors += 1;
    msSum += Number(row.ms) || 0;
    tokens += Number(row.tokens) || 0;
    if (row.user_id) users.add(row.user_id);
  }
  return { ok: true, last24h: { calls: rows.length, errors, avgMs: rows.length ? Math.round(msSum / rows.length) : 0, tokens, users: users.size, byKind } };
}

// --- datasets on disk (bundled with the deployment) -----------------------------------------
// Literal path.resolve(process.cwd(), '…') calls are what Vercel's file tracer looks for, so the
// JSON files get bundled with the function; keep them spelled out here.
const DATA_FILES = {
  players: path.resolve(process.cwd(), 'src/data/swrtPlayersIndex.json'),
  meta: path.resolve(process.cwd(), 'src/data/swrtGuardianMeta.json'),
  monsters: path.resolve(process.cwd(), 'src/data/allMonsters.json'),
  skills: path.resolve(process.cwd(), 'src/data/monsterSkillsData.json'),
  mdc: path.resolve(process.cwd(), 'src/data/allMdcData.json'),
  patches: path.resolve(process.cwd(), 'src/data/balancePatchAi.json'),
  summaries: path.resolve(process.cwd(), 'src/data/swrtPlayerSummaries.json'),
  cutoffs: path.resolve(process.cwd(), 'src/data/swrtRankCutoffs.json'),
};
function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}
function fileInfo(file) {
  try { const st = fs.statSync(file); return { bytes: st.size, modified: st.mtime.toISOString() }; } catch { return null; }
}

export function datasetReport() {
  const players = readJson(DATA_FILES.players);
  const meta = readJson(DATA_FILES.meta);
  const monsters = readJson(DATA_FILES.monsters);
  const skills = readJson(DATA_FILES.skills);
  const mdc = readJson(DATA_FILES.mdc);
  const patches = readJson(DATA_FILES.patches);
  const summaries = readJson(DATA_FILES.summaries);
  const cutoffs = readJson(DATA_FILES.cutoffs);
  const skillList = Array.isArray(skills) ? skills : Object.values(skills || {});
  const monsterList = Array.isArray(monsters) ? monsters : [];
  const translated = skillList.filter((m) => (m.sk || []).length && (m.sk || []).every((s) => /[฀-๿]/.test(s.descriptionTh || ''))).length;
  const noArt = monsterList.filter((m) => !(m.avatarUrl || m.imageUrl)).length;
  let shards = 0;
  try { shards = fs.readdirSync(path.resolve(process.cwd(), 'public/data/swrt-matches')).filter((f) => f.endsWith('.json')).length; } catch { /* none */ }
  return {
    players: { ...(players?.meta || {}), file: fileInfo(DATA_FILES.players) },
    guardianMeta: { ...(meta?.meta || {}), monsters: Object.keys(meta?.monsters || {}).length, file: fileInfo(DATA_FILES.meta) },
    monsters: { count: monsterList.length, withoutArt: noArt, file: fileInfo(DATA_FILES.monsters) },
    skills: { count: skillList.length, translated, file: fileInfo(DATA_FILES.skills) },
    mdc: { count: Array.isArray(mdc) ? mdc.length : Object.keys(mdc || {}).length, file: fileInfo(DATA_FILES.mdc) },
    patches: { count: Object.keys(patches?.patches || {}).length, updatedAt: patches?.meta?.updatedAt || null, model: patches?.meta?.model || null, file: fileInfo(DATA_FILES.patches) },
    playerSummaries: { count: Object.keys(summaries?.players || {}).length, updatedAt: summaries?.meta?.updatedAt || null, file: fileInfo(DATA_FILES.summaries) },
    cutoffs: { nowTime: cutoffs?.now?.nowTime || null, file: fileInfo(DATA_FILES.cutoffs) },
    matchShards: shards,
  };
}

export function deployInfo() {
  return {
    env: env('VERCEL_ENV') || (process.env.NODE_ENV === 'production' ? 'production' : 'development'),
    commit: (env('VERCEL_GIT_COMMIT_SHA') || '').slice(0, 7),
    branch: env('VERCEL_GIT_COMMIT_REF') || '',
    message: (env('VERCEL_GIT_COMMIT_MESSAGE') || '').slice(0, 120),
    region: env('VERCEL_REGION') || '',
    url: env('VERCEL_URL') || '',
    node: process.version,
    uptimeSec: Math.round(process.uptime()),
  };
}

// --- GitHub Actions -------------------------------------------------------------------------
export function githubInfo() {
  return { configured: Boolean(env('GITHUB_TOKEN')), repo: env('GITHUB_REPO') || 'bravealltime/swm', workflow: env('GITHUB_WORKFLOW') || 'update-swrt-data.yml' };
}

async function gh(pathname, { method = 'GET', body } = {}) {
  const token = env('GITHUB_TOKEN');
  if (!token) return { ok: false, error: 'ไม่มี GITHUB_TOKEN บนเซิร์ฟเวอร์ (fine-grained token สิทธิ์ Actions: read/write)' };
  const { repo } = githubInfo();
  const res = await fetch(`https://api.github.com/repos/${repo}${pathname}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'swm-admin' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return { ok: true, data: null };
  const data = await res.json().catch(() => null);
  return res.ok ? { ok: true, data } : { ok: false, error: data?.message || `GitHub HTTP ${res.status}` };
}

export async function workflowRuns(limit = 8) {
  const { workflow } = githubInfo();
  const r = await gh(`/actions/workflows/${workflow}/runs?per_page=${limit}`);
  if (!r.ok) return r;
  return {
    ok: true,
    runs: (r.data?.workflow_runs || []).map((w) => ({
      id: w.id, status: w.status, conclusion: w.conclusion, event: w.event, createdAt: w.created_at, updatedAt: w.updated_at, url: w.html_url, title: w.display_title,
    })),
  };
}

export async function dispatchWorkflow(inputs = {}, workflowFile) {
  const workflow = workflowFile || githubInfo().workflow;
  return gh(`/actions/workflows/${workflow}/dispatches`, { method: 'POST', body: { ref: 'main', inputs } });
}

/** The hourly job that refreshes live_data without a commit (see .github/workflows/update-live-data.yml). */
export const LIVE_WORKFLOW = 'update-live-data.yml';
