import { describe, it, expect } from 'vitest';
import { getMonsterLivingData } from '../src/utils/monsterLivingData.js';

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
});
