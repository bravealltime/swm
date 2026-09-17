const fs = require('fs');
const path = require('path');

const localMonsters = JSON.parse(fs.readFileSync(path.resolve('src/data/allMonsters.json'), 'utf8'));
const monsterLookup = {};
for (const m of localMonsters) {
  monsterLookup[m.com2usId] = m;
  monsterLookup[m.name.toLowerCase()] = m;
}

function formatPlayer(p) {
  if (!p) return null;
  return {
    playerId: p.playerId,
    name: p.playerName,
    country: p.playerCountry || 'GL',
    rank: p.playerRank,
    score: p.playerScore,
    leaderId: p.leaderMonsterId,
    bannedId: p.banMonsterId,
    monsters: (p.monsterInfoList || []).map(m => {
      const loc = monsterLookup[m.monsterId] || monsterLookup[m.monsterName?.toLowerCase()] || {};
      return {
        monsterId: m.monsterId,
        name: loc.name || m.monsterName,
        thaiName: loc.thaiName || loc.nameTh || m.monsterName,
        element: (m.element || loc.element || 'fire').toLowerCase(),
        stars: m.naturalStars || 5,
        avatarUrl: `https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/${m.imageFilename || 'unit_icon_0001_0_0.png'}`,
        isBanned: m.monsterId === p.banMonsterId,
        isLeader: m.monsterId === p.leaderMonsterId
      };
    })
  };
}

async function getMoreReplays() {
  const allReplays = [];
  for (let page = 1; page <= 6; page++) {
    try {
      const res = await fetch('https://m.swranking.com/api/player/replayallist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
        body: JSON.stringify({ page, limit: 10 })
      });
      const data = await res.json();
      for (const r of (data.data?.list || [])) {
        allReplays.push({
          id: r.replayId || r.battleKey,
          date: r.createDate,
          firstPickPlayerId: r.firstPick,
          winner: r.status, // 1 = playerOne, 2 = playerTwo
          player1: formatPlayer(r.playerOne),
          player2: formatPlayer(r.playerTwo)
        });
      }
    } catch(e) {
      console.warn(`Page ${page} failed:`, e.message);
    }
  }

  fs.writeFileSync('src/data/swrtRecentReplays.json', JSON.stringify(allReplays, null, 2));
  console.log(`Saved ${allReplays.length} replays to src/data/swrtRecentReplays.json!`);
}

getMoreReplays();
