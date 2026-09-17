const fs = require('fs');

const js = fs.readFileSync('swgt_raw/swrt_index.js', 'utf8');

const idx = js.indexOf('packageA-pages-monster-rank-rank');
console.log('--- rank snippet ---');
console.log(js.substring(idx - 100, idx + 1000));

const idxDetail = js.indexOf('packageA-pages-monster-detail-detail');
console.log('--- detail snippet ---');
console.log(js.substring(idxDetail - 100, idxDetail + 1000));
