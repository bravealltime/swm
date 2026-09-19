// War-room defense → 3MDC entry and counters (src/utils/mdcMatch.js), on a fixture shaped like allMdcData.json.
import { describe, it, expect } from 'vitest';
import { buildMdcIndex, matchDefense, rankCounters } from '../src/utils/mdcMatch.js';

const mon = (name, com2usId) => ({ name, com2usId: String(com2usId) });
const DATA = [
  { id: 'def-1', title: 'Seara + Orion + Perna', defenseMonsters: [mon('Seara', 15713), mon('Orion', 19814), mon('Perna', 20015)], counters: [
    { id: 'c1', title: 'A', monsters: [mon('Theomars', 19211), mon('Masha', 22412), mon('Perna', 20015)], rating: 5, winRate: '98.5%', author: 'x' },
    { id: 'c2', title: 'B', monsters: [mon('Tesarion', 19212), mon('Lushen', 13413), mon('Loren', 22112)], rating: 4, winRate: '90%', author: 'y' },
    { id: 'c3', title: 'C', monsters: [mon('Verad', 12411), mon('Lushen', 13413), mon('Loren', 22112)], rating: 5, winRate: '80%', author: 'z' },
  ] },
  { id: 'def-2', title: 'Seara + Orion + Rakan', defenseMonsters: [mon('Seara', 15713), mon('Orion', 19814), mon('Rakan', 15115)], counters: [{ id: 'c4', monsters: [mon('X', 1)], rating: 3, winRate: '70%' }] },
  { id: 'def-3', title: 'Tarnisha + Irene + Wind Qilin Slasher', defenseMonsters: [mon('Tarnisha', 24013), mon('Irene', 25214), mon('Wind Qilin Slasher', 30113)], counters: [] },
];
const index = buildMdcIndex(DATA);

describe('matchDefense', () => {
  it('matches the exact team regardless of order and case', () => {
    const m = matchDefense(index, ['perna', 'SEARA', 'Orion']);
    expect(m.kind).toBe('exact');
    expect(m.def.id).toBe('def-1');
  });

  it('falls back to a partial match sharing two names and prefers the entry with more counters', () => {
    const m = matchDefense(index, ['Seara', 'Orion', 'Somebody']);
    expect(m.kind).toBe('partial');
    expect(m.def.id).toBe('def-1'); // def-1 has 3 counters, def-2 only 1
    expect(m.sharedCount).toBe(2);
    expect(m.total).toBe(3);
  });

  it('handles names with suffixes in parentheses and multi-word names', () => {
    expect(matchDefense(index, ['Tarnisha (2A)', 'Irene', 'Wind Qilin Slasher'])?.kind).toBe('exact');
  });

  it('returns null with fewer than two known names or no overlap', () => {
    expect(matchDefense(index, ['Seara'])).toBeNull();
    expect(matchDefense(index, ['Nobody', 'Nemo', 'Nil'])).toBeNull();
    expect(matchDefense(index, [])).toBeNull();
  });
});

describe('rankCounters', () => {
  it('puts counters the box can field first, then rating, then win rate', () => {
    const owned = new Set([19212, 13413, 22112]); // can field B only
    const r = rankCounters(DATA[0], owned);
    expect(r.counters.map((c) => c.id)).toEqual(['c2', 'c1', 'c3']);
    expect(r.counters[0]).toMatchObject({ playable: true, missing: [] });
    expect(r.counters[1]).toMatchObject({ playable: false, missing: ['Theomars', 'Masha', 'Perna'], winRate: 98.5 });
    expect(r).toMatchObject({ total: 3, playableTotal: 1 });
  });

  it('ranks by rating and win rate when no box is loaded', () => {
    const r = rankCounters(DATA[0], null, 2);
    expect(r.counters.map((c) => c.id)).toEqual(['c1', 'c3']);
    expect(r.counters.every((c) => c.playable === false)).toBe(true);
    expect(r.total).toBe(3);
  });

  it('tolerates an entry without counters', () => {
    expect(rankCounters(DATA[2], new Set())).toEqual({ counters: [], total: 0, playableTotal: 0 });
    expect(rankCounters(null, null)).toEqual({ counters: [], total: 0, playableTotal: 0 });
  });
});
