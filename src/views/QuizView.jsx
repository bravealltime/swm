import React, { useEffect, useMemo, useState } from 'react';
import { Sparkles, Share2, Copy, Check, RefreshCw, Flame, ChevronRight, BookOpen, Trophy } from 'lucide-react';
import MonsterAvatar from '../components/MonsterAvatar';
import { MONSTERS } from '../data/monsters';
import guardianMeta from '../data/swrtGuardianMeta.json';
import { resolveSkillId, loadMonsterSkills } from '../data/monsterSkills';
import { bangkokDate, seedFrom, pickRound, pickSkill, maskText, shareText, scoreLabel, QUESTIONS_PER_ROUND } from '../utils/quiz';

const card = 'rounded-2xl border border-white/[0.08] bg-[#0a0f19]/80';
const QUIZ_URL = 'https://swm-blue.vercel.app/quiz';
const MIN_PICKS = 10;

// Guardian-meta monsters (picked at least MIN_PICKS times in replays) that have skills and art
const BY_ID = new Map(MONSTERS.map((m) => [m.id, m]));
const POOL = (guardianMeta.monsters || [])
  .filter((m) => m.picks >= MIN_PICKS)
  .map((m) => BY_ID.get(`m-${m.id}`))
  .filter((m) => m && resolveSkillId(m))
  .map((m) => ({ id: m.id, element: m.element, stars: m.stars }));

const storage = {
  get(key, fallback) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ } },
};
const dayBefore = (date) => new Date(new Date(`${date}T00:00:00Z`).getTime() - 86400e3).toISOString().slice(0, 10);

/** Loads the skill text for every question of a round; returns null entries for monsters without usable text. */
async function buildQuestions(round, seed) {
  return Promise.all(round.map(async (q) => {
    const rec = await loadMonsterSkills(q.answerId).catch(() => null);
    const pick = rec ? pickSkill(rec.skills, seed + q.n * 7919) : null;
    if (!pick) return null;
    const m = BY_ID.get(q.answerId);
    const names = [m.name, m.thaiName, m.family, m.thaiFamily, m.unawakenedName, pick.s.name];
    return {
      ...q,
      text: maskText(pick.s.descriptionTh, names),
      skillName: pick.s.name,
      slot: pick.s.slotLabel || `S${pick.i + 1}`,
      effects: (pick.s.effects || []).map((e) => e.nameTh || e.name).filter(Boolean).slice(0, 4),
    };
  }));
}

export default function QuizView({ onNavigate }) {
  const today = bangkokDate();
  const [mode, setMode] = useState('daily'); // daily | practice
  const [seed, setSeed] = useState(() => seedFrom(`daily:${today}`));
  const [loaded, setLoaded] = useState(null); // { seed, list } — a mismatch with `seed` means "still loading"
  const [i, setI] = useState(0);
  const [results, setResults] = useState([]);
  const [picked, setPicked] = useState(null);
  const [saved] = useState(() => storage.get(`swm:quiz:daily:${today}`, null));
  const [streak, setStreak] = useState(() => storage.get('swm:quiz:streak', { last: '', count: 0 }));
  const [copied, setCopied] = useState(false);

  const round = useMemo(() => pickRound(POOL, seed), [seed]);
  const questions = loaded?.seed === seed ? loaded.list : null;

  useEffect(() => {
    let alive = true;
    buildQuestions(round, seed).then((qs) => { if (alive) setLoaded({ seed, list: qs.filter(Boolean) }); });
    return () => { alive = false; };
  }, [round, seed]);

  const done = questions && results.length >= questions.length;

  // the daily result is stored once when the last answer lands, and the day streak with it
  const recordDaily = (finalResults) => {
    storage.set(`swm:quiz:daily:${today}`, { results: finalResults });
    setStreak((s) => {
      if (s.last === today) return s;
      const next = { last: today, count: s.last === dayBefore(today) ? s.count + 1 : 1 };
      storage.set('swm:quiz:streak', next);
      return next;
    });
  };

  const answer = (choiceId) => {
    if (picked !== null || !questions) return;
    setPicked(choiceId);
    const ok = choiceId === questions[i].answerId;
    const next = [...results, ok];
    setTimeout(() => {
      setResults(next);
      setPicked(null);
      setI((n) => n + 1);
      if (mode === 'daily' && next.length >= questions.length) recordDaily(next);
    }, 1100);
  };

  const startPractice = () => { setMode('practice'); setSeed(Math.floor(Math.random() * 2 ** 31)); setI(0); setResults([]); setPicked(null); };
  const backToDaily = () => { setMode('daily'); setSeed(seedFrom(`daily:${today}`)); setI(0); setResults([]); setPicked(null); };

  const finalResults = done ? results : (mode === 'daily' && saved?.results) || null;
  const share = finalResults ? shareText({ date: mode === 'daily' ? today : 'โหมดฝึก', results: finalResults, url: QUIZ_URL }) : '';
  const copy = async () => { try { await navigator.clipboard.writeText(share); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ } };
  const nativeShare = () => navigator.share?.({ text: share }).catch(() => {});
  const lineUrl = `https://line.me/R/share?text=${encodeURIComponent(share)}`;

  const q = questions && !done ? questions[i] : null;
  const answerMonster = q ? BY_ID.get(q.answerId) : null;

  return (
    <div className="space-y-5 max-w-3xl mx-auto pb-16 animate-fadeIn">
      <div className="border-b border-[#1c2738] pb-5">
        <div className="flex items-center gap-2 text-xs font-mono text-fuchsia-400 uppercase tracking-wider mb-1"><Sparkles className="w-4 h-4" /> Daily skill quiz • {POOL.length} มอนสเตอร์เมต้า Guardian</div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">ทายมอนจากสกิล</h1>
        <p className="text-sm text-slate-400 mt-1 leading-relaxed">อ่านคำอธิบายสกิลภาษาไทย แล้วทายว่าเป็นของมอนสเตอร์ตัวไหน วันละ {QUESTIONS_PER_ROUND} ข้อ ทุกคนได้โจทย์ชุดเดียวกัน — แชร์ผลแข่งกับเพื่อนได้</p>
        <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
          <span className={`px-2.5 py-1 rounded-lg font-bold ${mode === 'daily' ? 'bg-fuchsia-600 text-white' : 'bg-white/[0.04] text-slate-300'}`}>ชุดวันที่ {today}</span>
          {streak.count > 0 && <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold flex items-center gap-1"><Flame className="w-3.5 h-3.5" /> เล่นต่อเนื่อง {streak.count} วัน</span>}
          {mode === 'practice' && <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-bold">โหมดฝึก (สุ่มไม่จำกัด)</span>}
        </div>
      </div>

      {/* progress */}
      {questions && (
        <div className="flex items-center gap-1.5">
          {Array.from({ length: questions.length }, (_, k) => (
            <span key={k} className={`h-2 flex-1 rounded-full ${k < (finalResults || results).length ? ((finalResults || results)[k] ? 'bg-emerald-400' : 'bg-rose-500') : k === i && !finalResults ? 'bg-fuchsia-400 animate-pulse' : 'bg-white/10'}`} />
          ))}
          <span className="text-[11px] font-mono text-slate-400 ml-1">{Math.min((finalResults || results).length + (finalResults ? 0 : 1), questions.length)}/{questions.length}</span>
        </div>
      )}

      {!questions ? (
        <div className={`${card} p-10 text-center text-slate-400 text-sm`}><RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-fuchsia-400" /> กำลังหยิบสกิล {QUESTIONS_PER_ROUND} ข้อ…</div>
      ) : finalResults ? (
        <ResultCard results={finalResults} mode={mode} streak={streak} copied={copied} onCopy={copy} onLine={lineUrl} onShare={navigator.share ? nativeShare : null} onPractice={startPractice} onDaily={mode === 'practice' ? backToDaily : null} questions={questions} onNavigate={onNavigate} />
      ) : q ? (
        <div className={`${card} p-5 sm:p-6 space-y-5`}>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ข้อ {q.n} · สกิลนี้เป็นของมอนสเตอร์ตัวไหน?</div>
            <p className="text-base sm:text-lg text-white leading-relaxed mt-2">“{q.text}”</p>
            {q.effects.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">{q.effects.map((e) => <span key={e} className="text-[11px] px-2 py-0.5 rounded-lg bg-white/[0.05] border border-white/10 text-slate-300">{e}</span>)}</div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {q.choiceIds.map((id) => {
              const m = BY_ID.get(id);
              const isAnswer = id === q.answerId;
              const state = picked === null ? 'idle' : isAnswer ? 'right' : picked === id ? 'wrong' : 'dim';
              return (
                <button key={id} onClick={() => answer(id)} disabled={picked !== null}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer disabled:cursor-default ${
                    state === 'right' ? 'bg-emerald-500/15 border-emerald-400 ring-1 ring-emerald-400' : state === 'wrong' ? 'bg-rose-500/15 border-rose-500' : state === 'dim' ? 'opacity-40 border-white/10' : 'bg-white/[0.03] border-white/10 hover:border-fuchsia-400/60 hover:bg-fuchsia-500/[0.06]'}`}>
                  {m && <MonsterAvatar monster={m} size="sm" showStars={false} />}
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-white truncate">{m?.name || id}</div>
                    <div className="text-[11px] text-slate-400 truncate">{m?.thaiName && m.thaiName !== m.name ? m.thaiName : m?.family || ''}</div>
                  </div>
                </button>
              );
            })}
          </div>
          {picked !== null && answerMonster && (
            <div className={`text-sm flex flex-wrap items-center justify-between gap-2 ${picked === q.answerId ? 'text-emerald-300' : 'text-rose-300'}`}>
              <span>{picked === q.answerId ? '✓ ถูกต้อง' : `✗ คำตอบคือ ${answerMonster.name}`} — {q.slot} {q.skillName}</span>
              <button onClick={() => onNavigate?.('catalog', { initialMonster: answerMonster.name })} className="text-xs text-cyan-400 hover:text-white font-bold flex items-center gap-1 cursor-pointer"><BookOpen className="w-3.5 h-3.5" /> ดูสกิลเต็ม <ChevronRight className="w-3 h-3" /></button>
            </div>
          )}
        </div>
      ) : null}

      <p className="text-[11px] text-slate-500">โจทย์สุ่มจากมอนสเตอร์ที่ถูกดราฟต์ในรีเพลย์ Guardian ซีซั่นนี้ (SWRT) ชุดใหม่ทุกวันเวลา 00:00 น. — ผลเก็บในเครื่องนี้เท่านั้น</p>
    </div>
  );
}

function ResultCard({ results, mode, streak, copied, onCopy, onLine, onShare, onPractice, onDaily, questions, onNavigate }) {
  const score = results.filter(Boolean).length;
  return (
    <div className={`${card} p-5 sm:p-6 space-y-5`}>
      <div className="text-center">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1"><Trophy className="w-3.5 h-3.5 text-amber-300" /> {mode === 'daily' ? 'ผลของวันนี้' : 'ผลโหมดฝึก'}</div>
        <div className="text-5xl font-black font-mono text-white mt-2">{score}<span className="text-2xl text-slate-500">/{results.length}</span></div>
        <div className="text-sm text-fuchsia-300 font-bold mt-1">{scoreLabel(score, results.length)}</div>
        <div className="text-2xl mt-3 tracking-wider">{results.map((r) => (r ? '🟩' : '🟥')).join('')}</div>
        {mode === 'daily' && streak.count > 1 && <div className="text-xs text-amber-300 mt-2">🔥 เล่นต่อเนื่อง {streak.count} วัน</div>}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button onClick={onCopy} className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-slate-100 text-xs font-bold flex items-center gap-1.5 cursor-pointer">{copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />} {copied ? 'คัดลอกแล้ว' : 'คัดลอกผล'}</button>
        <a href={onLine} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-xl bg-[#06c755] hover:bg-[#05b34c] text-white text-xs font-bold flex items-center gap-1.5">แชร์ไป LINE</a>
        {onShare && <button onClick={onShare} className="px-4 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"><Share2 className="w-4 h-4" /> แชร์</button>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {questions.map((q, k) => {
          const m = MONSTERS.find((x) => x.id === q.answerId);
          return (
            <button key={q.answerId} onClick={() => onNavigate?.('catalog', { initialMonster: m?.name })} className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-left cursor-pointer ${results[k] ? 'border-emerald-500/30 bg-emerald-500/[0.04]' : 'border-rose-500/30 bg-rose-500/[0.04]'}`}>
              {m && <MonsterAvatar monster={m} size="xs" showStars={false} />}
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate">{k + 1}. {m?.name}</div>
                <div className="text-[11px] text-slate-400 truncate">{q.slot} {q.skillName}</div>
              </div>
              <span className="text-sm">{results[k] ? '🟩' : '🟥'}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
        <button onClick={onPractice} className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"><RefreshCw className="w-4 h-4" /> เล่นโหมดฝึก (สุ่มชุดใหม่)</button>
        {onDaily && <button onClick={onDaily} className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-slate-100 text-xs font-bold cursor-pointer">กลับไปดูผลของวันนี้</button>}
        {mode === 'daily' && <span className="text-[11px] text-slate-500 w-full text-center">ชุดใหม่พรุ่งนี้ 00:00 น.</span>}
      </div>
    </div>
  );
}
