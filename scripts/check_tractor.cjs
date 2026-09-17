const fs = require('fs');
const html = fs.readFileSync('swgt_raw/monsterCatalogGrid.html', 'utf8');

const idx = html.indexOf('data-monstername="Tractor"');
if (idx !== -1) {
  console.log(html.substring(idx - 50, idx + 800));
}
