import { describe, it, expect } from 'vitest';
import {
  calculateKillPriority,
  checkWillSafety,
  analyzeTurnOrder,
  findSubstitutes,
  getMonsterThreat,
} from '../src/utils/siegeTactics.js';

describe('AI Tactical Counter Scanner & Battle Plan Engine', () => {
  describe('getMonsterThreat & calculateKillPriority', () => {
    it('ranks high-threat nukers and armor breakers as top kill priorities', () => {
      const defense = [{ name: 'Clara' }, { name: 'Savannah' }, { name: 'Theomars' }];
      const priorities = calculateKillPriority(defense);

      expect(priorities.length).toBe(3);
      // Savannah is high priority (Tier 1 nuker/armor breaker)
      expect(priorities[0].targetName).toBe('Savannah');
      expect(priorities[0].isPrimary).toBe(true);

      // Clara is Tier 2 stripper/stunner
      expect(priorities[1].targetName).toBe('Clara');

      // Theomars is Tier 4 endure/passive staller
      expect(priorities[2].targetName).toBe('Theomars');
    });

    it('handles empty defense gracefully', () => {
      const priorities = calculateKillPriority([]);
      expect(priorities).toEqual([]);
    });
  });

  describe('checkWillSafety', () => {
    it('detects safe immunity when all friendly units have Will runes', () => {
      const units = [
        { name: 'Galleon', sets: ['Shield', 'Will', 'Focus'] },
        { name: 'Julie', sets: ['Rage', 'Will'] },
        { name: 'Chilling', sets: ['Swift', 'Will'] },
      ];
      const enemy = [{ name: 'Clara' }, { name: 'Savannah' }, { name: 'Theomars' }];

      const res = checkWillSafety(units, enemy);
      expect(res.isSafe).toBe(true);
      expect(res.status).toBe('safe');
      expect(res.willCount).toBe(3);
    });

    it('warns when missing Will against aggressive enemy speed openers', () => {
      const units = [
        { name: 'Galleon', sets: ['Swift', 'Focus'] },
        { name: 'Julie', sets: ['Fatal', 'Blade'] },
        { name: 'Chilling', sets: ['Swift', 'Focus'] },
      ];
      const enemy = [{ name: 'Clara' }, { name: 'Savannah' }, { name: 'Theomars' }];

      const res = checkWillSafety(units, enemy);
      expect(res.isSafe).toBe(false);
      expect(res.status).toBe('danger');
      expect(res.badge).toContain('คำเตือน: ไม่มีรูน Will');
    });

    it('detects built-in immunity buffers (e.g. Woosa, Velajuel)', () => {
      const units = [
        { name: 'Woosa', sets: ['Swift', 'Energy'] },
        { name: 'Theomars', sets: ['Violent', 'Blade'] },
      ];
      const enemy = [{ name: 'Clara' }, { name: 'Orion' }];

      const res = checkWillSafety(units, enemy);
      expect(res.isSafe).toBe(true);
      expect(res.status).toBe('safe');
      expect(res.detail).toContain('ทีมมีตัวกางบัพป้องกัน');
    });
  });

  describe('analyzeTurnOrder', () => {
    it('sorts units by actual speed and verifies turn order', () => {
      const units = [
        { name: 'Julie', spd: 210, baseSpd: 103, sets: ['Rage', 'Will'] },
        { name: 'Chilling', spd: 265, baseSpd: 101, sets: ['Swift', 'Will'] },
        { name: 'Galleon', spd: 245, baseSpd: 108, sets: ['Violent', 'Will'] },
      ];

      const res = analyzeTurnOrder(units);
      expect(res.turnOrder.length).toBe(3);
      expect(res.turnOrder[0].name).toBe('Chilling');
      expect(res.turnOrder[1].name).toBe('Galleon');
      expect(res.turnOrder[2].name).toBe('Julie');
    });

    it('warns when speed gap is excessively large', () => {
      const units = [
        { name: 'Chilling', spd: 290, baseSpd: 101 },
        { name: 'Galleon', spd: 220, baseSpd: 108 }, // gap = 70 SPD!
      ];

      const res = analyzeTurnOrder(units);
      expect(res.hasSpeedGapWarning).toBe(true);
      expect(res.maxGap).toBe(70);
      expect(res.summary).toContain('ช่องว่างสปีดกว้าง');
    });
  });

  describe('findSubstitutes', () => {
    it('finds owned replacement monsters in the same functional role', () => {
      const userUnitsMap = new Map();
      userUnitsMap.set('chiwu', { name: 'Chiwu', spd: 260, runes: 6, sets: ['Despair', 'Will'], element: 'fire' });
      userUnitsMap.set('soha', { name: 'Soha', spd: 220, runes: 6, sets: ['Swift', 'Focus'], element: 'water' });

      // Missing Tiana (Stripper)
      const subs = findSubstitutes('Tiana', userUnitsMap);
      expect(subs.length).toBeGreaterThan(0);
      expect(subs.some((s) => s.name === 'Chiwu')).toBe(true);
    });
  });
});
