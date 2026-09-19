// Browser client for the back-office API (/api/admin/<action>). Sends the Supabase session
// token; the server decides who is an admin (ADMIN_EMAILS).

async function sessionToken() {
  try {
    const { getSupabase } = await import('./supabaseClient');
    const supabase = await getSupabase();
    const { data } = (await supabase?.auth.getSession()) || {};
    return data?.session?.access_token || '';
  } catch {
    return '';
  }
}

export async function adminFetch(action, { method = 'GET', body, query } = {}) {
  const token = await sessionToken();
  const qs = query ? `?${new URLSearchParams(query).toString()}` : '';
  const res = await fetch(`/api/admin/${action}${qs}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) { const err = new Error(json.error || `HTTP ${res.status}`); err.status = res.status; throw err; }
  return json;
}

let publicSettings = null;
/** Announcement / maintenance / feature flags for everyone (cached for the session). */
export async function loadPublicSettings({ fresh = false } = {}) {
  if (publicSettings && !fresh) return publicSettings;
  try {
    const res = await fetch('/api/admin/settings', { cache: 'no-store' });
    publicSettings = res.ok ? await res.json() : null;
  } catch {
    publicSettings = null;
  }
  return publicSettings;
}
