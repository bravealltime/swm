const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'swgt_raw', 'monsterCatalogGrid.html');
const html = fs.readFileSync(file, 'utf8');

// Look for image tags with monsters36
const matches = [...html.matchAll(/<img[^>]*src="([^"]*monsters36[^"]*)"[^>]*>/gi)];
console.log('Total monster images matching monsters36:', matches.length);

if (matches.length > 0) {
  console.log('First 5 image tags:');
  for (let i = 0; i < Math.min(5, matches.length); i++) {
    console.log(matches[i][0]);
  }

  // Look around the first match to see the parent container
  const firstIdx = html.indexOf(matches[0][0]);
  console.log('\nSnippet around first monster:\n', html.substring(firstIdx - 200, firstIdx + 500).replace(/\s+/g, ' '));
}
