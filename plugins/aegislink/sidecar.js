/**
 * AegisLink sidecar — standalone High-Speed Real-time HTTP API & Live Log Tailer
 *
 * Captures Summoners War game packets in real-time:
 *  1. Auto-tails SWEX full_log.txt with sub-second latency (200ms polling + byte streaming)
 *  2. Accepts POST /ingest from the SWEX AegisLink plugin
 *  3. Computes live Keep/Sell rune evaluations and max SPD
 *  4. Streams live events to browser via Server-Sent Events (SSE)
 *
 * Port: 7391 (site default). Bind: 127.0.0.1 only.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.AEGIS_PORT) || 7391;
const STATE_FILE = path.join(__dirname, 'sidecar-state.json');

// --- Rune Evaluation Constants & Logic ---
const RUNE_SET_NAMES = {
  1: 'Energy', 2: 'Guard', 3: 'Swift', 4: 'Blade', 5: 'Rage', 6: 'Focus', 7: 'Endure', 8: 'Fatal',
  10: 'Despair', 11: 'Vampire', 13: 'Violent', 14: 'Nemesis', 15: 'Will', 16: 'Shield', 17: 'Revenge',
  18: 'Destroy', 19: 'Fight', 20: 'Determination', 21: 'Enhance', 22: 'Accuracy', 23: 'Tolerance',
  24: 'Seal', 25: 'Intangible'
};

const RUNE_SET_NAMES_TH = {
  Energy: 'เอนเนอร์จี (HP)', Guard: 'การ์ด (DEF)', Swift: 'สวิฟต์ (SPD)', Blade: 'เบลด (CR)',
  Rage: 'เรจ (CD)', Focus: 'โฟกัส (ACC)', Endure: 'เอนดูร์ (RES)', Fatal: 'ฟาทัล (ATK)',
  Despair: 'ดีสแพร์ (สตัน)', Vampire: 'แวมไพร์ (ดูดเลือด)', Violent: 'ไวโอเลนท์ (เทิร์นซ้อน)',
  Nemesis: 'เนเมซิส (เร่งเกจ)', Will: 'วิลล์ (กันสถานะ)', Shield: 'ชิลด์ (เกราะทีม)',
  Revenge: 'รีเวนจ์ (สวนกลับ)', Destroy: 'เดสทรอย (ทำลายเลือด)', Fight: 'ไฟต์ (เพิ่ม ATK ทีม)',
  Determination: 'ดีเทอร์มิเนชัน (เพิ่ม DEF ทีม)', Enhance: 'เอนแฮนซ์ (เพิ่ม HP ทีม)',
  Accuracy: 'แอคคูราซี (เพิ่ม ACC ทีม)', Tolerance: 'โทเลอรานซ์ (เพิ่ม RES ทีม)',
  Seal: 'ซีล (ผนึกรูน)', Intangible: 'อินแทนจิเบิล (แทนได้ทุกเซ็ต)'
};

const STAT_NAMES = {
  1: 'HP (Flat)', 2: 'HP%', 3: 'ATK (Flat)', 4: 'ATK%', 5: 'DEF (Flat)', 6: 'DEF%',
  8: 'SPD', 9: 'CRIT Rate%', 10: 'CRIT DMG%', 11: 'Resistance%', 12: 'Accuracy%'
};

const STAT_NAMES_TH = {
  1: 'HP (หน่วย)', 2: 'HP%', 3: 'ATK (หน่วย)', 4: 'ATK%', 5: 'DEF (หน่วย)', 6: 'DEF%',
  8: 'SPD (ความเร็ว)', 9: 'อัตราคริ (CR%)', 10: 'ความแรงคริ (CD%)', 11: 'ต้านทาน (RES%)', 12: 'ความแม่นยำ (ACC%)'
};

const MAX_ROLLS_6STAR = { 1: 375, 2: 8, 3: 20, 4: 8, 5: 20, 6: 8, 8: 6, 9: 6, 10: 7, 11: 8, 12: 8 };

function evaluateRune(rune) {
  if (!rune) return null;
  const slot = Number(rune.slot_no || rune.slot || 1);
  const stars = Number(rune.class || rune.stars || rune.rank || 6);
  const upgradeLevel = Number(rune.upgrade_curr || rune.level || rune.upgrade || 0);
  const setId = Number(rune.set_id || 1);
  const setName = RUNE_SET_NAMES[setId] || rune.setName || 'Unknown';
  const setNameTh = RUNE_SET_NAMES_TH[setName] || setName;

  const secEff = Array.isArray(rune.sec_eff) ? rune.sec_eff : [];
  const prefixEff = rune.prefix_eff || [];

  let originalQuality = Number(rune.extra || 0);
  if (!originalQuality) {
    originalQuality = Math.min(5, Math.max(1, secEff.length + 1));
  }

  const mainStatType = Number(Array.isArray(rune.pri_eff) ? rune.pri_eff[0] : (rune.main_stat ? rune.main_stat[0] : 1));
  const mainStatValue = Number(Array.isArray(rune.pri_eff) ? rune.pri_eff[1] : (rune.main_stat ? rune.main_stat[1] : 0));
  const mainStatName = STAT_NAMES[mainStatType] || 'Unknown';
  const mainStatNameTh = STAT_NAMES_TH[mainStatType] || mainStatName;

  let innate = null;
  if (Array.isArray(prefixEff) && prefixEff.length >= 2 && prefixEff[0] > 0) {
    innate = {
      type: prefixEff[0],
      value: prefixEff[1],
      name: STAT_NAMES[prefixEff[0]] || '',
      nameTh: STAT_NAMES_TH[prefixEff[0]] || '',
    };
  }

  let currentSpd = 0;
  let hasSpdSub = false;
  const subs = [];

  for (const s of secEff) {
    const sType = Number(s[0]);
    const sVal = Number(s[1]);
    const sGrind = Number(s[3] || 0);
    const name = STAT_NAMES[sType] || 'Unknown';
    const nameTh = STAT_NAMES_TH[sType] || name;

    if (sType === 8) {
      currentSpd = sVal;
      hasSpdSub = true;
    }

    subs.push({ type: sType, value: sVal, grind: sGrind, name, nameTh });
  }

  const currentRollsDone = Math.min(4, Math.floor(upgradeLevel / 3));
  let totalUpgradesForQuality = 0;
  if (originalQuality === 5) totalUpgradesForQuality = 4;
  else if (originalQuality === 4) totalUpgradesForQuality = 3;
  else if (originalQuality === 3) totalUpgradesForQuality = 2;
  else if (originalQuality === 2) totalUpgradesForQuality = 1;

  const remainingRolls = Math.max(0, totalUpgradesForQuality - currentRollsDone);

  let maxPotentialSpd = currentSpd;
  if (mainStatType === 8) {
    maxPotentialSpd = 42;
  } else if (hasSpdSub) {
    maxPotentialSpd = currentSpd + remainingRolls * 6;
  } else if (subs.length < 4 && upgradeLevel < 12 && originalQuality < 5) {
    maxPotentialSpd = 6;
  }

  const isSlot246 = slot === 2 || slot === 4 || slot === 6;
  const isFlat246 = isSlot246 && (mainStatType === 1 || mainStatType === 3 || mainStatType === 5);

  let effSum = 0;
  for (const s of subs) {
    const maxVal = MAX_ROLLS_6STAR[s.type] || 8;
    effSum += (s.value / maxVal);
  }
  const currentEff = Math.round((1 + effSum / (1 + 4 * 0.2)) * 100);
  const maxPotentialEff = Math.min(100, Math.round(currentEff + (remainingRolls * 0.2 * 100)));

  const qualityNames = { 1: 'Common (ขาว)', 2: 'Magic (เขียว)', 3: 'Rare (ฟ้า)', 4: 'Hero (ม่วง)', 5: 'Legend (ส้ม)' };
  const qualityName = qualityNames[originalQuality] || 'Hero (ม่วง)';
  const isLegend6Star = stars === 6 && originalQuality === 5;

  let recommendation = 'KEEP_INSTANT';
  let recommendationTh = 'เก็บไว้ใช้งาน';
  let badgeColor = 'emerald';
  let reason = '';

  if (isFlat246) {
    if (hasSpdSub && maxPotentialSpd >= 23 && stars === 6) {
      recommendation = 'ROLL_TEST';
      recommendationTh = 'ตี +6 ลุ้นสปีด';
      badgeColor = 'amber';
      reason = 'ออปหลักแฟลต แต่มีโอกาสลุ้น SPD สูงสุด +' + maxPotentialSpd;
    } else {
      recommendation = 'SELL_RECOMMENDED';
      recommendationTh = 'แนะนำขายทิ้ง';
      badgeColor = 'red';
      reason = 'สล็อต ' + slot + ' เป็นออปชั่นแฟลต (' + mainStatNameTh + ') เสียเปรียบเปอร์เซ็นต์มหาศาล';
    }
  } else if (stars < 6) {
    recommendation = 'SELL_RECOMMENDED';
    recommendationTh = 'แนะนำขายทิ้ง';
    badgeColor = 'red';
    reason = 'รูนต่ำกว่า 6★ ไม่คุ้มค่าการตีในระยะยาว';
  } else if (originalQuality === 5) {
    if (hasSpdSub || maxPotentialEff >= 95 || setId === 13 || setId === 15 || setId === 3) {
      recommendation = 'KEEP_INSTANT';
      recommendationTh = 'เก็บไว้ (รูนตำนาน)';
      badgeColor = 'purple';
      reason = 'รูนตำนาน 6★ สถิติสมบูรณ์แบบ แนะนำเก็บไว้ตี +12 หรือ Reappraise';
    } else {
      recommendation = 'ROLL_TEST';
      recommendationTh = 'ตีดูผลโรล';
      badgeColor = 'blue';
      reason = 'รูนตำนาน 6★ ควรตีดูว่าโรลลงสถิติที่เข้าพวกกันหรือไม่';
    }
  } else if (hasSpdSub && maxPotentialSpd >= 20) {
    recommendation = 'ROLL_TEST';
    recommendationTh = 'ลุ้นสปีด (Max +' + maxPotentialSpd + ')';
    badgeColor = 'blue';
    reason = 'มีซับสปีด ลุ้นโรลติดสปีดสูงสุด +' + maxPotentialSpd;
  } else if (maxPotentialEff >= 88) {
    recommendation = 'ROLL_TEST';
    recommendationTh = 'ตีทดสอบ (+3/+6)';
    badgeColor = 'amber';
    reason = 'ประสิทธิภาพศักยภาพสูง ' + maxPotentialEff + '%';
  } else {
    recommendation = 'SELL_RECOMMENDED';
    recommendationTh = 'แนะนำขายทิ้ง';
    badgeColor = 'red';
    reason = 'ประสิทธิภาพต่ำหรือซับสเตตไม่สอดคล้องกัน';
  }

  return {
    slot,
    stars,
    upgradeLevel,
    setName,
    setNameTh,
    originalQuality,
    qualityName,
    mainStat: { type: mainStatType, value: mainStatValue, name: mainStatName, nameTh: mainStatNameTh },
    innate,
    subs,
    currentEff,
    maxPotentialEff,
    currentSpd,
    hasSpdSub,
    maxPotentialSpd,
    recommendation,
    recommendationTh,
    badgeColor,
    reason,
    isLegend6Star
  };
}

// --- State Management ---
const state = {
  account: null,
  accountAt: 0,
  seq: 0,
  guild: {},
  battles: [],
  dungeons: [],
  summons: [],
  clients: new Set(),
  startedAt: Date.now(),
  logFile: null,
  tailBytes: 0,
};

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const raw = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      state.account = raw.account || null;
      state.accountAt = raw.accountAt || 0;
      state.seq = raw.seq || 0;
      state.guild = raw.guild || {};
      state.battles = raw.battles || [];
      state.dungeons = raw.dungeons || [];
      state.summons = raw.summons || [];
      console.log(`[sidecar] Restored state: seq ${state.seq}, dungeons ${state.dungeons.length}, units ${state.account ? state.account.unit_list?.length : 0}`);
    }
  } catch (err) {
    console.error('[sidecar] Load state error:', err.message);
  }
}

function saveState() {
  try {
    fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify({
      account: state.account,
      accountAt: state.accountAt,
      seq: state.seq,
      guild: state.guild,
      battles: state.battles.slice(0, 50),
      dungeons: state.dungeons.slice(0, 100),
      summons: state.summons.slice(0, 50),
    }));
  } catch (err) {
    console.error('[sidecar] Save state failed:', err.message);
  }
}

function wizardSummary() {
  const w = state.account && state.account.wizard_info;
  return w ? { name: w.wizard_name, level: w.wizard_level, idHint: String(w.wizard_id || '').slice(-4) } : null;
}

function statusBody() {
  return {
    plugin: 'AegisLink',
    version: '2.2.0+liveTail',
    seq: state.seq,
    hasSnapshot: !!state.account,
    accountAt: state.accountAt,
    wizard: wizardSummary(),
    units: state.account ? (state.account.unit_list?.length || 0) : 0,
    recentDungeons: state.dungeons.length,
    recentSummons: state.summons.length,
    logFile: state.logFile,
    clients: state.clients.size,
    uptime: Date.now() - state.startedAt,
  };
}

// --- SSE Broadcast ---
function broadcast(type, payload) {
  const frame = `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of state.clients) {
    try {
      res.write(frame);
    } catch {
      state.clients.delete(res);
    }
  }
}

// --- Dungeon & Packet Ingestion ---
function processDungeonPacket(req, resp, command) {
  const dungeonId = req.dungeon_id || (resp.dungeon_info && resp.dungeon_info.dungeon_id) || resp.dungeon_id;
  const stageId = req.stage_id || (resp.dungeon_info && resp.dungeon_info.stage_id) || resp.stage_id;
  const win = resp.win_lose === 1 || req.win_lose === 1;
  const clearTimeSec = resp.clear_time ? (Number(resp.clear_time.current_time) / 1000).toFixed(1) : null;

  // Extract rune from changed_item_list or reward crate
  let rawRune = null;
  const changedItems = Array.isArray(resp.changed_item_list) ? resp.changed_item_list : [];
  for (const item of changedItems) {
    if (item.type === 8 || item.info?.rune_id) {
      rawRune = item.info;
      break;
    }
  }
  if (!rawRune) {
    rawRune = resp.reward?.crate?.rune || resp.rune || null;
  }

  // Extract artifacts
  let rawArtifact = null;
  for (const item of changedItems) {
    if (item.type === 73 || item.info?.rid) {
      rawArtifact = item.info;
      break;
    }
  }
  if (!rawArtifact) {
    rawArtifact = resp.reward?.crate?.artifacts || resp.artifacts || null;
  }

  const evaluated = rawRune ? evaluateRune(rawRune) : null;
  const run = {
    at: Date.now(),
    dungeonId: Number(dungeonId) || 0,
    stageId: Number(stageId) || 0,
    win,
    clearTimeSec,
    rune: rawRune,
    evaluated,
    artifact: rawArtifact,
    reward: resp.reward || null,
  };

  // Avoid duplicate runs within 2 seconds
  if (state.dungeons.length > 0) {
    const last = state.dungeons[0];
    if (Math.abs(run.at - last.at) < 2000 && run.clearTimeSec === last.clearTimeSec && run.rune?.rune_id === last.rune?.rune_id) {
      return;
    }
  }

  state.dungeons.unshift(run);
  if (state.dungeons.length > 100) state.dungeons.pop();
  state.seq += 1;

  // Add rune to account box in memory
  if (rawRune && state.account && Array.isArray(state.account.runes)) {
    const exists = state.account.runes.some(r => Number(r.rune_id) === Number(rawRune.rune_id));
    if (!exists) state.account.runes.push(rawRune);
  }

  broadcast('dungeon', run);
  saveState();
  console.log(`[sidecar:dungeon] Captured run: dungeon ${run.dungeonId}, clear ${run.clearTimeSec}s, rune: ${evaluated ? evaluated.setNameTh + ' ' + evaluated.recommendationTh : 'No rune'}`);
}

function ingest(body) {
  if (!body || !body.type) return;
  if (body.type === 'snapshot') {
    state.account = body.data;
    state.accountAt = body.at || Date.now();
    state.seq = body.seq || state.seq + 1;
    broadcast('snapshot', { seq: state.seq, at: state.accountAt, data: state.account });
    saveState();
    console.log(`[sidecar] Snapshot: ${wizardSummary()?.name || '?'} — ${state.account.unit_list?.length} units`);
  } else if (body.type === 'dungeon') {
    state.dungeons.unshift(body);
    if (state.dungeons.length > 100) state.dungeons.pop();
    broadcast('dungeon', body);
    saveState();
  } else if (body.type === 'summon') {
    state.summons.unshift(body);
    if (state.summons.length > 50) state.summons.pop();
    broadcast('summon', body);
    saveState();
  }
}

// --- Live File Tailer for full_log.txt ---
function findLogFilePath() {
  const candidates = [
    'C:/Users/thara/OneDrive/เดสก์ท็อป/GG/full_log.txt',
    path.join(process.env.USERPROFILE || '', 'OneDrive/เดสก์ท็อป/GG/full_log.txt'),
    path.join(process.env.USERPROFILE || '', 'Desktop/GG/full_log.txt'),
    path.join(process.env.USERPROFILE || '', 'Documents/Summoners War Exporter Files/full_log.txt'),
    path.join(process.env.APPDATA || '', 'Summoners War Exporter/full_log.txt'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

let tailOffset = 0;
let tailBuffer = '';

function parseChunkText(chunkText) {
  const parts = chunkText.split('API Command: ');
  for (const part of parts) {
    if (!part.trim()) continue;
    const lines = part.split('\n');
    const header = lines[0] || '';
    const command = header.split(' - ')[0].trim();

    if (/BattleDungeonResult|BattleRepeatResult|BattleDimensionHoleDungeonResult|BattleRiftDungeonResult|BattleScenarioResult/i.test(command)) {
      const reqIdx = lines.findIndex(l => l.startsWith('Request:'));
      const respIdx = lines.findIndex(l => l.startsWith('Response:'));
      if (respIdx >= 0) {
        try {
          const resp = JSON.parse(lines[respIdx + 1]);
          const req = reqIdx >= 0 ? JSON.parse(lines[reqIdx + 1]) : {};
          processDungeonPacket(req, resp, command);
        } catch (e) {
          // Incomplete json in stream, ignore
        }
      }
    } else if (/SummonUnit/i.test(command)) {
      const respIdx = lines.findIndex(l => l.startsWith('Response:'));
      if (respIdx >= 0) {
        try {
          const resp = JSON.parse(lines[respIdx + 1]);
          const units = [].concat(resp.unit_list || []).concat(resp.reward?.unit_list || []).concat(resp.unit_info ? [resp.unit_info] : []);
          if (units.length > 0) {
            const ev = { command, at: Date.now(), units };
            state.summons.unshift(ev);
            if (state.summons.length > 50) state.summons.pop();
            broadcast('summon', ev);
          }
        } catch {}
      }
    } else if (command === 'HubUserLogin') {
      const respIdx = lines.findIndex(l => l.startsWith('Response:'));
      if (respIdx >= 0) {
        try {
          const resp = JSON.parse(lines[respIdx + 1]);
          if (Array.isArray(resp.unit_list)) {
            state.account = resp;
            state.accountAt = Date.now();
            state.seq += 1;
            broadcast('snapshot', { seq: state.seq, at: state.accountAt, data: state.account });
            saveState();
          }
        } catch {}
      }
    }
  }
}

function initLogTailer() {
  const logPath = findLogFilePath();
  if (!logPath) {
    console.log('[sidecar:tailer] No full_log.txt found yet. Checking again in 2s...');
    setTimeout(initLogTailer, 2000);
    return;
  }

  state.logFile = logPath;
  console.log(`[sidecar:tailer] Watching SWEX log at: ${logPath}`);

  try {
    const stat = fs.statSync(logPath);
    // Pre-read the tail (last 500 KB) to restore recent runs
    const readLen = Math.min(stat.size, 500 * 1024);
    const buf = Buffer.alloc(readLen);
    const fd = fs.openSync(logPath, 'r');
    fs.readSync(fd, buf, 0, readLen, stat.size - readLen);
    fs.closeSync(fd);
    parseChunkText(buf.toString('utf8'));
    tailOffset = stat.size;
    console.log(`[sidecar:tailer] Initialized at offset ${tailOffset}, restored ${state.dungeons.length} recent runs`);
  } catch (err) {
    console.error('[sidecar:tailer] Pre-read failed:', err.message);
  }

  // Active sub-second poll (200ms) for ultra-fast real-time response
  setInterval(() => {
    try {
      if (!fs.existsSync(logPath)) return;
      const stat = fs.statSync(logPath);
      if (stat.size < tailOffset) {
        tailOffset = 0; // File was truncated/cleared
      }
      if (stat.size > tailOffset) {
        const diff = stat.size - tailOffset;
        const buf = Buffer.alloc(diff);
        const fd = fs.openSync(logPath, 'r');
        fs.readSync(fd, buf, 0, diff, tailOffset);
        fs.closeSync(fd);
        tailOffset = stat.size;

        const newText = tailBuffer + buf.toString('utf8');
        const lastCmdIdx = newText.lastIndexOf('API Command: ');
        if (lastCmdIdx > 0) {
          // Parse all complete commands up to the last one
          parseChunkText(newText);
          tailBuffer = '';
        } else {
          tailBuffer = newText;
        }
      }
    } catch (err) {
      // Ignore transient read errors while SWEX writes
    }
  }, 200);
}

// --- HTTP Server ---
const ALLOWED_ORIGINS = [
  /^https:\/\/swm(-[a-z0-9-]+)?\.vercel\.app$/i,
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i
];

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
  res.writeHead(status, {
    ...headers,
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(text)
  });
  res.end(text);
}

loadState();
initLogTailer();

const server = http.createServer((req, res) => {
  const origin = req.headers.origin;
  const headers = corsHeaders(origin);
  if (req.method === 'OPTIONS') {
    res.writeHead(204, headers);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/ingest') {
    let raw = '';
    req.on('data', (c) => {
      raw += c;
      if (raw.length > 64e6) req.destroy();
    });
    req.on('end', () => {
      try {
        ingest(JSON.parse(raw || '{}'));
        sendJson(res, headers, 200, { ok: true, seq: state.seq });
      } catch (err) {
        sendJson(res, headers, 400, { error: err.message });
      }
    });
    return;
  }

  if (req.method !== 'GET') {
    return sendJson(res, headers, 405, { error: 'method not allowed' });
  }

  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);

  if (url.pathname === '/' || url.pathname === '/status') {
    return sendJson(res, headers, 200, statusBody());
  }

  if (url.pathname === '/snapshot') {
    if (!state.account) return sendJson(res, headers, 404, { error: 'no account yet' });
    return sendJson(res, headers, 200, { seq: state.seq, at: state.accountAt, data: state.account });
  }

  if (url.pathname === '/guild') {
    return sendJson(res, headers, 200, { seq: state.seq, packets: state.guild, battles: state.battles });
  }

  if (url.pathname === '/dungeons') {
    return sendJson(res, headers, 200, { seq: state.seq, runs: state.dungeons });
  }

  if (url.pathname === '/summons') {
    return sendJson(res, headers, 200, { seq: state.seq, summons: state.summons });
  }

  if (url.pathname === '/events') {
    res.writeHead(200, {
      ...headers,
      'Content-Type': 'text/event-stream; charset=utf-8',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no'
    });
    res.write('retry: 1500\n\n');
    res.write(`event: hello\ndata: ${JSON.stringify(statusBody())}\n\n`);
    state.clients.add(res);
    const ping = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch {
        /* closed */
      }
    }, 15000);
    req.on('close', () => {
      clearInterval(ping);
      state.clients.delete(res);
    });
    return;
  }

  sendJson(res, headers, 404, { error: 'not found' });
});

server.on('error', (err) => {
  console.error(`[sidecar] Server error on port ${PORT}:`, err.message);
  process.exit(1);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[sidecar] Real-time AegisLink Server & Tailer active on http://127.0.0.1:${PORT}`);
});
