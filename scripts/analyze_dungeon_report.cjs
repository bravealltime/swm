const fs = require('fs');
const html = fs.readFileSync('swgt_raw/dungeon_8011_2.html', 'utf8');

// Search for all headers and table titles
const matches = html.match(/<div class="[^"]*text-center[^"]*"[^>]*>([^<]+)<\/div>/g) || [];
console.log('Section headers:');
for (const m of matches) {
  const text = m.replace(/<[^>]+>/g, '').trim();
  if (text.length > 0) {
    console.log('-', text);
  }
}

// Find table classes or headers
const tableHeaders = html.match(/<th[^>]*>([^<]+)<\/th>/g) || [];
console.log('\nSample TH headers:', tableHeaders.slice(0, 20).map(t => t.replace(/<[^>]+>/g, '').trim()));
