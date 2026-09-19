// Pushes the freshly generated datasets into Supabase `live_data`, where the site reads them through
// /api/live/<key> without a redeploy. Run after the fetch scripts (GitHub Actions does it hourly;
// the nightly job too). Needs SUPABASE_URL (or VITE_SUPABASE_URL) + SUPABASE_SERVICE_ROLE_KEY.
//
//   node scripts/publish_live_data.mjs            # every key in LIVE_SOURCES whose file changed
//   node scripts/publish_live_data.mjs --force    # rewrite all of them
//   node scripts/publish_live_data.mjs rta-cutoffs codes-seed
//
// A key is skipped when the stored document already has the same content hash (kept in
// value._hash), so an hourly run that found nothing new writes nothing and open tabs stay quiet.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const force = args.includes('--force');
const only = args.filter((a) => !a.startsWith('--'));

// mirror of api/_lib/liveData.js LIVE_SOURCES (kept here so the script has no server imports)
const SOURCES = {
  'rta-tierlist': 'src/data/swrtTierList.json',
  'rta-cutoffs': 'src/data/swrtRankCutoffs.json',
  'rta-meta': 'src/data/swrtMetaMonsters.json',
  'guardian-meta': 'src/data/swrtGuardianMeta.json',
  patches: 'src/data/balancePatches.json',
  'patches-ai': 'src/data/balancePatchAi.json',
};

function loadEnvFile() {
  const file = path.join(root, '.env');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
loadEnvFile();
const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
if (!url || !key) {
  console.error('publish_live_data: need SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(2);
}
const schema = process.env.SUPABASE_SCHEMA || 'public';
const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'Accept-Profile': schema, 'Content-Profile': schema };

async function rest(pathname, { method = 'GET', body, prefer } = {}) {
  const res = await fetch(`${url}/rest/v1/${pathname}`, { method, headers: { ...headers, ...(prefer ? { Prefer: prefer } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) throw new Error(`${method} ${pathname} → ${res.status} ${data?.message || String(text).slice(0, 200)}`);
  return data;
}

const hashOf = (value) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 16);

async function publish(k, value, { by = 'workflow' } = {}) {
  const hash = hashOf(value);
  if (!force) {
    const rows = await rest(`live_data?select=key,value&key=eq.${k}&limit=1`);
    if (rows?.[0]?.value?._hash === hash) return 'unchanged';
  }
  const doc = Array.isArray(value) ? { items: value, _hash: hash } : { ...value, _hash: hash };
  await rest('live_data?on_conflict=key', { method: 'POST', body: { key: k, value: doc, updated_at: new Date().toISOString(), updated_by: by }, prefer: 'resolution=merge-duplicates,return=minimal' });
  return 'published';
}

const wanted = only.length ? only : Object.keys(SOURCES);
let changed = 0;
for (const k of wanted) {
  if (k === 'codes-seed') {
    // first-time seed of the admin-owned code list from the bundled module; never overwrites
    const rows = await rest('live_data?select=key&key=eq.codes&limit=1');
    if (rows?.length) { console.log('codes: already live, not seeded'); continue; }
    const mod = await import(path.join(root, 'src/data/promoCodes.js'));
    await publish('codes', { codes: mod.PROMO_CODES, updatedAt: new Date().toISOString() }, { by: 'seed' });
    console.log('codes: seeded from src/data/promoCodes.js');
    changed += 1;
    continue;
  }
  const file = SOURCES[k];
  if (!file) { console.error(`unknown key ${k}`); process.exitCode = 1; continue; }
  const abs = path.join(root, file);
  if (!fs.existsSync(abs)) { console.log(`${k}: ${file} missing, skipped`); continue; }
  const value = JSON.parse(fs.readFileSync(abs, 'utf8'));
  const result = await publish(k, value);
  if (result === 'published') changed += 1;
  console.log(`${k}: ${result} (${(fs.statSync(abs).size / 1024).toFixed(0)} KB)`);
}
console.log(`live data: ${changed} key(s) updated`);
