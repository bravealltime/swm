import React, { useState, useMemo } from 'react';
import { 
  Shield, 
  Gift, 
  Trophy, 
  Search, 
  Copy, 
  Check, 
  ExternalLink, 
  ArrowRight, 
  Flame, 
  Zap, 
  Sparkles, 
  TrendingUp, 
  Compass, 
  BookOpen, 
  Calculator, 
  Activity, 
  Swords, 
  Layers, 
  Award,
  ChevronRight,
  RotateCcw,
  X,
  Crosshair
} from 'lucide-react';
import MonsterAvatar from '../components/MonsterAvatar';
import ALL_MDC_DATA from '../data/allMdcData.json';
import { MONSTERS } from '../data/monsters';
import { PROMO_CODES } from '../data/promoCodes';
import { LEADERBOARDS } from '../data/leaderboards';
import latestSiegeBattles from '../data/latestSiegeBattles.json';

const POPULAR_QUICK_TAGS = [
  { label: '🔎 ค้นหาสถิติผู้เล่น', type: 'player-tracker' },
  { label: '⚔️ จำลองดราฟต์ 5v5', type: 'draft-explorer' },
  { label: '👥 ดูโอ้คอมโบ', type: 'rta-synergies' },
  { label: '🏆 สร้าง Tier List', type: 'tier-list-maker' },
  { label: 'Byungchul', type: 'where2use', param: 'Byungchul' },
  { label: 'Juno', type: 'where2use', param: 'Juno' },
  { label: '🎁 โค้ดล่าสุด', type: 'codes' },
  { label: '🏰 คำนวณแต้ม Siege', type: 'siege-calculator' },
];

const POPULAR_PRESETS = [
  { label: 'Seara + Orion + Perna', monsters: ['Seara', 'Orion', 'Perna'] },
  { label: 'Carcano + Savannah + Miles', monsters: ['Carcano', 'Savannah', 'Miles'] },
  { label: 'Khmun + Vigor + Skogul', monsters: ['Khmun', 'Vigor', 'Skogul'] },
  { label: 'Martina + Shaina + Triana', monsters: ['Martina', 'Shaina', 'Triana'] },
  { label: 'Mo Long + Harmonia + Taranys', monsters: ['Mo Long', 'Harmonia', 'Taranys'] },
  { label: 'Nana + Savannah + Perna', monsters: ['Nana', 'Savannah', 'Perna'] },
];

export default function DashboardView({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('defenses'); // 'defenses', 'codes', 'battles', 'ranks'
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);
  const [selectedServer, setSelectedServer] = useState('asia');
  const [battleServer, setBattleServer] = useState('Global');

  // 3-Monster Tactical Interceptor Slots
  const [selectedSlots, setSelectedSlots] = useState(() => [
    MONSTERS.find(m => m.name === 'Seara') || null,
    MONSTERS.find(m => m.name === 'Orion') || null,
    MONSTERS.find(m => m.name === 'Perna') || null,
  ]);
  const [activeSlotIdx, setActiveSlotIdx] = useState(null);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerElement, setPickerElement] = useState('all');

  const handleSlotClick = (slotIdx) => {
    setActiveSlotIdx(activeSlotIdx === slotIdx ? null : slotIdx);
    setPickerSearch('');
  };

  const handleSelectMonster = (monster) => {
    if (activeSlotIdx !== null) {
      const nextSlots = [...selectedSlots];
      nextSlots[activeSlotIdx] = monster;
      setSelectedSlots(nextSlots);

      // Auto advance to next empty slot or close
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
  };

  const handleResetSlots = () => {
    setSelectedSlots([null, null, null]);
    setActiveSlotIdx(null);
    setPickerSearch('');
  };

  const handleApplyPreset = (monsterNames) => {
    const nextSlots = monsterNames.map(name => 
      MONSTERS.find(m => m.name.toLowerCase() === name.toLowerCase()) || null
    );
    setSelectedSlots(nextSlots);
    setActiveSlotIdx(null);
  };

  // Filtered monsters for picker
  const filteredPickerMonsters = useMemo(() => {
    const searchClean = pickerSearch.toLowerCase().trim();
    return MONSTERS.filter(m => {
      if (pickerElement !== 'all' && m.element !== pickerElement) return false;
      if (searchClean) {
        const matchEn = m.name?.toLowerCase().includes(searchClean);
        const matchTh = m.thaiName?.toLowerCase().includes(searchClean);
        const matchFam = m.family?.toLowerCase().includes(searchClean);
        return matchEn || matchTh || matchFam;
      }
      return true;
    }).slice(0, 80);
  }, [pickerElement, pickerSearch]);

  // Match defense team based on selected slots
  const matchedDefense = useMemo(() => {
    const selectedNames = selectedSlots
      .filter(Boolean)
      .map(m => m.name.toLowerCase());

    if (selectedNames.length === 0) {
      return {
        defense: ALL_MDC_DATA[0],
        matchCount: 0,
        totalSelected: 0
      };
    }

    let bestDefense = null;
    let maxMatchCount = 0;

    for (const def of ALL_MDC_DATA) {
      const defNames = def.defenseMonsters.map(m => m.name.toLowerCase());
      let matchCount = 0;
      for (const sName of selectedNames) {
        if (defNames.some(dn => dn === sName || dn.includes(sName) || sName.includes(dn))) {
          matchCount++;
        }
      }

      if (matchCount > maxMatchCount) {
        maxMatchCount = matchCount;
        bestDefense = def;
        if (matchCount === 3 && selectedNames.length === 3) break;
      }
    }

    return {
      defense: bestDefense || ALL_MDC_DATA[0],
      matchCount: maxMatchCount,
      totalSelected: selectedNames.length
    };
  }, [selectedSlots]);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Decode HTML entities
  const cleanGuildName = (name) => {
    if (!name) return '';
    return name
      .replace(/&Lambda;/g, 'Λ')
      .replace(/&atilde;/g, 'ã')
      .replace(/&oslash;/g, 'ø')
      .replace(/&amp;/g, '&')
      .replace(/&#3495;/g, '⍏')
      .replace(/&#24801;/g, '悪')
      .replace(/&#39764;/g, '魔');
  };

  // Group raw guilds into 3-guild matches
  const siegeMatches = useMemo(() => {
    const raw = (latestSiegeBattles[battleServer] && latestSiegeBattles[battleServer][0]?.guilds) || [];
    const groups = [];
    for (let i = 0; i < raw.length; i += 3) {
      groups.push({
        matchId: Math.floor(i / 3) + 1,
        guilds: raw.slice(i, i + 3)
      });
    }
    return groups;
  }, [battleServer]);

  // Top defenses from 3MDC data
  const metaDefenses = ALL_MDC_DATA.slice(0, 8);

  // Leaderboard data
  const topGuilds = LEADERBOARDS[selectedServer]?.slice(0, 5) || [];

  // Universal search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    onNavigate('where2use', { initialMonster: searchQuery.trim() });
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      
      {/* 1. Modern Minimalist Hero Command Section */}
      <div className="bg-gradient-to-br from-[#101927] via-[#0d1422] to-[#0a0f18] border border-[#1b283d] rounded-2xl p-5 sm:p-7 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              SWM Universal Intelligence Platform • v3.0 Clean
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              ศูนย์ข้อมูลยุทธวิธี Summoners War Master
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              แพลตฟอร์มวิเคราะห์ข้อมูลกิลด์วอร์ 3MDC, สถิติ RTA Season 38, สารานุกรมสกิล 940 ตัว, และเครื่องมือคำนวณยุทธวิธีครบวงจร
            </p>
          </div>

          {/* Quick status pill */}
          <div className="hidden lg:flex items-center gap-3 bg-[#080d16] border border-[#1b283d] px-4 py-2.5 rounded-xl self-start md:self-auto shrink-0 shadow-inner">
            <div className="text-right">
              <div className="text-[10px] text-slate-400 font-bold uppercase">ข้อมูลเซิร์ฟเวอร์</div>
              <div className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5 justify-end">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                SYNCED LIVE
              </div>
            </div>
          </div>
        </div>

        {/* Universal Search Box */}
        <form onSubmit={handleSearchSubmit} className="relative pt-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            className="w-full bg-[#080d16] border border-[#1d2b3f] hover:border-cyan-500/60 focus:border-cyan-500 rounded-xl pl-11 pr-24 sm:pr-28 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
            placeholder="ค้นหาทีมแก้ทาง 3MDC, มอนสเตอร์ (เช่น Byungchul, Juno), ดันเจี้ยน, โค้ด..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-blue-600/30"
          >
            ค้นหา
          </button>
        </form>

        {/* Quick Suggestion Tags */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs pt-1">
          <span className="text-slate-500 font-bold mr-1 hidden sm:inline">ลัดสู่เป้าหมาย:</span>
          {POPULAR_QUICK_TAGS.map((tag, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (tag.type === 'where2use') {
                  onNavigate('where2use', { initialMonster: tag.param });
                } else {
                  onNavigate(tag.type);
                }
              }}
              className="px-2.5 py-1 rounded-lg bg-[#080d16] hover:bg-[#152030] text-slate-300 hover:text-white border border-[#1b283d] text-[11px] font-bold transition-colors cursor-pointer"
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. 3MDC Tactical Interceptor (เลือก 3 มอนสเตอร์ตั้งรับ - Feature หลัก) */}
      <div className="bg-gradient-to-b from-[#0f1828] via-[#0c1320] to-[#090e17] border border-[#1d2d44] rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4">
        
        {/* Interceptor Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#1b2a40] gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0 shadow-inner">
              <Crosshair className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  3MDC Tactical Interceptor (เลือกมอนสเตอร์ 3 ตัว)
                </h2>
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
              </div>
              <p className="text-xs text-slate-400">
                เลือกมอนสเตอร์ 3 ตัวในหอคอย Siege ของศัตรู เพื่อค้นหาสูตรทีมบุกเคาน์เตอร์และ Win Rate สูงสุดทันที
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleResetSlots}
              className="px-2.5 py-1.5 rounded-lg bg-[#141e2e] hover:bg-[#1c2b42] text-slate-300 hover:text-white border border-[#243752] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="ล้างข้อมูลทั้ง 3 ช่อง"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ล้าง 3 ช่อง</span>
            </button>
            <button
              onClick={() => {
                const searchParam = selectedSlots.filter(Boolean).map(m => m.name).join(' ');
                onNavigate('3mdc', { search: searchParam });
              }}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-md shadow-blue-600/30"
            >
              <span>เปิด 3MDC เต็มระบบ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Presets Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs text-slate-400">
          <span className="font-bold text-slate-300 shrink-0 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            ทีมยอดนิยม:
          </span>
          {POPULAR_PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleApplyPreset(p.monsters)}
              className="px-2.5 py-1 rounded-lg bg-[#101927] hover:bg-blue-950/60 hover:border-blue-500/50 text-slate-300 hover:text-white border border-[#1b2a40] text-[11px] font-medium whitespace-nowrap transition-all cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* 3 Interactive Monster Slots */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {[0, 1, 2].map((slotIdx) => {
            const monster = selectedSlots[slotIdx];
            const isActive = activeSlotIdx === slotIdx;
            return (
              <div
                key={slotIdx}
                onClick={() => handleSlotClick(slotIdx)}
                className={`relative rounded-xl border-2 transition-all p-2.5 sm:p-4 text-center cursor-pointer flex flex-col items-center justify-center min-h-[135px] sm:min-h-[155px] select-none ${
                  isActive
                    ? 'border-cyan-400 bg-cyan-950/30 ring-2 ring-cyan-500/30 shadow-lg shadow-cyan-500/20'
                    : monster
                    ? 'border-[#263a56] bg-[#0c1422] hover:border-blue-400/80 shadow-md'
                    : 'border-dashed border-[#20314a] bg-[#080d16] hover:border-cyan-500/50 hover:bg-[#0c1320]'
                }`}
              >
                {/* Slot role badge */}
                <div className="absolute top-2 left-2">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                    slotIdx === 0 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                      : 'bg-slate-800/80 text-slate-400 border border-slate-700'
                  }`}>
                    {slotIdx === 0 ? '👑 Leader' : `Slot #${slotIdx + 1}`}
                  </span>
                </div>

                {monster ? (
                  <>
                    <button
                      onClick={(e) => handleClearSlot(slotIdx, e)}
                      className="absolute top-2 right-2 w-5 h-5 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white flex items-center justify-center text-[10px] font-bold shadow-md z-10 transition-transform hover:scale-110 cursor-pointer"
                      title="ลบมอนสเตอร์นี้"
                    >
                      ✕
                    </button>
                    <div className="mt-4 mb-1.5 flex flex-col items-center">
                      <MonsterAvatar monster={monster} size="md" showStars={false} />
                    </div>
                    <div className="font-bold text-white text-xs sm:text-sm truncate w-full px-1">
                      {monster.name}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate w-full">
                      {monster.thaiName || monster.family || monster.element}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-1.5 py-4 text-slate-500 hover:text-slate-300 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-[#131d2e] border border-[#243752] flex items-center justify-center text-lg font-light text-cyan-400">
                      +
                    </div>
                    <span className="text-xs font-bold text-slate-300">
                      {slotIdx === 0 ? 'เลือก Leader' : `เลือกตัวที่ ${slotIdx + 1}`}
                    </span>
                    <span className="text-[10px] text-slate-500 hidden sm:inline">คลิกเพื่อเลือก</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Monster Selection Drawer (Active when a slot is clicked) */}
        {activeSlotIdx !== null && (
          <div className="p-3.5 sm:p-5 rounded-xl bg-[#080d16] border border-cyan-500/50 space-y-3 shadow-2xl animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#1b283d]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-cyan-400">
                  เลือกมอนสเตอร์ใส่ตำแหน่งที่ #{activeSlotIdx + 1} ({activeSlotIdx === 0 ? '👑 Leader' : `สมาชิก ${activeSlotIdx + 1}`}):
                </span>
                <span className="text-[11px] text-slate-400">
                  (แสดง {filteredPickerMonsters.length} ตัว)
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Element filters */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                  {[
                    { id: 'all', label: 'ทั้งหมด' },
                    { id: 'fire', label: '🔥 ไฟ' },
                    { id: 'water', label: '💧 น้ำ' },
                    { id: 'wind', label: '🌪️ ลม' },
                    { id: 'light', label: '✨ แสง' },
                    { id: 'dark', label: '🌑 มืด' }
                  ].map((el) => (
                    <button
                      key={el.id}
                      onClick={() => setPickerElement(el.id)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                        pickerElement === el.id
                          ? 'bg-cyan-600 text-white shadow-sm'
                          : 'bg-[#121c2c] text-slate-400 hover:text-white'
                      }`}
                    >
                      {el.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setActiveSlotIdx(null)}
                  className="text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded hover:bg-[#1a2538] cursor-pointer"
                >
                  ✕ ปิด
                </button>
              </div>
            </div>

            {/* Instant Search in Picker */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                placeholder="พิมพ์ค้นหาชื่อมอนสเตอร์ (เช่น Byungchul, Nana, Juno, Savannah, Carcano, Camilla)..."
                className="w-full bg-[#0c1422] border border-[#203148] focus:border-cyan-400 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                autoFocus
              />
            </div>

            {/* Monsters Catalog Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 max-h-56 overflow-y-auto pr-1">
              {filteredPickerMonsters.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleSelectMonster(m)}
                  className="p-1.5 rounded-lg bg-[#0e1624] hover:bg-cyan-950/40 border border-[#1b283d] hover:border-cyan-400 transition-all flex flex-col items-center gap-1 cursor-pointer group"
                >
                  <img
                    src={m.avatarUrl || m.imageUrl}
                    alt={m.name}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded object-cover group-hover:scale-105 transition-transform"
                    onError={(e) => { e.target.src = 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0001_0_0.png'; }}
                  />
                  <span className="text-[10px] text-slate-300 group-hover:text-cyan-300 truncate w-full text-center font-medium">
                    {m.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Live Counter Team Analysis Results */}
        {matchedDefense && (
          <div className="p-4 sm:p-5 rounded-xl bg-[#09101c] border border-[#1c2c43] space-y-3.5 shadow-inner">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                  ผลการวิเคราะห์ทีมแก้ทาง (Tactical Match Analysis)
                </span>
                {matchedDefense.totalSelected > 0 && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    matchedDefense.matchCount === 3 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {matchedDefense.matchCount === 3 ? '✓ ตรง 100% (3/3 ตัว)' : `ตรง ${matchedDefense.matchCount}/3 ตัว`}
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-400">
                ทีมตั้งรับเป้าหมาย: <strong className="text-white">{matchedDefense.defense.title}</strong>
              </div>
            </div>

            {/* Top Counter Card */}
            {matchedDefense.defense.counters && matchedDefense.defense.counters.length > 0 ? (
              <div className="p-3.5 sm:p-4 rounded-xl bg-[#0d1626] border border-[#1f314c] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#18263a]">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold text-white">สูตรบุกอันดับ #1:</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm">
                      WIN RATE {matchedDefense.defense.counters[0].winRate || '96.5%'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>โดย: <strong className="text-slate-200">{matchedDefense.defense.counters[0].author || 'Top Meta'}</strong></span>
                    {matchedDefense.defense.counters[0].rating && (
                      <span className="text-amber-400 font-bold">⭐ {matchedDefense.defense.counters[0].rating}/5.0</span>
                    )}
                  </div>
                </div>

                {/* 3 Counter Monsters */}
                <div className="flex items-center gap-3 py-1">
                  {matchedDefense.defense.counters[0].monsters?.map((cm, cmIdx) => (
                    <div key={cmIdx} className="flex items-center gap-2 bg-[#080d16] p-2 rounded-lg border border-[#1b283d]">
                      <MonsterAvatar monster={cm} size="sm" showStars={false} />
                      <div className="hidden sm:block">
                        <div className="text-xs font-bold text-white leading-none">{cm.name}</div>
                        <div className="text-[10px] text-slate-400 capitalize">{cm.element}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Turn order and Strategy notes */}
                {matchedDefense.defense.counters[0].turnOrder && (
                  <div className="text-xs text-cyan-300 font-mono bg-cyan-950/30 p-2 rounded border border-cyan-500/20">
                    <strong>ลำดับสกิล:</strong> {matchedDefense.defense.counters[0].turnOrder}
                  </div>
                )}

                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {matchedDefense.defense.counters[0].notes || matchedDefense.defense.counters[0].strategy || 'ใช้สปีดและดาเมจสวนกลับเป้าหมายตัวบางก่อนเพื่อตัดตัวปัญหาในเทิร์นแรก'}
                </p>

                {/* Bottom link to 3MDC */}
                <div className="pt-2 border-t border-[#18263a] flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    สูตรที่มีในระบบ: <strong className="text-blue-400">{matchedDefense.defense.countersCount || matchedDefense.defense.counters.length} สูตร</strong>
                  </span>
                  <button
                    onClick={() => onNavigate('3mdc', { search: matchedDefense.defense.title })}
                    className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                  >
                    ดูสูตรเคาน์เตอร์ทั้งหมดใน 3MDC <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-slate-400">
                เลือกมอนสเตอร์อย่างน้อย 1 ตัวเพื่อดูผลการวิเคราะห์
              </div>
            )}
          </div>
        )}

      </div>

      {/* 3. Bento Grid Hubs (4 Clean Columns on Desktop, 2 on Tablet, 1 on Mobile) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Hub 1: 3MDC & Siege */}
        <div 
          onClick={() => onNavigate('3mdc')}
          className="p-5 rounded-2xl bg-[#0f1726] border border-[#1b283d] hover:border-blue-500/60 transition-all cursor-pointer group shadow-lg flex flex-col justify-between space-y-4"
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Shield className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              1,253 สูตร
            </span>
          </div>

          <div>
            <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
              กิลด์วอร์ & 3MDC
            </h3>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
              ค้นหาทีมแก้ทาง 3v3, มอนสเตอร์ยอดนิยม 96 ทีม และเครื่องคำนวณแต้ม Siege
            </p>
          </div>

          <div className="flex items-center justify-between text-xs font-bold text-blue-400 pt-2 border-t border-[#182335]">
            <span>เปิดระบบ 3MDC</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Hub 2: RTA S38 Meta */}
        <div 
          onClick={() => onNavigate('rta')}
          className="p-5 rounded-2xl bg-[#0f1726] border border-[#1b283d] hover:border-amber-500/60 transition-all cursor-pointer group shadow-lg flex flex-col justify-between space-y-4"
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              6.8M แมตช์
            </span>
          </div>

          <div>
            <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
              RTA World Arena S38
            </h3>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
              Tier List เมต้าซีซั่น 38, สถิติ Pick/Win/Ban 300 ตัว และรีเพลย์การ์เดียน
            </p>
          </div>

          <div className="flex items-center justify-between text-xs font-bold text-amber-400 pt-2 border-t border-[#182335]">
            <span>ดูอันดับ RTA</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Hub 3: Abyss Dungeons & Guides */}
        <div 
          onClick={() => onNavigate('dungeons')}
          className="p-5 rounded-2xl bg-[#0f1726] border border-[#1b283d] hover:border-purple-500/60 transition-all cursor-pointer group shadow-lg flex flex-col justify-between space-y-4"
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Compass className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
              10 ดันเจี้ยน
            </span>
          </div>

          <div>
            <h3 className="text-base font-bold text-white group-hover:text-purple-400 transition-colors">
              ทีมฟาร์ม Abyss Hard
            </h3>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
              สถิติทีมฟาร์มเร็วสุด 00:24 วินาที, ไครอส และมิติลี้ลับ 2A ครบวงจร
            </p>
          </div>

          <div className="flex items-center justify-between text-xs font-bold text-purple-400 pt-2 border-t border-[#182335]">
            <span>ดูทีมสปีดรัน</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Hub 4: Combat Optimizers */}
        <div 
          onClick={() => onNavigate('artifact')}
          className="p-5 rounded-2xl bg-[#0f1726] border border-[#1b283d] hover:border-cyan-500/60 transition-all cursor-pointer group shadow-lg flex flex-col justify-between space-y-4"
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              เครื่องมือ
            </span>
          </div>

          <div>
            <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">
              คำนวณสปีด & อาร์ติแฟกต์
            </h3>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
              จูนความเร็วป้องกันศัตรูแทรกเทิร์น และค้นหามอนสเตอร์ตามออปชั่นอาร์ติแฟกต์
            </p>
          </div>

          <div className="flex items-center justify-between text-xs font-bold text-cyan-400 pt-2 border-t border-[#182335]">
            <span>เข้าสู่เครื่องมือ</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

      </div>

      {/* 3. Dynamic Tabbed Data Panel (Clean, Compact, No Clutter!) */}
      <div className="bg-[#0f1726] border border-[#1b283d] rounded-2xl shadow-xl overflow-hidden">
        
        {/* Navigation Tabs Bar */}
        <div className="flex items-center justify-between border-b border-[#1b283d] bg-[#0c131f] p-2 sm:p-2.5 overflow-x-auto gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setActiveTab('defenses')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'defenses'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-[#162132]'
              }`}
            >
              <Shield className="w-4 h-4 text-blue-400" />
              <span>ทีมตั้งรับยอดนิยม 3MDC</span>
            </button>

            <button
              onClick={() => setActiveTab('codes')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'codes'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-[#162132]'
              }`}
            >
              <Gift className="w-4 h-4 text-emerald-400" />
              <span>โค้ดแจกไอเทม (5 โค้ด)</span>
            </button>

            <button
              onClick={() => setActiveTab('battles')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'battles'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-[#162132]'
              }`}
            >
              <Swords className="w-4 h-4 text-rose-400" />
              <span>ศึก Siege สดเรียลไทม์</span>
            </button>

            <button
              onClick={() => setActiveTab('ranks')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'ranks'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-[#162132]'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>อันดับกิลด์ท็อปเซิร์ฟ</span>
            </button>
          </div>

          <div className="hidden sm:block text-right pr-2">
            <span className="text-[11px] text-slate-400 font-mono">
              SWGT Data Engine
            </span>
          </div>
        </div>

        {/* Tab 1 Content: Meta Defenses */}
        {activeTab === 'defenses' && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">8 ทีมตั้งรับยอดนิยมล่าสุดใน Siege & Guild War</h3>
                <p className="text-xs text-slate-400 mt-0.5">กดที่ทีมใดก็ได้เพื่อดูสูตรทีมบุกเคาน์เตอร์และอัตราการชนะทันที</p>
              </div>
              <button
                onClick={() => onNavigate('3mdc')}
                className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer shrink-0"
              >
                ดูทั้งหมด 1,253 สูตร <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {metaDefenses.map((def) => (
                <div
                  key={def.id}
                  onClick={() => onNavigate('3mdc', { search: def.title })}
                  className="p-3.5 rounded-xl bg-[#0a0f18] border border-[#1b283d] hover:border-blue-500/60 transition-all cursor-pointer flex flex-col justify-between space-y-3 group shadow-md"
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                      {def.title}
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 shrink-0">
                      WR {def.winRate}%
                    </span>
                  </div>

                  <div className="flex items-center gap-2 bg-[#0e1624] p-2 rounded-lg border border-[#172233]">
                    {def.defenseMonsters.map((m, mIdx) => (
                      <div key={mIdx} className="flex items-center gap-1">
                        <MonsterAvatar monster={m} size="sm" />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-[#172233]">
                    <span>{def.totalBattles} แมตช์</span>
                    <span className="text-blue-400 group-hover:underline">ดูทีมแก้ →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2 Content: Promo Codes */}
        {activeTab === 'codes' && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">รหัสโค้ดแจกไอเทมเกม (Active Promo Codes)</h3>
                <p className="text-xs text-slate-400 mt-0.5">กด Copy เพื่อคัดลอกโค้ด หรือกด Claim เพื่อเปิดหน้า WithHive เคลมของรางวัลทันที</p>
              </div>
              <button
                onClick={() => onNavigate('codes')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer shrink-0"
              >
                เปิดหน้ารวมโค้ด <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {PROMO_CODES.map((item) => (
                <div
                  key={item.code}
                  className="p-4 rounded-xl bg-[#0a0f18] border border-[#1b283d] flex flex-col justify-between space-y-3 shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-mono font-black text-emerald-400 tracking-wider">
                        {item.code}
                      </div>
                      <div className="text-xs text-slate-300 mt-1 font-medium">
                        {item.rewards.map(r => `${r.name} x${r.count}`).join(', ')}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                      ใช้ได้จริง
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-[#172233]">
                    <button
                      onClick={() => handleCopy(item.code)}
                      className="flex-1 py-1.5 rounded-lg bg-[#111927] hover:bg-[#1a2538] border border-[#1b283d] text-xs font-bold text-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {copiedCode === item.code ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">คัดลอกแล้ว!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>คัดลอกโค้ด</span>
                        </>
                      )}
                    </button>

                    <a
                      href={`https://event.withhive.com/ci/smon/evt_coupon`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>เคลมของ</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3 Content: Live Siege Battles Feed */}
        {activeTab === 'battles' && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Swords className="w-4 h-4 text-rose-400" />
                  ผลการแข่งขัน Siege Battle แบบเรียลไทม์ (Live Match Feed)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  ฟีดคะแนนสดส่งตรงจากเซิร์ฟเวอร์ SWGT อัปเดตอันดับ แต้ม และสปีดคะแนนต่อนาที
                </p>
              </div>

              {/* Server selector */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0a0f18] border border-[#1b283d] self-start sm:self-auto">
                {[
                  { id: 'Global', label: 'Global 🌐' },
                  { id: 'Asia', label: 'Asia 🌏' },
                  { id: 'Europe', label: 'Europe 🇪🇺' },
                  { id: 'JPKR', label: 'JP/KR 🇯🇵' }
                ].map((srv) => (
                  <button
                    key={srv.id}
                    onClick={() => setBattleServer(srv.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      battleServer === srv.id
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-[#152030]'
                    }`}
                  >
                    {srv.label}
                  </button>
                ))}
              </div>
            </div>

            {siegeMatches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {siegeMatches.map((match) => (
                  <div
                    key={match.matchId}
                    className="p-4 rounded-xl bg-[#0a0f18] border border-[#1b283d] hover:border-rose-500/40 transition-all space-y-3 shadow-md"
                  >
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-[#172233]">
                      <span className="font-bold text-slate-300 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                        กลุ่มการรบ #{match.matchId} ({battleServer})
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        ● LIVE FEED
                      </span>
                    </div>

                    <div className="space-y-2">
                      {match.guilds.map((g, gIdx) => {
                        const isWinner = g.score === '20,000';
                        return (
                          <div 
                            key={gIdx} 
                            className={`p-2.5 rounded-lg flex items-center justify-between text-xs transition-colors ${
                              isWinner 
                                ? 'bg-amber-500/10 border border-amber-500/30' 
                                : 'bg-[#0e1624] border border-[#172233]'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate pr-2">
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 ${
                                gIdx === 0 
                                  ? 'bg-amber-500 text-slate-950 font-black' 
                                  : gIdx === 1 
                                  ? 'bg-slate-300 text-slate-900 font-black' 
                                  : 'bg-amber-800 text-amber-100 font-bold'
                              }`}>
                                #{gIdx + 1}
                              </span>
                              <span className="font-bold text-white truncate">
                                {cleanGuildName(g.name)}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                ({g.rank})
                              </span>
                            </div>

                            <div className="text-right shrink-0">
                              <div className="font-mono font-black text-white text-xs">
                                {g.score} แต้ม
                                {isWinner && <span className="ml-1 text-amber-400">👑</span>}
                              </div>
                              <div className="text-[10px] text-cyan-400 font-mono">
                                {g.speed}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-2 border-t border-[#172233] flex items-center justify-between text-[11px] text-slate-400">
                      <span>สถานะ: <strong className="text-emerald-400">จบการแข่งขัน (20,000 แต้ม)</strong></span>
                      <button
                        onClick={() => onNavigate('siege-calculator')}
                        className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        คำนวณแต้มต่อ <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                ไม่มีข้อมูลการแข่งขันสดในขณะนี้
              </div>
            )}
          </div>
        )}

        {/* Tab 4 Content: Leaderboards */}
        {activeTab === 'ranks' && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white">ตารางจัดอันดับกิลด์ชั้นนำระดับโลก</h3>
                <p className="text-xs text-slate-400 mt-0.5">อันดับกิลด์ท็อปเซิร์ฟเวอร์ พร้อมคะแนนซีซั่นและอัตราการชนะ</p>
              </div>

              {/* Server selector */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0a0f18] border border-[#1b283d] self-start sm:self-auto">
                {[
                  { id: 'asia', name: 'Asia 🌏' },
                  { id: 'global', name: 'Global 🌐' },
                  { id: 'europe', name: 'Europe 🇪🇺' },
                  { id: 'japanKorea', name: 'JP/KR 🇯🇵' }
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedServer(s.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedServer === s.id
                        ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#1b283d]">
              <table className="w-full text-left border-collapse bg-[#0a0f18] text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-[#1b283d] bg-[#070c14] text-xs font-bold text-slate-400 uppercase">
                    <th className="py-3 px-4 text-center w-16">อันดับ</th>
                    <th className="py-3 px-4">ชื่อกิลด์</th>
                    <th className="py-3 px-4 text-center">ระดับแรงก์</th>
                    <th className="py-3 px-4 text-center">ชนะ - แพ้</th>
                    <th className="py-3 px-4 text-center">อัตราการชนะ</th>
                    <th className="py-3 px-4 text-right">คะแนนซีซัน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#172233]">
                  {topGuilds.map((guild) => (
                    <tr key={guild.rank} className="hover:bg-[#0f1726] transition-colors">
                      <td className="py-3.5 px-4 text-center font-mono font-bold">
                        {guild.rank === 1 ? (
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-extrabold border border-amber-500/40">
                            👑 #1
                          </span>
                        ) : guild.rank === 2 ? (
                          <span className="px-2 py-0.5 rounded bg-slate-300/20 text-slate-200 font-extrabold border border-slate-400/40">
                            🥈 #2
                          </span>
                        ) : guild.rank === 3 ? (
                          <span className="px-2 py-0.5 rounded bg-amber-700/20 text-amber-400 font-extrabold border border-amber-700/40">
                            🥉 #3
                          </span>
                        ) : (
                          <span className="text-slate-400">#{guild.rank}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-white">
                        <span className="mr-2">{guild.flag}</span>
                        {guild.name}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          {guild.rankTier}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-300">
                        {guild.winLoss}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-400">
                        {guild.winRate}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-amber-400">
                        {guild.score.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-right">
              <button
                onClick={() => onNavigate('leaderboards')}
                className="text-xs text-amber-400 hover:text-amber-300 font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                ดูตารางจัดอันดับครบ 4 โหมด (WGB, Labyrinth, Subjugation) <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
