const fs = require('fs');

async function downloadMonsters() {
  console.log('Downloading all monsters from swarfarm with concurrency...');
  const totalPages = 31;
  const pagePromises = [];
  const monstersMap = {}; // com2us_id -> monster

  for (let p = 1; p <= totalPages; p++) {
    pagePromises.push(
      fetch(`https://swarfarm.com/api/v2/monsters/?page=${p}`)
        .then(res => res.json())
        .then(data => {
          console.log(`Monsters page ${p} received: ${data.results.length} items`);
          for (const m of data.results) {
            if (m.com2us_id) {
              monstersMap[m.com2us_id] = {
                id: m.id,
                name: m.name,
                com2us_id: m.com2us_id,
                family_id: m.family_id,
                image_filename: m.image_filename,
                element: m.element,
                natural_stars: m.natural_stars,
                archetype: m.archetype,
                leader_skill: m.leader_skill,
                skills: m.skills,
                skill_ups_to_max: m.skill_ups_to_max,
                raw_hp: m.max_lvl_hp,
                raw_atk: m.max_lvl_attack,
                raw_def: m.max_lvl_defense,
                speed: m.speed,
                crit_rate: m.crit_rate,
                crit_damage: m.crit_damage,
                resistance: m.resistance,
                accuracy: m.accuracy
              };
            }
          }
        })
        .catch(err => console.error(`Error on monster page ${p}:`, err.message))
    );
  }

  await Promise.all(pagePromises);
  fs.writeFileSync('swgt_raw/swarfarm_monsters.json', JSON.stringify(monstersMap, null, 2));
  console.log(`Successfully saved swgt_raw/swarfarm_monsters.json! Total monsters: ${Object.keys(monstersMap).length}`);
}

downloadMonsters().catch(console.error);
