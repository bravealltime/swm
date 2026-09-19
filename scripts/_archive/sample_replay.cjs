async function sampleReplay() {
  const res = await fetch('https://m.swranking.com/api/player/replayallist', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0',
      'Referer': 'https://m.swranking.com/'
    },
    body: JSON.stringify({ page: 1, limit: 2 })
  });
  const data = await res.json();
  console.log(JSON.stringify(data.data.list[0], null, 2));
}
sampleReplay();
