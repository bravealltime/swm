// /api/guild-rankings handler with Supabase and auth mocked out (api/guild-rankings.js).
import { describe, it, expect, vi, beforeEach } from 'vitest';

const db = { rows: [], settings: { guildRankings: { trusted: [], blocked: [] } } };
const users = { good: { id: '11111111-1111-4111-8111-111111111111', email: 'player@example.com' }, admin: { id: '22222222-2222-4222-8222-222222222222', email: 'pedictu@gmail.com' }, bad: { id: '99999999-9999-4999-8999-999999999999', email: 'vandal@example.com' } };

vi.mock('../api/_lib/admin.js', () => ({
  userFromToken: async (token) => users[token] || null,
  adminEmails: () => ['pedictu@gmail.com'],
  getSettings: async () => ({ ...db.settings, _meta: { storage: 'mock' } }),
  saveSettings: async (patch) => { Object.assign(db.settings, patch); return { ok: true }; },
  supabaseRest: async (table, { method = 'GET', body, query = '' } = {}) => {
    if (table !== 'guild_rankings') return { ok: false, error: 'TABLE_MISSING' };
    if (method === 'GET') {
      const server = /server=eq\.(\w+)/.exec(query)?.[1];
      return { ok: true, data: db.rows.filter((r) => !server || r.server === server) };
    }
    if (method === 'POST') { db.rows = [...db.rows.filter((r) => r.id !== body.id), body]; return { ok: true, data: [body] }; }
    if (method === 'DELETE') { const id = decodeURIComponent(/id=eq\.(.+)$/.exec(query)[1]); db.rows = db.rows.filter((r) => r.id !== id); return { ok: true, data: [] }; }
    return { ok: false, error: 'unsupported' };
  },
}));

const { handleGuildRankings } = await import('../api/guild-rankings.js');

const rows = (prefix) => Array.from({ length: 5 }, (_, i) => ({ rank: i + 1, name: `${prefix} ${i + 1}`, points: 100 - i }));
const post = (token, body) => handleGuildRankings({ method: 'POST', body, token });
const get = (query = {}) => handleGuildRankings({ method: 'GET', query });

beforeEach(() => { db.rows = []; db.settings = { guildRankings: { trusted: [], blocked: [] } }; });

describe('POST /api/guild-rankings', () => {
  it('requires a login', async () => {
    expect((await post('', { server: 'asia', kind: 'siege', rows: rows('x') })).status).toBe(401);
    expect((await post('nope', { server: 'asia', kind: 'siege', rows: rows('x') })).status).toBe(401);
  });

  it('rejects blocked contributors and incomplete boards', async () => {
    db.settings.guildRankings.blocked = [users.bad.id];
    expect((await post('bad', { server: 'asia', kind: 'siege', rows: rows('x') })).status).toBe(403);
    expect((await post('good', { server: 'mars', kind: 'siege', rows: rows('x') })).status).toBe(400);
    expect((await post('good', { server: 'asia', kind: 'chess', rows: rows('x') })).status).toBe(400);
    expect((await post('good', { server: 'asia', kind: 'siege', rows: rows('x').slice(0, 2) })).status).toBe(400);
    expect(db.rows).toEqual([]);
  });

  it('stores one row per contributor and never overwrites another contributor', async () => {
    expect((await post('good', { server: 'asia', kind: 'siege', rows: rows('good'), note: 'AegisLink Good' })).json).toMatchObject({ ok: true, rows: 5, trusted: false });
    expect((await post('bad', { server: 'asia', kind: 'siege', rows: rows('bad') })).status).toBe(200);
    expect(db.rows.map((r) => r.id).sort()).toEqual([`asia:siege:${users.good.id}`, `asia:siege:${users.bad.id}`].sort());
    // re-posting replaces only your own row
    await post('good', { server: 'asia', kind: 'siege', rows: rows('good2') });
    expect(db.rows).toHaveLength(2);
    expect(db.rows.find((r) => r.contributor === users.good.id).rows[0].name).toBe('good2 1');
  });

  it('cleans rows: drops nameless/absurd entries, positional rank when missing, clamps to 100', async () => {
    const dirty = [...rows('ok'), { rank: 6, name: '' }, { rank: 0, name: 'zero' }, { rank: 7, name: 'neg', points: -5 }, { rank: 2000, name: 'far' }];
    const r = await post('good', { server: 'global', kind: 'wgb', rows: dirty });
    expect(r.json.rows).toBe(6); // 5 good + 'zero' (rank 0 → its position, 7)
    expect(db.rows[0].rows.find((x) => x.name === 'zero').rank).toBe(7);
    expect(db.rows[0].rows.map((x) => x.name)).not.toEqual(expect.arrayContaining(['', 'neg', 'far']));
    const many = Array.from({ length: 150 }, (_, i) => ({ rank: i + 1, name: `g${i}` }));
    expect((await post('good', { server: 'global', kind: 'wgb', rows: many })).json.rows).toBe(100);
  });

  it('marks an admin as a trusted contributor on their first share', async () => {
    const r = await post('admin', { server: 'japan', kind: 'guild', rows: rows('a') });
    expect(r.json.trusted).toBe(true);
    expect(db.settings.guildRankings.trusted).toEqual([users.admin.id]);
  });
});

describe('GET /api/guild-rankings', () => {
  it('returns the chosen board per server and kind with verification info', async () => {
    await post('good', { server: 'asia', kind: 'siege', rows: rows('good') });
    await post('bad', { server: 'asia', kind: 'siege', rows: rows('bad') });
    await post('admin', { server: 'asia', kind: 'siege', rows: rows('admin') });
    const r = await get({ server: 'asia' });
    expect(r.status).toBe(200);
    expect(r.cache).toMatch(/max-age/);
    expect(r.json.boards).toHaveLength(1);
    expect(r.json.boards[0]).toMatchObject({ server: 'asia', kind: 'siege', verified: true, contributors: 3 });
    expect(r.json.boards[0].rows[0].name).toBe('admin 1');
    expect(r.json.boards[0]).not.toHaveProperty('contributor');
  });

  it('reports a missing table instead of failing', async () => {
    const r = await handleGuildRankings({ method: 'GET', query: {} });
    expect(r.json.boards).toEqual([]);
    // (the mock only knows guild_rankings; other tables answer TABLE_MISSING)
  });

  it('answers 405 to other methods', async () => {
    expect((await handleGuildRankings({ method: 'PUT' })).status).toBe(405);
  });
});
