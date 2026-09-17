const fs = require('fs');
const html = fs.readFileSync('swgt_raw/dungeonStats.html', 'utf8');

// Search for any mention of speed, team, clear, fast, run
const lines = html.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('speed') || line.includes('Speed') || line.includes('Fast') || line.includes('Team') || line.includes('team') || line.includes('Leader')) {
    if (!line.includes('jquery') && !line.includes('css') && !line.includes('bootstrap')) {
      console.log(`Line ${i + 1}:`, line.trim().substring(0, 140));
    }
  }
}
