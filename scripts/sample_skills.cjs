const fs = require('fs');
const path = require('path');

const myMonsters = JSON.parse(fs.readFileSync(path.resolve('src/data/allMonsters.json'), 'utf8'));
const sfMonsters = JSON.parse(fs.readFileSync(path.resolve('swgt_raw/swarfarm_monsters.json'), 'utf8'));
const sfSkills = JSON.parse(fs.readFileSync(path.resolve('swgt_raw/swarfarm_skills.json'), 'utf8'));

// Test Tractor (20831) and Feng Yan (19213)
const samples = ['20831', '19213'];
for (const cid of samples) {
  const m = sfMonsters[cid];
  console.log(`=== Monster: ${m.name} (${m.element}) ===`);
  console.log('Leader Skill:', m.leader_skill);
  console.log('Stats:', { hp: m.raw_hp, atk: m.raw_atk, def: m.raw_def, spd: m.speed });
  console.log('Skills count:', m.skills.length);
  for (const sid of m.skills) {
    const s = sfSkills[sid];
    if (s) {
      console.log(`- [Slot ${s.slot} | ${s.passive ? 'Passive' : 'Cooldown: ' + (s.cooltime || 'None')}] ${s.name}: ${s.description.substring(0, 80)}...`);
      console.log(`  Multiplier: ${s.multiplier_formula || 'None'}, Scales: ${s.scales_with.join(', ')}, Hits: ${s.hits}, MaxLvl: ${s.max_level}`);
      console.log(`  Effects: ${s.effects.map(e => e.name).join(', ')}`);
    }
  }
}
