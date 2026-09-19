import { describe, it, expect } from 'vitest';
import { generate10SiegeDecks } from '../src/utils/siegeAutoBuilder.js';

describe('siegeAutoBuilder', () => {
  it('generates 10 distinct decks without duplication when box is empty or default', () => {
    const result = generate10SiegeDecks(null);
    expect(result).toBeDefined();
    expect(result.decks).toHaveLength(10);
    expect(result.summary.totalDecks).toBe(10);
    expect(parseFloat(result.summary.avgWinRate)).toBeGreaterThanOrEqual(90);

    // Verify 30 monsters across 10 decks have 3 monsters each
    for (const deck of result.decks) {
      expect(deck.slots).toHaveLength(3);
      expect(deck.slots[0]).toBeDefined();
      expect(deck.slots[1]).toBeDefined();
      expect(deck.slots[2]).toBeDefined();
    }
  });

  it('generates 10 decks prioritizing owned units from player box', () => {
    // Mock a box containing popular siege monsters
    // a raw SWEX dump: no names, real com2us ids — the builder resolves them through the catalog
    const mockBox = {
      unit_list: [
        { unit_id: 1, unit_master_id: 22611, class: 6, unit_level: 40, spd: 101 }, // Bolverk
        { unit_id: 2, unit_master_id: 21211, class: 6, unit_level: 40, spd: 100 }, // Mo Long
        { unit_id: 3, unit_master_id: 21511, class: 6, unit_level: 40, spd: 103 }, // Amelia
        { unit_id: 4, unit_master_id: 16513, class: 6 }, // Copper
        { unit_id: 5, unit_master_id: 20812, class: 6 }, // Bulldozer
        { unit_id: 6, unit_master_id: 20613, class: 6 }, // Imesety
        { unit_id: 7, unit_master_id: 19411, class: 6 }, // Galleon
        { unit_id: 8, unit_master_id: 13912, class: 6 }, // Clara
        { unit_id: 10, unit_master_id: 15713, class: 6 }, // Seara
        { unit_id: 11, unit_master_id: 13415, class: 6 }, // Liebli
        { unit_id: 12, unit_master_id: 20511, class: 6 }, // Bastet
      ],
    };

    const result = generate10SiegeDecks(mockBox);
    expect(result.decks).toHaveLength(10);
    
    // Check that Bolverk Mo Long Amelia was picked
    const hasBolverkTeam = result.decks.some((d) =>
      d.slots.some((m) => m.name.toLowerCase().includes('bolverk')) &&
      d.slots.some((m) => m.name.toLowerCase().includes('mo long'))
    );
    expect(hasBolverkTeam).toBe(true);
    expect(result.summary.hasBox).toBe(true);
    expect(result.summary.ownedCount).toBe(11);
  });

  it('accepts the compact box the site stores and never reports a win rate it did not measure', () => {
    const compact = { units: [{ masterId: 22611, name: 'Bolverk', stars: 6, spd: 210, baseSpd: 101 }, { masterId: 21211, name: 'Mo Long', stars: 6 }, { masterId: 21511, name: 'Amelia', stars: 6 }] };
    const result = generate10SiegeDecks(compact);
    expect(result.summary.ownedCount).toBe(3);
    for (const d of result.decks) {
      if (d.winRate) expect(d.notes).toContain('3MDC');
      else expect(d.notes).not.toMatch(/d+(.d+)?%/); // templates and box fillers carry no invented percentage
    }
  });

  it('flags a missing box instead of pretending', () => {
    const result = generate10SiegeDecks(null);
    expect(result.summary.hasBox).toBe(false);
    expect(result.decks).toHaveLength(10);
  });
});
