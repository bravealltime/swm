// Monster skill records are fetched in shards from public/data/skills/<n>.json (generated from
// monsterSkillsData.json by scripts/build_skill_shards.mjs at dev/build start) so the encyclopedia
// renders immediately instead of shipping the whole dataset as one 5 MB chunk. Only the small
// index (ids, names, effect flags for the filter, and the effect table) is bundled; expandRecord()
// turns a trimmed shard record back into the full shape the components expect.
import index from './monsterSkillsIndex.json';

const shardOf = (id) => index.m[id][5];

// Same matching rules as before: id, then com2usId, then case-insensitive name.
const byCom2usId = new Map();
const byName = new Map();
for (const [id, [cid, name]] of Object.entries(index.m)) {
  if (cid) byCom2usId.set(cid, id);
  if (name) byName.set(name.toLowerCase(), id);
}

/** Skill-record id (`m-<com2usId>`) for a monster object, id, com2usId or name — null when unknown. */
export function resolveSkillId(monsterOrId) {
  if (!monsterOrId) return null;
  if (typeof monsterOrId === 'string' || typeof monsterOrId === 'number') {
    const key = String(monsterOrId);
    return index.m[key] ? key : byCom2usId.get(key) || byName.get(key.toLowerCase()) || null;
  }
  if (monsterOrId.id && index.m[monsterOrId.id]) return monsterOrId.id;
  if (monsterOrId.com2usId && byCom2usId.has(String(monsterOrId.com2usId))) return byCom2usId.get(String(monsterOrId.com2usId));
  if (monsterOrId.name && byName.has(monsterOrId.name.toLowerCase())) return byName.get(monsterOrId.name.toLowerCase());
  return null;
}

/** Synchronous filter flags from the index — no shard fetch needed. */
export function getSkillTags(monsterOrId) {
  const id = resolveSkillId(monsterOrId);
  if (!id) return null;
  const [, , passive, aoe, effects] = index.m[id];
  return { isPassive: Boolean(passive), isAoe: Boolean(aoe), effects: effects.map((i) => index.effects[i]) };
}

// --- shard store -------------------------------------------------------------------------------
const shardPromises = new Map(); // shard -> Promise<records>
const loadedShards = new Map();  // shard -> records (resolved)
const listeners = new Set();

export function loadShard(shard) {
  if (!shardPromises.has(shard)) {
    const url = `${import.meta.env.BASE_URL || '/'}data/skills/${shard}.json`;
    const promise = fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`skill shard ${shard}: HTTP ${res.status}`);
        return res.json();
      })
      .then((records) => {
        loadedShards.set(shard, records);
        listeners.forEach((fn) => fn(shard));
        return records;
      });
    shardPromises.set(shard, promise);
    promise.catch((err) => {
      console.error(`[skills] shard ${shard} failed:`, err);
      shardPromises.delete(shard); // let a failed fetch be retried
    });
  }
  return shardPromises.get(shard);
}

/** Notifies when any shard arrives; returns the unsubscribe function (useSyncExternalStore shape). */
export function subscribeShards(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** The compact record (stable reference) if its shard is in memory, else null. */
export function peekRecord(id) {
  const records = loadedShards.get(shardOf(id));
  return (records && records[id]) || null;
}

// inverse of compactSkill()/compactLeader() in scripts/build_skill_shards.mjs
function expandSkill(s) {
  const { icon, ef, ...rest } = s;
  const out = rest;
  if (icon !== undefined) out.iconUrl = index.skillIcon + icon;
  if (out.description === undefined && out.descriptionTh !== undefined) out.description = out.descriptionTh;
  if (ef) out.effects = ef.map(([i, chance]) => (chance === undefined ? { ...index.effects[i] } : { ...index.effects[i], chance }));
  return out;
}

function expandLeader(ls) {
  if (!ls || ls.icon === undefined) return ls;
  const { icon, ...rest } = ls;
  return { ...rest, iconUrl: index.leaderIcon + icon };
}

export function expandRecord(id, val) {
  return {
    id,
    com2usId: val.cid,
    name: val.name,
    baseStats: val.bs,
    leaderSkill: expandLeader(val.ls),
    skills: val.sk ? val.sk.map(expandSkill) : val.sk,
  };
}

/** Synchronous: the expanded record if already fetched, else null (see useMonsterSkills for React). */
export function getMonsterSkills(monsterOrId) {
  const id = resolveSkillId(monsterOrId);
  if (!id) return null;
  const val = peekRecord(id);
  return val ? expandRecord(id, val) : null;
}

/** Fetches the monster's shard if needed and resolves to the expanded record (null when unknown). */
export async function loadMonsterSkills(monsterOrId) {
  const id = resolveSkillId(monsterOrId);
  if (!id) return null;
  const records = await loadShard(shardOf(id));
  return records[id] ? expandRecord(id, records[id]) : null;
}

/** Synchronously get max skill levels for a monster from the index: [[skillId, maxLevel], ...] */
export function getMonsterMaxSkills(monsterOrId) {
  const id = resolveSkillId(monsterOrId);
  if (!id || !index.maxSkills) return null;
  return index.maxSkills[id] || null;
}

/**
 * Calculates skill status for a unit.
 * unit: { skills: [[skillId, level], ...] | 'max' | undefined, masterId, ... }
 * optionalSkillsData: expanded skill records if already loaded in component
 */
export function computeUnitSkillStatus(unit, optionalSkillsData = null) {
  if (!unit) return { hasData: false, isMaxSkilled: false, missingSkillups: 0, skills: [] };

  const isDemoMax = unit.skills === 'max';
  const userSkills = Array.isArray(unit.skills) ? unit.skills : null;
  const hasUserSkillData = Boolean(isDemoMax || (userSkills && userSkills.length > 0));

  // Try to use optionalSkillsData.skills first, else index.maxSkills
  const catalogSkills = optionalSkillsData?.skills || null;
  const maxSkillsList = getMonsterMaxSkills(unit.info || unit.masterId);

  if (!catalogSkills && !maxSkillsList) {
    return { hasData: hasUserSkillData, isMaxSkilled: false, missingSkillups: 0, skills: [] };
  }

  let totalMissing = 0;
  const list = catalogSkills || maxSkillsList.map(([id, maxLevel], idx) => ({
    id,
    maxLevel,
    slot: idx + 1,
    slotLabel: `S${idx + 1}`,
  }));

  const details = list.map((sk, sidx) => {
    const max = Number(sk.maxLevel) || (sk.skillups ? sk.skillups.length + 1 : 1);
    let curr = 1;
    if (isDemoMax) {
      curr = max;
    } else if (userSkills && userSkills.length > 0) {
      const match = userSkills.find((s) => {
        const sid = Array.isArray(s) ? s[0] : s?.id;
        return Number(sid) === Number(sk.id);
      });
      if (match) {
        curr = Array.isArray(match) ? Number(match[1]) : Number(match.level);
      } else if (userSkills[sidx]) {
        const item = userSkills[sidx];
        curr = Array.isArray(item) ? Number(item[1]) : Number(item?.level || 1);
      }
    } else {
      curr = null;
    }

    if (curr !== null) {
      curr = Math.min(Math.max(1, curr), max);
      const diff = Math.max(0, max - curr);
      totalMissing += diff;
      return {
        ...sk,
        currentLevel: curr,
        maxLevel: max,
        missing: diff,
        isMaxed: curr >= max,
      };
    }

    return {
      ...sk,
      currentLevel: null,
      maxLevel: max,
      missing: null,
      isMaxed: null,
    };
  });

  return {
    hasData: hasUserSkillData,
    isMaxSkilled: hasUserSkillData && totalMissing === 0,
    missingSkillups: totalMissing,
    skills: details,
  };
}

export default {
  getMonsterSkills,
  loadMonsterSkills,
  getSkillTags,
  resolveSkillId,
  getMonsterMaxSkills,
  computeUnitSkillStatus,
};
