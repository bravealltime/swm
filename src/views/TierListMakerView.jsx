import React, { useState, useMemo } from 'react';
import { buildUrl } from '../router';
import { 
  Trophy, 
  RotateCcw, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Download, 
  Copy, 
  Check, 
  Search, 
  Sparkles,
  Layers,
  Palette,
  Eye
} from 'lucide-react';
import MonsterAvatar from '../components/MonsterAvatar';
import { MONSTERS } from '../data/monsters';
import { 
  getDynamicRtaTiers, 
  getDynamicSiegeTiers, 
  getDynamicPveTiers 
} from '../utils/tierListData';

const DEFAULT_TIERS = [
  { id: 't-s-plus', label: 'S+ (God Tier)', color: 'bg-red-600', borderColor: 'border-red-600', monsters: ['Oliver', 'Cheongpung', 'Moore', 'Byungchul', 'Sonia'] },
  { id: 't-s', label: 'S (Top Meta)', color: 'bg-orange-500', borderColor: 'border-orange-500', monsters: ['Chandra', 'Sagar', 'Velajuel', 'Camilla', 'Ethna', 'Vanessa'] },
  { id: 't-a', label: 'A (Very Strong)', color: 'bg-amber-500', borderColor: 'border-amber-500', monsters: ['Adriana', 'Haeyang', 'Miles', 'Robo', 'Sekhmet', 'Juno'] },
  { id: 't-b', label: 'B (Viable)', color: 'bg-emerald-600', borderColor: 'border-emerald-600', monsters: ['Shizuka', 'Tomoe', 'Woosa', 'Riley', 'Kaki', 'Leo'] },
  { id: 't-c', label: 'C (Situational)', color: 'bg-cyan-600', borderColor: 'border-cyan-600', monsters: ['Lushen', 'Perna', 'Theomars', 'Mo Long', 'Harmonia'] }
];

export default function TierListMakerView() {
  const [metaMode, setMetaMode] = useState('rta'); // 'rta' | 'siege' | 'pve' | 'custom'
  const [customTiers, setCustomTiers] = useState(DEFAULT_TIERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [elementFilter, setElementFilter] = useState('all');
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedTargetTier, setSelectedTargetTier] = useState(DEFAULT_TIERS[0]?.id);

  // Dynamic tiers depending on mode
  const tiers = useMemo(() => {
    if (metaMode === 'rta') return getDynamicRtaTiers();
    if (metaMode === 'siege') return getDynamicSiegeTiers();
    if (metaMode === 'pve') return getDynamicPveTiers();
    return customTiers;
  }, [metaMode, customTiers]);

  // Helper to find monster object
  const getMonsterObj = (item) => {
    const name = typeof item === 'string' ? item : item.name;
    const cat = MONSTERS.find(m => m.name.toLowerCase() === name.toLowerCase()) || {};
    return {
      name,
      thaiName: cat.thaiName || name,
      avatarUrl: cat.avatarUrl || cat.imageUrl || (typeof item === 'object' ? item.avatarUrl : null) || 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0001_0_0.png',
      element: cat.element || (typeof item === 'object' ? item.element : 'wind'),
      stars: cat.stars || 5,
      metaExtra: typeof item === 'object' ? (item.winRate ? `ชนะ ${item.winRate}` : item.role || (item.cntCount ? `3MDC: ${item.cntCount}` : '')) : null,
    };
  };

  // Filter available monsters pool
  const availableMonsters = useMemo(() => {
    // Collect all placed monsters
    const placed = new Set(tiers.flatMap(t => t.monsters.map(n => n.toLowerCase())));

    return MONSTERS.filter(m => {
      if (placed.has(m.name.toLowerCase())) return false; // hide already placed
      if (elementFilter !== 'all' && m.element !== elementFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchEn = m.name?.toLowerCase().includes(q);
        const matchTh = m.thaiName?.toLowerCase().includes(q);
        return matchEn || matchTh;
      }
      return true;
    }).slice(0, 80);
  }, [tiers, elementFilter, searchQuery]);

  // Add monster to tier
  const handleAddMonsterToTier = (tierId, monsterName) => {
    setTiers(prev => prev.map(t => {
      if (t.id === tierId) {
        if (t.monsters.includes(monsterName)) return t;
        return { ...t, monsters: [...t.monsters, monsterName] };
      }
      return t;
    }));
  };

  // Remove monster from tier
  const handleRemoveMonster = (tierId, monsterName) => {
    setTiers(prev => prev.map(t => {
      if (t.id === tierId) {
        return { ...t, monsters: t.monsters.filter(m => m !== monsterName) };
      }
      return t;
    }));
  };

  // Move tier up
  const handleMoveTierUp = (index) => {
    if (index === 0) return;
    const next = [...tiers];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    setTiers(next);
  };

  // Move tier down
  const handleMoveTierDown = (index) => {
    if (index === tiers.length - 1) return;
    const next = [...tiers];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    setTiers(next);
  };

  // Add new tier
  const handleAddNewTier = () => {
    const newTier = {
      id: `t-custom-${Date.now()}`,
      label: 'New Tier',
      color: 'bg-purple-600',
      borderColor: 'border-purple-600',
      monsters: []
    };
    setTiers([...tiers, newTier]);
  };

  // Delete tier
  const handleDeleteTier = (tierId) => {
    if (tiers.length <= 1) return;
    setTiers(tiers.filter(t => t.id !== tierId));
  };

  // Clear all monsters in a tier
  const handleClearTier = (tierId) => {
    setTiers(tiers.map(t => t.id === tierId ? { ...t, monsters: [] } : t));
  };

  // Reset to default
  const handleResetToDefault = () => {
    setTiers(DEFAULT_TIERS);
  };

  // Copy share link
  const handleCopyShare = () => {
    setCopiedLink(true);
    navigator.clipboard.writeText(window.location.origin + buildUrl('tier-list-maker'));
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-br from-[#101a2d] via-[#0d1422] to-[#090e18] border border-[#1b2a40] rounded-2xl p-5 sm:p-7 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-wider mb-1">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>SWM Tools • Inspired by Lucksack Tier List Maker</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              สร้าง Tier List มอนสเตอร์ของคุณเอง (Tier List Maker)
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              จัดอันดับมอนสเตอร์ตามความคิดเห็นหรือเมต้าส่วนตัว รองรับการแก้ไขชื่อแถว ย้ายระดับ ปรับแต่งสี และดาวน์โหลด/แชร์ให้กับเพื่อนในกิลด์
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleAddNewTier}
              className="px-3 py-2 rounded-xl bg-[#141e2e] hover:bg-[#1b283d] text-slate-200 border border-[#22334a] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span>เพิ่มแถว Tier</span>
            </button>
            <button
              onClick={handleResetToDefault}
              className="px-3 py-2 rounded-xl bg-[#141e2e] hover:bg-[#1b283d] text-slate-200 border border-[#22334a] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>โหลดแม่แบบเริ่มต้น</span>
            </button>
            <button
              onClick={handleCopyShare}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'คัดลอกแล้ว!' : 'แชร์ Tier List'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Mode Selector Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#0c1320] border border-white/[0.08] overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setMetaMode('rta')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
            metaMode === 'rta'
              ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-300" />
          <span>🏆 RTA Guardian Meta (คำนวณสด 3,000+ รีเพลย์)</span>
        </button>

        <button
          onClick={() => setMetaMode('siege')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
            metaMode === 'siege'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Layers className="w-4 h-4 text-yellow-300" />
          <span>🏰 Siege Battle Meta (ฐานข้อมูล 3MDC)</span>
        </button>

        <button
          onClick={() => setMetaMode('pve')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
            metaMode === 'pve'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Sparkles className="w-4 h-4 text-cyan-300" />
          <span>🐲 PVE Abyss Speed MVP (ฟาร์มไวสุด)</span>
        </button>

        <button
          onClick={() => setMetaMode('custom')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
            metaMode === 'custom'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Palette className="w-4 h-4 text-purple-300" />
          <span>🎨 โหมดสร้างเอง (Custom Maker)</span>
        </button>
      </div>

      {/* 3. Interactive Tier Rows Board */}
      <div className="bg-[#0c1320] border border-[#1b2b42] rounded-2xl p-4 sm:p-6 shadow-2xl space-y-3">
        {tiers.map((tier, tIdx) => (
          <div
            key={tier.id}
            className="flex flex-col sm:flex-row items-stretch rounded-xl overflow-hidden border border-[#1b2b40] bg-[#080d16] group"
          >
            {/* Tier Label Box (Left Side) */}
            <div className={`w-full sm:w-44 sm:min-w-[176px] ${tier.color} p-3 sm:p-4 flex items-center justify-between sm:justify-center text-center text-white font-black text-xs sm:text-sm tracking-wide shadow-md`}>
              <input
                type="text"
                value={tier.label}
                disabled={metaMode !== 'custom'}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomTiers(prev => prev.map(t => t.id === tier.id ? { ...t, label: val } : t));
                }}
                className={`bg-transparent text-center text-white font-black focus:outline-none w-full ${metaMode === 'custom' ? 'cursor-text' : 'cursor-default'}`}
              />

              {/* Mobile controls */}
              {metaMode === 'custom' && (
                <div className="flex sm:hidden items-center gap-1">
                  <button 
                    onClick={() => handleMoveTierUp(tIdx)}
                    className="p-1 rounded bg-black/20 text-white hover:bg-black/40"
                    disabled={tIdx === 0}
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => handleMoveTierDown(tIdx)}
                    className="p-1 rounded bg-black/20 text-white hover:bg-black/40"
                    disabled={tIdx === tiers.length - 1}
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Tier Monsters Content (Right Side) */}
            <div className="flex-1 p-3 flex flex-wrap items-center gap-2.5 min-h-[76px] bg-[#0a0f19]">
              {tier.monsters.length > 0 ? (
                tier.monsters.map((name, mIdx) => {
                  const monster = getMonsterObj(name);
                  return (
                    <div 
                      key={mIdx}
                      className="relative group/m cursor-pointer flex flex-col items-center"
                      onClick={() => metaMode === 'custom' && handleRemoveMonster(tier.id, name)}
                      title={monster.metaExtra ? `${monster.name} • ${monster.metaExtra}` : monster.name}
                    >
                      <MonsterAvatar monster={monster} size="sm" showStars={false} />
                      {monster.metaExtra ? (
                        <span className="text-[9px] font-mono text-slate-300 truncate max-w-[50px] mt-0.5">
                          {monster.metaExtra}
                        </span>
                      ) : (
                        <span className="text-[9px] font-semibold text-slate-300 truncate max-w-[50px] mt-0.5">
                          {monster.name}
                        </span>
                      )}
                      {metaMode === 'custom' && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold opacity-0 group-hover/m:opacity-100 transition-opacity">
                          ✕
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-slate-400 italic pl-2">
                  (ยังไม่มีมอนสเตอร์ในระดับนี้ - คลิกเลือกจากคลังด้านล่าง)
                </div>
              )}
            </div>

            {/* Desktop Row Controls */}
            {metaMode === 'custom' && (
              <div className="hidden sm:flex items-center gap-1 px-3 bg-[#080d16] border-t sm:border-t-0 sm:border-l border-[#1b2b40]">
                <button
                  onClick={() => handleMoveTierUp(tIdx)}
                  disabled={tIdx === 0}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#152030] disabled:opacity-30 cursor-pointer"
                  title="ย้ายขึ้น"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleMoveTierDown(tIdx)}
                  disabled={tIdx === tiers.length - 1}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#152030] disabled:opacity-30 cursor-pointer"
                  title="ย้ายลง"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleClearTier(tier.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-[#152030] cursor-pointer"
                  title="ล้างมอนสเตอร์ในแถวนี้"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteTier(tier.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-[#152030] cursor-pointer"
                  title="ลบแถวนี้"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 4. Monster Pool (Custom mode) OR Meta Info Banner (Live modes) */}
      {metaMode !== 'custom' ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/40 border border-blue-500/20 text-xs sm:text-sm text-slate-300 leading-relaxed shadow-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold text-white">ตารางจัดอันดับคำนวณสดจากฐานข้อมูล:</span> ข้อมูลนี้ถูกอัปเดตอัตโนมัติจากแมตช์จริง Guardian G1-G3, สถิติ 3MDC, และ PVE Abyss Hard หากต้องการจัดอันดับและลากวางด้วยตัวเอง สามารถกดเลือกแท็บ <strong className="text-purple-300">"🎨 โหมดสร้างเอง (Custom Maker)"</strong> ด้านบนได้ทันที
            </div>
          </div>
        </div>
      ) : (
      <div className="bg-[#0c1320] border border-[#1b2b42] rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#182638]">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-white">
              คลังมอนสเตอร์ (คลิกเพื่อเพิ่มใส่ Tier):
            </span>
            <select
              value={selectedTargetTier}
              onChange={(e) => setSelectedTargetTier(e.target.value)}
              className="bg-[#080d16] border border-[#243752] text-xs font-bold text-cyan-400 rounded-lg px-2.5 py-1"
            >
              {tiers.map(t => (
                <option key={t.id} value={t.id}>
                  ใส่ใน {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            {/* Element Filter */}
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
                  onClick={() => setElementFilter(el.id)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    elementFilter === el.id
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'bg-[#121c2c] text-slate-400 hover:text-white'
                  }`}
                >
                  {el.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อ..."
                className="w-full bg-[#080d16] border border-[#1b283d] focus:border-cyan-400 rounded-lg pl-8 pr-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Monster Avatars Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2 max-h-60 overflow-y-auto pr-1">
          {availableMonsters.map((m) => (
            <button
              key={m.id}
              onClick={() => handleAddMonsterToTier(selectedTargetTier, m.name)}
              className="p-1 rounded-lg bg-[#0e1624] hover:bg-cyan-950/40 border border-[#1b283d] hover:border-cyan-400 transition-all flex flex-col items-center gap-1 cursor-pointer group"
              title={`คลิกเพื่อใส่ ${m.name}`}
            >
              <img
                src={m.avatarUrl || m.imageUrl}
                alt={m.name}
                className="w-9 h-9 rounded object-cover group-hover:scale-105 transition-transform"
                onError={(e) => { e.target.src = 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0001_0_0.png'; }}
              />
              <span className="text-[11px] text-slate-300 group-hover:text-cyan-300 truncate w-full text-center font-medium">
                {m.name}
              </span>
            </button>
          ))}
        </div>
      </div>
      )}

    </div>
  );
}
