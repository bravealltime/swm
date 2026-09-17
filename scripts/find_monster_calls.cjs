const fs = require('fs');

const js = fs.readFileSync('swgt_raw/swrt_index.js', 'utf8');

for (const fn of ['getElementMonster', 'getMonsterHighdata', 'getMonsterTopPlayer']) {
  let idx = 0;
  console.log(`=== Calls to ${fn} ===`);
  while ((idx = js.indexOf(fn, idx)) !== -1) {
    console.log(js.substring(idx - 100, idx + 250));
    idx += fn.length;
  }
}
