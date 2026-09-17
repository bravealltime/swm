const fs = require('fs');

const js = fs.readFileSync('swgt_raw/swrt_index.js', 'utf8');
const vend = fs.readFileSync('swgt_raw/swrt_vendors.js', 'utf8');

// Search for packageA or packageB chunks
const reg = /static\/js\/(package[AB][^"']*\.js)/g;
let m;
const subchunks = new Set();
while ((m = reg.exec(js)) !== null) subchunks.add(m[1]);
while ((m = reg.exec(vend)) !== null) subchunks.add(m[1]);

console.log('Subchunks:', Array.from(subchunks));

// Also check any .js pattern with hash
const hashJs = /[a-zA-Z0-9_\-]+\.[0-9a-f]{8}\.js/g;
const allHashes = new Set();
while ((m = hashJs.exec(js)) !== null) allHashes.add(m[0]);
while ((m = hashJs.exec(vend)) !== null) allHashes.add(m[0]);

console.log('All JS filenames:', Array.from(allHashes).slice(0, 30));
