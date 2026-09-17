const fs = require('fs');

const js = fs.readFileSync('swgt_raw/swrt_index.js', 'utf8');
let pos = 0;
while ((pos = js.indexOf('uniEnv', pos)) !== -1) {
  console.log('Match at', pos, ':', js.substring(pos - 100, pos + 200));
  pos += 6;
}
