const fs = require('fs');

async function analyzeJs() {
  const res = await fetch('https://m.swranking.com/static/js/index.ad74c94b.js');
  const js = await res.text();
  console.log('JS length:', js.length);
  fs.writeFileSync('swgt_raw/swrt_index.js', js);
  
  // Find all /api/ matches
  const apiRegex = /\/api\/[a-zA-Z0-9_\-]+/g;
  const apis = new Set();
  let m;
  while ((m = apiRegex.exec(js)) !== null) {
    apis.add(m[0]);
  }
  console.log('Found API endpoints:', Array.from(apis));

  // Find routes / hash routes
  const pathRegex = /path:\s*["']([^"']+)["']/g;
  const paths = new Set();
  while ((m = pathRegex.exec(js)) !== null) {
    paths.add(m[1]);
  }
  console.log('Found routes:', Array.from(paths));

  // Look for headers like Authorization, token, etc.
  const tokenRegex = /["'](Authorization|token|X-[a-zA-Z0-9\-]+)["']/gi;
  const headers = new Set();
  while ((m = tokenRegex.exec(js)) !== null) {
    headers.add(m[1]);
  }
  console.log('Found headers:', Array.from(headers));
}

analyzeJs().catch(console.error);
