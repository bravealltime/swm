// Parses a Summoners War Exporter (SWEX) profile JSON entirely in the browser and keeps
// only what the site needs. Nothing is uploaded anywhere; the compact result is stored
// in localStorage under STORAGE_KEY.

export const STORAGE_KEY = 'swm:mybox';

const ELEMENTS = { 1: 'water', 2: 'fire', 3: 'wind', 4: 'light', 5: 'dark' };

export const BOX_VERSION = 2;

// Rune set ids as used by the game client / SWEX
export const RUNE_SETS = {
  1: 'Energy', 2: 'Guard', 3: 'Swift', 4: 'Blade', 5: 'Rage', 6: 'Focus', 7: 'Endure', 8: 'Fatal',
  10: 'Despair', 11: 'Vampire', 13: 'Violent', 14: 'Nemesis', 15: 'Will', 16: 'Shield', 17: 'Revenge',
  18: 'Destroy', 19: 'Fight', 20: 'Determination', 21: 'Enhance', 22: 'Accuracy', 23: 'Tolerance',
  24: 'Seal', 25: 'Intangible',
};
const SET_PIECES = { 3: 4, 4: 2, 5: 4, 6: 2, 8: 4, 10: 4, 11: 4, 13: 4, 14: 2, 15: 2, 16: 2, 17: 2, 18: 2, 19: 2, 20: 2, 21: 2, 22: 2, 23: 2, 24: 2, 25: 1, 1: 2, 2: 2, 7: 2 };
const SPD_EFFECT = 8;

/**
 * SWEX stores each unit's BASE stats; runes are listed separately on the unit.
 * Total SPD = base + flat SPD from rune main/prefix/sub stats (+grinds) + Swift set bonus (25% base per set).
 */
function runeSummary(unit) {
  const runes = Array.isArray(unit.runes) ? unit.runes : unit.runes ? Object.values(unit.runes) : [];
  let flatSpd = 0;
  const setCount = {};
  for (const r of runes) {
    if (!r) continue;
    setCount[r.set_id] = (setCount[r.set_id] || 0) + 1;
    const effects = [r.pri_eff, r.prefix_eff, ...(Array.isArray(r.sec_eff) ? r.sec_eff : [])];
    for (const eff of effects) {
      if (Array.isArray(eff) && eff[0] === SPD_EFFECT) flatSpd += (Number(eff[1]) || 0) + (Number(eff[3]) || 0);
    }
  }
  const sets = [];
  for (const [id, n] of Object.entries(setCount)) {
    const pieces = SET_PIECES[id] || 2;
    for (let i = 0; i < Math.floor(n / pieces); i++) sets.push(RUNE_SETS[id] || `Set${id}`);
  }
  const swiftSets = sets.filter((x) => x === 'Swift').length;
  return { runes: runes.length, flatSpd, swiftSets, sets };
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

  const list = units
    .filter((u) => u && u.unit_master_id)
    .map((u) => {
      const base = Number(u.spd) || 0;
      const r = runeSummary(u);
      return {
        masterId: Number(u.unit_master_id),
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
        runes: r.runes,
        sets: r.sets.slice(0, 3),
      };
    })
    .sort((a, b) => b.stars - a.stars || b.level - a.level || b.spd - a.spd);

  return {
    wizard,
    units: list,
    importedAt: new Date().toISOString(),
    version: BOX_VERSION,
  };
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

export function loadBox() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveBox(box) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(box));
    return true;
  } catch {
    return false;
  }
}

export function clearBox() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
