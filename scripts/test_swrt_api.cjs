async function testEndpoints() {
  const endpoints = [
    '/monsterBase/all',
    '/monsterBase/getMonsterLevel',
    '/monsterBase/getMonsterLevelDateList',
    '/monsterBase/element',
    '/monsterBase/family',
    '/monster/statistical',
    '/monster/element',
    '/monster/highdata'
  ];

  for (const ep of endpoints) {
    const url = 'https://m.swranking.com/api' + ep;
    try {
      // Test GET
      let res = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://m.swranking.com/',
          'Origin': 'https://m.swranking.com'
        }
      });
      console.log(`GET ${ep} -> Status: ${res.status}`);
      let text = await res.text();
      console.log(`  Length: ${text.length} Snippet: ${text.substring(0, 150)}`);

      // Test POST
      let resPost = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://m.swranking.com/',
          'Origin': 'https://m.swranking.com'
        },
        body: JSON.stringify({})
      });
      console.log(`POST ${ep} -> Status: ${resPost.status}`);
      let textPost = await resPost.text();
      console.log(`  Length: ${textPost.length} Snippet: ${textPost.substring(0, 150)}`);
    } catch(e) {
      console.log(`ERROR on ${ep}:`, e.message);
    }
  }
}
testEndpoints();
