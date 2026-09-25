import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, Gift, Shield, Gauge, BookOpen, ArrowRight, Trophy, SearchX, User, Radio, Sparkles } from 'lucide-react';
import { MONSTERS } from '../data/monsters';
import { PROMO_CODES } from '../data/promoCodes';
import playersIndex from '../data/swrtPlayersIndex.json';
import curatedProfiles from '../data/playerProfiles.json';
import { tierFromLevel, flagFromCountry } from '../data/swrtPlayerAdapter';

// One flat, pre-lowercased list so each keystroke is a cheap scan
const PLAYERS = [
  ...curatedProfiles.map((p) => ({ name: p.name, lower: p.name.toLowerCase(), flag: p.flag, badge: p.rankBadge, score: p.score, note: p.displayName !== p.name ? p.displayName : 'Hall of Fame' })),
  ...(playersIndex.players || []).map((p) => ({ name: p.n, lower: p.n.toLowerCase(), flag: flagFromCountry(p.c), badge: tierFromLevel(p.lv).rankBadge, score: p.s, note: `${p.m} แมตช์` })),
];

const QUICK_TOOLS = [
  { id: 'live-farm', name: 'ระบบตรวจจับการฟาร์มสด (Live Farming Monitor)', desc: 'ตรวจจับผลดรอปรูนดันเจี้ยน Abyss วินาทีต่อวินาที พร้อม Keep/Sell Advisor', icon: Radio, view: 'live-farm-monitor' },
  { id: 'account-audit', name: '🤖 AI วินิจฉัยสุขภาพไอดี (AI Account Audit)', desc: 'วัดเกณฑ์ Swift (+220+), Violent, เช็ค 30 เมต้า Guardian และแนะนำดันเจี้ยน', icon: Sparkles, view: 'ai-account-audit' },
  { id: 'where2use', name: 'ใช้มอนสเตอร์ตัวนี้ที่ไหนดี? (Where to Use)', desc: 'ตรวจสอบการใช้งานในทีมรับ, ทีมบุก, ดันเจี้ยน และ RTA', icon: Shield, view: 'where2use' },
  { id: '3mdc-stats', name: 'ศูนย์สถิติและรายงาน 3MDC (Statistics Hub)', desc: 'รวมรายงานเมต้า, สถิติวินเรท, และ Battle Log Performance', icon: Trophy, view: '3mdc-stats' },
  { id: 'game-guides', name: 'สารบัญคู่มือกลยุทธ์เกม (Game Guides)', desc: 'คู่มือดันเจี้ยน Abyss Hard และแผน Siege', icon: BookOpen, view: 'game-guides' },
  { id: 'siege-calc', name: 'เครื่องคำนวณคะแนน Siege (Siege Calculator)', desc: 'คำนวณแต้มต่อนาทีและเวลาชนะ 20,000 แต้ม', icon: Gauge, view: 'siege-calculator' },
  { id: 'rta', name: 'วิเคราะห์ RTA & สถิติการแข่งขัน', desc: 'Tier List เมต้า, Pick/Win/Ban, รีเพลย์แข่งสด', icon: Trophy, view: 'rta' },
  { id: '3mdc', name: 'ค้นหาตัวแก้ทาง 3MDC', desc: 'ค้นหาทีมเจาะหอ 4★ / 5★ พร้อมคะแนนความน่าเชื่อถือ', icon: Shield, view: '3mdc' },
  { id: 'codes', name: 'โค้ดแจกไอเทมล่าสุด', desc: 'คัดลอกโค้ดและกดรับของผ่าน Hive ID', icon: Gift, view: 'codes' },
  { id: 'speed', name: 'เครื่องคำนวณ Speed Tick & จูนสปีด', desc: 'คำนวณช่วงความเร็วและป้องกันโดนแทรกเทิร์น', icon: Gauge, view: 'speed' },
  { id: 'catalog', name: 'สารานุกรมมอนสเตอร์', desc: 'ดูข้อมูลสกิล ธาตุ รูนแนะนำของทุกตัว', icon: BookOpen, view: 'catalog' },
];

export default function CommandPalette({ onClose, onNavigate }) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef(null);

  const q = query.trim().toLowerCase();

  // One flat, ordered list of results so arrow keys can walk across sections
  const results = useMemo(() => {
    const tools = QUICK_TOOLS
      .filter((t) => !q || t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q))
      .map((t) => ({ kind: 'tool', key: `tool-${t.id}`, data: t, run: () => onNavigate(t.view) }));

    const monsters = !q ? [] : MONSTERS.filter((m) => {
      const nTh = (m.thaiName || m.nameTh || '').toLowerCase();
      const nEn = (m.name || m.nameEn || '').toLowerCase();
      const fam = (m.family || '').toLowerCase();
      return nTh.includes(q) || nEn.includes(q) || fam.includes(q);
    }).slice(0, 4).map((m) => ({
      kind: 'monster', key: `monster-${m.id}`, data: m,
      run: () => onNavigate('catalog', { search: m.name || m.nameEn }),
    }));

    const players = !q ? [] : (() => {
      const starts = [];
      const contains = [];
      for (const p of PLAYERS) {
        if (p.lower.startsWith(q)) starts.push(p);
        else if (p.lower.includes(q)) contains.push(p);
        if (starts.length >= 5) break;
      }
      return [...starts, ...contains].slice(0, 5);
    })().map((p) => ({ kind: 'player', key: `player-${p.name}`, data: p, run: () => onNavigate('player-tracker', { initialPlayer: p.name }) }));

    const codes = PROMO_CODES.filter((c) =>
      !q || c.code.toLowerCase().includes(q) || c.rewards.some((r) => r.name.toLowerCase().includes(q))
    ).slice(0, 3).map((c) => ({ kind: 'code', key: `code-${c.id}`, data: c, run: () => onNavigate('codes') }));

    return [...tools, ...players, ...monsters, ...codes];
  }, [q, onNavigate]);

  // Keep the highlighted row visible while arrowing through a long list
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const select = (item) => {
    item.run();
    onClose();
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
    if (!results.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => (i + 1) % results.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => (i - 1 + results.length) % results.length); }
    else if (e.key === 'Enter') { e.preventDefault(); select(results[activeIndex]); }
  };

  const sections = [
    { kind: 'tool', title: 'เครื่องมือหลัก (Tools)' },
    { kind: 'player', title: 'ผู้เล่น RTA (Players)' },
    { kind: 'monster', title: 'มอนสเตอร์ (Monsters)' },
    { kind: 'code', title: 'โค้ดแจกไอเทม (Codes)' },
  ];

  const rowClass = (i) =>
    `w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors cursor-pointer ${
      i === activeIndex ? 'bg-[#162130] ring-1 ring-blue-500/40' : 'hover:bg-[#162130]'
    }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="ค้นหาด่วน"
        className="w-full max-w-2xl bg-[#101724] border border-[#1d2b3f] rounded-2xl shadow-2xl overflow-hidden"
        onKeyDown={onKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#1d2b3f] gap-3 bg-[#0c121c]">
          <Search className="w-5 h-5 text-blue-400 shrink-0" />
          <input
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="command-palette-results"
            aria-autocomplete="list"
            className="w-full bg-transparent border-none text-slate-100 placeholder-slate-500 focus:outline-none text-base"
            placeholder="ค้นหาผู้เล่น RTA, มอนสเตอร์, โค้ดเกม หรือเครื่องมือ..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
            autoFocus
          />
          {query && (
            <button onClick={() => { setQuery(''); setActiveIndex(0); }} className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer" aria-label="ล้างคำค้นหา">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-xs text-slate-400 bg-[#162130] border border-[#233145] rounded font-mono">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div id="command-palette-results" ref={listRef} className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {results.length === 0 && (
            <div className="py-10 text-center space-y-2">
              <SearchX className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="text-sm font-bold text-slate-300">ไม่พบผลลัพธ์สำหรับ “{query}”</div>
              <div className="text-xs text-slate-400">ลองพิมพ์ชื่อมอนสเตอร์ภาษาอังกฤษ เช่น Byungchul, Seara หรือชื่อเครื่องมือ</div>
            </div>
          )}

          {sections.map((section) => {
            const items = results.filter((r) => r.kind === section.kind);
            if (!items.length) return null;
            return (
              <div key={section.kind}>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">{section.title}</div>
                <div className={section.kind === 'monster' ? 'grid grid-cols-1 sm:grid-cols-2 gap-2' : 'space-y-1'}>
                  {items.map((item) => {
                    const index = results.indexOf(item);
                    const active = index === activeIndex;
                    const common = {
                      'data-index': index,
                      onClick: () => select(item),
                      onMouseEnter: () => setActiveIndex(index),
                      'aria-selected': active,
                      role: 'option',
                    };

                    if (item.kind === 'tool') {
                      const Icon = item.data.icon;
                      return (
                        <button key={item.key} {...common} className={`${rowClass(index)} justify-between group`}>
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400"><Icon className="w-4 h-4" /></div>
                            <div>
                              <div className={`text-sm font-bold ${active ? 'text-blue-400' : 'text-slate-200'}`}>{item.data.name}</div>
                              <div className="text-xs text-slate-400">{item.data.desc}</div>
                            </div>
                          </div>
                          <ArrowRight className={`w-4 h-4 text-slate-400 transition-opacity ${active ? 'opacity-100' : 'opacity-0'}`} />
                        </button>
                      );
                    }

                    if (item.kind === 'player') {
                      const p = item.data;
                      return (
                        <button key={item.key} {...common} className={`${rowClass(index)} justify-between`}>
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 rounded-lg bg-rose-600/20 text-rose-300"><User className="w-4 h-4" /></div>
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-slate-200 truncate">{p.flag} {p.name}</div>
                              <div className="text-xs text-slate-400 truncate">{p.note}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 text-xs font-mono">
                            <span className="px-1.5 py-0.5 rounded font-black bg-rose-500/15 text-rose-300 border border-rose-500/30">{p.badge}</span>
                            <span className="text-amber-300 font-bold">{p.score}</span>
                          </div>
                        </button>
                      );
                    }

                    if (item.kind === 'monster') {
                      const m = item.data;
                      return (
                        <button key={item.key} {...common} className={`${rowClass(index)} bg-[#0c121c] border border-[#1f2c3f] !p-2.5`}>
                          <img src={m.avatarUrl || m.imageUrl || m.image} alt="" className="w-10 h-10 rounded-lg object-cover border border-[#233145]" loading="lazy" />
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-slate-200 truncate">{m.name}{m.thaiName ? ` · ${m.thaiName}` : ''}</div>
                            <div className="text-xs text-slate-400 capitalize">{m.element} • {m.family}</div>
                          </div>
                        </button>
                      );
                    }

                    const c = item.data;
                    return (
                      <button key={item.key} {...common} className={`${rowClass(index)} justify-between bg-[#0c121c] border border-[#1f2c3f]`}>
                        <div className="flex items-center gap-2.5">
                          <Gift className="w-4 h-4 text-emerald-400" />
                          <span className="font-mono text-sm font-bold text-emerald-400">{c.code}</span>
                        </div>
                        <div className="text-xs text-slate-400">{c.rewards.map((r) => r.name.split(' ')[0]).join(', ')}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-[#0a0e17] border-t border-[#1d2b3f] flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>↑↓ เลื่อน • Enter เลือก • Esc ปิด</span>
          <span className="text-cyan-400 font-bold">SWM</span>
        </div>
      </div>
    </div>
  );
}
