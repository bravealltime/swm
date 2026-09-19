const fs = require('fs');
const html = fs.readFileSync('swgt_raw/dungeonStats.html', 'utf8');

const regex = /<option value="([^"]+)"\s+data-type="([^"]+)"\s+data-dungeonid="([^"]+)"(?:\s+data-stageid="([^"]+)")?(?:\s+data-riftdungeonboxid="([^"]+)")?>([^<]+)<\/option>/g;
let m;
const dungeons = [];
while ((m = regex.exec(html)) !== null) {
  dungeons.push({
    val: m[1],
    type: m[2],
    dungeonId: m[3],
    stageId: m[4] || null,
    boxId: m[5] || null,
    name: m[6].trim()
  });
}

console.log('Total dungeons in SWGT:', dungeons.length);
console.log(dungeons);
