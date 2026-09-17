const fs = require('fs');

const js = fs.readFileSync('swgt_raw/swrt_index.js', 'utf8');
const pos = 8817;
console.log(js.substring(pos - 300, pos + 2500));
