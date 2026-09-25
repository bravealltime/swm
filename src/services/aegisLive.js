// Live link to the AegisLink SWEX plugin running on this computer (http://127.0.0.1:<port>).
// The plugin keeps the full account current and streams changes; here we mirror the raw
// account, re-parse it into the box shape on every change, persist it and notify listeners.
import { parseSwexExport } from '../utils/swexImport';
import { saveBox } from '../utils/boxStorage';
import { parseRankingPacket, kindFromCommand, serverFromCountry } from '../utils/guildRankings';
import { evaluateRune } from '../utils/runeEvaluator';
import { playLegendAlertSound, playDropSound } from '../utils/soundEffects';

export const DEFAULT_PORT = 7391;
const ENABLED_KEY = 'swm:aegis-live';
const PORT_KEY = 'swm:aegis-port';

const listeners = new Set();
let es = null;
let raw = null; // the account exactly as the game sent it, kept current by applyDelta()
let retryTimer = null;
let failures = 0; // consecutive connection errors; after a few we back off to a 30 s retry

const state = {
  status: 'off', // off | connecting | live | error
  error: '',
  seq: 0,
  wizard: null,
  units: 0,
  lastEventAt: 0,
  lastCommand: '',
  events: 0,
  guild: { packets: {}, battles: [] },
  rankings: {}, // kind -> { rows, at, server, shared, error } from in-game ranking screens
  dungeons: [], // list of recent runs with evaluated runes
  summons: [],  // list of recent summons
  liveAlert: null, // latest high-priority alert (Nat 5 or 6★ Legend)
  port: DEFAULT_PORT,
  recent: [], // last events for the plugin page console: { at, kind, text }
};
function note(kind, text) {
  state.recent = [{ at: Date.now(), kind, text }, ...state.recent].slice(0, 40);
}

export function getState() { return state; }
export function isEnabled() { try { return localStorage.getItem(ENABLED_KEY) === '1'; } catch { return false; } }
export function getPort() { try { return Number(localStorage.getItem(PORT_KEY)) || DEFAULT_PORT; } catch { return DEFAULT_PORT; } }
export function setPort(p) { try { localStorage.setItem(PORT_KEY, String(Number(p) || DEFAULT_PORT)); } catch { /* ignore */ } }
export const baseUrl = () => `http://127.0.0.1:${getPort()}`;

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function emit(type, payload) {
  for (const fn of listeners) { try { fn(type, payload, state); } catch (err) { console.warn('aegisLive listener failed', err); } }
}
function patch(next) { Object.assign(state, next); emit('state', state); }

// --- raw account merge (same rules as the plugin) ----------------------------------------
const asArray = (v) => (Array.isArray(v) ? v : v && typeof v === 'object' ? Object.values(v) : []);
const runesOf = (u) => { if (!Array.isArray(u.runes)) u.runes = asArray(u.runes); return u.runes; };
const artsOf = (u) => { if (!Array.isArray(u.artifacts)) u.artifacts = asArray(u.artifacts); return u.artifacts; };
const findUnit = (id) => raw.unit_list.find((u) => Number(u.unit_id) === Number(id)) || null;

function detachRune(id) {
  raw.runes = asArray(raw.runes).filter((r) => Number(r.rune_id) !== Number(id));
  for (const u of raw.unit_list) { const l = runesOf(u); const i = l.findIndex((r) => Number(r.rune_id) === Number(id)); if (i >= 0) l.splice(i, 1); }
}
function detachArtifact(id) {
  raw.artifacts = asArray(raw.artifacts).filter((a) => Number(a.rid) !== Number(id));
  for (const u of raw.unit_list) { const l = artsOf(u); const i = l.findIndex((a) => Number(a.rid) === Number(id)); if (i >= 0) l.splice(i, 1); }
}
function applyDelta(delta) {
  if (!raw || !delta) return;
  for (const id of delta.removedUnits || []) { const i = raw.unit_list.findIndex((u) => Number(u.unit_id) === Number(id)); if (i >= 0) raw.unit_list.splice(i, 1); }
  for (const unit of delta.units || []) {
    runesOf(unit); artsOf(unit);
    const i = raw.unit_list.findIndex((u) => Number(u.unit_id) === Number(unit.unit_id));
    if (i >= 0) raw.unit_list[i] = unit; else raw.unit_list.push(unit);
    const rIds = new Set(unit.runes.map((r) => Number(r.rune_id)));
    const aIds = new Set(unit.artifacts.map((a) => Number(a.rid)));
    raw.runes = asArray(raw.runes).filter((r) => !rIds.has(Number(r.rune_id)));
    raw.artifacts = asArray(raw.artifacts).filter((a) => !aIds.has(Number(a.rid)));
  }
  for (const id of delta.removedRunes || []) detachRune(id);
  for (const rune of delta.runes || []) {
    detachRune(rune.rune_id);
    const unit = Number(rune.occupied_type) === 1 ? findUnit(rune.occupied_id) : null;
    if (unit) { const l = runesOf(unit); const i = l.findIndex((r) => Number(r.slot_no) === Number(rune.slot_no)); if (i >= 0) l.splice(i, 1); l.push(rune); }
    else raw.runes.push(rune);
  }
  for (const id of delta.removedArtifacts || []) detachArtifact(id);
  for (const art of delta.artifacts || []) {
    detachArtifact(art.rid);
    const unit = Number(art.occupied_type) === 1 ? findUnit(art.occupied_id) : null;
    if (unit) { const l = artsOf(unit); const i = l.findIndex((a) => Number(a.slot) === Number(art.slot)); if (i >= 0) l.splice(i, 1); l.push(art); }
    else raw.artifacts.push(art);
  }
}

function publishBox(command) {
  if (!raw) return;
  const box = parseSwexExport(raw);
  box.source = { name: 'AegisLink (SWEX)', modified: Date.now(), auto: true, live: true, command };
  saveBox(box);
  note('box', command === 'snapshot' ? `รับกล่องทั้งหมด: ${box.wizard?.name} — ${box.units.length} ตัว, รูน ${box.runes?.length || 0} ใบ` : `อัปเดตกล่องจาก ${command}`);
  patch({ wizard: box.wizard, units: box.units.length, lastEventAt: Date.now(), lastCommand: command || 'snapshot', events: state.events + 1 });
  emit('box', box);
}

// --- guild leaderboards seen in-game → shared with everyone through /api/guild-rankings ---
async function sessionToken() {
  try {
    const { getSupabase } = await import('./supabaseClient');
    const supabase = await getSupabase();
    const { data } = (await supabase?.auth.getSession()) || {};
    return data?.session?.access_token || '';
  } catch {
    return '';
  }
}

async function shareRankings(kind) {
  const entry = state.rankings[kind];
  if (!entry || entry.shared) return;
  const token = await sessionToken();
  if (!token) { entry.error = 'เข้าสู่ระบบเพื่อแชร์อันดับนี้ให้ทุกคนเห็น'; emit('rankings', state.rankings); return; }
  try {
    const res = await fetch('/api/guild-rankings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ server: entry.server, kind, rows: entry.rows, note: `AegisLink ${state.wizard?.name || ''}`.trim() }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    entry.shared = true; entry.error = '';
    note('guild', `แชร์อันดับกิลด์ ${kind} (${entry.server}) ให้ทุกคนแล้ว`);
  } catch (err) {
    entry.error = err.message;
  }
  emit('rankings', state.rankings);
}

function handleRankingPacket(command, resp, at) {
  const rows = parseRankingPacket(command, resp);
  if (!rows || rows.length < 3) return;
  const kind = kindFromCommand(command);
  const server = serverFromCountry(state.wizard?.country);
  const prev = state.rankings[kind];
  if (prev && prev.at === at) return;
  state.rankings = { ...state.rankings, [kind]: { rows, at: at || Date.now(), server, shared: false, error: '' } };
  note('guild', `อันดับกิลด์ ${kind}: ${rows.length} กิลด์ (เซิร์ฟเวอร์ ${server})`);
  emit('rankings', state.rankings);
  shareRankings(kind);
}

// --- connection ---------------------------------------------------------------------------
async function fetchJson(path) {
  const res = await fetch(`${baseUrl()}${path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`);
  return res.json();
}

async function loadInitial() {
  const [snap, guild] = await Promise.all([
    fetchJson('/snapshot').catch(() => null), // 404 until the game has been logged in
    fetchJson('/guild').catch(() => null),
  ]);
  if (snap?.data) { raw = snap.data; state.seq = snap.seq || 0; publishBox('snapshot'); }
  else patch({ wizard: null, units: 0 });
  if (guild) {
    state.guild = { packets: guild.packets || {}, battles: guild.battles || [] };
    emit('guild', state.guild);
    for (const [command, p] of Object.entries(state.guild.packets)) if (/Rank/i.test(command)) handleRankingPacket(command, p.resp, p.at);
  }
}

export async function fetchLiveSnapshot() {
  try {
    const snap = await fetchJson('/snapshot');
    if (snap?.data) {
      raw = snap.data;
      state.seq = snap.seq || 0;
      publishBox('snapshot');
      return { success: true, box: parseSwexExport(raw) };
    }
    return { success: false, error: 'ยังไม่มี snapshot ในปลั๊กอิน (ต้องเข้าเกมขณะเปิด SWEX)' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export function dismissLiveAlert() {
  patch({ liveAlert: null });
}

export function start() {
  if (es) return;
  try { localStorage.setItem(ENABLED_KEY, '1'); } catch { /* ignore */ }
  clearTimeout(retryTimer);
  failures = 0;
  patch({ status: 'connecting', error: '', port: getPort() });
  let source;
  try {
    source = new EventSource(`${baseUrl()}/events`);
  } catch (err) {
    patch({ status: 'error', error: err.message });
    return;
  }
  es = source;
  source.addEventListener('hello', async (ev) => {
    if (es !== source) return;
    try {
      const hello = JSON.parse(ev.data);
      failures = 0;
      note('link', `เชื่อมต่อปลั๊กอิน v${hello.version || '?'} ที่ 127.0.0.1:${getPort()}${hello.hasSnapshot ? '' : ' — ยังไม่มีกล่อง (รอเข้าเกม)'}`);
      patch({ status: 'live', error: '', seq: hello.seq || 0 });
      await loadInitial();
    } catch (err) {
      patch({ status: 'error', error: err.message });
    }
  });
  source.addEventListener('snapshot', (ev) => {
    if (es !== source) return;
    const msg = JSON.parse(ev.data);
    raw = msg.data; state.seq = msg.seq; publishBox('snapshot');
  });
  source.addEventListener('delta', (ev) => {
    if (es !== source) return;
    const msg = JSON.parse(ev.data);
    if (raw && msg.seq === state.seq + 1) { state.seq = msg.seq; applyDelta(msg.delta); publishBox(msg.command); }
    else loadInitial().catch(() => {}); // missed something (or no snapshot yet) — resync
  });
  source.addEventListener('guild', (ev) => {
    if (es !== source) return;
    const msg = JSON.parse(ev.data);
    state.seq = msg.seq;
    state.guild.packets[msg.command] = { req: msg.req, resp: msg.resp, at: msg.at };
    note('guild', `แพ็กเก็ตกิลด์: ${msg.command}`);
    if (/Result/.test(msg.command)) { state.guild.battles.push({ command: msg.command, at: msg.at, req: msg.req, resp: msg.resp }); if (state.guild.battles.length > 100) state.guild.battles.shift(); }
    patch({ lastEventAt: Date.now(), lastCommand: msg.command, events: state.events + 1 });
    emit('guild', state.guild);
    if (/Rank/i.test(msg.command)) handleRankingPacket(msg.command, msg.resp, msg.at);
  });
  source.addEventListener('dungeon', (ev) => {
    if (es !== source) return;
    try {
      const msg = JSON.parse(ev.data);
      const rune = msg.rune;
      const evaluated = rune ? evaluateRune(rune) : null;
      const run = {
        at: msg.at || Date.now(),
        dungeonId: msg.dungeonId,
        stageId: msg.stageId,
        win: msg.win,
        clearTimeSec: msg.clearTimeSec,
        rune,
        evaluated,
      };

      state.dungeons = [run, ...state.dungeons].slice(0, 50);

      if (evaluated) {
        if (evaluated.isLegend6Star || evaluated.maxPotentialSpd >= 24) {
          playLegendAlertSound();
          patch({
            liveAlert: {
              type: 'legend_rune',
              title: `✨ ดรอปรูนตำนาน 6★! [${evaluated.setName}]`,
              desc: `สล็อต ${evaluated.slot} ${evaluated.mainStat.nameTh} (${evaluated.recommendationTh})`,
              badge: evaluated.recommendationTh,
              badgeColor: evaluated.badgeColor,
              at: Date.now(),
              rune: evaluated,
            },
          });
        } else {
          playDropSound();
        }
      }

      note('dungeon', `ดันเจี้ยน: จบใน ${msg.clearTimeSec ? msg.clearTimeSec + 's' : '-'} ${evaluated ? `(ดรอป ${evaluated.setName} ${evaluated.slot}★ ${evaluated.recommendationTh})` : ''}`);
      patch({ lastEventAt: Date.now(), lastCommand: 'dungeon', events: state.events + 1 });
      emit('dungeon', run);
    } catch (err) {
      console.warn('Failed to parse dungeon event:', err);
    }
  });
  source.addEventListener('summon', (ev) => {
    if (es !== source) return;
    try {
      const msg = JSON.parse(ev.data);
      const units = Array.isArray(msg.units) ? msg.units : [];
      state.summons = [{ at: msg.at || Date.now(), units }, ...state.summons].slice(0, 50);

      const nat5 = units.find((u) => Number(u.class) >= 5 || Number(u.unit_master_id) % 10 === 5);
      if (nat5) {
        playLegendAlertSound();
        patch({
          liveAlert: {
            type: 'nat5_summon',
            title: `🎉 ซัมมอนได้ 5★ แท้ระดับตำนาน!`,
            desc: `ขอแสดงความยินดีด้วยครับ! ข้อมูลอัปเดตเข้ากล่องแล้ว`,
            badge: '5★ NAT 5',
            badgeColor: 'amber',
            at: Date.now(),
            unit: nat5,
          },
        });
      }

      note('summon', `ซัมมอน: ${units.length} มอนสเตอร์`);
      patch({ lastEventAt: Date.now(), lastCommand: 'summon', events: state.events + 1 });
      emit('summon', msg);
    } catch (err) {
      console.warn('Failed to parse summon event:', err);
    }
  });
  source.onerror = () => {
    if (es !== source) return;
    failures += 1;
    if (failures === 1) note('error', `ติดต่อ 127.0.0.1:${getPort()} ไม่ได้ — จะลองใหม่อัตโนมัติ`);
    // EventSource retries every few seconds by itself; after several misses close it and
    // retry every 30 s instead, so a machine without SWEX running is not hammered
    const giveUp = source.readyState === EventSource.CLOSED || failures >= 5;
    patch({ status: giveUp ? 'error' : 'connecting', error: 'ไม่พบปลั๊กอิน AegisLink — เปิด SWEX ไว้ เปิดใช้ปลั๊กอิน แล้วเข้าเกม' });
    if (giveUp) {
      source.close();
      es = null;
      retryTimer = setTimeout(() => { if (isEnabled()) start(); }, 30000);
    }
  };
}

export function stop({ forget = true } = {}) {
  clearTimeout(retryTimer);
  if (es) note('link', 'ตัดการเชื่อมต่อ');
  if (es) { es.close(); es = null; }
  if (forget) { try { localStorage.removeItem(ENABLED_KEY); } catch { /* ignore */ } }
  patch({ status: 'off', error: '' });
}

/** Called once from the app shell: reconnect automatically when the user enabled the link before. */
export function autoStart() {
  if (isEnabled() && typeof EventSource !== 'undefined') start();
}
