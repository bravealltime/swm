const fs = require('fs');
const path = require('path');
const rawDir = path.join(__dirname, '..', 'swgt_raw');

function findAjax(filename) {
  const content = fs.readFileSync(path.join(rawDir, filename), 'utf8');
  console.log(`\n=== Ajax calls in ${filename} ===`);
  const ajaxMatches = content.match(/url\s*:\s*['"][^'"]+['"]/gi) || [];
  console.log(ajaxMatches);
}

['recruiting.html', 'dungeonStats.html', 'where2use.html', 'stats3mdc.html', 'artifactFinder.html', 'siegeLeaderboard.html', 'wgbLeaderboard.html', 'labLeaderboard.html', 'subjugationLeaderboard.html'].forEach(findAjax);
