// supabase-js is loaded on demand so the app shell does not pay for it until auth is used.

const STORAGE_KEY_URL = 'swm_supabase_url';
const STORAGE_KEY_ANON = 'swm_supabase_anon_key';

export const DEFAULT_SUPABASE_URL = 'https://cpcuyhfjnbpjvfdedspa.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwY3V5aGZqbmJwanZmZGVkc3BhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MjQxMDAsImV4cCI6MjEwNTMwMDEwMH0.0bFtwQ-n-ebTLEZDO1fUmVL0fYX71mMjMDrdfMSnNWI';

let cachedClient = null;

/**
 * Get the active Supabase Project URL and Anon Key
 */
export function getSupabaseCredentials() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const localUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_URL) : null;
  const localAnon = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_ANON) : null;

  const url = (localUrl || envUrl || DEFAULT_SUPABASE_URL).trim();
  const anonKey = (localAnon || envAnon || DEFAULT_SUPABASE_ANON_KEY).trim();

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
  clientPromise = null;
}

export function clearSupabaseConfig() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_ANON);
  }
  cachedClient = null;
  clientPromise = null;
}

let clientPromise = null;

/**
 * Get the Supabase client instance (Promise; resolves to null if not configured).
 * The SDK is imported lazily the first time it is needed.
 */
export function getSupabase() {
  if (cachedClient) return Promise.resolve(cachedClient);
  const { url, anonKey, isConfigured } = getSupabaseCredentials();
  if (!isConfigured) return Promise.resolve(null);
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js')
      .then(({ createClient }) => {
        cachedClient = createClient(url, anonKey, {
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
        });
        return cachedClient;
      })
      .catch((err) => {
        console.error('Failed to initialize Supabase client:', err);
        clientPromise = null;
        return null;
      });
  }
  return clientPromise;
}
