import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  HelpCircle, 
  Search, 
  Sparkles, 
  ExternalLink, 
  Swords, 
  Shield, 
  Flame,
  Info
} from 'lucide-react';

export const TIER_DEFINITIONS = [
  { id: 'SSS', label: 'SSS', bg: 'bg-[#ff7f7f]', text: 'text-slate-950', count: 1, desc: 'God Tier ไร้เทียมทาน' },
  { id: 'SS',  label: 'SS',  bg: 'bg-[#ffbf7f]', text: 'text-slate-950', count: 8, desc: 'Top Meta คุมเมต้าสูงสุด' },
  { id: 'S',   label: 'S',   bg: 'bg-[#ffdf7f]', text: 'text-slate-950', count: 9, desc: 'ตัวเลือกหลักยอดนิยม' },
  { id: 'A',   label: 'A',   bg: 'bg-[#ffff7f]', text: 'text-slate-950', count: 23, desc: 'แข็งแกร่งมากรอบด้าน' },
  { id: 'B',   label: 'B',   bg: 'bg-[#bfff7f]', text: 'text-slate-950', count: 26, desc: 'ตัวเลือกมีประสิทธิภาพ' },
  { id: 'C',   label: 'C',   bg: 'bg-[#7fff7f]', text: 'text-slate-950', count: 28, desc: 'ตัวเลือกเฉพาะทาง' },
  { id: 'D',   label: 'D',   bg: 'bg-[#7fffff]', text: 'text-slate-950', count: 30, desc: 'ตามสถานการณ์' },
  { id: 'F',   label: 'F',   bg: 'bg-[#7fbfff]', text: 'text-slate-950', count: 36, desc: 'นอกกระแส / ตัวแก้เฉพาะ' },
  { id: 'Other', label: 'Other', bg: 'bg-[#dcdcdc]', text: 'text-slate-950', count: 999, desc: 'มอนสเตอร์อื่น ๆ' }
];

export default function MonsterTierListView({ 
  monsters = [], 
  type = 'defense', // 'defense' | 'offense'
  searchTerm = '',
  elementFilter = 'all',
  starsFilter = 'all',
  onNavigate
}) {
  const [hoveredMonster, setHoveredMonster] = useState(null);
  const [selectedMonster, setSelectedMonster] = useState(null);

  // 1. Calculate Bayesian Tier Scores and assign Tiers
  const tieredMonsters = useMemo(() => {
    if (!monsters || monsters.length === 0) return {};

    const mThreshold = 1000;
    const totalWR = monsters.reduce((sum, m) => sum + (m.winRateNum || 0), 0);
    const meanWR = totalWR / monsters.length;

    // Clone and score each monster
    const scored = monsters.map(item => {
      const battles = parseInt((item.battleCount || '0').toString().replace(/,/g, '')) || 0;
      const pick = parseFloat(item.pickShare || '0') || 0;
      const wr = item.winRateNum || 0;

      // Bayesian Theorem comparing pick rate vs 2x win rate (WR%)
      const bayesWR = battles >= mThreshold
        ? (battles / (battles + mThreshold)) * (2 * wr) + (mThreshold / (battles + mThreshold)) * (2 * meanWR)
        : (battles / (mThreshold * 2)) * (2 * wr);

      // Score weight (Pick share + Bayesian WR)
      const tierScore = (bayesWR * 1.5) + (pick * 8.0);

      return {
        ...item,
        battlesNum: battles,
        pickNum: pick,
        tierScore
      };
    });

    // Sort descending by Bayesian tier score
    scored.sort((a, b) => b.tierScore - a.tierScore);

    // Group into Tiers
    const groups = {};
    TIER_DEFINITIONS.forEach(t => { groups[t.id] = []; });

    let currentIdx = 0;
    for (const t of TIER_DEFINITIONS) {
      if (t.id === 'Other') {
        while (currentIdx < scored.length) {
          groups['Other'].push({ ...scored[currentIdx], tierId: 'Other' });
          currentIdx++;
        }
      } else {
        for (let i = 0; i < t.count && currentIdx < scored.length; i++) {
          groups[t.id].push({ ...scored[currentIdx], tierId: t.id });
          currentIdx++;
        }
      }
    }

    return groups;
  }, [monsters]);

  // 2. Filter monsters within each tier based on search & element filters
  const filteredTierGroups = useMemo(() => {
    const q = (searchTerm || '').toLowerCase().trim();
    const result = {};

    TIER_DEFINITIONS.forEach(t => {
      const list = tieredMonsters[t.id] || [];
      result[t.id] = list.filter(m => {
        if (elementFilter !== 'all' && m.element !== elementFilter) return false;
        if (starsFilter !== 'all' && m.stars?.toString() !== starsFilter) return false;
        if (!q) return true;
        const nameEn = (m.name || '').toLowerCase();
        const nameTh = (m.thaiName || '').toLowerCase();
        return nameEn.includes(q) || nameTh.includes(q);
      });
    });

    return result;
  }, [tieredMonsters, searchTerm, elementFilter, starsFilter]);

  const totalDisplayed = useMemo(() => {
    return Object.values(filteredTierGroups).reduce((sum, list) => sum + list.length, 0);
  }, [filteredTierGroups]);

  return (
    <div className="space-y-4">
      {/* Informational Sub-header matching SWGT */}
      <div className="bg-[#101724] border border-[#1d2b3f] rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-md">
        <div className="space-y-0.5">
          <div className="text-slate-300 flex items-center gap-1.5 font-medium">
            <span className="text-blue-400 font-bold">•</span>
            <span>มอนสเตอร์ต้องมีบันทึกการรบอย่างน้อย <strong>1,000 รอบขึ้นไป</strong> ถึงจะแสดงในระบบจัดอันดับนี้</span>
          </div>
          <div className="text-blue-400 flex items-center gap-1.5 font-sans">
            <span className="text-blue-400 font-bold">•</span>
            <span>คำนวณการจัดเกรด Tiers ตามทฤษฎี <strong>Bayesian Theorem</strong> เปรียบเทียบระหว่าง <em>Pick Rate (%)</em> vs <em>2x Win Rate (WR%)</em></span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 font-mono text-[11px] text-slate-400 bg-[#0c121c] px-2.5 py-1 rounded-lg border border-[#1e2a3c]">
          <span>แสดง:</span>
          <span className="text-white font-bold">{totalDisplayed}</span>
          <span>จาก {monsters.length} ตัว</span>
        </div>
      </div>

      {/* Classic Tier List Rows Container */}
      <div className="rounded-2xl border border-[#1d2b3f] overflow-hidden divide-y divide-[#182333] shadow-2xl bg-[#090e16]">
        {TIER_DEFINITIONS.map((tier) => {
          const items = filteredTierGroups[tier.id] || [];

          return (
            <div 
              key={tier.id}
              className="flex flex-col sm:flex-row items-stretch min-h-[68px] hover:bg-[#101826]/40 transition-colors"
            >
              {/* Left Tier Badge Box */}
              <div 
                className={`w-full sm:w-24 md:w-28 shrink-0 ${tier.bg} ${tier.text} flex flex-row sm:flex-col items-center justify-between sm:justify-center px-4 py-2 sm:py-3 shadow-inner select-none`}
              >
                <span className="font-black text-lg sm:text-xl tracking-wider">
                  {tier.label}
                </span>
                <span className="text-[10px] font-bold opacity-75 sm:mt-0.5">
                  {items.length} ตัว
                </span>
              </div>

              {/* Right Monster Tray */}
              <div className="flex-1 p-2 sm:p-2.5 bg-[#0e1420] flex flex-wrap items-center gap-1.5 sm:gap-2 min-h-[64px]">
                {items.length > 0 ? (
                  items.map((m, mIdx) => (
                    <div
                      key={mIdx}
                      className="relative group cursor-pointer"
                      onMouseEnter={() => setHoveredMonster(m)}
                      onMouseLeave={() => setHoveredMonster(null)}
                      onClick={() => setSelectedMonster(m)}
                    >
                      {/* Avatar Square Tile */}
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg overflow-hidden bg-black border-2 border-[#223145] group-hover:border-white group-hover:scale-110 group-hover:z-30 transition-all duration-150 relative shadow-md">
                        <img
                          src={m.imageUrl || m.avatarUrl}
                          alt={m.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            e.target.src = 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0001_0_0.png';
                          }}
                        />
                        {/* Tiny Element Indicator Dot */}
                        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-tl ${
                          m.element === 'fire' ? 'bg-rose-500' :
                          m.element === 'water' ? 'bg-sky-500' :
                          m.element === 'wind' ? 'bg-amber-500' :
                          m.element === 'light' ? 'bg-yellow-300' :
                          'bg-purple-600'
                        }`} />
                      </div>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 italic px-2 py-1">
                    {searchTerm || elementFilter !== 'all' ? 'ไม่มีมอนสเตอร์ที่ตรงกับตัวกรองใน Tier นี้' : 'ไม่มีมอนสเตอร์'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Hover Tooltip (HUD) */}
      {hoveredMonster && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#101724]/95 backdrop-blur-md border border-[#23334a] rounded-2xl p-4 shadow-2xl w-80 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center gap-3 pb-3 border-b border-[#1f2d40]">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-black border-2 border-blue-500/60 shrink-0">
              <img
                src={hoveredMonster.imageUrl || hoveredMonster.avatarUrl}
                alt={hoveredMonster.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                  hoveredMonster.element === 'fire' ? 'bg-rose-900/60 text-rose-300 border border-rose-500/40' :
                  hoveredMonster.element === 'water' ? 'bg-sky-900/60 text-sky-300 border border-sky-500/40' :
                  hoveredMonster.element === 'wind' ? 'bg-amber-900/60 text-amber-300 border border-amber-500/40' :
                  hoveredMonster.element === 'light' ? 'bg-yellow-900/60 text-yellow-300 border border-yellow-500/40' :
                  'bg-purple-900/60 text-purple-300 border border-purple-500/40'
                }`}>
                  {hoveredMonster.element}
                </span>
                <span className="text-[10px] text-amber-400 font-bold font-mono">
                  {hoveredMonster.stars}★
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#1e2a3c] text-white">
                  Tier {hoveredMonster.tierId}
                </span>
              </div>
              <h4 className="text-sm font-extrabold text-white truncate mt-0.5">
                {hoveredMonster.name}
              </h4>
              {hoveredMonster.thaiName && hoveredMonster.thaiName !== hoveredMonster.name && (
                <div className="text-[11px] text-slate-400 truncate">
                  {hoveredMonster.thaiName}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 text-center">
            <div className="bg-[#0b1018] p-2 rounded-lg border border-[#1b283d]">
              <div className="text-[10px] text-slate-400 uppercase font-bold">
                {type === 'defense' ? 'Def Win' : 'Offense Win'}
              </div>
              <div className="text-sm font-mono font-black text-emerald-400">
                {hoveredMonster.winRate}
              </div>
            </div>
            <div className="bg-[#0b1018] p-2 rounded-lg border border-[#1b283d]">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Pick Rate</div>
              <div className="text-sm font-mono font-bold text-blue-400">
                {hoveredMonster.pickShare}
              </div>
            </div>
            <div className="bg-[#0b1018] p-2 rounded-lg border border-[#1b283d]">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Battles</div>
              <div className="text-xs font-mono font-bold text-slate-200 mt-0.5">
                {hoveredMonster.battleCount}
              </div>
            </div>
          </div>

          <div className="mt-2 text-[10px] text-slate-400 text-center font-mono">
            คลิกเพื่อเปิดดูรายละเอียด & ค้นหา 3MDC
          </div>
        </div>
      )}

      {/* Selected Monster Modal / Quick Details */}
      {selectedMonster && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setSelectedMonster(null)}
        >
          <div 
            className="w-full max-w-md bg-[#111824] border border-[#223148] rounded-2xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2a3c]">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-black border-2 border-blue-500 shrink-0">
                  <img
                    src={selectedMonster.imageUrl || selectedMonster.avatarUrl}
                    alt={selectedMonster.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-extrabold px-2 py-0.5 rounded bg-blue-600 text-white">
                      Tier {selectedMonster.tierId}
                    </span>
                    <span className="text-xs text-amber-400 font-bold font-mono">
                      {selectedMonster.stars}★ • {selectedMonster.element.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white mt-1">
                    {selectedMonster.name}
                  </h3>
                  {selectedMonster.thaiName && (
                    <div className="text-xs text-slate-400">
                      {selectedMonster.thaiName}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setSelectedMonster(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#1e2a3c] cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Performance Stats Cards */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-[#0c121c] p-3 rounded-xl border border-[#1b283d] text-center">
                <div className="text-[10px] text-slate-400 font-bold uppercase">
                  {type === 'defense' ? 'Winrate ป้องกัน' : 'Winrate บุก'}
                </div>
                <div className="text-base font-mono font-black text-emerald-400 mt-0.5">
                  {selectedMonster.winRate}
                </div>
              </div>
              <div className="bg-[#0c121c] p-3 rounded-xl border border-[#1b283d] text-center">
                <div className="text-[10px] text-slate-400 font-bold uppercase">อัตราการหยิบ</div>
                <div className="text-base font-mono font-black text-blue-400 mt-0.5">
                  {selectedMonster.pickShare}
                </div>
              </div>
              <div className="bg-[#0c121c] p-3 rounded-xl border border-[#1b283d] text-center">
                <div className="text-[10px] text-slate-400 font-bold uppercase">รอบรบทั้งหมด</div>
                <div className="text-base font-mono font-black text-slate-200 mt-0.5">
                  {selectedMonster.battleCount}
                </div>
              </div>
            </div>

            {/* Bayesian Theorem Calculation Note */}
            <div className="p-3 bg-[#0c121c] rounded-xl border border-[#1b283d] text-xs text-slate-300 space-y-1">
              <div className="font-bold text-blue-400 flex items-center gap-1.5">
                <Info className="w-4 h-4" />
                <span>เกณฑ์การจัดอันดับของ SWGT:</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                จัดอยู่ใน <strong>Tier {selectedMonster.tierId}</strong> จากการเปรียบเทียบ Pick Rate ({selectedMonster.pickShare}) คู่กับ 2x Win Rate ({selectedMonster.winRate}) ผ่านสูตร Bayesian Theorem เพื่อตัดมอนสเตอร์ที่ชนะฟลุกแต่คนเล่นน้อยออกอย่างเป็นธรรม
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  setSelectedMonster(null);
                  if (onNavigate) onNavigate('3mdc', { search: selectedMonster.name });
                }}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-blue-600/20"
              >
                <Swords className="w-4 h-4" />
                <span>ค้นหาทีม 3MDC</span>
              </button>

              <button
                onClick={() => {
                  setSelectedMonster(null);
                  if (onNavigate) onNavigate('catalog', { search: selectedMonster.name });
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#182333] hover:bg-[#223147] text-slate-200 border border-[#2b3c54] font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>ดูสกิล & สเตตัส</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
