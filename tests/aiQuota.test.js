// Members-only AI coach with a per-day budget (api/_lib/aiQuota.js + api/ai/advise.js).
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { bangkokDay, decideQuota, geoFromHeaders } from '../api/_lib/aiQuota.js';

describe('bangkokDay', () => {
  it('uses the Thai calendar day (UTC+7), not UTC', () => {
    // 2026-09-20 23:30 Bangkok = 16:30Z the same date → the day started at 2026-09-19T17:00Z
    const d = bangkokDay(Date.parse('2026-09-20T16:30:00Z'));
    expect(d.start).toBe('2026-09-19T17:00:00.000Z');
    expect(d.end).toBe('2026-09-20T17:00:00.000Z');
    // 00:30 Bangkok the next day (17:30Z) is already a new day
    expect(bangkokDay(Date.parse('2026-09-20T17:30:00Z')).start).toBe('2026-09-20T17:00:00.000Z');
  });
});

describe('decideQuota', () => {
  it('blocks at the limit and counts whichever of account / IP is higher', () => {
    expect(decideQuota({ byUser: 2, byIp: 0, limit: 3 })).toMatchObject({ allowed: true, used: 2, remaining: 1 });
    expect(decideQuota({ byUser: 0, byIp: 3, limit: 3 })).toMatchObject({ allowed: false, used: 3, remaining: 0 });
    expect(decideQuota({ byUser: 3, byIp: 1, limit: 3 }).allowed).toBe(false);
  });
  it('treats 0 / unlimited as no quota', () => {
    expect(decideQuota({ byUser: 99, byIp: 99, limit: 0 })).toMatchObject({ allowed: true, unlimited: true });
    expect(decideQuota({ byUser: 99, byIp: 99, limit: 3, unlimited: true }).allowed).toBe(true);
  });
});

describe('geoFromHeaders', () => {
  it('reads Vercel geo headers and decodes the city', () => {
    expect(geoFromHeaders({ 'x-vercel-ip-country': 'TH', 'x-vercel-ip-country-region': '10', 'x-vercel-ip-city': 'Bangkok%20Noi', 'x-vercel-ip-timezone': 'Asia/Bangkok' }))
      .toEqual({ country: 'TH', region: '10', city: 'Bangkok Noi', timezone: 'Asia/Bangkok' });
    expect(geoFromHeaders({})).toEqual({ country: null, region: null, city: null, timezone: null });
  });
});

// --- the endpoint's gate, with the model / Supabase mocked -------------------------------------
const model = vi.hoisted(() => ({ fail: null }));
vi.mock('../api/_lib/advisor.js', () => ({ advise: vi.fn(async () => { if (model.fail) throw new Error(model.fail); return { answer: 'ok', model: 'test', usage: { total_tokens: 10 } }; }) }));
vi.mock('../api/_lib/ai.js', () => ({ aiConfig: () => ({ configured: true }), loadEnv: () => {}, isProviderBusy: (err) => /HTTP 429|waiting queue|waiting request|rate limit/i.test(String(err?.message || err || '')) }));
const admin = vi.hoisted(() => ({
  settings: { features: { ai: true }, ai: { requireLogin: true, dailyLimit: 3 } },
  user: null,
  usage: { ok: true, byUser: 0, byIp: 0 },
  logged: [],
  sinceSeen: null,
}));
vi.mock('../api/_lib/admin.js', () => ({
  getSettings: async () => admin.settings,
  userFromToken: async (token) => (token === 'member' ? { id: 'u1', email: 'member@example.com' } : token === 'owner' ? { id: 'u0', email: 'pedictu@gmail.com' } : null),
  adminEmails: () => ['pedictu@gmail.com'],
  aiUsageSince: async ({ since }) => { admin.sinceSeen = since; return admin.usage; },
  logAiCall: async (row) => { admin.logged.push(row); },
  ipHash: (ip) => (ip ? `h-${ip}` : null),
}));
const { handleAdvise } = await import('../api/ai/advise.js');

describe('handleAdvise gate', () => {
  beforeEach(() => { admin.usage = { ok: true, byUser: 0, byIp: 0 }; admin.logged = []; admin.settings.ai = { requireLogin: true, dailyLimit: 3 }; admin.sinceSeen = null; model.fail = null; });

  it('refuses anonymous callers with LOGIN_REQUIRED', async () => {
    const r = await handleAdvise({ body: { kind: 'chat', question: 'x' }, ip: '1.2.3.4', token: '' });
    expect(r.status).toBe(401);
    expect(r.json.code).toBe('LOGIN_REQUIRED');
    expect(admin.logged).toHaveLength(0);
  });

  it('answers a member and reports the remaining quota, logging ip + geo', async () => {
    admin.usage = { ok: true, byUser: 1, byIp: 1 };
    const r = await handleAdvise({ body: { kind: 'chat', question: 'x' }, ip: '1.2.3.4', token: 'member', geo: { country: 'TH', city: 'Bangkok' } });
    expect(r.status).toBe(200);
    expect(r.json.quota).toMatchObject({ used: 2, limit: 3, remaining: 1 });
    expect(admin.logged[0]).toMatchObject({ userId: 'u1', ip: '1.2.3.4', geo: { country: 'TH', city: 'Bangkok' }, ok: true });
  });

  it('blocks the 4th question of the day by account or by IP', async () => {
    admin.usage = { ok: true, byUser: 0, byIp: 3 };
    const r = await handleAdvise({ body: { kind: 'chat', question: 'x' }, ip: '5.6.7.8', token: 'member' });
    expect(r.status).toBe(429);
    expect(r.json.code).toBe('DAILY_LIMIT');
    expect(r.json.quota).toMatchObject({ used: 3, remaining: 0 });
    expect(admin.logged).toHaveLength(0);
  });

  it('never limits the site owner', async () => {
    admin.usage = { ok: true, byUser: 50, byIp: 50 };
    const r = await handleAdvise({ body: { kind: 'chat', question: 'x' }, ip: '9.9.9.9', token: 'owner' });
    expect(r.status).toBe(200);
    expect(r.json.quota.unlimited).toBe(true);
  });

  it('lets anonymous users through only when the admin switches requireLogin off', async () => {
    admin.settings.ai = { requireLogin: false, dailyLimit: 3 };
    const r = await handleAdvise({ body: { kind: 'chat', question: 'x' }, ip: '1.1.1.1', token: '' });
    expect(r.status).toBe(200);
    expect(r.json.authenticated).toBe(false);
  });

  it('counts only answers after a back-office reset for that account, IP or everyone', async () => {
    admin.settings.ai = { requireLogin: true, dailyLimit: 3, resets: { 'u:u1': '2099-01-01T00:00:00.000Z' } };
    await handleAdvise({ body: { kind: 'chat', question: 'x' }, ip: '1.2.3.4', token: 'member' });
    expect(admin.sinceSeen).toBe('2099-01-01T00:00:00.000Z');
    admin.settings.ai = { requireLogin: true, dailyLimit: 3, resets: { all: '2098-06-01T00:00:00.000Z', 'ip:h-1.2.3.4': '2098-07-01T00:00:00.000Z' } };
    await handleAdvise({ body: { kind: 'chat', question: 'x' }, ip: '1.2.3.4', token: 'member' });
    expect(admin.sinceSeen).toBe('2098-07-01T00:00:00.000Z'); // the latest applicable reset wins
  });

  it("turns the provider's one-request-at-a-time refusal into a BUSY 503 the client retries", async () => {
    model.fail = 'AI HTTP 429: The local waiting queue is full; only one waiting request per owner is allowed.';
    const r = await handleAdvise({ body: { kind: 'chat', question: 'x' }, ip: '1.2.3.4', token: 'member' });
    expect(r.status).toBe(503);
    expect(r.json.code).toBe('BUSY');
    expect(admin.logged[0].ok).toBe(false); // a failed call never spends quota
  });

  it('lets the owner ask more than the per-minute burst limit', async () => {
    for (let i = 0; i < 8; i++) {
      const r = await handleAdvise({ body: { kind: 'chat', question: 'x' }, ip: '7.7.7.7', token: 'owner' });
      expect(r.status).toBe(200);
    }
  });
});
