const fs = require('fs');

const js = fs.readFileSync('swgt_raw/swrt_index.js', 'utf8');
const idx = js.indexOf('"a1d7"');
if (idx !== -1) {
  console.log(js.substring(idx - 50, idx + 300));
} else {
  console.log('Not found');
}
