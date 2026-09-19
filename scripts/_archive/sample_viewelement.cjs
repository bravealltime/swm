const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'swgt_raw', 'monsterCatalogGrid.html');
const html = fs.readFileSync(file, 'utf8');

// Match monster blocks
const blockRe = /<div class="[^"]*grid-item[^"]*"([\s\S]*?)<\/div>\s*<\/div>/g;
// Or match data-viewelement
const viewElRe = /data-viewelement="([\s\S]*?)">/g;

let m = viewElRe.exec(html);
if (m) {
  console.log('Sample data-viewelement:\n', m[1]);
}
