import { describe, it, expect } from 'vitest';
import { evaluateRuneForReapp, scanBoxForReappCandidates } from '../src/utils/reappEvaluator.js';

describe('reappEvaluator', () => {
  it('gives God-Tier score (95+) to Violent Slot 4/6 % with innate flat substat', () => {
    const result = evaluateRuneForReapp({
      set: 'Violent',
      slot: 4,
      stars: 6,
      originalQuality: 'Legend',
      mainStat: 'CRI Dmg',
      innateStat: 'Flat HP',
      currentEfficiency: 82,
      currentSpd: 6
    });

    expect(result.score).toBeGreaterThanOrEqual(92);
    expect(result.grade).toBe('SSS');
    expect(result.recommendation).toContain('ควรรี');
    expect(result.pros.length).toBeGreaterThan(1);
  });

  it('protects runes that are already god-tier (high SPD or 100%+ efficiency)', () => {
    const result = evaluateRuneForReapp({
      set: 'Swift',
      slot: 4,
      stars: 6,
      originalQuality: 'Legend',
      mainStat: 'HP%',
      innateStat: 'DEF%',
      currentEfficiency: 104,
      currentSpd: 26
    });

    expect(result.grade).toBe('PROTECT');
    expect(result.score).toBeLessThanOrEqual(10);
    expect(result.recommendation).toContain('ห้ามรีเด็ดขาด');
  });

  it('rejects 5-star runes and non-legend runes', () => {
    const fiveStar = evaluateRuneForReapp({
      set: 'Violent',
      slot: 6,
      stars: 5,
      originalQuality: 'Legend',
      mainStat: 'HP%'
    });
    expect(fiveStar.grade).toBe('F');
    expect(fiveStar.score).toBe(0);

    const heroRune = evaluateRuneForReapp({
      set: 'Violent',
      slot: 6,
      stars: 6,
      originalQuality: 'Hero',
      mainStat: 'HP%'
    });
    expect(heroRune.grade).toBe('D');
    expect(heroRune.score).toBe(15);
  });

  it('gives high weight to Swift Slot 1/3/5 because players hunt 30+ SPD', () => {
    const swiftSlot1 = evaluateRuneForReapp({
      set: 'Swift',
      slot: 1,
      stars: 6,
      originalQuality: 'Legend',
      mainStat: 'Flat ATK',
      innateStat: 'Flat DEF',
      currentEfficiency: 80,
      currentSpd: 5
    });

    const energySlot1 = evaluateRuneForReapp({
      set: 'Energy',
      slot: 1,
      stars: 6,
      originalQuality: 'Legend',
      mainStat: 'Flat ATK',
      innateStat: null,
      currentEfficiency: 80,
      currentSpd: 5
    });

    expect(swiftSlot1.score).toBeGreaterThan(energySlot1.score + 30);
  });

  it('scans the compact box (what loadBox() returns) and ranks the candidates', () => {
    // compact rune: set/main/innate/subs are ids (see swexImport compactRune), q0 = quality when dropped
    const VIOLENT = 13, SWIFT = 3, HP = 1, HP_PCT = 2, DEF = 5, SPD = 8, CRI_DMG = 10;
    const box = { units: [{ masterId: 13413, name: 'Lushen' }], runes: [
      { id: 101, slot: 4, set: VIOLENT, stars: 6, lvl: 15, q: 5, q0: 5, main: [CRI_DMG, 80], innate: [DEF, 20], subs: [[SPD, 4, 0, 0]], eff: 79, unit: 13413 },
      { id: 102, slot: 2, set: SWIFT, stars: 6, lvl: 12, q: 5, q0: 5, main: [SPD, 42], innate: [HP, 300], subs: [], eff: 81, unit: 0 },
      { id: 103, slot: 4, set: VIOLENT, stars: 6, lvl: 15, q: 5, q0: 5, main: [HP, 2448], innate: null, subs: [], eff: 70, unit: 0 },   // flat HP in slot 4 → never
      { id: 104, slot: 6, set: VIOLENT, stars: 5, lvl: 15, q: 5, q0: 5, main: [HP_PCT, 51], innate: null, subs: [], eff: 60, unit: 0 }, // 5★ → skip
      { id: 105, slot: 6, set: VIOLENT, stars: 6, lvl: 15, q: 5, q0: 5, main: [HP_PCT, 63], innate: null, subs: [[SPD, 22, 5, 0]], eff: 103, unit: 0 }, // already god-tier → protected
      { id: 106, slot: 2, set: VIOLENT, stars: 6, lvl: 15, q: 5, q0: 4, main: [SPD, 42], innate: null, subs: [], eff: 75, unit: 0 },   // dropped as Hero → not a reapp target
    ] };

    const candidates = scanBoxForReappCandidates(box, 10);
    expect(candidates.map((c) => c.runeId)).toEqual([101, 102]);
    expect(candidates[0]).toMatchObject({ set: 'Violent', slot: 4, mainStat: 'CRI Dmg', innateStat: 'DEF', currentEff: 79, currentSpd: 4, equippedMonster: 'Lushen' });
    expect(candidates[1]).toMatchObject({ set: 'Swift', slot: 2, mainStat: 'SPD', currentSpd: 0, equippedMonster: 'คลังเก็บรูน' }); // main-stat SPD does not count as a substat roll
    expect(candidates[0].score).toBeGreaterThanOrEqual(90);
  });

  it('returns nothing for an empty or missing box', () => {
    expect(scanBoxForReappCandidates(null)).toEqual([]);
    expect(scanBoxForReappCandidates({ units: [] })).toEqual([]);
  });
});
