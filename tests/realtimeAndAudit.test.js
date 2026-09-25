import { describe, it, expect } from 'vitest';
import { evaluateRune } from '../src/utils/runeEvaluator.js';
import { auditAccount, CORE_META_MONSTERS } from '../src/utils/accountAudit.js';
import { isAudioMuted, toggleAudioMute, playLegendAlertSound, playDropSound } from '../src/utils/soundEffects.js';
import { normalizeView, titleFor, buildUrl } from '../src/router.js';

describe('Rune Evaluator & Keep/Sell Advisor', () => {
  it('identifies 6★ Legend rune with SPD substat and calculates max potential SPD', () => {
    const legendRune = {
      slot_no: 1,
      class: 6,
      extra: 5, // Legend
      set_id: 3, // Swift
      pri_eff: [1, 160], // Flat ATK
      sec_eff: [
        [8, 6], // SPD 6 (quad roll max: 6 + 4*6 = 30)
        [2, 8], // HP% 8
        [4, 8], // ATK% 8
        [9, 6], // CR% 6
      ],
    };

    const result = evaluateRune(legendRune);
    expect(result.isLegend6Star).toBe(true);
    expect(result.maxPotentialSpd).toBe(30);
    expect(result.recommendation).toBe('KEEP_INSTANT');
    expect(result.recommendationTh).toContain('เก็บทันที');
  });

  it('advises selling flat stats on 2/4/6 slots', () => {
    const flatRune = {
      slot_no: 4,
      class: 6,
      extra: 4, // Hero
      set_id: 1, // Energy
      pri_eff: [3, 160], // Flat DEF
      sec_eff: [
        [5, 10], // Flat HP
        [7, 10], // Flat ATK
        [8, 4],  // SPD 4
      ],
    };

    const result = evaluateRune(flatRune);
    expect(result.recommendation).toBe('SELL_RECOMMENDED');
    expect(result.reason).toContain('เป็นออปชั่นแฟลต');
  });

  it('keeps slot 2 main SPD runes regardless of substats', () => {
    const slot2Spd = {
      slot_no: 2,
      class: 6,
      extra: 4, // Hero
      set_id: 13, // Violent
      pri_eff: [8, 42], // Main SPD 42
      sec_eff: [
        [2, 6], // HP% 6
        [4, 7], // ATK% 7
        [6, 6], // DEF% 6
      ],
    };

    const result = evaluateRune(slot2Spd);
    expect(result.mainStat.type).toBe(8);
    expect(result.recommendation).toBe('KEEP_INSTANT');
    expect(result.reason).toContain('สล็อต 2 ออปชั่นหลัก SPD');
  });
});

describe('Account Audit Engine', () => {
  const mockBox = {
    wizard: { name: 'TestSummoner', level: 100 },
    units: [
      {
        id: 1,
        masterId: 25113, // Miles (Wind Striker)
        name: 'Miles',
        stars: 6,
        naturalStars: 5,
        baseSpd: 100,
        spd: 321, // +221 bonus SPD
        sets: ['Swift', 'Will'],
        runes: 6,
        runeEff: 102.5,
      },
      {
        id: 2,
        masterId: 13811, // Camilla (Water Valkyrja)
        name: 'Camilla',
        stars: 6,
        naturalStars: 5,
        baseSpd: 100,
        spd: 245, // +145 bonus SPD
        sets: ['Violent', 'Nemesis'],
        runes: 6,
        runeEff: 99.1,
      },
      {
        id: 3,
        masterId: 10412, // Racuni
        name: 'Racuni',
        stars: 6,
        naturalStars: 3,
        baseSpd: 95,
        spd: 235, // +140 bonus SPD
        sets: ['Violent', 'Will'],
        runes: 6,
        runeEff: 97.4,
      },
    ],
    runes: [{ id: 101 }, { id: 102 }],
    artifacts: [{ id: 201 }],
  };

  it('calculates audit score, rank grade, and speed tiers correctly', () => {
    const report = auditAccount(mockBox);
    expect(report).not.toBeNull();
    expect(report.wizard.name).toBe('TestSummoner');
    expect(report.maxSwiftBonus).toBe(221);
    expect(report.rankGrade).toContain('Guardian');
    expect(report.rankBadgeColor).toBe('amber');
    expect(report.swiftTiers.p220).toBe(1);
    expect(report.violentTiers.p140).toBe(2);
    expect(report.farmingPriorities.length).toBeGreaterThan(0);
    expect(report.actionPlan.length).toBeGreaterThan(0);
  });

  it('matches owned meta monsters from CORE_META_MONSTERS', () => {
    const report = auditAccount(mockBox);
    expect(report.ownedMeta.some((m) => m.name === 'Camilla')).toBe(true);
    expect(report.ownedMeta.some((m) => m.name === 'Racuni')).toBe(true);
    expect(report.ownedMeta.some((m) => m.name === 'Miles')).toBe(true);
    expect(report.missingMeta.some((m) => m.name === 'Oliver')).toBe(true);
    expect(report.metaCoveragePct).toBeGreaterThan(0);
  });
});

describe('Sound Effects Controller', () => {
  it('toggles audio mute state properly', () => {
    const initial = isAudioMuted();
    const next = toggleAudioMute();
    expect(next).toBe(!initial);
    expect(isAudioMuted()).toBe(next);
    // restore
    toggleAudioMute();
  });

  it('plays sounds without throwing error in testing environment', () => {
    expect(() => playLegendAlertSound()).not.toThrow();
    expect(() => playDropSound()).not.toThrow();
  });
});

describe('Router integration for new views', () => {
  it('normalizes aliases for live-farm-monitor and ai-account-audit', () => {
    expect(normalizeView('live-farm')).toBe('live-farm-monitor');
    expect(normalizeView('farm-monitor')).toBe('live-farm-monitor');
    expect(normalizeView('account-audit')).toBe('ai-account-audit');
    expect(normalizeView('audit')).toBe('ai-account-audit');
  });

  it('generates correct URLs and titles', () => {
    expect(buildUrl('live-farm-monitor')).toBe('/live-farm-monitor');
    expect(buildUrl('ai-account-audit')).toBe('/ai-account-audit');
    expect(titleFor('live-farm-monitor')).toContain('ระบบตรวจจับการฟาร์มสด');
    expect(titleFor('ai-account-audit')).toContain('AI วิเคราะห์ไอดี');
  });
});
