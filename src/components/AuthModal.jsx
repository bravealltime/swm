import React, { useState } from 'react';
import {
  X,
  LogIn,
  UserPlus,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Settings,
  Cloud,
  ExternalLink,
  ShieldCheck,
  KeyRound
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getSupabaseCredentials } from '../services/supabaseClient';

export default function AuthModal({ isOpen, onClose }) {
  const {
    user,
    isConfigured,
    signInWithEmail,
    signUpWithEmail,
    signInWithOAuth,
    signOut,
    updateConfig,
    removeConfig
  } = useAuth();

  const [mode, setMode] = useState(isConfigured ? 'login' : 'config'); // 'login' | 'signup' | 'config'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Supabase Config fields
  const currentCreds = getSupabaseCredentials();
  const [supabaseUrl, setSupabaseUrl] = useState(currentCreds.url || '');
  const [supabaseKey, setSupabaseKey] = useState(currentCreds.anonKey || '');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      await signInWithEmail(email, password);
      setSuccessMsg('เข้าสู่ระบบสำเร็จ! กำลังซิงค์ข้อมูลมอนสเตอร์และรูน...');
      setTimeout(() => {
        onClose();
        setSuccessMsg('');
      }, 1200);
    } catch (err) {
      if (err.message.includes('Invalid login credentials')) {
        setErrorMsg('อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
      } else {
        setErrorMsg(err.message || 'เข้าสู่ระบบไม่สำเร็จ');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('รหัสผ่านยืนยันไม่ตรงกัน');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const data = await signUpWithEmail(email, password);
      if (!data.session) {
        await signInWithEmail(email, password);
      }
      setSuccessMsg('สมัครสมาชิกสำเร็จและเข้าสู่ระบบเรียบร้อยแล้ว!');
      setTimeout(() => {
        onClose();
        setSuccessMsg('');
      }, 1500);
    } catch (err) {
      setErrorMsg(err.message || 'สมัครสมาชิกไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider) => {
    setLoading(true);
    setErrorMsg('');
    try {
      await signInWithOAuth(provider);
    } catch (err) {
      if (err.message?.includes('provider is not enabled') || err.message?.includes('Unsupported provider')) {
        setErrorMsg('Supabase ยังไม่ได้เปิดใช้งาน Google Provider — กรุณาสมัครหรือเข้าสู่ระบบด้วย อีเมล และ รหัสผ่าน ด้านล่างนี้แทนครับ (พร้อมใช้งานทันที)');
      } else {
        setErrorMsg(err.message || 'เชื่อมต่อ Google ไม่สำเร็จ');
      }
      setLoading(false);
    }
  };

  const handleSaveConfig = (e) => {
    e.preventDefault();
    if (!supabaseUrl || !supabaseKey) {
      setErrorMsg('กรุณากรอก Supabase URL และ Anon Key ให้ครบถ้วน');
      return;
    }

    updateConfig(supabaseUrl, supabaseKey);
    setSuccessMsg('บันทึกการตั้งค่า Supabase เรียบร้อยแล้ว!');
    setErrorMsg('');
    setTimeout(() => {
      setMode('login');
      setSuccessMsg('');
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0a0f19] border border-cyan-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-cyan-500/10 text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          aria-label="ปิดหน้าต่าง"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 shrink-0">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span>SWM Global Cloud Account</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              ซิงค์ข้อมูลมอนสเตอร์และรูน ใช้งานได้จากทุกที่ทั่วโลก
            </p>
          </div>
        </div>

        {/* Config Warning Notice if not configured */}
        {!isConfigured && mode !== 'config' && (
          <div className="mb-5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block">ยังไม่ได้เชื่อมต่อ Supabase Project</span>
              กรุณาใส่ Supabase URL & Anon Key (ฟรี 100%) เพื่อเปิดใช้งานระบบคลาวด์
              <button
                type="button"
                onClick={() => setMode('config')}
                className="mt-2 text-cyan-400 hover:text-cyan-300 font-bold underline flex items-center gap-1 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" /> ไปที่หน้าตั้งค่า Supabase
              </button>
            </div>
          </div>
        )}

        {/* Status Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Logged in state */}
        {user ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center font-bold text-lg text-white">
                {user.email ? user.email.slice(0, 2).toUpperCase() : 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate text-white">{user.email}</div>
                <div className="text-xs text-emerald-400 flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> เชื่อมต่อคลาวด์เรียบร้อยแล้ว
                </div>
              </div>
            </div>

            <button
              onClick={async () => {
                await signOut();
                setSuccessMsg('ออกจากระบบเรียบร้อยแล้ว');
                setTimeout(() => setSuccessMsg(''), 2000);
              }}
              className="w-full py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition cursor-pointer"
            >
              ออกจากระบบ (Sign Out)
            </button>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex p-1 mb-5 rounded-2xl bg-[#070b12] border border-white/10 text-xs font-bold">
              <button
                onClick={() => { setMode('login'); setErrorMsg(''); }}
                className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'login' ? 'bg-cyan-500/20 text-cyan-300 shadow-sm border border-cyan-500/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" /> เข้าสู่ระบบ
              </button>
              <button
                onClick={() => { setMode('signup'); setErrorMsg(''); }}
                className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'signup' ? 'bg-cyan-500/20 text-cyan-300 shadow-sm border border-cyan-500/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" /> สมัครสมาชิก
              </button>
              <button
                onClick={() => { setMode('config'); setErrorMsg(''); }}
                className={`px-3 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'config' ? 'bg-cyan-500/20 text-cyan-300 shadow-sm border border-cyan-500/30' : 'text-slate-400 hover:text-white'
                }`}
                title="ตั้งค่า Supabase Project"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Config Mode */}
            {mode === 'config' ? (
              <form onSubmit={handleSaveConfig} className="space-y-4">
                <div className="text-xs text-slate-400">
                  ใส่ URL และ Anon Key จากแดชบอร์ดของ Supabase ฟรีที่{' '}
                  <a
                    href="https://supabase.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:underline inline-flex items-center gap-0.5"
                  >
                    supabase.com <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Supabase Project URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://xyzcompany.supabase.co"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Supabase Anon Public Key
                  </label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition cursor-pointer"
                  >
                    บันทึกการตั้งค่า
                  </button>
                  {isConfigured && (
                    <button
                      type="button"
                      onClick={removeConfig}
                      className="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition cursor-pointer"
                    >
                      ล้างค่า
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                {/* Email Form as Primary */}
                <form onSubmit={mode === 'login' ? handleSignIn : handleSignUp} className="space-y-3.5">
                  <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>กรอกอีเมลและรหัสผ่านเพื่อเข้าใช้งานได้ทันที (ยืนยันอัตโนมัติ 100%)</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">อีเมล (Email)</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        placeholder="yourname@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={!isConfigured}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">รหัสผ่าน (Password)</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={!isConfigured}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {mode === 'signup' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">ยืนยันรหัสผ่าน</label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          disabled={!isConfigured}
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition disabled:opacity-50"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !isConfigured}
                    className="w-full py-2.5 mt-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{mode === 'login' ? 'เข้าสู่ระบบ (Sign In)' : 'สร้างบัญชีผู้ใช้ (Sign Up)'}</span>
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
