import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Swords,
  Shield,
  Sparkles,
  Clock,
  Crown,
  CheckCircle2,
  Copy,
  Check,
  Search,
  Info,
  ChevronRight,
  Repeat,
  Image as ImageIcon,
  Crosshair,
  X,
  Link as LinkIcon,
  Loader2,
} from 'lucide-react';
import MonsterAvatar from '../components/MonsterAvatar';
import ArenaRushHourHub from '../components/ArenaRushHourHub';
import { matchArenaTeams } from '../utils/arenaMatcher';
import { findArenaCounters } from '../utils/arenaCounter';
import { loadBox, loadDemoBox } from '../utils/swexImport';
import { exportArenaTeamCard } from '../utils/cardExporter';
import { MONSTERS } from '../data/monsters';
import { buildUrl } from '../router';

const TIER_STYLE = {
  S: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  A: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  B: 'bg-white/[0.05] text-slate-300 border-white/10',
};
const TIER_LABEL = { S: 'S — สูตรหลักระดับสูง', A: 'A — แข็งแรง ใช้ได้จริง', B: 'B — ประหยัด / เฉพาะทาง' };
const LD_OPTIONS = [
  { id: 'all', label: 'ทุกทีม' },
  { id: 'no-ld', label: 'ไม่ใช้แสง-มืด' },
  { id: 'ld', label: 'มีแสง-มืด' },
];
const TABS = ['ao', 'ad', 'counter', 'mybox', 'rush'];

const chip = (active, tone = 'blue') =>
  `px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer shrink-0 ${
    active
      ? tone === 'purple'
        ? 'bg-fuchsia-600/25 text-fuchsia-200 border-fuchsia-500/40'
        : 'bg-blue-600/25 text-blue-200 border-blue-500/40'
      : 'bg-white/[0.03] text-slate-400 border-white/[0.08] hover:text-white'
  }`;

const tabClass = (active, tone) =>
  `px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
    active ? `${tone} text-white shadow-lg` : 'text-slate-400 hover:text-white bg-white/[0.03]'
  }`;

const parseNames = (value) => String(value || '').split(',').map((s) => s.trim()).filter(Boolean).slice(0, 4);

/** One catalogue team. `extra` renders below the header (counter reasons); `compact` hides the long sections. */
function TeamCard({ team, summary, copied, busy, onCopy, onCard, extra, compact = false }) {
  return (
    <div className="rounded-3xl border border-white/[0.08] bg-[#0c1220] p-5 sm:p-6 space-y-4 shadow-xl hover:border-blue-500/30 transition-all flex flex-col justify-between">
      <div className="space-y-4">
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`px-2 py-0.5 rounded-md border text-[11px] font-black font-mono ${TIER_STYLE[team.tier] || TIER_STYLE.B}`} title={TIER_LABEL[team.tier]}>
                Tier {team.tier}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[11px] font-bold font-mono">
                {team.archetype}
              </span>
              {(team.speed || team.style) && (
                <span className="px-2 py-0.5 rounded-md bg-white/[0.04] text-slate-300 text-[11px] font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-400" /> {team.speed || team.style}
                </span>
              )}
              {team.ld && (
                <span className="px-2 py-0.5 rounded-md bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30 text-[11px] font-mono" title={team.ldMembers.join(', ')}>
                  แสง-มืด: {team.ldMembers.join(', ')}
                </span>
              )}
              <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold font-mono ${
                team.isComplete
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : team.readyWithSwaps
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  : summary.hasBox
                  ? 'bg-white/[0.04] text-slate-400'
                  : 'bg-blue-500/15 text-blue-300 border border-blue-500/20'
              }`}>
                {team.statusLabel}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white mt-1.5">
              {team.nameTh}
            </h3>
            <div className="text-xs text-slate-400 font-mono">{team.name}</div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onCard(team)}
              disabled={busy}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/10 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-60"
              title="บันทึกการ์ดทีมเป็นรูป PNG สำหรับแชร์"
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" /> : <ImageIcon className="w-3.5 h-3.5 text-amber-300" />}
              <span>การ์ด PNG</span>
            </button>
            <button
              onClick={() => onCopy(team)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/10 flex items-center gap-1.5 transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอกสูตร'}</span>
            </button>
          </div>
        </div>

        {extra}

        {/* 4 Monster Slots */}
        <div className="grid grid-cols-4 gap-2.5 p-3 rounded-2xl bg-[#070b14] border border-white/[0.06]">
          {team.slots.map((mon, sIdx) => (
            <div key={sIdx} className="flex flex-col items-center text-center group/m relative">
              <div className="relative">
                <MonsterAvatar monster={mon} size="md" showStars={false} />
                {sIdx === 0 && (
                  <div className="absolute -top-2 -left-1 bg-amber-500 text-slate-950 p-1 rounded-full shadow-md" title="สกิลหัวหน้าทีม (Leader)">
                    <Crown className="w-3 h-3 font-black" />
                  </div>
                )}
                {mon.isRealOwned && (
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5" title="มีในไอดีแล้ว">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
              <span className="text-xs font-bold text-white truncate max-w-[85px] mt-1.5">
                {mon.name}
              </span>
              <span className="text-[10px] text-slate-400 truncate max-w-[85px]">
                {mon.thaiName !== mon.name ? mon.thaiName : `ช่องที่ ${sIdx + 1}`}
              </span>
            </div>
          ))}
        </div>

        {/* Leader Skill */}
        <div className={`text-xs p-2.5 rounded-xl flex items-center gap-2 border ${
          team.leaderArena === false
            ? 'text-slate-300 bg-white/[0.03] border-white/10'
            : 'text-amber-300 bg-amber-500/10 border-amber-500/20'
        }`}>
          <Crown className="w-4 h-4 text-amber-400 shrink-0" />
          <span><strong>ลีดเดอร์:</strong> {team.leader}</span>
        </div>

        {/* Swaps: cheaper / alternative picks per slot */}
        {team.swaps && Object.keys(team.swaps).length > 0 && (
          <div className="text-xs text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="flex items-center gap-1 text-slate-400 font-bold"><Repeat className="w-3.5 h-3.5" /> ตัวแทน:</span>
            {Object.entries(team.swaps).map(([slot, alts]) => {
              const opt = team.swapOptions?.find((o) => o.slot === slot);
              return (
                <span key={slot} className="font-mono">
                  <span className={opt ? 'text-rose-300' : 'text-slate-400'}>{slot}</span>
                  <span className="text-slate-500"> → </span>
                  {alts.map((alt, i) => {
                    const owned = opt?.alts.find((a) => a.name === alt)?.owned;
                    return (
                      <span key={alt}>
                        {i > 0 && <span className="text-slate-600"> / </span>}
                        <span className={owned ? 'text-emerald-300 font-bold' : ''} title={owned ? 'มีในไอดีแล้ว' : ''}>{alt}{owned ? ' ✓' : ''}</span>
                      </span>
                    );
                  })}
                </span>
              );
            })}
          </div>
        )}

        {!compact && team.turnOrder && (
          <div className="space-y-1.5 text-xs text-slate-300">
            <div className="font-bold text-cyan-300 uppercase font-mono text-[11px]">
              ลำดับเทิร์นการออกสกิล (Turn Order):
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {team.turnOrder.map((step, i) => (
                <div key={i} className="flex items-start gap-2 p-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <span className="w-4 h-4 mt-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold flex items-center justify-center text-[10px] shrink-0">
                    {i + 1}
                  </span>
                  <span className="leading-snug">{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!compact && team.winCondition && (
          <div className="text-xs text-slate-300 bg-blue-500/10 border border-blue-500/20 p-2.5 rounded-xl">
            <strong className="text-blue-300">เงื่อนไขชัยชนะ:</strong> {team.winCondition}
          </div>
        )}

        <div className="text-xs text-slate-300 bg-slate-900/80 border border-white/[0.06] p-3 rounded-xl leading-relaxed">
          <div className="font-bold text-amber-300 font-mono text-[11px] mb-1">แนวทางการใส่รูน & สปีด:</div>
          <p>{team.runeGuidance || team.runeBuilds}</p>
        </div>

        {!compact && (
          <p className="text-xs text-slate-400 leading-relaxed italic">
            💡 {team.description}
          </p>
        )}
      </div>

      {!compact && (
        <div className="pt-3 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {team.bestAgainst && (
            <div className="text-emerald-300">
              <strong className="text-emerald-400">เหมาะกับ:</strong> {team.bestAgainst}
            </div>
          )}
          {team.avoidAgainst && (
            <div className="text-rose-300">
              <strong className="text-rose-400">ควรเลี่ยง:</strong> {team.avoidAgainst}
            </div>
          )}
          {team.counterTips && (
            <div className="text-amber-300 sm:col-span-2">
              <strong className="text-amber-400">วิธีแก้ทาง:</strong> {team.counterTips}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Four slots + a catalogue search box; the first pick is treated as the enemy leader. */
function EnemyPicker({ picks, onChange, onSearch, onClear, onReorder, presets }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const starts = [];
    const contains = [];
    for (const m of MONSTERS) {
      const en = (m.name || '').toLowerCase();
      const th = (m.thaiName || '').toLowerCase();
      if (en.startsWith(q) || th.startsWith(q)) starts.push(m);
      else if (en.includes(q) || th.includes(q)) contains.push(m);
      if (starts.length >= 8) break;
    }
    return [...starts, ...contains].slice(0, 8);
  }, [query]);

  const add = (m) => {
    if (!m || picks.length >= 4) return;
    onChange([...picks, m.name]);
    setQuery('');
    setOpen(false);
  };
  const remove = (i) => onChange(picks.filter((_, idx) => idx !== i));
  const makeLeader = (i) => {
    if (i > 0) {
      const next = [picks[i], ...picks.filter((_, idx) => idx !== i)];
      onChange(next);
      if (onReorder) onReorder(next);
    }
  };

  return (
    <div className="rounded-3xl border border-white/[0.08] bg-[#0c1220] p-5 sm:p-6 space-y-4 shadow-xl">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2"><Crosshair className="w-5 h-5 text-rose-400" /> เจอทีมรับนี้ บุกด้วยอะไร</h2>
          <p className="text-xs text-slate-400 mt-1">ใส่ทีมรับของคู่ต่อสู้ 1–4 ตัว (ตัวแรก = ลีดเดอร์) ระบบอ่านสกิลจริงของแต่ละตัว แล้วจัดอันดับสูตรบุกที่ตอบโจทย์ — ถ้ามีกล่อง จะบอกด้วยว่าทีมไหนคุณจัดได้เลย</p>
        </div>
        <select
          className="bg-[#070b14] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 max-w-full"
          value=""
          onChange={(e) => {
            const t = presets.find((p) => p.id === e.target.value);
            if (t) {
              const slots = [...t.slots];
              onChange(slots);
              onSearch(slots);
            }
          }}
        >
          <option value="">ใส่จากสูตรทีมรับในแค็ตตาล็อก…</option>
          {presets.map((t) => <option key={t.id} value={t.id}>{t.name} — {t.archetype}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-4 gap-2.5 p-3 rounded-2xl bg-[#070b14] border border-white/[0.06]">
        {[0, 1, 2, 3].map((i) => {
          const name = picks[i];
          return (
            <div key={i} className="flex flex-col items-center text-center relative min-h-[96px] justify-center">
              {name ? (
                <>
                  <div className="relative">
                    <MonsterAvatar monster={name} size="md" showStars={false} />
                    {i === 0 && (
                      <div className="absolute -top-2 -left-1 bg-amber-500 text-slate-950 p-1 rounded-full shadow-md" title="ลีดเดอร์ของทีมรับ">
                        <Crown className="w-3 h-3" />
                      </div>
                    )}
                    <button onClick={() => remove(i)} className="absolute -top-2 -right-2 bg-rose-600 hover:bg-rose-500 text-white rounded-full p-0.5 cursor-pointer" title="เอาออก" aria-label={`เอา ${name} ออก`}>
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-xs font-bold text-white truncate max-w-[85px] mt-1.5">{name}</span>
                  {i > 0 && (
                    <button onClick={() => makeLeader(i)} className="text-[10px] text-amber-300/80 hover:text-amber-200 cursor-pointer">ตั้งเป็นลีด</button>
                  )}
                </>
              ) : (
                <div className="w-14 h-14 rounded-2xl border border-dashed border-white/15 flex items-center justify-center text-slate-600 text-xs font-mono">{i + 1}</div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1" ref={boxRef}>
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={query}
            disabled={picks.length >= 4}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); if (suggestions[0]) add(suggestions[0]); else if (picks.length) onSearch(); }
              if (e.key === 'Escape') setOpen(false);
            }}
            placeholder={picks.length >= 4 ? 'ครบ 4 ตัวแล้ว' : 'พิมพ์ชื่อมอนสเตอร์ (อังกฤษ/ไทย) แล้ว Enter…'}
            className="w-full bg-[#070b14] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
            aria-label="ค้นหามอนสเตอร์ของทีมรับ"
          />
          {open && suggestions.length > 0 && (
            <div className="absolute z-30 mt-1 w-full rounded-2xl border border-white/10 bg-[#0a0f19]/95 backdrop-blur-xl shadow-2xl p-1.5 max-h-80 overflow-y-auto">
              {suggestions.map((m) => (
                <button key={m.id} onClick={() => add(m)} className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-white/[0.06] text-left cursor-pointer">
                  <MonsterAvatar monster={m} size="sm" showStars={false} />
                  <span className="text-xs font-bold text-white">{m.name}</span>
                  <span className="text-[11px] text-slate-400 truncate">{m.thaiName !== m.name ? m.thaiName : ''}</span>
                  <span className="ml-auto text-[10px] font-mono text-slate-500">{m.stars}★</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => onSearch()}
          disabled={!picks.length}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-rose-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Crosshair className="w-4 h-4" /> ค้นหาทีมแก้
        </button>
        {picks.length > 0 && (
          <button onClick={() => { onChange([]); if (onClear) onClear(); }} className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-sm font-bold border border-white/10 cursor-pointer">ล้าง</button>
        )}
      </div>
    </div>
  );
}

export default function ArenaMetaView({ onNavigate, subItem, ad }) {
  const [activeTab, setActiveTab] = useState(() => (TABS.includes(subItem) ? subItem : ad ? 'counter' : 'ao'));
  const [selectedArchetype, setSelectedArchetype] = useState('all');
  const [tierFilter, setTierFilter] = useState('all'); // 'all' | 'S' | 'A' | 'B'
  const [ldFilter, setLdFilter] = useState('all'); // 'all' | 'no-ld' | 'ld'
  const [copiedTeamId, setCopiedTeamId] = useState(null);
  const [cardBusyId, setCardBusyId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userBox, setUserBox] = useState(() => loadBox());
  // Counter search: what is being picked, and the last line-up actually searched
  const [enemyPicks, setEnemyPicks] = useState(() => parseNames(ad));
  const [enemyQuery, setEnemyQuery] = useState(() => parseNames(ad));
  const [showAllCounters, setShowAllCounters] = useState(false);
  const [onlyMine, setOnlyMine] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const arenaData = useMemo(() => matchArenaTeams(userBox), [userBox]);

  const { offense, defense, summary, meta } = arenaData;

  const counter = useMemo(() => (enemyQuery.length ? findArenaCounters(enemyQuery, { offense, defense }) : null), [enemyQuery, offense, defense]);

  // Active list based on tab
  const rawList = useMemo(() => {
    if (activeTab === 'ao') return offense;
    if (activeTab === 'ad') return defense;
    if (activeTab === 'mybox') {
      const ready = (t) => t.isComplete || t.readyWithSwaps;
      return [...offense.filter(ready), ...defense.filter(ready)];
    }
    return offense;
  }, [activeTab, offense, defense]);

  const archetypes = useMemo(() => [...new Set(rawList.map((t) => t.archetype))], [rawList]);

  // Filter by tier, light/dark usage, archetype and search query
  const filteredList = useMemo(() => {
    return rawList.filter((team) => {
      if (tierFilter !== 'all' && team.tier !== tierFilter) return false;
      if (ldFilter === 'ld' && !team.ld) return false;
      if (ldFilter === 'no-ld' && team.ld) return false;
      if (selectedArchetype !== 'all' && team.archetype !== selectedArchetype) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = team.name?.toLowerCase().includes(q) || team.nameTh?.toLowerCase().includes(q);
        const matchMonster = team.slots.some(m => m.name.toLowerCase().includes(q) || (m.thaiName && m.thaiName.toLowerCase().includes(q)));
        const matchSwap = Object.values(team.swaps || {}).flat().some((n) => n.toLowerCase().includes(q));
        return matchName || matchMonster || matchSwap;
      }
      return true;
    });
  }, [rawList, tierFilter, ldFilter, selectedArchetype, searchQuery]);

  const switchTab = (tab) => {
    setActiveTab(tab);
    setSelectedArchetype('all');
    try {
      const p = { subItem: tab };
      if (tab === 'counter' && enemyQuery.length) p.ad = enemyQuery.join(',');
      window.history.replaceState(null, '', buildUrl('arena', p));
    } catch { /* not important */ }
  };

  const runCounterSearch = (explicit) => {
    const names = (Array.isArray(explicit) ? explicit : enemyPicks).slice(0, 4);
    setEnemyQuery(names);
    setShowAllCounters(false);
    try {
      window.history.replaceState(null, '', buildUrl('arena', { subItem: 'counter', ad: names.join(',') }));
    } catch { /* not important */ }
  };

  const handleClearCounter = () => {
    setEnemyPicks([]);
    setEnemyQuery([]);
    setShowAllCounters(false);
    try {
      window.history.replaceState(null, '', buildUrl('arena', { subItem: 'counter' }));
    } catch { /* not important */ }
  };

  const handleReorder = (reordered) => {
    if (enemyQuery.length > 0) {
      runCounterSearch(reordered);
    }
  };

  const copyCounterLink = () => {
    const url = `${window.location.origin}${buildUrl('arena', { subItem: 'counter', ad: enemyQuery.join(',') })}`;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
  };

  // Copy team details
  const handleCopyTeam = (team) => {
    const swapText = Object.entries(team.swaps || {}).map(([slot, alts]) => `${slot} → ${alts.join(' / ')}`).join(', ');
    const text = [
      `⚔️ [SWM Arena] ${team.nameTh} (${team.name}) — Tier ${team.tier}`,
      `สมาชิก: ${team.slots.map(s => s.name).join(' + ')}`,
      `ลีดเดอร์: ${team.leader}`,
      `รูน: ${team.runeGuidance || team.runeBuilds}`,
      swapText ? `ตัวแทน: ${swapText}` : '',
      'สูตรคอมมูนิตี้ (ไม่มีสถิติวัดจริง) — swm-blue.vercel.app/arena',
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedTeamId(team.id);
    setTimeout(() => setCopiedTeamId(null), 2500);
  };

  const handleCard = async (team) => {
    if (cardBusyId) return;
    setCardBusyId(team.id);
    try {
      await exportArenaTeamCard({ team });
    } catch (err) {
      console.error('arena card export failed', err);
    } finally {
      setCardBusyId(null);
    }
  };

  const cardProps = (team) => ({
    team, summary,
    copied: copiedTeamId === team.id,
    busy: cardBusyId === team.id,
    onCopy: handleCopyTeam,
    onCard: handleCard,
  });

  const counterResults = useMemo(() => {
    if (!counter) return [];
    const list = onlyMine && summary.hasBox ? counter.results.filter((t) => t.isComplete || t.readyWithSwaps) : counter.results;
    return showAllCounters ? list : list.slice(0, 6);
  }, [counter, onlyMine, summary.hasBox, showAllCounters]);

  return (
    <div className="space-y-6 max-w-[1780px] 2xl:max-w-[1880px] mx-auto pb-16 animate-in fade-in duration-300">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-r from-[#0c1424] via-[#0d172e] to-[#070b12] p-6 sm:p-8 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono font-bold uppercase">
            <Swords className="w-3.5 h-3.5" />
            <span>Summoners War Arena • 4v4 Tactical Comps</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            สูตรทีมบุก & ตั้งรับอารีน่า (Arena Offense & Defense)
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
            ทีมบุก {summary.totalAo} สูตร · ทีมรับ {summary.totalAd} สูตร จากคอมมูนิตี้ระดับสูง รวมสายแสง-มืด {summary.ldTeams} ทีม
            พร้อมตัวแทนแบบประหยัดทุกสูตร, ตัวค้นหาทีมแก้จากทีมรับที่เจอ และเช็กได้ว่ากล่องของคุณจัดทีมไหนได้ทันที
          </p>
          <p className="text-[11px] text-slate-500 leading-relaxed max-w-3xl">
            ทุกชื่อและลีดสกิลตรวจกับฐานข้อมูล SWM แล้ว · อารีน่าปกติไม่มีสถิติสาธารณะ จึงไม่มี % อัตราชนะ — Tier คือความเห็นร่วมของคอมมูนิตี้ ไม่ใช่ตัวเลขที่วัดจริง
            {meta?.updatedAt ? ` · อัปเดต ${meta.updatedAt}` : ''}
          </p>
        </div>

        {/* Status KPI */}
        <div className="relative z-10 flex items-center gap-3 shrink-0">
          {summary.hasBox ? (
            <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3.5 flex items-center gap-4 text-xs font-mono shadow-xl">
              <div>
                <div className="text-slate-400 text-[11px]">ทีมบุกพร้อมรบ (AO)</div>
                <div className="text-emerald-400 font-bold text-base">{summary.readyAo} / {summary.totalAo} ทีม</div>
                {summary.swapAo > 0 && <div className="text-[10px] text-amber-300">+{summary.swapAo} ถ้าใช้ตัวแทน</div>}
              </div>
              <div className="w-px h-8 bg-white/10"></div>
              <div>
                <div className="text-slate-400 text-[11px]">ทีมรับพร้อมรบ (AD)</div>
                <div className="text-cyan-400 font-bold text-base">{summary.readyAd} / {summary.totalAd} ทีม</div>
                {summary.swapAd > 0 && <div className="text-[10px] text-amber-300">+{summary.swapAd} ถ้าใช้ตัวแทน</div>}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-white/[0.04] border border-emerald-500/20 p-3 flex items-center gap-3 text-xs shadow-xl">
              <div>
                <div className="text-slate-400 text-[10px] font-mono">โหมดสูตรสาธารณะ</div>
                <div className="text-emerald-400 font-bold text-xs flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>ดูได้ทุกคน ไม่ต้องล็อกอิน ไม่ต้องใช้ JSON</span>
                </div>
              </div>
              <button
                onClick={() => setUserBox(loadDemoBox())}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/20"
                title="คลิกเพื่อทดสอบระบบเช็คมอนสเตอร์จากกล่องตัวอย่าง"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>ลองกล่องตัวอย่าง</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Navigation Mode Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2 overflow-x-auto text-xs sm:text-sm font-bold">
          <button onClick={() => switchTab('ao')} className={tabClass(activeTab === 'ao', 'bg-rose-600 shadow-rose-600/25')}>
            <Swords className="w-4 h-4" />
            <span>⚔️ ทีมบุก (AO) · {summary.totalAo}</span>
          </button>
          <button onClick={() => switchTab('ad')} className={tabClass(activeTab === 'ad', 'bg-blue-600 shadow-blue-600/25')}>
            <Shield className="w-4 h-4" />
            <span>🛡️ ทีมตั้งรับ (AD) · {summary.totalAd}</span>
          </button>
          <button onClick={() => switchTab('counter')} className={tabClass(activeTab === 'counter', 'bg-orange-600 shadow-orange-600/25')}>
            <Crosshair className="w-4 h-4" />
            <span>🎯 เจอทีมรับนี้ บุกด้วยอะไร</span>
          </button>
          <button onClick={() => switchTab('mybox')} className={tabClass(activeTab === 'mybox', 'bg-emerald-600 shadow-emerald-600/25')}>
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>
              {summary.hasBox
                ? `⚡ ทีมที่ฉันจัดได้ (${summary.readyAo + summary.readyAd + summary.swapAo + summary.swapAd} ทีม)`
                : '⚡ เช็คทีมจากไอดีของคุณ (SWEX)'}
            </span>
          </button>
          <button onClick={() => switchTab('rush')} className={tabClass(activeTab === 'rush', 'bg-amber-600 shadow-amber-600/25')}>
            <Clock className="w-4 h-4 text-amber-300" />
            <span>🕒 กลยุทธ์ Rush Hour & สลับทีมรับ</span>
          </button>
        </div>

        {/* Search Bar (only in AO/AD/MyBox tabs) */}
        {activeTab !== 'rush' && activeTab !== 'counter' && (
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อทีม มอนสเตอร์ หรือตัวแทน..."
              className="w-full bg-[#070b14] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        )}
      </div>

      {/* 3. Content */}
      {activeTab === 'rush' && <ArenaRushHourHub onNavigate={onNavigate} />}

      {activeTab === 'counter' && (
        <div className="space-y-5">
          <EnemyPicker
            picks={enemyPicks}
            onChange={setEnemyPicks}
            onSearch={runCounterSearch}
            onClear={handleClearCounter}
            onReorder={handleReorder}
            presets={defense}
          />

          {counter && (
            <>
              {/* Enemy profile */}
              <div className="rounded-3xl border border-orange-500/20 bg-gradient-to-r from-[#1a1010] via-[#120d14] to-[#070b14] p-5 space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="text-sm font-black text-white">
                    ทีมรับ: <span className="text-orange-300">{counter.enemy.members.map((m) => m.name).join(' · ')}</span>
                    <span className="text-[11px] text-slate-500 font-normal ml-2">(ลีด: {counter.enemy.leader})</span>
                  </div>
                  <button onClick={copyCounterLink} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/10 flex items-center gap-1.5 cursor-pointer">
                    {linkCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <LinkIcon className="w-3.5 h-3.5 text-slate-400" />}
                    <span>{linkCopied ? 'คัดลอกลิงก์แล้ว' : 'คัดลอกลิงก์ผลนี้'}</span>
                  </button>
                </div>
                {counter.enemy.chips.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {counter.enemy.chips.map((c) => (
                      <span key={c.key} className="px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-200 border border-orange-500/25 text-[11px] font-mono">{c.label}</span>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400">ไม่พบกลไกเด่นจากสกิลของทีมนี้ — จัดอันดับตามความเร็ว/ดาเมจทั่วไป</div>
                )}
                {counter.enemy.unknown.length > 0 && (
                  <div className="text-[11px] text-slate-500">ไม่มีข้อมูลสกิลของ: {counter.enemy.unknown.join(', ')}</div>
                )}
                {counter.enemy.otherLeads.length > 0 && (
                  <div className="text-[11px] text-slate-500">ตัวอื่นที่อาจเป็นลีดแทน: {counter.enemy.otherLeads.join(', ')} — กด "ตั้งเป็นลีด" ที่ช่องด้านบนถ้าคู่ต่อสู้ใช้ตัวนั้นนำ</div>
                )}
                {counter.matched.length > 0 && (
                  <div className="text-xs text-slate-300 space-y-1 pt-1 border-t border-white/[0.06]">
                    {counter.matched.slice(0, 3).map((m) => (
                      <div key={m.team.id}>
                        <span className={`font-bold ${m.overlap >= 3 ? 'text-blue-300' : 'text-slate-400'}`}>
                          {m.overlap >= 4 ? 'ตรงกับสูตร' : m.overlap === 3 ? 'ใกล้เคียงสูตร (3/4)' : 'คล้ายสูตร (2/4)'}: {m.team.nameTh}
                        </span>
                        {m.overlap >= 3 && m.team.counterTips && <span className="text-amber-300"> — วิธีแก้ทาง: {m.team.counterTips}</span>}
                      </div>
                    ))}
                  </div>
                )}
                <div className="text-[11px] text-slate-500">อันดับด้านล่างมาจากการเทียบกลไกสกิลจริง (ล้างบัฟ / ลีด SPD / ชุบ / สวนกลับ / CC…) กับสูตรบุกในแค็ตตาล็อก — เป็นลำดับความเหมาะสม ไม่ใช่ % ชนะ</div>
              </div>

              {/* Results */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="text-sm font-black text-white">ทีมบุกที่แนะนำ <span className="text-slate-500 font-normal text-xs">({counterResults.length} / {counter.results.length})</span></div>
                {summary.hasBox && (
                  <button onClick={() => setOnlyMine((v) => !v)} className={chip(onlyMine, 'blue')}>
                    {onlyMine ? '✓ ' : ''}เฉพาะทีมที่ฉันจัดได้
                  </button>
                )}
              </div>
              {counterResults.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-[#0c1220] p-10 text-center text-xs text-slate-400">
                  ไม่มีสูตรที่จัดได้ครบจากกล่องนี้ — ปิดตัวกรอง "เฉพาะทีมที่ฉันจัดได้" เพื่อดูสูตรทั้งหมดพร้อมตัวแทน
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  {counterResults.map((team, idx) => (
                    <TeamCard
                      key={team.id}
                      {...cardProps(team)}
                      compact
                      extra={(
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-300 font-mono font-black flex items-center justify-center text-[11px]">#{idx + 1}</span>
                            {team.recommended && <span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[11px] font-bold">สูตรแก้ที่ระบุไว้</span>}
                            {team.score <= 0 && <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[11px] font-bold">ไม่แนะนำกับทีมนี้</span>}
                          </div>
                          {team.reasons.length > 0 && (
                            <ul className="space-y-0.5">
                              {team.reasons.map((r, i) => <li key={i} className="text-emerald-300 flex gap-1.5"><span className="shrink-0">✓</span><span>{r}</span></li>)}
                            </ul>
                          )}
                          {team.warnings.length > 0 && (
                            <ul className="space-y-0.5">
                              {team.warnings.map((w, i) => <li key={i} className="text-rose-300 flex gap-1.5"><span className="shrink-0">⚠</span><span>{w}</span></li>)}
                            </ul>
                          )}
                          {team.reasons.length === 0 && team.warnings.length === 0 && (
                            <div className="text-slate-500">ไม่มีข้อได้เปรียบ/เสียเปรียบเฉพาะทาง — ใช้ได้ถ้าคุณเร็วกว่า</div>
                          )}
                        </div>
                      )}
                    />
                  ))}
                </div>
              )}
              {!showAllCounters && counter.results.length > counterResults.length && (
                <div className="text-center">
                  <button onClick={() => setShowAllCounters(true)} className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 text-xs font-bold border border-white/10 cursor-pointer">
                    แสดงสูตรบุกทั้งหมด ({counter.results.length})
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab !== 'rush' && activeTab !== 'counter' && (
        <>
          {/* Filters: tier, light/dark, archetype */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-[11px] text-slate-500 font-mono shrink-0">Tier</span>
              <button onClick={() => setTierFilter('all')} className={chip(tierFilter === 'all')}>ทั้งหมด</button>
              {['S', 'A', 'B'].map((t) => (
                <button key={t} onClick={() => setTierFilter(t)} className={chip(tierFilter === t)} title={TIER_LABEL[t]}>Tier {t}</button>
              ))}
              <span className="w-px h-4 bg-white/10 shrink-0 mx-1" />
              <span className="text-[11px] text-slate-500 font-mono shrink-0">แสง-มืด</span>
              {LD_OPTIONS.map((o) => (
                <button key={o.id} onClick={() => setLdFilter(o.id)} className={chip(ldFilter === o.id, 'purple')}>{o.label}</button>
              ))}
            </div>
            {archetypes.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-[11px] text-slate-500 font-mono shrink-0">สไตล์</span>
                <button onClick={() => setSelectedArchetype('all')} className={chip(selectedArchetype === 'all')}>ทั้งหมด</button>
                {archetypes.map((a) => (
                  <button key={a} onClick={() => setSelectedArchetype(a)} className={chip(selectedArchetype === a)}>{a}</button>
                ))}
              </div>
            )}
            <div className="text-[11px] text-slate-500 font-mono">แสดง {filteredList.length} / {rawList.length} ทีม</div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {filteredList.map((team) => <TeamCard key={team.id} {...cardProps(team)} />)}
          </div>

          {filteredList.length === 0 && (
            activeTab === 'mybox' && !summary.hasBox ? (
              <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-[#0c1a14] via-[#09141e] to-[#070b14] p-8 sm:p-12 text-center space-y-4 shadow-2xl">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30 shadow-lg">
                  <Sparkles className="w-7 h-7" />
                </div>
                <div className="space-y-1.5 max-w-xl mx-auto">
                  <h3 className="text-xl font-black text-white">
                    ตรวจเช็คทีม Arena จากกล่องมอนสเตอร์ของคุณ (Box Matcher)
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    สูตรทั้งหมด {summary.totalAo + summary.totalAd} ทีมในแท็บ <strong>"ทีมบุก (AO)"</strong> และ <strong>"ทีมรับ (AD)"</strong> สามารถเปิดดูรายละเอียด รูน และลำดับเทิร์นได้ทุกคนโดยไม่ต้องล็อกอิน
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    หากต้องการให้ระบบวิเคราะห์ว่าไอดีของคุณมีตัวละครพร้อมจัดทีมไหนบ้าง (รวมทีมที่จัดได้ด้วยตัวแทน) สามารถทดลองกด <strong>"กล่องตัวอย่าง (Demo Box)"</strong> ได้ทันที หรือนำเข้าไฟล์ JSON จาก SWEX
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
                  <button
                    onClick={() => setUserBox(loadDemoBox())}
                    className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/25"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>🎮 ลองใช้กล่องตัวอย่าง (Demo Box)</span>
                  </button>
                  <button
                    onClick={() => onNavigate && onNavigate('my-box')}
                    className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center gap-2 cursor-pointer border border-white/10"
                  >
                    <span>📁 นำเข้าไฟล์ SWEX ที่หน้า My Box</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-white/10 bg-[#0c1220] p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <Info className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  {activeTab === 'mybox' ? 'ยังไม่มีสูตรที่จัดได้ครบจากกล่องนี้' : 'ไม่พบทีมตามเงื่อนไขที่เลือก'}
                </h3>
                <p className="text-xs text-slate-400">
                  {activeTab === 'mybox'
                    ? 'ดูแท็บ AO/AD — การ์ดจะบอกว่าแต่ละสูตรขาดตัวไหน และตัวแทนตัวไหนที่คุณมีอยู่แล้ว'
                    : 'ลองล้างคำค้นหา ปรับ Tier / แสง-มืด หรือสลับไปยังแท็บอื่นเพื่อดูทีมเพิ่มเติม'}
                </p>
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}
