// Browser-side client for the grounded advisor at /api/ai/advise. The AI key never reaches
// the browser; the server enriches the request with skill data and calls the model.
// The coach is members-only with a small daily quota per account and per IP (see api/ai/advise.js):
// a refusal arrives as an Error with `code` ('LOGIN_REQUIRED' | 'DAILY_LIMIT' | 'RATE_LIMIT') and
// `quota` ({ used, limit, remaining, resetsAt }) so the panels can say what to do next.

async function sessionToken() {
  try {
    const { getSupabase } = await import('./supabaseClient');
    const supabase = await getSupabase();
    const { data } = (await supabase?.auth.getSession()) || {};
    if (data?.session?.access_token) return data.session.access_token;
    const refreshed = await supabase?.auth.refreshSession().catch(() => null);
    return refreshed?.data?.session?.access_token || '';
  } catch {
    return '';
  }
}

/** Every panel opens the same login dialog through App.jsx. */
export function requestLogin() {
  try { window.dispatchEvent(new CustomEvent('swm:open-auth')); } catch { /* no window */ }
}

/** "เหลือ 2/3 คำถามวันนี้" — null when the server did not send a quota (admins are unlimited). */
export function quotaLabel(quota) {
  if (!quota || quota.unlimited) return null;
  return `เหลือ ${quota.remaining}/${quota.limit} คำถามวันนี้`;
}

/**
 * kind 'mdc': { defense: { monsters: [{ name }] }, counters: [{ monsters, rating, turnOrder, notes }] }
 * kind 'draft': { blue: [names], red: [names], blueLeader, redLeader, blueBan, redBan, perspective }
 * kind 'arena': { defense: { leader, monsters }, counters, userBox }
 * kind 'chat': { question, context, history }
 * Resolves to { answer, model, usage, authenticated, quota } or throws an Error with a Thai message
 * (plus `code` / `quota` when the server refused).
 */
export async function askAdvisor(payload, { signal, token } = {}) {
  const authToken = token || await sessionToken();
  const res = await fetch('/api/ai/advise', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
    body: JSON.stringify(payload),
    signal,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(json.error || `AI ตอบกลับผิดพลาด (${res.status})`);
    err.code = json.code || (res.status === 401 ? 'LOGIN_REQUIRED' : res.status === 429 ? 'RATE_LIMIT' : 'ERROR');
    err.quota = json.quota || null;
    err.status = res.status;
    throw err;
  }
  return json;
}
