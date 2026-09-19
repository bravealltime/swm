const fs = require('fs');
const content = fs.readFileSync('swgt_raw/monsterCatalogGrid.html', 'utf8');

const idx = content.indexOf('data-viewelement=');
console.log(content.substring(idx - 1200, idx));
