const fs = require('fs');
const path = require('path');

const localMonsters = JSON.parse(fs.readFileSync(path.resolve('src/data/allMonsters.json'), 'utf8'));
const monsterLookup = {};
for (const m of localMonsters) {
  monsterLookup[m.com2usId] = m;
  monsterLookup[m.name.toLowerCase()] = m;
}

async function extractAllSwrt() {
  console.log('1. Fetching SWRT Tier List (Season 38)...');
  const tierRes = await fetch('https://m.swranking.com/api/monsterBase/getMonsterLevel', {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://m.swranking.com/' }
  });
  const tierJson = await tierRes.json();
  const tierData = tierJson.data;

  const cleanTiers = {
    season: tierData.season,
    version: tierData.version,
    updateDate: tierData.createDate,
    tiers: {
      SS: (tierData.ssMonster || []).map(formatTierMonster),
      S: (tierData.smonster || []).map(formatTierMonster),
      A: (tierData.amonster || []).map(formatTierMonster),
      B: (tierData.bmonster || []).map(formatTierMonster),
      C: (tierData.cmonster || []).map(formatTierMonster),
      D: (tierData.dmonster || []).map(formatTierMonster)
    }
  };

  fs.writeFileSync('src/data/swrtTierList.json', JSON.stringify(cleanTiers, null, 2));
  console.log(`Saved swrtTierList.json! Tiers: SS=${cleanTiers.tiers.SS.length}, S=${cleanTiers.tiers.S.length}, A=${cleanTiers.tiers.A.length}, B=${cleanTiers.tiers.B.length}`);

  console.log('\n2. Fetching SWRT Meta Statistics (Top 300)...');
  const statRes = await fetch('https://m.swranking.com/api/monster/statistical?season=38&pageNum=1&pageSize=300&sortField=pickTotal&sortOrder=desc', {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://m.swranking.com/' }
  });
  const statJson = await statRes.json();
  const metaList = (statJson.data.list || []).map(m => {
    const loc = monsterLookup[m.monsterId] || monsterLookup[m.monsterName?.toLowerCase()] || {};
    return {
      monsterId: m.monsterId,
      name: loc.name || m.monsterName,
      thaiName: loc.thaiName || loc.nameTh || m.monsterName,
      element: (m.element || loc.element || 'fire').toLowerCase(),
      stars: loc.stars || 5,
      pickTotal: m.pickTotal,
      pickRate: +(m.pickRate * 100).toFixed(2),
      winRate: +(m.winRate * 100).toFixed(2),
      banRate: +(m.banRate * 100).toFixed(2),
      firstPickRate: +(m.firstPickRate * 100).toFixed(2),
      totalMatches: m.total,
      avatarUrl: `https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/${m.imageFilename || 'unit_icon_0001_0_0.png'}`
    };
  });

  fs.writeFileSync('src/data/swrtMetaMonsters.json', JSON.stringify(metaList, null, 2));
  console.log(`Saved swrtMetaMonsters.json! Total meta monsters: ${metaList.length}`);

  console.log('\n3. Fetching RTA Rank Cutoffs (Nowline & History)...');
  const nowRes = await fetch('https://m.swranking.com/api/player/nowline', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const nowJson = await nowRes.json();

  const histRes = await fetch('https://m.swranking.com/api/player/historyLine', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const histJson = await histRes.json();

  const cutoffs = {
    now: nowJson.data,
    history: histJson.data || []
  };
  fs.writeFileSync('src/data/swrtRankCutoffs.json', JSON.stringify(cutoffs, null, 2));
  console.log('Saved swrtRankCutoffs.json!');

  console.log('\n4. Fetching Live RTA Replays (Top 60 matches)...');
  const repRes = await fetch('https://m.swranking.com/api/player/replayallist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
    body: JSON.stringify({ page: 1, limit: 60 })
  });
  const repJson = await repRes.json();
  const replays = (repJson.data.list || []).map(r => {
    return {
      id: r.replayId || r.battleKey,
      date: r.createDate,
      firstPickPlayerId: r.firstPick,
      winner: r.status, // 1 = playerOne, 2 = playerTwo
      player1: formatPlayer(r.playerOne),
      player2: formatPlayer(r.playerTwo)
    };
  });

  fs.writeFileSync('src/data/swrtRecentReplays.json', JSON.stringify(replays, null, 2));
  console.log(`Saved swrtRecentReplays.json! Total replays: ${replays.length}`);
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

function formatTierMonster(m) {
  const loc = monsterLookup[m.monsterId] || monsterLookup[m.monsterName?.toLowerCase()] || {};
  const pickTotal = m.pickTotal || 0;
  const allTotal = m.allTotal || 1;
  const winTotal = m.winTotal || 0;
  const banTotal = m.banTotal || 0;
  const firstPickTotal = m.firstPickTotal || 0;

  return {
    monsterId: m.monsterId,
    name: loc.name || m.monsterName,
    thaiName: loc.thaiName || loc.nameTh || m.monsterName,
    element: (m.element || loc.element || 'fire').toLowerCase(),
    stars: m.monsterStar || loc.stars || 5,
    aiScore: m.aiScore || 0,
    pickRate: +((pickTotal / allTotal) * 100).toFixed(2),
    winRate: pickTotal > 0 ? +((winTotal / pickTotal) * 100).toFixed(2) : 0,
    banRate: pickTotal > 0 ? +((banTotal / pickTotal) * 100).toFixed(2) : 0,
    firstPickRate: pickTotal > 0 ? +((firstPickTotal / pickTotal) * 100).toFixed(2) : 0,
    pickTotal,
    winTotal,
    banTotal,
    firstPickTotal,
    avatarUrl: `https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/${m.monsterHeadImg || 'unit_icon_0001_0_0.png'}`
  };
}

extractAllSwrt().catch(console.error);
