import React, { useState, useMemo } from 'react';
import { Shield, Swords, Trophy, Globe, Flame, Search, ChevronRight, CheckCircle2, Crown, Users } from 'lucide-react';
import latestBattles from '../data/latestSiegeBattles.json';
import defenseTiers from '../data/swgtDefenseTiers.json';
import counterStrategies from '../data/allCounterStrategies.json';
import MonsterAvatar from '../components/MonsterAvatar';

export default function SiegeBattlesView({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('meta'); // 'meta' | 'live'
  const [selectedServer, setSelectedServer] = useState('Global');
  const [selectedTier, setSelectedTier] = useState('all'); // 'all' | 'SSS' | 'SS' | 'S'
  const [searchDefense, setSearchDefense] = useState('');
  const [expandedDefense, setExpandedDefense] = useState(null);

  // Flatten SWGT defense tiers
  const allDefMonsters = useMemo(() => {
    const list = [];
    Object.entries(defenseTiers || {}).forEach(([tier, mons]) => {
      if (Array.isArray(mons)) {
        mons.forEach((m) => list.push({ ...m, tier }));
      }
    });
    return list;
  }, []);

  const filteredDefenses = useMemo(() => {
    return allDefMonsters.filter((m) => {
      if (selectedTier !== 'all' && m.tier !== selectedTier) return false;
      if (searchDefense.trim()) {
        const q = searchDefense.toLowerCase().trim();
        const matchName = (m.name || '').toLowerCase().includes(q) || (m.thaiName || '').toLowerCase().includes(q);
        return matchName;
      }
      return true;
    });
  }, [allDefMonsters, selectedTier, searchDefense]);

  const serverBattles = useMemo(() => {
    return latestBattles[selectedServer] || [];
  }, [selectedServer]);

  // Find counters for a defense monster name from allCounterStrategies
  const getCountersFor = (monsterName) => {
    const clean = (monsterName || '').toLowerCase().trim();
    for (const [key, value] of Object.entries(counterStrategies)) {
      if (key.toLowerCase().includes(clean)) {
        return value;
      }
    }
    return null;
  };

  return (
    <div className="space-y-6 max-w-[1780px] 2xl:max-w-[1880px] mx-auto pb-16 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-r from-[#0c1424] via-[#0d172e] to-[#070b12] p-6 sm:p-8 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono font-bold uppercase">
            <Shield className="w-3.5 h-3.5" />
            <span>SWGT Live Data • Global Siege & Guild War Hub</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            ศูนย์วิเคราะห์สถิติศึกกิลด์ Siege ทั่วโลก (Siege & Guild War Hub)
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
            เจาะลึกเมต้ากิลด์วอร์ระดับสูง ดูทีมป้องกันบ้านยอดฮิต อัตราการชนะ (Win Rate) และสูตรทีมบุกแก้ทางที่มีอัตราการชนะสูงกว่า 90% จากฐานข้อมูล SWGT ทั่วโลก
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 shrink-0">
          <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3.5 flex items-center gap-4 text-xs font-mono shadow-xl">
            <div>
              <div className="text-slate-400 text-[11px]">เซิร์ฟเวอร์ที่ติดตาม</div>
              <div className="text-blue-400 font-bold text-base">4 ทวีปหลัก</div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div>
              <div className="text-slate-400 text-[11px]">สูตรบุกแก้ทางในระบบ</div>
              <div className="text-emerald-400 font-bold text-base">1,200+ สูตรแท้</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
        <button
          onClick={() => setActiveTab('meta')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'meta'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/30'
              : 'bg-white/[0.04] text-slate-400 hover:text-white'
          }`}
        >
          <Flame className="w-4 h-4 text-amber-400" />
          <span>เมต้าทีมกันบ้าน & สูตรแก้ 90%+ (SWGT Meta Defenses)</span>
        </button>

        <button
          onClick={() => setActiveTab('live')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'live'
              ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-orange-900/30'
              : 'bg-white/[0.04] text-slate-400 hover:text-white'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-300" />
          <span>อันดับทัวร์นาเมนต์กิลด์ 4 เซิร์ฟเวอร์ (Live Tournament)</span>
        </button>
      </div>

      {/* 1. Meta Defenses & Counters Tab */}
      {activeTab === 'meta' && (
        <div className="space-y-4">
          {/* Filter Toolbar */}
          <div className="p-4 rounded-2xl bg-[#0c1220] border border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xl">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchDefense}
                  onChange={(e) => setSearchDefense(e.target.value)}
                  placeholder="ค้นหาชื่อตัวกันบ้าน (เช่น Lamiella, Savannah, Carcano)..."
                  className="w-full bg-[#070b14] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {[
                  { id: 'all', label: 'ทุก Tier' },
                  { id: 'SSS', label: 'Tier SSS (ยอดฮิตอันดับ 1)' },
                  { id: 'SS', label: 'Tier SS' },
                  { id: 'S', label: 'Tier S' },
                  { id: 'A', label: 'Tier A' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTier(t.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      selectedTier === t.id
                        ? 'bg-blue-600 text-white font-black shadow-md'
                        : 'bg-white/[0.04] text-slate-300 hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-400 font-mono shrink-0">
              พบ <span className="text-blue-400 font-bold">{filteredDefenses.length}</span> ตัวกันบ้าน
            </div>
          </div>

          {/* Grid of Defense Monsters */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredDefenses.slice(0, 36).map((m) => {
              const strategy = getCountersFor(m.name);
              const isExpanded = expandedDefense === m.com2usId;

              return (
                <div
                  key={m.com2usId || m.name}
                  className="p-5 rounded-3xl bg-[#0c1220] border border-white/[0.08] hover:border-blue-500/30 transition-all flex flex-col justify-between gap-4 shadow-xl"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <MonsterAvatar monster={m} size="md" showStars={false} />
                        <div>
                          <div className="text-sm font-bold text-white flex items-center gap-1.5">
                            <span>{m.thaiName || m.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({m.element})</span>
                          </div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">
                            สถิติตั้งรับ: <strong className="text-white">{m.battles || m.battleCount}</strong> ครั้ง
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-black font-mono border ${
                            m.tier === 'SSS'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : m.tier === 'SS'
                              ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                              : 'bg-white/[0.05] text-slate-300 border-white/10'
                          }`}
                        >
                          Tier {m.tier}
                        </span>
                        <div className="text-[11px] text-rose-400 font-mono mt-1 font-bold">
                          Win Rate {m.winRate}
                        </div>
                      </div>
                    </div>

                    {/* Counter Preview */}
                    {strategy && strategy.counters && strategy.counters.length > 0 && (
                      <div className="space-y-2 bg-[#070b14] p-3 rounded-2xl border border-white/[0.05]">
                        <div className="text-[11px] font-mono text-emerald-400 font-bold flex items-center justify-between">
                          <span>🎯 ทีมแก้ทางแนะนำ ({strategy.counters.length} ทีม):</span>
                          <span>Win Rate {strategy.counters[0]?.winRate}</span>
                        </div>
                        <div className="text-xs text-slate-200 font-semibold truncate">
                          {strategy.counters[0]?.title}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate leading-relaxed">
                          {strategy.counters[0]?.turnOrder}
                        </div>

                        {strategy.counters.length > 1 && (
                          <button
                            onClick={() => setExpandedDefense(isExpanded ? null : m.com2usId)}
                            className="text-[10px] text-blue-400 hover:text-blue-300 underline cursor-pointer mt-1"
                          >
                            {isExpanded ? 'ย่อสูตรบุก' : `ดูสูตรแก้ทางเพิ่มเติมอีก ${strategy.counters.length - 1} สูตร`}
                          </button>
                        )}
                      </div>
                    )}

                    {isExpanded && strategy && (
                      <div className="space-y-2 pt-2 border-t border-white/[0.06] text-xs">
                        {strategy.counters.slice(1).map((c, cIdx) => (
                          <div key={cIdx} className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                            <div className="font-bold text-white flex justify-between">
                              <span>{c.title}</span>
                              <span className="text-emerald-400 font-mono">{c.winRate}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{c.turnOrder}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500 font-mono">SWGT Guild Database</span>
                    <button
                      onClick={() => onNavigate && onNavigate('3mdc', { search: m.name })}
                      className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                    >
                      <span>เปิดใน 3MDC</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Live Guild Tournament Rankings Tab */}
      {activeTab === 'live' && (
        <div className="space-y-4">
          {/* Server Switcher */}
          <div className="p-4 rounded-2xl bg-[#0c1220] border border-white/[0.08] flex items-center justify-between gap-3 flex-wrap shadow-xl">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-white">เลือกเซิร์ฟเวอร์:</span>
              <div className="flex items-center gap-1">
                {['Global', 'Asia', 'Europe', 'JPKR'].map((srv) => (
                  <button
                    key={srv}
                    onClick={() => setSelectedServer(srv)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedServer === srv
                        ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                        : 'bg-white/[0.04] text-slate-300 hover:text-white'
                    }`}
                  >
                    {srv}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-400 font-mono">
              ข้อมูล Siege Tournament ล่าสุดของเซิร์ฟเวอร์ <strong className="text-white">{selectedServer}</strong>
            </div>
          </div>

          {/* Battles List */}
          <div className="space-y-4">
            {serverBattles.map((b) => (
              <div
                key={b.id}
                className="p-5 sm:p-6 rounded-3xl bg-[#0c1220] border border-white/[0.08] shadow-xl space-y-4"
              >
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 text-xs text-slate-400 font-mono">
                  <span>Match ID: #{b.id} • {selectedServer} Server</span>
                  <span className="text-amber-400 font-bold">12 Guilds Tournament Battle</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {b.guilds.map((g, gIdx) => (
                    <div
                      key={gIdx}
                      className="p-3.5 rounded-2xl bg-[#070b14] border border-white/[0.06] hover:border-amber-500/30 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-black text-xs flex items-center justify-center font-mono shrink-0">
                          {g.rank}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{g.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">Speed: {g.speed}</div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-black font-mono text-emerald-400">{g.score}</div>
                        <div className="text-[9px] text-slate-500 uppercase font-mono">คะแนน</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
