// Live data layer: /api/live/<key> routing, code submissions, and the client-side document unwrap.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { unwrap } from '../src/services/liveData.js';

const db = vi.hoisted(() => ({ live: new Map(), submissions: [], subs: [] }));
vi.mock('../api/_lib/liveData.js', async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    getLive: async (key) => (db.live.has(key) ? { ok: true, key, value: db.live.get(key), updatedAt: '2026-09-20T10:00:00.000Z' } : { ok: false, error: /^[a-z0-9-]{2,40}$/.test(key) ? 'NOT_FOUND' : 'BAD_KEY' }),
    submitCode: async ({ code, note, ip }) => {
      const norm = mod.normalizeCode(code);
      if (!norm) return { ok: false, status: 400, error: 'bad code' };
      db.subs.push({ code: norm, note, ip });
      return { ok: true, status: 200, code: norm };
    },
  };
});
const { handleLive } = await import('../api/live/[key].js');
const { normalizeCode } = await import('../api/_lib/liveData.js');

describe('normalizeCode', () => {
  it('upper-cases, strips spaces and rejects anything that is not a redeem code', () => {
    expect(normalizeCode(' sw2026 gift ')).toBe('SW2026GIFT');
    expect(normalizeCode('abc')).toBeNull();
    expect(normalizeCode('DROP TABLE;')).toBeNull();
    expect(normalizeCode('')).toBeNull();
  });
});

describe('handleLive', () => {
  beforeEach(() => { db.live.clear(); db.subs.length = 0; });

  it('serves a document with edge caching and 404s an unknown key', async () => {
    db.live.set('rta-cutoffs', { season: 38, _hash: 'abc' });
    const ok = await handleLive({ key: 'rta-cutoffs', method: 'GET' });
    expect(ok.status).toBe(200);
    expect(ok.json).toMatchObject({ key: 'rta-cutoffs', value: { season: 38 }, updatedAt: '2026-09-20T10:00:00.000Z' });
    expect(ok.cache).toMatch(/s-maxage=300/);
    const missing = await handleLive({ key: 'nope', method: 'GET' });
    expect(missing.status).toBe(404);
    expect((await handleLive({ key: 'Bad Key!', method: 'GET' })).status).toBe(400);
  });

  it('accepts a code submission only on the submit-code path', async () => {
    const r = await handleLive({ key: 'submit-code', method: 'POST', body: { code: 'sw2026gift', note: 'energy' }, ip: '1.2.3.4' });
    expect(r.status).toBe(200);
    expect(r.json).toMatchObject({ ok: true, code: 'SW2026GIFT' });
    expect(db.subs[0]).toMatchObject({ code: 'SW2026GIFT', ip: '1.2.3.4' });
    expect((await handleLive({ key: 'codes', method: 'POST', body: { code: 'X' } })).status).toBe(404);
    expect((await handleLive({ key: 'submit-code', method: 'POST', body: { code: '!' } })).status).toBe(400);
  });
});

describe('unwrap (browser side)', () => {
  it('drops the publisher hash and unwraps { items } arrays', () => {
    expect(unwrap({ season: 38, tiers: {}, _hash: 'x' })).toEqual({ season: 38, tiers: {} });
    expect(unwrap({ items: [1, 2], _hash: 'x' })).toEqual([1, 2]);
    expect(unwrap({ codes: [], updatedAt: 't', _hash: 'x' })).toEqual({ codes: [], updatedAt: 't' });
    expect(unwrap(null)).toBeNull();
  });
});
