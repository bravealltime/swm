// SWEX profile export → compact box (src/utils/swexImport.js). The fixture mirrors the fields
// the parser reads from a real export; ids are real com2us ids so the catalog lookup works.
import { describe, it, expect } from 'vitest';
import { parseSwexExport, baseAwakenedId, isNonSummonableLd5, ownedIdSet, getMonsterCatalogInfo, RUNE_SETS, topSpeedRunes } from '../src/utils/swexImport.js';
import { computeUnitSkillStatus, getMonsterMaxSkills } from '../src/data/monsterSkills.js';

const SPD = 8;
// pri_eff / prefix_eff: [stat, value]; sec_eff: [stat, value, enchanted, grind]
const rune = (rune_id, slot_no, set_id, { pri = [1, 100], prefix = [0, 0], subs = [] } = {}) => ({
  rune_id, slot_no, set_id, class: 6, rank: 5, extra: 3, upgrade_curr: 12, pri_eff: pri, prefix_eff: prefix, sec_eff: subs,
});

const swift = (i) => rune(100 + i, i, 3, { subs: [[SPD, 10, 0, 2]] });   // 4 pieces of Swift, each +12 SPD
const will = (i) => rune(100 + i, i, 15, { subs: [[9, 10, 0, 0]] });

const EXPORT = {
  wizard_info: { wizard_name: 'Tester', wizard_level: 50, wizard_last_country: 'th', wizard_id: 1234567890 },
  guild: { guild_info: { name: 'SWM Guild' } },
  unit_list: [
    {
      unit_id: 1, unit_master_id: 13413, // Lushen (wind Joker, awakened: family 134, stage 1, element 3)
      class: 6, unit_level: 40, attribute: 3, spd: 103, con: 6300, atk: 900, def: 500,
      critical_rate: 15, critical_damage: 50, accuracy: 0, resist: 15, create_time: '2024-01-02 03:04:05',
      skills: [[710, 6], [717, 5], [724, 5]], // Max skilled Lushen
      runes: [swift(1), swift(2), swift(3), swift(4), will(5), will(6)],
      artifacts: [{ rid: 9001, type: 1, attribute: 3, slot: 1, rank: 5, level: 15, pri_eff: [1, 1500], sec_eff: [[207, 105, 1, 0]] }],
    },
    { unit_id: 2, unit_master_id: 19215, class: 5, unit_level: 35, attribute: 5, spd: 100, con: 5000, atk: 700, def: 600, skills: [[1116, 2], [1121, 1], [1124, 1]], runes: {} }, // Unmaxed Veromos
    { unit_id: 3, unit_master_id: 0 }, // junk row
  ],
  runes: [rune(999, 2, 13)],
  artifacts: [{ rid: 9002, type: 2, unit_style: 4, slot: 2, rank: 4, level: 9, pri_eff: [3, 80], sec_eff: [] }],
};

describe('parseSwexExport', () => {
  const box = parseSwexExport(EXPORT);

  it('rejects things that are not a SWEX export', () => {
    expect(() => parseSwexExport(null)).toThrow();
    expect(() => parseSwexExport({ hello: 1 })).toThrow(/unit_list/);
  });

  it('passes an already-parsed box through untouched', () => {
    expect(parseSwexExport(box)).toBe(box);
  });

  it('keeps only a hint of the account id and normalises the wizard', () => {
    expect(box.wizard).toMatchObject({ name: 'Tester', level: 50, country: 'TH', guild: 'SWM Guild', idHint: '7890' });
    expect(JSON.stringify(box)).not.toContain('1234567890');
  });

  it('drops units without a master id and sorts by stars, level, speed', () => {
    expect(box.units.map((u) => u.masterId)).toEqual([13413, 19215]);
  });

  it('adds flat SPD from runes plus 25% base per Swift set', () => {
    const lushen = box.units[0];
    // 4 Swift runes × (10 + 2 grind) flat SPD = 48, one Swift set = floor(103 × 0.25) = 25
    expect(lushen.baseSpd).toBe(103);
    expect(lushen.spd).toBe(103 + 48 + 25);
    expect(lushen.sets).toEqual(['Swift', 'Will']);
    expect(lushen.runes).toBe(6);
  });

  it('converts con to HP and copies the other stats', () => {
    expect(box.units[0]).toMatchObject({ hp: 6300 * 15, atk: 900, def: 500, cr: 15, cd: 50, res: 15, element: 'wind', stars: 6, level: 40, obtained: '2024-01-02 03:04' });
  });

  it('resolves names and art from the catalog', () => {
    expect(box.units[0].name).toMatch(/Lushen/i);
    expect(box.units[0].avatarUrl).toMatch(/^https?:\/\//);
  });

  it('collects equipped and loose runes and artifacts', () => {
    expect(box.runes).toHaveLength(7);
    expect(box.runes.filter((r) => r.unit === 13413)).toHaveLength(6);
    expect(box.runes.find((r) => r.id === 999)).toMatchObject({ unit: 0, set: 13, slot: 2, stars: 6, lvl: 12 });
    expect(box.artifacts).toHaveLength(2);
    expect(box.artifacts[0]).toMatchObject({ kind: 'element', element: 'wind', unit: 1, main: [1, 1500] });
    expect(box.artifacts[1]).toMatchObject({ kind: 'archetype', archetype: 'Support', unit: 0 });
  });

  it('preserves unit skills and computes maxed vs unmaxed skill status correctly', () => {
    const lushen = box.units[0];
    expect(lushen.skills).toEqual([[710, 6], [717, 5], [724, 5]]);
    const lushenStatus = computeUnitSkillStatus(lushen);
    expect(lushenStatus.hasData).toBe(true);
    expect(lushenStatus.isMaxSkilled).toBe(true);
    expect(lushenStatus.missingSkillups).toBe(0);

    const veromos = box.units[1];
    expect(veromos.skills).toEqual([[1116, 2], [1121, 1], [1124, 1]]);
    const veromosStatus = computeUnitSkillStatus(veromos);
    expect(veromosStatus.hasData).toBe(true);
    expect(veromosStatus.isMaxSkilled).toBe(false);
    expect(veromosStatus.missingSkillups).toBeGreaterThan(0);

    // Demo unit with 'max'
    const demoMaxStatus = computeUnitSkillStatus({ masterId: 13413, skills: 'max' });
    expect(demoMaxStatus.isMaxSkilled).toBe(true);
    expect(demoMaxStatus.missingSkillups).toBe(0);
  });

  it('stamps the box version and import time', () => {
    expect(box.version).toBeGreaterThan(0);
    expect(new Date(box.importedAt).getTime()).toBeGreaterThan(0);
  });
});

describe('ids', () => {
  it('baseAwakenedId folds unawakened and 2A ids onto the 1A id', () => {
    // FFF-A-E: the tens digit is the awakening stage (0 unawakened, 1 awakened, 3 second awakening)
    expect(baseAwakenedId(13413)).toBe(13413); // already awakened
    expect(baseAwakenedId(13403)).toBe(13413); // unawakened
    expect(baseAwakenedId(13433)).toBe(13413); // second awakening
    expect(baseAwakenedId('abc')).toBe(0);
  });

  it('ownedIdSet contains both the exact and the awakened id', () => {
    const set = ownedIdSet({ units: [{ masterId: 13433 }] });
    expect(set.has(13433)).toBe(true);
    expect(set.has(13413)).toBe(true);
  });

  it('isNonSummonableLd5 recognises fusion / free LD5 by id and by name', () => {
    expect(isNonSummonableLd5({ masterId: 19215 })).toBe(true);           // Veromos
    expect(isNonSummonableLd5({ masterId: 19205 })).toBe(true);           // unawakened Veromos
    expect(isNonSummonableLd5({ name: 'Light Homunculus', element: 'light' })).toBe(true);
    expect(isNonSummonableLd5({ name: 'Jeanne' })).toBe(true);
    expect(isNonSummonableLd5({ thaiName: 'ฌาน' })).toBe(true);
    expect(isNonSummonableLd5({ name: 'Elsharion' })).toBe(true);
    expect(isNonSummonableLd5({ name: 'Eirgar' })).toBe(true);
    expect(isNonSummonableLd5({ name: 'Altaïr' })).toBe(true);
    expect(isNonSummonableLd5({ name: 'Frederic' })).toBe(true);
    expect(isNonSummonableLd5({ name: 'Ryomen Sukuna' })).toBe(true);
    expect(isNonSummonableLd5({ masterId: 30215 })).toBe(true);
    expect(isNonSummonableLd5({ name: 'Dark Hayato / Ryomen Sukuna' })).toBe(true);
    expect(isNonSummonableLd5({ masterId: 30815 })).toBe(true);
    expect(isNonSummonableLd5({ name: 'Gapsoo' })).toBe(true);
    expect(isNonSummonableLd5({ masterId: 28915 })).toBe(true);
    expect(isNonSummonableLd5({ masterId: 13413, name: 'Lushen' })).toBe(false);
    // Real summonable LD5s must return false (not non-summonable)
    expect(isNonSummonableLd5({ masterId: 11115, name: 'Giana' })).toBe(false);
    expect(isNonSummonableLd5({ masterId: 11715, name: 'Ragdoll' })).toBe(false);
    expect(isNonSummonableLd5({ masterId: 24614, name: 'Lucifer' })).toBe(false);
    expect(isNonSummonableLd5(null)).toBe(false);
  });

  it('getMonsterCatalogInfo finds a monster from any awakening stage', () => {
    expect(getMonsterCatalogInfo(13413)?.name).toMatch(/Lushen/i);
    expect(getMonsterCatalogInfo(13403)?.name).toMatch(/Lushen/i); // unawakened id resolves to the awakened entry
    expect(getMonsterCatalogInfo(0)).toBeNull();
  });

  it('knows the Swift and Will set ids used in the fixture', () => {
    expect(RUNE_SETS[3]).toBe('Swift');
    expect(RUNE_SETS[15]).toBe('Will');
  });
});

describe('topSpeedRunes (passport card)', () => {
  // A dump whose runes differ in rolled SPD, grind and main stat, so the ordering rules are visible
  const dump = {
    wizard_info: { wizard_name: 'Speedy' },
    unit_list: [
      {
        unit_id: 11, unit_master_id: 13413, class: 6, unit_level: 40, attribute: 3, spd: 103, con: 6000, atk: 900, def: 500,
        runes: [
          rune(1, 4, 3, { subs: [[SPD, 28, 0, 4]] }),                 // rolled 28, grind +4 → still ranks by 28
          rune(2, 2, 3, { pri: [SPD, 42], subs: [[SPD, 12, 0, 0]] }), // slot-2 SPD main 42, rolled 12
          rune(3, 6, 15, { subs: [[SPD, 30, 0, 0]] }),                // rolled 30, no grind
        ],
      },
    ],
    runes: [
      rune(4, 1, 13, { prefix: [SPD, 5], subs: [[SPD, 29, 0, 1], [9, 8, 0, 0]] }), // in storage: innate 5, rolled 29, grind 1
      rune(5, 3, 13, { subs: [[9, 20, 0, 0]] }),                                    // no SPD sub → excluded
    ],
  };

  it('ranks by the SPD substat as rolled and keeps grind / main / innate apart', () => {
    const top = topSpeedRunes(dump, 8);
    expect(top.map((r) => r.id)).toEqual([3, 4, 1, 2]);
    expect(top[0]).toMatchObject({ set: 'Will', slot: 6, spdSub: 30, spdGrind: 0, mainSpd: 0, innateSpd: 0 });
    expect(top[0].monster?.name).toMatch(/Lushen/i);
    expect(top[1]).toMatchObject({ spdSub: 29, spdGrind: 1, innateSpd: 5, monster: null }); // unequipped, +4 grind never summed
    expect(top[2]).toMatchObject({ spdSub: 28, spdGrind: 4 });
    expect(top[3]).toMatchObject({ spdSub: 12, mainSpd: 42 }); // a SPD main does not make a "fast rune"
  });

  it('is limited, deduplicated by rune id and works on the stored compact box too', () => {
    expect(topSpeedRunes(dump, 2).map((r) => r.id)).toEqual([3, 4]);
    const compact = parseSwexExport(dump);
    expect(topSpeedRunes(compact, 8).map((r) => r.spdSub)).toEqual([30, 29, 28, 12]);
    expect(topSpeedRunes(null)).toEqual([]);
  });
});
