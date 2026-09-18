import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSupabase, isSupabaseConfigured, saveSupabaseConfig, clearSupabaseConfig } from '../services/supabaseClient';
import { saveBox, loadBox } from '../utils/swexImport';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'synced' | 'error'
  const [syncError, setSyncError] = useState(null);
  const [configured, setConfigured] = useState(() => isSupabaseConfigured());

  // Initialize auth state
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get current session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    // Listen to changes in auth state (logged in, signed out, token refreshed)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [configured]);

  // Sign In with Email & Password
  const signInWithEmail = useCallback(async (email, password) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error('กรุณาตั้งค่าเชื่อมต่อ Supabase ก่อนเข้าสู่ระบบ');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }, []);

  // Sign Up with Email & Password
  const signUpWithEmail = useCallback(async (email, password) => {
    const supabase = getSupabase();
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
    return data;
  }, []);

  // Sign In with OAuth Provider (Google, Discord, etc.)
  const signInWithOAuth = useCallback(async (provider = 'google') => {
    const supabase = getSupabase();
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
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
  }, []);

  // Save profile box to Cloud (Supabase `user_profiles` table)
  const syncProfileToCloud = useCallback(async (boxToSync) => {
    const supabase = getSupabase();
    if (!supabase || !user) {
      return { success: false, error: 'User not logged in' };
    }

    const box = boxToSync || loadBox();
    if (!box) {
      return { success: false, error: 'No profile box to sync' };
    }

    setSyncStatus('syncing');
    setSyncError(null);

    try {
      const payload = {
        id: user.id,
        wizard_name: box.wizard?.name || 'PedictU',
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
    const supabase = getSupabase();
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
        saveBox(data.box_data);
        setSyncStatus('synced');
        return data.box_data;
      }

      setSyncStatus('idle');
      return null;
    } catch (err) {
      console.warn('Failed to fetch cloud profile:', err);
      setSyncStatus('error');
      setSyncError(err.message);
      return null;
    }
  }, [user]);

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
