const fs = require('fs');
const html = fs.readFileSync('swgt_raw/monster_20831.html', 'utf8');

// Find headings, skill names, skill sections
const lines = html.split('\n');
console.log('Total lines:', lines.length);

const matches = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('Skill 1') || line.includes('Skill 2') || line.includes('Skill 3') || line.includes('skills36') || line.includes('Leader Skill')) {
    matches.push({ line: i + 1, text: line.trim().substring(0, 140) });
    if (matches.length > 30) break;
  }
}
console.log('Matches:');
console.log(matches);
