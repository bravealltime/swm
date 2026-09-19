const fs = require('fs');

const js = fs.readFileSync('swgt_raw/swrt_index.js', 'utf8');
const pos = 137557;
console.log(js.substring(pos - 200, pos + 2500));
