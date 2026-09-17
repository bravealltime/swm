const fs = require('fs');
const path = require('path');

const db = JSON.parse(fs.readFileSync(path.resolve('src/data/monsterSkillsDatabase.json'), 'utf8'));
const compactDb = {};

for (const [key, val] of Object.entries(db)) {
  if (val.id && !compactDb[val.id]) {
    compactDb[val.id] = {
      cid: val.com2usId,
      name: val.name,
      bs: val.baseStats,
      ls: val.leaderSkill,
      sk: val.skills.map(s => ({
        id: s.id,
        slot: s.slot,
        slotLabel: s.slotLabel,
        isPassive: s.isPassive,
        isAoe: s.isAoe,
        hits: s.hits,
        cooldown: s.cooldown,
        cooldownText: s.cooldownText,
        multiplier: s.multiplier,
        scalesWith: s.scalesWith,
        name: s.name,
        description: s.description,
        descriptionTh: s.descriptionTh,
        tactics: s.tactics,
        iconUrl: s.iconUrl,
        effects: s.effects,
        skillups: s.skillups,
        maxLevel: s.maxLevel
      }))
    };
  }
}

fs.writeFileSync(path.resolve('src/data/monsterSkillsData.json'), JSON.stringify(compactDb));
// Delete huge unoptimized file
if (fs.existsSync(path.resolve('src/data/monsterSkillsDatabase.json'))) {
  fs.unlinkSync(path.resolve('src/data/monsterSkillsDatabase.json'));
}

console.log('Optimized monsterSkillsData.json written successfully! Size:', (fs.statSync('src/data/monsterSkillsData.json').size / (1024 * 1024)).toFixed(2), 'MB');
