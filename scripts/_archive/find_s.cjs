const fs = require('fs');

const js = fs.readFileSync('swgt_raw/swrt_index.js', 'utf8');
const idx = js.indexOf('uni.request({url:s+e');
console.log(js.substring(idx - 1000, idx - 400));
