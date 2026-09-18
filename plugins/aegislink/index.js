/**
 * ============================================================================
 * AegisLink - Real-time account & guild relay plugin for SWEX
 * Developed for SWM (Summoners War Master) — https://swm-blue.vercel.app
 *
 * What it does
 *  1. Keeps the full account (HubUserLogin) in memory and applies every rune /
 *     artifact / monster change the game sends afterwards, so the state is
 *     always current — no re-login, no export file needed.
 *  2. Runs a tiny HTTP server on 127.0.0.1 (default port 7391) that the SWM
 *     website connects to: GET /snapshot for the whole box, GET /events for a
 *     live stream (Server-Sent Events) of changes and guild / siege packets.
 *  3. Optionally relays battle summaries to a custom endpoint (legacy mode).
 *
 * Only browser tabs from allowed origins (the SWM site and localhost) may read
 * the data; nothing leaves your computer unless you set endpointUrl.
 * ============================================================================
 */

const http = require('http');
const https = require('https');

const pluginName = 'AegisLink';
const version = '2.0.0';

const DEFAULT_PORT = 7391;
const ALLOWED_ORIGINS = [/^https:\/\/swm(-[a-z0-9-]+)?\.vercel\.app$/i, /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i];

// Guild / siege / world-guild-battle packets the website wants to see raw
const GUILD_COMMANDS = /^(GetGuildInfo|GetGuildMemberList|GetGuildSiege|GetServerGuildWar|BattleGuildSiege|BattleServerGuildWar|GetGuildWar|BattleGuildWar|GetGuildMaze|GetGuildRanking)/;
// Commands that sell / remove things: their request lists the ids that disappear
const REMOVE_COMMANDS = /^(Sell|Sacrifice|Delete|Remove|Unequip)/i;

// ---------------------------------------------------------------------------
// In-memory state
// ---------------------------------------------------------------------------
const state = {
  account: null,        // last HubUserLogin response, kept current by applyDelta()
  accountAt: 0,
  seq: 0,               // bumps on every change, lets clients detect gaps
  guild: {},            // latest packet per guild command: { req, resp, at }
  battles: [],          // last siege / WGB battle results
  clients: new Set(),   // SSE responses
  server: null,
  port: DEFAULT_PORT,
  startedAt: Date.now(),
  log: null,
};

const activeSessions = new Map();
const seenPackets = new WeakSet(); // a packet may arrive via both the named event and 'apiCommand'

function log(type, message) {
  if (state.log) state.log({ type, source: 'plugin', name: pluginName, message: `[AegisLink] ${message}` });
}

// ---------------------------------------------------------------------------
// Account merge helpers
// ---------------------------------------------------------------------------
const asArray = (v) => (Array.isArray(v) ? v : v && typeof v === 'object' ? Object.values(v) : []);

function unitRunes(unit) {
  if (!Array.isArray(unit.runes)) unit.runes = asArray(unit.runes);
  return unit.runes;
}
function unitArtifacts(unit) {
  if (!Array.isArray(unit.artifacts)) unit.artifacts = asArray(unit.artifacts);
  return unit.artifacts;
}

function findUnit(account, unitId) {
  const id = Number(unitId);
  return account.unit_list.find((u) => Number(u.unit_id) === id) || null;
}

/** Drop a rune from the inventory and from every unit (it gets re-placed by upsertRune). */
function detachRune(account, runeId) {
  const id = Number(runeId);
  account.runes = asArray(account.runes).filter((r) => Number(r.rune_id) !== id);
  for (const u of account.unit_list) {
    const list = unitRunes(u);
    const i = list.findIndex((r) => Number(r.rune_id) === id);
    if (i >= 0) list.splice(i, 1);
  }
}

function detachArtifact(account, artifactId) {
  const id = Number(artifactId);
  account.artifacts = asArray(account.artifacts).filter((a) => Number(a.rid) !== id);
  for (const u of account.unit_list) {
    const list = unitArtifacts(u);
    const i = list.findIndex((a) => Number(a.rid) === id);
    if (i >= 0) list.splice(i, 1);
  }
}

/** occupied_type 1 = equipped on occupied_id, anything else = inventory. */
function upsertRune(account, rune, delta) {
  if (!rune || !rune.rune_id) return;
  detachRune(account, rune.rune_id);
  const unit = Number(rune.occupied_type) === 1 ? findUnit(account, rune.occupied_id) : null;
  if (unit) {
    const list = unitRunes(unit);
    const slotIdx = list.findIndex((r) => Number(r.slot_no) === Number(rune.slot_no));
    if (slotIdx >= 0) { delta.removedRunes.push(Number(list[slotIdx].rune_id)); list.splice(slotIdx, 1); }
    list.push(rune);
  } else {
    account.runes.push(rune);
  }
  delta.runes.push(rune);
}

function upsertArtifact(account, art, delta) {
  if (!art || !art.rid) return;
  detachArtifact(account, art.rid);
  const unit = Number(art.occupied_type) === 1 ? findUnit(account, art.occupied_id) : null;
  if (unit) {
    const list = unitArtifacts(unit);
    const sameSlot = list.findIndex((a) => Number(a.slot) === Number(art.slot));
    if (sameSlot >= 0) { delta.removedArtifacts.push(Number(list[sameSlot].rid)); list.splice(sameSlot, 1); }
    list.push(art);
  } else {
    account.artifacts.push(art);
  }
  delta.artifacts.push(art);
}

/** A unit object from the server is authoritative: its runes/artifacts leave the inventory. */
function upsertUnit(account, unit, delta) {
  if (!unit || !unit.unit_id || !unit.unit_master_id) return;
  unitRunes(unit);
  unitArtifacts(unit);
  const id = Number(unit.unit_id);
  const idx = account.unit_list.findIndex((u) => Number(u.unit_id) === id);
  if (idx >= 0) account.unit_list[idx] = unit; else account.unit_list.push(unit);
  const runeIds = new Set(unit.runes.map((r) => Number(r.rune_id)));
  const artIds = new Set(unit.artifacts.map((a) => Number(a.rid)));
  account.runes = asArray(account.runes).filter((r) => !runeIds.has(Number(r.rune_id)));
  account.artifacts = asArray(account.artifacts).filter((a) => !artIds.has(Number(a.rid)));
  delta.units.push(unit);
}

function removeUnit(account, unitId, delta) {
  const id = Number(unitId);
  const idx = account.unit_list.findIndex((u) => Number(u.unit_id) === id);
  if (idx >= 0) { account.unit_list.splice(idx, 1); delta.removedUnits.push(id); }
}

/**
 * Apply whatever a response carries (unit_info, unit_list, rune, runes, artifact, artifacts)
 * to the account, plus removals named in the request. Returns the delta or null.
 */
function applyDelta(account, command, req, resp) {
  if (!account || !resp || typeof resp !== 'object') return null;
  const delta = { units: [], removedUnits: [], runes: [], removedRunes: [], artifacts: [], removedArtifacts: [] };

  for (const key of ['unit_list', 'unit_info_list', 'updated_unit_list']) for (const u of asArray(resp[key])) upsertUnit(account, u, delta);
  if (resp.unit_info && resp.unit_info.unit_id) upsertUnit(account, resp.unit_info, delta);
  for (const key of ['runes', 'rune_list', 'updated_rune_list']) for (const r of asArray(resp[key])) upsertRune(account, r, delta);
  if (resp.rune && resp.rune.rune_id) upsertRune(account, resp.rune, delta);
  for (const key of ['artifacts', 'artifact_list']) for (const a of asArray(resp[key])) upsertArtifact(account, a, delta);
  if (resp.artifact && resp.artifact.rid) upsertArtifact(account, resp.artifact, delta);

  if (REMOVE_COMMANDS.test(command) && req) {
    for (const id of asArray(req.rune_id_list)) { detachRune(account, id); delta.removedRunes.push(Number(id)); }
    if (req.rune_id && /Rune/.test(command)) { detachRune(account, req.rune_id); delta.removedRunes.push(Number(req.rune_id)); }
    for (const id of [...asArray(req.artifact_id_list), ...asArray(req.artifact_ids)]) { detachArtifact(account, id); delta.removedArtifacts.push(Number(id)); }
    if (/Unit/.test(command)) {
      for (const id of [...asArray(req.unit_id_list), ...asArray(req.source_unit_list).map((u) => (u && u.unit_id) || u)]) removeUnit(account, id, delta);
      if (req.unit_id && /^(Sell|Sacrifice)/.test(command)) removeUnit(account, req.unit_id, delta);
    }
  }
  // the server also tells us which runes vanished (grind/gem consumption, reappraisal)
  for (const id of [...asArray(resp.removed_rune_id_list), ...asArray(resp.deleted_rune_id_list)]) { detachRune(account, id); delta.removedRunes.push(Number(id)); }

  const changed = Object.values(delta).some((l) => l.length);
  return changed ? delta : null;
}

// ---------------------------------------------------------------------------
// Local live server (SSE)
// ---------------------------------------------------------------------------
function originAllowed(origin, cfg) {
  if (!origin) return true; // same-machine tools (curl) — no browser origin
  if (ALLOWED_ORIGINS.some((re) => re.test(origin))) return true;
  const extra = String(cfg.allowedOrigins || '').split(',').map((s) => s.trim()).filter(Boolean);
  return extra.includes(origin);
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

function broadcast(type, payload) {
  const frame = `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of state.clients) {
    try { res.write(frame); } catch { state.clients.delete(res); }
  }
}

function wizardSummary() {
  const w = state.account && state.account.wizard_info;
  return w ? { name: w.wizard_name, level: w.wizard_level, idHint: String(w.wizard_id || '').slice(-4) } : null;
}

function statusBody() {
  return {
    plugin: pluginName, version, seq: state.seq, hasSnapshot: !!state.account, accountAt: state.accountAt,
    wizard: wizardSummary(), units: state.account ? state.account.unit_list.length : 0,
    guildCommands: Object.keys(state.guild), battles: state.battles.length, clients: state.clients.size, uptime: Date.now() - state.startedAt,
  };
}

function startServer(cfg) {
  const port = Number(cfg.livePort) || DEFAULT_PORT;
  state.port = port;
  const server = http.createServer((req, res) => {
    const origin = req.headers.origin;
    const headers = corsHeaders(origin);
    if (req.method === 'OPTIONS') { res.writeHead(204, headers); res.end(); return; }
    if (!originAllowed(origin, cfg)) { sendJson(res, headers, 403, { error: 'origin not allowed', origin }); return; }
    const url = new URL(req.url, `http://127.0.0.1:${port}`);

    if (url.pathname === '/' || url.pathname === '/status') return sendJson(res, headers, 200, statusBody());

    if (url.pathname === '/snapshot') {
      if (!state.account) return sendJson(res, headers, 404, { error: 'no account yet — log in to the game with SWEX running' });
      return sendJson(res, headers, 200, { seq: state.seq, at: state.accountAt, data: state.account });
    }

    if (url.pathname === '/guild') return sendJson(res, headers, 200, { seq: state.seq, packets: state.guild, battles: state.battles });

    if (url.pathname === '/events') {
      res.writeHead(200, { ...headers, 'Content-Type': 'text/event-stream; charset=utf-8', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
      res.write(`retry: 3000\n\n`);
      res.write(`event: hello\ndata: ${JSON.stringify(statusBody())}\n\n`);
      state.clients.add(res);
      const ping = setInterval(() => { try { res.write(': ping\n\n'); } catch { /* closed */ } }, 20000);
      req.on('close', () => { clearInterval(ping); state.clients.delete(res); });
      return;
    }

    sendJson(res, headers, 404, { error: 'not found' });
  });
  server.on('error', (err) => log('error', `live server error on port ${port}: ${err.message} (change livePort in the plugin settings)`));
  server.listen(port, '127.0.0.1', () => log('success', `live server ready on http://127.0.0.1:${port} — open SWM › กล่องของฉัน and press "เชื่อมต่อ SWEX"`));
  state.server = server;
}

// ---------------------------------------------------------------------------
// Optional legacy relay (POST summaries to your own endpoint)
// ---------------------------------------------------------------------------
function sendPayload(endpointUrl, apiKey, action, payload) {
  if (!endpointUrl) return;
  try {
    const urlObj = new URL(endpointUrl);
    const postData = JSON.stringify({ plugin: pluginName, version, apiKey: apiKey || 'ANONYMOUS_SWM_RELAY', action, timestamp: Date.now(), data: payload });
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    const req = client.request({
      hostname: urlObj.hostname, port: urlObj.port || (isHttps ? 443 : 80), path: urlObj.pathname + urlObj.search, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData), 'User-Agent': `AegisLink/${version}` }, timeout: 10000,
    }, (res) => { res.resume(); });
    req.on('error', (err) => log('warning', `relay notice: ${err.message}`));
    req.write(postData);
    req.end();
  } catch (err) {
    log('error', `relay error: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------
module.exports = {
  pluginName,
  version,
  pluginDescription: 'AegisLink: ส่งกล่องมอนสเตอร์/รูน/อาร์ติแฟกต์ และข้อมูลกิลด์/Siege ไปยังเว็บ SWM แบบเรียลไทม์ (ทำงานเฉพาะในเครื่องคุณ)',

  defaultConfig: {
    enabled: true,
    livePort: DEFAULT_PORT,
    syncAccount: true,
    syncGuild: true,
    allowedOrigins: '',
    endpointUrl: '',
    apiKey: '',
    log3MDC: true,
    logSiege: true,
    logGuildWar: true,
    logDungeonDrops: false,
  },

  defaultConfigDetails: {
    livePort: { label: 'พอร์ตเซิร์ฟเวอร์ในเครื่อง (ค่าเริ่มต้น 7391) — เว็บ SWM เชื่อมต่อที่ http://127.0.0.1:พอร์ต' },
    syncAccount: { label: 'ส่งกล่องมอนสเตอร์ / รูน / อาร์ติแฟกต์ แบบเรียลไทม์ (อัปเดตทันทีที่เปลี่ยนรูนในเกม)' },
    syncGuild: { label: 'ส่งข้อมูลกิลด์ / Siege / World Guild Battle แบบเรียลไทม์' },
    allowedOrigins: { label: 'เว็บอื่นที่อนุญาตให้อ่านข้อมูล (คั่นด้วยจุลภาค) — ปกติเว้นว่าง' },
    endpointUrl: { label: '(ไม่บังคับ) URL สำหรับส่งสรุปผลการรบไปเซิร์ฟเวอร์ของคุณเอง' },
    apiKey: { label: '(ไม่บังคับ) รหัสสำหรับ endpointUrl' },
    log3MDC: { label: 'บันทึกคู่ทีมบุก/ตั้งรับ 3 ตัว (3MDC) จาก Siege' },
    logSiege: { label: 'บันทึกผล Siege Battle' },
    logGuildWar: { label: 'บันทึกผล World Guild Battle' },
    logDungeonDrops: { label: 'ส่งผลดรอปดันเจี้ยนไป endpointUrl' },
  },

  init(proxy, config) {
    const cfg = { ...this.defaultConfig, ...(config.Config.Plugins[pluginName] || {}) };
    state.log = (entry) => proxy.log(entry);
    if (!cfg.enabled) { log('info', 'disabled'); return; }

    startServer(cfg);
    log('success', `v${version} ready — listening for account, rune and guild packets`);

    const handle = (req, resp) => {
      if (!resp || typeof resp !== 'object' || seenPackets.has(resp)) return;
      seenPackets.add(resp);
      try {
        this.processPacket(req && req.command ? req.command : (resp.command || ''), cfg, req || {}, resp);
      } catch (err) {
        log('error', `error processing ${req && req.command}: ${err.message}`);
      }
    };
    // SWEX emits every decoded packet as 'apiCommand'; the named events are a fallback for older builds
    proxy.on('apiCommand', handle);
    ['HubUserLogin', 'GetGuildSiegeMatchupInfo', 'BattleGuildSiegeStart_v2', 'BattleGuildSiegeResult', 'GetServerGuildWarMatchInfo',
      'BattleServerGuildWarStart', 'BattleServerGuildWarResult', 'BattleServerGuildWarRoundResult', 'BattleDungeonResult_v2', 'BattleRiftDungeonResult',
      'UpgradeRune', 'AmplifyRune', 'ConfirmRune', 'ReappraiseRune', 'EquipRune', 'UnequipRune', 'SellRuneBatch', 'SellRune', 'EquipRuneList',
      'UpgradeArtifact', 'SellArtifacts', 'EquipArtifact', 'UnequipArtifact', 'GetGuildInfo', 'GetGuildSiegeBaseDefenseUnitList', 'GetGuildSiegeBattleLog',
      'GetGuildSiegeBattleLogByWizardId', 'GetGuildSiegeRankingInfo', 'UpgradeUnit', 'AwakenUnit', 'SacrificeUnit', 'SellUnit', 'ChangeUnitAttribute',
    ].forEach((c) => proxy.on(c, handle));
  },

  processPacket(command, cfg, req, resp) {
    const wizardId = req.wizard_id || (resp.wizard_info && resp.wizard_info.wizard_id);

    // 1. Full account on login — becomes the live snapshot
    if (command === 'HubUserLogin' && Array.isArray(resp.unit_list)) {
      if (cfg.syncAccount) {
        state.account = resp;
        state.account.runes = asArray(resp.runes);
        state.account.artifacts = asArray(resp.artifacts);
        for (const u of state.account.unit_list) { unitRunes(u); unitArtifacts(u); }
        state.accountAt = Date.now();
        state.seq += 1;
        log('success', `account captured: ${resp.wizard_info && resp.wizard_info.wizard_name} — ${resp.unit_list.length} monsters, ${state.account.runes.length} spare runes`);
        broadcast('snapshot', { seq: state.seq, at: state.accountAt, data: state.account });
      }
      if (resp.guild && cfg.syncGuild) {
        state.guild.GetGuildInfo = { req: {}, resp: { guild: resp.guild }, at: Date.now() };
        broadcast('guild', { seq: state.seq, command: 'GetGuildInfo', at: Date.now(), req: {}, resp: { guild: resp.guild } });
      }
      return;
    }

    // 2. Incremental account changes (rune upgrades, equips, sells, awakenings...)
    if (cfg.syncAccount && state.account) {
      const delta = applyDelta(state.account, command, req, resp);
      if (delta) {
        state.seq += 1;
        state.accountAt = Date.now();
        broadcast('delta', { seq: state.seq, at: state.accountAt, command, delta });
      }
    }

    // 3. Guild / siege / WGB packets, raw
    if (cfg.syncGuild && GUILD_COMMANDS.test(command)) {
      const at = Date.now();
      state.guild[command] = { req, resp, at };
      if (/Result/.test(command)) {
        state.battles.push({ command, at, req, resp });
        if (state.battles.length > 100) state.battles.shift();
      }
      state.seq += 1;
      broadcast('guild', { seq: state.seq, command, at, req, resp });
    }

    // 4. Legacy relay of battle summaries
    if (command === 'BattleGuildSiegeStart_v2' && cfg.logSiege) {
      activeSessions.set(`${wizardId}_siege`, {
        wizardId, battleType: 'Siege', timestamp: Date.now(),
        defenseUnits: asArray(req.defense_unit_list).map((u) => u.unit_master_id || u),
        offenseUnits: asArray(req.unit_id_list).map((u) => u.unit_master_id || u),
      });
    }
    if (command === 'BattleGuildSiegeResult' && cfg.logSiege) {
      const session = activeSessions.get(`${wizardId}_siege`);
      if (session) {
        const record = { ...session, result: resp.win_lose === 1 ? 'WIN' : 'LOSE', winLoseCode: resp.win_lose, completedAt: Date.now() };
        sendPayload(cfg.endpointUrl, cfg.apiKey, 'SIEGE_BATTLE_LOG', record);
        if (cfg.log3MDC && session.defenseUnits.length === 3 && session.offenseUnits.length === 3) {
          sendPayload(cfg.endpointUrl, cfg.apiKey, '3MDC_COUNTER_LOG', { defense: session.defenseUnits, counter: session.offenseUnits, win: resp.win_lose === 1, battleType: 'Siege' });
        }
        activeSessions.delete(`${wizardId}_siege`);
      }
    }
    if ((command === 'BattleServerGuildWarResult' || command === 'BattleServerGuildWarRoundResult') && cfg.logGuildWar) {
      sendPayload(cfg.endpointUrl, cfg.apiKey, 'WGB_BATTLE_LOG', { wizardId, battleType: 'WorldGuildWar', winLoseCode: resp.win_lose, timestamp: Date.now() });
    }
    if ((command === 'BattleDungeonResult_v2' || command === 'BattleRiftDungeonResult') && cfg.logDungeonDrops) {
      sendPayload(cfg.endpointUrl, cfg.apiKey, 'DUNGEON_DROP_LOG', {
        wizardId, dungeonId: req.dungeon_id, stageId: req.stage_id, clearTimeSec: resp.clear_time ? resp.clear_time.current_time / 1000 : null,
        win: resp.win_lose === 1, rewards: resp.reward || null, timestamp: Date.now(),
      });
    }
  },
};

// Exposed for tests (node scripts) — not used by SWEX
module.exports._internal = { applyDelta, state, asArray };
