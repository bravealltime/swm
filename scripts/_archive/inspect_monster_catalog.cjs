const fs = require('fs');
const html = fs.readFileSync('swgt_raw/monsterCatalogGrid.html', 'utf8');

console.log('Total file length:', html.length);

// Look for skill mentions, data-content, tooltip, popover, skills36
const lines = html.split('\n');
const sampleMatches = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('skill') || line.includes('popover') || line.includes('tooltip') || line.includes('data-content') || line.includes('skill_icon')) {
    sampleMatches.push({ line: i + 1, text: line.trim().substring(0, 160) });
    if (sampleMatches.length > 30) break;
  }
}

console.log('Sample matches:');
console.log(sampleMatches);
