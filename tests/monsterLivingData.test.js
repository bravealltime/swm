import { describe, it, expect } from 'vitest';
import { getMonsterLivingData, calculateGuardianReadiness } from '../src/utils/monsterLivingData.js';

describe('monsterLivingData', () => {
  it('returns comprehensive living data for a top meta monster (Oliver)', () => {
    const data = getMonsterLivingData('Oliver');
    expect(data).toBeDefined();
    expect(data.monster.name).toBe('Oliver');
    expect(data.com2usId).toBe(25313);

    // 1. RTA Guardian Stats
    expect(data.guardianStats).toBeDefined();
    expect(data.guardianStats.isMeta).toBe(true);
    expect(data.guardianStats.picks).toBeGreaterThan(1000);
    expect(Number(data.guardianStats.winRate)).toBeGreaterThan(40);

    // 2. Duos
    expect(data.duos.length).toBeGreaterThan(0);
    expect(data.duos[0].matches).toBeGreaterThan(300);

    // 3. Synergies & Counters
    expect(data.synergies).toBeDefined();
    expect(data.counters).toBeDefined();

    // 4. 3MDC Stats
    expect(data.mdcStats).toBeDefined();

    // 5. Rune builds
    expect(data.builds).toBeDefined();

    // 6. Summary text
    expect(data.summaryTextTh).toContain('Oliver');
    expect(data.summaryTextTh).toContain('Guardian');
  });

  it('returns living data with balance patch notes (Psamathe / Morris / Sieq)', () => {
    const data = getMonsterLivingData('Psamathe');
    expect(data).toBeDefined();
    expect(data.balancePatches.length).toBeGreaterThan(0);
    expect(data.balancePatches[0].changeTypeTh).toBeDefined();
    expect(data.builds).toBeDefined();
  });

  it('handles monsters by com2usId or id', () => {
    const byCid = getMonsterLivingData(25313);
    expect(byCid).toBeDefined();
    expect(byCid.monster.name).toBe('Oliver');

    const byId = getMonsterLivingData('m-25313');
    expect(byId).toBeDefined();
    expect(byId.monster.name).toBe('Oliver');
  });

  it('returns safe fallback values for non-meta monsters without crashing', () => {
    const data = getMonsterLivingData('Lapis');
    expect(data).toBeDefined();
    expect(data.monster.name).toBe('Lapis');
    expect(data.guardianStats).toBeNull();
    expect(data.duos).toHaveLength(0);
    expect(data.builds).toBeDefined();
    expect(data.summaryTextTh.length).toBeGreaterThan(20);
  });

  it('extracts dungeon Abyss Hard presence for PVE monsters (Teshar / Liam)', () => {
    const teshar = getMonsterLivingData('Teshar');
    expect(teshar).toBeDefined();
    expect(teshar.dungeonStats.length).toBeGreaterThan(0);
    expect(teshar.dungeonStats[0].dungeonNameEn).toBe("Giant's Keep Abyss Hard");
    expect(teshar.dungeonStats[0].avgTime).toBeDefined();
    expect(teshar.summaryTextTh).toContain("Giant's Keep Abyss Hard");

    const liam = getMonsterLivingData('Liam');
    expect(liam).toBeDefined();
    expect(liam.dungeonStats.length).toBeGreaterThan(0);
    expect(liam.dungeonStats[0].dungeonNameEn).toBe("Dragon's Lair Abyss Hard");
  });

  it('calculates guardian readiness score accurately', () => {
    const benchmarks = { hp: 40000, atk: 2000, def: 1200, spd: 250, cr: 70, cd: 140, res: 40, acc: 35 };
    const equipped = { hp: 42000, atk: 2100, def: 1300, spd: 260, cr: 75, cd: 150, res: 50, acc: 40 };
    const result = calculateGuardianReadiness(equipped, benchmarks);
    expect(result).toBeDefined();
    expect(result.score).toBeGreaterThanOrEqual(95);
    expect(result.grade).toBe('S');
    expect(result.passedCount).toBe(8);
  });
});
