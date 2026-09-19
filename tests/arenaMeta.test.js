import { describe, it, expect } from 'vitest';
import { matchArenaTeams } from '../src/utils/arenaMatcher.js';
import arenaData from '../src/data/arenaMetaTeams.json' with { type: 'json' };
import allMonsters from '../src/data/allMonsters.json' with { type: 'json' };
import { buildArenaTeams, buildMonsterTraits } from '../scripts/build_arena_teams.mjs';
import { monsterTraits, teamTraits } from '../src/utils/arenaTraits.js';
import { traitsOfName, hasSkill, profileEnemy, matchDefenses, findArenaCounters } from '../src/utils/arenaCounter.js';
import { exportArenaTeamCard } from '../src/utils/cardExporter.js';
import { arenaPrompt } from '../api/_lib/advisor.js';

const names = new Set(allMonsters.map((m) => m.name.toLowerCase()));
const all = [...arenaData.offense, ...arenaData.defense];

describe('arenaMetaTeams.json (generated catalogue)', () => {
  it('is what scripts/build_arena_teams.mjs produces (run it after editing the spec)', () => {
    const fresh = buildArenaTeams();
    expect(arenaData.offense).toEqual(fresh.offense);
    expect(arenaData.defense).toEqual(fresh.defense);
    expect(arenaData.meta.counts).toEqual(fresh.meta.counts);
  });

  it('has a broad catalogue with light/dark variants and unique ids', () => {
    expect(arenaData.offense.length).toBeGreaterThanOrEqual(20);
    expect(arenaData.defense.length).toBeGreaterThanOrEqual(20);
    expect(all.filter((t) => t.ld).length).toBeGreaterThanOrEqual(10);
    expect(new Set(all.map((t) => t.id)).size).toBe(all.length);
  });

  it('only references monsters that exist in the encyclopedia (slots and swaps)', () => {
    for (const t of all) {
      expect(t.slots).toHaveLength(4);
      for (const s of t.slots) expect(names.has(s.toLowerCase()), `${t.id}: ${s}`).toBe(true);
      for (const [slot, alts] of Object.entries(t.swaps)) {
        expect(t.slots).toContain(slot);
        for (const a of alts) expect(names.has(a.toLowerCase()), `${t.id}: swap ${a}`).toBe(true);
      }
    }
  });

  it('derives the ld flag from the catalogue elements', () => {
    const el = new Map(allMonsters.map((m) => [m.name.toLowerCase(), m.element]));
    for (const t of all) {
      const ld = t.slots.filter((s) => ['light', 'dark'].includes(el.get(s.toLowerCase())));
      expect(t.ld).toBe(ld.length > 0);
      expect([...new Set(ld)].sort()).toEqual([...t.ldMembers].sort());
    }
    expect(arenaData.offense.find((t) => t.id === 'ao-giana-galleon-lushen-lushen').ldMembers).toEqual(['Giana']);
    expect(arenaData.offense.find((t) => t.id === 'ao-zaiross-tiana-galleon-kaki').ld).toBe(false);
  });

  it('takes leader text from the skill database and flags leads that do nothing in arena', () => {
    const oberon = arenaData.offense.find((t) => t.id === 'ao-oberon-tiana-galleon-lushen');
    expect(oberon.leader).toBe('Oberon — ATK +44% (อารีน่า)');
    expect(oberon.leaderArena).toBe(true);
    const bernard = arenaData.offense.find((t) => t.id === 'ao-bernard-galleon-lushen-lushen');
    expect(bernard.leader).toBe('Bernard — ATK +30% (เฉพาะธาตุลม)');
    // Every catalogue leader has been placed in slot 0 so that its lead works in arena
    for (const t of all) expect(t.leaderArena, t.id).toBe(true);
  });

  it('carries no invented statistics: qualitative labels only', () => {
    for (const t of all) {
      expect(t.source).toBe('community');
      expect(['S', 'A', 'B']).toContain(t.tier);
      expect(t).not.toHaveProperty('avgClearTime');
      expect(t).not.toHaveProperty('winRate');
      expect(t).not.toHaveProperty('difficulty');
    }
    for (const t of arenaData.offense) {
      expect(t.turnOrder.length).toBe(4);
      expect(t.runeGuidance).toBeTruthy();
      expect(t.speed).toBeTruthy();
    }
    for (const t of arenaData.defense) {
      expect(t.winCondition).toBeTruthy();
      expect(t.runeBuilds).toBeTruthy();
      expect(t.counterTips).toBeTruthy();
    }
  });
});

describe('arenaMatcher', () => {
  it('returns the catalogue in order, unowned, when there is no box', () => {
    const result = matchArenaTeams(null);
    expect(result.summary.hasBox).toBe(false);
    expect(result.summary.totalAo).toBe(arenaData.offense.length);
    expect(result.summary.totalAd).toBe(arenaData.defense.length);
    expect(result.offense.map((t) => t.id)).toEqual(arenaData.offense.map((t) => t.id));
    for (const team of result.offense) {
      expect(team.slots).toHaveLength(4);
      expect(team.isComplete).toBe(false);
      expect(team.statusLabel).toBe('สูตรคอมมูนิตี้');
      expect(team.slots.every((s) => s.avatarUrl)).toBe(true);
    }
  });

  it('marks a team complete only when every slot is owned (raw dump format)', () => {
    // com2us ids from allMonsters.json: Zaiross 14412, Tiana 18913, Galleon 19411, Kaki 25112
    const raw = {
      unit_list: [
        { unit_id: 1, unit_master_id: 14412, attribute: 2, class: 6 },
        { unit_id: 2, unit_master_id: 18913, attribute: 3, class: 6 },
        { unit_id: 3, unit_master_id: 19411, attribute: 1, class: 6 },
        { unit_id: 4, unit_master_id: 25112, attribute: 2, class: 6 },
      ],
    };
    const result = matchArenaTeams(raw);
    expect(result.summary.hasBox).toBe(true);
    const team = result.offense.find((t) => t.id === 'ao-zaiross-tiana-galleon-kaki');
    expect(team.slots.map((s) => s.name)).toEqual(['Zaiross', 'Tiana', 'Galleon', 'Kaki']);
    expect(team.isComplete).toBe(true);
    expect(team.ownedCount).toBe(4);
    expect(team.statusLabel).toBe('พร้อมรบ (ครบ 4 ตัว)');
    // Complete teams sort to the front
    expect(result.offense[0].isComplete).toBe(true);
    const lushen = result.offense.find((t) => t.id === 'ao-zaiross-tiana-galleon-lushen');
    expect(lushen.isComplete).toBe(false);
    expect(lushen.missingMonsters).toEqual(['Lushen']);
  });

  it('needs two Lushens for a "Lushen ×2" team and reports owned swaps (compact format)', () => {
    const one = { units: [
      { uid: 1, masterId: 11533, name: 'Bernard', stars: 6 },
      { uid: 2, masterId: 19411, name: 'Galleon', stars: 6 },
      { uid: 3, masterId: 13413, name: 'Lushen', stars: 6 },
      { uid: 4, masterId: 25112, name: 'Kaki', stars: 6 },
    ] };
    const r1 = matchArenaTeams(one);
    const t1 = r1.offense.find((t) => t.id === 'ao-bernard-galleon-lushen-lushen');
    expect(t1.ownedCount).toBe(3);
    expect(t1.missingMonsters).toEqual(['Lushen']);
    expect(t1.isComplete).toBe(false);
    // That team lists swaps only for Bernard/Galleon, so a missing Lushen has no alternative
    expect(t1.swapOptions).toEqual([{ slot: 'Lushen', alts: [] }]);
    expect(t1.readyWithSwaps).toBe(false);

    // Leo team: Lushen ×2 missing one, but Kaki is a listed swap for Lushen and is owned
    const leoBox = { units: [
      { uid: 1, masterId: 16613, name: 'Leo', stars: 6 },
      { uid: 2, masterId: 19411, name: 'Galleon', stars: 6 },
      { uid: 3, masterId: 13413, name: 'Lushen', stars: 6 },
      { uid: 4, masterId: 25112, name: 'Kaki', stars: 6 },
    ] };
    const r2 = matchArenaTeams(leoBox);
    const leo = r2.offense.find((t) => t.id === 'ao-leo-galleon-lushen-lushen');
    expect(leo.ownedCount).toBe(3);
    expect(leo.readyWithSwaps).toBe(true);
    expect(leo.statusLabel).toBe('พร้อมรบ (ใช้ตัวแทน)');
    expect(leo.swapOptions[0].alts.find((a) => a.name === 'Kaki').owned).toBe(true);
    expect(r2.summary.swapAo).toBeGreaterThanOrEqual(1);

    const two = { units: [...one.units, { uid: 5, masterId: 13413, name: 'Lushen', stars: 6 }] };
    const r3 = matchArenaTeams(two);
    const t3 = r3.offense.find((t) => t.id === 'ao-bernard-galleon-lushen-lushen');
    expect(t3.isComplete).toBe(true);
    expect(r3.summary.readyAo).toBeGreaterThanOrEqual(1);
  });
});

describe('arenaTraits', () => {
  it('identifies special passive mechanics like Leo antiSpeed', () => {
    expect(monsterTraits({ name: 'Leo', ls: null, sk: [] })).toEqual(['antiSpeed']);
  });

  it('restricts leader traits to slot 0', () => {
    const traitsOf = (name) => (name === 'Psamathe' ? ['cc', 'revive', 'speedLead'] : ['atb', 'cc']);
    // Psamathe in slot 0 gives speedLead
    expect(teamTraits(['Psamathe', 'Clara', 'Savannah', 'Kaki'], traitsOf)).toContain('speedLead');
    // Psamathe in slot 1 does not give speedLead
    expect(teamTraits(['Clara', 'Psamathe', 'Savannah', 'Kaki'], traitsOf)).not.toContain('speedLead');
  });

  it('buildMonsterTraits covers all catalogue monsters with skill records', () => {
    const traits = buildMonsterTraits();
    expect(Object.keys(traits).length).toBe(940);
    expect(traits.Galleon).toBeDefined();
    expect(traits.Bernard).toBeDefined();
    expect(traits.Leo).toContain('antiSpeed');
  });
});

describe('arenaCounter', () => {
  it('looks up traits and skill presence with slash support', () => {
    expect(hasSkill('Psamathe')).toBe(true);
    expect(hasSkill('Galleon')).toBe(true);
    expect(hasSkill('Adriana')).toBe(true);
    expect(hasSkill('Pure Vanilla Cookie')).toBe(true);
    expect(hasSkill('UnknownImaginaryMon')).toBe(false);

    expect(traitsOfName('Psamathe')).toContain('speedLead');
    expect(traitsOfName('Adriana')).toEqual(traitsOfName('Adriana / Pure Vanilla Cookie'));
  });

  it('profiles enemy defenses with correct leader, chips, and unknown flags', () => {
    const profile = profileEnemy(['Psamathe', 'Clara', 'Savannah', 'Kaki']);
    expect(profile.leader).toBe('Psamathe');
    expect(profile.flags.speedLead).toBe(true);
    expect(profile.groups.cc.length).toBeGreaterThanOrEqual(1);
    expect(profile.unknown).toHaveLength(0);
    expect(profile.chips.some((c) => c.key === 'speedLead')).toBe(true);

    const withUnknown = profileEnemy(['Psamathe', 'GhostyNonExistentMon']);
    expect(withUnknown.unknown).toEqual(['GhostyNonExistentMon']);
  });

  it('matches catalogue defenses based on overlap and handles slash aliases', () => {
    const matchedExact = matchDefenses(['Psamathe', 'Clara', 'Savannah', 'Byungchul']);
    expect(matchedExact.length).toBeGreaterThan(0);
    expect(matchedExact[0].overlap).toBe(4);
    expect(matchedExact[0].team.id).toBe('ad-psamathe-clara-savannah-byungchul');

    // 3/4 relative match
    const matchedVariant = matchDefenses(['Psamathe', 'Clara', 'Savannah', 'Kaki']);
    expect(matchedVariant[0].overlap).toBe(3);
    expect(matchedVariant[0].team.id).toBe('ad-psamathe-clara-savannah-byungchul');
  });

  it('finds and ranks counters against enemy mechanics', () => {
    const result = findArenaCounters(['Psamathe', 'Clara', 'Savannah', 'Kaki']);
    expect(result.results.length).toBe(arenaData.offense.length);

    // Leo teams or SPD lead teams score high against Psamathe speed lead
    const top = result.results.slice(0, 5);
    const hasLeoOrFast = top.some((t) => t.caps.includes('antiSpeed') || t.caps.includes('speedLead'));
    expect(hasLeoOrFast).toBe(true);

    // Structured counters should have recommended = true
    const recommended = result.results.filter((t) => t.recommended);
    expect(recommended.length).toBeGreaterThanOrEqual(1);
    expect(recommended[0].reasons.some((r) => r.includes('สูตรแก้ที่ระบุไว้'))).toBe(true);
  });
});

describe('cardExporter', () => {
  it('exports exportArenaTeamCard function', () => {
    expect(typeof exportArenaTeamCard).toBe('function');
  });
});

describe('arenaPrompt (AI Grounded Advisor)', () => {
  it('generates grounded prompt with facts, counter candidates, and guidelines', () => {
    const prompt = arenaPrompt({
      defense: {
        leader: 'Psamathe',
        monsters: ['Psamathe', 'Clara', 'Savannah', 'Kaki'],
      },
      counters: [
        {
          name: 'Leo Cleave',
          nameTh: 'ลีโอ กวาดล้าง',
          archetype: 'Anti-Speed Cleave',
          slots: ['Leo', 'Megan', 'Lushen', 'Lushen'],
          leader: 'Lushen',
          turnOrder: ['Leo', 'Megan', 'Lushen', 'Lushen'],
          runeGuidance: 'Leo (Vampire) -> Megan (Swift) -> 2x Lushen (Fatal/Blade)',
          isComplete: true,
        },
      ],
      userBox: ['Leo', 'Lushen', 'Megan', 'Galleon', 'Tiana'],
    });

    expect(prompt).toContain('Psamathe');
    expect(prompt).toContain('Savannah');
    expect(prompt).toContain('ลีโอ กวาดล้าง');
    expect(prompt).toContain('Anti-Speed Cleave');
    expect(prompt).toContain('Leo (Vampire)');
    expect(prompt).toContain('มอนสเตอร์เด่นในไอดีผู้ใช้: Leo, Lushen, Megan, Galleon, Tiana');
    expect(prompt).toContain('ลำดับเทิร์น (Turn Order)');
    expect(prompt).toContain('ล็อกเป้าหมายแรก (First Focus Target)');
  });

  it('handles guest mode with no userBox gracefully', () => {
    const prompt = arenaPrompt({
      defense: {
        leader: 'Vanessa',
        monsters: ['Vanessa', 'Camilla', 'Byungchul', 'Triana'],
      },
      counters: [],
    });

    expect(prompt).toContain('Vanessa');
    expect(prompt).toContain('Camilla');
    expect(prompt).toContain('(ไม่มีสูตรในระบบ)');
    expect(prompt).not.toContain('มอนสเตอร์เด่นในไอดีผู้ใช้');
  });
});

