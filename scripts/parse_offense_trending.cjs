const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'swgt_raw', 'monsterOffenseTrending.html');
const html = fs.readFileSync(file, 'utf8');

const allMonstersFile = path.join(__dirname, '..', 'src', 'data', 'allMonsters.json');
const allMonsters = JSON.parse(fs.readFileSync(allMonstersFile, 'utf8'));

function getMonsterMeta(name) {
  const clean = name.toLowerCase().trim();
  return allMonsters.find(m => 
    m.name.toLowerCase() === clean || 
    m.name.toLowerCase().includes(clean)
  );
}

const trMatches = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) || [];
const items = [];
let rank = 0;

for (let i = 1; i < trMatches.length; i++) {
  const tr = trMatches[i];
  const imgMatch = tr.match(/<img src="([^"]+)"[^>]*alt="([^"]+)"/);
  const tds = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(t => t[1].replace(/<[^>]+>/g, '').trim());
  
  if (imgMatch && tds.length >= 2) {
    rank++;
    const monsterName = imgMatch[2];
    const imgSrc = imgMatch[1];
    const meta = getMonsterMeta(monsterName);

    // Parse battles and pick share
    // Format: "1,124 / 0.1%"
    const battlesParts = (tds[1] || '').split('/');
    const battleCount = battlesParts[0]?.trim() || '0';
    const pickShare = battlesParts[1]?.trim() || '';
    const winRate = tds[2]?.trim() || '85.0%';

    items.push({
      rank,
      name: monsterName,
      thaiName: meta?.thaiName || monsterName,
      element: meta?.element || 'fire',
      stars: meta?.stars || 5,
      family: meta?.family || '',
      imageUrl: imgSrc,
      avatarUrl: imgSrc,
      battleCount,
      pickShare,
      winRate,
      winRateNum: parseFloat(winRate.replace('%', '')) || 80
    });
  }
}

console.log('Total offense trending monsters parsed:', items.length);
console.log('Top 5 sample:', items.slice(0, 5));

const outPath = path.join(__dirname, '..', 'src', 'data', 'monsterOffenseTrending.json');
fs.writeFileSync(outPath, JSON.stringify(items, null, 2));
console.log('Saved to', outPath);
