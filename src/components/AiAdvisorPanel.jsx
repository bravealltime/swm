import React, { useState, useRef } from 'react';
import { Sparkles, Loader2, AlertTriangle, RotateCcw } from 'lucide-react';
import { askAdvisor } from '../services/aiClient';

// Very small markdown: headings (#, **bold** lines), bullets (-, •, 1.), paragraphs.
function renderAnswer(text) {
  const lines = String(text).split(/\r?\n/);
  const out = [];
  let list = null;
  const flush = () => { if (list) { out.push(<ul key={`ul-${out.length}`} className="list-disc pl-5 space-y-1">{list}</ul>); list = null; } };
  const inline = (s) => s.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') ? <strong key={i} className="text-white">{part.slice(2, -2)}</strong> : part
  );
  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (!line) { flush(); return; }
    const bullet = line.match(/^(?:[-•*]|\d+[.)])\s+(.*)$/);
    if (bullet) { (list ||= []).push(<li key={i}>{inline(bullet[1])}</li>); return; }
    flush();
    const heading = line.match(/^#{1,4}\s+(.*)$/) || (line.startsWith('**') && line.endsWith('**') && [null, line.slice(2, -2)]);
    if (heading) out.push(<h4 key={i} className="text-sm font-bold text-amber-300 mt-3 first:mt-0">{heading[1]}</h4>);
    else out.push(<p key={i} className="leading-relaxed">{inline(line)}</p>);
  });
  flush();
  return out;
}

/**
 * Button + answer box for the grounded advisor. `buildPayload` is called on click so the
 * panel always sends the caller's current state. `resetKey` clears the answer when it changes.
 */
export default function AiAdvisorPanel({ buildPayload, resetKey, label = 'ให้ AI วิเคราะห์', hint, className = '' }) {
  const IDLE = { status: 'idle', answer: '', error: '', authenticated: false };
  const [state, setState] = useState(IDLE);
  const [seenKey, setSeenKey] = useState(resetKey);
  const controllerRef = useRef(null);

  // The caller's selection changed: drop the old answer (state adjustment during render).
  // A stale in-flight request is ignored in run() because it checks the key it was started with.
  if (resetKey !== seenKey) {
    setSeenKey(resetKey);
    setState(IDLE);
  }

  const run = async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const startedFor = resetKey;
    setState((s) => ({ ...s, status: 'loading', error: '' }));
    try {
      const res = await askAdvisor(buildPayload(), { signal: controller.signal });
      if (controllerRef.current !== controller || startedFor !== resetKey) return;
      setState({ status: 'done', answer: res.answer, error: '', authenticated: !!res.authenticated });
    } catch (err) {
      if (err?.name === 'AbortError' || controllerRef.current !== controller) return;
      setState((s) => ({ ...s, status: 'error', error: err.message || 'AI ไม่ตอบสนอง' }));
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
        <button
          onClick={run}
          disabled={state.status === 'loading'}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          {state.status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : state.status === 'done' ? <RotateCcw className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
          {state.status === 'loading' ? 'กำลังวิเคราะห์ (อาจใช้เวลาถึง 1 นาที)...' : state.status === 'done' ? 'วิเคราะห์อีกครั้ง' : label}
        </button>
      </div>

      {state.status === 'error' && (
        <div role="alert" className="mt-3 p-3 rounded-xl border border-rose-500/30 bg-rose-500/5 text-xs text-rose-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {state.error}
        </div>
      )}

      {state.status === 'done' && (
        <div className="mt-3 p-4 rounded-xl bg-[#0a0f18] border border-slate-800 text-sm text-slate-200 space-y-2">
          {renderAnswer(state.answer)}
          <p className="text-[11px] text-slate-500 pt-2 border-t border-white/[0.06]">
            คำตอบสร้างโดย AI จากสกิล/สถิติในฐานข้อมูล SWM — ตรวจสอบก่อนใช้จริง{state.authenticated ? '' : ' • เข้าสู่ระบบเพื่อถามได้ถี่ขึ้น'}
          </p>
        </div>
      )}
    </div>
  );
}
