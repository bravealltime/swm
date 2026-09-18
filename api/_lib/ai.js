// Minimal client for an OpenAI-compatible chat/completions endpoint (server-side only).
// Config comes from AI_BASE_URL / AI_MODEL / AI_API_KEY — never expose these to the browser.
import fs from 'node:fs';
import path from 'node:path';

let envLoaded = false;
/** Loads .env from the project root when running locally (Vercel injects env itself). */
export function loadEnv() {
  if (envLoaded) return;
  envLoaded = true;
  try {
    const file = path.resolve(process.cwd(), '.env');
    if (!fs.existsSync(file)) return;
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    // ignore
  }
}

export function aiConfig() {
  loadEnv();
  const baseUrl = (process.env.AI_BASE_URL || '').replace(/\/+$/, '');
  return {
    baseUrl,
    model: process.env.AI_MODEL || '',
    apiKey: process.env.AI_API_KEY || '',
    configured: Boolean(baseUrl && process.env.AI_MODEL && process.env.AI_API_KEY),
  };
}

/**
 * One chat completion. Returns { text, usage, model }. Reasoning models return their thinking in
 * `reasoning_content`, which is dropped; `reasoning_effort: low` keeps latency/cost down.
 */
export async function chat({ system, user, maxTokens = 900, temperature = 0.3, timeoutMs = 45000, retries = 2 }) {
  const cfg = aiConfig();
  if (!cfg.configured) throw new Error('AI provider not configured (AI_BASE_URL / AI_MODEL / AI_API_KEY)');

  const body = {
    model: cfg.model,
    messages: [
      ...(system ? [{ role: 'system', content: system }] : []),
      { role: 'user', content: user },
    ],
    max_tokens: maxTokens,
    temperature,
    reasoning_effort: 'low',
  };

  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiKey}` },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(`AI HTTP ${res.status}: ${json.error?.message || res.statusText}`);
      const msg = json.choices?.[0]?.message || {};
      const text = (msg.content || '').trim();
      if (!text) throw new Error('AI returned an empty answer');
      return { text, usage: json.usage || null, model: json.model || cfg.model };
    } catch (err) {
      lastErr = err;
      if (attempt < retries) await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr;
}

/**
 * Lenient JSON extraction: strips ``` fences and grabs the outermost object. If the answer was cut
 * off by max_tokens, keeps every complete "key": "value" pair and closes the object.
 */
export function parseJson(text) {
  const cleaned = String(text).replace(/```(?:json)?/gi, '').trim();
  const start = cleaned.indexOf('{');
  if (start < 0) throw new Error('no JSON object in answer');
  const end = cleaned.lastIndexOf('}');
  if (end > start) {
    try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { /* fall through to repair */ }
  }
  const body = cleaned.slice(start);
  const lastPair = body.lastIndexOf('",');
  const lastValue = body.lastIndexOf('"');
  const cut = lastPair > 0 ? lastPair + 1 : lastValue > 0 ? lastValue + 1 : -1;
  if (cut < 0) throw new Error('no JSON object in answer');
  return JSON.parse(`${body.slice(0, cut).replace(/,\s*$/, '')}}`);
}

/** Small stable hash for caching batch results. */
export function hashOf(value) {
  const str = typeof value === 'string' ? value : JSON.stringify(value);
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}
