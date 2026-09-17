const fs = require('fs');

async function inspectTierList() {
  const res = await fetch('https://m.swranking.com/api/monsterBase/getMonsterLevel', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://m.swranking.com/'
    }
  });
  const json = await res.json();
  console.log('Tier list response keys:', Object.keys(json.data));
  console.log('Season:', json.data.season, 'Version:', json.data.version, 'Date:', json.data.createDate);

  for (const tierKey of ['sssMonster', 'ssMonster', 'sMonster', 'aMonster', 'bMonster', 'cMonster', 'dMonster']) {
    const list = json.data[tierKey] || [];
    console.log(`Tier ${tierKey}: count = ${list.length}`);
    if (list.length > 0) {
      console.log(`  Sample ${tierKey}:`, list[0]);
    }
  }

  fs.writeFileSync('swgt_raw/swrt_tier_list.json', JSON.stringify(json.data, null, 2));
  console.log('Saved swgt_raw/swrt_tier_list.json');
}

inspectTierList().catch(console.error);
