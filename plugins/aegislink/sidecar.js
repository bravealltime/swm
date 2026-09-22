/**
 * AegisLink sidecar — standalone HTTP API for the SWM website.
 *
 * The user's SWEX build binds its game proxy on the same ports the plugin would use,
 * so the in-plugin HTTP server can never bind. This sidecar runs OUTSIDE SWEX:
 * the plugin (inside SWEX) POSTs every snapshot/delta/guild packet to /ingest here,
 * and this process serves the same API the website expects (status/snapshot/guild/events).
 *
 * State is persisted to disk so the website keeps working across sidecar restarts.
 * Port: 7391 (site default). Bind: 127.0.0.1 only — nothing leaves the machine.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.AEGIS_PORT) || 7391;
const STATE_FILE = path.join(__dirname, 'sidecar-state.json');

const state = {
  account: null,
  accountAt: 0,
  seq: 0,
  guild: {},
  battles: [],
  clients: new Set(),
  startedAt: Date.now(),
};

// --- persistence -----------------------------------------------------------
function loadState() {
  try {
    const raw = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    state.account = raw.account || null;
    state.accountAt = raw.accountAt || 0;
    state.seq = raw.seq || 0;
    state.guild = raw.guild || {};
    state.battles = raw.battles || [];
    console.log(`[sidecar] restored state: seq ${state.seq}, units ${state.account ? state.account.unit_list.length : 0}`);
  } catch { /* first run */ }
}
function saveState() {
  try {
    fs.mkdirSync(__dirname, { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify({
      account: state.account, accountAt: state.accountAt, seq: state.seq, guild: state.guild, battles: state.battles,
    }));
  } catch (err) { console.error('[sidecar] save failed:', err.message); }
}

// --- helpers ----------------------------------------------------------------
function wizardSummary() {
  const w = state.account && state.account.wizard_info;
  return w ? { name: w.wizard_name, level: w.wizard_level, idHint: String(w.wizard_id || '').slice(-4) } : null;
}
function statusBody() {
  return {
    plugin: 'AegisLink', version: '2.1.0+sidecar', seq: state.seq, hasSnapshot: !!state.account, accountAt: state.accountAt,
    wizard: wizardSummary(), units: state.account ? state.account.unit_list.length : 0,
    guildCommands: Object.keys(state.guild), battles: state.battles.length, clients: state.clients.size, uptime: Date.now() - state.startedAt,
  };
}
function applyDelta(account, delta) {
  if (!account || !delta) return;
  const byId = (list, id) => list.findIndex((u) => Number(u.unit_id) === Number(id));
  for (const id of delta.removedUnits || []) { const i = byId(account.unit_list, id); if (i >= 0) account.unit_list.splice(i, 1); }
  for (const id of delta.removedRunes || []) account.runes = account.runes.filter((r) => Number(r.rune_id) !== Number(id));
  for (const id of delta.removedArtifacts || []) account.artifacts = account.artifacts.filter((a) => Number(a.rid) !== Number(id));
  for (const u of delta.units || []) {
    const i = byId(account.unit_list, u.unit_id);
    if (i >= 0) account.unit_list[i] = u; else account.unit_list.push(u);
    const runeIds = new Set((u.runes || []).map((r) => Number(r.rune_id)));
    const artIds = new Set((u.artifacts || []).map((a) => Number(a.rid)));
    account.runes = account.runes.filter((r) => !runeIds.has(Number(r.rune_id)));
    account.artifacts = account.artifacts.filter((a) => !artIds.has(Number(a.rid)));
  }
  for (const r of delta.runes || []) {
    account.runes = account.runes.filter((x) => Number(x.rune_id) !== Number(r.rune_id));
    account.runes.push(r);
  }
  for (const a of delta.artifacts || []) {
    account.artifacts = account.artifacts.filter((x) => Number(x.rid) !== Number(a.rid));
    account.artifacts.push(a);
  }
}

// --- SSE --------------------------------------------------------------------
function broadcast(type, payload) {
  const frame = `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of state.clients) {
    try { res.write(frame); } catch { state.clients.delete(res); }
  }
}

// --- ingest (from the plugin inside SWEX) -----------------------------------
function ingest(body) {
  if (!body || !body.type) return;
  if (body.type === 'snapshot') {
    state.account = body.data;
    state.accountAt = body.at || Date.now();
    state.seq = body.seq || state.seq + 1;
    broadcast('snapshot', { seq: state.seq, at: state.accountAt, data: state.account });
    saveState();
    console.log(`[sidecar] snapshot: ${wizardSummary()?.name || '?'} — ${state.account.unit_list.length} units`);
  } else if (body.type === 'delta') {
    if (!state.account) return;
    applyDelta(state.account, body.delta);
    state.seq = body.seq || state.seq + 1;
    state.accountAt = body.at || Date.now();
    broadcast('delta', { seq: state.seq, at: state.accountAt, command: body.command, delta: body.delta });
    saveState();
  } else if (body.type === 'guild') {
    state.seq = body.seq || state.seq + 1;
    state.guild[body.command] = { req: body.req || {}, resp: body.resp, at: body.at || Date.now() };
    if (/Result/.test(body.command || '')) {
      state.battles.push({ command: body.command, at: body.at, req: body.req, resp: body.resp });
      if (state.battles.length > 100) state.battles.shift();
    }
    broadcast('guild', { seq: state.seq, command: body.command, at: body.at, req: body.req || {}, resp: body.resp });
    saveState();
  }
}

// --- HTTP -------------------------------------------------------------------
const ALLOWED_ORIGINS = [/^https:\/\/swm(-[a-z0-9-]+)?\.vercel\.app$/i, /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i];
function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Private-Network': 'true',
    'Access-Control-Max-Age': '600',
    'Cache-Control': 'no-store',
  };
}
function sendJson(res, headers, status, body) {
  const text = JSON.stringify(body);
  res.writeHead(status, { ...headers, 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(text) });
  res.end(text);
}

loadState();
const server = http.createServer((req, res) => {
  const origin = req.headers.origin;
  const headers = corsHeaders(origin);
  if (req.method === 'OPTIONS') { res.writeHead(204, headers); res.end(); return; }

  // ingest accepts local posts only (the plugin and local tools)
  if (req.method === 'POST' && req.url === '/ingest') {
    if (origin && !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) {
      return sendJson(res, headers, 403, { error: 'local only' });
    }
    let raw = '';
    req.on('data', (c) => { raw += c; if (raw.length > 64e6) req.destroy(); });
    req.on('end', () => {
      try { ingest(JSON.parse(raw || '{}')); sendJson(res, headers, 200, { ok: true, seq: state.seq }); }
      catch (err) { sendJson(res, headers, 400, { error: err.message }); }
    });
    return;
  }

  if (req.method !== 'GET') return sendJson(res, headers, 405, { error: 'method not allowed' });
  if (origin && !ALLOWED_ORIGINS.some((re) => re.test(origin)) && !String(origin).match(/^https?:\/\/(localhost|127\.0\.0\.1)/)) {
    return sendJson(res, headers, 403, { error: 'origin not allowed', origin });
  }
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);

  if (url.pathname === '/' || url.pathname === '/status') return sendJson(res, headers, 200, statusBody());
  if (url.pathname === '/snapshot') {
    if (!state.account) return sendJson(res, headers, 404, { error: 'no account yet — log in to the game with SWEX running' });
    return sendJson(res, headers, 200, { seq: state.seq, at: state.accountAt, data: state.account });
  }
  if (url.pathname === '/guild') return sendJson(res, headers, 200, { seq: state.seq, packets: state.guild, battles: state.battles });
  if (url.pathname === '/events') {
    res.writeHead(200, { ...headers, 'Content-Type': 'text/event-stream; charset=utf-8', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.write('retry: 3000\n\n');
    res.write(`event: hello\ndata: ${JSON.stringify(statusBody())}\n\n`);
    state.clients.add(res);
    const ping = setInterval(() => { try { res.write(': ping\n\n'); } catch { /* closed */ } }, 20000);
    req.on('close', () => { clearInterval(ping); state.clients.delete(res); });
    return;
  }
  sendJson(res, headers, 404, { error: 'not found' });
});

server.on('error', (err) => { console.error(`[sidecar] server error on port ${PORT}:`, err.message); process.exit(1); });
server.listen(PORT, '127.0.0.1', () => console.log(`[sidecar] AegisLink API ready on http://127.0.0.1:${PORT}`));
