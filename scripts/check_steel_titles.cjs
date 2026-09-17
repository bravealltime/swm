const fs = require('fs');
const html = fs.readFileSync('swgt_raw/dungeon_9511_2.html', 'utf8');
const matches = html.match(/text:\s*['"]([^'"]+)['"]/g) || [];
console.log('Steel Fortress chart titles:', matches);
