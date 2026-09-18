// Browser-side client for the grounded advisor at /api/ai/advise. The AI key never reaches
// the browser; the server enriches the request with skill data and calls the model.

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

/**
 * kind 'mdc': { defense: { monsters: [{ name }] }, counters: [{ monsters, rating, turnOrder, notes }] }
 * kind 'draft': { blue: [names], red: [names], blueLeader, redLeader, blueBan, redBan, perspective }
 * Resolves to { answer, model, usage, authenticated } or throws with a Thai message.
 */
export async function askAdvisor(payload, { signal } = {}) {
  const token = await sessionToken();
  const res = await fetch('/api/ai/advise', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(payload),
    signal,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `AI ตอบกลับผิดพลาด (${res.status})`);
  return json;
}
