/**
 * Build the SWRT player dataset from the PUBLIC (no-login) SWRT endpoints:
 *   POST /player/replayallist  { pageNum, pageSize, level: 1 }  -> Guardian-only replay feed
 *   GET  /monster/topPlayer?season=38&monsterId=X                -> top 10 players per meta monster
 *
 * Player search / detail endpoints on SWRT require an account and are NOT used here.
 * Every replay in the feed lists both players (name, country, rank, score, tier code,
 * leader, ban, 5 picks) so we aggregate them into per-player profiles.
 *
 * Output:
 *   src/data/swrtPlayersIndex.json          light per-player summary, bundled for search / shortcuts
 *   src/data/swrtGuardianMeta.json          pick/win/ban/leader/first-pick per monster + duo/trio combos,
 *                                           computed from every Guardian replay scanned
 *   public/data/swrt-matches/<shard>.json   recent matches keyed by playerId, fetched only when a
 *                                           player is opened (shard = playerId % SHARDS)
 *   .cache/swrt_players_raw.json            raw aggregate so --rebuild can re-derive without fetching
 *
 * Usage:
 *   node scripts/fetch_swrt_players.cjs                # 40 pages x 100 replays + all meta monsters (~50 min)
 *   node scripts/fetch_swrt_players.cjs --pages=10     # fewer replay pages
 *   node scripts/fetch_swrt_players.cjs --skip-top     # replay feed only
 *   node scripts/fetch_swrt_players.cjs --top=100      # topPlayer only for the 100 most-picked monsters
 *   node scripts/fetch_swrt_players.cjs --quick        # 5 pages + 30 monsters, for a smoke test
 *   node scripts/fetch_swrt_players.cjs --rebuild      # regenerate outputs from .cache without fetching
 *
 * The endpoint is slow (~0.4 s per replay record), so results are saved after every page and the
 * script can be stopped at any time with a usable file on disk.
 */
const fs = require('fs');
const path = require('path');

const API = 'https://m.swranking.com/api';
const SEASON = 38;
const OUT_INDEX = path.resolve('src/data/swrtPlayersIndex.json');
const OUT_META = path.resolve('src/data/swrtGuardianMeta.json');
const OUT_MATCH_DIR = path.resolve('public/data/swrt-matches');
const RAW_CACHE = path.resolve('.cache/swrt_players_raw.json');
const SHARDS = 32;
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (SWM dataset builder; contact via github.com/bravealltime/swm)',
  Referer: 'https://m.swranking.com/',
  'Content-Type': 'application/json',
};

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v === undefined ? true : v];
}));
const QUICK = !!args.quick;
const PAGES = Number(args.pages || (QUICK ? 5 : 40));
const PAGE_SIZE = 100;
const SKIP_TOP = !!args['skip-top'];
const REBUILD = !!args.rebuild;
const TOP_LIMIT = QUICK ? 30 : Number(args.top || 100);
const DELAY_MS = 600;           // breathing room between requests
const MAX_RECENT = 10;          // matches kept per player
const MIN_MATCHES_FOR_PROFILE = 1;
const TOP_MONSTERS = 6;         // most-used monsters kept in the index
const MIN_COMBO_MATCHES = 8;    // duo/trio needs this many picks before its win rate is published
const MAX_COMBOS = 60;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function request(pathname, { method = 'GET', body } = {}, attempt = 1) {
  try {
    const res = await fetch(API + pathname, {
      method,
      headers: HEADERS,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.retCode !== 0) throw new Error(`retCode ${json.retCode}: ${json.enMessage || json.message}`);
    return json.data;
  } catch (err) {
    if (attempt >= 3) throw err;
    console.warn(`  retry ${attempt} for ${pathname}: ${err.message}`);
    await sleep(2000 * attempt);
    return request(pathname, { method, body }, attempt + 1);
  }
}

// --- aggregation ---------------------------------------------------------

const players = new Map(); // playerId -> profile
let replaysScanned = 0;
const seenBattles = new Set();

// Meta counters over every replay (both sides)
const monsterStats = new Map(); // monsterId -> { picks, wins, bans, leaders, fpPicks, fpWins }
const duoStats = new Map();     // "a-b"   -> { n, w }
const trioStats = new Map();    // "a-b-c" -> { n, w }
const overall = { sides: 0, fpSides: 0, fpWins: 0, first: '', last: '' };

function bump(map, key, won, init = () => ({ n: 0, w: 0 })) {
  const e = map.get(key) || init();
  e.n += 1;
  if (won) e.w += 1;
  map.set(key, e);
}

function ingestMeta(me, won, fp, date) {
  overall.sides += 1;
  if (fp) { overall.fpSides += 1; if (won) overall.fpWins += 1; }
  if (!overall.first || date < overall.first) overall.first = date;
  if (!overall.last || date > overall.last) overall.last = date;

  const ids = (me.monsterInfoList || []).map((m) => m.monsterId).filter(Boolean);
  for (const id of ids) {
    const st = monsterStats.get(id) || { picks: 0, wins: 0, bans: 0, leaders: 0, fpPicks: 0, fpWins: 0 };
    st.picks += 1;
    if (won) st.wins += 1;
    if (id === me.leaderMonsterId) st.leaders += 1;
    if (fp) { st.fpPicks += 1; if (won) st.fpWins += 1; }
    monsterStats.set(id, st);
  }
  // banMonsterId is MY monster that the opponent banned (verified against the feed)
  if (me.banMonsterId) {
    const st = monsterStats.get(me.banMonsterId) || { picks: 0, wins: 0, bans: 0, leaders: 0, fpPicks: 0, fpWins: 0 };
    st.bans += 1;
    monsterStats.set(me.banMonsterId, st);
  }
  const sorted = [...new Set(ids)].sort((a, b) => a - b);
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      bump(duoStats, `${sorted[i]}-${sorted[j]}`, won);
      for (let k = j + 1; k < sorted.length; k++) bump(trioStats, `${sorted[i]}-${sorted[j]}-${sorted[k]}`, won);
    }
  }
}

function getPlayer(p) {
  let rec = players.get(p.playerId);
  if (!rec) {
    rec = {
      id: p.playerId,
      name: p.playerName,
      country: p.playerCountry || 'GL',
      level: p.playerLevel || 0,
      score: p.playerScore || 0,
      rank: p.playerRank || 0,
      avatar: p.playerHeadImg || p.headImg || '',
      lastSeen: '',
      matches: 0,
      wins: 0,
      firstPicks: 0,
      usage: {},      // monsterId -> { n, w }
      recent: [],
      topStats: [],   // from /monster/topPlayer
    };
    players.set(p.playerId, rec);
  }
  return rec;
}

function updateStanding(rec, p, date) {
  // Feed is newest-first, so the first sighting is the most recent standing
  if (!rec.lastSeen || date > rec.lastSeen) {
    rec.lastSeen = date;
    rec.name = p.playerName || rec.name;
    rec.country = p.playerCountry || rec.country;
    rec.level = p.playerLevel || rec.level;
    rec.score = p.playerScore || rec.score;
    rec.rank = p.playerRank || rec.rank;
    if (p.playerHeadImg && !/noimage/.test(p.playerHeadImg)) rec.avatar = p.playerHeadImg;
  }
}

function side(p) {
  return {
    id: p.playerId,
    n: p.playerName,
    c: p.playerCountry || 'GL',
    s: p.playerScore || 0,
    lv: p.playerLevel || 0,
    ids: (p.monsterInfoList || []).map((m) => m.monsterId),
    l: p.leaderMonsterId || 0,
    b: p.banMonsterId || 0,
  };
}

function ingestReplay(r) {
  if (!r.playerOne || !r.playerTwo || seenBattles.has(r.battleKey)) return;
  seenBattles.add(r.battleKey);
  replaysScanned += 1;
  const date = (r.createDate || '').slice(0, 16);

  const sides = [
    { me: r.playerOne, vs: r.playerTwo, won: r.status === 1 },
    { me: r.playerTwo, vs: r.playerOne, won: r.status === 2 },
  ];
  for (const { me, vs, won } of sides) {
    const rec = getPlayer(me);
    updateStanding(rec, me, date);
    rec.matches += 1;
    if (won) rec.wins += 1;
    const fp = r.firstPick === me.playerId;
    if (fp) rec.firstPicks += 1;
    ingestMeta(me, won, fp, date);
    for (const m of me.monsterInfoList || []) {
      const u = rec.usage[m.monsterId] || (rec.usage[m.monsterId] = { n: 0, w: 0 });
      u.n += 1;
      if (won) u.w += 1;
    }
    if (rec.recent.length < MAX_RECENT) {
      rec.recent.push({
        k: r.battleKey,
        d: date,
        r: won ? 'W' : 'L',
        fp,
        my: { ids: side(me).ids, l: me.leaderMonsterId || 0, b: me.banMonsterId || 0 },
        vs: side(vs),
      });
    }
  }
}

function ingestTopPlayer(monsterId, p) {
  const rec = getPlayer({
    playerId: p.playerId,
    playerName: p.playerName,
    playerCountry: p.playerCountry,
    playerLevel: p.playerLevel,
    playerScore: p.playerScore,
    playerHeadImg: p.headImg,
  });
  if (!rec.level && p.playerLevel) rec.level = p.playerLevel;
  if (!rec.score && p.playerScore) rec.score = p.playerScore;
  if (p.headImg && !/noimage/.test(p.headImg) && !rec.avatar) rec.avatar = p.headImg;
  rec.topStats.push({ m: monsterId, picks: p.pickTotal || 0, wins: p.winTotal || 0 });
}

function serialize(extra = {}) {
  const list = [...players.values()]
    .filter((p) => p.matches >= MIN_MATCHES_FOR_PROFILE || p.topStats.length)
    .sort((a, b) => b.score - a.score || b.matches - a.matches);

  const meta = {
    source: 'swranking.com public endpoints (replayallist level=1, monster/topPlayer)',
    season: SEASON,
    fetchedAt: new Date().toISOString(),
    replaysScanned,
    players: list.length,
    shards: SHARDS,
    ...extra,
  };

  // 1. light index for the bundle: [monsterId, picks, wins] triples keep it compact
  const index = list.map((p) => ({
    id: p.id,
    n: p.name,
    c: p.country,
    lv: p.level,
    s: p.score,
    r: p.rank,
    m: p.matches,
    w: p.wins,
    fp: p.firstPicks,
    seen: p.lastSeen,
    av: p.avatar && !/noimage/.test(p.avatar) ? p.avatar : undefined,
    top: Object.entries(p.usage)
      .map(([m, u]) => [Number(m), u.n, u.w])
      .sort((a, b) => b[1] - a[1] || b[2] - a[2])
      .slice(0, TOP_MONSTERS),
    ts: p.topStats.length ? p.topStats.slice(0, TOP_MONSTERS).map((t) => [t.m, t.picks, t.wins]) : undefined,
  }));
  fs.writeFileSync(OUT_INDEX, JSON.stringify({ meta, players: index }));

  // 2. recent matches, sharded by playerId so a profile page fetches ~1/SHARDS of the data
  fs.mkdirSync(OUT_MATCH_DIR, { recursive: true });
  const shards = Array.from({ length: SHARDS }, () => ({}));
  for (const p of list) {
    if (p.recent.length) shards[p.id % SHARDS][p.id] = p.recent;
  }
  shards.forEach((shard, i) => fs.writeFileSync(path.join(OUT_MATCH_DIR, `${i}.json`), JSON.stringify(shard)));

  // 3. Guardian meta computed from every replay side we saw
  const combos = (map, minN) => [...map.entries()]
    .filter(([, e]) => e.n >= minN)
    .map(([key, e]) => ({ ids: key.split('-').map(Number), n: e.n, w: e.w }))
    .sort((a, b) => b.n - a.n)
    .slice(0, MAX_COMBOS);
  const guardianMeta = {
    meta: { ...meta, replaySides: overall.sides, firstReplay: overall.first, lastReplay: overall.last,
      firstPickSides: overall.fpSides, firstPickWins: overall.fpWins },
    monsters: [...monsterStats.entries()]
      .map(([id, st]) => ({ id, ...st }))
      .sort((a, b) => b.picks - a.picks),
    duos: combos(duoStats, MIN_COMBO_MATCHES),
    trios: combos(trioStats, MIN_COMBO_MATCHES),
  };
  fs.writeFileSync(OUT_META, JSON.stringify(guardianMeta));

  // 4. raw aggregate for --rebuild
  fs.mkdirSync(path.dirname(RAW_CACHE), { recursive: true });
  fs.writeFileSync(RAW_CACHE, JSON.stringify({
    meta, replaysScanned, players: list,
    counters: { overall, monsterStats: [...monsterStats], duoStats: [...duoStats], trioStats: [...trioStats] },
  }));

  return { meta, players: list };
}

function loadRaw() {
  const raw = JSON.parse(fs.readFileSync(RAW_CACHE, 'utf8'));
  replaysScanned = raw.replaysScanned || 0;
  for (const p of raw.players) players.set(p.id, p);
  if (raw.counters) {
    Object.assign(overall, raw.counters.overall);
    for (const [k, v] of raw.counters.monsterStats) monsterStats.set(k, v);
    for (const [k, v] of raw.counters.duoStats) duoStats.set(k, v);
    for (const [k, v] of raw.counters.trioStats) trioStats.set(k, v);
  }
  console.log(`loaded ${players.size} players from ${path.relative(process.cwd(), RAW_CACHE)}`);
}

// --- main ------------------------------------------------------------------

(async () => {
  if (REBUILD) {
    loadRaw();
    const out = serialize({ status: 'complete' });
    console.log(`rebuilt index (${out.players.length} players) + ${SHARDS} match shards`);
    return;
  }

  console.log(`SWRT player dataset: ${PAGES} pages x ${PAGE_SIZE} Guardian replays${SKIP_TOP ? '' : ' + topPlayer per meta monster'}`);

  for (let pageNum = 1; pageNum <= PAGES; pageNum++) {
    const t0 = Date.now();
    let data;
    try {
      data = await request('/player/replayallist', { method: 'POST', body: { pageNum, pageSize: PAGE_SIZE, level: 1 } });
    } catch (err) {
      console.warn(`page ${pageNum} failed: ${err.message} — continuing`);
      continue;
    }
    (data.list || []).forEach(ingestReplay);
    serialize({ status: 'partial', replayPagesDone: pageNum });
    console.log(`replays page ${pageNum}/${PAGES}: +${(data.list || []).length} (${((Date.now() - t0) / 1000).toFixed(0)}s) — players so far: ${players.size}, oldest: ${(data.list || []).at(-1)?.createDate || '?'}`);
    if (!data.hasNextPage) break;
    await sleep(DELAY_MS);
  }

  if (!SKIP_TOP) {
    const meta = JSON.parse(fs.readFileSync(path.resolve('src/data/swrtMetaMonsters.json'), 'utf8'));
    const monsterIds = meta.map((m) => m.monsterId).filter(Boolean).slice(0, TOP_LIMIT);
    console.log(`\ntopPlayer for ${monsterIds.length} meta monsters...`);
    for (let i = 0; i < monsterIds.length; i++) {
      const id = monsterIds[i];
      try {
        const list = await request(`/monster/topPlayer?season=${SEASON}&monsterId=${id}`);
        (list || []).forEach((p) => ingestTopPlayer(id, p));
      } catch (err) {
        console.warn(`topPlayer ${id} failed: ${err.message}`);
      }
      if ((i + 1) % 20 === 0 || i === monsterIds.length - 1) {
        serialize({ status: 'partial', replayPagesDone: PAGES, topDone: i + 1 });
        console.log(`  ${i + 1}/${monsterIds.length} — players: ${players.size}`);
      }
      await sleep(DELAY_MS);
    }
  }

  const out = serialize({ status: 'complete' });
  const guardians = out.players.filter((p) => p.level >= 4001).length;
  const shardBytes = fs.readdirSync(OUT_MATCH_DIR).reduce((sum, f) => sum + fs.statSync(path.join(OUT_MATCH_DIR, f)).size, 0);
  console.log(`\nDone. ${out.players.length} players (${guardians} Guardian) from ${replaysScanned} replays`);
  console.log(`  index:   ${path.relative(process.cwd(), OUT_INDEX)} (${(fs.statSync(OUT_INDEX).size / 1024).toFixed(0)} kB)`);
  console.log(`  matches: ${SHARDS} shards in ${path.relative(process.cwd(), OUT_MATCH_DIR)} (${(shardBytes / 1024).toFixed(0)} kB total)`);
  console.log(`  meta:    ${path.relative(process.cwd(), OUT_META)} (${(fs.statSync(OUT_META).size / 1024).toFixed(0)} kB, ${monsterStats.size} monsters)`);
})();
