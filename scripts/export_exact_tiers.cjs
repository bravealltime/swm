const fs = require('fs');

const allMonsters = require('../src/data/allMonsters.json');
const monsterMap = {};
allMonsters.forEach(m => {
  if (m.com2usId) monsterMap[m.com2usId] = m;
  if (m.name) monsterMap[m.name.toLowerCase()] = m;
});

function parseTierHtml(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');
  const result = {};

  const parts = html.split(/<div class="col-1 [^>]*>/);

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const endDivIdx = part.indexOf('</div>');
    if (endDivIdx === -1) continue;

    const tierName = part.slice(0, endDivIdx).trim();
    if (!['SSS', 'SS', 'S', 'A', 'B', 'C', 'D', 'F', 'Other'].includes(tierName)) continue;

    const monsterBlock = part.slice(endDivIdx);
    const monsters = [];
    const aParts = monsterBlock.split('<a href="/monsterSearch/?com2usID=');

    for (let j = 1; j < aParts.length; j++) {
      const aChunk = aParts[j];
      const qIdx = aChunk.indexOf('"');
      if (qIdx === -1) continue;
      const com2usId = parseInt(aChunk.slice(0, qIdx));

      const imgMatch = aChunk.match(/<img[^>]+src="([^"]+)"/);
      const img = imgMatch ? imgMatch[1] : '';

      const decoded = aChunk
        .replace(/&#039;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');

      const nMatch = decoded.match(/Name<\/div>\s*<div[^>]*>([^<]+)<\/div>/i);
      const bMatch = decoded.match(/Battles<\/div>\s*<div[^>]*>([^<]+)<\/div>/i);
      const pMatch = decoded.match(/Pick Share<\/div>\s*<div[^>]*>([^<]+)<\/div>/i);
      const wMatch = decoded.match(/WR%<\/div>\s*<div[^>]*>([^<]+)<\/div>/i);

      const name = nMatch ? nMatch[1].trim() : '';
      const localM = monsterMap[com2usId] || monsterMap[name.toLowerCase()] || {};

      monsters.push({
        com2usId,
        name: localM.name || name,
        thaiName: localM.thaiName || localM.name || name,
        element: (localM.element || 'water').toLowerCase(),
        stars: localM.stars || 5,
        imageUrl: img || localM.imageUrl,
        avatarUrl: img || localM.imageUrl,
        battles: bMatch ? bMatch[1].trim() : '',
        battleCount: bMatch ? bMatch[1].trim() : '',
        pickShare: pMatch ? pMatch[1].trim() : '',
        winRate: wMatch ? wMatch[1].trim() : '',
        winRateNum: wMatch ? parseFloat(wMatch[1]) : 0,
        tier: tierName
      });
    }

    result[tierName] = monsters;
  }

  return result;
}

const defTiers = parseTierHtml('./swgt_raw/tier_defense_view.html');
const offTiers = parseTierHtml('./swgt_raw/tier_offense_view.html');

fs.writeFileSync('./src/data/swgtDefenseTiers.json', JSON.stringify(defTiers, null, 2), 'utf8');
fs.writeFileSync('./src/data/swgtOffenseTiers.json', JSON.stringify(offTiers, null, 2), 'utf8');

console.log('Saved swgtDefenseTiers.json:');
Object.keys(defTiers).forEach(t => console.log(`  Tier ${t}: ${defTiers[t].length} monsters (${defTiers[t].slice(0, 3).map(m => m.name).join(', ')})`));

console.log('Saved swgtOffenseTiers.json:');
Object.keys(offTiers).forEach(t => console.log(`  Tier ${t}: ${offTiers[t].length} monsters (${offTiers[t].slice(0, 3).map(m => m.name).join(', ')})`));
