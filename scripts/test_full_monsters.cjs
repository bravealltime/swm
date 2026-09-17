const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'swgt_raw', 'monsterCatalogGrid.html');
const html = fs.readFileSync(file, 'utf8');

// Match each item
const itemRe = /<div class="[^"]*imageContainer[^"]*"[^>]*data-monstername="([^"]*)"[^>]*data-monsterunawakenedname="([^"]*)"[^>]*data-monsterelement="([^"]*)"[^>]*data-monsternaturalstars="([^"]*)"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/g;

let count = 0;
let m;
const parsed = [];

while ((m = itemRe.exec(html)) !== null) {
  count++;
  const name = m[1];
  const unawakened = m[2];
  const element = m[3].toLowerCase();
  const stars = parseInt(m[4]) || 5;
  const inner = m[5];
  
  // com2usID
  const idMatch = inner.match(/com2usID=(\d+)/);
  const com2usId = idMatch ? idMatch[1] : `mon-${count}`;
  
  // img url
  const imgMatch = inner.match(/data-src="([^"]+)"/);
  const imageUrl = imgMatch ? imgMatch[1] : '';
  
  // Archetype
  const archMatch = inner.match(/Archetype<\/div>\s*<div[^>]*>([^<]+)<\/div>/);
  const archetype = archMatch ? archMatch[1].trim() : 'Attack';
  
  // Family
  const famMatch = inner.match(/Family<\/div>\s*<div[^>]*>([^<]+)<\/div>/);
  const family = famMatch ? famMatch[1].trim() : unawakened;
  
  // Leader Skill
  const leadMatch = inner.match(/Leader Skill:<\/strong>&nbsp;([^<]+)/);
  const leaderSkill = leadMatch ? leadMatch[1].trim() : '';
  
  parsed.push({
    id: `m-${com2usId}`,
    com2usId,
    name,
    unawakenedName: unawakened,
    family: family || unawakened,
    element,
    stars,
    archetype,
    leaderSkill,
    imageUrl,
    avatarUrl: imageUrl
  });
}

console.log('Successfully fully parsed:', parsed.length);
console.log('Sample parsed with details:', parsed[0]);
console.log('Sample Nat 5:', parsed.find(p => p.stars === 5 && p.element === 'fire'));
console.log('Sample Nat 4:', parsed.find(p => p.stars === 4 && p.element === 'water'));
console.log('Sample Light/Dark:', parsed.find(p => p.stars === 5 && p.element === 'dark'));
