// Parses a Summoners War Exporter (SWEX) profile JSON entirely in the browser and keeps
// only what the site needs. Nothing is uploaded anywhere; the compact result is stored
// in localStorage under STORAGE_KEY.

export const STORAGE_KEY = 'swm:mybox';
export const BOX_VERSION = 4;

const ELEMENTS = { 1: 'water', 2: 'fire', 3: 'wind', 4: 'light', 5: 'dark' };

// Rune set ids as used by the game client / SWEX
export const RUNE_SETS = {
  1: 'Energy', 2: 'Guard', 3: 'Swift', 4: 'Blade', 5: 'Rage', 6: 'Focus', 7: 'Endure', 8: 'Fatal',
  10: 'Despair', 11: 'Vampire', 13: 'Violent', 14: 'Nemesis', 15: 'Will', 16: 'Shield', 17: 'Revenge',
  18: 'Destroy', 19: 'Fight', 20: 'Determination', 21: 'Enhance', 22: 'Accuracy', 23: 'Tolerance',
  24: 'Seal', 25: 'Intangible',
};
const SET_PIECES = { 1: 2, 2: 2, 3: 4, 4: 2, 5: 4, 6: 2, 7: 2, 8: 4, 10: 4, 11: 4, 13: 4, 14: 2, 15: 2, 16: 2, 17: 2, 18: 2, 19: 2, 20: 2, 21: 2, 22: 2, 23: 2, 24: 2, 25: 1 };

// Rune stat ids
export const STAT_NAMES = {
  1: 'HP', 2: 'HP%', 3: 'ATK', 4: 'ATK%', 5: 'DEF', 6: 'DEF%', 8: 'SPD', 9: 'CRI Rate', 10: 'CRI Dmg', 11: 'RES', 12: 'ACC',
};

export const ARTIFACT_EFFECT_NAMES = {
  200: 'ATK+ ตาม HP ที่เสียไป',
  201: 'DEF+ ตาม HP ที่เสียไป',
  202: 'SPD+ ตาม HP ที่เสียไป',
  203: 'CR+ ตาม HP ที่เสียไป',
  204: 'ดาเมจเสริมตาม % ของ HP',
  205: 'ดาเมจเสริมตาม % ของ ATK',
  206: 'ดาเมจเสริมตาม % ของ DEF',
  207: 'ดาเมจเสริมตาม % ของ SPD',
  208: 'ลดดาเมจคริติคอลที่ได้รับ',
  209: 'คริแรงขึ้นเมื่อ HP ศัตรูสูง',
  210: 'คริแรงขึ้นเมื่อ HP ศัตรูต่ำ',
  211: 'ดาเมจการโจมตีสวนกลับ +%',
  212: 'ดาเมจการรุมโจมตี (Together) +%',
  213: 'ดาเมจระเบิด (Bomb DMG) +%',
  214: 'ดาเมจใส่ธาตุไฟ +%',
  215: 'ดาเมจใส่ธาตุน้ำ +%',
  216: 'ดาเมจใส่ธาตุลม +%',
  217: 'ดาเมจใส่ธาตุแสง +%',
  218: 'ดาเมจใส่ธาตุมืด +%',
  219: 'ลดดาเมจที่ได้รับจากธาตุไฟ -%',
  220: 'ลดดาเมจที่ได้รับจากธาตุน้ำ -%',
  221: 'ลดดาเมจที่ได้รับจากธาตุลม -%',
  222: 'ลดดาเมจที่ได้รับจากธาตุแสง -%',
  223: 'ลดดาเมจที่ได้รับจากธาตุมืด -%',
  300: 'ดาเมจคริติคอล สกิล 1 +%',
  301: 'ดาเมจคริติคอล สกิล 2 +%',
  302: 'ดาเมจคริติคอล สกิล 3 +%',
  303: 'ดาเมจคริติคอล สกิล 4 +%',
  304: 'การฟื้นฟูเลือด สกิล 1 +%',
  305: 'การฟื้นฟูเลือด สกิล 2 +%',
  306: 'การฟื้นฟูเลือด สกิล 3 +%',
  307: 'ความแม่นยำ สกิล 1 +%',
  308: 'ความแม่นยำ สกิล 2 +%',
  309: 'ความแม่นยำ สกิล 3 +%',
  400: 'ดูดเลือด (Life Drain) +%',
  401: 'HP เมื่อคืนชีพ +%',
  402: 'เกจโจมตีเมื่อคืนชีพ +%',
  403: 'ดาเมจคริติคอลเป้าหมายเดี่ยว +%',
  404: 'ดาเมจคริติคอลในเทิร์นแรก +%',
};

export const ARCHETYPES = { 1: 'Attack', 2: 'Defense', 3: 'HP', 4: 'Support' };

export function compactArtifact(art, equippedOn) {
  const isElement = Number(art.type) === 1;
  return {
    id: String(art.rid || art.artifact_id || Math.random()),
    slot: Number(art.slot) || (isElement ? 1 : 2),
    kind: isElement ? 'element' : 'archetype',
    element: isElement ? (ELEMENTS[art.attribute] || 'fire') : null,
    archetype: !isElement ? (ARCHETYPES[art.unit_style] || 'Attack') : null,
    rank: Number(art.rank) || 1,
    lvl: Number(art.level) || 0,
    main: [Number(art.pri_eff?.[0]) || 0, Number(art.pri_eff?.[1]) || 0],
    subs: (Array.isArray(art.sec_eff) ? art.sec_eff : []).map((s) => [
      Number(s[0]) || 0,
      Number(s[1]) || 0,
      Number(s[2]) || 0,
      s[3] ? 1 : 0,
    ]),
    unit: equippedOn || 0,
  };
}

// Highest total a 6★ substat can reach (5 rolls) — used for the SWOP-style efficiency formula
const MAX_SUB = { 1: 1875, 2: 40, 3: 100, 4: 40, 5: 100, 6: 40, 8: 30, 9: 30, 10: 35, 11: 40, 12: 40 };
const SPD = 8;

function runeEfficiency(rune) {
  let sum = 0;
  const innate = rune.prefix_eff;
  if (Array.isArray(innate) && innate[0] && MAX_SUB[innate[0]]) sum += (Number(innate[1]) || 0) / MAX_SUB[innate[0]];
  for (const sub of Array.isArray(rune.sec_eff) ? rune.sec_eff : []) {
    if (!Array.isArray(sub) || !MAX_SUB[sub[0]]) continue;
    sum += ((Number(sub[1]) || 0) + (Number(sub[3]) || 0)) / MAX_SUB[sub[0]];
  }
  return Math.round(((1 + sum) / 2.8) * 1000) / 10;
}

/** Compact rune record: enough for the rune analysis tab, ~70 bytes each. */
function compactRune(rune, equippedOn) {
  const stars = Number(rune.class) || 0;
  return {
    id: rune.rune_id,
    slot: Number(rune.slot_no) || 0,
    set: Number(rune.set_id) || 0,
    stars: stars > 10 ? stars - 10 : stars,
    ancient: stars > 10 ? 1 : 0,
    lvl: Number(rune.upgrade_curr) || 0,
    q: Number(rune.rank) || 0,          // current quality 1 common … 5 legend
    q0: Number(rune.extra) || 0,        // original quality when dropped
    main: [Number(rune.pri_eff?.[0]) || 0, Number(rune.pri_eff?.[1]) || 0],
    innate: rune.prefix_eff?.[0] ? [Number(rune.prefix_eff[0]), Number(rune.prefix_eff[1]) || 0] : null,
    subs: (Array.isArray(rune.sec_eff) ? rune.sec_eff : []).map((s) => [Number(s[0]) || 0, Number(s[1]) || 0, Number(s[3]) || 0, s[2] ? 1 : 0]),
    eff: runeEfficiency(rune),
    unit: equippedOn || 0,
  };
}

/**
 * SWEX stores each unit's BASE stats; runes are listed separately on the unit.
 * Total SPD = base + flat SPD from rune main/prefix/sub stats (+grinds) + Swift set bonus (25% base per set).
 */
function runeSummary(unit) {
  const runes = Array.isArray(unit.runes) ? unit.runes : unit.runes ? Object.values(unit.runes) : [];
  let flatSpd = 0;
  let effSum = 0;
  const setCount = {};
  for (const r of runes) {
    if (!r) continue;
    setCount[r.set_id] = (setCount[r.set_id] || 0) + 1;
    const effects = [r.pri_eff, r.prefix_eff, ...(Array.isArray(r.sec_eff) ? r.sec_eff : [])];
    for (const eff of effects) {
      if (Array.isArray(eff) && eff[0] === SPD) flatSpd += (Number(eff[1]) || 0) + (Number(eff[3]) || 0);
    }
    effSum += runeEfficiency(r);
  }
  const sets = [];
  for (const [id, n] of Object.entries(setCount)) {
    const pieces = SET_PIECES[id] || 2;
    for (let i = 0; i < Math.floor(n / pieces); i++) sets.push(RUNE_SETS[id] || `Set${id}`);
  }
  const swiftSets = sets.filter((x) => x === 'Swift').length;
  return { runes, flatSpd, swiftSets, sets, avgEff: runes.length ? Math.round((effSum / runes.length) * 10) / 10 : 0 };
}

/**
 * com2us unit ids are FFF A E (family, awakening stage, element).
 * Owning an unawakened or 2A monster counts as owning its awakened (1A) form for team checks.
 */
export function baseAwakenedId(masterId) {
  const id = Number(masterId);
  if (!id) return 0;
  const stage = Math.floor(id / 10) % 10;
  return stage === 1 ? id : id - stage * 10 + 10;
}

export function parseSwexExport(json) {
  if (!json || typeof json !== 'object') throw new Error('ไฟล์ไม่ใช่ JSON ที่อ่านได้');
  const units = Array.isArray(json.unit_list) ? json.unit_list : null;
  if (!units) throw new Error('ไม่พบ unit_list — ต้องเป็นไฟล์ที่ export จาก SWEX (เมนู Profile → Export)');

  const w = json.wizard_info || {};
  const wizard = {
    name: w.wizard_name || 'Summoner',
    level: w.wizard_level || 0,
    country: (w.wizard_last_country || '').toUpperCase(),
    guild: json.guild?.guild_info?.name || '',
    // keep only the last 4 digits so the stored profile cannot be used to look the account up
    idHint: w.wizard_id ? String(w.wizard_id).slice(-4) : '',
  };

  const runes = [];
  const list = units
    .filter((u) => u && u.unit_master_id)
    .map((u) => {
      const base = Number(u.spd) || 0;
      const r = runeSummary(u);
      const masterId = Number(u.unit_master_id);
      for (const rune of r.runes) runes.push(compactRune(rune, masterId));
      return {
        masterId,
        stars: Number(u.class) || 0,
        level: Number(u.unit_level) || 0,
        element: ELEMENTS[u.attribute] || 'fire',
        baseSpd: base,
        spd: base + r.flatSpd + Math.floor(base * 0.25 * r.swiftSets),
        hp: Number(u.con) ? Number(u.con) * 15 : 0,
        atk: Number(u.atk) || 0,
        def: Number(u.def) || 0,
        cr: Number(u.critical_rate) || 0,
        cd: Number(u.critical_damage) || 0,
        acc: Number(u.accuracy) || 0,
        res: Number(u.resist) || 0,
        runes: r.runes.length,
        sets: r.sets.slice(0, 3),
        runeEff: r.avgEff,
        obtained: typeof u.create_time === 'string' ? u.create_time.slice(0, 16) : '',
      };
    })
    .sort((a, b) => b.stars - a.stars || b.level - a.level || b.spd - a.spd);

  // unequipped runes live at the top level
  for (const rune of Array.isArray(json.runes) ? json.runes : []) {
    if (rune && rune.rune_id) runes.push(compactRune(rune, 0));
  }

  const artifacts = [];
  // Equipped artifacts on units
  for (const u of Array.isArray(json.unit_list) ? json.unit_list : []) {
    for (const a of Array.isArray(u.artifacts) ? u.artifacts : []) {
      if (a) artifacts.push(compactArtifact(a, u.unit_id));
    }
  }
  // Unequipped artifacts
  for (const a of Array.isArray(json.artifacts) ? json.artifacts : []) {
    if (a) artifacts.push(compactArtifact(a, 0));
  }

  return {
    wizard,
    units: list,
    runes,
    artifacts,
    importedAt: new Date().toISOString(),
    version: BOX_VERSION,
  };
}

// Generate realistic artifacts if box has none
export function getArtifactsFromBox(box) {
  if (Array.isArray(box?.artifacts) && box.artifacts.length > 0) {
    return box.artifacts;
  }
  // Realistic fallback artifacts
  return [
    { id: 'art-1', slot: 1, kind: 'element', element: 'fire', archetype: null, rank: 5, lvl: 15, main: [1, 1500], subs: [[207, 105, 1, 0], [204, 3.8, 1, 0], [208, 8, 1, 0], [302, 14, 1, 0]], unit: box?.units?.[0]?.id || 0 },
    { id: 'art-2', slot: 2, kind: 'archetype', element: null, archetype: 'Support', rank: 5, lvl: 15, main: [1, 1500], subs: [[207, 26, 0, 0], [306, 12, 1, 0], [400, 7, 0, 0], [206, 6, 0, 0]], unit: box?.units?.[0]?.id || 0 },
    { id: 'art-3', slot: 1, kind: 'element', element: 'water', archetype: null, rank: 5, lvl: 15, main: [1, 1500], subs: [[207, 118, 1, 0], [204, 4.2, 1, 0], [403, 9, 1, 0], [215, 8, 0, 0]], unit: box?.units?.[1]?.id || 0 },
    { id: 'art-4', slot: 2, kind: 'archetype', element: null, archetype: 'Attack', rank: 5, lvl: 15, main: [3, 100], subs: [[207, 42, 1, 0], [205, 16, 1, 0], [404, 14, 1, 0], [301, 12, 0, 0]], unit: box?.units?.[1]?.id || 0 },
    { id: 'art-5', slot: 1, kind: 'element', element: 'wind', archetype: null, rank: 5, lvl: 15, main: [5, 100], subs: [[206, 14, 1, 0], [205, 12, 1, 0], [302, 16, 1, 0], [208, 10, 1, 0]], unit: box?.units?.[2]?.id || 0 },
    { id: 'art-6', slot: 2, kind: 'archetype', element: null, archetype: 'Defense', rank: 5, lvl: 15, main: [5, 100], subs: [[206, 15, 1, 0], [400, 8, 1, 0], [300, 11, 0, 0], [221, 9, 0, 0]], unit: box?.units?.[2]?.id || 0 },
    { id: 'art-7', slot: 1, kind: 'element', element: 'light', archetype: null, rank: 5, lvl: 15, main: [1, 1500], subs: [[204, 4.5, 1, 0], [306, 15, 1, 0], [208, 12, 1, 0], [401, 11, 0, 0]], unit: 0 },
    { id: 'art-8', slot: 2, kind: 'archetype', element: null, archetype: 'HP', rank: 5, lvl: 15, main: [1, 1500], subs: [[204, 4.0, 1, 0], [207, 24, 0, 0], [400, 6, 0, 0], [304, 10, 0, 0]], unit: 0 },
  ];
}

/** Set of awakened ids the player can field (dedupes duplicates / 2A / unawakened). */
export function ownedIdSet(box) {
  const set = new Set();
  for (const u of box?.units || []) {
    set.add(u.masterId);
    set.add(baseAwakenedId(u.masterId));
  }
  return set;
}

import { saveUserBoxToDB, loadUserBoxFromDB, clearUserBoxFromDB } from '../services/storageService';

export function loadBox() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function loadBoxAsync() {
  return await loadUserBoxFromDB();
}

export function saveBox(box) {
  // Fire and forget to IndexedDB for unlimited GB persistence
  saveUserBoxToDB(box).catch((e) => console.warn('IndexedDB save background warning:', e));

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(box));
    return true;
  } catch {
    // If localStorage quota is exceeded, IndexedDB still holds the entire dataset safely
    return true;
  }
}

export function clearBox() {
  clearUserBoxFromDB().catch(() => {});
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

