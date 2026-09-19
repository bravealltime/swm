const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'swgt_raw', 'sample_counter_result.html');
const html = fs.readFileSync(file, 'utf8');

console.log('Total file length:', html.length);

// Look for tables, cards or counter rows
const trMatches = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) || [];
console.log('Total tr rows:', trMatches.length);

for (let i = 0; i < Math.min(10, trMatches.length); i++) {
  const tr = trMatches[i];
  if (tr.includes('unit_icon') || tr.includes('%') || tr.includes('counter')) {
    console.log(`\n--- TR #${i} ---`);
    console.log(tr.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 300));
  }
}

// Check for win rates, notes, authors
const winMatch = html.match(/(\d+(\.\d+)?%)/g) || [];
console.log('Winrate matches sample:', winMatch.slice(0, 10));

// Find notes or comments
const notesMatch = html.match(/class="[^"]*notes[^"]*"[^>]*>([\s\S]*?)<\/div>/gi) || [];
console.log('Notes count:', notesMatch.length);
