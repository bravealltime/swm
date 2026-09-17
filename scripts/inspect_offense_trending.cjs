const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'swgt_raw', 'monsterOffenseTrending.html');
const html = fs.readFileSync(file, 'utf8');

console.log('File size:', html.length);

// Look for table headers
const thMatches = html.match(/<th[^>]*>([\s\S]*?)<\/th>/g) || [];
console.log('Headers:', thMatches.map(h => h.replace(/<[^>]+>/g, '').trim()));

// Look for first 5 tr rows
const trMatches = html.match(/<tr[^>]*>([\s\S]*?)<\/tr>/g) || [];
console.log('Total rows:', trMatches.length);

for (let i = 1; i < Math.min(6, trMatches.length); i++) {
  const tr = trMatches[i];
  const tds = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(t => t[1].replace(/<[^>]+>/g, '').trim());
  const imgMatch = tr.match(/alt="([^"]+)"/);
  console.log(`Row #${i}: Monster=${imgMatch ? imgMatch[1] : 'Unknown'}, Data=`, tds);
}
