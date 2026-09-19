const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'swgt_raw', 'monsterCatalogGrid.html');
const html = fs.readFileSync(file, 'utf8');

console.log('Total file size:', html.length);

// Look for image and monster tags
const sampleMatches = html.substring(html.indexOf('<div class="container'), html.indexOf('<div class="container') + 3000);
console.log('Sample container snippet:\n', sampleMatches.replace(/\s+/g, ' '));
