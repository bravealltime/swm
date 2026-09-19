async function testStat() {
  const url = 'https://m.swranking.com/api/monster/statistical?season=38&pageNum=1&pageSize=10&sortField=pickTotal&sortOrder=desc';
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Referer': 'https://m.swranking.com/'
    }
  });
  const data = await res.json();
  console.log('Total monsters in S38:', data.data.total);
  console.log('Top 3 Picked monsters:');
  for (let i = 0; i < 3; i++) {
    const m = data.data.list[i];
    console.log(`${i+1}. ${m.monsterName} (${m.element}) - Pick: ${m.pickTotal}, Win: ${m.winTotal} (${((m.winTotal/m.pickTotal)*100).toFixed(1)}%), Ban: ${m.banTotal}, 1stPick: ${m.firstPickTotal}`);
  }
}
testStat();
