async function printItem() {
  const url = 'https://m.swranking.com/api/monster/highdata?season=38&monsterId=15714&factor=0.01';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const json = await res.json();
  console.log('Sample synergy item:', json.data.highOneWithOneList[0]);
  console.log('Sample counter item:', json.data.lowOneVsOneList[0]);
}
printItem();
