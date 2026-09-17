const fs = require('fs');

async function downloadSkills() {
  console.log('Downloading all skills from swarfarm...');
  let url = 'https://swarfarm.com/api/v2/skills/?page_size=1000';
  const allSkills = {};
  let page = 1;
  while (url) {
    console.log(`Fetching skills page ${page}... (${url})`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    for (const s of data.results) {
      allSkills[s.id] = {
        id: s.id,
        com2us_id: s.com2us_id,
        name: s.name,
        description: s.description,
        slot: s.slot,
        cooltime: s.cooltime,
        hits: s.hits,
        passive: s.passive,
        aoe: s.aoe,
        max_level: s.max_level,
        multiplier_formula: s.multiplier_formula,
        scales_with: s.scales_with || [],
        icon_filename: s.icon_filename,
        level_progress_description: s.level_progress_description || [],
        effects: (s.effects || []).map(e => ({
          name: e.effect ? e.effect.name : '',
          type: e.effect ? e.effect.type : '',
          chance: e.chance,
          aoe: e.aoe,
          note: e.note || '',
          icon_filename: e.effect ? e.effect.icon_filename : ''
        }))
      };
    }
    console.log(`Page ${page} done. Total skills accumulated: ${Object.keys(allSkills).length}`);
    url = data.next;
    page++;
  }
  fs.writeFileSync('swgt_raw/swarfarm_skills.json', JSON.stringify(allSkills, null, 2));
  console.log('Successfully saved swgt_raw/swarfarm_skills.json!');
}

downloadSkills().catch(console.error);
