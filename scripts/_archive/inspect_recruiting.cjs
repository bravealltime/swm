const fs = require('fs');
const path = require('path');
const rawDir = path.join(__dirname, '..', 'swgt_raw');

const recruitingHtml = fs.readFileSync(path.join(rawDir, 'recruiting.html'), 'utf8');

// Find all occurrences of guilds
console.log('Length:', recruitingHtml.length);
// Print 1000 characters from the middle of body
const bodyIdx = recruitingHtml.indexOf('<body');
const contentStart = recruitingHtml.indexOf('<div class="container', bodyIdx);
console.log('Body content start:', contentStart);
if (contentStart !== -1) {
  console.log(recruitingHtml.substring(contentStart, contentStart + 2000).replace(/\s+/g, ' '));
}
