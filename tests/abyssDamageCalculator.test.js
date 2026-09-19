import { describe, it, expect } from 'vitest';
import { 
  ABYSS_DUNGEONS, 
  NUKER_PRESETS, 
  calculateAbyssDamage, 
  calculateCombatSpeed 
} from '../src/utils/abyssDamageCalculator.js';

describe('abyssDamageCalculator', () => {
  it('calculates combat speed accurately with totem and speed lead', () => {
    // Teshar base SPD 109, +85 rune speed, 24% lead, 15% totem
    const spd = calculateCombatSpeed({
      baseSpd: 109,
      runeSpd: 85,
      speedLead: 24,
      speedTotem: 15,
    });
    // lead bonus = 109 * 0.24 = 26.16, totem = 109 * 0.15 = 16.35, rune = 85 -> 109 + 85 + 26.16 + 16.35 = 236.51 -> 236
    expect(spd).toBe(236);
  });

  it('calculates Teshar 1-shot kill in Giant Abyss Hard when runes are well equipped', () => {
    const teshar = NUKER_PRESETS.find((n) => n.name === 'Teshar');
    const giant = ABYSS_DUNGEONS.find((d) => d.id === 'giant');

    const result = calculateAbyssDamage({
      nuker: teshar,
      dungeon: giant,
      totalAtk: 3000,
      critDmg: 220,
      artifactSkillCd: 18,
      artifactDmgOnElement: 15,
      hasAtkBuff: true,
      hasDefBreak: true,
      fightSetsCount: 2,
    });

    expect(result.totalDamage).toBeGreaterThan(giant.waveMobHp);
    expect(result.isOneShot).toBe(true);
    expect(result.advice).toContain('วันช็อตสำเร็จ 100%');
  });

  it('detects insufficient damage and gives precise stat improvement advice', () => {
    const teshar = NUKER_PRESETS.find((n) => n.name === 'Teshar');
    const giant = ABYSS_DUNGEONS.find((d) => d.id === 'giant');

    // Under-geared stats
    const result = calculateAbyssDamage({
      nuker: teshar,
      dungeon: giant,
      totalAtk: 1800,
      critDmg: 120,
      artifactSkillCd: 0,
      artifactDmgOnElement: 0,
      hasAtkBuff: false,
      hasDefBreak: false,
      fightSetsCount: 0,
    });

    expect(result.isOneShot).toBe(false);
    expect(result.margin).toBeLessThan(0);
    expect(result.advice).toContain('ดาเมจขาด');
  });

  it('calculates Lushen ignore DEF 3-hit damage accurately', () => {
    const lushen = NUKER_PRESETS.find((n) => n.name === 'Lushen');
    const necro = ABYSS_DUNGEONS.find((d) => d.id === 'necro');

    const result = calculateAbyssDamage({
      nuker: lushen,
      dungeon: necro,
      totalAtk: 2900,
      critDmg: 230,
      artifactSkillCd: 20,
      artifactDmgOnElement: 10,
      hasAtkBuff: true,
      hasDefBreak: false, // Lushen ignores def, defbreak shouldn't matter
    });

    expect(result.singleHitDmg).toBeGreaterThan(4500);
    expect(result.totalDamage).toBe(result.singleHitDmg * 3);
    expect(result.isOneShot).toBe(true);
  });
});
