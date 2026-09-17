const fs = require('fs');
const path = require('path');

const tierData = JSON.parse(fs.readFileSync('src/data/swrtTierList.json', 'utf8'));
const ssMonsters = tierData.tiers.SS || [];
console.log(`Fetching highdata (counters & synergies) for ${ssMonsters.length} SS-tier monsters...`);

const localMonsters = JSON.parse(fs.readFileSync(path.resolve('src/data/allMonsters.json'), 'utf8'));
const monsterLookup = {};
for (const m of localMonsters) {
  monsterLookup[m.com2usId] = m;
  monsterLookup[m.name.toLowerCase()] = m;
}

async function fetchHighdataBatch() {
  const highdataMap = {};
  const batch = [];

  for (const m of ssMonsters) {
    batch.push(
      fetch(`https://m.swranking.com/api/monster/highdata?season=38&monsterId=${m.monsterId}&factor=0.01`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      })
      .then(res => res.json())
      .then(json => {
        const d = json.data || {};
        highdataMap[m.monsterId] = {
          monsterId: m.monsterId,
          synergies: (d.highOneWithOneList || []).slice(0, 5).map(s => {
            const loc = monsterLookup[s.teamMonsterId] || {};
            return {
              monsterId: s.teamMonsterId,
              name: loc.name || 'Monster',
              thaiName: loc.thaiName || loc.nameTh || loc.name,
              element: (loc.element || 'fire').toLowerCase(),
              winRate: +(+s.winRate * 100).toFixed(1),
              matches: s.pickTotal,
              avatarUrl: `https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/${s.teamImgFilename || 'unit_icon_0001_0_0.png'}`
            };
          }),
          counters: (d.lowOneVsOneList || []).slice(0, 5).map(c => {
            const loc = monsterLookup[c.opponentMonsterId] || {};
            return {
              monsterId: c.opponentMonsterId,
              name: loc.name || 'Monster',
              thaiName: loc.thaiName || loc.nameTh || loc.name,
              element: (loc.element || 'fire').toLowerCase(),
              winRate: +(+c.winRate * 100).toFixed(1),
              matches: c.pickTotal,
              avatarUrl: `https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/${c.oppoImgFilename || 'unit_icon_0001_0_0.png'}`
            };
          })
        };
        console.log(`Fetched highdata for ${m.name}`);
      })
      .catch(e => console.warn(`Failed for ${m.name}:`, e.message))
    );
  }

  await Promise.all(batch);
  fs.writeFileSync('src/data/swrtMonsterHighdata.json', JSON.stringify(highdataMap, null, 2));
  console.log(`Saved highdata for ${Object.keys(highdataMap).length} monsters!`);
}

fetchHighdataBatch();
