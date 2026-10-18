import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Shield, 
  Search, 
  ChevronRight, 
  Swords, 
  AlertCircle,
  ThumbsUp,
  Award,
  Star,
  Zap,
  UserCheck,
  Flame,
  ArrowRight,
  X,
  Plus,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Check,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import MonsterAvatar from '../components/MonsterAvatar';
import AiAdvisorPanel from '../components/AiAdvisorPanel';
import AiChatPanel from '../components/AiChatPanel';
import ALL_MDC_DATA from '../data/allMdcData.json';
import { MONSTERS } from '../data/monsters';
import { loadBox, baseAwakenedId } from '../utils/swexImport';
import { loadUserBoxFromDB } from '../services/storageService';
import TacticalBattlePlanModal from '../components/TacticalBattlePlanModal';

export default function MdcView({ search = '' }) {
  const [towerFilter, setTowerFilter] = useState('all'); // 'all', 'nat4', 'nat5'
  const [searchQuery, setSearchQuery] = useState(search);
  const detailRef = useRef(null);
  const [activeBattlePlanCounter, setActiveBattlePlanCounter] = useState(null);

  const [selectedSlots, setSelectedSlots] = useState([null, null, null]);
  const [activeSlotIdx, setActiveSlotIdx] = useState(null);
  const [pickerElement, setPickerElement] = useState('all');
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerStars, setPickerStars] = useState('all'); // 'all', '4', '5'
  const [selectedDefenseId, setSelectedDefenseId] = useState(ALL_MDC_DATA[0]?.id || 'def-1');
  const [counterCountLimit, setCounterCountLimit] = useState(25);

  // Pre-calculated counts for Nat 4 vs Nat 5 towers
  const towerCounts = useMemo(() => {
    let nat4 = 0;
    let nat5 = 0;
    for (const d of ALL_MDC_DATA) {
      if (d.towerType === 'nat4') nat4++;
      else if (d.towerType === 'nat5') nat5++;
    }
    return { nat4, nat5, all: ALL_MDC_DATA.length };
  }, []);

  // Top preset meta defenses for instant 1-click selection
  const topPresets = [
    { title: 'Seara + Orion + Perna', leader: 'Seara', m2: 'Orion', m3: 'Perna', count: 245, tower: 'nat5' },
    { title: 'Khmun + Vigor + Skogul', leader: 'Khmun', m2: 'Vigor', m3: 'Skogul', count: 199, tower: 'nat4' },
    { title: 'Martina + Shaina + Triana', leader: 'Martina', m2: 'Shaina', m3: 'Triana', count: 165, tower: 'nat4' },
    { title: 'Mo Long + Harmonia + Taranys', leader: 'Mo Long', m2: 'Harmonia', m3: 'Taranys', count: 96, tower: 'nat5' },
    { title: 'Aegir + Skogul + Triana', leader: 'Aegir', m2: 'Skogul', m3: 'Triana', count: 65, tower: 'nat4' },
    { title: 'Nana + Savannah + Perna', leader: 'Nana', m2: 'Savannah', m3: 'Perna', count: 38, tower: 'nat5' },
    { title: 'Carcano + Vigor + Triana', leader: 'Carcano', m2: 'Vigor', m3: 'Triana', count: 52, tower: 'nat4' },
    { title: 'Morris + Rex + Shumar', leader: 'Morris', m2: 'Rex', m3: 'Shumar', count: 35, tower: 'nat4' },
  ];

  // Helper to find monster from catalog
  const getMonsterObj = (name) => {
    if (!name) return null;
    const clean = name.toLowerCase().trim();
    return MONSTERS.find(m => 
      m.name.toLowerCase() === clean || 
      (m.thaiName && m.thaiName.toLowerCase() === clean) ||
      m.name.toLowerCase().includes(clean)
    );
  };

  // Preset 1-click select
  const handleSelectPreset = (preset) => {
    const s1 = getMonsterObj(preset.leader);
    const s2 = getMonsterObj(preset.m2);
    const s3 = getMonsterObj(preset.m3);
    setSelectedSlots([s1, s2, s3]);
    setActiveSlotIdx(null);
    setSearchQuery('');
    setCounterCountLimit(25);

    const match = ALL_MDC_DATA.find(d => {
      const names = d.defenseMonsters.map(m => m.name.toLowerCase());
      return names.includes(preset.leader.toLowerCase()) && 
             names.includes(preset.m2.toLowerCase()) && 
             names.includes(preset.m3.toLowerCase());
    });
    if (match) setSelectedDefenseId(match.id);
  };

  const handleSlotClick = (slotIdx) => {
    setActiveSlotIdx(activeSlotIdx === slotIdx ? null : slotIdx);
    setPickerSearch('');
  };

  const handleSelectMonster = (monster) => {
    if (activeSlotIdx !== null) {
      const nextSlots = [...selectedSlots];
      nextSlots[activeSlotIdx] = monster;
      setSelectedSlots(nextSlots);
      setCounterCountLimit(25);

      const nextEmpty = nextSlots.findIndex(s => !s);
      if (nextEmpty !== -1) {
        setActiveSlotIdx(nextEmpty);
      } else {
        setActiveSlotIdx(null);
      }
    }
  };

  const handleClearSlot = (slotIdx, e) => {
    e.stopPropagation();
    const nextSlots = [...selectedSlots];
    nextSlots[slotIdx] = null;
    setSelectedSlots(nextSlots);
    setCounterCountLimit(25);
  };

  const handleResetAll = () => {
    setSelectedSlots([null, null, null]);
    setActiveSlotIdx(null);
    setSearchQuery('');
    setCounterCountLimit(25);
  };

  // Filtered monsters for the picker modal
  const pickerMonsters = useMemo(() => {
    return MONSTERS.filter(m => {
      if (pickerElement !== 'all' && m.element !== pickerElement) return false;
      if (pickerStars === '4' && m.stars !== 4) return false;
      if (pickerStars === '5' && m.stars !== 5) return false;
      if (!pickerSearch.trim()) return true;
      const q = pickerSearch.toLowerCase().trim();
      return (
        m.name.toLowerCase().includes(q) ||
        (m.thaiName && m.thaiName.toLowerCase().includes(q))
      );
    }).slice(0, 72);
  }, [pickerElement, pickerStars, pickerSearch]);

  // Filter defense teams
  const filteredDefenses = useMemo(() => {
    const selectedMonsterNames = selectedSlots
      .filter(Boolean)
      .map(m => m.name.toLowerCase());

    return ALL_MDC_DATA.filter(item => {
      if (towerFilter !== 'all' && item.towerType !== towerFilter) return false;

      const defMonsterNames = item.defenseMonsters.map(m => m.name.toLowerCase());

      if (selectedMonsterNames.length > 0) {
        const matchesAll = selectedMonsterNames.every(name =>
          defMonsterNames.some(dm => dm.includes(name) || name.includes(dm))
        );
        if (!matchesAll) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDefense = defMonsterNames.some(m => m.includes(q));
        const matchesCounter = item.counters.some(c => 
          c.title.toLowerCase().includes(q) ||
          c.monsters.some(m => m.name.toLowerCase().includes(q) || (m.thaiName && m.thaiName.toLowerCase().includes(q)))
        );
        if (!matchesTitle && !matchesDefense && !matchesCounter) return false;
      }

      return true;
    });
  }, [towerFilter, selectedSlots, searchQuery]);

  const [userBox, setUserBox] = useState(() => loadBox());
  const [filterOnlyCanBuild, setFilterOnlyCanBuild] = useState(false);

  useEffect(() => {
    loadUserBoxFromDB().then((b) => {
      if (b) setUserBox(b);
    });
  }, []);

  // Map of owned monsters in user's box for fast lookups
  const ownedUnitsMap = useMemo(() => {
    if (!userBox || !userBox.units?.length) return new Map();
    const map = new Map();
    for (const u of userBox.units) {
      if (u.name) map.set(u.name.toLowerCase().trim(), u);
      if (u.thaiName) map.set(u.thaiName.toLowerCase().trim(), u);
      if (u.masterId) {
        map.set(String(u.masterId), u);
        const baseId = baseAwakenedId(u.masterId);
        if (baseId) map.set(String(baseId), u);
      }
    }
    return map;
  }, [userBox]);

  const findOwnedUnit = (monster) => {
    if (!monster || !ownedUnitsMap.size) return null;
    const name = String(monster.name || '').toLowerCase().trim();
    const cleanName = name.replace(/\s*\(.*\)$/, '').trim();
    return ownedUnitsMap.get(name) || ownedUnitsMap.get(cleanName) || null;
  };

  const currentDefense = useMemo(() => {
    if (filteredDefenses.length === 0) return null;
    const found = filteredDefenses.find(d => d.id === selectedDefenseId);
    return found || filteredDefenses[0];
  }, [filteredDefenses, selectedDefenseId]);

  // Enhance all counters of current defense with box ownership
  const enrichedCounters = useMemo(() => {
    if (!currentDefense) return [];
    return currentDefense.counters.map(counter => {
      const matchedUnits = counter.monsters.map(m => findOwnedUnit(m));
      const canBuild = matchedUnits.every(Boolean);
      const ownedCount = matchedUnits.filter(Boolean).length;
      return {
        ...counter,
        matchedUnits,
        canBuild,
        ownedCount,
      };
    });
  }, [currentDefense, ownedUnitsMap]);

  const totalCanBuildCount = useMemo(() => {
    return enrichedCounters.filter(c => c.canBuild).length;
  }, [enrichedCounters]);

  const displayedCounters = useMemo(() => {
    let list = enrichedCounters;
    if (filterOnlyCanBuild) {
      list = list.filter(c => c.canBuild);
    } else if (ownedUnitsMap.size > 0) {
      // Prioritize teams you can build first
      list = [...list].sort((a, b) => {
        if (a.canBuild !== b.canBuild) return b.canBuild ? 1 : -1;
        return (b.rating || 0) - (a.rating || 0);
      });
    }
    return list.slice(0, counterCountLimit);
  }, [enrichedCounters, filterOnlyCanBuild, ownedUnitsMap.size, counterCountLimit]);

  return (
    <div className="space-y-6 max-w-[1780px] 2xl:max-w-[1880px] mx-auto pb-16 animate-in fade-in duration-300">
      
      {/* 1. Header Banner (2026 Esports Glassmorphism) */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-r from-[#0c1424] via-[#090e18] to-[#070b12] p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono font-bold uppercase">
            <Shield className="w-3.5 h-3.5" />
            <span>SWM 3MDC Tactical Breaker • 1,500+ สูตรแก้ทางของแท้</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            ระบบค้นหาทีมแก้ทางกิลด์วอร์ (Siege 3MDC)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            กดเลือกมอนสเตอร์ 3 ตัวของทีมตั้งรับ หรือกดปุ่มพรีเซ็ตด่วน เพื่อดูสูตรทีมเจาะ อัตราการชนะ และลำดับออกสกิล
          </p>
        </div>

        {/* 3D Segmented Tower Filters */}
        <div className="relative z-10 flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl self-start md:self-auto shadow-inner">
          <button
            onClick={() => { setTowerFilter('all'); setCounterCountLimit(25); }}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              towerFilter === 'all' 
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-400/40' 
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <span>🏰 ทุกฐานทัพ ({towerCounts.all.toLocaleString()})</span>
          </button>
          <button
            onClick={() => { setTowerFilter('nat4'); setCounterCountLimit(25); }}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              towerFilter === 'nat4' 
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-lg shadow-amber-500/30 ring-1 ring-amber-300' 
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <span>⭐ ฐาน 4 ดาว ({towerCounts.nat4.toLocaleString()} สูตร)</span>
          </button>
          <button
            onClick={() => { setTowerFilter('nat5'); setCounterCountLimit(25); }}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              towerFilter === 'nat5' 
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/30 ring-1 ring-purple-400/40' 
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <span>👑 ฐาน 5 ดาว ({towerCounts.nat5.toLocaleString()} สูตร)</span>
          </button>
        </div>
      </div>

      {/* 2. Visual 3-Slot Interactive Defense Picker */}
      <div className="rounded-2xl sm:rounded-3xl border border-white/[0.08] bg-[#0a0f19]/80 backdrop-blur-xl p-3.5 sm:p-6 shadow-xl space-y-4 sm:space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="hidden sm:inline">คลิกช่องเพื่อเลือก 3 มอนสเตอร์ทีมป้องกัน (3D Interactive Slots):</span>
            <span className="sm:hidden">เลือก 3 มอนสเตอร์ทีมป้องกัน:</span>
          </div>

          {(selectedSlots.some(Boolean) || searchQuery) && (
            <button
              onClick={handleResetAll}
              className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-300 hover:text-white rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1.5 border border-rose-500/20 cursor-pointer shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ล้างตัวเลือก</span>
            </button>
          )}
        </div>

        {/* 3 Interactive 3D Card Slots */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-2xl mx-auto">
          {[0, 1, 2].map((slotIdx) => {
            const monster = selectedSlots[slotIdx];
            const isActive = activeSlotIdx === slotIdx;
            const slotTitle = slotIdx === 0 ? '👑 Leader Slot' : slotIdx === 1 ? '⚔️ Member #2' : '🛡️ Member #3';

            const elementGlow = monster?.element === 'fire' 
              ? 'border-rose-500/50 shadow-rose-500/15 group-hover:border-rose-400' 
              : monster?.element === 'water' 
              ? 'border-sky-500/50 shadow-sky-500/15 group-hover:border-sky-400' 
              : monster?.element === 'wind' 
              ? 'border-amber-500/50 shadow-amber-500/15 group-hover:border-amber-400' 
              : monster?.element === 'light' 
              ? 'border-yellow-400/50 shadow-yellow-400/15 group-hover:border-yellow-300' 
              : monster?.element === 'dark' 
              ? 'border-purple-500/50 shadow-purple-500/15 group-hover:border-purple-400' 
              : 'border-white/20';

            return (
              <div
                key={slotIdx}
                onClick={() => handleSlotClick(slotIdx)}
                className={`relative rounded-2xl border transition-all duration-300 p-2.5 sm:p-4 text-center cursor-pointer flex flex-col items-center justify-center min-h-[125px] sm:min-h-[160px] shadow-xl select-none group transform-gpu ${
                  isActive
                    ? 'border-cyan-400 bg-gradient-to-b from-cyan-950/40 via-blue-950/30 to-[#070b12] shadow-cyan-500/30 ring-2 ring-cyan-400 scale-[1.04]'
                    : monster
                      ? `bg-gradient-to-b from-[#141e30] via-[#0d1624] to-[#070b12] hover:-translate-y-1 hover:shadow-2xl ${elementGlow}`
                      : 'border-dashed border-white/15 bg-white/[0.02] hover:border-cyan-400/50 hover:bg-white/[0.04] hover:-translate-y-0.5'
                }`}
              >
                {/* 3D Depth Card Sheen */}
                <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.06] to-transparent rounded-t-2xl pointer-events-none" />

                {monster ? (
                  <>
                    <button
                      onClick={(e) => handleClearSlot(slotIdx, e)}
                      className="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center text-xs font-bold shadow-lg z-20 cursor-pointer transition-transform hover:scale-110 ring-2 ring-slate-950"
                      title="ลบตัวนี้"
                    >
                      ✕
                    </button>
                    <div className="relative z-10 group-hover:scale-105 transition-transform duration-200">
                      <MonsterAvatar monster={monster} size="md" showStars={false} />
                    </div>
                    <span className="mt-2 text-xs font-extrabold text-white truncate max-w-full drop-shadow relative z-10">
                      {monster.thaiName || monster.name}
                    </span>
                    <span className="text-[10px] sm:text-[11px] text-cyan-300 font-mono font-black mt-0.5 px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-800/60 relative z-10">
                      {slotTitle}
                    </span>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-slate-400 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-cyan-400 text-xl font-black group-hover:scale-110 group-hover:border-cyan-400/50 transition-all shadow-inner">
                      +
                    </div>
                    <span className="text-xs font-bold text-slate-200 mt-1">
                      {slotTitle}
                    </span>
                    <span className="text-[10px] text-slate-400">กดเพื่อเลือก 3D</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Monster Selector Drawer */}
        {activeSlotIdx !== null && (
          <div className="bg-[#070b12] border border-blue-500/30 rounded-2xl p-5 space-y-4 animate-in fade-in shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-cyan-400">
                  กำลังเลือกตำแหน่ง: {activeSlotIdx === 0 ? '👑 Leader' : `ตัวที่ #${activeSlotIdx + 1}`}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-xs text-slate-400">คลิกที่มอนสเตอร์เพื่อเลือก</span>
              </div>
              <button
                onClick={() => setActiveSlotIdx(null)}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer self-end sm:self-auto"
              >
                <span>ปิดหน้าต่างเลือก</span>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Elements & Star Filters & Search */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {/* Element Buttons */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                  {[
                    { id: 'all', label: 'ทุกธาตุ' },
                    { id: 'fire', label: '🔥 ไฟ' },
                    { id: 'water', label: '💧 น้ำ' },
                    { id: 'wind', label: '🌪️ ลม' },
                    { id: 'light', label: '✨ แสง' },
                    { id: 'dark', label: '🌑 มืด' }
                  ].map((el) => (
                    <button
                      key={el.id}
                      onClick={() => setPickerElement(el.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                        pickerElement === el.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/[0.04] text-slate-400 hover:text-white'
                      }`}
                    >
                      {el.label}
                    </button>
                  ))}
                </div>

                {/* Star Filter Pill Bar */}
                <div className="flex items-center gap-1">
                  {[
                    { id: 'all', label: '⭐ ทุกดาว' },
                    { id: '4', label: '⭐ 4★ แท้' },
                    { id: '5', label: '👑 5★ แท้' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setPickerStars(s.id)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                        pickerStars === s.id
                          ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                          : 'bg-white/[0.04] text-slate-400 hover:text-white'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder="พิมพ์ค้นหามอนสเตอร์ (เช่น Seara, Orion, Savan)..."
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                />
              </div>
            </div>

            {/* Monster Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2 max-h-60 overflow-y-auto pr-1">
              {pickerMonsters.map((m) => (
                <button
                  key={m.id || m.name}
                  onClick={() => handleSelectMonster(m)}
                  className="p-1.5 rounded-xl hover:bg-white/[0.08] flex flex-col items-center gap-1 transition-all cursor-pointer group"
                >
                  <MonsterAvatar monster={m} size="sm" showStars={false} />
                  <span className="text-[11px] font-bold text-slate-300 truncate w-full group-hover:text-cyan-400 text-center">
                    {m.thaiName || m.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 1-Click Meta Presets */}
        <div className="pt-3 border-t border-white/[0.06]">
          <div className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>กดปุ่มด่วนเลือกทีมยอดนิยมในกิลด์วอร์ (1-Click Meta Presets):</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {topPresets.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectPreset(p)}
                className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-blue-600/20 text-slate-200 hover:text-white border border-white/10 hover:border-blue-500/40 text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <span>{p.title}</span>
                <span className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  {p.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Universal Search Bar */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0a0f19]/80 backdrop-blur-xl p-3.5 flex items-center gap-3 shadow-lg">
        <Search className="w-5 h-5 text-slate-400 ml-1 shrink-0" />
        <input
          type="text"
          className="w-full bg-transparent border-none text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
          placeholder="หรือพิมพ์ชื่อมอนสเตอร์ทีมรับ / ทีมบุก (เช่น Seara, Khmun, Morris, Kinki, Tetra, Bolverk...)"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setCounterCountLimit(25); }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-slate-400 hover:text-white text-xs px-2 cursor-pointer"
          >
            ✕ ล้าง
          </button>
        )}
      </div>

      {/* 4. Two Column Layout: Defenses List (5 cols) & Counter Offenses (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Defenses List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            <span>พบทั้งหมด <strong className="text-white font-mono">{filteredDefenses.length}</strong> ทีมตั้งรับ</span>
            <span>คลิกเพื่อดูสูตรบุกแก้ทาง</span>
          </div>

          <div className="space-y-2.5 max-h-[850px] overflow-y-auto pr-1">
            {filteredDefenses.map((team) => {
              const isSelected = currentDefense && team.id === currentDefense.id;

              return (
                <button
                  type="button"
                  key={team.id}
                  onClick={() => pickDefense(team.id)}
                  aria-pressed={isSelected}
                  className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer shadow-md ${
                    isSelected
                      ? 'bg-blue-600/15 border-blue-500/60 shadow-blue-500/15 ring-1 ring-blue-500/40'
                      : 'bg-[#0a0f19]/80 border-white/[0.06] hover:border-white/20 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        team.towerType === 'nat4' 
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                          : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      }`}>
                        {team.towerType === 'nat4' ? 'หอ 4 ดาว' : 'หอ 5 ดาว'}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {team.difficulty}
                      </span>
                    </div>

                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30 font-mono">
                      {team.countersCount} สูตรแก้
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {team.defenseMonsters.map((m, mIdx) => (
                        <MonsterAvatar key={mIdx} monster={m} size="sm" showStars={false} />
                      ))}
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-white max-w-[150px] truncate">
                        {team.title}
                      </div>
                      <span className="text-xs text-cyan-400 font-semibold flex items-center justify-end gap-1 mt-1">
                        ดูทีมบุกทั้งหมด <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Counter Strategies */}
        <div ref={detailRef} className="lg:col-span-7 space-y-4 scroll-mt-20">
          {currentDefense ? (
            <>
              {/* Selected Defense Overview Card */}
              <div className="rounded-3xl border border-white/[0.08] bg-[#0a0f19]/90 backdrop-blur-xl p-6 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
                  <div>
                    <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wide">
                      ทีมตั้งรับเป้าหมาย (Active Defense Target)
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                      {currentDefense.title}
                    </h2>
                    <div className="text-xs text-slate-400 mt-1">
                      ระดับความอันตราย: <span className="text-rose-400 font-semibold">{currentDefense.difficulty}</span> •{' '}
                      พบทั้งหมด <span className="text-emerald-400 font-mono font-bold">{currentDefense.countersCount}</span> สูตรแก้ทางในระบบ SWM
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {currentDefense.defenseMonsters.map((m, idx) => (
                      <MonsterAvatar key={idx} monster={m} size="md" />
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-2xl flex items-start gap-2.5 text-xs text-slate-300">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    สูตรเคาน์เตอร์ด้านล่างรวบรวมในฐานข้อมูล SWM โดยผู้เล่นระดับ Guardian จัดเรียงตามความนิยม อัตราการชนะ และความปลอดภัยในการเข้าตี
                  </p>
                </div>
              </div>

              {/* Grounded AI coach for the selected defense */}
              <AiAdvisorPanel
                resetKey={currentDefense.id}
                label="ให้ AI อธิบายวิธีแก้ทีมนี้"
                hint="อธิบายว่าทีมตั้งรับนี้อันตรายเพราะสกิลอะไร แล้วเลือกสูตรแก้ทางที่เหมาะสุดพร้อมลำดับเทิร์น"
                buildPayload={() => ({
                  kind: 'mdc',
                  defense: { title: currentDefense.title, monsters: (currentDefense.defenseMonsters || []).map((m) => ({ name: m.name })) },
                  counters: (displayedCounters || []).slice(0, 5).map((c) => ({
                    title: c.title,
                    monsters: (c.monsters || []).map((m) => ({ name: m.name })),
                    rating: c.rating,
                    turnOrder: c.turnOrder,
                    notes: c.notes,
                  })),
                })}
              />

              <AiChatPanel
                compact
                title="ถามต่อเรื่องทีมนี้"
                placeholder="เช่น ถ้าไม่มี Theomars ใช้ตัวไหนแทน / ต้องสปีดเท่าไหร่ถึงชนะ Perna"
                suggestions={['ถ้าฉันไม่มีตัวในสูตร ใช้อะไรแทนได้', 'ทีมนี้แพ้ทางอะไรที่สุด', 'ควรแบนตัวไหนถ้าเจอใน Siege']}
                buildContext={() => ({
                  defense: `${currentDefense.title} (${(currentDefense.defenseMonsters || []).map((m) => m.name).join(', ')})`,
                  monsters: [...(currentDefense.defenseMonsters || []).map((m) => m.name), ...((displayedCounters || [])[0]?.monsters || []).map((m) => m.name)],
                })}
              />

              {/* AI Tactical Counter Scanner Banner */}
              <div className="rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-indigo-950/40 p-4 sm:p-5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[11px] font-bold uppercase tracking-wider mb-1.5">
                      <Zap className="w-3.5 h-3.5 text-cyan-400" />
                      <span>AI Tactical Counter Scanner • สแกนเจาะบ้านรับจากไอดี</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-white">
                      {totalCanBuildCount > 0 
                        ? `พบคู่หู 3 ตัวในไอดีคุณพร้อมรบ ${totalCanBuildCount} ทีมสำหรับเจาะบ้านนี้!` 
                        : 'สแกนคลังไอดี: มีสูตรแนะนำพร้อมระบบค้นหาตัวแทนที่คุณมีในไอดี'}
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      คำนวณ Turn Order ลำดับออกสกิล, ช่องว่าง Speed Gap, รูน Will ป้องกันเทิร์นแรก และ Kill Priority
                    </p>
                  </div>

                  {displayedCounters.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveBattlePlanCounter(displayedCounters[0])}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 hover:scale-[1.02] active:scale-95"
                    >
                      <Zap className="w-4 h-4 text-amber-300" />
                      <span>เปิดแผนรบทีมแนะนำ #{1}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Counter Teams List */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span>
                      สูตรบุกแก้ทางที่ผ่านการทดสอบ (แสดง {displayedCounters.length} จาก {currentDefense.countersCount} สูตร)
                    </span>
                    {userBox && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-mono normal-case">
                        ไอดีคุณทำได้ {totalCanBuildCount} ทีม
                      </span>
                    )}
                  </div>

                  {userBox && (
                    <button
                      onClick={() => setFilterOnlyCanBuild(!filterOnlyCanBuild)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                        filterOnlyCanBuild
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                          : 'bg-white/[0.04] text-slate-300 hover:text-white border-white/10'
                      }`}
                      title="กรองเฉพาะทีมแก้ทางที่ไอดีของคุณมีมอนสเตอร์ครบทั้ง 3 ตัว"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{filterOnlyCanBuild ? 'แสดงเฉพาะทีมที่ฉันทำได้' : `กรองเฉพาะทีมที่ทำได้ (${totalCanBuildCount})`}</span>
                    </button>
                  )}
                </div>

                <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
                  {displayedCounters.map((counter, idx) => (
                    <div
                      key={counter.id}
                      className={`rounded-2xl border transition-all duration-300 space-y-3.5 p-4 sm:p-5 shadow-lg hover:-translate-y-1 hover:shadow-xl relative overflow-hidden group ${
                        counter.canBuild
                          ? 'bg-gradient-to-b from-emerald-950/20 via-[#0a1418] to-[#060c10] border-emerald-500/40 hover:border-emerald-400 hover:shadow-emerald-500/10'
                          : 'bg-gradient-to-b from-[#0e1726] via-[#090f19] to-[#070a12] border-white/[0.08] hover:border-cyan-400/50 hover:shadow-cyan-500/10'
                      }`}
                    >
                      {/* Subtle 3D Card Top Sheen */}
                      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06] relative z-10">
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-xl bg-white/[0.04] border border-white/10 font-mono text-xs font-black text-cyan-300 flex items-center justify-center shrink-0 shadow-inner">
                            #{idx + 1}
                          </span>
                          <div className="flex items-center gap-2">
                            {counter.monsters.map((m, mIdx) => {
                              const owned = counter.matchedUnits?.[mIdx];
                              return (
                                <div key={mIdx} className="flex flex-col items-center">
                                  <div className="relative group/m">
                                    <div className="group-hover/m:scale-105 transition-transform">
                                      <MonsterAvatar monster={m} size="sm" showStars={false} />
                                    </div>
                                    {owned ? (
                                      <span className="absolute -top-1 -right-1 p-0.5 rounded-full bg-emerald-500 text-white shadow-md ring-1 ring-emerald-300" title={`ในไอดีมี: ${owned.name || m.name}`}>
                                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                                      </span>
                                    ) : (
                                      <span className="absolute -top-1 -right-1 p-0.5 rounded-full bg-slate-800 text-slate-400 border border-white/10" title="ยังไม่มีมอนสเตอร์นี้">
                                        <Lock className="w-2.5 h-2.5" />
                                      </span>
                                    )}
                                  </div>
                                  {owned ? (
                                    <span className="text-[9px] font-mono font-bold text-cyan-300 mt-0.5">
                                      +{owned.spd ? Math.max(0, owned.spd - (owned.baseSpd || 100)) : 0} SPD
                                    </span>
                                  ) : (
                                    <span className="text-[9px] text-slate-500 mt-0.5">ขาดตัวนี้</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-black text-white truncate max-w-[200px]">
                                {counter.title}
                              </h4>
                              {counter.canBuild ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1">
                                  <Check className="w-2.5 h-2.5 stroke-[3]" /> ในไอดีมีครบ 3 ตัว
                                </span>
                              ) : counter.ownedCount > 0 ? (
                                <span className="px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10 text-[10px] font-medium">
                                  มี {counter.ownedCount}/3 ตัว
                                </span>
                              ) : null}
                            </div>
                            <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <UserCheck className="w-3 h-3 text-slate-400" />
                              <span>บันทึกโดย: <strong className="text-slate-200">{counter.author}</strong></span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                          <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-xl shadow-sm">
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            <span className="text-xs font-mono font-bold text-amber-300">{counter.rating.toFixed(1)}</span>
                          </div>

                          <div className="bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-xl text-right shadow-sm">
                            <div className="text-[10px] text-emerald-400 font-medium">ความน่าเชื่อถือ</div>
                            <div className="text-xs font-mono font-black text-emerald-300">{counter.winRate}</div>
                          </div>
                        </div>
                      </div>

                      {/* Strategy Details */}
                      <div className="space-y-2 text-xs relative z-10">
                        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-2">
                          <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="text-slate-300 font-sans">
                            <strong className="text-cyan-400">ลำดับออกสกิล:</strong> {counter.turnOrder}
                          </span>
                        </div>

                        <div className="text-slate-400 text-xs px-1 font-sans">
                          💡 {counter.notes}
                        </div>
                      </div>

                      {/* Tactical Battle Plan Action */}
                      <button
                        type="button"
                        onClick={() => setActiveBattlePlanCounter(counter)}
                        className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-cyan-600/15 via-blue-600/15 to-indigo-600/15 hover:from-cyan-600/30 hover:to-indigo-600/30 border border-cyan-500/30 hover:border-cyan-400/60 text-cyan-300 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-between shadow-sm relative z-10"
                      >
                        <span className="flex items-center gap-2">
                          <Zap className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                          <span>เปิดแผนรบ 3D & วิเคราะห์สปีดจริง (AI Tactical Battle Plan)</span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  ))}
                </div>

                {counterCountLimit < currentDefense.countersCount && (
                  <div className="pt-2 text-center">
                    <button
                      onClick={() => setCounterCountLimit(prev => prev + 25)}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                    >
                      โหลดสูตรแก้ทางเพิ่มเติม (+25 สูตร) • เหลืออีก {currentDefense.countersCount - counterCountLimit} สูตร
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 bg-[#0a0f19]/80 border border-white/[0.08] rounded-3xl">
              ไม่พบทีมตั้งรับที่ตรงกับคำค้นหา
            </div>
          )}
        </div>

      </div>

      {/* Tactical Battle Plan Modal */}
      <TacticalBattlePlanModal
        isOpen={Boolean(activeBattlePlanCounter)}
        onClose={() => setActiveBattlePlanCounter(null)}
        counter={activeBattlePlanCounter}
        defense={currentDefense}
        userUnitsMap={ownedUnitsMap}
      />
    </div>
  );
}
