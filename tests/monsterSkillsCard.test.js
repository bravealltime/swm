import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import MonsterSkillsCard from '../src/components/MonsterSkillsCard';

describe('MonsterSkillsCard Component', () => {
  it('renders monster skills without throwing useState is not defined error', () => {
    const mockMonsterData = {
      name: 'Oliver',
      element: 'wind',
      stars: 5,
      skills: [
        {
          name: 'Trick',
          description: 'Attacks the enemy and decreases the Attack Bar by 25% with a 50% chance.',
          slot: 1,
        },
        {
          name: 'Impulse of Wind',
          description: 'Attacks the enemy 2 times and decreases the skill cooldown.',
          slot: 2,
        },
      ],
      baseStats: {
        hp: 10875,
        atk: 769,
        def: 626,
        spd: 104,
      },
    };

    const html = renderToString(React.createElement(MonsterSkillsCard, { monsterData: mockMonsterData }));
    expect(html).toContain('Trick');
    expect(html).toContain('Impulse of Wind');
  });

  it('renders fallback message gracefully when monsterData is null', () => {
    const html = renderToString(React.createElement(MonsterSkillsCard, { monsterData: null }));
    expect(html).toContain('ไม่พบข้อมูลสกิลของมอนสเตอร์นี้');
  });
});
