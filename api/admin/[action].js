// /api/admin/<action> — back-office API. Every action except `settings` (public GET) requires an
// admin (Supabase login + ADMIN_EMAILS). Vercel routes here via the [action] file name; the Vite dev
// middleware calls handleAdmin() directly with the same arguments.
import {
  requireAdmin, userFromToken, getUserDirectory, supabaseInfo, tableStatus, getSettings, saveSettings,
  aiLogs, aiStats, aiUsageGroups, datasetReport, deployInfo, githubInfo, workflowRuns, dispatchWorkflow,
  getStripePaymentsSummary, getVipUsersList, grantUserVip, revokeUserVip, getCloudProfilesList, deleteCloudProfileFile,
  getVipPromoCodes, saveVipPromoCode, deleteVipPromoCode,
} from '../_lib/admin.js';
import { bangkokDay } from '../_lib/aiQuota.js';
import { aiConfig, chat } from '../_lib/ai.js';
import { adminSnapshots, setContributorFlag, deleteSnapshot } from '../_lib/guildRankings.js';
import { listLive, getLive, setLive, deleteLive, listSubmissions, resolveSubmission, LIVE_KEY } from '../_lib/liveData.js';
import { LIVE_WORKFLOW } from '../_lib/admin.js';

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

  // --- Stripe & VIP Payments Management ---
  if (action === 'payments') {
    return { status: 200, json: await getStripePaymentsSummary() };
  }

  if (action === 'vip-users') {
    return { status: 200, json: await getVipUsersList() };
  }

  if (action === 'grant-vip' && (method === 'POST' || method === 'PUT')) {
    const res = await grantUserVip(body || {});
    return { status: res.ok ? 200 : 400, json: res };
  }

  if (action === 'revoke-vip' && (method === 'POST' || method === 'DELETE')) {
    const res = await revokeUserVip(body || {});
    return { status: res.ok ? 200 : 400, json: res };
  }

  // --- VIP Promo / Trial Codes ---
  if (action === 'vip-codes') {
    return { status: 200, json: await getVipPromoCodes() };
  }

  if (action === 'save-vip-code' && (method === 'POST' || method === 'PUT')) {
    const res = await saveVipPromoCode(body || {}, auth.user.email);
    return { status: res.ok ? 200 : 400, json: res };
  }

  if (action === 'delete-vip-code' && (method === 'POST' || method === 'DELETE')) {
    const code = body?.code || query?.code || '';
    const res = await deleteVipPromoCode(code, auth.user.email);
    return { status: res.ok ? 200 : 400, json: res };
  }

  // --- Cloud Profile Sync Inspector ---
  if (action === 'cloud-profiles') {
    return { status: 200, json: await getCloudProfilesList() };
  }

  if (action === 'delete-cloud-profile' && (method === 'POST' || method === 'DELETE')) {
    const filename = body?.filename || query?.filename || '';
    const res = await deleteCloudProfileFile(filename);
    return { status: res.ok ? 200 : 400, json: res };
  }

  if (action === 'logs') return { status: 200, json: await aiLogs({ limit: Number(query.limit) || 100 }) };

  // today's AI quota per account / IP, and resets ("all", "u:<uuid>", "ip:<hash>") that restart the count now
  if (action === 'ai-quota' && method === 'GET') {
    const settings = await getSettings({ fresh: true });
    const day = bangkokDay();
    const resets = settings.ai?.resets || {};
    const since = [day.start, resets.all].filter(Boolean).sort().pop();
    const usage = await aiUsageGroups({ since });
    const userDir = await getUserDirectory();
    const after = (k) => (resets[k] && resets[k] > since ? resets[k] : null);

    const users = usage.users.map((u) => {
      const resetTime = after(`u:${u.userId}`);
      const activeCount = resetTime && Array.isArray(u.timestamps) ? u.timestamps.filter((ts) => ts > resetTime).length : u.count;
      const profile = userDir.get(u.userId);
      return {
        ...u,
        count: activeCount,
        totalToday: u.count,
        resetAt: resetTime,
        email: profile?.email || null,
        displayName: profile?.name || null,
      };
    });

    const ips = usage.ips.map((i) => {
      const resetTime = after(`ip:${i.ipHash}`);
      const activeCount = resetTime && Array.isArray(i.timestamps) ? i.timestamps.filter((ts) => ts > resetTime).length : i.count;
      return {
        ...i,
        count: activeCount,
        totalToday: i.count,
        resetAt: resetTime,
      };
    });

    return {
      status: 200,
      json: {
        ...usage,
        day,
        limit: settings.ai?.dailyLimit ?? 3,
        resets,
        users,
        ips,
      },
    };
  }
  if (action === 'ai-quota' && method === 'POST') {
    const target = String(body?.target || '');
    if (!/^(all|u:[0-9a-f-]{36}|ip:[0-9a-f]{16})$/i.test(target)) return { status: 400, json: { error: 'target ต้องเป็น all, u:<uuid> หรือ ip:<hash>' } };
    const settings = await getSettings({ fresh: true });
    const ai = { ...(settings.ai || {}) };
    delete ai._meta;
    const now = new Date().toISOString();
    // a global reset makes the per-target entries redundant
    const resets = target === 'all' ? { all: now } : { ...(ai.resets || {}), [target]: now };
    const r = await saveSettings({ ai: { ...ai, resets } }, auth.user.email);
    return r.ok ? { status: 200, json: { ok: true, resetAt: now } } : { status: 400, json: { error: r.error } };
  }

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

  // live data documents (what the hourly job and the code moderation write)
  if (action === 'live-data' && method === 'GET') {
    if (query.key) { const r = await getLive(String(query.key)); return { status: r.ok ? 200 : 404, json: r }; }
    return { status: 200, json: await listLive() };
  }
  if (action === 'live-data' && method === 'POST') {
    const key = String(body?.key || '');
    if (!LIVE_KEY.test(key)) return { status: 400, json: { error: 'key ต้องเป็น a-z 0-9 - ยาว 2–40' } };
    if (body?.op === 'delete') { const r = await deleteLive(key); return r.ok ? { status: 200, json: { ok: true } } : { status: 500, json: { error: r.error } }; }
    if (body?.value === undefined || body.value === null || typeof body.value !== 'object') return { status: 400, json: { error: 'value ต้องเป็น JSON object/array' } };
    const r = await setLive(key, body.value, auth.user.email);
    return r.ok ? { status: 200, json: { ok: true, updatedAt: r.updatedAt } } : { status: 500, json: { error: r.error } };
  }
  if (action === 'code-submissions' && method === 'GET') return { status: 200, json: await listSubmissions({ status: String(query.status || 'pending'), limit: Number(query.limit) || 100 }) };
  if (action === 'code-submissions' && method === 'POST') {
    const r = await resolveSubmission({ id: body?.id, op: body?.op, by: auth.user.email, rewards: body?.rewards });
    return r.ok ? { status: 200, json: { ok: true } } : { status: 400, json: { error: r.error } };
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
    if (what === 'refresh-live') {
      const r = await dispatchWorkflow({}, LIVE_WORKFLOW);
      return { status: r.ok ? 200 : 400, json: r.ok ? { ok: true, message: 'สั่งรีเฟรชข้อมูลสดแล้ว — ปกติเสร็จใน 2–3 นาที หน้าเว็บอัปเดตเองโดยไม่ต้อง deploy' } : { error: r.error } };
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
