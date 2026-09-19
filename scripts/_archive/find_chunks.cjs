const fs = require('fs');

const js = fs.readFileSync('swgt_raw/swrt_index.js', 'utf8');

// Find references to chunk files
const chunkRegex = /static\/js\/[a-zA-Z0-9_\-\.]+\.js/g;
const chunks = new Set();
let m;
while ((m = chunkRegex.exec(js)) !== null) {
  chunks.add(m[0]);
}
console.log('Chunk files mentioned:', Array.from(chunks));

// Also let's check webpack chunk map
const idx = js.indexOf('function(e){return n.p+"static/js/"');
if (idx !== -1) {
  console.log('Webpack chunk mapping snippet:');
  console.log(js.substring(idx - 100, idx + 800));
}
