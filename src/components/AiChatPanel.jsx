import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, AlertTriangle, Trash2, Sparkles, Copy, Check, RotateCcw, MessageCircle } from 'lucide-react';
import { askAdvisor } from '../services/aiClient';
import AiAnswer from './AiAnswer';

const DEFAULT_FOLLOW_UPS = ['อธิบายเพิ่มอีกหน่อย', 'ลำดับเทิร์นควรเป็นยังไง', 'มีทางเลือกอื่นไหม'];

function CoachAvatar({ thinking = false }) {
  return (
    <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center border ${thinking ? 'border-amber-400/60 bg-amber-500/20' : 'border-amber-500/40 bg-gradient-to-br from-amber-400/30 to-orange-600/30'}`}>
      <Sparkles className={`w-4 h-4 text-amber-200 ${thinking ? 'animate-pulse' : ''}`} />
    </div>
  );
}

function Elapsed({ since }) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const tick = () => setSeconds(Math.max(0, Math.round((Date.now() - since) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [since]);
  return <span className="tabular-nums">{seconds} วิ</span>;
}

function CopyButton({ text }) {
  const [done, setDone] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard?.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); }}
      className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-white cursor-pointer" aria-label="คัดลอกคำตอบ">
      {done ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />} {done ? 'คัดลอกแล้ว' : 'คัดลอก'}
    </button>
  );
}

/**
 * Free-text chat with the grounded coach. `buildContext()` returns what the server should know
 * about the current screen (box summary, defense, draft, monsters to look up); it receives the question.
 */
export default function AiChatPanel({
  buildContext, suggestions = [], followUps = DEFAULT_FOLLOW_UPS, title = 'โค้ช AI', subtitle = 'ตอบเฉพาะเรื่อง Summoners War • อิงสกิล/สถิติในฐานข้อมูล SWM และกล่องของคุณ (ถ้ามี)',
  placeholder = 'พิมพ์คำถาม เช่น จัดทีม GB12 จากกล่องฉัน...', compact = false, className = '', initialQuestion = '',
}) {
  const [messages, setMessages] = useState([]); // { role: 'user' | 'ai', text, at, seconds }
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | error
  const [error, setError] = useState('');
  const [startedAt, setStartedAt] = useState(0);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }); }, [messages, status]);

  // A question handed in by the parent (e.g. the home search box) is asked once per value
  const askedRef = useRef('');
  useEffect(() => {
    if (initialQuestion && askedRef.current !== initialQuestion) {
      askedRef.current = initialQuestion;
      ask(initialQuestion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion]);

  const ask = async (question) => {
    const q = String(question || '').trim();
    if (!q || status === 'loading') return;
    setInput('');
    setError('');
    const history = messages.slice(-4);
    setMessages((m) => [...m, { role: 'user', text: q, at: Date.now() }]);
    const t0 = Date.now();
    setStartedAt(t0);
    setStatus('loading');
    try {
      const res = await askAdvisor({ kind: 'chat', question: q, context: buildContext ? buildContext(q) : {}, history });
      setMessages((m) => [...m, { role: 'ai', text: res.answer, at: Date.now(), seconds: Math.round((Date.now() - t0) / 1000) }]);
      setStatus('idle');
    } catch (err) {
      setError(err.message || 'AI ไม่ตอบสนอง');
      setStatus('error');
    }
  };

  const retry = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUser) return;
    setMessages((m) => m.slice(0, m.lastIndexOf(lastUser)));
    setTimeout(() => ask(lastUser.text), 0);
  };

  const lastIsAi = messages.length > 0 && messages[messages.length - 1].role === 'ai';

  return (
    <div className={`rounded-2xl border border-amber-500/25 bg-[#0b1019] shadow-[0_10px_40px_-20px_rgba(245,158,11,0.35)] overflow-hidden ${className}`}>
      {/* header */}
      <div className={`flex items-center justify-between gap-3 ${compact ? 'px-3 py-2.5' : 'px-4 py-3'} border-b border-white/[0.06] bg-gradient-to-r from-amber-500/[0.08] to-transparent`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <CoachAvatar thinking={status === 'loading'} />
          <div className="min-w-0">
            <div className="text-sm font-bold text-white flex items-center gap-2 truncate">
              {title}
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${status === 'loading' ? 'bg-amber-500/15 border-amber-500/40 text-amber-200' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status === 'loading' ? 'bg-amber-300 animate-pulse' : 'bg-emerald-400'}`} />
                {status === 'loading' ? 'กำลังคิด' : 'พร้อม'}
              </span>
            </div>
            {!compact && <div className="text-[11px] text-slate-400 truncate">{subtitle}</div>}
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={() => { setMessages([]); setError(''); setStatus('idle'); }} className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer shrink-0"><Trash2 className="w-3 h-3" /> เริ่มใหม่</button>
        )}
      </div>

      {/* conversation */}
      {(messages.length > 0 || status === 'loading') && (
        <div ref={listRef} className={`max-h-[460px] overflow-y-auto ${compact ? 'p-3' : 'p-4'} space-y-3`}>
          {messages.map((m, i) => m.role === 'user' ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[88%] sm:max-w-[75%] rounded-2xl rounded-br-md px-3.5 py-2 bg-blue-600/25 border border-blue-500/30 text-sm text-blue-50">{m.text}</div>
            </div>
          ) : (
            <div key={i} className="flex gap-2.5">
              <CoachAvatar />
              <div className="min-w-0 flex-1">
                <div className="text-[11px] text-slate-500 mb-1 flex items-center gap-2">โค้ช SWM {m.seconds ? <span>• ตอบใน {m.seconds} วิ</span> : null}</div>
                <div className="rounded-2xl rounded-tl-md px-4 py-3 bg-[#111827]/80 border border-white/[0.08]">
                  <AiAnswer text={m.text} />
                  <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-500">สร้างโดย AI — ตรวจสอบก่อนใช้จริง</span>
                    <CopyButton text={m.text} />
                  </div>
                </div>
              </div>
            </div>
          ))}

          {status === 'loading' && (
            <div className="flex gap-2.5">
              <CoachAvatar thinking />
              <div className="min-w-0 flex-1">
                <div className="text-[11px] text-slate-500 mb-1 flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin text-amber-300" /> โค้ชกำลังอ่านข้อมูลสกิลและคิดคำตอบ… <Elapsed since={startedAt} /> (ไม่เกิน ~1 นาที)</div>
                <div className="rounded-2xl rounded-tl-md px-4 py-3 bg-[#111827]/60 border border-white/[0.06] space-y-2">
                  <div className="h-3 w-2/5 rounded bg-white/[0.08] animate-pulse" />
                  <div className="h-3 w-full rounded bg-white/[0.06] animate-pulse" />
                  <div className="h-3 w-5/6 rounded bg-white/[0.06] animate-pulse" />
                  <div className="h-3 w-3/5 rounded bg-white/[0.05] animate-pulse" />
                </div>
              </div>
            </div>
          )}

          {lastIsAi && status === 'idle' && followUps.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pl-[42px]">
              <span className="text-[10px] text-slate-500">ถามต่อ:</span>
              {followUps.map((s) => (
                <button key={s} onClick={() => ask(s)} className="px-2 py-1 rounded-lg text-[11px] bg-white/[0.03] hover:bg-amber-500/15 border border-white/10 hover:border-amber-500/40 text-slate-300 hover:text-amber-100 cursor-pointer">{s}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {status === 'error' && (
        <div role="alert" className="mx-4 mb-3 p-3 rounded-xl border border-rose-500/30 bg-rose-500/5 text-xs text-rose-200 flex items-center justify-between gap-2">
          <span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 shrink-0" /> {error}</span>
          <button onClick={retry} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-100 cursor-pointer shrink-0"><RotateCcw className="w-3 h-3" /> ลองใหม่</button>
        </div>
      )}

      {/* suggestions when the chat is empty */}
      {messages.length === 0 && status !== 'loading' && suggestions.length > 0 && (
        <div className={`${compact ? 'px-3 pt-3' : 'px-4 pt-4'} flex flex-wrap gap-1.5`}>
          <span className="text-[11px] text-slate-500 self-center flex items-center gap-1"><MessageCircle className="w-3 h-3" /> ลองถาม:</span>
          {suggestions.map((s) => (
            <button key={s} onClick={() => ask(s)} className="px-2.5 py-1 rounded-lg text-[11px] bg-white/[0.04] hover:bg-amber-500/15 border border-white/10 hover:border-amber-500/40 text-slate-300 hover:text-amber-100 cursor-pointer">{s}</button>
          ))}
        </div>
      )}

      {/* composer */}
      <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className={`${compact ? 'p-3' : 'p-4'} flex items-center gap-2`}>
        <div className="flex-1 min-w-0 flex items-center gap-2 bg-[#0d1422] border border-white/10 focus-within:border-amber-400 rounded-2xl px-3.5 py-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            maxLength={500}
            disabled={status === 'loading'}
            className="flex-1 min-w-0 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none disabled:opacity-60"
          />
          {input.length > 400 && <span className="text-[10px] text-slate-500 tabular-nums">{input.length}/500</span>}
        </div>
        <button type="submit" disabled={status === 'loading' || !input.trim()} aria-label="ส่งคำถาม"
          className="w-10 h-10 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 cursor-pointer flex items-center justify-center shrink-0">
          {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
      {!compact && <p className="px-4 pb-3 -mt-2 text-[10px] text-slate-500">ผู้ใช้ทั่วไป 3 คำถาม/นาที • เข้าสู่ระบบได้ 12 คำถาม/นาที</p>}
    </div>
  );
}
