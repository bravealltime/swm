// GET  /api/live/<key>      — a live document (public, edge-cached for 5 minutes, stale for an hour while revalidating)
// POST /api/live/submit-code — a visitor sends a redeem code for moderation ({ code, note })
// The Vite dev middleware calls handleLive() with the same arguments.
import { getLive, submitCode } from '../_lib/liveData.js';

export async function handleLive({ key, method, body, ip }) {
  if (method === 'POST') {
    if (key !== 'submit-code') return { status: 404, json: { error: 'not found' } };
    const r = await submitCode({ code: body?.code, note: body?.note, ip });
    return { status: r.status || (r.ok ? 200 : 500), json: r.ok ? { ok: true, code: r.code, duplicate: Boolean(r.duplicate), live: Boolean(r.live) } : { error: r.error } };
  }
  if (method !== 'GET') return { status: 405, json: { error: 'GET or POST only' } };
  const r = await getLive(String(key || ''));
  if (!r.ok) {
    const status = r.error === 'NOT_FOUND' ? 404 : r.error === 'BAD_KEY' ? 400 : 503;
    return { status, json: { error: r.error }, cache: status === 404 ? 'public, max-age=60, s-maxage=60' : 'no-store' };
  }
  return { status: 200, json: { key: r.key, value: r.value, updatedAt: r.updatedAt }, cache: 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600' };
}

export default async function handler(req, res) {
  const key = String(req.query?.key || '');
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress;
  const { status, json, cache } = await handleLive({ key, method: req.method, body: req.body, ip });
  res.setHeader('Cache-Control', cache || 'no-store');
  return res.status(status).json(json);
}
