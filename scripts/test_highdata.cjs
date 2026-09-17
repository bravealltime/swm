async function testHighData() {
  const url = 'https://m.swranking.com/api/monster/highdata?season=38&monsterId=15714&factor=0.01';
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://m.swranking.com/'
      }
    });
    const json = await res.json();
    console.log('Highdata keys:', Object.keys(json.data || {}));
    if (json.data) {
      console.log('Sample highdata:', JSON.stringify(json.data).substring(0, 300));
    }
  } catch(e) {
    console.log('Error:', e.message);
  }
}
testHighData();
