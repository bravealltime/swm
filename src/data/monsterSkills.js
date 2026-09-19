// Monster skill records are fetched in shards from public/data/skills/<n>.json (generated from
// monsterSkillsData.json by scripts/build_skill_shards.mjs at dev/build start) so the encyclopedia
// renders immediately instead of shipping the whole dataset as one 5 MB chunk. Only the small
// index (ids, names and effect flags for the filter) is bundled.
import index from './monsterSkillsIndex.json';

const SHARD_COUNT = index.shards;

// keep in sync with shardOf() in scripts/build_skill_shards.mjs
function shardOf(id) {
  let h = 0;
  for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % SHARD_COUNT;
}

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

export function expandRecord(id, val) {
  return { id, com2usId: val.cid, name: val.name, baseStats: val.bs, leaderSkill: val.ls, skills: val.sk };
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

export default {
  getMonsterSkills,
  loadMonsterSkills,
  getSkillTags,
  resolveSkillId,
};
