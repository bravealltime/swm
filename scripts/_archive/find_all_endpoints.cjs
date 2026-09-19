const fs = require('fs');

const js = fs.readFileSync('swgt_raw/swrt_index.js', 'utf8');

// In uni.request calls: uni.request({url: s + e
// Let's find all strings that look like API path endpoints, e.g. "/monster/...", "/statistic/...", "/rank/..."
const endpointRegex = /["'](\/[a-zA-Z0-9_\-\/]+)["']/g;
const endpoints = new Set();
let m;
while ((m = endpointRegex.exec(js)) !== null) {
  const p = m[1];
  if (p.startsWith('/api') || p.startsWith('/monster') || p.startsWith('/rank') || p.startsWith('/statistic') || p.startsWith('/replay') || p.startsWith('/banpick') || p.startsWith('/user') || p.startsWith('/auth') || p.startsWith('/login') || p.startsWith('/system') || p.startsWith('/base') || p.startsWith('/check') || p.startsWith('/pve')) {
    endpoints.add(p);
  }
}
console.log('Found endpoints:', Array.from(endpoints));
