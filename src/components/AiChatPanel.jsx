import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Loader2, AlertTriangle, Trash2, Sparkles } from 'lucide-react';
import { askAdvisor } from '../services/aiClient';

// Tiny markdown for answers: bullets, numbered items, **bold**, blank-line paragraphs.
function renderAnswer(text) {
  const inline = (s) => s.split(/(\*\*[^*]+\*\*)/g).map((part, i) => (part.startsWith('**') ? <strong key={i} className="text-white">{part.slice(2, -2)}</strong> : part));
  const out = [];
  let list = null;
  const flush = () => { if (list) { out.push(<ul key={`ul-${out.length}`} className="list-disc pl-5 space-y-0.5">{list}</ul>); list = null; } };
  String(text).split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim();
    if (!line) { flush(); return; }
    const bullet = line.match(/^(?:[-•*]|\d+[.)])\s+(.*)$/);
    if (bullet) { (list ||= []).push(<li key={i}>{inline(bullet[1])}</li>); return; }
    flush();
    const heading = line.match(/^#{1,4}\s+(.*)$/);
    if (heading) out.push(<div key={i} className="font-bold text-amber-300 mt-2 first:mt-0">{heading[1]}</div>);
    else out.push(<p key={i}>{inline(line)}</p>);
  });
  flush();
  return out;
}

/**
 * Free-text chat with the grounded coach. `buildContext()` returns what the server should know
 * about the current screen (box summary, defense, draft, monsters to look up).
 */
export default function AiChatPanel({ buildContext, suggestions = [], title = 'ถามโค้ช AI', placeholder = 'พิมพ์คำถาม เช่น จัดทีม GB12 จากกล่องฉัน...', compact = false, className = '' }) {
  const [messages, setMessages] = useState([]); // { role: 'user' | 'ai', text }
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | error
  const [error, setError] = useState('');
  const listRef = useRef(null);

  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }); }, [messages, status]);

  const ask = async (question) => {
    const q = String(question || '').trim();
    if (!q || status === 'loading') return;
    setInput('');
    setError('');
    const history = messages.slice(-4);
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setStatus('loading');
    try {
      const res = await askAdvisor({ kind: 'chat', question: q, context: buildContext ? buildContext() : {}, history });
      setMessages((m) => [...m, { role: 'ai', text: res.answer }]);
      setStatus('idle');
    } catch (err) {
      setError(err.message || 'AI ไม่ตอบสนอง');
      setStatus('error');
    }
  };

  return (
    <div className={`rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.05] to-transparent ${compact ? 'p-3' : 'p-4'} ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 text-sm font-bold text-white"><MessageCircle className="w-4 h-4 text-amber-300" /> {title}</div>
        {messages.length > 0 && (
          <button onClick={() => { setMessages([]); setError(''); setStatus('idle'); }} className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"><Trash2 className="w-3 h-3" /> ล้าง</button>
        )}
      </div>

      {messages.length === 0 && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {suggestions.map((s) => (
            <button key={s} onClick={() => ask(s)} className="px-2.5 py-1 rounded-lg text-[11px] bg-white/[0.04] hover:bg-amber-500/15 border border-white/10 hover:border-amber-500/40 text-slate-300 hover:text-amber-100 cursor-pointer flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> {s}
            </button>
          ))}
        </div>
      )}

      {(messages.length > 0 || status === 'loading') && (
        <div ref={listRef} className="max-h-[420px] overflow-y-auto space-y-2 mb-2 pr-1">
          {messages.map((m, i) => (
            <div key={i} className={`text-sm leading-relaxed ${m.role === 'user' ? 'ml-6 sm:ml-12' : 'mr-2'}`}>
              <div className={`rounded-xl px-3 py-2 ${m.role === 'user' ? 'bg-blue-600/20 border border-blue-500/30 text-blue-50' : 'bg-[#0a0f18] border border-slate-800 text-slate-200 space-y-1'}`}>
                {m.role === 'user' ? m.text : renderAnswer(m.text)}
              </div>
            </div>
          ))}
          {status === 'loading' && <div className="text-xs text-slate-400 flex items-center gap-2 px-1"><Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" /> โค้ชกำลังคิด (อาจถึง 1 นาที)...</div>}
        </div>
      )}

      {status === 'error' && (
        <div role="alert" className="mb-2 p-2.5 rounded-xl border border-rose-500/30 bg-rose-500/5 text-xs text-rose-200 flex items-center gap-2"><AlertTriangle className="w-4 h-4 shrink-0" /> {error}</div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          maxLength={500}
          disabled={status === 'loading'}
          className="flex-1 min-w-0 bg-[#0d1422] border border-white/10 focus:border-amber-400 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none disabled:opacity-60"
        />
        <button type="submit" disabled={status === 'loading' || !input.trim()} aria-label="ส่งคำถาม"
          className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 cursor-pointer">
          {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
      <p className="text-[10px] text-slate-500 mt-1.5">คำตอบอิงสกิล/สถิติในฐานข้อมูล SWM และกล่องของคุณ (ถ้ามี) — ผู้ใช้ทั่วไป 3 คำถาม/นาที เข้าสู่ระบบได้ 12</p>
    </div>
  );
}
