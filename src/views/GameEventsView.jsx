import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  Gift,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  HelpCircle,
  Copy,
  Check,
  ChevronRight,
  Flame,
  Award,
  BookOpen,
  Filter,
  Layers,
  Zap,
  ExternalLink,
  Shield,
  Star,
  CheckSquare,
  Square,
  Info,
} from 'lucide-react';
import gameEventsData from '../data/gameEvents.json';
import { copyText } from '../utils/clipboard';

const CLAIMED_STORAGE_KEY = 'swm:events:claimed-rewards';

function getClaimedSet() {
  try {
    const raw = localStorage.getItem(CLAIMED_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveClaimedSet(set) {
  try {
    localStorage.setItem(CLAIMED_STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

function calculateDaysLeft(endDateStr) {
  if (!endDateStr) return { days: 0, hours: 0, isExpired: false, label: 'ไม่ระบุ' };
  const end = new Date(`${endDateStr}T23:59:59+07:00`).getTime();
  const now = Date.now();
  const diff = end - now;
  if (diff <= 0) return { days: 0, hours: 0, isExpired: true, label: 'สิ้นสุดแล้ว' };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days === 0) return { days, hours, isExpired: false, label: `เหลืออีก ${hours} ชม.` };
  return { days, hours, isExpired: false, label: `เหลืออีก ${days} วัน ${hours} ชม.` };
}

export default function GameEventsView({ onNavigate, viewParams = {} }) {
  const [activeTab, setActiveTab] = useState(viewParams?.subItem === 'quiz' ? 'quiz' : 'events');
  const [searchQuery, setSearchQuery] = useState(viewParams?.search || '');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedQuizEvent, setSelectedQuizEvent] = useState('all');
  const [copiedId, setCopiedId] = useState(null);
  const [claimedRewards, setClaimedRewards] = useState(() => getClaimedSet());

  const events = gameEventsData.events || [];
  const allQuizzes = gameEventsData.quizQuestions || [];

  // Toggle claimed reward status
  const toggleClaimed = (rewardId) => {
    setClaimedRewards((prev) => {
      const next = new Set(prev);
      if (next.has(rewardId)) next.delete(rewardId);
      else next.add(rewardId);
      saveClaimedSet(next);
      return next;
    });
  };

  const handleCopy = async (text, id) => {
    const ok = await copyText(text);
    if (ok) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (selectedCategory === 'quiz' && !ev.hasQuiz) return false;
      if (selectedCategory === 'special' && ev.category !== 'special') return false;
      if (selectedCategory === 'rune' && ev.category !== 'rune') return false;
      if (selectedCategory === 'guild' && ev.category !== 'guild') return false;
      if (selectedCategory === 'checkin' && ev.category !== 'checkin') return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = ev.title.toLowerCase().includes(q);
      const matchDesc = ev.description.toLowerCase().includes(q);
      const matchRewards = (ev.rewards || []).some((r) => r.name.toLowerCase().includes(q));
      const matchMissions = (ev.missions || []).some((m) => m.name.toLowerCase().includes(q));
      return matchTitle || matchDesc || matchRewards || matchMissions;
    });
  }, [events, selectedCategory, searchQuery]);

  // Filtered Quizzes
  const filteredQuizzes = useMemo(() => {
    return allQuizzes.filter((item) => {
      if (selectedQuizEvent !== 'all' && item.eventId !== selectedQuizEvent) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchQ = item.question.toLowerCase().includes(q);
      const matchAns = item.correctAnswer.toLowerCase().includes(q);
      const matchExp = (item.explanation || '').toLowerCase().includes(q);
      const matchKw = (item.keywords || []).some((k) => k.toLowerCase().includes(q));
      const matchOptions = (item.options || []).some((opt) => opt.toLowerCase().includes(q));
      return matchQ || matchAns || matchExp || matchKw || matchOptions;
    });
  }, [allQuizzes, selectedQuizEvent, searchQuery]);

  // Quick stats
  const totalRewardsCount = useMemo(() => {
    return events.reduce((sum, ev) => sum + (ev.rewards?.length || 0), 0);
  }, [events]);

  const claimedCount = useMemo(() => {
    return claimedRewards.size;
  }, [claimedRewards]);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-200 max-w-7xl mx-auto">
      {/* 1. Header & Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/25 bg-gradient-to-b from-[#161226] via-[#0d101c] to-[#080c14] p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-black tracking-wide">
              <Gift className="w-3.5 h-3.5 text-amber-400" />
              <span>SUMMONERS WAR ACTIVE EVENTS & REWARDS</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              🎉 ศูนย์กิจกรรม & เฉลยคำถามกิจกรรม
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              ติดตามกิจกรรมในเกมล่าสุด เช็คของรางวัลเด่น (คัมภีร์ LD, Devilmon, คราฟต์รูน 6★) พร้อมระบบเฉลยคำตอบ Web Event Quiz และทายปริศนาค้นหาคำตอบได้ในคลิกเดียว
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto shrink-0">
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 text-center">
              <div className="text-[11px] text-slate-400 font-medium">กิจกรรมจัดอยู่</div>
              <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono mt-0.5">
                {events.length} <span className="text-xs font-normal text-slate-400">อีเวนต์</span>
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 text-center">
              <div className="text-[11px] text-slate-400 font-medium">เฉลยคำถามในคลัง</div>
              <div className="text-xl sm:text-2xl font-black text-purple-300 font-mono mt-0.5">
                {allQuizzes.length} <span className="text-xs font-normal text-slate-400">ข้อ</span>
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-white/[0.04] border border-emerald-500/20 text-center">
              <div className="text-[11px] text-slate-400 font-medium">รางวัลที่เก็บแล้ว</div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-0.5">
                {claimedCount} <span className="text-xs font-normal text-slate-400">/ {totalRewardsCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Mode Switcher Tabs */}
        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-white/[0.08] pt-5">
          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'events'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/5'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>📅 กิจกรรมทั้งหมด & ของรางวัล ({events.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('quiz')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'quiz'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black shadow-lg shadow-purple-600/25'
                : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/5'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>💡 เฉลยคำถามกิจกรรม (Event Quiz Solver) ({allQuizzes.length})</span>
          </button>
        </div>
      </div>

      {/* 3. Search and Category Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'events'
                ? 'ค้นหากิจกรรม, ของรางวัล (LD, Devilmon, รูน 6★), หรือภารกิจ...'
                : 'พิมพ์คำถาม หรือคีย์เวิร์ดเฉลย (เช่น Oliver, Tian Lang, รูน, สปีด)...'
            }
            className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-[#0a0f18] border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-amber-500/50 transition-colors shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Categories / Selectors */}
        {activeTab === 'events' ? (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {[
              ['all', 'ทั้งหมด'],
              ['quiz', '💡 มีเฉลยคำถาม'],
              ['special', '⭐ พิเศษ/Nat 5'],
              ['rune', '💎 คราฟต์รูน'],
              ['guild', '⚔️ กิลด์วอร์'],
              ['checkin', '🎁 เช็คอิน'],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setSelectedCategory(id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                  selectedCategory === id
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'bg-white/[0.03] text-slate-400 hover:text-slate-200 border border-white/5'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-400 font-medium">เลือกกิจกรรม:</span>
            <select
              value={selectedQuizEvent}
              onChange={(e) => setSelectedQuizEvent(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#0a0f18] border border-white/10 text-slate-200 text-xs font-bold focus:outline-none focus:border-purple-500"
            >
              <option value="all">คำถามทั้งหมด ({allQuizzes.length} ข้อ)</option>
              {events
                .filter((ev) => ev.hasQuiz)
                .map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title.slice(0, 36)}...
                  </option>
                ))}
            </select>
          </div>
        )}
      </div>

      {/* ================= TAB 1: ALL EVENTS & REWARDS ================= */}
      {activeTab === 'events' && (
        <div className="space-y-5">
          {filteredEvents.length === 0 ? (
            <div className="p-12 rounded-3xl border border-white/10 bg-[#0a0f18] text-center space-y-3">
              <Calendar className="w-10 h-10 text-slate-500 mx-auto" />
              <h3 className="text-base font-bold text-white">ไม่พบกิจกรรมตามเงื่อนไขที่ค้นหา</h3>
              <p className="text-xs text-slate-400">ลองล้างคำค้นหา หรือเลือกหมวดหมู่อื่นดูครับ</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5">
              {filteredEvents.map((ev) => {
                const timeInfo = calculateDaysLeft(ev.endDate);
                const eventRewards = ev.rewards || [];
                const claimedInThisEvent = eventRewards.filter((r) => claimedRewards.has(r.id)).length;
                const progressPct = eventRewards.length > 0 ? Math.round((claimedInThisEvent / eventRewards.length) * 100) : 0;

                return (
                  <div
                    key={ev.id}
                    className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0c111c] p-5 sm:p-7 shadow-xl hover:border-white/20 transition-all space-y-5"
                  >
                    {/* Top Info Bar */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {ev.badge}
                          </span>
                          {ev.hasQuiz && (
                            <button
                              onClick={() => {
                                setSelectedQuizEvent(ev.id);
                                setActiveTab('quiz');
                              }}
                              className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Sparkles className="w-3 h-3 text-yellow-300" />
                              <span>มีเฉลยคำถาม คลิกดูได้ทันที ➔</span>
                            </button>
                          )}
                        </div>
                        <h2 className="text-lg sm:text-xl font-black text-white">{ev.title}</h2>
                      </div>

                      {/* Dates & Countdown */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="text-[11px] text-slate-400">
                            {ev.startDate} ~ {ev.endDate}
                          </div>
                          <div
                            className={`text-xs font-bold mt-0.5 flex items-center justify-end gap-1 ${
                              timeInfo.isExpired
                                ? 'text-rose-400'
                                : timeInfo.days <= 3
                                ? 'text-amber-400 font-mono'
                                : 'text-emerald-400 font-mono'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>{timeInfo.label}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-white/[0.02] p-3.5 rounded-2xl border border-white/[0.04]">
                      {ev.description}
                    </p>

                    {/* Missions & How-to */}
                    {ev.missions && ev.missions.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <span>ภารกิจ & วิธีเก็บแต้ม</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                          {ev.missions.map((m, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-xs space-y-1"
                            >
                              <div className="font-bold text-white">{m.name}</div>
                              <div className="text-[11px] text-amber-300 font-mono">{m.points}</div>
                              <div className="text-[10px] text-slate-500">{m.limit}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Rewards Table & Checklist Tracker */}
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-emerald-400" />
                          <span>รายการของรางวัลที่จะได้รับ (คลิกติ๊กถูกเมื่อเก็บในเกมแล้ว)</span>
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          เก็บแล้ว {claimedInThisEvent} / {eventRewards.length} ({progressPct}%)
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {eventRewards.map((rew) => {
                          const isClaimed = claimedRewards.has(rew.id);
                          return (
                            <div
                              key={rew.id}
                              onClick={() => toggleClaimed(rew.id)}
                              className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                isClaimed
                                  ? 'bg-emerald-950/20 border-emerald-500/40 opacity-70'
                                  : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <button
                                  type="button"
                                  className={`p-1 rounded-lg shrink-0 ${
                                    isClaimed ? 'text-emerald-400' : 'text-slate-500'
                                  }`}
                                >
                                  {isClaimed ? (
                                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                                  ) : (
                                    <Square className="w-4 h-4 text-slate-500" />
                                  )}
                                </button>
                                <div className="min-w-0">
                                  <div
                                    className={`text-xs font-bold truncate ${
                                      isClaimed ? 'text-slate-400 line-through' : 'text-white'
                                    }`}
                                    title={rew.name}
                                  >
                                    {rew.name}
                                  </div>
                                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                    เงื่อนไข: {rew.cost}
                                  </div>
                                </div>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                  rew.tier === 'legendary'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : rew.tier === 'epic'
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                }`}
                              >
                                {rew.amount > 1 ? `x${rew.amount}` : 'สำคัญ'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Pro Tips footer */}
                    {ev.tips && (
                      <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-200/90 flex items-start gap-2.5">
                        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold text-amber-300">คำแนะนำเทคนิคการทำกิจกรรม:</strong>{' '}
                          {ev.tips}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: EVENT QUIZ SOLVER ================= */}
      {activeTab === 'quiz' && (
        <div className="space-y-5">
          {/* Quiz Solver Header */}
          <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-yellow-300 shrink-0" />
              <div className="text-slate-300 leading-relaxed">
                เฉลยคำถาม Web Event & มินิเกมตอบคำถามประจำวัน — พิมพ์ค้นหาคำถามในช่อง Search ด้านบน หรือกดปุ่ม <strong>"คัดลอกคำตอบ"</strong> เพื่อนำไปตอบในเกมได้ทันที
              </div>
            </div>
            <div className="text-right shrink-0 font-mono text-purple-300 font-bold">
              แสดง {filteredQuizzes.length} จาก {allQuizzes.length} ข้อ
            </div>
          </div>

          {filteredQuizzes.length === 0 ? (
            <div className="p-12 rounded-3xl border border-white/10 bg-[#0a0f18] text-center space-y-3">
              <HelpCircle className="w-10 h-10 text-slate-500 mx-auto" />
              <h3 className="text-base font-bold text-white">ไม่พบคำถามตรงกับคำค้นหา "{searchQuery}"</h3>
              <p className="text-xs text-slate-400">ลองพิมพ์ชื่อตัวละคร สกิล หรือคำสั้นๆ เพื่อค้นหาเฉลยครับ</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredQuizzes.map((q, idx) => {
                const isCopied = copiedId === q.id;
                return (
                  <div
                    key={q.id}
                    className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-[#0b0f19] p-5 sm:p-6 shadow-xl hover:border-purple-500/40 transition-all space-y-4"
                  >
                    {/* Question Header & Category Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            ข้อที่ {idx + 1}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">{q.eventTitle}</span>
                        </div>
                        <h3 className="text-base sm:text-lg font-black text-white leading-snug">
                          {q.question}
                        </h3>
                      </div>

                      {/* Instant Copy Answer Button */}
                      <button
                        onClick={() => handleCopy(q.correctAnswer, q.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 transition-all ${
                          isCopied
                            ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/30'
                            : 'bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 hover:border-purple-400/40'
                        }`}
                        title="คลิกเพื่อคัดลอกคำตอบที่ถูกต้องไปวาง"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                            <span>คัดลอกคำตอบแล้ว!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 text-yellow-300" />
                            <span>คัดลอกคำตอบ</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {q.options.map((opt, oIdx) => {
                        const isCorrect = opt === q.correctAnswer;
                        return (
                          <div
                            key={oIdx}
                            className={`p-3.5 rounded-2xl border text-xs leading-relaxed flex items-start gap-2.5 transition-all ${
                              isCorrect
                                ? 'bg-gradient-to-r from-emerald-950/50 to-teal-950/40 border-emerald-500/60 text-emerald-200 shadow-md shadow-emerald-900/20 font-bold'
                                : 'bg-white/[0.02] border-white/5 text-slate-400 opacity-60'
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              {isCorrect ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <span className="w-4 h-4 rounded-full border border-slate-600 inline-block text-center text-[10px] leading-4 text-slate-500 font-mono">
                                  {String.fromCharCode(65 + oIdx)}
                                </span>
                              )}
                            </div>
                            <div className="flex-1">
                              <span>{opt}</span>
                              {isCorrect && (
                                <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-block">
                                  คำตอบที่ถูกต้อง ✓
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs text-purple-200/90 leading-relaxed flex items-start gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-yellow-300 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-yellow-300 font-bold">เกร็ดความรู้ & เหตุผล:</strong>{' '}
                          {q.explanation}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
