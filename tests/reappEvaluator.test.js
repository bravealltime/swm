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

  it('scans mock box runes and returns top candidates sorted by score', () => {
    const mockBox = {
      runes: [
        // Candidate 1: Violent slot 4 CD with innate Flat DEF (Score 95+)
        { id: 101, class: 6, slot: 4, setName: 'Violent', mainStatName: 'CRI Dmg', innateStatName: 'Flat DEF', eff: 79, spd: 4, quality: 5 },
        // Candidate 2: Swift slot 2 SPD with innate Flat HP (Score 92+)
        { id: 102, class: 6, slot: 2, setName: 'Swift', mainStatName: 'SPD', innateStatName: 'Flat HP', eff: 81, spd: 0, quality: 5 },
        // Candidate 3: Flat slot 4 (Skip)
        { id: 103, class: 6, slot: 4, setName: 'Violent', mainStatName: 'HP', quality: 5 },
        // Candidate 4: 5 star rune (Skip)
        { id: 104, class: 5, slot: 6, setName: 'Violent', mainStatName: 'HP%', quality: 5 },
        // Candidate 5: God rune with 27 spd (Protect)
        { id: 105, class: 6, slot: 6, setName: 'Violent', mainStatName: 'HP%', eff: 103, spd: 27, quality: 5 }
      ]
    };

    const candidates = scanBoxForReappCandidates(mockBox, 5);
    expect(candidates.length).toBe(2);
    expect(candidates[0].runeId).toBe(101);
    expect(candidates[1].runeId).toBe(102);
    expect(candidates[0].score).toBeGreaterThanOrEqual(90);
  });
});
