const fs = require('fs');
const html = fs.readFileSync('swgt_raw/artifactFinder.html', 'utf8');

const matches = html.match(/\/controllers\/[a-zA-Z0-9_\/]+/g) || [];
console.log('Controllers in artifactFinder.html:', [...new Set(matches)]);

const lines = html.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('Additional Damage') || line.includes('Additional DMG') || line.includes('additional') || line.includes('Optimizer')) {
    console.log(`Line ${i + 1}: ${line.trim().substring(0, 140)}`);
  }
}
