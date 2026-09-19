import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import MonsterAvatar from '../components/MonsterAvatar';
import ArenaRushHourHub from '../components/ArenaRushHourHub';
import { matchArenaTeams } from '../utils/arenaMatcher';
import { loadBox, loadDemoBox } from '../utils/swexImport';

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

const chip = (active, tone = 'blue') =>
  `px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer shrink-0 ${
    active
      ? tone === 'purple'
        ? 'bg-fuchsia-600/25 text-fuchsia-200 border-fuchsia-500/40'
        : 'bg-blue-600/25 text-blue-200 border-blue-500/40'
      : 'bg-white/[0.03] text-slate-400 border-white/[0.08] hover:text-white'
  }`;

export default function ArenaMetaView({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('ao'); // 'ao' | 'ad' | 'mybox' | 'rush'
  const [selectedArchetype, setSelectedArchetype] = useState('all');
  const [tierFilter, setTierFilter] = useState('all'); // 'all' | 'S' | 'A' | 'B'
  const [ldFilter, setLdFilter] = useState('all'); // 'all' | 'no-ld' | 'ld'
  const [copiedTeamId, setCopiedTeamId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userBox, setUserBox] = useState(() => loadBox());

  const arenaData = useMemo(() => matchArenaTeams(userBox), [userBox]);

  const { offense, defense, summary, meta } = arenaData;

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
            พร้อมตัวแทนแบบประหยัดทุกสูตร และเช็กได้ว่ากล่องของคุณจัดทีมไหนได้ทันที
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
          <button
            onClick={() => switchTab('ao')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'ao'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/25'
                : 'text-slate-400 hover:text-white bg-white/[0.03]'
            }`}
          >
            <Swords className="w-4 h-4" />
            <span>⚔️ ทีมบุก (AO) · {summary.totalAo}</span>
          </button>

          <button
            onClick={() => switchTab('ad')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'ad'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                : 'text-slate-400 hover:text-white bg-white/[0.03]'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>🛡️ ทีมตั้งรับ (AD) · {summary.totalAd}</span>
          </button>

          <button
            onClick={() => switchTab('mybox')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'mybox'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                : 'text-slate-400 hover:text-white bg-white/[0.03]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>
              {summary.hasBox
                ? `⚡ ทีมที่ฉันจัดได้ (${summary.readyAo + summary.readyAd + summary.swapAo + summary.swapAd} ทีม)`
                : '⚡ เช็คทีมจากไอดีของคุณ (SWEX)'}
            </span>
          </button>

          <button
            onClick={() => switchTab('rush')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'rush'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/25'
                : 'text-slate-400 hover:text-white bg-white/[0.03]'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-300" />
            <span>🕒 กลยุทธ์ Rush Hour & สลับทีมรับ</span>
          </button>
        </div>

        {/* Search Bar (only in AO/AD/MyBox tabs) */}
        {activeTab !== 'rush' && (
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

      {/* 3. Content: Rush Hour Hub OR Team Cards Grid */}
      {activeTab === 'rush' ? (
        <ArenaRushHourHub onNavigate={onNavigate} />
      ) : (
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
        {filteredList.map((team) => (
          <div
            key={team.id}
            className="rounded-3xl border border-white/[0.08] bg-[#0c1220] p-5 sm:p-6 space-y-4 shadow-xl hover:border-blue-500/30 transition-all flex flex-col justify-between"
          >
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

                <button
                  onClick={() => handleCopyTeam(team)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/10 flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copiedTeamId === team.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{copiedTeamId === team.id ? 'คัดลอกแล้ว' : 'คัดลอกสูตร'}</span>
                </button>
              </div>

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

              {/* Turn Order (AO) OR Win Condition (AD) */}
              {team.turnOrder && (
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

              {team.winCondition && (
                <div className="text-xs text-slate-300 bg-blue-500/10 border border-blue-500/20 p-2.5 rounded-xl">
                  <strong className="text-blue-300">เงื่อนไขชัยชนะ:</strong> {team.winCondition}
                </div>
              )}

              {/* Rune Guidance */}
              <div className="text-xs text-slate-300 bg-slate-900/80 border border-white/[0.06] p-3 rounded-xl leading-relaxed">
                <div className="font-bold text-amber-300 font-mono text-[11px] mb-1">แนวทางการใส่รูน & สปีด:</div>
                <p>{team.runeGuidance || team.runeBuilds}</p>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-400 leading-relaxed italic">
                💡 {team.description}
              </p>
            </div>

            {/* Matchup Advice Footer */}
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
          </div>
        ))}
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
