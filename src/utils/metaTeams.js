// "Which meta teams can my box field?" — matches the duo/trio combos seen in real Guardian
// replays (src/data/swrtGuardianMeta.json: { ids, n games, w wins }) against the ids a player
// owns (ownedIdSet() from swexImport, which already folds unawakened / 2A onto the awakened id).

// ~100 games of "50%" mixed in: a 4-0 combo lands near 52%, a 66-54 one at ~53%, 350-350 stays 50%
const PRIOR_GAMES = 100;

/** Win rate pulled toward 50% for small samples, so a 4-0 combo does not outrank a 66-54 one. */
export function smoothedWinRate(w, n, prior = PRIOR_GAMES) {
  if (!n) return 50;
  return ((w + prior * 0.5) / (n + prior)) * 100;
}

const pct = (n, d) => (d ? +((n / d) * 100).toFixed(1) : 0);

function classify(combo, owned) {
  const ids = combo.ids.map(Number);
  const missing = ids.filter((id) => !owned.has(id));
  return {
    ids,
    n: combo.n,
    w: combo.w,
    winRate: pct(combo.w, combo.n),
    score: smoothedWinRate(combo.w, combo.n),
    missing,
    ownedCount: ids.length - missing.length,
    ready: missing.length === 0,
  };
}

/** Ready teams first, then the fewest missing pieces, then the smoothed win rate, then popularity. */
export function compareTeams(a, b) {
  return a.missing.length - b.missing.length || b.score - a.score || b.n - a.n;
}

/**
 * @param {{ duos?: Array, trios?: Array }} guardianMeta
 * @param {Set<number>} owned
 * @returns {{ duos, trios, readyDuos, readyTrios, oneAway, unlocks }}
 *   duos/trios: every combo with { ids, n, w, winRate, score, missing, ownedCount, ready }
 *   unlocks: monsters that would complete at least one team, most teams first
 *            [{ id, teams: [{ kind: 'duo'|'trio', ...team }], trios, duos, bestWinRate }]
 */
export function teamsFromBox(guardianMeta, owned, { minMatches = 0 } = {}) {
  const duos = (guardianMeta?.duos || []).filter((c) => c.n >= minMatches).map((c) => classify(c, owned)).sort(compareTeams);
  const trios = (guardianMeta?.trios || []).filter((c) => c.n >= minMatches).map((c) => classify(c, owned)).sort(compareTeams);

  const byMissing = new Map();
  for (const [kind, list] of [['trio', trios], ['duo', duos]]) {
    for (const team of list) {
      if (team.missing.length !== 1) continue;
      const id = team.missing[0];
      if (!byMissing.has(id)) byMissing.set(id, { id, teams: [], trios: 0, duos: 0, bestWinRate: 0 });
      const u = byMissing.get(id);
      u.teams.push({ kind, ...team });
      u[kind === 'trio' ? 'trios' : 'duos'] += 1;
      u.bestWinRate = Math.max(u.bestWinRate, team.winRate);
    }
  }
  const unlocks = [...byMissing.values()]
    .map((u) => ({ ...u, total: u.trios + u.duos, teams: u.teams.sort((a, b) => b.score - a.score) }))
    .sort((a, b) => b.total - a.total || b.trios - a.trios || b.bestWinRate - a.bestWinRate);

  return {
    duos,
    trios,
    readyDuos: duos.filter((t) => t.ready),
    readyTrios: trios.filter((t) => t.ready),
    oneAway: [...trios, ...duos].filter((t) => t.missing.length === 1),
    unlocks,
  };
}
