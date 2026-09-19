// Finds the 3MDC entry (src/data/allMdcData.json) for a defense seen in the guild war room and
// ranks its counters, flagging the ones the player's own box can field.

const norm = (s) => String(s || '').toLowerCase().replace(/\s*\(.*?\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
const pctOf = (s) => Number(String(s || '').replace('%', '')) || 0;

/** Pre-normalised name sets, built once per dataset. */
export function buildMdcIndex(data) {
  return (data || []).map((def) => ({ def, names: new Set((def.defenseMonsters || []).map((m) => norm(m.name))) }));
}

/**
 * Best 3MDC entry for a defense given as monster names:
 * exact (every name matches) beats partial (at least 2 of 3 shared); ties go to the entry with more counters.
 * Returns null when fewer than two names are known.
 */
export function matchDefense(index, monsterNames) {
  const names = [...new Set((monsterNames || []).map(norm).filter(Boolean))];
  if (names.length < 2) return null;
  let best = null;
  for (const entry of index) {
    const shared = names.filter((n) => entry.names.has(n));
    if (shared.length < 2) continue;
    const exact = shared.length === names.length && entry.names.size === names.length;
    const score = (exact ? 1000 : 0) + shared.length * 10 + Math.min(9, (entry.def.counters || []).length / 30);
    if (!best || score > best.score) best = { entry, shared, exact, score };
  }
  if (!best) return null;
  return { kind: best.exact ? 'exact' : 'partial', def: best.entry.def, shared: best.shared, sharedCount: best.shared.length, total: names.length };
}

/**
 * Counters of a 3MDC entry, playable ones (every monster owned) first, then by community rating
 * and win rate. `owned` is the ownedIdSet() of the box, or null when no box is loaded.
 */
export function rankCounters(def, owned, limit = 5) {
  const list = (def?.counters || []).map((c) => {
    const mons = c.monsters || [];
    const missing = owned ? mons.filter((m) => !owned.has(Number(m.com2usId))).map((m) => m.name) : [];
    return {
      id: c.id,
      names: mons.map((m) => m.name),
      rating: Number(c.rating) || 0,
      winRate: pctOf(c.winRate),
      author: c.author || '',
      turnOrder: c.turnOrder || '',
      playable: Boolean(owned) && mons.length > 0 && missing.length === 0,
      missing,
    };
  });
  list.sort((a, b) => Number(b.playable) - Number(a.playable) || b.rating - a.rating || b.winRate - a.winRate);
  return { counters: list.slice(0, limit), total: list.length, playableTotal: list.filter((c) => c.playable).length };
}
