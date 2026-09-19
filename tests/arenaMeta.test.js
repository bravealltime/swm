import { describe, it, expect } from 'vitest';
import { matchArenaTeams } from '../src/utils/arenaMatcher.js';

describe('arenaMatcher', () => {
  it('loads default Arena Offense and Defense meta teams with 4-monster slots', () => {
    const result = matchArenaTeams(null);
    expect(result).toBeDefined();
    expect(result.offense.length).toBeGreaterThanOrEqual(5);
    expect(result.defense.length).toBeGreaterThanOrEqual(4);

    for (const team of result.offense) {
      expect(team.slots).toHaveLength(4);
      expect(team.turnOrder.length).toBeGreaterThanOrEqual(3);
      expect(team.runeGuidance).toBeDefined();
    }

    for (const team of result.defense) {
      expect(team.slots).toHaveLength(4);
      expect(team.winCondition).toBeDefined();
      expect(team.runeBuilds).toBeDefined();
    }
  });

  it('matches player box accurately detecting 4/4 complete teams vs missing 1', () => {
    // Mock a box containing Psamathe Double Boost Lushen team
    const mockBox = {
      unit_list: [
        { unit_id: 1, unit_master_id: 18311, name: 'Psamathe', class: 6 },
        { unit_id: 2, unit_master_id: 11013, name: 'Bernard', class: 6 },
        { unit_id: 3, unit_master_id: 18411, name: 'Bastet', class: 6 },
        { unit_id: 4, unit_master_id: 13413, name: 'Lushen', class: 6 },
      ],
    };

    const result = matchArenaTeams(mockBox);
    expect(result.summary.hasBox).toBe(true);

    const psamaTeam = result.offense.find((t) => t.id === 'ao-psamathe-lushen');
    expect(psamaTeam).toBeDefined();
    expect(psamaTeam.isComplete).toBe(true);
    expect(psamaTeam.ownedCount).toBe(4);
    expect(psamaTeam.missingMonsters).toHaveLength(0);

    // Other teams where player doesn't have all 4 should not be complete
    const tianaTeam = result.offense.find((t) => t.id === 'ao-tiana-zaiross');
    expect(tianaTeam.isComplete).toBe(false);
    expect(tianaTeam.missingMonsters.length).toBeGreaterThan(0);
  });
});
