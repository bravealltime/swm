const db = require('./src/data/monsterSkillsDatabase.json');
const allM = Object.values(db).filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
console.log('Unique monsters:', allM.length);
const withDefBreak = allM.filter(m => m.skills.some(s => s.effects.some(e => e.name === 'Decrease DEF')));
const withPassive = allM.filter(m => m.skills.some(s => s.isPassive));
const withAoe = allM.filter(m => m.skills.some(s => s.isAoe));
console.log('With Def Break:', withDefBreak.length);
console.log('With Passive:', withPassive.length);
console.log('With AOE:', withAoe.length);
