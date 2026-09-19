const fs = require('fs');

const js = fs.readFileSync('swgt_raw/swrt_index.js', 'utf8');
const idx = js.indexOf('uni.request({url:s+e');
if (idx !== -1) {
  console.log(js.substring(idx - 400, idx + 600));
} else {
  console.log('Not found');
}
