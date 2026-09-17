const fs = require('fs');
const path = require('path');
const sfSkills = JSON.parse(fs.readFileSync(path.resolve('swgt_raw/swarfarm_skills.json'), 'utf8'));

const effectNames = new Set();
for (const s of Object.values(sfSkills)) {
  for (const e of s.effects || []) {
    if (e.name) effectNames.add(e.name);
  }
}
console.log('Total unique effects:', effectNames.size);
console.log('List of effects:', Array.from(effectNames).sort());
