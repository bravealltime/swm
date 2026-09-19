async function sampleHighdata() {
  const url = 'https://m.swranking.com/api/monster/highdata?season=38&monsterId=15714&factor=0.01';
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://m.swranking.com/' }
  });
  const json = await res.json();
  const d = json.data;
  console.log('--- Top Synergies (คู่หูที่วินเรทสูงสุดเมื่ออยู่ทีมเดียวกัน) ---');
  for (const item of (d.highOneWithOneList || []).slice(0, 5)) {
    console.log(`+ ${item.monsterName} (${item.element}): WinRate ${(item.winRate * 100).toFixed(1)}% (Total matches: ${item.matchTotal || item.allTotal || item.pickTotal})`);
  }
  console.log('\n--- Hard Counters (ตัวแก้ทาง / ศัตรูที่เจอแล้วแพ้บ่อยสุด) ---');
  for (const item of (d.lowOneVsOneList || []).slice(0, 5)) {
    console.log(`- Vs ${item.monsterName} (${item.element}): WinRate ${(item.winRate * 100).toFixed(1)}% (Total matches: ${item.matchTotal || item.allTotal || item.pickTotal})`);
  }
}
sampleHighdata();
