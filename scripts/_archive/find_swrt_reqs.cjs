const fs = require('fs');

async function findRequests() {
  const js = fs.readFileSync('swgt_raw/swrt_index.js', 'utf8');

  // Search for http or https or url:
  const urlRegex = /(https?:\/\/[^\s"'`]+)/g;
  const urls = new Set();
  let m;
  while ((m = urlRegex.exec(js)) !== null) {
    if (!m[0].includes('w3.org') && !m[0].includes('google')) {
      urls.add(m[0]);
    }
  }
  console.log('URLs in index.js:', Array.from(urls));

  // Search for request/ajax keywords
  const reqMatches = js.match(/(\w+\.(get|post|request)\s*\([^\)]+\))/g);
  console.log('Request matches count:', reqMatches ? reqMatches.length : 0);
  if (reqMatches) {
    console.log('Sample requests:', reqMatches.slice(0, 10));
  }
}
findRequests();
