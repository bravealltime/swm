const fs = require('fs');
const html = fs.readFileSync('swgt_raw/patch_92.html', 'utf8');

const lines = html.split('\n');
console.log('Total lines:', lines.length);

const matches = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('<table') || line.includes('unit_icon') || line.includes('skills36') || line.includes('panel-heading')) {
    matches.push({ lineNum: i + 1, text: line.trim().substring(0, 120) });
    if (matches.length > 25) break;
  }
}
console.log('Sample matches:');
console.log(matches);
