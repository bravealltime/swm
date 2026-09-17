const fs = require('fs');

const js = fs.readFileSync('swgt_raw/swrt_index.js', 'utf8');
const idx = js.indexOf('a1d7:function');
const idx2 = js.indexOf('"a1d7":function');
const target = idx !== -1 ? idx : idx2;
if (target !== -1) {
  console.log(js.substring(target - 20, target + 300));
} else {
  console.log('Not found');
}
