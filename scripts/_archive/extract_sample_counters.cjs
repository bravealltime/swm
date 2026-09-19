const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'swgt_raw', 'sample_counter_result.html');
const html = fs.readFileSync(file, 'utf8');

// Match swgt-3mdc-card
const cards = html.split('<div class="swgt-3mdc-card');
console.log('Total counter cards found:', cards.length - 1);

for (let i = 1; i < cards.length; i++) {
  const c = cards[i];
  const titleMatch = c.match(/<div class="swgt-3mdc-title">([\s\S]*?)<\/div>/);
  const byMatch = c.match(/<strong>By:<\/strong>\s*([^<]+)/);
  const ratingMatch = c.match(/<span class="swgt-3mdc-ratingScoreValue">([\s\S]*?)<\/span>/);
  const imgs = [...c.matchAll(/<img[^>]*alt="([^"]+)"/g)].map(im => im[1]);
  
  console.log(`Counter #${i}:`, {
    title: titleMatch ? titleMatch[1].trim() : '',
    by: byMatch ? byMatch[1].trim() : '',
    rating: ratingMatch ? ratingMatch[1].trim() : '5.0',
    monsters: imgs.slice(0, 3)
  });
}
