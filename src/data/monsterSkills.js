import compactData from './monsterSkillsData.json';

// In-memory lookup tables
const byId = {};
const byCom2usId = {};
const byName = {};

for (const [id, val] of Object.entries(compactData)) {
  const item = {
    id,
    com2usId: val.cid,
    name: val.name,
    baseStats: val.bs,
    leaderSkill: val.ls,
    skills: val.sk
  };

  byId[id] = item;
  if (val.cid) byCom2usId[val.cid] = item;
  if (val.name) byName[val.name.toLowerCase()] = item;
}

export function getMonsterSkills(monsterOrId) {
  if (!monsterOrId) return null;
  
  if (typeof monsterOrId === 'string' || typeof monsterOrId === 'number') {
    const key = String(monsterOrId);
    return byId[key] || byCom2usId[key] || byName[key.toLowerCase()] || null;
  }

  if (monsterOrId.id && byId[monsterOrId.id]) {
    return byId[monsterOrId.id];
  }

  if (monsterOrId.com2usId && byCom2usId[monsterOrId.com2usId]) {
    return byCom2usId[monsterOrId.com2usId];
  }

  if (monsterOrId.name && byName[monsterOrId.name.toLowerCase()]) {
    return byName[monsterOrId.name.toLowerCase()];
  }

  return null;
}

export default {
  getMonsterSkills
};
