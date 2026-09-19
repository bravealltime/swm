const fs = require('fs');
const path = require('path');
const rawDir = path.join(__dirname, '..', 'swgt_raw');

const codeHtml = fs.readFileSync(path.join(rawDir, 'gameCodesTile.html'), 'utf8');
console.log('--- gameCodesTile.html snippet ---');
console.log(codeHtml.substring(0, 1500));

const siegeHtml = fs.readFileSync(path.join(rawDir, 'latestSiegeBattlesGlobal.html'), 'utf8');
console.log('--- latestSiegeBattlesGlobal.html snippet ---');
console.log(siegeHtml.substring(0, 1500));
