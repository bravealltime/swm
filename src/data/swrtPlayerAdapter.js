// Turns the compact records in swrtPlayersIndex.json (built by scripts/fetch_swrt_players.cjs)
// into the profile shape PlayerTrackerView renders, so curated Lucksack profiles and
// SWRT-derived profiles can live in the same list. Recent matches are NOT in the index;
// they are fetched per shard from /data/swrt-matches/<shard>.json when a player is opened.

// Com2uS RTA rating codes -> tier
const TIERS = [
  [5001, 'Legend', 'Legend', 'legend', 'ระดับ Legend (แชมป์โลก)'],
  [4003, 'Guardian 3 ★★★', 'G3', 'guardian', 'ระดับ Guardian (G1-G3)'],
  [4002, 'Guardian 2 ★★', 'G2', 'guardian', 'ระดับ Guardian (G1-G3)'],
  [4001, 'Guardian 1 ★', 'G1', 'guardian', 'ระดับ Guardian (G1-G3)'],
  [3503, 'Conqueror 3 ★★★', 'C3', 'conqueror', 'ระดับ Conqueror (C1-C3)'],
  [3502, 'Conqueror 2 ★★', 'C2', 'conqueror', 'ระดับ Conqueror (C1-C3)'],
  [3501, 'Conqueror 1 ★', 'C1', 'conqueror', 'ระดับ Conqueror (C1-C3)'],
  [3003, 'Fighter 3 ★★★', 'F3', 'fighter', 'ระดับ Fighter (F1-F3)'],
  [3002, 'Fighter 2 ★★', 'F2', 'fighter', 'ระดับ Fighter (F1-F3)'],
  [3001, 'Fighter 1 ★', 'F1', 'fighter', 'ระดับ Fighter (F1-F3)'],
  [2003, 'Challenger 3', 'CH3', 'fighter', 'ระดับ Challenger'],
  [2002, 'Challenger 2', 'CH2', 'fighter', 'ระดับ Challenger'],
  [2001, 'Challenger 1', 'CH1', 'fighter', 'ระดับ Challenger'],
  [0, 'Beginner', 'B', 'fighter', 'ระดับ Beginner'],
];

// Below this many recorded matches a win rate is more noise than signal
export const SMALL_SAMPLE = 5;

export function tierFromLevel(level) {
  const row = TIERS.find(([code]) => level >= code) || TIERS[TIERS.length - 1];
  return { rankTier: row[1], rankBadge: row[2], rankCategory: row[3], rankCategoryThai: row[4] };
}

// SWRT uses GL / NF for "no country"
const NO_COUNTRY = new Set(['GL', 'NF', 'XX']);

export function flagFromCountry(code) {
  if (!code || code.length !== 2 || !/^[A-Z]{2}$/i.test(code) || NO_COUNTRY.has(code.toUpperCase())) return '🌐';
  return String.fromCodePoint(...code.toUpperCase().split('').map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65));
}

export function buildMonsterIndex(allMonsters) {
  const byId = new Map();
  for (const m of allMonsters) byId.set(Number(m.com2usId), m);
  return byId;
}

function monsterPick(id, byId, { isLeader = false, isBanned = false } = {}) {
  const m = byId.get(Number(id));
  return {
    monsterId: id,
    name: m?.name || `#${id}`,
    thaiName: m?.thaiName || m?.name || `#${id}`,
    element: (m?.element || 'fire').toLowerCase(),
    stars: m?.stars || 5,
    avatarUrl: m?.avatarUrl || m?.imageUrl || '',
    isLeader,
    isBanned,
  };
}

function picksFor(sideRec, byId) {
  return (sideRec?.ids || []).map((id) =>
    monsterPick(id, byId, { isLeader: id === sideRec.l, isBanned: id === sideRec.b })
  );
}

/** Index record -> profile without recentMatches (cheap; built for every player). */
export function toProfile(p, byId, season = 38) {
  const tier = tierFromLevel(p.lv);
  const matches = p.m || 0;
  const wins = p.w || 0;
  const losses = matches - wins;
  const winRate = matches ? +((wins / matches) * 100).toFixed(1) : 0;

  // Most-used monsters from the replay feed; fall back to per-monster stats from /monster/topPlayer
  const fromFeed = Array.isArray(p.top) && p.top.length > 0;
  const source = fromFeed ? p.top : (p.ts || []);
  const signatureMonsters = source.slice(0, 6).map(([m, n, w]) => ({
    ...monsterPick(m, byId),
    matches: n,
    pickShare: fromFeed ? (matches ? +((n / matches) * 100).toFixed(1) : 0) : 100,
    winRate: n ? +((w / n) * 100).toFixed(1) : 0,
  }));

  const core = signatureMonsters.slice(0, 3).map((m) => m.name).join(' • ');

  return {
    id: `swrt-${p.id}`,
    swrtId: p.id,
    name: p.n,
    displayName: p.n,
    tagline: `${tier.rankTier.replace(/ ★+$/, '')} • ${p.c || 'GL'} • SWRT S${season}`,
    server: 'Global',
    country: p.c || 'GL',
    flag: flagFromCountry(p.c),
    guild: 'ไม่ระบุ',
    ...tier,
    score: p.s || 0,
    worldRank: p.r || 0,
    matchesRecorded: matches,
    wins,
    losses,
    winRate,
    smallSample: matches < SMALL_SAMPLE,
    firstPickPreference: matches ? +(((p.fp || 0) / matches) * 100).toFixed(1) : 0,
    archetype: core || 'RTA Guardian',
    archetypeThai: fromFeed ? 'มอนสเตอร์ที่ใช้บ่อยจากรีเพลย์จริง' : 'ผู้เล่นท็อปประจำมอนสเตอร์ (SWRT)',
    archetypeDescription: fromFeed
      ? `สถิติจากรีเพลย์ Guardian สาธารณะของ SWRT ${matches} แมตช์ (พบล่าสุด ${p.seen || '-'})`
      : 'ติดอันดับผู้เล่นที่ใช้มอนสเตอร์ตัวนี้ได้ดีที่สุดในสถิติ SWRT (ไม่มีรีเพลย์ล่าสุดในชุดข้อมูล)',
    signatureMonsters,
    recentMatches: null, // loaded on demand, see loadRecentMatches()
    profileAvatar: p.av || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(p.n)}`,
    source: 'swrt',
  };
}

export function buildSwrtProfiles(dataset, allMonsters) {
  const byId = buildMonsterIndex(allMonsters);
  const season = dataset?.meta?.season || 38;
  return (dataset?.players || []).map((p) => toProfile(p, byId, season));
}

/** Compact match record (from a shard file) -> the shape MatchCard renders. */
export function toRecentMatch(r, byId) {
  const vsTier = tierFromLevel(r.vs?.lv || 0);
  return {
    id: `swrt-${r.k}`,
    date: r.d,
    result: r.r === 'W' ? 'WIN' : 'LOSS',
    scoreChange: '',
    duration: '',
    firstPick: !!r.fp,
    picks: picksFor(r.my, byId),
    playerPicks: picksFor(r.my, byId),
    opponent: {
      swrtId: r.vs?.id,
      name: r.vs?.n || '?',
      country: r.vs?.c || 'GL',
      flag: flagFromCountry(r.vs?.c),
      server: 'Global',
      rankTier: vsTier.rankTier,
      score: r.vs?.s || 0,
      picks: picksFor(r.vs, byId),
    },
  };
}

const shardCache = new Map();

/**
 * Fetch the recent matches of one SWRT player. Shards live in public/data/swrt-matches and are
 * cached per session, so browsing several players in the same shard costs one request.
 * The shard fetch is deliberately not tied to a caller's abort signal: the cache is shared.
 */
export async function loadRecentMatches(swrtId, byId, shards = 32) {
  const shard = swrtId % shards;
  if (!shardCache.has(shard)) {
    const url = `${import.meta.env.BASE_URL || '/'}data/swrt-matches/${shard}.json`;
    const promise = fetch(url).then((res) => {
      if (!res.ok) throw new Error(`match shard ${shard}: HTTP ${res.status}`);
      return res.json();
    });
    shardCache.set(shard, promise);
    promise.catch(() => shardCache.delete(shard)); // let a failed fetch be retried
  }
  const data = await shardCache.get(shard);
  return (data[swrtId] || []).map((r) => toRecentMatch(r, byId));
}
