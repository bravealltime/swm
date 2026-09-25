import { describe, it, expect } from 'vitest';
import {
  matchRuneToUserMonsters,
  generateRuneAiInsights,
  generateSessionAiSummary
} from '../src/services/aiRuneAdvisor';

describe('aiRuneAdvisor Service', () => {
  const mockUserBox = {
    wizard: { name: 'PedictU' },
    units: [
      { unit_id: 101, name: 'Leo', unit_name: 'Leo', stars: 6, level: 40 },
      { unit_id: 102, name: 'Dominic', unit_name: 'Dominic', stars: 6, level: 40 },
      { unit_id: 103, name: 'Camilla', unit_name: 'Camilla', stars: 6, level: 40 },
      { unit_id: 104, name: 'Veromos', unit_name: 'Veromos', stars: 6, level: 40 },
    ]
  };

  it('matches dropped Vampire runes with monsters in user box and prioritizes owned monsters', () => {
    const mockRune = {
      setName: 'Vampire',
      setNameTh: 'ดูดเลือด (Vampire)',
      slot: 1,
      stars: 6,
      currentSpd: 6,
      maxPotentialSpd: 24,
      maxPotentialEff: 88,
      recommendation: 'KEEP_INSTANT',
      recommendationTh: 'แนะนำเก็บทันที',
      reason: 'สปีดสูง',
      mainStat: { nameTh: 'ATK (พลังโจมตี)', value: 160 },
      subs: [
        { type: 8, nameTh: 'SPD (ความเร็ว)', value: 6 },
        { type: 2, nameTh: 'ATK% (พลังโจมตี)', value: 8 },
        { type: 4, nameTh: 'HP% (พลังชีวิต)', value: 7 },
        { type: 1, nameTh: 'HP (หน่วย)', value: 320 }
      ]
    };

    const matches = matchRuneToUserMonsters(mockRune, mockUserBox);
    expect(matches.length).toBeGreaterThan(0);
    // Leo and Dominic should be found and marked as owned
    const owned = matches.filter(m => m.owned);
    expect(owned.length).toBeGreaterThanOrEqual(2);
    expect(owned.some(m => m.name === 'Leo')).toBe(true);
    expect(owned.some(m => m.name === 'Dominic')).toBe(true);
    // First element in sorted list should be owned
    expect(matches[0].owned).toBe(true);
  });

  it('generates Guardian AI insights with upgrade plan, grind, and gem advice', () => {
    const mockRune = {
      setName: 'Vampire',
      setNameTh: 'ดูดเลือด (Vampire)',
      slot: 1,
      stars: 6,
      hasSpdSub: true,
      currentSpd: 6,
      maxPotentialSpd: 24,
      maxPotentialEff: 88,
      recommendation: 'KEEP_INSTANT',
      recommendationTh: 'แนะนำเก็บทันที',
      reason: 'สปีดสูง',
      mainStat: { nameTh: 'ATK (พลังโจมตี)', value: 160 },
      subs: [
        { type: 8, nameTh: 'SPD (ความเร็ว)', value: 6 },
        { type: 2, nameTh: 'ATK% (พลังโจมตี)', value: 8 },
        { type: 4, nameTh: 'HP% (พลังชีวิต)', value: 7 },
        { type: 1, nameTh: 'HP (หน่วย)', value: 320 }
      ]
    };

    const insights = generateRuneAiInsights(mockRune, mockUserBox);
    expect(insights).toBeDefined();
    expect(insights.upgradePlan.length).toBeGreaterThan(0);
    expect(insights.upgradePlan[0].step).toContain('+3');
    expect(insights.grindAdvice.length).toBeGreaterThan(0);
    expect(insights.gemAdvice.length).toBeGreaterThan(0);
    expect(insights.ownedCount).toBeGreaterThanOrEqual(2);
    expect(insights.tacticalTip).toContain('คุณมี');
  });

  it('generates session summary coaching metrics and best runes', () => {
    const mockRuns = [
      {
        win: true,
        clearTimeSec: '42.5',
        evaluated: {
          slot: 1,
          setName: 'Vampire',
          setNameTh: 'ดูดเลือด (Vampire)',
          maxPotentialSpd: 24,
          maxPotentialEff: 90,
          recommendation: 'KEEP_INSTANT',
          isLegend6Star: true,
          mainStat: { nameTh: 'ATK', value: 160 }
        }
      },
      {
        win: true,
        clearTimeSec: '38.0',
        evaluated: {
          slot: 4,
          setName: 'Destroy',
          setNameTh: 'ทำลาย (Destroy)',
          maxPotentialSpd: 12,
          maxPotentialEff: 60,
          recommendation: 'SELL_RECOMMENDED',
          isLegend6Star: false,
          mainStat: { nameTh: 'DEF (หน่วย)', value: 40 }
        }
      }
    ];

    const summary = generateSessionAiSummary(mockRuns, mockUserBox);
    expect(summary.totalRuns).toBe(2);
    expect(summary.keepCount).toBe(1);
    expect(summary.sellCount).toBe(1);
    expect(summary.legendCount).toBe(1);
    expect(summary.keepRate).toBe(50);
    expect(summary.bestRunes.length).toBe(1);
    expect(summary.coachingTips.length).toBeGreaterThan(0);
  });
});
