const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'swgt_raw', 'sample_counter_result.html');
const html = fs.readFileSync(file, 'utf8');

const idx = html.indexOf('Morris');
console.log('Index of Morris:', idx);
if (idx !== -1) {
  console.log(html.substring(idx - 200, idx + 1500).replace(/\s+/g, ' '));
}
