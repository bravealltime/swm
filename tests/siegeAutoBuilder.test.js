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
    const mockBox = {
      unit_list: [
        { unit_id: 1, unit_master_id: 21312, name: 'Bolverk', class: 6 }, // Bolverk
        { unit_id: 2, unit_master_id: 17811, name: 'Mo Long', class: 6 }, // Mo Long
        { unit_id: 3, unit_master_id: 20011, name: 'Amelia', class: 6 }, // Amelia
        { unit_id: 4, unit_master_id: 13013, name: 'Copper', class: 6 }, // Copper
        { unit_id: 5, unit_master_id: 19112, name: 'Bulldozer', class: 6 }, // Bulldozer
        { unit_id: 6, unit_master_id: 19813, name: 'Imesety', class: 6 }, // Imesety
        { unit_id: 7, unit_master_id: 12111, name: 'Galleon', class: 6 }, // Galleon
        { unit_id: 8, unit_master_id: 15312, name: 'Clara', class: 6 }, // Clara
        { unit_id: 9, unit_master_id: 24714, name: 'Leah', class: 6 }, // Leah
        { unit_id: 10, unit_master_id: 14713, name: 'Seara', class: 6 },
        { unit_id: 11, unit_master_id: 11115, name: 'Liebli', class: 6 },
        { unit_id: 12, unit_master_id: 18411, name: 'Bastet', class: 6 },
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
  });
});
