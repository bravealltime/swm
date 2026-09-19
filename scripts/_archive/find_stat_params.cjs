const fs = require('fs');

const code = fs.readFileSync('swgt_raw/swrt_statistic.js', 'utf8');
let idx = 0;
while ((idx = code.indexOf('getMonsterStatistical', idx)) !== -1) {
  console.log(code.substring(idx - 100, idx + 300));
  idx += 25;
}
