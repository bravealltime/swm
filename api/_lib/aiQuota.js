// Daily quota for the AI coach — pure helpers (no I/O) so the rules are unit-testable.
// The day is a Thai calendar day (UTC+7): "3 questions per day" means until midnight in Bangkok.

const BANGKOK_OFFSET_MS = 7 * 3600 * 1000;

/** { start, end } of the Bangkok day containing `now` (ms since epoch), both as ISO strings. */
export function bangkokDay(now = Date.now()) {
  const local = new Date(now + BANGKOK_OFFSET_MS);
  const startMs = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - BANGKOK_OFFSET_MS;
  return { start: new Date(startMs).toISOString(), end: new Date(startMs + 24 * 3600 * 1000).toISOString() };
}

/**
 * Applies the limit to today's counts. Both the account and the IP count: a person on two
 * networks is still one person, and two accounts behind one router share the router's budget.
 * @returns {{ allowed: boolean, used: number, limit: number, remaining: number, unlimited: boolean }}
 */
export function decideQuota({ byUser = 0, byIp = 0, limit = 3, unlimited = false }) {
  const cap = Math.max(0, Number(limit) || 0);
  if (unlimited || cap === 0) return { allowed: true, used: Math.max(byUser, byIp), limit: cap, remaining: Infinity, unlimited: true };
  const used = Math.max(Number(byUser) || 0, Number(byIp) || 0);
  return { allowed: used < cap, used, limit: cap, remaining: Math.max(0, cap - used), unlimited: false };
}

/** Vercel's edge geo headers (absent in dev) → { country, region, city, timezone } with nulls when missing. */
export function geoFromHeaders(headers = {}) {
  const h = (k) => {
    const v = headers[k];
    if (!v) return null;
    try { return decodeURIComponent(String(Array.isArray(v) ? v[0] : v)).slice(0, 80); } catch { return String(v).slice(0, 80); }
  };
  return {
    country: h('x-vercel-ip-country'),
    region: h('x-vercel-ip-country-region'),
    city: h('x-vercel-ip-city'),
    timezone: h('x-vercel-ip-timezone'),
  };
}
