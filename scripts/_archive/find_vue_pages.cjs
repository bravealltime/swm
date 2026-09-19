const fs = require('fs');

const js = fs.readFileSync('swgt_raw/swrt_index.js', 'utf8');

const targets = [
  'pages/tabBar/statistic/statistic',
  'pages/tabBar/replay/replay',
  'packageA/pages/monster/rank/rank',
  'packageA/pages/monster/detail/detail'
];

for (const t of targets) {
  const idx = js.indexOf(t);
  console.log(t, '-> idx:', idx);
  if (idx !== -1) {
    console.log(js.substring(idx - 50, idx + 300));
  }
}
