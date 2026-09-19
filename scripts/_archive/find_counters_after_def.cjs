const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'swgt_raw', 'sample_counter_result.html');
const html = fs.readFileSync(file, 'utf8');

const idx = html.indexOf('Morris Rex Shumar');
console.log(html.substring(idx + 500, idx + 4000).replace(/\s+/g, ' '));
