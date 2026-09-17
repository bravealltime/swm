import React, { useState, useMemo } from 'react';
import defenseTrendingFull from '../data/defenseTrendingFull.json';
import monsterOffenseTrending from '../data/monsterOffenseTrending.json';
import monsterDefenseTrending from '../data/monsterDefenseTrending.json';
import MonsterAvatar from '../components/MonsterAvatar';
import MonsterTierListView from '../components/MonsterTierListView';
import { 
  Swords, 
  Shield, 
  TrendingUp, 
  Search, 
  HelpCircle, 
  Award, 
  Flame, 
  ChevronRight, 
  Filter, 
  CheckCircle2, 
  Trophy,
  LayoutGrid,
  Table as TableIcon
} from 'lucide-react';

export default function TrendingAnalyticsView({ onNavigate, subItem }) {
  const getInitialTab = () => {
    if (subItem === 'monster-defense-trending') return 'defense';
    if (subItem === 'defense-trending') return 'teams';
    return 'offense';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab()); // 'offense' | 'defense' | 'teams'
  const [viewMode, setViewMode] = useState('tierlist'); // 'tierlist' | 'table' (Default to Tier List as requested)
  const [searchTerm, setSearchTerm] = useState('');
  const [elementFilter, setElementFilter] = useState('all');
  const [starsFilter, setStarsFilter] = useState('all');
  const [sortBy, setSortBy] = useState('winrate'); // 'winrate' | 'battles'

  React.useEffect(() => {
    if (subItem === 'monster-defense-trending') setActiveTab('defense');
    else if (subItem === 'defense-trending') setActiveTab('teams');
    else if (subItem === 'monster-offense-trending') setActiveTab('offense');
  }, [subItem]);

  // Filtered Offense Monsters
  const filteredOffense = useMemo(() => {
    return monsterOffenseTrending
      .filter(m => {
        if (elementFilter !== 'all' && m.element !== elementFilter) return false;
        if (starsFilter !== 'all' && m.stars?.toString() !== starsFilter) return false;
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase().trim();
        return m.name.toLowerCase().includes(q) || (m.thaiName && m.thaiName.toLowerCase().includes(q));
      })
      .sort((a, b) => {
        if (sortBy === 'winrate') return b.winRateNum - a.winRateNum;
        const bA = parseInt(a.battleCount.replace(/,/g, '')) || 0;
        const bB = parseInt(b.battleCount.replace(/,/g, '')) || 0;
        return bB - bA;
      });
  }, [searchTerm, elementFilter, starsFilter, sortBy]);

  // Filtered Defense Monsters
  const filteredDefense = useMemo(() => {
    return monsterDefenseTrending
      .filter(m => {
        if (elementFilter !== 'all' && m.element !== elementFilter) return false;
        if (starsFilter !== 'all' && m.stars?.toString() !== starsFilter) return false;
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase().trim();
        return m.name.toLowerCase().includes(q) || (m.thaiName && m.thaiName.toLowerCase().includes(q));
      })
      .sort((a, b) => {
        if (sortBy === 'winrate') return b.winRateNum - a.winRateNum;
        const bA = parseInt(a.battleCount.replace(/,/g, '')) || 0;
        const bB = parseInt(b.battleCount.replace(/,/g, '')) || 0;
        return bB - bA;
      });
  }, [searchTerm, elementFilter, starsFilter, sortBy]);

  // Filtered Defense Teams (96)
  const filteredTeams = useMemo(() => {
    return defenseTrendingFull.filter(item => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase().trim();
      return (
        item.leader.name.toLowerCase().includes(q) ||
        item.monster2.name.toLowerCase().includes(q) ||
        item.monster3.name.toLowerCase().includes(q)
      );
    });
  }, [searchTerm]);

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1c2738] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-blue-400 uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4" />
            SWM All Server Analytics • สถิติการรบระดับโลก
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            สถิติความนิยมมอนสเตอร์ & ทีมบุกยอดฮิต (Monster Offense Trending)
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
            เจาะลึกมอนสเตอร์ที่ผู้เล่นระดับท็อป (G1-G3) หยิบมาใช้เป็นทีมบุกเคาน์เตอร์มากที่สุด พร้อมอัตราการชนะ (Winrate %) และจำนวนรอบการต่อสู้จริง
          </p>
        </div>

        {/* Quick Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#101724] border border-[#1d2b3f] self-start md:self-auto shadow-md">
          <button
            onClick={() => setActiveTab('offense')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'offense' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>ทีมบุก (Offense • 247)</span>
          </button>
          <button
            onClick={() => setActiveTab('defense')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'defense' 
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>ทีมรับ (Defense • 202)</span>
          </button>
          <button
            onClick={() => setActiveTab('teams')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'teams' 
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>96 ทีมตั้งรับยอดฮิต</span>
          </button>
        </div>
      </div>

      {/* 2. Explanatory Banner: "Monster Offense Trending คืออะไร?" */}
      <div className="bg-gradient-to-r from-[#111d2e] via-[#101826] to-[#0d1420] border border-blue-500/30 rounded-2xl p-5 shadow-xl">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1 text-xs sm:text-sm">
            <h3 className="font-extrabold text-white text-sm sm:text-base flex items-center gap-2">
              <span>Monster - Offense - Trending คืออะไร?</span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                SWM Global Meta
              </span>
            </h3>
            <p className="text-slate-300 leading-relaxed font-sans">
              คือระบบวิเคราะห์ข้อมูลการต่อสู้ฝั่งบุก (Offense Analytics) ที่รวบรวมจากบันทึกการรบจริงใน <strong>Siege Battle</strong> และ <strong>World Guild Battle</strong> ทุกเซิร์ฟเวอร์ทั่วโลก (Asia, Global, Europe, JP, KR) โดยแสดง:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-xs">
              <div className="bg-[#0b1018] p-2.5 rounded-lg border border-[#1b283d] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-300"><strong>อัตราชนะบุก (WR%):</strong> ตัวไหนชนะชัวร์ 90%+</span>
              </div>
              <div className="bg-[#0b1018] p-2.5 rounded-lg border border-[#1b283d] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-slate-300"><strong>จำนวนรอบ (Battles):</strong> ตัวที่ผู้เล่นหยิบตีมากที่สุด</span>
              </div>
              <div className="bg-[#0b1018] p-2.5 rounded-lg border border-[#1b283d] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-slate-300"><strong>สัดส่วนความนิยม (%):</strong> เมต้าที่กำลังถูกใช้จริง</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filter & Sort Bar */}
      <div className="bg-[#101724] p-4 rounded-2xl border border-[#1d2b3f] flex flex-col lg:flex-row items-center justify-between gap-4 shadow-lg">
        {/* Search */}
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            className="w-full bg-[#0c121c] border border-[#1d2b3f] rounded-xl pl-10 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            placeholder="ค้นหาชื่อมอนสเตอร์ (เช่น Christine, Fuco, Suiki, Pater...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Element, Stars, View & Sorting Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* View Mode Switcher: Table vs Tier List (Direct SWGT feature) */}
          {activeTab !== 'teams' && (
            <div className="flex items-center gap-1 bg-[#0c121c] p-1 rounded-xl border border-[#1d2b3f] shadow-inner">
              <span className="text-xs text-slate-400 font-bold px-2">View:</span>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'table'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
              <button
                onClick={() => setViewMode('tierlist')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'tierlist'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Tier List</span>
              </button>
            </div>
          )}

          {/* Element */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-400 font-bold mr-1">ธาตุ:</span>
            {['all', 'fire', 'water', 'wind', 'light', 'dark'].map((el) => (
              <button
                key={el}
                onClick={() => setElementFilter(el)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                  elementFilter === el
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#0c121c] border border-[#1d2b3f] text-slate-400 hover:text-white'
                }`}
              >
                {el === 'all' ? 'ทั้งหมด' : el}
              </button>
            ))}
          </div>

          {/* Sort By (when in table mode) */}
          {viewMode === 'table' && (
            <>
              <div className="h-4 w-px bg-[#1d2b3f] hidden sm:block mx-1"></div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-400 font-bold mr-1">เรียง:</span>
                <button
                  onClick={() => setSortBy('winrate')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    sortBy === 'winrate'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#0c121c] border border-[#1d2b3f] text-slate-400 hover:text-white'
                  }`}
                >
                  WR%
                </button>
                <button
                  onClick={() => setSortBy('battles')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    sortBy === 'battles'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#0c121c] border border-[#1d2b3f] text-slate-400 hover:text-white'
                  }`}
                >
                  Battles
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 4. Tab 1: Monster Offense Trending (247 Monsters) */}
      {activeTab === 'offense' && (
        viewMode === 'tierlist' ? (
          <MonsterTierListView
            monsters={monsterOffenseTrending}
            type="offense"
            searchTerm={searchTerm}
            elementFilter={elementFilter}
            starsFilter={starsFilter}
            onNavigate={onNavigate}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>
                แสดงมอนสเตอร์ฝ่ายบุกยอดนิยม: <strong className="text-white font-mono">{filteredOffense.length}</strong> ตัว (เรียงตาม {sortBy === 'winrate' ? 'อัตราชนะสูงสุด' : 'จำนวนรอบต่อสู้มากสุด'})
              </span>
              <span className="text-cyan-400 font-mono">SWM Battle Engine Data</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {filteredOffense.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-[#111824] border border-[#1d2a3d] hover:border-blue-500/60 rounded-2xl p-4 transition-all flex items-center justify-between shadow-lg group hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-[#182333] border border-[#223147] font-mono text-xs font-bold text-slate-300 flex items-center justify-center shrink-0">
                      #{item.rank}
                    </span>
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#2b3c54] bg-black shrink-0 relative">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0001_0_0.png'; }}
                      />
                      <span className={`absolute bottom-0 right-0 text-[8px] font-bold px-1 rounded-tl uppercase ${
                        item.element === 'fire' ? 'bg-rose-600 text-white' :
                        item.element === 'water' ? 'bg-sky-600 text-white' :
                        item.element === 'wind' ? 'bg-amber-600 text-white' :
                        item.element === 'light' ? 'bg-yellow-400 text-black' :
                        'bg-purple-600 text-white'
                      }`}>
                        {item.element}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-white group-hover:text-blue-400 transition-colors truncate max-w-[140px]">
                        {item.name}
                      </h4>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {item.battleCount} battles • {item.pickShare}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <div className="bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-right">
                      <div className="text-[9px] text-emerald-400 uppercase font-bold">Win Rate</div>
                      <div className="text-sm font-mono font-black text-emerald-300">{item.winRate}</div>
                    </div>
                    <button
                      onClick={() => onNavigate && onNavigate('3mdc', { search: item.name })}
                      className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-0.5 group-hover:underline cursor-pointer"
                    >
                      ดูทีม 3MDC →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {/* 5. Tab 2: Monster Defense Trending (202 Monsters) */}
      {activeTab === 'defense' && (
        viewMode === 'tierlist' ? (
          <MonsterTierListView
            monsters={monsterDefenseTrending}
            type="defense"
            searchTerm={searchTerm}
            elementFilter={elementFilter}
            starsFilter={starsFilter}
            onNavigate={onNavigate}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>
                แสดงมอนสเตอร์ฝ่ายตั้งรับยอดนิยม: <strong className="text-white font-mono">{filteredDefense.length}</strong> ตัว
              </span>
              <span className="text-purple-400 font-mono">Defense Hold Stats</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {filteredDefense.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-[#111824] border border-[#1d2a3d] hover:border-purple-500/60 rounded-2xl p-4 transition-all flex items-center justify-between shadow-lg group hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-[#182333] border border-[#223147] font-mono text-xs font-bold text-slate-300 flex items-center justify-center shrink-0">
                      #{item.rank}
                    </span>
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#2b3c54] bg-black shrink-0 relative">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0001_0_0.png'; }}
                      />
                      <span className={`absolute bottom-0 right-0 text-[8px] font-bold px-1 rounded-tl uppercase ${
                        item.element === 'fire' ? 'bg-rose-600 text-white' :
                        item.element === 'water' ? 'bg-sky-600 text-white' :
                        item.element === 'wind' ? 'bg-amber-600 text-white' :
                        item.element === 'light' ? 'bg-yellow-400 text-black' :
                        'bg-purple-600 text-white'
                      }`}>
                        {item.element}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-white group-hover:text-purple-400 transition-colors truncate max-w-[140px]">
                        {item.name}
                      </h4>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {item.battleCount} battles • {item.pickShare}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <div className="bg-purple-500/10 border border-purple-500/30 px-2.5 py-1 rounded-lg text-right">
                      <div className="text-[9px] text-purple-400 uppercase font-bold">Def Win</div>
                      <div className="text-sm font-mono font-black text-purple-300">{item.winRate}</div>
                    </div>
                    <button
                      onClick={() => onNavigate && onNavigate('3mdc', { search: item.name })}
                      className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-0.5 group-hover:underline cursor-pointer"
                    >
                      ดูทีมแก้ทาง →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {/* 6. Tab 3: 96 Teams Trending */}
      {activeTab === 'teams' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>พบทั้งหมด <strong className="text-white font-mono">{filteredTeams.length}</strong> ทีมตั้งรับยอดนิยมระดับโลก</span>
            <span>เรียงตามสถิติความถี่การเจอบนหอคอย Siege</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredTeams.map((def) => (
              <div
                key={def.id}
                className="bg-[#121a27] border border-[#202e42] rounded-2xl p-4 hover:border-blue-500/60 transition-all group flex flex-col justify-between shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                      อันดับ #{def.id}
                    </span>
                    <button
                      onClick={() => onNavigate && onNavigate('3mdc', { search: `${def.leader.name} ${def.monster2.name} ${def.monster3.name}` })}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold group-hover:underline"
                    >
                      หาวิธีแก้ทาง 3MDC →
                    </button>
                  </div>

                  {/* 3 Monsters */}
                  <div className="flex items-center justify-center gap-2.5 py-2.5 bg-[#0c121b] rounded-xl border border-[#1a2433] mb-3">
                    {[def.leader, def.monster2, def.monster3].map((m, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-1 text-center">
                        <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-[#2b3a50] shadow-md bg-black relative">
                          <img
                            src={m.img}
                            alt={m.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0001_0_0.png'; }}
                          />
                          {idx === 0 && (
                            <span className="absolute bottom-0 right-0 bg-blue-600 text-[9px] font-bold text-white px-1 rounded-tl">
                              LEAD
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-bold text-slate-300 truncate max-w-[80px]">
                          {m.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                {def.stats && def.stats.length > 0 && (
                  <div className="pt-2 border-t border-[#1a2433] grid grid-cols-2 gap-2 text-xs text-slate-400">
                    {def.stats.map((st, sIdx) => (
                      <div key={sIdx} className="flex items-center justify-between bg-[#0e1520] px-2 py-1 rounded">
                        <span className="text-slate-500">{sIdx === 0 ? 'Pick Count:' : sIdx === 1 ? 'Win Rate:' : 'Score:'}</span>
                        <span className="font-mono text-slate-200 font-semibold">{st}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
