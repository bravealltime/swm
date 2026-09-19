import React, { useState, useRef } from 'react';
import { Sparkles, Loader2, AlertTriangle, RotateCcw, LogIn } from 'lucide-react';
import { askAdvisor, requestLogin, quotaLabel } from '../services/aiClient';
import AiAnswer from './AiAnswer';
import { useOptionalAuth } from '../contexts/AuthContext';

/**
 * Button + answer box for the grounded advisor. `buildPayload` is called on click so the
 * panel always sends the caller's current state. `resetKey` clears the answer when it changes.
 */
export default function AiAdvisorPanel({ buildPayload, resetKey, label = 'ให้ AI วิเคราะห์', hint, className = '' }) {
  const IDLE = { status: 'idle', answer: '', error: '', code: '', quota: null };
  const [state, setState] = useState(IDLE);
  const { user, session } = useOptionalAuth();
  const [seenKey, setSeenKey] = useState(resetKey);
  const controllerRef = useRef(null);

  // The caller's selection changed: drop the old answer (state adjustment during render).
  // A stale in-flight request is ignored in run() because it checks the key it was started with.
  if (resetKey !== seenKey) {
    setSeenKey(resetKey);
    setState(IDLE);
  }

  // Auto-clear LOGIN_REQUIRED and auto-run when user logs in
  const prevUserRef = useRef(user);
  useEffect(() => {
    const prevUser = prevUserRef.current;
    prevUserRef.current = user;
    if (!prevUser && user) {
      if (state.code === 'LOGIN_REQUIRED') {
        setState(IDLE);
        run();
      }
    }
  }, [user, state.code]);

  const run = async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const startedFor = resetKey;
    setState((s) => ({ ...s, status: 'loading', error: '' }));
    try {
      const res = await askAdvisor(buildPayload(), { signal: controller.signal, token: session?.access_token });
      if (controllerRef.current !== controller || startedFor !== resetKey) return;
      setState({ status: 'done', answer: res.answer, error: '', code: '', quota: res.quota || null });
    } catch (err) {
      if (err?.name === 'AbortError' || controllerRef.current !== controller) return;
      setState((s) => ({ ...s, status: 'error', error: err.message || 'AI ไม่ตอบสนอง', code: err.code || '', quota: err.quota || s.quota }));
    }
  };

  return (
    <div className={`rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.06] to-transparent p-4 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 shrink-0"><Sparkles className="w-4 h-4" /></div>
          <div>
            <div className="text-sm font-bold text-white">โค้ช AI (อิงข้อมูลสกิลในระบบ)</div>
            <div className="text-[11px] text-slate-400">{hint || 'อธิบายกลไก ลำดับเทิร์น และจุดเสี่ยง จากสกิลจริงของมอนสเตอร์ในดราฟต์'}</div>
          </div>
        </div>
        {user ? (
          <button
            onClick={run}
            disabled={state.status === 'loading'}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            {state.status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : state.status === 'done' ? <RotateCcw className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            {state.status === 'loading' ? 'กำลังวิเคราะห์ (อาจใช้เวลาถึง 1 นาที)...' : state.status === 'done' ? 'วิเคราะห์อีกครั้ง' : label}
          </button>
        ) : (
          <button
            onClick={requestLogin}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shrink-0"
            title="โค้ช AI เปิดให้เฉพาะสมาชิก"
          >
            <LogIn className="w-4 h-4" /> เข้าสู่ระบบเพื่อใช้โค้ช AI
          </button>
        )}
      </div>

      {!user && state.status === 'idle' && (
        <p className="mt-2 text-[11px] text-slate-500">สมาชิกถามโค้ช AI ได้วันละไม่กี่คำถาม (นับต่อบัญชีและต่อ IP) — เข้าสู่ระบบฟรีด้วยอีเมล</p>
      )}
      {state.status === 'error' && (
        <div role="alert" className="mt-3 p-3 rounded-xl border border-rose-500/30 bg-rose-500/5 text-xs text-rose-200 flex items-center justify-between gap-2 flex-wrap">
          <span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 shrink-0" /> {state.error}</span>
          {state.code === 'LOGIN_REQUIRED' && !user ? (
            <button onClick={requestLogin} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer shrink-0"><LogIn className="w-3 h-3" /> เข้าสู่ระบบ</button>
          ) : (
            <button onClick={run} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-100 cursor-pointer shrink-0"><RotateCcw className="w-3 h-3" /> ลองใหม่</button>
          )}
        </div>
      )}

      {state.status === 'done' && (
        <div className="mt-3 p-4 rounded-xl bg-[#0a0f18] border border-slate-800">
          <AiAnswer text={state.answer} />
          <p className="text-[11px] text-slate-500 pt-2 border-t border-white/[0.06]">
            คำตอบสร้างโดย AI จากสกิล/สถิติในฐานข้อมูล SWM — ตรวจสอบก่อนใช้จริง{quotaLabel(state.quota) ? ` • ${quotaLabel(state.quota)}` : ''}
          </p>
        </div>
      )}
    </div>
  );
}
