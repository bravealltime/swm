const fs = require('fs');
const path = require('path');

const myMonsters = JSON.parse(fs.readFileSync(path.resolve('src/data/allMonsters.json'), 'utf8'));
const sfMonsters = JSON.parse(fs.readFileSync(path.resolve('swgt_raw/swarfarm_monsters.json'), 'utf8'));
const sfSkills = JSON.parse(fs.readFileSync(path.resolve('swgt_raw/swarfarm_skills.json'), 'utf8'));

console.log('Local monsters:', myMonsters.length);
console.log('Swarfarm monsters:', Object.keys(sfMonsters).length);
console.log('Swarfarm skills:', Object.keys(sfSkills).length);

const nameLookup = {};
for (const [comId, m] of Object.entries(sfMonsters)) {
  nameLookup[m.name.toLowerCase()] = m;
}

let matchedByCom2us = 0;
let matchedByName = 0;
let unmatched = [];

for (const m of myMonsters) {
  const sfM = sfMonsters[m.com2usId] || nameLookup[(m.name || '').toLowerCase()];
  if (sfMonsters[m.com2usId]) {
    matchedByCom2us++;
  } else if (nameLookup[(m.name || '').toLowerCase()]) {
    matchedByName++;
  } else {
    unmatched.push({ name: m.name, com2usId: m.com2usId, element: m.element });
  }
}

console.log(`Matched by com2usId: ${matchedByCom2us}`);
console.log(`Matched by name: ${matchedByName}`);
console.log(`Total matched: ${matchedByCom2us + matchedByName} / ${myMonsters.length}`);
console.log(`Unmatched count: ${unmatched.length}`);
if (unmatched.length > 0) {
  console.log('Unmatched samples:', unmatched.slice(0, 10));
}
