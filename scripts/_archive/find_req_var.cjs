const fs = require('fs');

const js = fs.readFileSync('swgt_raw/swrt_index.js', 'utf8');

// Find which variable imports "240b"
let pos = 0;
const importVars = [];
while ((pos = js.indexOf('"240b"', pos)) !== null && pos !== -1) {
  console.log('240b found at', pos, ':', js.substring(pos - 100, pos + 100));
  pos += 6;
}
