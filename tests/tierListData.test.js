import { describe, it, expect } from 'vitest';
import { 
  getDynamicRtaTiers, 
  getDynamicSiegeTiers, 
  getDynamicPveTiers 
} from '../src/utils/tierListData.js';

describe('tierListData', () => {
  it('generates dynamic RTA Guardian Tier List from real data', () => {
    const tiers = getDynamicRtaTiers();
    expect(tiers).toHaveLength(4);
    expect(tiers[0].id).toBe('rta-s-plus');
    expect(tiers[0].monsters.length).toBeGreaterThan(0);
    // Each monster should have real pick / win / ban rate strings
    for (const m of tiers[0].monsters) {
      expect(m.name).toBeDefined();
      expect(m.winRate).toBeDefined();
      expect(m.picks).toBeGreaterThan(0);
    }
  });

  it('generates dynamic Siege Meta Tier List from 3MDC', () => {
    const tiers = getDynamicSiegeTiers();
    expect(tiers).toHaveLength(4);
    expect(tiers[0].id).toBe('siege-s-plus');
    expect(tiers[0].monsters.length).toBeGreaterThan(0);
    for (const m of tiers[0].monsters) {
      expect(m.name).toBeDefined();
      expect(m.cntCount).toBeGreaterThanOrEqual(0);
    }
  });

  it('generates dynamic PVE Abyss Hard Speed Farm Tier List', () => {
    const tiers = getDynamicPveTiers();
    expect(tiers).toHaveLength(3);
    expect(tiers[0].id).toBe('pve-s-plus');
    expect(tiers[0].monsters.length).toBeGreaterThan(0);
    for (const m of tiers[0].monsters) {
      expect(m.name).toBeDefined();
      expect(m.role).toBeDefined();
    }
  });
});
