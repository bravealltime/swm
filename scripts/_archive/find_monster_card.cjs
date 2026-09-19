const fs = require('fs');
const html = fs.readFileSync('swgt_raw/monsterCatalogGrid.html', 'utf8');

const idx = html.indexOf('swgt-monster-tooltip');
console.log('Index of swgt-monster-tooltip:', idx);
if (idx !== -1) {
  console.log(html.substring(idx - 100, idx + 1500));
}
