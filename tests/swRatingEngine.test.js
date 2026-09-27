import { describe, it, expect } from 'vitest';
import {
  evaluateSwRating,
  getRankTierFromEfficiency,
  getRankTierFromGeneralScore,
  getRankTierFromArtifactScore,
  RANK_TIERS,
} from '../src/utils/swRatingEngine.js';

describe('SW-Rating Engine', () => {
  it('returns null when box is null or undefined', () => {
    expect(evaluateSwRating(null)).toBeNull();
  });

  it('correctly maps rank tiers from efficiency and scores', () => {
    expect(getRankTierFromEfficiency(94.5)).toBe(RANK_TIERS.G3);
    expect(getRankTierFromEfficiency(91.2)).toBe(RANK_TIERS.G2);
    expect(getRankTierFromEfficiency(88.0)).toBe(RANK_TIERS.G1);
    expect(getRankTierFromEfficiency(85.0)).toBe(RANK_TIERS.C3);
    expect(getRankTierFromEfficiency(81.0)).toBe(RANK_TIERS.C2);
    expect(getRankTierFromEfficiency(75.0)).toBe(RANK_TIERS.C1);

    expect(getRankTierFromGeneralScore(750, 'Violent')).toBe(RANK_TIERS.G3);
    expect(getRankTierFromGeneralScore(250, 'Violent')).toBe(RANK_TIERS.C1);

    expect(getRankTierFromArtifactScore(2075.5, 'element')).toBe(RANK_TIERS.C1);
    expect(getRankTierFromArtifactScore(1471.5, 'type')).toBe(RANK_TIERS.G3);
  });

  it('evaluates box and computes Unit Score, Rune Score, Artifact Score and Monster Summary', () => {
    const mockBox = {
      wizard: {
        name: 'TesterU',
        level: 100,
        country: 'TH',
        rtaPoints: 1676,
      },
      units: [
        {
          uid: 1,
          masterId: 24713,
          name: 'Oliver',
          stars: 6,
          naturalStars: 5,
          element: 'wind',
          baseSpd: 100,
          spd: 275,
          sets: ['Violent', 'Will'],
          runeEff: 102.5,
        },
        {
          uid: 2,
          masterId: 19215,
          name: 'Veromos',
          stars: 6,
          naturalStars: 5,
          element: 'dark',
          baseSpd: 100,
          spd: 260,
          sets: ['Violent', 'Nemesis'],
          runeEff: 98.4,
        },
        {
          uid: 3,
          masterId: 13413,
          name: 'Lushen',
          stars: 6,
          naturalStars: 4,
          element: 'wind',
          baseSpd: 103,
          spd: 280,
          sets: ['Swift', 'Blade'],
          runeEff: 95.0,
        },
      ],
      runes: [
        { id: 101, slot: 1, set: 13, eff: 96.5, unit: 24713, subs: [[8, 24, 4]] },
        { id: 102, slot: 2, set: 13, eff: 94.0, unit: 24713, subs: [[8, 20, 4]] },
        { id: 103, slot: 3, set: 3, eff: 93.0, unit: 13413, subs: [[8, 26, 4]] },
        { id: 104, slot: 4, set: 3, eff: 90.5, unit: 13413, subs: [[8, 22, 3]] },
      ],
      artifacts: [
        { id: 'art-1', slot: 1, kind: 'element', lvl: 15, subs: [[207, 100]] },
        { id: 'art-2', slot: 2, kind: 'archetype', lvl: 15, subs: [[204, 30]] },
      ],
    };

    const rating = evaluateSwRating(mockBox);

    expect(rating).toBeDefined();
    expect(rating.wizard.name).toBe('TesterU');
    expect(rating.scores.unitScore).toBeGreaterThan(40);
    expect(rating.scores.runeScore).toBeGreaterThan(100);
    expect(rating.scores.artifactScore).toBeGreaterThan(100);
    expect(rating.expectedRank).toBeDefined();
    expect(rating.estPoints).toBeGreaterThanOrEqual(1400);

    // Artifact Rating
    expect(rating.artifactRating.elementArtifact).toBeDefined();
    expect(rating.artifactRating.typeArtifact).toBeDefined();

    // Rune Rating
    expect(rating.runeRating.top10Average.swift).toBeDefined();
    expect(rating.runeRating.top10Average.violent).toBeDefined();
    expect(rating.runeRating.top10Average.despair).toBeDefined();
    expect(rating.runeRating.generalRuneScore.swift).toBeDefined();
    expect(rating.runeRating.generalRuneScore.violent).toBeDefined();
    expect(rating.runeRating.generalRuneScore.despair).toBeDefined();

    // Monster Summary
    expect(rating.monsterSummary).toHaveLength(3);
    expect(rating.monsterSummary[0].totalScore).toBeGreaterThan(0);
    expect(rating.monsterSummary[0].rank).toBeDefined();
  });
});
