// Meta duo/trio combos matched against the player's box (src/utils/metaTeams.js).
import { describe, it, expect } from 'vitest';
import { teamsFromBox, smoothedWinRate, compareTeams } from '../src/utils/metaTeams.js';

const META = {
  duos: [
    { ids: [1, 2], n: 700, w: 350 },   // owned, 50%
    { ids: [1, 9], n: 100, w: 60 },    // missing 9, 60%
    { ids: [8, 9], n: 90, w: 45 },     // missing both
  ],
  trios: [
    { ids: [1, 2, 3], n: 220, w: 97 }, // owned, 44%
    { ids: [1, 2, 9], n: 120, w: 66 }, // missing 9, 55%
    { ids: [1, 3, 7], n: 4, w: 4 },    // missing 7, 100% but 4 games
    { ids: [7, 8, 9], n: 50, w: 30 },  // missing all
  ],
};
const owned = new Set([1, 2, 3]);

describe('smoothedWinRate', () => {
  it('pulls tiny samples toward 50% and leaves large ones alone', () => {
    expect(smoothedWinRate(4, 4)).toBeLessThan(60);
    expect(smoothedWinRate(350, 700)).toBeCloseTo(50, 0);
    expect(smoothedWinRate(66, 120)).toBeGreaterThan(smoothedWinRate(4, 4));
    expect(smoothedWinRate(0, 0)).toBe(50);
  });
});

describe('teamsFromBox', () => {
  const r = teamsFromBox(META, owned);

  it('marks each combo with what is missing', () => {
    expect(r.trios.map((t) => [t.ids.join('+'), t.missing, t.ready])).toEqual([
      ['1+2+3', [], true],
      ['1+2+9', [9], false],
      ['1+3+7', [7], false],
      ['7+8+9', [7, 8, 9], false],
    ]);
    expect(r.readyTrios).toHaveLength(1);
    expect(r.readyDuos.map((d) => d.ids)).toEqual([[1, 2]]);
  });

  it('orders ready first, then fewest missing, then smoothed win rate', () => {
    // 1+2+9 (55% over 120) ranks above 1+3+7 (4-0) among the one-away trios
    expect(r.trios[1].ids).toEqual([1, 2, 9]);
    const a = { missing: [], score: 40, n: 10 }, b = { missing: [1], score: 90, n: 999 };
    expect(compareTeams(a, b)).toBeLessThan(0);
  });

  it('lists the monsters that would unlock the most teams', () => {
    expect(r.unlocks.map((u) => [u.id, u.total, u.trios, u.duos])).toEqual([
      [9, 2, 1, 1],
      [7, 1, 1, 0],
    ]);
    expect(r.unlocks[0].teams.map((t) => t.kind)).toEqual(['duo', 'trio']); // duo 60/100 scores above trio 66/120
    expect(r.unlocks[0].bestWinRate).toBe(60);
    expect(r.oneAway).toHaveLength(3);
  });

  it('accepts a minimum sample size and empty inputs', () => {
    const strict = teamsFromBox(META, owned, { minMatches: 50 });
    expect(strict.trios.find((t) => t.ids.join() === '1,3,7')).toBeUndefined();
    expect(teamsFromBox({}, new Set())).toMatchObject({ duos: [], trios: [], unlocks: [], oneAway: [] });
  });

  it('works with the awakened-id folding of ownedIdSet (string ids in data)', () => {
    const r2 = teamsFromBox({ duos: [{ ids: ['16811', '25313'], n: 10, w: 5 }], trios: [] }, new Set([16811, 25313]));
    expect(r2.readyDuos).toHaveLength(1);
  });
});
