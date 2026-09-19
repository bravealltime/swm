const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'swgt_raw', 'monsterCatalogGrid.html');
const html = fs.readFileSync(file, 'utf8');

// Match all monster containers
const regex = /<div class="[^"]*imageContainer[^"]*"[^>]*data-monstername="([^"]*)"[^>]*data-monsterunawakenedname="([^"]*)"[^>]*data-monsterelement="([^"]*)"[^>]*data-monsternaturalstars="([^"]*)"[^>]*>[\s\S]*?<img [^>]*data-src="([^"]*)"/g;

const monsters = [];
let m;
while ((m = regex.exec(html)) !== null) {
  monsters.push({
    name: m[1],
    unawakenedName: m[2],
    element: m[3].toLowerCase(),
    stars: parseInt(m[4]) || 5,
    imageUrl: m[5]
  });
}

console.log('Total monsters parsed from SWGT catalog:', monsters.length);

// Count by element
const byElem = {};
const byStar = {};
monsters.forEach(unit => {
  byElem[unit.element] = (byElem[unit.element] || 0) + 1;
  byStar[unit.stars] = (byStar[unit.stars] || 0) + 1;
});
console.log('By Element:', byElem);
console.log('By Stars:', byStar);

// Print 5 samples
console.log('\nSample 5 monsters:');
console.log(monsters.slice(0, 5));
