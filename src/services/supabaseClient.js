import { createClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'swm_supabase_url';
const STORAGE_KEY_ANON = 'swm_supabase_anon_key';

let cachedClient = null;

/**
 * Get the active Supabase Project URL and Anon Key
 */
export function getSupabaseCredentials() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const localUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_URL) : null;
  const localAnon = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_ANON) : null;

  const url = (envUrl || localUrl || '').trim();
  const anonKey = (envAnon || localAnon || '').trim();

  return { url, anonKey, isConfigured: Boolean(url && anonKey) };
}

export function isSupabaseConfigured() {
  return getSupabaseCredentials().isConfigured;
}

export function saveSupabaseConfig(url, anonKey) {
  if (typeof window !== 'undefined') {
    if (url) localStorage.setItem(STORAGE_KEY_URL, url.trim());
    if (anonKey) localStorage.setItem(STORAGE_KEY_ANON, anonKey.trim());
  }
  cachedClient = null; // Reset cached client so it gets re-initialized
}

export function clearSupabaseConfig() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_ANON);
  }
  cachedClient = null;
}

/**
 * Get the Supabase client instance (or null if not yet configured)
 */
export function getSupabase() {
  if (cachedClient) return cachedClient;

  const { url, anonKey, isConfigured } = getSupabaseCredentials();
  if (!isConfigured) return null;

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}
