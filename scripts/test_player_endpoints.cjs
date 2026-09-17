const fs = require('fs');

async function testPlayerEndpoints() {
  const tests = [
    { url: '/player/nowline', method: 'GET' },
    { url: '/player/historyLine', method: 'GET' },
    { url: '/player/simple/ranking', method: 'GET' },
    { url: '/player/simple/ranking?page=1&limit=50', method: 'GET' },
    { url: '/monster/statistical?page=1&limit=100', method: 'GET' },
    { url: '/monster/statistical?page=1&limit=50&sort=pickTotal&order=desc', method: 'GET' },
    { url: '/player/replayallist', method: 'POST', body: { page: 1, limit: 20 } },
    { url: '/player/list', method: 'POST', body: { page: 1, limit: 20 } }
  ];

  for (const t of tests) {
    try {
      const res = await fetch('https://m.swranking.com/api' + t.url, {
        method: t.method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://m.swranking.com/'
        },
        body: t.body ? JSON.stringify(t.body) : undefined
      });
      const data = await res.json();
      console.log(`${t.method} ${t.url} -> Status: ${res.status}, retCode: ${data.retCode}, message: ${data.message || data.enMessage}`);
      if (data.data) {
        if (Array.isArray(data.data)) {
          console.log(`  Array length: ${data.data.length}, Sample:`, JSON.stringify(data.data[0]).substring(0, 150));
        } else if (typeof data.data === 'object') {
          console.log(`  Object keys: ${Object.keys(data.data)}, Sample:`, JSON.stringify(data.data).substring(0, 150));
        }
      }
    } catch(e) {
      console.log(`Error on ${t.url}:`, e.message);
    }
  }
}

testPlayerEndpoints();
