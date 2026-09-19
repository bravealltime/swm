// POST /api/ai/advise — grounded draft / 3MDC advisor (Vercel serverless function).
// The AI key stays on the server. Callers may pass a Supabase access token; logged-in users get a
// higher per-minute budget. Limits are per function instance (good enough to stop casual abuse).
import { advise } from '../_lib/advisor.js';
import { aiConfig, loadEnv } from '../_lib/ai.js';
import { getSettings, logAiCall } from '../_lib/admin.js';

const WINDOW_MS = 60 * 1000;
const LIMIT_ANON = 3;
const LIMIT_USER = 12;
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

async function userIdFromToken(token) {
  loadEnv();
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anon = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!token || !url || !anon) return null;
  try {
    const res = await fetch(`${url.replace(/\/+$/, '')}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    const user = await res.json();
    return user?.id || null;
  } catch {
    return null;
  }
}

export async function handleAdvise({ body, ip, token }) {
  if (!aiConfig().configured) return { status: 503, json: { error: 'ยังไม่ได้ตั้งค่า AI provider บนเซิร์ฟเวอร์' } };
  const settings = await getSettings().catch(() => null);
  if (settings && settings.features?.ai === false) return { status: 503, json: { error: 'ผู้ดูแลปิดใช้งานโค้ช AI ชั่วคราว' } };
  const userId = await userIdFromToken(token);
  const key = userId ? `u:${userId}` : `ip:${ip || 'unknown'}`;
  if (!allow(key, userId ? LIMIT_USER : LIMIT_ANON)) {
    return { status: 429, json: { error: userId ? 'ถามถี่เกินไป รอสักครู่แล้วลองใหม่' : 'ผู้ใช้ทั่วไปถาม AI ได้ 3 ครั้ง/นาที — เข้าสู่ระบบเพื่อใช้ได้มากขึ้น' } };
  }
  const t0 = Date.now();
  const kind = body?.kind;
  const question = kind === 'chat' ? body?.question : kind;
  try {
    const result = await advise(body || {});
    // awaited on purpose: the serverless runtime may freeze right after we return (see logAiCall)
    await logAiCall({ kind, question, userId, ip, ok: true, ms: Date.now() - t0, model: result.model, tokens: result.usage?.total_tokens });
    return { status: 200, json: { ...result, authenticated: Boolean(userId) } };
  } catch (err) {
    await logAiCall({ kind, question, userId, ip, ok: false, ms: Date.now() - t0, error: err.message });
    return { status: 500, json: { error: err.message || 'AI error' } };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'POST only' });
  }
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress;
  const { status, json } = await handleAdvise({ body: req.body, ip, token });
  res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json(json);
}
