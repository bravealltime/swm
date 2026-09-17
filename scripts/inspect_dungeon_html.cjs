const fs = require('fs');
const html = fs.readFileSync('swgt_raw/dungeonStats.html', 'utf8');
const lines = html.split('\n');

const results = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('table') || line.includes('dungeon') || line.includes('Abyss') || line.includes('Giant') || line.includes('Dragon') || line.includes('Necro') || line.includes('Steel') || line.includes('Punisher') || line.includes('Spiritual') || line.includes('Rift')) {
    results.push({ lineNum: i + 1, text: line.trim().substring(0, 160) });
  }
}

console.log('Total matches found:', results.length);
console.log(results.slice(0, 40));
