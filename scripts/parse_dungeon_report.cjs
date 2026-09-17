const fs = require('fs');
const html = fs.readFileSync('swgt_raw/dungeon_8011_2.html', 'utf8');

// Parse Wave monsters
const waveRegex = /<tr>\s*<td class="text-center">([^<]+)<\/td>\s*<td class="text-center">([^<]+)<\/td>\s*<td class="text-center">([^<]+)<\/td>\s*<td class="text-center">([^<]+)<\/td>\s*<td class="text-center">([^<]+)<\/td>\s*<td class="text-center">([^<]+)<\/td>\s*<td class="text-center">([^<]+)<\/td>\s*<td class="text-center">([^<]+)<\/td>\s*<td class="text-center">([^<]+)<\/td>\s*<td class="text-center">([^<]+)<\/td>/g;

let wm;
const waveMonsters = [];
while ((wm = waveRegex.exec(html)) !== null) {
  waveMonsters.push({
    wave: wm[1].trim(),
    name: wm[2].trim(),
    lvl: wm[3].trim(),
    hp: wm[4].trim(),
    atk: wm[5].trim(),
    def: wm[6].trim(),
    spd: wm[7].trim(),
    res: wm[8].trim(),
    acc: wm[9].trim()
  });
}

console.log('Wave Monsters count:', waveMonsters.length);
console.log('Wave monsters:', waveMonsters);

// Check other tables in dungeon_8011_2.html
const lines = html.split('\n');
console.log('Total lines in report:', lines.length);
