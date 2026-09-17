const fs = require('fs');

const js = fs.readFileSync('swgt_raw/swrt_index.js', 'utf8');

// Find all occurrences of "url:" in index.js
const urlCalls = [];
const regex = /url:\s*([^,\}\)]+)/g;
let m;
while ((m = regex.exec(js)) !== null) {
  urlCalls.push(m[1].trim());
}

console.log('Total URL expressions found:', urlCalls.length);
console.log('Unique URL expressions:');
const unique = [...new Set(urlCalls)];
for (const u of unique) {
  if (u.includes('s+') || u.includes('baseUrl') || u.includes('api') || u.includes('/')) {
    console.log(' -', u);
  }
}
