const https = require('https');
const querystring = require('querystring');
const fs = require('fs');
const path = require('path');

const dungeons = [
  { id: '8011', stage: '2', slug: 'giants_abyss_hard', name: "Giant's Keep (Abyss Hard)" },
  { id: '9011', stage: '2', slug: 'dragons_abyss_hard', name: "Dragon's Lair (Abyss Hard)" },
  { id: '6011', stage: '2', slug: 'necropolis_abyss_hard', name: "Necropolis (Abyss Hard)" },
  { id: '9513', stage: '2', slug: 'spiritual_abyss_hard', name: "Spiritual Realm (Abyss Hard)" },
  { id: '9511', stage: '2', slug: 'steel_abyss_hard', name: "Steel Fortress (Abyss Hard)" },
  { id: '9512', stage: '2', slug: 'punishers_abyss_hard', name: "Punisher's Crypt (Abyss Hard)" }
];

function fetchDungeon(d) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(__dirname, `../swgt_raw/dungeon_${d.id}_${d.stage}.html`);
    if (fs.existsSync(filePath) && fs.statSync(filePath).size > 10000) {
      console.log(`${d.name} already exists (${fs.statSync(filePath).size} bytes), skipping.`);
      return resolve();
    }

    console.log(`Fetching ${d.name} (${d.id}_${d.stage})...`);
    const postData = querystring.stringify({
      dungeon_id: d.id,
      stage_id: d.stage,
      startDate: '08/17/2026',
      endDate: '09/16/2026',
      renderOnSelectedTab: ''
    });

    const req = https.request({
      hostname: 'swgt.io',
      path: '/controllers/dungeonAnalysis/ajaxLoadDungeon',
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Content-Length': Buffer.byteLength(postData),
        'X-Requested-With': 'XMLHttpRequest'
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        fs.writeFileSync(filePath, data);
        console.log(`Saved ${d.name} (${data.length} bytes)`);
        resolve();
      });
    });

    req.on('error', err => {
      console.error(`Error fetching ${d.name}:`, err.message);
      resolve();
    });

    req.write(postData);
    req.end();
  });
}

async function run() {
  for (const d of dungeons) {
    await fetchDungeon(d);
    await new Promise(r => setTimeout(r, 600));
  }
  console.log('All dungeons fetched successfully.');
}

run();
