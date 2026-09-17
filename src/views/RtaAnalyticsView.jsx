import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  Swords, 
  Shield, 
  Zap, 
  Flame, 
  Search, 
  Filter, 
  TrendingUp, 
  BarChart3, 
  Clock, 
  Crown, 
  XCircle, 
  Users, 
  Target, 
  ChevronRight,
  ExternalLink,
  Info,
  Sparkles
} from 'lucide-react';
import MonsterAvatar from '../components/MonsterAvatar';
import tierData from '../data/swrtTierList.json';
import metaData from '../data/swrtMetaMonsters.json';
import cutoffData from '../data/swrtRankCutoffs.json';
import replaysData from '../data/swrtRecentReplays.json';
import highdataMap from '../data/swrtMonsterHighdata.json';

export default function RtaAnalyticsView({ onNavigate, subItem }) {
  const getInitialTab = () => {
    if (subItem === 'rta-meta') return 'stats';
    if (subItem === 'rta-replays') return 'replays';
    if (subItem === 'rta-cutoffs') return 'cutoffs';
    return 'tierlist';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [selectedRank, setSelectedRank] = useState('guardian'); // 'guardian' | 'conqueror' | 'all'
  const [selectedTier, setSelectedTier] = useState('SS');
  const [selectedElement, setSelectedElement] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('pickRate'); // 'pickRate' | 'winRate' | 'banRate' | 'firstPickRate'
  const [expandedMonster, setExpandedMonster] = useState(null);
  const [replaySearch, setReplaySearch] = useState('');

  React.useEffect(() => {
    if (subItem === 'rta-meta') setActiveTab('stats');
    else if (subItem === 'rta-replays') setActiveTab('replays');
    else if (subItem === 'rta-cutoffs') setActiveTab('cutoffs');
    else if (subItem === 'rta-tierlist') setActiveTab('tierlist');
  }, [subItem]);

  // Elements list
  const elements = [
    { id: 'all', name: 'ทุกธาตุ' },
    { id: 'fire', name: 'ไฟ (Fire)' },
    { id: 'water', name: 'น้ำ (Water)' },
    { id: 'wind', name: 'ลม (Wind)' },
    { id: 'light', name: 'แสง (Light)' },
    { id: 'dark', name: 'มืด (Dark)' }
  ];

  // Tier metadata
  const tierMeta = {
    SS: { label: 'SS Tier', sub: 'God Tier ไร้เทียมทาน', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
    S: { label: 'S Tier', sub: 'Top Meta ยอดนิยม', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
    A: { label: 'A Tier', sub: 'Strong ตัวเลือกหลัก', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
    B: { label: 'B Tier', sub: 'Viable ตัวเลือกเฉพาะทาง', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
    C: { label: 'C Tier', sub: 'Situational ตามสถานการณ์', color: 'text-slate-400 bg-slate-500/10 border-slate-500/30' },
    D: { label: 'D Tier', sub: 'Off-Meta นอกกระแส', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' }
  };

  // Current active tier dictionary based on selected rank level
  const currentRankTiers = useMemo(() => {
    if (tierData.ranks && tierData.ranks[selectedRank]) {
      return tierData.ranks[selectedRank].tiers || {};
    }
    return tierData.tiers || {};
  }, [selectedRank]);

  // Filtered Tier List (Guaranteed unique per monsterId)
  const displayedTierMonsters = useMemo(() => {
    let list = [];
    if (selectedTier === 'all') {
      for (const [t, arr] of Object.entries(currentRankTiers)) {
        list.push(...arr.map(m => ({ ...m, tier: t })));
      }
    } else {
      list = (currentRankTiers[selectedTier] || []).map(m => ({ ...m, tier: selectedTier }));
    }

    return list.filter(m => {
      if (selectedElement !== 'all' && m.element !== selectedElement) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase().trim();
      const nEn = (m.name || '').toLowerCase();
      const nTh = (m.thaiName || '').toLowerCase();
      return nEn.includes(q) || nTh.includes(q);
    });
  }, [currentRankTiers, selectedTier, selectedElement, searchQuery]);

  // Filtered Meta Monsters (Sortable Table)
  const displayedMeta = useMemo(() => {
    let list = [...metaData];
    if (selectedElement !== 'all') {
      list = list.filter(m => m.element === selectedElement);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(m => (m.name || '').toLowerCase().includes(q) || (m.thaiName || '').toLowerCase().includes(q));
    }
    list.sort((a, b) => (b[sortField] || 0) - (a[sortField] || 0));
    return list;
  }, [selectedElement, searchQuery, sortField]);

  // Filtered Replays
  const displayedReplays = useMemo(() => {
    if (!replaySearch) return replaysData;
    const q = replaySearch.toLowerCase().trim();
    return replaysData.filter(r => {
      const p1Match = r.player1?.name?.toLowerCase().includes(q) || 
        r.player1?.monsters?.some(m => m.name.toLowerCase().includes(q) || m.thaiName.toLowerCase().includes(q));
      const p2Match = r.player2?.name?.toLowerCase().includes(q) || 
        r.player2?.monsters?.some(m => m.name.toLowerCase().includes(q) || m.thaiName.toLowerCase().includes(q));
      return p1Match || p2Match;
    });
  }, [replaySearch]);

  const nowLine = cutoffData.now || {};
  const historyLine = cutoffData.history || [];

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-[#1c2738] pb-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1">
            <Trophy className="w-4 h-4" />
            SWRT Intelligence Core • World Arena (RTA) Season {tierData.season} ({tierData.version})
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <span>วิเคราะห์ RTA อารีน่าโลก & สถิติ SWRT</span>
            <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-xs font-mono font-bold">
              LIVE 2026
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
            ฐานข้อมูลจัดอันดับ RTA ฉบับสมบูรณ์: Tier List เมต้าซีซั่น 38, อัตรา Pick / Ban / Win จาก 6.8 ล้านแมตช์, คะแนนตัดแรงค์ G1-G3 เรียลไทม์ และรีเพลย์สดระดับ Guardian
          </p>
        </div>

        {/* Global Telemetry Card */}
        <div className="bg-[#101724] border border-[#1d2b3f] p-3 rounded-xl flex items-center gap-4 self-start lg:self-auto text-xs font-mono shadow-md">
          <div>
            <div className="text-slate-400 text-[10px]">ซีซั่นปัจจุบัน</div>
            <div className="text-cyan-400 font-bold text-sm">Season {tierData.season}</div>
          </div>
          <div className="w-px h-8 bg-[#1d2b3f]"></div>
          <div>
            <div className="text-slate-400 text-[10px]">แพตช์ตัวเกม</div>
            <div className="text-purple-400 font-bold text-sm">{tierData.version}</div>
          </div>
          <div className="w-px h-8 bg-[#1d2b3f]"></div>
          <div>
            <div className="text-slate-400 text-[10px]">แมตช์ที่เก็บสถิติ</div>
            <div className="text-emerald-400 font-bold text-sm">6.8M+ แมตช์</div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#0e1522] border border-[#1d2b3f] overflow-x-auto shadow-lg">
        <button
          onClick={() => setActiveTab('tierlist')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'tierlist'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-300 hover:text-white hover:bg-[#152030]'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>🏆 Tier List มอนสเตอร์ RTA (Season 38)</span>
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'stats'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-300 hover:text-white hover:bg-[#152030]'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>📊 สถิติเมต้า (Pick / Win / Ban Rate)</span>
        </button>

        <button
          onClick={() => setActiveTab('replays')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'replays'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'text-slate-300 hover:text-white hover:bg-[#152030]'
          }`}
        >
          <Swords className="w-4 h-4" />
          <span>⚔️ รีเพลย์การต่อสู้สดระดับ Guardian ({replaysData.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('cutoffs')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'cutoffs'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
              : 'text-slate-300 hover:text-white hover:bg-[#152030]'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>🎯 คะแนนตัดแรงค์ RTA (Rank Cutoffs)</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: TIER LIST */}
      {/* ======================================================== */}
      {activeTab === 'tierlist' && (
        <div className="space-y-5">
          {/* Controls: Tier Pills + Search + Elements */}
          <div className="bg-[#101724] p-4 rounded-2xl border border-[#1d2b3f] space-y-3 shadow-xl">
            {/* Rank Bracket Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-[#182333]">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 font-bold mr-1">กลุ่มแรงก์ RTA:</span>
                <div className="flex items-center gap-1 bg-[#0c121c] p-1 rounded-xl border border-[#1d2b3f]">
                  {[
                    { id: 'guardian', label: '👑 Guardian (G1-G3)' },
                    { id: 'conqueror', label: '⭐ Conqueror (C1-C3)' },
                    { id: 'all', label: '🌐 All Ranks (รวมทุกระดับ)' }
                  ].map(r => (
                    <button
                      key={r.id}
                      onClick={() => {
                        setSelectedRank(r.id);
                        setExpandedMonster(null);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedRank === r.id
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-[11px] font-mono text-cyan-400 bg-cyan-950/40 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                {selectedRank === 'guardian' ? 'เฉพาะการ์เดียน (G1-G3) • มาตรฐานการแข่งระดับโปร' :
                 selectedRank === 'conqueror' ? 'ระดับคอนเคอเรอร์ (C1-C3) • เมต้าผู้เล่นระดับกลาง-สูง' :
                 'สถิติรวมทุกระดับการแข่งขัน'}
              </div>
            </div>

            {/* Tier Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 font-bold mr-1">ระดับเทียร์:</span>
              {['SS', 'S', 'A', 'B', 'C', 'D', 'all'].map((t) => {
                const isSelected = selectedTier === t;
                const count = t === 'all' 
                  ? Object.values(currentRankTiers).reduce((a, b) => a + b.length, 0)
                  : (currentRankTiers[t] || []).length;
                return (
                  <button
                    key={t}
                    onClick={() => setSelectedTier(t)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? t === 'SS' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30' :
                          t === 'S' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' :
                          t === 'A' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' :
                          'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                        : 'bg-[#0c121c] border border-[#1d2b3f] text-slate-300 hover:text-white hover:bg-[#152030]'
                    }`}
                  >
                    <span>{t === 'all' ? 'ทุกเทียร์' : `${t} Tier`}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${isSelected ? 'bg-black/30' : 'bg-[#182333]'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Filter Row: Search & Element */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#182333]">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อมอนสเตอร์ใน Tier List..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0c121c] border border-[#1d2b3f] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
                <span className="text-xs text-slate-400 font-bold mr-1">ธาตุ:</span>
                {elements.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => setSelectedElement(e.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                      selectedElement === e.id
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-[#0c121c] border border-[#1d2b3f] text-slate-300 hover:text-white'
                    }`}
                  >
                    {e.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tier Description Alert */}
          {selectedTier !== 'all' && tierMeta[selectedTier] && (
            <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${tierMeta[selectedTier].color}`}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span className="font-bold">{tierMeta[selectedTier].label}:</span>
                <span>{tierMeta[selectedTier].sub} • พบทั้งหมด {displayedTierMonsters.length} ตัวที่ตรงตามเงื่อนไข</span>
              </div>
              <span className="text-[11px] font-mono">คลิกที่การ์ดเพื่อดูตัวแก้ทาง & คู่หูที่ดีที่สุด</span>
            </div>
          )}

          {/* Tier Monsters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {displayedTierMonsters.map((monster) => {
              const highdata = highdataMap[monster.monsterId];
              const isExpanded = expandedMonster === monster.monsterId;

              return (
                <div
                  key={`${selectedRank}-${monster.monsterId}`}
                  onClick={() => setExpandedMonster(isExpanded ? null : monster.monsterId)}
                  className={`bg-[#101724] border rounded-2xl p-4 transition-all cursor-pointer shadow-md flex flex-col justify-between group ${
                    isExpanded 
                      ? 'border-cyan-500 ring-2 ring-cyan-500/20 bg-[#121c2c]' 
                      : 'border-[#1d2b3f] hover:border-blue-500/60 hover:-translate-y-0.5'
                  }`}
                >
                  <div>
                    {/* Top Row: Avatar, Name, AI Score */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <MonsterAvatar monster={monster} size="md" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${
                              monster.element === 'fire' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                              monster.element === 'water' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' :
                              monster.element === 'wind' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                              monster.element === 'light' ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/30' :
                              'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            }`}>
                              {monster.element}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold">
                              {monster.tier ? `${monster.tier} Tier` : ''}
                            </span>
                          </div>

                          <h3 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors mt-1 truncate max-w-[130px]">
                            {monster.thaiName || monster.name}
                          </h3>
                          <div className="text-[11px] text-slate-400 truncate max-w-[130px]">
                            {monster.name}
                          </div>
                        </div>
                      </div>

                      {/* AI Score Badge */}
                      {monster.aiScore > 0 && (
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] text-slate-400 font-mono">AI RATING</span>
                          <span className="text-xs font-mono font-black text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                            ★ {monster.aiScore.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Stats Metric Strip */}
                    <div className="grid grid-cols-4 gap-1.5 mt-3 pt-2.5 border-t border-[#182333] text-center font-mono">
                      <div className="bg-[#0c121c] p-1.5 rounded-lg border border-[#162232]">
                        <div className="text-[9px] text-slate-400">PICK%</div>
                        <div className="text-xs font-bold text-white">{monster.pickRate}%</div>
                      </div>

                      <div className="bg-[#0c121c] p-1.5 rounded-lg border border-[#162232]">
                        <div className="text-[9px] text-slate-400">WIN%</div>
                        <div className={`text-xs font-bold ${monster.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {monster.winRate}%
                        </div>
                      </div>

                      <div className="bg-[#0c121c] p-1.5 rounded-lg border border-[#162232]">
                        <div className="text-[9px] text-slate-400">BAN%</div>
                        <div className="text-xs font-bold text-amber-400">{monster.banRate}%</div>
                      </div>

                      <div className="bg-[#0c121c] p-1.5 rounded-lg border border-[#162232]">
                        <div className="text-[9px] text-slate-400">1st PICK</div>
                        <div className="text-xs font-bold text-cyan-400">{monster.firstPickRate}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Highdata (Hard Counters & Synergies) */}
                  {isExpanded && highdata && (
                    <div className="mt-3 pt-3 border-t border-[#1d2b3f] space-y-3 text-xs animate-in fade-in duration-150">
                      {/* Synergies */}
                      <div>
                        <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 mb-1.5">
                          <Users className="w-3.5 h-3.5" />
                          <span>คู่หูที่ดีที่สุด (Best Synergies):</span>
                        </div>
                        <div className="space-y-1">
                          {(highdata.synergies || []).map((syn, sIdx) => (
                            <div key={sIdx} className="flex items-center justify-between p-1.5 rounded-lg bg-[#090e17] border border-[#162132]">
                              <div className="flex items-center gap-2">
                                <img src={syn.avatarUrl} alt={syn.name} className="w-6 h-6 rounded border border-emerald-500/40" />
                                <span className="text-[11px] text-slate-200 font-semibold">{syn.thaiName || syn.name}</span>
                              </div>
                              <span className="text-[11px] font-mono font-bold text-emerald-400">{syn.winRate}% WR</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Hard Counters */}
                      <div>
                        <div className="text-[11px] font-bold text-rose-400 flex items-center gap-1 mb-1.5">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>ตัวแก้ทางที่แพ้บ่อยสุด (Hard Counters):</span>
                        </div>
                        <div className="space-y-1">
                          {(highdata.counters || []).map((cnt, cIdx) => (
                            <div key={cIdx} className="flex items-center justify-between p-1.5 rounded-lg bg-[#090e17] border border-[#162132]">
                              <div className="flex items-center gap-2">
                                <img src={cnt.avatarUrl} alt={cnt.name} className="w-6 h-6 rounded border border-rose-500/40" />
                                <span className="text-[11px] text-slate-200 font-semibold">{cnt.thaiName || cnt.name}</span>
                              </div>
                              <span className="text-[11px] font-mono font-bold text-rose-400">{cnt.winRate}% WR</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Footer hint */}
                  <div className="mt-2 text-right">
                    <span className="text-[10px] text-slate-500 group-hover:text-cyan-400 transition-colors">
                      {isExpanded ? '▲ ย่อข้อมูล' : '▼ ดูตัวแก้ทาง & คู่หู'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: META STATISTICS TABLE */}
      {/* ======================================================== */}
      {activeTab === 'stats' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-[#101724] p-4 rounded-2xl border border-[#1d2b3f] flex flex-col md:flex-row items-center justify-between gap-3 shadow-xl">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ค้นหาชื่อมอนสเตอร์ในตารางสถิติ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0c121c] border border-[#1d2b3f] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Sort Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 self-start md:self-auto text-xs">
              <span className="text-slate-400 font-bold mr-1">เรียงตาม:</span>
              {[
                { id: 'pickRate', label: 'Pick Rate %' },
                { id: 'winRate', label: 'Win Rate %' },
                { id: 'banRate', label: 'Ban Rate %' },
                { id: 'firstPickRate', label: 'First Pick %' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSortField(s.id)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    sortField === s.id
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                      : 'bg-[#0c121c] border border-[#1d2b3f] text-slate-300 hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#101724] border border-[#1d2b3f] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead>
                  <tr className="border-b border-[#1d2b3f] bg-[#0c121c] text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">มอนสเตอร์</th>
                    <th className="py-3 px-4 text-right">จำนวนเกมที่เลือก (Pick Count)</th>
                    <th className="py-3 px-4 text-center">อัตราการเลือก (Pick Rate)</th>
                    <th className="py-3 px-4 text-center">อัตราการชนะ (Win Rate)</th>
                    <th className="py-3 px-4 text-center">อัตราการแบน (Ban Rate)</th>
                    <th className="py-3 px-4 text-center">First Pick Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#182333]">
                  {displayedMeta.map((m, idx) => (
                    <tr key={m.monsterId} className="hover:bg-[#131c2c] transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-500 font-bold">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={m.avatarUrl} 
                            alt={m.name} 
                            className="w-10 h-10 rounded-lg bg-black/40 border border-slate-700 p-0.5 shrink-0"
                            onError={(e) => { e.target.src = 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0001_0_0.png'; }}
                          />
                          <div>
                            <div className="font-bold text-white text-xs sm:text-sm">
                              {m.thaiName || m.name}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {m.name} ({m.element})
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-300 font-semibold">
                        {m.pickTotal?.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-white">
                        {m.pickRate}%
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`font-mono font-bold text-xs ${m.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {m.winRate}%
                          </span>
                          <div className="w-16 h-1.5 bg-[#090e17] rounded-full overflow-hidden mt-1">
                            <div 
                              className={`h-full ${m.winRate >= 50 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                              style={{ width: `${Math.min(100, m.winRate)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-amber-400 font-semibold">
                        {m.banRate}%
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-cyan-400 font-semibold">
                        {m.firstPickRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: LIVE REPLAYS */}
      {/* ======================================================== */}
      {activeTab === 'replays' && (
        <div className="space-y-4">
          {/* Replays Search */}
          <div className="bg-[#101724] p-4 rounded-2xl border border-[#1d2b3f] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ค้นหาตามชื่อผู้เล่น หรือ มอนสเตอร์ในแมตช์..."
                value={replaySearch}
                onChange={(e) => setReplaySearch(e.target.value)}
                className="w-full bg-[#0c121c] border border-[#1d2b3f] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="text-xs text-slate-400 font-mono self-start sm:self-auto">
              แสดงผลการต่อสู้สดระดับ Guardian {displayedReplays.length} แมตช์
            </div>
          </div>

          {/* Replay Cards List */}
          <div className="space-y-3">
            {displayedReplays.map((rep) => {
              const p1 = rep.player1;
              const p2 = rep.player2;
              const p1Won = rep.winner === 1;
              const p2Won = rep.winner === 2;

              return (
                <div 
                  key={rep.id}
                  className="bg-[#101724] border border-[#1d2b3f] rounded-2xl p-4 sm:p-5 shadow-lg space-y-4 hover:border-blue-500/50 transition-all"
                >
                  {/* Match Header */}
                  <div className="flex items-center justify-between text-xs text-slate-400 border-b border-[#182333] pb-2.5 font-mono">
                    <span className="flex items-center gap-1.5 text-cyan-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{rep.date}</span>
                    </span>
                    <span className="text-slate-500">
                      Match ID: #{rep.id}
                    </span>
                  </div>

                  {/* Match Players Versus Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                    {/* Player 1 Card */}
                    <div className={`p-3.5 rounded-xl border transition-all ${
                      p1Won 
                        ? 'bg-emerald-950/20 border-emerald-500/40 ring-1 ring-emerald-500/20' 
                        : 'bg-[#0c121c] border-[#182333]'
                    }`}>
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400 font-mono bg-[#141e2e] px-1.5 py-0.5 rounded">
                            {p1?.country}
                          </span>
                          <span className="font-bold text-white text-sm">
                            {p1?.name}
                          </span>
                          {p1Won && (
                            <span className="flex items-center gap-1 text-[10px] font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full shadow-sm">
                              <Crown className="w-3 h-3" /> ชนะ (WIN)
                            </span>
                          )}
                        </div>
                        <div className="text-right text-xs font-mono">
                          <span className="text-purple-400 font-bold">Rank #{p1?.rank || '-'}</span>
                          <span className="text-slate-400 ml-2">({p1?.score} pts)</span>
                        </div>
                      </div>

                      {/* 5 Monsters Drafted */}
                      <div className="flex items-center gap-2">
                        {(p1?.monsters || []).map((m, mIdx) => (
                          <div key={mIdx} className="relative group">
                            <img 
                              src={m.avatarUrl} 
                              alt={m.name} 
                              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-black/50 border p-0.5 ${
                                m.isBanned 
                                  ? 'border-rose-500 opacity-40 grayscale' 
                                  : m.isLeader 
                                  ? 'border-amber-400 ring-2 ring-amber-400/30' 
                                  : 'border-slate-700'
                              }`}
                              onError={(e) => { e.target.src = 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0001_0_0.png'; }}
                            />
                            {m.isBanned && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
                                <XCircle className="w-6 h-6 text-rose-500" />
                              </div>
                            )}
                            {m.isLeader && (
                              <span className="absolute -top-1.5 -left-1 text-[8px] font-extrabold bg-amber-500 text-slate-950 px-1 rounded shadow">
                                L
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Player 2 Card */}
                    <div className={`p-3.5 rounded-xl border transition-all ${
                      p2Won 
                        ? 'bg-emerald-950/20 border-emerald-500/40 ring-1 ring-emerald-500/20' 
                        : 'bg-[#0c121c] border-[#182333]'
                    }`}>
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400 font-mono bg-[#141e2e] px-1.5 py-0.5 rounded">
                            {p2?.country}
                          </span>
                          <span className="font-bold text-white text-sm">
                            {p2?.name}
                          </span>
                          {p2Won && (
                            <span className="flex items-center gap-1 text-[10px] font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full shadow-sm">
                              <Crown className="w-3 h-3" /> ชนะ (WIN)
                            </span>
                          )}
                        </div>
                        <div className="text-right text-xs font-mono">
                          <span className="text-purple-400 font-bold">Rank #{p2?.rank || '-'}</span>
                          <span className="text-slate-400 ml-2">({p2?.score} pts)</span>
                        </div>
                      </div>

                      {/* 5 Monsters Drafted */}
                      <div className="flex items-center gap-2">
                        {(p2?.monsters || []).map((m, mIdx) => (
                          <div key={mIdx} className="relative group">
                            <img 
                              src={m.avatarUrl} 
                              alt={m.name} 
                              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-black/50 border p-0.5 ${
                                m.isBanned 
                                  ? 'border-rose-500 opacity-40 grayscale' 
                                  : m.isLeader 
                                  ? 'border-amber-400 ring-2 ring-amber-400/30' 
                                  : 'border-slate-700'
                              }`}
                              onError={(e) => { e.target.src = 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0001_0_0.png'; }}
                            />
                            {m.isBanned && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
                                <XCircle className="w-6 h-6 text-rose-500" />
                              </div>
                            )}
                            {m.isLeader && (
                              <span className="absolute -top-1.5 -left-1 text-[8px] font-extrabold bg-amber-500 text-slate-950 px-1 rounded shadow">
                                L
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: RANK CUTOFFS */}
      {/* ======================================================== */}
      {activeTab === 'cutoffs' && (
        <div className="space-y-6">
          {/* Current Live Cutoffs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-400" />
                <span>เกณฑ์คะแนนตัดแรงค์ปัจจุบัน (Live RTA Rank Thresholds)</span>
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                อัปเดตล่าสุด: {nowLine.nowTime || 'เรียลไทม์'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { rank: 'G3 (Guardian 3)', score: nowLine.g3?.score || 1501, cutRank: nowLine.g3?.rank || 300, color: 'border-amber-500/50 text-amber-400' },
                { rank: 'G2 (Guardian 2)', score: nowLine.g2?.score || 1403, cutRank: nowLine.g2?.rank || 1000, color: 'border-purple-500/50 text-purple-400' },
                { rank: 'G1 (Guardian 1)', score: nowLine.g1?.score || 1321, cutRank: nowLine.g1?.rank || 3000, color: 'border-rose-500/50 text-rose-400' },
                { rank: 'P3 (Special 3)', score: nowLine.s3?.score || 1279, cutRank: nowLine.s3?.rank || 5000, color: 'border-cyan-500/50 text-cyan-400' },
                { rank: 'P2 (Special 2)', score: nowLine.s2?.score || 1205, cutRank: nowLine.s2?.rank || 7500, color: 'border-emerald-500/50 text-emerald-400' }
              ].map((tier, idx) => (
                <div key={idx} className={`p-4 rounded-2xl bg-[#101724] border ${tier.color} space-y-1 shadow-lg`}>
                  <div className="text-[11px] font-bold uppercase tracking-wider">{tier.rank}</div>
                  <div className="text-2xl font-black text-white font-mono">{tier.score?.toLocaleString()} คะแนน</div>
                  <div className="text-[11px] text-slate-400 font-mono">อันดับตัด #{tier.cutRank}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Historical Cutoffs Table */}
          {historyLine.length > 0 && (
            <div className="bg-[#101724] border border-[#1d2b3f] rounded-2xl p-5 space-y-4 shadow-xl">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span>ประวัติคะแนนตัดแรงค์ช่วงจบซีซั่น (Historical Cutoff Scores)</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[#1d2b3f] bg-[#0c121c] text-slate-400">
                      <th className="py-2.5 px-4">วันที่บันทึก</th>
                      <th className="py-2.5 px-4 text-amber-400 font-bold">G3 Score</th>
                      <th className="py-2.5 px-4 text-purple-400 font-bold">G2 Score</th>
                      <th className="py-2.5 px-4 text-rose-400 font-bold">G1 Score</th>
                      <th className="py-2.5 px-4 text-emerald-400 font-bold">Top #1 Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#182333]">
                    {historyLine.map((h, i) => (
                      <tr key={i} className="hover:bg-[#131c2c]">
                        <td className="py-2.5 px-4 text-white font-semibold">{h.time}</td>
                        <td className="py-2.5 px-4 text-amber-400 font-bold">{h.g3Score}</td>
                        <td className="py-2.5 px-4 text-purple-400 font-bold">{h.g2Score}</td>
                        <td className="py-2.5 px-4 text-rose-400 font-bold">{h.g1Score}</td>
                        <td className="py-2.5 px-4 text-emerald-400 font-bold">{h.topScore}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
