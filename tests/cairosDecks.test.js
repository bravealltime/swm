import { describe, it, expect } from 'vitest';
import { findUserDungeonDecks, resolveUserDeck, CAIROS_DUNGEON_SEQ_MAP } from '../src/utils/cairosDecks';

describe('cairosDecks utility', () => {
  it('maps all 6 Cairos Abyss Hard dungeons to their SWEX sequence IDs', () => {
    expect(CAIROS_DUNGEON_SEQ_MAP['giants-abyss-hard']).toEqual([101]);
    expect(CAIROS_DUNGEON_SEQ_MAP['dragons-abyss-hard']).toEqual([203, 202, 201]);
    expect(CAIROS_DUNGEON_SEQ_MAP['necropolis-abyss-hard']).toEqual([301]);
    expect(CAIROS_DUNGEON_SEQ_MAP['steel-abyss-hard']).toEqual([401]);
    expect(CAIROS_DUNGEON_SEQ_MAP['punishers-abyss-hard']).toEqual([501]);
    expect(CAIROS_DUNGEON_SEQ_MAP['spiritual-abyss-hard']).toEqual([601, 602, 603]);
  });

  it('safely handles empty or null box', () => {
    expect(findUserDungeonDecks(null, 'giants-abyss-hard')).toEqual([]);
    expect(findUserDungeonDecks({}, 'giants-abyss-hard')).toEqual([]);
    expect(findUserDungeonDecks({ decks: [] }, 'giants-abyss-hard')).toEqual([]);
  });

  it('resolves user deck with exact units, runes, and tactical roles', () => {
    const mockBox = {
      wizard: { name: 'PedictU' },
      units: [
        { uid: 1, name: 'Julie', baseSpd: 103, spd: 169, atk: 834, cr: 15, cd: 50, sets: ['Blade', 'Fight', 'Fight'], element: 'water' },
        { uid: 2, name: 'Prilea', baseSpd: 105, spd: 133, atk: 736, cr: 15, cd: 50, sets: ['Fight', 'Fight'], element: 'wind' },
        { uid: 3, name: 'Lucifer', baseSpd: 104, spd: 179, atk: 725, cr: 15, cd: 50, sets: ['Rage'], element: 'light' },
        { uid: 4, name: 'Luna', baseSpd: 103, spd: 161, atk: 878, cr: 15, cd: 50, sets: ['Fight', 'Intangible'], element: 'dark' },
        { uid: 5, name: 'Deborah', baseSpd: 103, spd: 129, atk: 703, cr: 15, cd: 50, sets: ['Fight', 'Fight', 'Fight'], element: 'dark' },
      ],
      decks: [
        {
          deck_type: 24,
          deck_seq: 101,
          leader_unit_id: 1,
          unit_id_list: [1, 2, 3, 4, 5, 0, 0, 0],
        },
      ],
    };

    const decks = findUserDungeonDecks(mockBox, 'giants-abyss-hard');
    expect(decks).toHaveLength(1);
    const d = decks[0];
    expect(d.seq).toBe(101);
    expect(d.deckTitle).toContain('สถิติโลก');
    expect(d.team).toHaveLength(5);

    // Julie
    expect(d.team[0].name).toBe('Julie (L)');
    expect(d.team[0].isLeader).toBe(true);
    expect(d.team[0].spd).toBe('+66 (รวม 169)');
    expect(d.team[0].rune).toBe('Blade / Fight / Fight');

    // Lucifer
    expect(d.team[2].name).toBe('Lucifer');
    expect(d.team[2].spd).toBe('+75 (รวม 179)');
    expect(d.team[2].role).toContain('Dark Light');

    // Deborah
    expect(d.team[4].name).toBe('Deborah');
    expect(d.team[4].rune).toBe('Fight / Fight / Fight');
  });

  it('resolves Liam 1-Shot Dragon deck (seq 203)', () => {
    const mockBox = {
      wizard: { name: 'PedictU' },
      units: [
        { uid: 10, name: 'Shaina', baseSpd: 103, spd: 163, sets: ['Fight', 'Fight', 'Fight'], element: 'fire' },
        { uid: 11, name: 'Julie', baseSpd: 103, spd: 178, sets: ['Rage', 'Blade'], element: 'water' },
        { uid: 12, name: 'Luna', baseSpd: 103, spd: 158, sets: ['Rage', 'Blade'], element: 'dark' },
        { uid: 13, name: 'Icaru', baseSpd: 108, spd: 173, sets: ['Fight', 'Fight', 'Fight'], element: 'water' },
        { uid: 14, name: 'Liam', baseSpd: 102, spd: 132, sets: ['Rage', 'Blade'], element: 'water' },
      ],
      decks: [
        {
          deck_type: 24,
          deck_seq: 203,
          leader_unit_id: 10,
          unit_id_list: [10, 11, 12, 13, 14, 0, 0, 0],
        },
      ],
    };

    const decks = findUserDungeonDecks(mockBox, 'dragons-abyss-hard');
    expect(decks).toHaveLength(1);
    expect(decks[0].seq).toBe(203);
    expect(decks[0].deckTitle).toContain('Liam');
    expect(decks[0].recordTime).toBe('00:19');
  });
});
