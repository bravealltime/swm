import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import guardianMeta from '../src/data/swrtGuardianMeta.json';
import RtaMonsterDetailModal from '../src/components/RtaMonsterDetailModal';
import RtaCoreFinder from '../src/components/RtaCoreFinder';

describe('Lucksack-inspired Features & Guardian Meta Dataset', () => {
  it('guardianMeta contains valid duos and trios for Core Finder', () => {
    expect(guardianMeta).toBeDefined();
    expect(Array.isArray(guardianMeta.duos)).toBe(true);
    expect(guardianMeta.duos.length).toBeGreaterThan(0);
    expect(Array.isArray(guardianMeta.trios)).toBe(true);
    expect(guardianMeta.trios.length).toBeGreaterThan(0);

    const firstDuo = guardianMeta.duos[0];
    expect(firstDuo.ids).toHaveLength(2);
    expect(firstDuo.n).toBeGreaterThan(0);
    expect(firstDuo.w).toBeGreaterThanOrEqual(0);
    expect(firstDuo.w).toBeLessThanOrEqual(firstDuo.n);
  });

  it('guardianMeta contains first pick data (fpPicks and fpWins) for strategy analysis', () => {
    expect(Array.isArray(guardianMeta.monsters)).toBe(true);
    expect(guardianMeta.monsters.length).toBeGreaterThan(0);

    const topMonster = guardianMeta.monsters[0];
    expect(topMonster).toHaveProperty('id');
    expect(topMonster).toHaveProperty('picks');
    expect(topMonster).toHaveProperty('fpPicks');
    expect(topMonster).toHaveProperty('fpWins');
    expect(topMonster.fpWins).toBeLessThanOrEqual(topMonster.fpPicks);
  });

  it('calculates first pick win rate and synergy delta correctly', () => {
    const oliver = guardianMeta.monsters.find(m => m.id === 16811);
    expect(oliver).toBeDefined();
    expect(oliver.picks).toBeGreaterThan(0);
    const fpWinRate = (oliver.fpWins / oliver.fpPicks) * 100;
    expect(fpWinRate).toBeGreaterThan(0);
    expect(fpWinRate).toBeLessThanOrEqual(100);

    const matchingDuo = guardianMeta.duos.find(d => d.ids.includes(16811));
    expect(matchingDuo).toBeDefined();
    const duoWinRate = (matchingDuo.w / matchingDuo.n) * 100;
    expect(duoWinRate).toBeGreaterThan(0);
  });

  it('renders RtaMonsterDetailModal without crashing', () => {
    const testMonster = {
      monsterId: 21001,
      name: 'Oliver',
      thaiName: 'โอลิเวอร์',
      element: 'wind',
      aiScore: 9.8,
      pickRate: 25.4,
      winRate: 52.8,
      banRate: 18.5,
      firstPickRate: 14.2
    };

    const html = renderToString(
      React.createElement(RtaMonsterDetailModal, {
        monster: testMonster,
        onClose: () => {},
        onNavigate: () => {},
        onSelectForCore: () => {}
      })
    );
    expect(html).toContain('Oliver');
    expect(html).toContain('คู่หูที่ดีที่สุด');
    expect(html).toContain('ตัวแก้ทางที่แพ้บ่อยสุด');
    expect(html).toContain('เปิดใน Core Finder');
  });

  it('renders RtaCoreFinder without crashing', () => {
    const html = renderToString(
      React.createElement(RtaCoreFinder, {
        onNavigate: () => {},
        initialMonsterId: 21001
      })
    );
    expect(html).toContain('Core Finder Pro');
    expect(html).toContain('มอนสเตอร์ Core ตัวที่ 1');
  });
});
