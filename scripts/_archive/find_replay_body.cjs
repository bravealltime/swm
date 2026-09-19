const fs = require('fs');

const code = fs.readFileSync('swgt_raw/swrt_monster-detail.js', 'utf8');
let idx = 0;
while ((idx = code.indexOf('getReplayAll', idx)) !== -1) {
  console.log(code.substring(idx - 100, idx + 350));
  idx += 15;
}
