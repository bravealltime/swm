const fs = require('fs');
const html = fs.readFileSync('swgt_raw/dungeonStats.html', 'utf8');
const lines = html.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('startDate') || line.includes('endDate')) {
    console.log(`Line ${i + 1}: ${line.trim()}`);
  }
}
