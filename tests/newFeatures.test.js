import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { scanMissingGrinds, MAX_GRINDS, SET_FARM_SOURCES } from '../src/utils/runeGrindScanner';
import { FUSION_RECIPES, analyzeFusionProgress, analyzeDevilmonPriority } from '../src/utils/fusionData';
import RuneGrindTracker from '../src/components/RuneGrindTracker';
import FusionDevilmonPlanner from '../src/components/FusionDevilmonPlanner';
import RtaReplayTheaterView from '../src/views/RtaReplayTheaterView';
import SiegeBattlesView from '../src/views/SiegeBattlesView';
import { loadDemoBox } from '../src/utils/swexImport';

describe('Rune Grind & Gem Scanner (runeGrindScanner.js)', () => {
  it('handles empty or null box gracefully without throwing', () => {
    const resEmpty = scanMissingGrinds(null);
    expect(resEmpty.totalRunes).toBe(0);
    expect(resEmpty.missingGrindRunes).toEqual([]);
    expect(resEmpty.stats.missingSpd).toBe(0);
  });

  it('correctly identifies unground SPD and gemmable flat stats', () => {
    const mockBox = {
      runes: [
        {
          id: 101,
          slot: 1,
          stars: 6,
          set: 3, // Swift
          eff: 92,
          occupied_id: 1001,
          subs: [
            [8, 19, 0, 0], // SPD +19, grind 0 -> unground SPD
            [2, 14, 0, 0], // HP% +14, grind 0 -> unground %
            [1, 150, 0, 0], // Flat HP -> gemmable flat!
            [9, 12, 0, 0], // CRate 12%
          ],
        },
        {
          id: 102,
          slot: 3,
          stars: 6,
          set: 13, // Violent
          eff: 88,
          occupied_id: 0,
          subs: [
            [8, 15, 4, 0], // SPD +15, grind +4 (Hero) -> max grind is 5, still has room
            [4, 18, 7, 0], // DEF% +18, grind +7
          ],
        },
      ],
      units: [
        {
          id: 1001,
          name: 'Moore',
          element: 'water',
          info: { name: 'Moore', thaiName: 'มัวร์ (สไตรเกอร์น้ำ)' },
        },
      ],
    };

    const res = scanMissingGrinds(mockBox);
    expect(res.totalRunes).toBe(2);
    expect(res.missingGrindRunes.length).toBeGreaterThan(0);

    const first = res.missingGrindRunes.find((r) => r.id === 101);
    expect(first).toBeDefined();
    expect(first.ungroundSubs.some((s) => s.isSpd)).toBe(true);
    expect(first.gemmableFlats.length).toBe(1);
    expect(first.farmSource).toBe('ไจแอนท์ (GB10/Abyss) / เรด R5');
  });
});

describe('Fusion & Devilmon Planner (fusionData.js)', () => {
  it('contains all 7 key Nat 5 fusions', () => {
    expect(FUSION_RECIPES.length).toBe(7);
    const ids = FUSION_RECIPES.map((r) => r.id);
    expect(ids).toContain('veromos');
    expect(ids).toContain('riley');
    expect(ids).toContain('jeanne');
    expect(ids).toContain('baleygr');
    expect(ids).toContain('sigmarus');
    expect(ids).toContain('xiongfei');
    expect(ids).toContain('katarina');
  });

  it('analyzes fusion progress with owned box units', () => {
    const mockBox = {
      units: [
        { name: 'Veromos', info: { name: 'Veromos', stars: 5 } },
        { name: 'Chilling', info: { name: 'Chilling', stars: 4 } },
        { name: 'Ling Ling', info: { name: 'Ling Ling', stars: 4 } },
      ],
    };

    const progress = analyzeFusionProgress(mockBox);
    const vero = progress.find((p) => p.id === 'veromos');
    expect(vero.isCompleted).toBe(true);
    expect(vero.percent).toBe(100);

    const riley = progress.find((p) => p.id === 'riley');
    expect(riley.isCompleted).toBe(false);
    expect(riley.readyCount).toBe(2); // Chilling + Ling Ling
    expect(riley.percent).toBe(50);
  });

  it('analyzes devilmon priority for Nat 5s', () => {
    const mockBox = {
      units: [
        {
          id: 1,
          name: 'Oliver',
          element: 'wind',
          stars: 6,
          naturalStars: 5,
          info: { name: 'Oliver', thaiName: 'โอลิเวอร์' },
          skills: [[1, 1], [2, 1], [3, 1]],
        },
        {
          id: 2,
          name: 'Moore',
          element: 'water',
          stars: 6,
          naturalStars: 5,
          info: { name: 'Moore', thaiName: 'มัวร์' },
          skills: [[1, 5], [2, 5], [3, 5]], // Maxed
        },
      ],
    };

    const priorities = analyzeDevilmonPriority(mockBox);
    expect(priorities.length).toBe(2);

    const oliver = priorities.find((p) => p.name === 'Oliver');
    expect(oliver.priorityTier).toBe('S');
    expect(oliver.isMaxed).toBe(false);
    expect(oliver.estimatedNeeded).toBeGreaterThan(0);

    const moore = priorities.find((p) => p.name === 'Moore');
    expect(moore.isMaxed).toBe(true);
    expect(moore.estimatedNeeded).toBe(0);
  });
});

describe('UI Views & Components Rendering', () => {
  it('renders RuneGrindTracker with demo box', () => {
    const demo = loadDemoBox();
    const html = renderToString(React.createElement(RuneGrindTracker, { box: demo }));
    expect(html).toContain('รูนที่ยังขาดหิน Grind');
    expect(html).toContain('ขาดหินสปีด');
  });

  it('renders FusionDevilmonPlanner without crashing', () => {
    const demo = loadDemoBox();
    const html = renderToString(React.createElement(FusionDevilmonPlanner, { box: demo }));
    expect(html).toContain('แผนผังผสมมอนสเตอร์');
    expect(html).toContain('จัดคิวเดวิลม่อน');
  });

  it('renders RtaReplayTheaterView with G3/Legend replays', () => {
    const html = renderToString(React.createElement(RtaReplayTheaterView, {}));
    expect(html).toContain('Pro Replay Theater');
    expect(html).toContain('60');
  });

  it('renders SiegeBattlesView with servers and meta defenses', () => {
    const html = renderToString(React.createElement(SiegeBattlesView, {}));
    expect(html).toContain('Global Siege &amp; Guild War Hub');
    expect(html).toContain('4 ทวีปหลัก');
  });
});
