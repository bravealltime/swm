const fs = require('fs');
const path = require('path');

const db = JSON.parse(fs.readFileSync(path.resolve('src/data/monsterSkillsDatabase.json'), 'utf8'));
const compactDb = {};

for (const [key, val] of Object.entries(db)) {
  if (val.id && !compactDb[val.id]) {
    compactDb[val.id] = {
      cid: val.com2usId,
      bs: val.baseStats,
      ls: val.leaderSkill,
      sk: val.skills.map(s => ({
        id: s.id,
        s: s.slot,
        lbl: s.slotLabel,
        p: s.isPassive ? 1 : 0,
        aoe: s.isAoe ? 1 : 0,
        h: s.hits,
        cd: s.cooldown,
        cdt: s.cooldownText,
        m: s.multiplier,
        sc: s.scalesWith,
        n: s.name,
        d: s.description,
        dt: s.descriptionTh,
        tac: s.tactics,
        ico: s.iconUrl,
        eff: s.effects,
        ups: s.skillups,
        max: s.maxLevel
      }))
    };
  }
}
const raw = JSON.stringify(compactDb);
console.log('Compact size:', (raw.length / (1024 * 1024)).toFixed(2), 'MB');
