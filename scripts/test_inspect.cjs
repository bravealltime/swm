const fs = require('fs');
const content = fs.readFileSync('swgt_raw/monsterCatalogGrid.html', 'utf8');

// Search for data-viewelement
const regex = /data-viewelement="([^"]+)"/g;
let match;
let count = 0;
while ((match = regex.exec(content)) !== null) {
  count++;
  if (count <= 3) {
    console.log(`--- Monster ${count} ---`);
    console.log(match[1]);
  }
}
console.log('Total data-viewelements:', count);
