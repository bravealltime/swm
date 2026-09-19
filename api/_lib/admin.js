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
  if (!url || !key) return { ok: false, status: 0, error: 'ไม่มี SUPABASE_SERVICE_ROLE_KEY บนเซิร์ฟเวอร์', data: null };
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
const ipHash = (ip) => (ip ? crypto.createHash('sha256').update(String(ip)).digest('hex').slice(0, 16) : null);

/** Fire-and-forget; never throws. */
export function logAiCall({ kind, question, userId, ip, ok, ms, model, error, tokens }) {
  if (!serviceKey()) return;
  const row = {
    kind: String(kind || 'unknown').slice(0, 20),
    question: question ? String(question).slice(0, 300) : null,
    user_id: userId || null,
    ip_hash: ipHash(ip),
    ok: Boolean(ok),
    ms: Number(ms) || 0,
    model: model ? String(model).slice(0, 60) : null,
    error: error ? String(error).slice(0, 200) : null,
    tokens: Number(tokens) || null,
  };
  rest('ai_logs', { method: 'POST', body: row }).catch(() => {});
}

export async function aiLogs({ limit = 100 } = {}) {
  const r = await rest('ai_logs', { query: `?select=id,created_at,kind,question,user_id,ok,ms,model,error,tokens&order=created_at.desc&limit=${Math.min(500, limit)}` });
  if (!r.ok) return { ok: false, error: r.error, rows: [] };
  return { ok: true, rows: r.data || [] };
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
function readJson(rel) {
  try { return JSON.parse(fs.readFileSync(path.resolve(process.cwd(), rel), 'utf8')); } catch { return null; }
}
function fileInfo(rel) {
  try { const st = fs.statSync(path.resolve(process.cwd(), rel)); return { bytes: st.size, modified: st.mtime.toISOString() }; } catch { return null; }
}

export function datasetReport() {
  const players = readJson('src/data/swrtPlayersIndex.json');
  const meta = readJson('src/data/swrtGuardianMeta.json');
  const monsters = readJson('src/data/allMonsters.json');
  const skills = readJson('src/data/monsterSkillsData.json');
  const mdc = readJson('src/data/allMdcData.json');
  const patches = readJson('src/data/balancePatchAi.json');
  const summaries = readJson('src/data/swrtPlayerSummaries.json');
  const cutoffs = readJson('src/data/swrtRankCutoffs.json');
  const skillList = Array.isArray(skills) ? skills : Object.values(skills || {});
  const monsterList = Array.isArray(monsters) ? monsters : [];
  const translated = skillList.filter((m) => (m.sk || []).length && (m.sk || []).every((s) => /[฀-๿]/.test(s.descriptionTh || ''))).length;
  const noArt = monsterList.filter((m) => !(m.avatarUrl || m.imageUrl)).length;
  let shards = 0;
  try { shards = fs.readdirSync(path.resolve(process.cwd(), 'public/data/swrt-matches')).filter((f) => f.endsWith('.json')).length; } catch { /* none */ }
  return {
    players: { ...(players?.meta || {}), file: fileInfo('src/data/swrtPlayersIndex.json') },
    guardianMeta: { ...(meta?.meta || {}), monsters: Object.keys(meta?.monsters || {}).length, file: fileInfo('src/data/swrtGuardianMeta.json') },
    monsters: { count: monsterList.length, withoutArt: noArt, file: fileInfo('src/data/allMonsters.json') },
    skills: { count: skillList.length, translated, file: fileInfo('src/data/monsterSkillsData.json') },
    mdc: { count: Array.isArray(mdc) ? mdc.length : Object.keys(mdc || {}).length, file: fileInfo('src/data/allMdcData.json') },
    patches: { count: Object.keys(patches?.patches || {}).length, updatedAt: patches?.meta?.updatedAt || null, model: patches?.meta?.model || null, file: fileInfo('src/data/balancePatchAi.json') },
    playerSummaries: { count: Object.keys(summaries?.players || {}).length, updatedAt: summaries?.meta?.updatedAt || null, file: fileInfo('src/data/swrtPlayerSummaries.json') },
    cutoffs: { nowTime: cutoffs?.now?.nowTime || null, file: fileInfo('src/data/swrtRankCutoffs.json') },
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

export async function dispatchWorkflow(inputs = {}) {
  const { workflow } = githubInfo();
  return gh(`/actions/workflows/${workflow}/dispatches`, { method: 'POST', body: { ref: 'main', inputs } });
}
