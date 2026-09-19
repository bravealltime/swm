// In-game ranking packets → rows (src/utils/guildRankings.js). The parser matches by field
// name because Com2uS payloads differ between game versions, so these fixtures deliberately
// use different shapes.
import { describe, it, expect } from 'vitest';
import { parseRankingPacket, serverFromCountry, kindFromCommand } from '../src/utils/guildRankings.js';

describe('serverFromCountry', () => {
  it('maps country codes to game servers, global by default', () => {
    expect(serverFromCountry('TH')).toBe('asia');
    expect(serverFromCountry('kr')).toBe('korea');
    expect(serverFromCountry('JP')).toBe('japan');
    expect(serverFromCountry('DE')).toBe('europe');
    expect(serverFromCountry('US')).toBe('global');
    expect(serverFromCountry(undefined)).toBe('global');
  });
});

describe('kindFromCommand', () => {
  it('tells siege, world guild battle and plain guild screens apart', () => {
    expect(kindFromCommand('GetGuildSiegeRankingInfo')).toBe('siege');
    expect(kindFromCommand('GetServerGuildWarRanking')).toBe('wgb');
    expect(kindFromCommand('GetGuildRankingList')).toBe('guild');
  });
});

describe('parseRankingPacket', () => {
  const guild = (rank, name, points, extra = {}) => ({ guild_rank: rank, guild_name: name, guild_point: points, guild_id: 1000 + rank, ...extra });

  it('returns null for non-ranking commands or empty payloads', () => {
    expect(parseRankingPacket('GetGuildInfo', { list: [guild(1, 'a', 1), guild(2, 'b', 1), guild(3, 'c', 1)] })).toBeNull();
    expect(parseRankingPacket('GetGuildSiegeRankingInfo', null)).toBeNull();
    expect(parseRankingPacket('GetGuildSiegeRankingInfo', { command: 'x', ret_code: 0 })).toBeNull();
  });

  it('finds the guild list wherever it is nested and sorts by rank', () => {
    const resp = {
      ret_code: 0,
      ranking_info: {
        my_rank: 57,
        list: [guild(3, 'Third', 300, { member_count: 30, guild_level: 12 }), guild(1, 'First', 900, { rating: 1500 }), guild(2, 'Second', 600)],
      },
    };
    const rows = parseRankingPacket('GetGuildSiegeRankingInfo', resp);
    expect(rows.map((r) => r.name)).toEqual(['First', 'Second', 'Third']);
    expect(rows[0]).toMatchObject({ rank: 1, points: 900, rating: 1500, guildId: 1001 });
    expect(rows[2]).toMatchObject({ members: 30, level: 12 });
  });

  it('accepts an object-of-objects list and `name`/`score` field names', () => {
    const resp = { rank_list: { a: { rank: 2, name: 'B', score: 10 }, b: { rank: 1, name: 'A', score: 20 }, c: { rank: 3, name: 'C', score: 5 } } };
    const rows = parseRankingPacket('GetServerGuildWarRanking', resp);
    expect(rows.map((r) => r.name)).toEqual(['A', 'B', 'C']);
  });

  it('needs at least three guilds with a name and a numeric rank/points to count as a list', () => {
    expect(parseRankingPacket('GetGuildSiegeRankingInfo', { list: [guild(1, 'a', 1), guild(2, 'b', 1)] })).toBeNull();
    expect(parseRankingPacket('GetGuildSiegeRankingInfo', { list: [{ guild_name: 'a' }, { guild_name: 'b' }, { guild_name: 'c' }] })).toBeNull();
  });

  it('caps at 100 rows and trims long names', () => {
    const list = Array.from({ length: 150 }, (_, i) => guild(i + 1, `G${'x'.repeat(60)}${i}`, 1000 - i));
    const rows = parseRankingPacket('GetGuildSiegeRankingInfo', { list });
    expect(rows).toHaveLength(100);
    expect(rows[0].name.length).toBeLessThanOrEqual(40);
  });
});
