// Guild / siege packets → war-room state (src/utils/siegeLive.js). Shapes are matched by field
// name, so the fixtures nest things differently from each other on purpose. When the first real
// packets arrive (HANDOFF §7) adjust these fixtures to the real field names.
import { describe, it, expect } from 'vitest';
import { parseGuildInfo, parseSiegeMatchup, parseDefenseDecks, parseBattleLogs, applyLiveToWar } from '../src/utils/siegeLive.js';

const nameOf = (id) => ({ 13413: 'Lushen', 19215: 'Veromos', 15105: 'Rakan' }[id] || `#${id}`);
const unit = (id) => ({ unit_master_id: id, unit_id: id * 10 });

const GUILD_INFO = { command: 'GetGuildInfo', at: 1, resp: { guild: {
  guild_info: { guild_id: 77, name: 'SWM Guild', level: 20 },
  guild_members: { 101: { wizard_id: 101, wizard_name: 'Leader', grade: 1, last_login_timestamp: 1_700_000_000 }, 102: { wizard_id: 102, wizard_name: 'Vice', grade: 2 }, 103: { wizard_id: 103, wizard_name: 'Member', grade: 3 } },
} } };

const MATCHUP = { command: 'GetGuildSiegeMatchupInfo', at: 2, resp: {
  match_info: { match_id: 555, match_status: 2, siege_start_time: 1_700_000_000, siege_end_time: 1_700_086_400 },
  guild_list: [{ guild_id: 77, guild_name: 'SWM Guild', siege_point: 120 }, { guild_id: 88, guild_name: 'Red Team', siege_point: 300 }, { guild_id: 99, guild_name: 'Yellow Team', siege_point: 90 }],
  base_list: [
    { base_number: 1, guild_id: 77, base_status: 1, remain_deck_count: 5 },
    { base_number: 2, guild_id: 88, base_status: 1, protect_time: 4_102_444_800 }, // protected far in the future
    { base_number: 3, guild_id: null },
  ],
} };

describe('parseGuildInfo', () => {
  it('reads guild and members from an object-of-objects', () => {
    const g = parseGuildInfo(GUILD_INFO);
    expect(g).toMatchObject({ id: 77, name: 'SWM Guild', level: 20 });
    expect(g.members.map((m) => [m.name, m.role])).toEqual([['Leader', 'Leader'], ['Vice', 'Vice'], ['Member', 'Member']]);
    expect(g.members[0].lastLogin).toBe(1_700_000_000_000); // seconds → ms
  });
  it('returns null without a guild block', () => {
    expect(parseGuildInfo({ resp: {} })).toBeNull();
    expect(parseGuildInfo(undefined)).toBeNull();
  });
});

describe('parseSiegeMatchup', () => {
  it('colours our guild blue and the others red/yellow, and maps bases', () => {
    const m = parseSiegeMatchup(MATCHUP, 77);
    expect(m.guilds.map((g) => [g.name, g.colour, g.points])).toEqual([['SWM Guild', 'blue', 120], ['Red Team', 'red', 300], ['Yellow Team', 'yellow', 90]]);
    expect(m.bases[0]).toMatchObject({ number: 1, guildId: 77, colour: 'blue', remaining: 5 });
    expect(m.bases[1].colour).toBe('red');
    expect(m.bases[1].protectedUntil).toBe(4_102_444_800_000);
    expect(m.bases[2]).toMatchObject({ number: 3, guildId: null, colour: null });
    expect(m).toMatchObject({ matchId: 555, matchStatus: 2, startAt: 1_700_000_000_000, endAt: 1_700_086_400_000 });
  });
  it('falls back to the first guild as ours when no id is known', () => {
    const m = parseSiegeMatchup(MATCHUP);
    expect(m.guilds[0].colour).toBe('blue');
  });
});

describe('parseDefenseDecks', () => {
  it('groups three-monster decks by base number', () => {
    const packet = { resp: { deck_list: [
      { base_number: 4, pos_id: 1, wizard_name: 'Leader', unit_list: [unit(13413), unit(19215), unit(15105)] },
      { base_number: 4, pos_id: 2, wizard_name: 'Vice', unit_list: [unit(15105), unit(15105), unit(15105)] },
      { base_number: 5, pos_id: 1, unit_list: [unit(13413)] },
    ] } };
    const decks = parseDefenseDecks(packet, nameOf);
    expect(Object.keys(decks)).toEqual(['4', '5']);
    expect(decks[4][0]).toMatchObject({ ids: [13413, 19215, 15105], names: ['Lushen', 'Veromos', 'Rakan'], owner: 'Leader', pos: 1 });
    expect(decks[5][0].names).toEqual(['Lushen']);
  });
  it('uses the request base number when decks do not carry one', () => {
    const packet = { req: { base_number: 9 }, resp: { list: [{ deck_id: 1, units: [unit(13413), unit(19215), unit(15105)] }] } };
    expect(Object.keys(parseDefenseDecks(packet, nameOf))).toEqual(['9']);
  });
});

describe('parseBattleLogs', () => {
  it('turns log rows into readable Thai lines with win/loss', () => {
    const packet = { at: 5, resp: { log_list: [
      { win_lose: 1, base_number: 2, attack_wizard_name: 'Leader', defense_wizard_name: 'Enemy', battle_time: 1_700_000_000, attack_unit_list: [unit(13413)], defense_unit_list: [unit(19215)] },
      { win_lose: 2, base_number: 3, wizard_name: 'Vice' },
    ] } };
    const logs = parseBattleLogs(packet, nameOf);
    expect(logs).toHaveLength(2);
    expect(logs[0]).toMatchObject({ type: 'win', at: 1_700_000_000_000 });
    expect(logs[0].text).toContain('Leader ชนะ ป้อม 2');
    expect(logs[0].text).toContain('ตั้งรับ: Enemy');
    expect(logs[0].text).toContain('ทีม Lushen');
    expect(logs[1].type).toBe('loss');
    expect(logs[1].text).toContain('Vice แพ้ ป้อม 3');
  });
  it('treats a bare battle result as our own attack', () => {
    const logs = parseBattleLogs({ req: { base_number: 7 }, at: 9, resp: { win_lose: 1 } }, nameOf);
    expect(logs[0].text).toContain('คุณ ชนะ ป้อม 7');
  });
});

describe('applyLiveToWar', () => {
  const demo = {
    guildName: 'Demo', round: 'demo', currentScore: { blue: 999, red: 999, yellow: 999 },
    members: [{ name: 'Leader', swordsLeft: 12, win: 3, loss: 1 }, { name: 'DemoOnly', swordsLeft: 30 }],
    bases: [{ id: 1, guild: 'yellow', defenses: [{ monsters: ['Demo'] }], status: 'active' }, { id: 2, guild: 'yellow', defenses: [], status: 'active' }],
    logs: [{ id: 'demo-1', at: 0, text: 'demo' }],
  };

  it('returns the previous state untouched when no packets arrived', () => {
    expect(applyLiveToWar(demo, { packets: {} }, nameOf)).toBe(demo);
  });

  it('drops the demo seed on the first live packet but keeps per-member counters', () => {
    const war = applyLiveToWar(demo, { packets: { GetGuildInfo: GUILD_INFO, GetGuildSiegeMatchupInfo: MATCHUP } }, nameOf, 'Leader');
    expect(war.live.commands.map((c) => c.command)).toEqual(['GetGuildSiegeMatchupInfo', 'GetGuildInfo']); // newest first
    expect(war.guildName).toBe('SWM Guild');
    expect(war.myPlayerName).toBe('Leader');
    expect(war.logs).toEqual([]);                       // demo logs gone
    expect(war.members.map((m) => m.name)).toEqual(['Leader', 'Vice', 'Member']); // demo-only member gone
    expect(war.members[0]).toMatchObject({ swordsLeft: 30, win: 0, loss: 0 });    // demo counters not carried into a fresh live state
    expect(war.currentScore).toEqual({ blue: 120, red: 300, yellow: 90 });
    expect(war.guildNames).toEqual({ blue: 'SWM Guild', red: 'Red Team', yellow: 'Yellow Team' });
    expect(war.bases[0]).toMatchObject({ id: 1, guild: 'blue', remaining: 5, defenses: [] });
    expect(war.bases[1]).toMatchObject({ id: 2, guild: 'red', status: 'protected' });
    expect(war.round).toContain('Siege #555');
  });

  it('keeps manual edits once live, and merges decks and logs on later packets', () => {
    const first = applyLiveToWar(demo, { packets: { GetGuildInfo: GUILD_INFO } }, nameOf);
    const edited = { ...first, members: first.members.map((m) => (m.name === 'Vice' ? { ...m, swordsLeft: 3, win: 7 } : m)) };
    const later = applyLiveToWar(edited, { packets: {
      GetGuildInfo: GUILD_INFO,
      GetGuildSiegeBaseDefenseUnitList: { at: 3, resp: { deck_list: [{ base_number: 1, pos_id: 1, wizard_name: 'Vice', unit_list: [unit(13413), unit(19215), unit(15105)] }] } },
      GetGuildSiegeBattleLog: { at: 4, resp: { log_list: [{ win_lose: 1, base_number: 1, attack_wizard_name: 'Leader', battle_time: 1_700_000_000 }] } },
    } }, nameOf);
    expect(later.members.find((m) => m.name === 'Vice')).toMatchObject({ swordsLeft: 3, win: 7 });
    expect(later.bases[0].defenses[0]).toMatchObject({ monsters: ['Lushen', 'Veromos', 'Rakan'], owner: 'Vice', status: 'alive' });
    expect(later.bases[0]).toMatchObject({ remaining: 1, max: 1 });
    expect(later.logs).toHaveLength(1);
    expect(later.logs[0].type).toBe('win');
  });
});
