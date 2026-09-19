// Which contributor's snapshot the shared guild leaderboard shows (api/_lib/guildRankings.js).
import { describe, it, expect } from 'vitest';
import { pickBoards, agreement, snapshotId } from '../api/_lib/guildRankings.js';

const NOW = Date.parse('2026-09-19T10:00:00Z');
const at = (hoursAgo) => new Date(NOW - hoursAgo * 3600e3).toISOString();
const rowsFrom = (names) => names.map((name, i) => ({ rank: i + 1, name, points: 1000 - i }));
const HONEST = rowsFrom(['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel', 'India', 'Juliet', 'Kilo']);
// same guilds, slightly different order and one substitution in the top 10
const HONEST2 = rowsFrom(['Alpha', 'Charlie', 'Bravo', 'Delta', 'Echo', 'Foxtrot', 'Hotel', 'Golf', 'India', 'Lima', 'Kilo']);
const FAKE = rowsFrom(['MyGuild', 'Bravo', 'Zulu', 'Yankee', 'Xray', 'Whiskey', 'Victor', 'Uniform', 'Tango', 'Sierra']);
const snap = (contributor, rows, hoursAgo, extra = {}) => ({
  id: snapshotId('asia', 'siege', contributor), server: 'asia', kind: 'siege', rows, updated_at: at(hoursAgo), contributor, note: null, ...extra,
});
const lists = (trusted = [], blocked = []) => ({ trusted: new Set(trusted), blocked: new Set(blocked) });

describe('agreement', () => {
  it('compares the top-10 guild names case-insensitively', () => {
    expect(agreement(HONEST, HONEST2)).toBeCloseTo(0.9);
    expect(agreement(HONEST, FAKE)).toBeCloseTo(0.1);
    expect(agreement(rowsFrom(['a', 'B']), rowsFrom(['b', 'A']))).toBe(1);
  });
  it('is 0 for an empty snapshot', () => {
    expect(agreement([], HONEST)).toBe(0);
  });
});

describe('pickBoards', () => {
  it('shows a lone contributor but flags it unverified', () => {
    const [b] = pickBoards([snap('u1', HONEST, 1)], lists(), NOW);
    expect(b).toMatchObject({ server: 'asia', kind: 'siege', verified: false, sources: 1, contributors: 1 });
    expect(b.rows).toBe(HONEST);
  });

  it('verifies the newest snapshot another contributor agrees with', () => {
    const [b] = pickBoards([snap('u1', HONEST, 5), snap('u2', HONEST2, 1)], lists(), NOW);
    expect(b.rows).toBe(HONEST2);
    expect(b).toMatchObject({ verified: true, sources: 2 });
  });

  it('outvotes a vandal who posted last', () => {
    const [b] = pickBoards([snap('u1', HONEST, 5), snap('u2', HONEST2, 3), snap('vandal', FAKE, 0.1)], lists(), NOW);
    expect(b.rows).toBe(HONEST2);
    expect(b).toMatchObject({ verified: true, contributors: 3 });
  });

  it('falls back to the newest snapshot, unverified, when nobody agrees', () => {
    const [b] = pickBoards([snap('u1', HONEST, 5), snap('vandal', FAKE, 0.1)], lists(), NOW);
    expect(b.rows).toBe(FAKE);
    expect(b).toMatchObject({ verified: false, sources: 1 });
  });

  it('prefers a trusted contributor even when a newer snapshot exists', () => {
    const [b] = pickBoards([snap('owner', HONEST, 20), snap('vandal', FAKE, 0.1)], lists(['owner']), NOW);
    expect(b.rows).toBe(HONEST);
    expect(b.verified).toBe(true);
  });

  it('ignores blocked contributors, expired snapshots and boards with fewer than 3 rows', () => {
    const boards = pickBoards(
      [snap('vandal', FAKE, 0.1), snap('u1', HONEST, 24 * 40), snap('u2', HONEST2.slice(0, 2), 1)],
      lists([], ['vandal']),
      NOW,
    );
    expect(boards).toEqual([]);
  });

  it('keeps one board per server and kind, newest first', () => {
    const boards = pickBoards([
      snap('u1', HONEST, 3),
      { ...snap('u1', FAKE, 1), id: snapshotId('global', 'wgb', 'u1'), server: 'global', kind: 'wgb' },
    ], lists(), NOW);
    expect(boards.map((b) => `${b.server}:${b.kind}`)).toEqual(['global:wgb', 'asia:siege']);
  });

  it('never lets a contributor overwrite someone else: ids are per contributor', () => {
    expect(snapshotId('asia', 'siege', 'u1')).not.toBe(snapshotId('asia', 'siege', 'u2'));
  });
});
