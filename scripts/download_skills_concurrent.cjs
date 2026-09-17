const fs = require('fs');

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
      console.warn(`Retry ${i + 1} for ${url} (status ${res.status})`);
    } catch (e) {
      console.warn(`Retry ${i + 1} for ${url} (${e.message})`);
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error(`Failed to fetch ${url}`);
}

async function downloadAllSkills() {
  console.log('Downloading all skills (54 pages) concurrently in batches of 8...');
  const totalPages = 54;
  const allSkills = {};
  const batchSize = 8;

  for (let b = 1; b <= totalPages; b += batchSize) {
    const batch = [];
    for (let p = b; p < b + batchSize && p <= totalPages; p++) {
      batch.push(
        fetchWithRetry(`https://swarfarm.com/api/v2/skills/?page=${p}`)
          .then(data => {
            console.log(`Skills page ${p} received: ${data.results.length} items`);
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
          })
      );
    }
    await Promise.all(batch);
    console.log(`Batch finished. Accumulated: ${Object.keys(allSkills).length} skills`);
  }

  fs.writeFileSync('swgt_raw/swarfarm_skills.json', JSON.stringify(allSkills, null, 2));
  console.log(`ALL DONE! Total skills saved: ${Object.keys(allSkills).length}`);
}

downloadAllSkills().catch(console.error);
