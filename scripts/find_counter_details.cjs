const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'swgt_raw', 'sample_counter_result.html');
const html = fs.readFileSync(file, 'utf8');

const idx = html.indexOf('Platy Tetra Kinki');
console.log(html.substring(idx, idx + 2500).replace(/\s+/g, ' '));
