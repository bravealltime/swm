// POST /api/ai/advise — grounded draft / 3MDC / arena advisor (Vercel serverless function).
// The AI key stays on the server. Members only: the caller passes a Supabase access token, and each
// account and each IP gets `settings.ai.dailyLimit` successful answers per Thai calendar day (counted
// from ai_logs, so the quota holds across function instances). A per-minute burst limit stays in
// memory on top of that. Every call is logged with the IP and Vercel's geo headers.
import { advise } from '../_lib/advisor.js';
import { aiConfig } from '../_lib/ai.js';
import { getSettings, logAiCall, userFromToken, adminEmails, aiUsageSince } from '../_lib/admin.js';
import { bangkokDay, decideQuota, geoFromHeaders } from '../_lib/aiQuota.js';

const WINDOW_MS = 60 * 1000;
const LIMIT_PER_MINUTE = 6;
const buckets = new Map(); // key -> [timestamps]

function allow(key, limit) {
  const now = Date.now();
  const hits = (buckets.get(key) || []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= limit) return false;
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 5000) buckets.clear();
  return true;
}

export async function handleAdvise({ body, ip, token, geo = {} }) {
  if (!aiConfig().configured) return { status: 503, json: { error: 'ยังไม่ได้ตั้งค่า AI provider บนเซิร์ฟเวอร์' } };
  const settings = await getSettings().catch(() => null);
  if (settings && settings.features?.ai === false) return { status: 503, json: { error: 'ผู้ดูแลปิดใช้งานโค้ช AI ชั่วคราว' } };
  const aiRules = { requireLogin: true, dailyLimit: 3, ...(settings?.ai || {}) };

  const user = await userFromToken(token);
  const userId = user?.id || null;
  if (aiRules.requireLogin !== false && !userId) {
    return { status: 401, json: { error: 'โค้ช AI เปิดให้เฉพาะสมาชิก — เข้าสู่ระบบก่อนแล้วถามได้เลย', code: 'LOGIN_REQUIRED' } };
  }

  const key = userId ? `u:${userId}` : `ip:${ip || 'unknown'}`;
  if (!allow(key, LIMIT_PER_MINUTE)) {
    return { status: 429, json: { error: 'ถามถี่เกินไป รอสักครู่แล้วลองใหม่', code: 'RATE_LIMIT' } };
  }

  // Daily quota: admins are exempt; if the log table cannot be read the quota cannot be counted, so
  // the call goes through (the log write below will surface the same problem in the back-office)
  const day = bangkokDay();
  const isAdmin = Boolean(user?.email && adminEmails().includes(user.email));
  const usage = aiRules.dailyLimit > 0 && !isAdmin ? await aiUsageSince({ since: day.start, userId, ip }) : { ok: true, byUser: 0, byIp: 0 };
  const quota = decideQuota({ byUser: usage.byUser, byIp: usage.byIp, limit: aiRules.dailyLimit, unlimited: isAdmin || !usage.ok });
  const quotaJson = (extraUsed = 0) => (quota.unlimited
    ? { limit: quota.limit, unlimited: true, resetsAt: day.end }
    : { used: Math.min(quota.limit, quota.used + extraUsed), limit: quota.limit, remaining: Math.max(0, quota.remaining - extraUsed), resetsAt: day.end });
  if (!quota.allowed) {
    return {
      status: 429,
      json: {
        error: `วันนี้ใช้โค้ช AI ครบ ${quota.limit} คำถามแล้ว (นับต่อบัญชีและต่อ IP) — ถามใหม่ได้หลังเที่ยงคืน`,
        code: 'DAILY_LIMIT',
        quota: quotaJson(),
      },
    };
  }

  const t0 = Date.now();
  const kind = body?.kind;
  const question = kind === 'chat' ? body?.question : kind;
  try {
    const result = await advise(body || {});
    // awaited on purpose: the serverless runtime may freeze right after we return (see logAiCall)
    await logAiCall({ kind, question, userId, ip, geo, ok: true, ms: Date.now() - t0, model: result.model, tokens: result.usage?.total_tokens });
    return { status: 200, json: { ...result, authenticated: Boolean(userId), quota: quotaJson(1) } };
  } catch (err) {
    await logAiCall({ kind, question, userId, ip, geo, ok: false, ms: Date.now() - t0, error: err.message });
    return { status: 500, json: { error: err.message || 'AI error' } };
  }
}

/** Request context Vercel gives us: client IP from the proxy chain, geo from the edge headers. */
export function requestContext(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress;
  return { token, ip, geo: geoFromHeaders(req.headers) };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'POST only' });
  }
  const { status, json } = await handleAdvise({ body: req.body, ...requestContext(req) });
  res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json(json);
}
