import { describe, it, expect } from 'vitest';
import { calculateAccountRadar } from '../src/utils/accountRadar.js';

describe('accountRadar', () => {
  it('returns default 6 axes and grade when box is empty', () => {
    const result = calculateAccountRadar(null);
    expect(result).toBeDefined();
    expect(result.axes).toHaveLength(6);
    expect(result.overallScore).toBeGreaterThanOrEqual(50);
    expect(result.overallGrade).toBeDefined();
    expect(result.advice).toBeDefined();
  });

  it('calculates 6 axes scores accurately from a real box structure', () => {
    const mockBox = {
      units: [
        { uid: 1, masterId: 25313, name: 'Oliver', stars: 6, spd: 110 },
        { uid: 2, masterId: 16713, name: 'Teshar', stars: 6, spd: 109 },
        { uid: 3, masterId: 13413, name: 'Lushen', stars: 6, spd: 103 },
        { uid: 4, masterId: 17811, name: 'Mo Long', stars: 6, spd: 100 },
        { uid: 5, masterId: 21312, name: 'Bolverk', stars: 6, spd: 100 },
      ],
      runes: [
        { uid: 1, set: 3, slot: 2, main: [8, 42], eff: 88 }, // Swift slot 2 spd 42
        { uid: 1, set: 3, slot: 4, main: [4, 63], subs: [[8, 25, 5]], eff: 92 }, // sub spd 30
        { uid: 1, set: 3, slot: 6, main: [2, 63], subs: [[8, 24, 4]], eff: 90 }, // sub spd 28
        { uid: 1, set: 3, slot: 1, main: [3, 160], subs: [[8, 26, 4]], eff: 94 }, // sub spd 30
        { uid: 4, set: 13, slot: 2, main: [8, 42], eff: 90 }, // Violent
        { uid: 4, set: 13, slot: 4, main: [2, 63], eff: 85 }, // Violent
        { uid: 4, set: 13, slot: 6, main: [2, 63], eff: 87 }, // Violent
        { uid: 4, set: 13, slot: 1, main: [3, 160], eff: 89 }, // Violent
      ],
      artifacts: [
        { uid: 1, lvl: 15, rank: 6 },
        { uid: 2, lvl: 15, rank: 6 },
        { uid: 3, lvl: 15, rank: 6 },
      ],
    };

    const result = calculateAccountRadar(mockBox);
    expect(result.axes).toHaveLength(6);
    expect(result.overallScore).toBeGreaterThanOrEqual(40);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    for (const a of result.axes) {
      expect(a.score).toBeGreaterThanOrEqual(0);
      expect(a.score).toBeLessThanOrEqual(100);
      expect(a.label).toBeDefined();
      expect(a.value).toBeDefined();
    }
  });
});
