const fs = require('fs');

const js = fs.readFileSync('swgt_raw/swrt_index.js', 'utf8');
const idx = js.indexOf('uniEnv');
console.log(js.substring(idx - 200, idx + 400));
