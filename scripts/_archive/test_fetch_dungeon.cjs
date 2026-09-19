const https = require('https');
const querystring = require('querystring');
const fs = require('fs');

const postData = querystring.stringify({
  dungeon_id: '8011',
  stage_id: '2',
  startDate: '08/17/2026',
  endDate: '09/16/2026',
  renderOnSelectedTab: ''
});

const req = https.request({
  hostname: 'swgt.io',
  path: '/controllers/dungeonAnalysis/ajaxLoadDungeon',
  method: 'POST',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'Content-Length': Buffer.byteLength(postData),
    'X-Requested-With': 'XMLHttpRequest'
  }
}, res => {
  console.log('Status code:', res.statusCode);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Response length:', data.length);
    fs.writeFileSync('swgt_raw/dungeon_8011_2.html', data);
    console.log('Snippet (first 1000 chars):');
    console.log(data.substring(0, 1000));
  });
});

req.on('error', err => console.error('Error:', err.message));
req.write(postData);
req.end();
