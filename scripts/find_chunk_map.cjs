const fs = require('fs');

const js = fs.readFileSync('swgt_raw/swrt_index.js', 'utf8');

// Find all occurrences of "packageA-pages-monster-rank-rank"
let idx = 0;
while ((idx = js.indexOf('packageA-pages-monster-rank-rank', idx)) !== -1) {
  console.log('Match at', idx, ':', js.substring(idx - 50, idx + 150));
  idx += 30;
}
