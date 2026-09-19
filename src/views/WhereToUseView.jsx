import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Shield, 
  Swords, 
  Sparkles, 
  Compass, 
  Trophy, 
  Layers, 
  ArrowRight, 
  CheckCircle2, 
  Flame, 
  RotateCcw,
  Zap,
  BookOpen
} from 'lucide-react';
import MonsterAvatar from '../components/MonsterAvatar';
import ALL_MDC_DATA from '../data/allMdcData.json';
import { MONSTERS } from '../data/monsters';
import DUNGEON_DATA from '../data/dungeonRealStats.json';
import RTA_META from '../data/swrtMetaMonsters.json';
import { useLiveData } from '../hooks/useLiveData';
import { getMonsterBuild } from '../data/monsterBuilds';
import { loadBox, baseAwakenedId } from '../utils/swexImport';
import { loadUserBoxFromDB } from '../services/storageService';

// Popular monsters for quick 1-click select
const QUICK_PRESETS = [
  'Byungchul', 'Juno', 'Savannah', 'Dominic', 'Eshir', 'Teshar', 
  'Miles', 'Tiana', 'Chandra', 'Nana', 'Solveig', 'Galleon', 'Liam'
];

export default function WhereToUseView({ onNavigate, initialMonster = 'Byungchul' }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonsterName, setSelectedMonsterName] = useState(initialMonster);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'benchmarks', 'defense', 'offense', 'pve', 'rta'
  const [userBox, setUserBox] = useState(() => loadBox());

  React.useEffect(() => {
    if (!userBox) {
      loadUserBoxFromDB().then((dbBox) => {
        if (dbBox) setUserBox(dbBox);
      });
    }
  }, [userBox]);

  // Find monster object from monsters database
  const selectedMonster = useMemo(() => {
    const clean = selectedMonsterName.toLowerCase().trim();
    return MONSTERS.find(m => 
      m.name.toLowerCase() === clean || 
      (m.thaiName && m.thaiName.toLowerCase() === clean) ||
      m.name.toLowerCase().includes(clean)
    ) || MONSTERS[0];
  }, [selectedMonsterName]);

  const monsterBuild = useMemo(() => getMonsterBuild(selectedMonster.name), [selectedMonster]);

  // Check if player owns this monster in their SWEX box
  const ownedUnit = useMemo(() => {
    if (!userBox?.units) return null;
    const target = selectedMonster.name.toLowerCase();
    return userBox.units.find(u => 
      u.name?.toLowerCase() === target ||
      (selectedMonster.thaiName && u.thaiName?.toLowerCase() === selectedMonster.thaiName.toLowerCase()) ||
      u.masterId === selectedMonster.id ||
      baseAwakenedId(u.masterId) === selectedMonster.id
    );
  }, [userBox, selectedMonster]);

  // Calculate readiness score against Guardian 1-3 benchmarks
  const readinessScore = useMemo(() => {
    if (!ownedUnit || !monsterBuild?.benchmarks) return null;
    const b = monsterBuild.benchmarks;
    const stats = [
      { current: ownedUnit.hp || 0, target: b.hp },
      { current: ownedUnit.spd || 0, target: b.spd },
      { current: ownedUnit.def || 0, target: b.def },
      { current: ownedUnit.atk || 0, target: b.atk },
      { current: ownedUnit.cr || 0, target: b.cr },
      { current: ownedUnit.cd || 0, target: b.cd },
      { current: ownedUnit.res || 0, target: b.res },
      { current: ownedUnit.acc || 0, target: b.acc },
    ];
    const totalRatio = stats.reduce((acc, s) => {
      if (!s.target) return acc + 1;
      return acc + Math.min(1.15, s.current / s.target);
    }, 0);
    return Math.round((totalRatio / stats.length) * 100);
  }, [ownedUnit, monsterBuild]);


  // Autocomplete filtered list
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return MONSTERS.filter(m => 
      m.name.toLowerCase().includes(q) || 
      (m.thaiName && m.thaiName.toLowerCase().includes(q)) ||
      (m.family && m.family.toLowerCase().includes(q))
    ).slice(0, 10);
  }, [searchQuery]);

  // 1. Defenses containing this monster
  const defenseMatches = useMemo(() => {
    const target = selectedMonster.name.toLowerCase();
    const matches = [];
    ALL_MDC_DATA.forEach(def => {
      const hasMon = def.defenseMonsters.some(m => 
        (m.name || '').toLowerCase().includes(target) || 
        target.includes((m.name || '').toLowerCase())
      );
      if (hasMon) {
        matches.push(def);
      }
    });
    return matches.slice(0, 20);
  }, [selectedMonster]);

  // 2. Offenses / Counters using this monster
  const counterMatches = useMemo(() => {
    const target = selectedMonster.name.toLowerCase();
    const results = [];
    ALL_MDC_DATA.forEach(def => {
      def.counters.forEach(c => {
        const hasMon = c.monsters.some(m => 
          (m.name || '').toLowerCase().includes(target) || 
          target.includes((m.name || '').toLowerCase())
        );
        if (hasMon) {
          results.push({
            counterTeam: c,
            againstDefense: def
          });
        }
      });
    });
    // Sort by win rate desc and deduplicate
    return results.sort((a, b) => (b.counterTeam.winRate || 0) - (a.counterTeam.winRate || 0)).slice(0, 20);
  }, [selectedMonster]);

  // 3. Dungeon viability
  const dungeonMatches = useMemo(() => {
    const target = selectedMonster.name.toLowerCase();
    const matches = [];
    DUNGEON_DATA.forEach(dung => {
      const foundInTeam = dung.recommendedTeam?.find(m => 
        m.name.toLowerCase().includes(target) || 
        target.includes(m.name.toLowerCase().replace(/\s*\(l\)/i, ''))
      );
      if (foundInTeam) {
        matches.push({
          dungeon: dung,
          roleInfo: foundInTeam
        });
      }
    });
    return matches;
  }, [selectedMonster]);

  // 4. RTA Meta info (live document, bundled fallback)
  const rtaMeta = useLiveData('rta-meta', RTA_META);
  const rtaMatch = useMemo(() => {
    const target = selectedMonster.name.toLowerCase();
    const list = Array.isArray(rtaMeta.data) ? rtaMeta.data : RTA_META;
    return list.find(r =>
      r.name.toLowerCase().includes(target) ||
      target.includes(r.name.toLowerCase())
    );
  }, [selectedMonster, rtaMeta.data]);

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-[#1c2738] pb-5">
        <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-wider mb-1">
          <Compass className="w-4 h-4" />
          Where to Use • วิเคราะห์การใช้งานมอนสเตอร์แบบ All-in-One
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          ใช้มอนสเตอร์ตัวนี้ที่ไหนดี? (Where to Use?)
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
          เลือกมอนสเตอร์ 1 ตัว เพื่อตรวจสอบทันทีว่าใช้งานในทีมตั้งรับกิลด์วอร์ไหนดี, ใช้แก้ทางทีมรับไหนได้บ้าง, ฟาร์มดันเจี้ยนอะไรได้ และมีสถิติการใช้งานใน RTA ระดับใด
        </p>
      </div>

      {/* Monster Search & Quick Chips */}
      <div className="bg-[#101724] border border-[#1d2b3f] p-5 rounded-2xl shadow-xl space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            className="w-full bg-[#0c121c] border border-[#1d2b3f] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            placeholder="พิมพ์ค้นหาชื่อมอนสเตอร์ (เช่น Byungchul, Juno, Savannah, Teshar, Miles, Liam...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white px-2 py-1"
            >
              ✕ ล้าง
            </button>
          )}

          {/* Autocomplete Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-[#101724] border border-[#1d2b3f] rounded-xl shadow-2xl overflow-hidden divide-y divide-[#182333]">
              {searchResults.map((m, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedMonsterName(m.name);
                    setSearchQuery('');
                  }}
                  className="w-full p-2.5 px-4 flex items-center justify-between hover:bg-[#152030] text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <MonsterAvatar monster={m} size="sm" />
                    <div>
                      <div className="text-xs font-bold text-white">{m.thaiName || m.name}</div>
                      <div className="text-[11px] text-slate-400">{m.name} ({m.family})</div>
                    </div>
                  </div>
                  <span className="text-[11px] text-amber-400 font-bold uppercase px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                    {m.element}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Pick Chips */}
        <div>
          <div className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            มอนสเตอร์ยอดนิยมที่ผู้เล่นค้นหาบ่อย:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PRESETS.map((name) => {
              const isActive = selectedMonster.name.toLowerCase() === name.toLowerCase();
              return (
                <button
                  key={name}
                  onClick={() => setSelectedMonsterName(name)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30'
                      : 'bg-[#0c121c] border border-[#1d2b3f] text-slate-300 hover:text-white hover:bg-[#152030]'
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Monster Overview Hero Card */}
      <div className="bg-gradient-to-r from-[#101724] via-[#121c2d] to-[#101724] border border-[#1d2b3f] rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <MonsterAvatar monster={selectedMonster} size="xl" />
              <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-black/80 rounded border border-white/20 text-[11px] font-bold text-amber-400">
                ★{selectedMonster.stars || 5}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                  selectedMonster.element === 'fire' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                  selectedMonster.element === 'water' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' :
                  selectedMonster.element === 'wind' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  selectedMonster.element === 'light' ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/30' :
                  'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                }`}>
                  {selectedMonster.element}
                </span>
                <span className="text-xs text-slate-400">
                  {selectedMonster.archetype ? `สาย ${selectedMonster.archetype}` : 'สายต่อสู้'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                {selectedMonster.thaiName || selectedMonster.name}
              </h2>
              <div className="text-xs text-slate-400">
                {selectedMonster.name} • {selectedMonster.family || 'Monster'}
              </div>
            </div>
          </div>

          {/* Quick Stats Counter Pills */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="bg-[#0c121c] border border-[#1d2b3f] rounded-xl px-3 py-2 text-center">
              <div className="text-[11px] text-slate-400 font-bold uppercase">ทีมรับกิลด์วอร์</div>
              <div className="text-base font-mono font-black text-blue-400">{defenseMatches.length} ทีม</div>
            </div>
            <div className="bg-[#0c121c] border border-[#1d2b3f] rounded-xl px-3 py-2 text-center">
              <div className="text-[11px] text-slate-400 font-bold uppercase">สูตรทีมบุกแก้ทาง</div>
              <div className="text-base font-mono font-black text-emerald-400">{counterMatches.length} สูตร</div>
            </div>
            <div className="bg-[#0c121c] border border-[#1d2b3f] rounded-xl px-3 py-2 text-center">
              <div className="text-[11px] text-slate-400 font-bold uppercase">ทีมฟาร์มดันเจี้ยน</div>
              <div className="text-base font-mono font-black text-purple-400">{dungeonMatches.length} ดันเจี้ยน</div>
            </div>
            {rtaMatch && (
              <div className="bg-[#0c121c] border border-[#1d2b3f] rounded-xl px-3 py-2 text-center">
                <div className="text-[11px] text-slate-400 font-bold uppercase">RTA Pick Rate</div>
                <div className="text-base font-mono font-black text-amber-400">{rtaMatch.pickRate}%</div>
              </div>
            )}
          </div>
        </div>

        {/* Shortcut Action Buttons */}
        <div className="mt-4 pt-4 border-t border-[#1d2b3f]/60 flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate && onNavigate('3mdc', { search: selectedMonster.name })}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5" /> ไปที่ค้นหา 3MDC สำหรับตัวนี้
          </button>
          <button
            onClick={() => onNavigate && onNavigate('catalog', { search: selectedMonster.name })}
            className="px-3 py-1.5 rounded-lg bg-[#0c121c] hover:bg-[#162130] text-slate-300 hover:text-white border border-[#1d2b3f] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-purple-400" /> ดูสกิล & ตัวคูณดาเมจ
          </button>
          <button
            onClick={() => onNavigate && onNavigate('artifact')}
            className="px-3 py-1.5 rounded-lg bg-[#0c121c] hover:bg-[#162130] text-slate-300 hover:text-white border border-[#1d2b3f] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" /> คำนวณดาเมจเสริมอาร์ติแฟกต์
          </button>
        </div>
      </div>

      {/* Tabs Filter Bar */}
      <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[#101724] border border-[#1d2b3f] overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'all' ? 'bg-amber-500 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          ดูภาพรวมทั้งหมด ({defenseMatches.length + counterMatches.length + dungeonMatches.length} จุดใช้งาน)
        </button>
        <button
          onClick={() => setActiveTab('benchmarks')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'benchmarks' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          🏆 สถิติรูน Guardian (Benchmarks)
        </button>
        <button
          onClick={() => setActiveTab('defense')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'defense' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          🛡️ ทีมตั้งรับกิลด์วอร์ ({defenseMatches.length})
        </button>
        <button
          onClick={() => setActiveTab('offense')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'offense' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          ⚔️ ทีมบุกแก้ทางเคาน์เตอร์ ({counterMatches.length})
        </button>
        <button
          onClick={() => setActiveTab('pve')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'pve' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          🐉 ดันเจี้ยน PvE ({dungeonMatches.length})
        </button>
        {rtaMatch && (
          <button
            onClick={() => setActiveTab('rta')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'rta' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            🏆 สถิติ RTA S38
          </button>
        )}
      </div>

      {/* Content Sections */}

      {/* 0. Guardian Rune & Stat Benchmarks Section */}
      {(activeTab === 'all' || activeTab === 'benchmarks') && monsterBuild && (
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#101724] via-[#131c2c] to-[#0c121c] border border-amber-500/30 shadow-xl space-y-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-amber-500/20">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Trophy className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  สถิติ & บิลด์รูนระดับการ์เดียน (Guardian 1-3 Benchmarks)
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    G1-G3 Target
                  </span>
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                ค่าสถิติเป้าหมายที่ผู้เล่นระดับการ์เดียนนิยมทำ เปรียบเทียบกับมอนสเตอร์ในไอดีของคุณ
              </p>
            </div>

            {/* Readiness Score Badge */}
            {ownedUnit ? (
              <div className="bg-emerald-950/40 border border-emerald-500/40 px-3.5 py-2 rounded-xl flex items-center gap-3">
                <div>
                  <div className="text-[10px] text-emerald-400 font-bold uppercase">ความพร้อมระดับ Guardian</div>
                  <div className="text-lg font-black text-white font-mono">
                    {readinessScore}% {readinessScore >= 90 ? '🌟 G1-G3 Ready' : readinessScore >= 75 ? '⚡ ใช้งานได้ดี' : '🛠️ ต้องขัดรูนเพิ่ม'}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black text-xs font-mono">
                  {readinessScore}%
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-400">
                ยังไม่มี {selectedMonster.name} ในกล่อง SWEX ของคุณ
              </div>
            )}
          </div>

          {/* Recommended Sets, Slots & Artifacts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="bg-[#0a0f18] p-3.5 rounded-xl border border-[#1d2b3f]">
              <div className="text-slate-400 font-bold mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> เซ็ตรูนยอดนิยม:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {monsterBuild.sets?.map((set, i) => (
                  <span key={i} className="px-2 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-md font-bold">
                    {set}
                  </span>
                ))}
              </div>
              {ownedUnit && (
                <div className="mt-2 text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                  เซ็ตที่ใส่อยู่: <strong className="text-emerald-400">{ownedUnit.sets?.join(' / ') || 'ไม่ครบเซ็ต'}</strong>
                </div>
              )}
            </div>

            <div className="bg-[#0a0f18] p-3.5 rounded-xl border border-[#1d2b3f]">
              <div className="text-slate-400 font-bold mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-400" /> ออปชั่นหลัก ช่อง 2 / 4 / 6:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {monsterBuild.slots246?.map((slot, i) => (
                  <span key={i} className="px-2 py-1 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-md font-bold">
                    {slot}
                  </span>
                ))}
              </div>
              {ownedUnit && (
                <div className="mt-2 text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                  ประสิทธิภาพรูน: <strong className="text-cyan-400">{ownedUnit.runeEff || 0}%</strong>
                </div>
              )}
            </div>

            <div className="bg-[#0a0f18] p-3.5 rounded-xl border border-[#1d2b3f]">
              <div className="text-slate-400 font-bold mb-2 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-400" /> อาร์ติแฟกต์ที่แนะนำ:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {monsterBuild.artifacts?.map((art, i) => (
                  <span key={i} className="px-2 py-1 bg-rose-500/10 text-rose-300 border border-rose-500/20 rounded-md font-medium text-[11px]">
                    {art}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 8 Stats Benchmark Grid with User Comparison */}
          <div>
            <div className="text-xs font-bold text-slate-300 mb-2.5 flex items-center justify-between">
              <span>สเตตัสเป้าหมาย Guardian (G1-G3 Target) เทียบกับไอดีของคุณ:</span>
              {ownedUnit && (
                <span className="text-[11px] text-emerald-400 font-mono">
                  ข้อมูลจากมอนสเตอร์เลเวล {ownedUnit.level}★{ownedUnit.stars}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'HP (พลังชีวิต)', key: 'hp', target: monsterBuild.benchmarks?.hp, current: ownedUnit?.hp, unit: '' },
                { label: 'SPD (ความเร็วรวม)', key: 'spd', target: monsterBuild.benchmarks?.spd, current: ownedUnit?.spd, unit: '' },
                { label: 'DEF (พลังป้องกัน)', key: 'def', target: monsterBuild.benchmarks?.def, current: ownedUnit?.def, unit: '' },
                { label: 'ATK (พลังโจมตี)', key: 'atk', target: monsterBuild.benchmarks?.atk, current: ownedUnit?.atk, unit: '' },
                { label: 'CR (อัตราคริ)', key: 'cr', target: monsterBuild.benchmarks?.cr, current: ownedUnit?.cr, unit: '%' },
                { label: 'CD (แรงคริ)', key: 'cd', target: monsterBuild.benchmarks?.cd, current: ownedUnit?.cd, unit: '%' },
                { label: 'RES (ต้านทาน)', key: 'res', target: monsterBuild.benchmarks?.res, current: ownedUnit?.res, unit: '%' },
                { label: 'ACC (ความแม่น)', key: 'acc', target: monsterBuild.benchmarks?.acc, current: ownedUnit?.acc, unit: '%' }
              ].map(item => {
                const pct = item.current && item.target ? Math.round((item.current / item.target) * 100) : 0;
                const isMet = pct >= 100;

                return (
                  <div key={item.key} className="bg-[#0a0f18] p-3 rounded-xl border border-[#1d2b3f] flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] text-slate-400 font-medium">{item.label}</div>
                      <div className="text-sm font-bold text-white font-mono mt-1 flex items-baseline justify-between">
                        <span className="text-amber-400">เป้า: {item.target?.toLocaleString()}{item.unit}</span>
                        {item.current !== undefined && (
                          <span className={`text-xs ${isMet ? 'text-emerald-400' : 'text-slate-300'}`}>
                            {item.current?.toLocaleString()}{item.unit}
                          </span>
                        )}
                      </div>
                    </div>

                    {ownedUnit && item.target && (
                      <div className="mt-2">
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${isMet ? 'bg-emerald-400' : pct >= 80 ? 'bg-amber-400' : 'bg-rose-400'}`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] mt-1">
                          <span className={isMet ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                            {isMet ? '✨ ผ่านเกณฑ์' : `${pct}% ของเป้า`}
                          </span>
                          <span className="text-slate-500 font-mono">
                            {isMet ? '+' + (item.current - item.target) : '-' + (item.target - item.current)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Expert Pro Tip */}
          {monsterBuild.tips && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-200">
              <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-300">เคล็ดลับการปั้นมอนสเตอร์ตัวนี้:</strong> {monsterBuild.tips}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 1. Defenses Section */}
      {(activeTab === 'all' || activeTab === 'defense') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              ทีมตั้งรับยอดนิยมใน Siege & Guild War ที่ใช้ {selectedMonster.name} ({defenseMatches.length} ทีม)
            </h3>
          </div>

          {defenseMatches.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[#101724] border border-[#1d2b3f] text-center text-xs text-slate-400">
              ไม่พบทีมตั้งรับเมต้าที่ใช้ {selectedMonster.name} ในปัจจุบัน (มอนสเตอร์ตัวนี้อาจเหมาะเป็นตัวบุกหรือเฉพาะทางใน PvE/RTA)
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {defenseMatches.map((def) => (
                <div 
                  key={def.id}
                  className="p-4 rounded-2xl bg-[#101724] border border-[#1d2b3f] hover:border-blue-500/50 transition-all flex flex-col justify-between space-y-3 shadow-lg"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-white">{def.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{def.towerType === 'nat4' ? 'หอ 4 ดาว (Nat 4)' : 'หอ 5 ดาว (Nat 5)'} • แข่งทั้งหมด {def.totalBattles} แมตช์</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      WR {def.winRate}%
                    </span>
                  </div>

                  {/* Monster lineup */}
                  <div className="flex items-center gap-3 bg-[#0c121c] p-2.5 rounded-xl border border-[#1d2b3f]/60">
                    {def.defenseMonsters.map((m, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <MonsterAvatar monster={m} size="md" />
                        <div className="text-xs font-bold text-slate-200 hidden sm:block">
                          {m.name}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-400">มีสูตรเคาน์เตอร์ในระบบ: <strong className="text-slate-200">{def.counters.length} ทีม</strong></span>
                    <button
                      onClick={() => onNavigate && onNavigate('3mdc', { search: def.title })}
                      className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      ดูทีมแก้ทาง <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. Counter Offenses Section */}
      {(activeTab === 'all' || activeTab === 'offense') && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Swords className="w-4 h-4 text-emerald-400" />
              สูตรทีมบุกเคาน์เตอร์ยอดนิยมที่ใช้ {selectedMonster.name} ชนะ ({counterMatches.length} สูตร)
            </h3>
          </div>

          {counterMatches.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[#101724] border border-[#1d2b3f] text-center text-xs text-slate-400">
              ไม่พบสูตรทีมบุกแก้ทางที่ใช้ {selectedMonster.name} เป็นตัวหลัก
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {counterMatches.map((item, idx) => (
                <div 
                  key={idx}
                  className="p-4 rounded-2xl bg-[#101724] border border-[#1d2b3f] hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-3 shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-slate-300">
                      บุกชนะทีม: <span className="text-white font-black">{item.againstDefense.title}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      ชนะ {item.counterTeam.winRate}% ({item.counterTeam.battles} แมตช์)
                    </span>
                  </div>

                  {/* Offense Team */}
                  <div className="bg-[#0c121c] p-2.5 rounded-xl border border-[#1d2b3f]/60">
                    <div className="text-[11px] text-slate-400 font-bold uppercase mb-1.5">ทีมบุกที่ใช้:</div>
                    <div className="flex items-center gap-3">
                      {item.counterTeam.monsters.map((m, mIdx) => (
                        <div key={mIdx} className="flex items-center gap-2">
                          <MonsterAvatar monster={m} size="md" />
                          <div className="text-xs font-bold text-slate-200 hidden sm:block">
                            {m.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {item.counterTeam.notes && (
                    <div className="text-xs text-slate-400 italic bg-[#0c121c]/50 p-2 rounded-lg border border-[#1d2b3f]/30">
                      💡 เทคนิค: {item.counterTeam.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Dungeon Section */}
      {(activeTab === 'all' || activeTab === 'pve') && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-purple-400" />
              การใช้งานในดันเจี้ยนฟาร์มรูน (Abyss & Cairon Dungeons)
            </h3>
          </div>

          {dungeonMatches.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[#101724] border border-[#1d2b3f] text-center text-xs text-slate-400">
              {selectedMonster.name} ไม่ได้เป็นมอนสเตอร์หลักในทีมสปีด Abyss Hard (มักเน้นใช้ใน PvP / กิลด์วอร์ / RTA มากกว่า)
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dungeonMatches.map((dm, idx) => (
                <div 
                  key={idx}
                  className="p-4 rounded-2xl bg-[#101724] border border-[#1d2b3f] hover:border-purple-500/50 transition-all space-y-3 shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">{dm.dungeon.nameTh}</div>
                      <div className="text-[11px] text-slate-400">เวลาเร็วสุด: <span className="text-emerald-400 font-mono font-bold">{dm.dungeon.recordTime}</span> • เฉลี่ย: {dm.dungeon.avgTime}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                      ผ่าน {dm.dungeon.successRate}
                    </span>
                  </div>

                  <div className="bg-[#0c121c] p-3 rounded-xl border border-[#1d2b3f]/60 space-y-1.5">
                    <div className="text-xs font-bold text-amber-300">บทบาทในทีม: {dm.roleInfo.role}</div>
                    <div className="text-xs text-slate-400 flex items-center justify-between">
                      <span>เซ็ตรูนแนะนำ: <strong className="text-slate-200">{dm.roleInfo.rune}</strong></span>
                      <span>สปีด: <strong className="text-cyan-400 font-mono">{dm.roleInfo.spd}</strong></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. RTA Section */}
      {(activeTab === 'all' || activeTab === 'rta') && rtaMatch && (
        <div className="space-y-3 pt-2">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-rose-400" />
            สถิติเวิลด์อารีน่า RTA World Arena (Season 38 สถิติ 6.8 ล้านแมตช์)
          </h3>

          <div className="p-5 rounded-2xl bg-[#101724] border border-[#1d2b3f] grid grid-cols-2 sm:grid-cols-4 gap-4 shadow-lg">
            <div className="bg-[#0c121c] p-3.5 rounded-xl border border-[#1d2b3f] text-center">
              <div className="text-[11px] text-slate-400 font-bold uppercase">Pick Rate</div>
              <div className="text-xl font-mono font-black text-amber-400 mt-0.5">{rtaMatch.pickRate}%</div>
              <div className="text-[11px] text-slate-400 mt-0.5">({rtaMatch.pickTotal?.toLocaleString()} ครั้ง)</div>
            </div>
            <div className="bg-[#0c121c] p-3.5 rounded-xl border border-[#1d2b3f] text-center">
              <div className="text-[11px] text-slate-400 font-bold uppercase">Win Rate</div>
              <div className="text-xl font-mono font-black text-emerald-400 mt-0.5">{rtaMatch.winRate}%</div>
              <div className="text-[11px] text-slate-400 mt-0.5">อัตราการชนะ</div>
            </div>
            <div className="bg-[#0c121c] p-3.5 rounded-xl border border-[#1d2b3f] text-center">
              <div className="text-[11px] text-slate-400 font-bold uppercase">Ban Rate</div>
              <div className="text-xl font-mono font-black text-rose-400 mt-0.5">{rtaMatch.banRate}%</div>
              <div className="text-[11px] text-slate-400 mt-0.5">อัตราโดนแบน</div>
            </div>
            <div className="bg-[#0c121c] p-3.5 rounded-xl border border-[#1d2b3f] text-center">
              <div className="text-[11px] text-slate-400 font-bold uppercase">First Pick Rate</div>
              <div className="text-xl font-mono font-black text-blue-400 mt-0.5">{rtaMatch.firstPickRate || 'N/A'}%</div>
              <div className="text-[11px] text-slate-400 mt-0.5">หยิบเป็นตัวแรก</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
