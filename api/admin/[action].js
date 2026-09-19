// /api/admin/<action> — back-office API. Every action except `settings` (public GET) requires an
// admin (Supabase login + ADMIN_EMAILS). Vercel routes here via the [action] file name; the Vite dev
// middleware calls handleAdmin() directly with the same arguments.
import { requireAdmin, userFromToken, supabaseInfo, tableStatus, getSettings, saveSettings, aiLogs, aiStats, datasetReport, deployInfo, githubInfo, workflowRuns, dispatchWorkflow } from '../_lib/admin.js';
import { aiConfig, chat } from '../_lib/ai.js';
import { adminSnapshots, setContributorFlag, deleteSnapshot } from '../_lib/guildRankings.js';

const PUBLIC_SETTINGS_KEYS = ['announcement', 'maintenance', 'features'];

export async function handleAdmin({ action, method, body, token, query = {} }) {
  // public: what the app needs at boot (announcement, maintenance, feature flags)
  if (action === 'settings' && method === 'GET' && !query.full) {
    const s = await getSettings();
    const out = {};
    for (const k of PUBLIC_SETTINGS_KEYS) out[k] = s[k];
    return { status: 200, json: out, cache: 'public, max-age=30, s-maxage=60' };
  }

  if (action === 'me') {
    const user = await userFromToken(token);
    const auth = await requireAdmin(token);
    return { status: 200, json: { user, admin: auth.ok, reason: auth.ok ? null : auth.reason } };
  }

  const auth = await requireAdmin(token);
  if (!auth.ok) return { status: auth.status, json: { error: auth.reason } };

  if (action === 'status') {
    const [stats, settings, tables] = await Promise.all([aiStats(), getSettings({ fresh: true }), tableStatus()]);
    const cfg = aiConfig();
    return {
      status: 200,
      json: {
        admin: auth.user,
        ai: { configured: cfg.configured, model: cfg.model || null, baseHost: cfg.baseUrl ? safeHost(cfg.baseUrl) : null, stats },
        supabase: { ...supabaseInfo(), tables },
        settings,
        data: datasetReport(),
        deploy: deployInfo(),
        github: githubInfo(),
        now: new Date().toISOString(),
      },
    };
  }

  if (action === 'settings' && method === 'GET') return { status: 200, json: await getSettings({ fresh: true }) };
  if (action === 'settings' && (method === 'PUT' || method === 'POST')) {
    const r = await saveSettings(body, auth.user.email);
    return r.ok ? { status: 200, json: { ok: true, settings: await getSettings({ fresh: true }) } } : { status: 400, json: { error: r.error } };
  }

  if (action === 'logs') return { status: 200, json: await aiLogs({ limit: Number(query.limit) || 100 }) };

  if (action === 'runs') return { status: 200, json: await workflowRuns(Number(query.limit) || 8) };

  // shared guild leaderboards: every contributor's snapshot, plus trust / block / delete
  if (action === 'guild-rankings' && method === 'GET') return { status: 200, json: await adminSnapshots() };
  if (action === 'guild-rankings' && method === 'POST') {
    const op = body?.op;
    const contributor = String(body?.contributor || '');
    const uuid = /^[0-9a-f-]{36}$/i.test(contributor);
    if (op === 'delete') {
      const id = String(body?.id || '');
      if (!id) return { status: 400, json: { error: 'ไม่มี id' } };
      const r = await deleteSnapshot(id);
      return r.ok ? { status: 200, json: { ok: true } } : { status: 500, json: { error: r.error } };
    }
    const flag = { trust: ['trusted', true], untrust: ['trusted', false], block: ['blocked', true], unblock: ['blocked', false] }[op];
    if (!flag || !uuid) return { status: 400, json: { error: 'unknown op' } };
    const r = await setContributorFlag(flag[0], contributor, flag[1], auth.user.email);
    return r.ok ? { status: 200, json: { ok: true } } : { status: 500, json: { error: r.error } };
  }

  if (action === 'actions' && method === 'POST') {
    const what = body?.action;
    if (what === 'ping-ai') {
      if (!aiConfig().configured) return { status: 200, json: { ok: false, error: 'ยังไม่ได้ตั้งค่า AI' } };
      const t0 = Date.now();
      try {
        const r = await chat({ system: 'ตอบสั้นที่สุด', user: 'ตอบว่า OK', maxTokens: 300, temperature: 0, timeoutMs: 40000, retries: 0 });
        return { status: 200, json: { ok: true, ms: Date.now() - t0, model: r.model, answer: String(r.text || '').slice(0, 80) } };
      } catch (err) {
        return { status: 200, json: { ok: false, ms: Date.now() - t0, error: err.message } };
      }
    }
    if (what === 'refresh-data') {
      const r = await dispatchWorkflow({ pages: String(body?.pages || 30) });
      return { status: r.ok ? 200 : 400, json: r.ok ? { ok: true, message: 'สั่งรัน GitHub Actions แล้ว — ใช้เวลาราว 15–40 นาที Vercel จะ deploy เองเมื่อเสร็จ' } : { error: r.error } };
    }
    return { status: 400, json: { error: 'unknown action' } };
  }

  return { status: 404, json: { error: 'not found' } };
}

function safeHost(url) { try { return new URL(url).host; } catch { return null; } }

export default async function handler(req, res) {
  const action = String(req.query?.action || '');
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const { status, json, cache } = await handleAdmin({ action, method: req.method, body: req.body, token, query: req.query || {} });
  res.setHeader('Cache-Control', cache || 'no-store');
  return res.status(status).json(json);
}
