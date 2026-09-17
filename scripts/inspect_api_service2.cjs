const fs = require('fs');

const js = fs.readFileSync('swgt_raw/swrt_index.js', 'utf8');
const pos = 137557 + 2400;
console.log(js.substring(pos, pos + 3500));
