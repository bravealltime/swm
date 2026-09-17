const fs = require('fs');
const path = require('path');

const db = JSON.parse(fs.readFileSync(path.resolve('src/data/monsterSkillsDatabase.json'), 'utf8'));
const uniqueMonsters = {};
for (const [key, val] of Object.entries(db)) {
  if (val.id && !uniqueMonsters[val.id]) {
    uniqueMonsters[val.id] = val;
  }
}
console.log('Unique monsters count:', Object.keys(uniqueMonsters).length);
const rawJson = JSON.stringify(uniqueMonsters);
console.log('Size with single key (minified):', (rawJson.length / (1024 * 1024)).toFixed(2), 'MB');
