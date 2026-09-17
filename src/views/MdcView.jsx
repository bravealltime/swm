import React, { useState, useMemo } from 'react';
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
  Sparkles
} from 'lucide-react';
import MonsterAvatar from '../components/MonsterAvatar';
import ALL_MDC_DATA from '../data/allMdcData.json';
import { MONSTERS } from '../data/monsters';

export default function MdcView({ search = '' }) {
  const [towerFilter, setTowerFilter] = useState('all'); // 'all', 'nat4', 'nat5'
  const [searchQuery, setSearchQuery] = useState(search);
  const [selectedSlots, setSelectedSlots] = useState([null, null, null]);
  const [activeSlotIdx, setActiveSlotIdx] = useState(null);
  const [pickerElement, setPickerElement] = useState('all');
  const [pickerSearch, setPickerSearch] = useState('');
  const [selectedDefenseId, setSelectedDefenseId] = useState(ALL_MDC_DATA[0]?.id || 'def-1');
  const [counterCountLimit, setCounterCountLimit] = useState(25);

  // Top preset meta defenses for instant 1-click selection
  const topPresets = [
    { title: 'Seara + Orion + Perna', leader: 'Seara', m2: 'Orion', m3: 'Perna', count: 245 },
    { title: 'Khmun + Vigor + Skogul', leader: 'Khmun', m2: 'Vigor', m3: 'Skogul', count: 199 },
    { title: 'Martina + Shaina + Triana', leader: 'Martina', m2: 'Shaina', m3: 'Triana', count: 165 },
    { title: 'Mo Long + Harmonia + Taranys', leader: 'Mo Long', m2: 'Harmonia', m3: 'Taranys', count: 96 },
    { title: 'Aegir + Skogul + Triana', leader: 'Aegir', m2: 'Skogul', m3: 'Triana', count: 65 },
    { title: 'Nana + Savannah + Perna', leader: 'Nana', m2: 'Savannah', m3: 'Perna', count: 38 },
    { title: 'Morris + Rex + Shumar', leader: 'Morris', m2: 'Rex', m3: 'Shumar', count: 35 },
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

    // Find defense team matching these monsters
    const match = ALL_MDC_DATA.find(d => {
      const names = d.defenseMonsters.map(m => m.name.toLowerCase());
      return names.includes(preset.leader.toLowerCase()) && 
             names.includes(preset.m2.toLowerCase()) && 
             names.includes(preset.m3.toLowerCase());
    });
    if (match) setSelectedDefenseId(match.id);
  };

  // Slot click handler
  const handleSlotClick = (slotIdx) => {
    setActiveSlotIdx(activeSlotIdx === slotIdx ? null : slotIdx);
    setPickerSearch('');
  };

  // Clear single slot
  const handleClearSlot = (slotIdx, e) => {
    e.stopPropagation();
    const newSlots = [...selectedSlots];
    newSlots[slotIdx] = null;
    setSelectedSlots(newSlots);
  };

  // Clear all slots
  const handleResetAll = () => {
    setSelectedSlots([null, null, null]);
    setActiveSlotIdx(null);
    setSearchQuery('');
    setCounterCountLimit(25);
  };

  // Select monster for active slot
  const handleSelectMonsterForSlot = (monster) => {
    const newSlots = [...selectedSlots];
    const targetIdx = activeSlotIdx !== null ? activeSlotIdx : newSlots.findIndex(s => s === null);
    if (targetIdx !== -1) {
      newSlots[targetIdx] = monster;
      setSelectedSlots(newSlots);
      // Automatically advance to next empty slot or close
      const nextEmpty = newSlots.findIndex(s => s === null);
      setActiveSlotIdx(nextEmpty !== -1 ? nextEmpty : null);
    }
  };

  // Filtered monsters for slot picker drawer
  const poolMonsters = useMemo(() => {
    return MONSTERS.filter(m => {
      if (pickerElement !== 'all' && m.element !== pickerElement) return false;
      if (!pickerSearch) return true;
      const q = pickerSearch.toLowerCase().trim();
      const nEn = (m.name || '').toLowerCase();
      const nTh = (m.thaiName || '').toLowerCase();
      const fam = (m.family || '').toLowerCase();
      return nEn.includes(q) || nTh.includes(q) || fam.includes(q);
    });
  }, [pickerElement, pickerSearch]);

  // Active slot monster names filter
  const activeSlotNames = useMemo(() => {
    return selectedSlots.filter(Boolean).map(m => (m.name || '').toLowerCase());
  }, [selectedSlots]);

  // Main Filtered Defenses logic
  const filteredDefenses = useMemo(() => {
    return ALL_MDC_DATA.filter(team => {
      if (towerFilter !== 'all' && team.towerType !== towerFilter) return false;

      // Check slot filter if user picked 1, 2, or 3 monsters
      if (activeSlotNames.length > 0) {
        const defNames = team.defenseMonsters.map(m => (m.name || '').toLowerCase());
        const matchesAllSlots = activeSlotNames.every(slotName => 
          defNames.some(dName => dName.includes(slotName) || slotName.includes(dName))
        );
        if (!matchesAllSlots) return false;
      }

      // Check search query
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchesTitle = team.title.toLowerCase().includes(q);
      const matchesDefMonsters = team.defenseMonsters.some(m => {
        const nTh = (m.thaiName || '').toLowerCase();
        const nEn = (m.name || '').toLowerCase();
        return nTh.includes(q) || nEn.includes(q);
      });
      const matchesCounters = team.counters.some(c => {
        return c.monsters.some(cm => {
          const cnTh = (cm.thaiName || '').toLowerCase();
          const cnEn = (cm.name || '').toLowerCase();
          return cnTh.includes(q) || cnEn.includes(q);
        });
      });
      return matchesTitle || matchesDefMonsters || matchesCounters;
    });
  }, [towerFilter, activeSlotNames, searchQuery]);

  // Selected defense
  const currentDefense = useMemo(() => {
    return filteredDefenses.find(d => d.id === selectedDefenseId) || filteredDefenses[0] || ALL_MDC_DATA[0];
  }, [filteredDefenses, selectedDefenseId]);

  const displayedCounters = useMemo(() => {
    if (!currentDefense || !currentDefense.counters) return [];
    return currentDefense.counters.slice(0, counterCountLimit);
  }, [currentDefense, counterCountLimit]);

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* 1. Header & Tower Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1c2738] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-blue-400 uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4" />
            SWM 3MDC Interceptor • 1,253 สูตรแก้ทางของแท้
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            ระบบค้นหาทีมแก้ทาง 3MDC (เลือก 3 มอนสเตอร์)
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            กดเลือกรูป 3 มอนสเตอร์ทีมป้องกันด้านล่าง หรือพิมพ์ค้นหาเพื่อดูสูตรทีมบุกเคาน์เตอร์และลำดับการออกสกิลทันที
          </p>
        </div>

        {/* Tower Filter */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#101724] border border-[#1d2b3f] self-start sm:self-auto">
          <button
            onClick={() => { setTowerFilter('all'); setCounterCountLimit(25); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              towerFilter === 'all' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            หอทั้งหมด
          </button>
          <button
            onClick={() => { setTowerFilter('nat4'); setCounterCountLimit(25); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              towerFilter === 'nat4' 
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            หอ 4 ดาว (Nat 4)
          </button>
          <button
            onClick={() => { setTowerFilter('nat5'); setCounterCountLimit(25); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              towerFilter === 'nat5' 
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            หอ 5 ดาว (Nat 5)
          </button>
        </div>
      </div>

      {/* 2. Visual 3-Slot Interactive Defense Picker (เลือก 3 มอนสเตอร์ง่ายๆ) */}
      <div className="bg-gradient-to-b from-[#111927] to-[#0c121d] p-5 rounded-2xl border border-[#23334d] shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
            <span>เลือก 3 มอนสเตอร์ทีมป้องกัน (Tap Slots to Pick Monsters):</span>
          </div>

          {(selectedSlots.some(Boolean) || searchQuery) && (
            <button
              onClick={handleResetAll}
              className="px-3 py-1 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border border-rose-500/30"
            >
              <RotateCcw className="w-3 h-3" />
              <span>ล้างตัวเลือกทั้งหมด (Reset)</span>
            </button>
          )}
        </div>

        {/* 3 Interactive Slots */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-2xl mx-auto">
          {[0, 1, 2].map((slotIdx) => {
            const monster = selectedSlots[slotIdx];
            const isActive = activeSlotIdx === slotIdx;

            return (
              <div
                key={slotIdx}
                onClick={() => handleSlotClick(slotIdx)}
                className={`relative rounded-2xl border-2 transition-all p-3.5 text-center cursor-pointer flex flex-col items-center justify-center min-h-[135px] shadow-lg select-none ${
                  isActive
                    ? 'border-blue-500 bg-blue-950/40 shadow-blue-500/25 ring-2 ring-blue-400 scale-[1.02]'
                    : monster
                      ? 'border-[#2d405b] bg-[#0d1522] hover:border-slate-400'
                      : 'border-dashed border-[#22334a] bg-[#090f18] hover:border-blue-400/60 hover:bg-[#0c1420]'
                }`}
              >
                {monster ? (
                  <>
                    <button
                      onClick={(e) => handleClearSlot(slotIdx, e)}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center text-xs font-bold shadow-md z-20"
                      title="ลบตัวนี้"
                    >
                      ✕
                    </button>
                    <MonsterAvatar monster={monster} size="md" showStars={false} />
                    <span className="mt-2 text-xs font-bold text-white truncate max-w-full">
                      {monster.thaiName || monster.name}
                    </span>
                    <span className="text-[10px] text-blue-400 font-mono">
                      {slotIdx === 0 ? '👑 Leader' : `ตัวที่ #${slotIdx + 1}`}
                    </span>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-slate-400">
                    <div className="w-10 h-10 rounded-xl bg-[#131d2c] border border-[#23334d] flex items-center justify-center text-blue-400 text-lg font-bold group-hover:scale-110 transition-transform">
                      +
                    </div>
                    <span className="text-xs font-bold text-slate-300 mt-1">
                      {slotIdx === 0 ? 'เลือก Leader' : `เลือกตัวที่ #${slotIdx + 1}`}
                    </span>
                    <span className="text-[10px] text-slate-500">กดเพื่อเลือก</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Monster Selector Drawer (Opens when tapping a slot) */}
        {activeSlotIdx !== null && (
          <div className="bg-[#0b1018] border border-blue-500/40 rounded-2xl p-4 space-y-3 animate-fadeIn shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#1b283d]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-400">
                  กำลังเลือกใส่ตำแหน่งที่ #{activeSlotIdx + 1} ({activeSlotIdx === 0 ? 'Leader' : 'Member'}):
                </span>
              </div>

              {/* Element Filter Buttons */}
              <div className="flex flex-wrap items-center gap-1">
                {['all', 'fire', 'water', 'wind', 'light', 'dark'].map((el) => (
                  <button
                    key={el}
                    onClick={() => setPickerElement(el)}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase transition-all ${
                      pickerElement === el
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-[#121c2c] text-slate-400 hover:text-white border border-[#1e2a3c]'
                    }`}
                  >
                    {el}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Filter Search Input inside Drawer */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                className="w-full bg-[#111927] border border-[#22334d] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                placeholder="พิมพ์ค้นหาชื่อเพื่อเลือกทันที (เช่น Savannah, Clara, Carcano, Perna, Kaki, Tractor...)"
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                autoFocus
              />
            </div>

            {/* Monsters Grid to Tap */}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 max-h-56 overflow-y-auto pr-1">
              {poolMonsters.slice(0, 50).map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleSelectMonsterForSlot(m)}
                  className="p-1.5 rounded-xl bg-[#101724] hover:bg-blue-900/40 border border-[#1e2a3c] hover:border-blue-400 transition-all flex flex-col items-center gap-1 cursor-pointer text-center group"
                >
                  <img
                    src={m.avatarUrl || m.imageUrl}
                    alt={m.name}
                    className="w-11 h-11 rounded-lg object-cover bg-black group-hover:scale-105 transition-transform"
                    onError={(e) => { e.target.src = 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0001_0_0.png'; }}
                  />
                  <span className="text-[10px] font-bold text-slate-300 truncate w-full group-hover:text-blue-400">
                    {m.thaiName || m.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Meta Presets (1-Click Shortcut Chips) */}
        <div className="pt-2 border-t border-[#1a2638]">
          <div className="text-[11px] font-bold text-slate-400 mb-2 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>กดปุ่มด่วนเลือกทีมยอดนิยมในกิลด์วอร์ (1-Click Meta Presets):</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {topPresets.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectPreset(p)}
                className="px-3 py-1.5 rounded-xl bg-[#0f1725] hover:bg-blue-600/20 text-slate-200 hover:text-white border border-[#1e2e44] hover:border-blue-500/50 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
              >
                <span>{p.title}</span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-500/30">
                  {p.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Text Search Bar (Optional Search by Name or Counters) */}
      <div className="bg-[#101724] p-3.5 rounded-2xl border border-[#1d2b3f] flex items-center gap-3 shadow-md">
        <Search className="w-5 h-5 text-slate-400 ml-1 shrink-0" />
        <input
          type="text"
          className="w-full bg-transparent border-none text-sm text-white placeholder-slate-500 focus:outline-none"
          placeholder="หรือพิมพ์ชื่อมอนสเตอร์ทีมรับ / ทีมบุก (เช่น Seara, Khmun, Morris, Kinki, Tetra, Platy, Leo, Bolverk...)"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setCounterCountLimit(25); }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-slate-400 hover:text-white text-xs px-2"
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

          <div className="space-y-3 max-h-[850px] overflow-y-auto pr-1">
            {filteredDefenses.map((team) => {
              const isSelected = currentDefense && team.id === currentDefense.id;

              return (
                <div
                  key={team.id}
                  onClick={() => { setSelectedDefenseId(team.id); setCounterCountLimit(25); }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-md ${
                    isSelected
                      ? 'bg-[#152030] border-blue-500 shadow-blue-500/15 ring-1 ring-blue-500/50 scale-[1.01]'
                      : 'bg-[#101724] border-[#1d2b3f] hover:border-slate-500 hover:bg-[#131d2c]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded ${
                        team.towerType === 'nat4' 
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                          : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      }`}>
                        {team.towerType === 'nat4' ? 'หอ 4 ดาว' : 'หอ 5 ดาว'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {team.difficulty}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 font-mono">
                        {team.countersCount} สูตรแก้
                      </span>
                    </div>
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
                      <span className="text-[11px] text-blue-400 font-semibold flex items-center justify-end gap-1 mt-1">
                        ดูทีมบุกทั้งหมด <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Counter Strategies */}
        <div className="lg:col-span-7 space-y-4">
          {currentDefense ? (
            <>
              {/* Selected Defense Overview Card */}
              <div className="bg-[#101724] border border-[#1d2b3f] rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1d2b3f] pb-4">
                  <div>
                    <span className="text-xs font-mono font-bold text-blue-400 uppercase">
                      ทีมตั้งรับเป้าหมาย (Active Defense Target)
                    </span>
                    <h2 className="text-xl font-extrabold text-white mt-0.5">
                      {currentDefense.title}
                    </h2>
                    <div className="text-xs text-slate-400 mt-0.5">
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

                {/* Tactical Notice */}
                <div className="p-3 bg-[#0c121c] border border-[#1d2b3f] rounded-xl flex items-start gap-2.5 text-xs text-slate-300">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    สูตรเคาน์เตอร์ด้านล่างรวบรวมในฐานข้อมูล SWM โดยผู้เล่นระดับ Guardian จัดเรียงตามคะแนนความนิยม อัตราการชนะ และความปลอดภัยในการเข้าตี
                  </p>
                </div>
              </div>

              {/* Counter Teams List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                  <span>
                    สูตรบุกแก้ทางที่ผ่านการทดสอบ (แสดง {displayedCounters.length} จาก {currentDefense.countersCount} สูตร)
                  </span>
                  <span className="text-cyan-400 font-mono font-bold">SWM Verified</span>
                </div>

                <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
                  {displayedCounters.map((counter, idx) => (
                    <div
                      key={counter.id}
                      className="bg-[#111824] border border-[#1d2a3d] hover:border-blue-500/60 rounded-2xl p-4 sm:p-5 transition-all space-y-3 shadow-lg"
                    >
                      {/* Counter Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#182333]">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-[#182333] border border-[#23334a] font-mono text-xs font-bold text-slate-300 flex items-center justify-center">
                            #{idx + 1}
                          </span>
                          <div className="flex items-center gap-2">
                            {counter.monsters.map((m, mIdx) => (
                              <MonsterAvatar key={mIdx} monster={m} size="sm" showStars={false} />
                            ))}
                          </div>
                          <div>
                            <h4 className="text-sm font-extrabold text-white truncate max-w-[200px]">
                              {counter.title}
                            </h4>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1">
                              <UserCheck className="w-3 h-3 text-slate-500" />
                              <span>บันทึกโดย: <strong className="text-slate-200">{counter.author}</strong></span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          {/* Rating */}
                          <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-lg">
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            <span className="text-xs font-mono font-bold text-amber-300">{counter.rating.toFixed(1)}</span>
                          </div>

                          {/* Winrate */}
                          <div className="bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-right">
                            <div className="text-[10px] text-emerald-400 font-medium">อัตราชนะ</div>
                            <div className="text-xs font-mono font-bold text-emerald-300">{counter.winRate}</div>
                          </div>
                        </div>
                      </div>

                      {/* Turn Order & Strategy */}
                      <div className="space-y-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-[#0c121c] border border-[#182333] flex items-center gap-2">
                          <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="text-slate-300 font-sans">
                            <strong className="text-cyan-400">ลำดับออกสกิล:</strong> {counter.turnOrder}
                          </span>
                        </div>

                        <div className="text-slate-400 text-[11px] px-1 font-sans">
                          💡 {counter.notes}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Load More Button */}
                {counterCountLimit < currentDefense.countersCount && (
                  <div className="pt-2 text-center">
                    <button
                      onClick={() => setCounterCountLimit(prev => prev + 25)}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-600/20"
                    >
                      โหลดสูตรแก้ทางเพิ่มเติม (+25 สูตร) • เหลืออีก {currentDefense.countersCount - counterCountLimit} สูตร
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-500 bg-[#101724] border border-[#1d2b3f] rounded-2xl">
              ไม่พบทีมตั้งรับที่ตรงกับคำค้นหา
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
