const https = require('https');
const fs = require('fs');

const url = 'https://swgt.io/monsterSearch/?com2usID=20831'; // Tractor
https.get(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
}, res => {
  console.log('Status code:', res.statusCode);
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    console.log('Length:', data.length);
    fs.writeFileSync('swgt_raw/monster_20831.html', data);
    console.log('Sample:');
    console.log(data.substring(0, 1000));
  });
});
