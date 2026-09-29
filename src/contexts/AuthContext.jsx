import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSupabase, isSupabaseConfigured, saveSupabaseConfig, clearSupabaseConfig } from '../services/supabaseClient';
import { saveBox, saveBoxAsync, loadBox, loadBoxAsync } from '../utils/boxStorage';
import { isUserMember, getVipStatusInfo } from '../utils/memberPolicy';
const parseSwexExport = async (raw) => (await import('../utils/swexImport')).parseSwexExport(raw);

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'synced' | 'error'
  const [syncError, setSyncError] = useState(null);
  const [configured, setConfigured] = useState(() => isSupabaseConfigured());
  const [isAdmin, setIsAdmin] = useState(false);
  const [memberOverride, setMemberOverride] = useState(() => {
    try { return localStorage.getItem('swm:vip-member') === '1'; } catch { return false; }
  });
  const [paywallOpen, setPaywallOpen] = useState(false);

  const setMemberStatus = useCallback((on, durationDays = null) => {
    setMemberOverride(Boolean(on));
    try {
      localStorage.setItem('swm:vip-member', on ? '1' : '0');
      if (on && durationDays) {
        const expIso = new Date(Date.now() + durationDays * 86400000).toISOString();
        localStorage.setItem('swm:vip-expires', expIso);
      } else if (!on) {
        localStorage.removeItem('swm:vip-expires');
      }
    } catch { /* ignore */ }
  }, []);

  const isMember = Boolean(isAdmin || memberOverride || isUserMember(user, isAdmin));
  const vipInfo = getVipStatusInfo(user, isAdmin);

  // Admins can browse as a normal user; admin mode shows the back-office entry points
  const [adminMode, setAdminModeState] = useState(() => { try { return localStorage.getItem('swm:admin-mode') === '1'; } catch { return false; } });
  const setAdminMode = useCallback((on) => {
    setAdminModeState(on);
    try { localStorage.setItem('swm:admin-mode', on ? '1' : '0'); } catch { /* ignore */ }
  }, []);

  // Ask the server whether this account is on the admin allowlist (ADMIN_EMAILS)
  useEffect(() => {
    let alive = true;
    if (!session?.access_token) { setIsAdmin(false); return undefined; }
    fetch('/api/admin/me', { headers: { Authorization: `Bearer ${session.access_token}` }, cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (alive) setIsAdmin(Boolean(j?.admin)); })
      .catch(() => { if (alive) setIsAdmin(false); });
    return () => { alive = false; };
  }, [session?.access_token]);

  // Initialize auth state (SDK loads lazily; nothing happens until it resolves)
  useEffect(() => {
    let alive = true;
    let subscription = null;
    getSupabase().then((supabase) => {
      if (!alive) return;
      if (!supabase) { setLoading(false); return; }
      supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
        if (!alive) return;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
      });
      const { data } = supabase.auth.onAuthStateChange((_event, currentSession) => {
        if (!alive) return;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
      });
      subscription = data?.subscription || null;
    });
    return () => { alive = false; subscription?.unsubscribe(); };
  }, [configured]);

  // Sign In with Email & Password
  const signInWithEmail = useCallback(async (email, password) => {
    const supabase = await getSupabase();
    if (!supabase) throw new Error('กรุณาตั้งค่าเชื่อมต่อ Supabase ก่อนเข้าสู่ระบบ');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data?.session) {
      setSession(data.session);
      setUser(data.session.user ?? null);
    }
    return data;
  }, []);

  // Sign Up with Email & Password
  const signUpWithEmail = useCallback(async (email, password) => {
    const supabase = await getSupabase();
    if (!supabase) throw new Error('กรุณาตั้งค่าเชื่อมต่อ Supabase ก่อน');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: email.split('@')[0],
        },
      },
    });
    if (error) throw error;
    if (data?.session) {
      setSession(data.session);
      setUser(data.session.user ?? null);
    }
    return data;
  }, []);

  // Sign In with OAuth Provider (Google, Discord, etc.)
  const signInWithOAuth = useCallback(async (provider = 'google') => {
    const supabase = await getSupabase();
    if (!supabase) throw new Error('กรุณาตั้งค่าเชื่อมต่อ Supabase ก่อน');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
    return data;
  }, []);

  // Sign Out
  const signOut = useCallback(async () => {
    const supabase = await getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
  }, []);

  // Save profile box to Cloud (Supabase `user_profiles` table)
  const syncProfileToCloud = useCallback(async (boxToSync) => {
    const supabase = await getSupabase();
    if (!supabase || !user) {
      return { success: false, error: 'User not logged in' };
    }

    let box = boxToSync || loadBox();
    if (!box) {
      return { success: false, error: 'No profile box to sync' };
    }

    if (box.unit_list && !Array.isArray(box.units)) {
      try {
        box = await parseSwexExport(box);
      } catch (err) {
        console.warn('Failed to parse raw box for cloud sync:', err);
      }
    }

    setSyncStatus('syncing');
    setSyncError(null);

    try {
      const payload = {
        id: user.id,
        wizard_name: box.wizard?.name || '',
        wizard_id: String(box.wizard?.idHint || '9326961'),
        box_data: box,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('user_profiles')
        .upsert(payload, { onConflict: 'id' });

      if (error) throw error;

      setSyncStatus('synced');
      return { success: true };
    } catch (err) {
      console.error('Failed to sync profile to cloud:', err);
      setSyncStatus('error');
      setSyncError(err.message);
      return { success: false, error: err.message };
    }
  }, [user]);

  // Fetch profile box from Cloud
  const fetchProfileFromCloud = useCallback(async () => {
    const supabase = await getSupabase();
    if (!supabase || !user) return null;

    setSyncStatus('syncing');
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116: row not found
        throw error;
      }

      if (data && data.box_data) {
        let cloudBox = data.box_data;
        if (cloudBox.unit_list && !Array.isArray(cloudBox.units)) {
          try {
            cloudBox = await parseSwexExport(cloudBox);
          } catch (err) {
            console.warn('Failed to parse cloud box:', err);
          }
        }

        // Compare timestamps: Never downgrade a newer local profile to an older cloud profile on refresh!
        const localBox = await loadBoxAsync();
        const localTime = new Date(localBox?.updatedAt || localBox?.importedAt || 0).getTime();
        const cloudTime = new Date(data.updated_at || cloudBox?.updatedAt || cloudBox?.importedAt || 0).getTime();

        if (localBox && Array.isArray(localBox.units) && localBox.units.length > 0 && localTime > cloudTime) {
          console.log('[AuthContext] Local profile is newer than cloud. Uploading local to cloud...');
          await syncProfileToCloud(localBox);
          setSyncStatus('synced');
          return localBox;
        }

        await saveBoxAsync(cloudBox);
        setSyncStatus('synced');
        return cloudBox;
      }

      setSyncStatus('idle');
      return null;
    } catch (err) {
      console.warn('Failed to fetch cloud profile:', err);
      setSyncStatus('error');
      setSyncError(err.message);
      return null;
    }
  }, [user, syncProfileToCloud]);

  // Auto-sync profile on login if user has a cloud profile or local box
  useEffect(() => {
    if (user) {
      fetchProfileFromCloud().then((cloudBox) => {
        if (!cloudBox) {
          // If no cloud box yet, push local box to cloud
          const localBox = loadBox();
          if (localBox && localBox.units?.length > 0) {
            syncProfileToCloud(localBox);
          }
        }
      });
    }
  }, [user, fetchProfileFromCloud, syncProfileToCloud]);

  const refreshUser = useCallback(async () => {
    const supabase = await getSupabase();
    if (!supabase) return null;
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    setSession(currentSession);
    setUser(currentSession?.user ?? null);
    return currentSession?.user ?? null;
  }, []);

  const updateConfig = (url, anonKey) => {
    saveSupabaseConfig(url, anonKey);
    setConfigured(isSupabaseConfigured());
  };

  const removeConfig = () => {
    clearSupabaseConfig();
    setConfigured(false);
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isAdmin,
        isMember,
        memberTier: isMember ? 'vip' : 'free',
        vipInfo,
        setMemberStatus,
        refreshUser,
        isPaywallOpen: paywallOpen,
        openPaywall: () => setPaywallOpen(true),
        closePaywall: () => setPaywallOpen(false),
        adminMode: isAdmin && adminMode,
        setAdminMode,
        syncStatus,
        syncError,
        isConfigured: configured,
        signInWithEmail,
        signUpWithEmail,
        signInWithOAuth,
        signOut,
        syncProfileToCloud,
        fetchProfileFromCloud,
        updateConfig,
        removeConfig,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/** For widgets that may render outside the provider (unit tests, embeds): anonymous instead of throwing. */
export function useOptionalAuth() {
  return useContext(AuthContext) || { user: null, session: null, isAdmin: false, adminMode: false, isMember: false, memberTier: 'free' };
}
