const fs = require('fs');

for (const name of ['statistic', 'rank-rank', 'monster-detail', 'rank-list', 'intelligentBP']) {
  const code = fs.readFileSync(`swgt_raw/swrt_${name}.js`, 'utf8');
  console.log(`=== Feature: ${name} ===`);
  
  // Find method calls like this.$api.xxx or api.xxx or /xxx
  const apiCalls = code.match(/this\.\$api\.[a-zA-Z0-9_]+/g) || [];
  const otherCalls = code.match(/api\.[a-zA-Z0-9_]+/g) || [];
  const allCalls = [...new Set([...apiCalls, ...otherCalls])];
  console.log('API methods called:', allCalls);

  // Find any URL strings
  const urls = code.match(/["']\/[a-zA-Z0-9_\-\/]+["']/g) || [];
  const filteredUrls = [...new Set(urls)].filter(u => u.length > 3 && !u.includes('static'));
  if (filteredUrls.length > 0) {
    console.log('URLs mentioned:', filteredUrls);
  }
}
