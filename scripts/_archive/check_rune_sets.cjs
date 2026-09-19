const fs = require('fs');

for (const file of ['dungeon_8011_2.html', 'dungeon_9011_2.html', 'dungeon_6011_2.html', 'dungeon_9513_2.html', 'dungeon_9511_2.html', 'dungeon_9512_2.html']) {
  const html = fs.readFileSync(`swgt_raw/${file}`, 'utf8');
  const idx = html.indexOf("text: 'Rune Set'");
  if (idx !== -1) {
    const chunk = html.substring(idx - 1500, idx + 200);
    const labelsMatch = chunk.match(/labels:\s*\[([\s\S]*?)\]/);
    const dataMatch = chunk.match(/data:\s*\[([\s\S]*?)\]/);
    console.log(file, 'Labels:', labelsMatch ? labelsMatch[1].replace(/\s+/g, ' ') : 'none', 'Data:', dataMatch ? dataMatch[1].replace(/\s+/g, ' ') : 'none');
  } else {
    console.log(file, "No 'Rune Set' text found");
  }
}
