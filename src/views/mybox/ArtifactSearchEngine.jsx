import React, { useState, useMemo } from 'react';
import { Search, Zap, Sparkles } from 'lucide-react';
import MonsterAvatar from '../../components/MonsterAvatar';
import ArtifactIcon from '../../components/ArtifactIcon';
import { ARTIFACT_EFFECT_NAMES } from '../../utils/swexImport';
import { monsterOf, ELEMENT_TH, card } from './shared';

// ---------------------------------------------------------------------------
// 4. Artifact Substat Search Engine
// ---------------------------------------------------------------------------

export default function ArtifactSearchEngine({ box }) {
  const [selectedSubstatPreset, setSelectedSubstatPreset] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('all'); // 'all', '1' (element), '2' (archetype)
  const [selectedElement, setSelectedElement] = useState('all');
  const [selectedArchetype, setSelectedArchetype] = useState('all');
  const [whereFilter, setWhereFilter] = useState('all'); // 'all', 'equipped', 'inventory'
  const [minVal, setMinVal] = useState(0);

  // Only a box that actually carries artifacts (real import or the labeled demo) may show this tab —
  // getArtifactsFromBox() fabricates placeholder items when the list is empty and those must never
  // be presented as the user's inventory
  const hasArtifacts = Array.isArray(box?.artifacts) && box.artifacts.length > 0;
  const artifacts = useMemo(() => (hasArtifacts ? box.artifacts : []), [hasArtifacts, box]);

  const PRESETS = [
    { id: 'all', label: 'ทั้งหมด' },
    { id: '207', label: '⚡ ดาเมจตามสปีด (Add\'l SPD)', statIds: [207], hint: 'Juno, Miles, Dominic, Moore' },
    { id: '302', label: '💥 ดาเมจคริ สกิล 3', statIds: [302], hint: 'Savannah, Lushen, Daphnis, Sonia' },
    { id: 'recovery', label: '🩸 ฟื้นฟูเลือด (Recovery)', statIds: [304, 305, 306], hint: 'Riley, Abellio, Lulu, Ariel' },
    { id: '208', label: '🛡️ ลดดาเมจคริที่ได้รับ', statIds: [208], hint: 'แทงก์ / ตัวแก้ทางบอมบ์ / RTA' },
    { id: '400', label: '🩸 ดูดเลือด (Life Drain)', statIds: [400], hint: 'Douglas, Laika, Chow, Rakan' },
    { id: '403', label: '🎯 คริเป้าหมายเดี่ยว', statIds: [403], hint: 'Sonia, Adriana, Claire, Covenant' },
    { id: '204', label: '🏹 ดาเมจตาม HP', statIds: [204], hint: 'Mo Long, Skogul, Eshir, Karnal' },
    { id: '205', label: '⚔️ ดาเมจตาม ATK', statIds: [205], hint: 'Kaki, Dominic, Seara, Liebli' },
    { id: '206', label: '🛡️ ดาเมจตาม DEF', statIds: [206], hint: 'Tractor, Feng Yan, Copper, Verad' },
    { id: '404', label: '⏱️ ดาเมจคริเทิร์นแรก', statIds: [404], hint: 'ทีมสปีดวันช็อต / Tiana Cleave' },
  ];

  const activePreset = PRESETS.find((p) => p.id === selectedSubstatPreset);

  // Filter artifacts
  const filteredArtifacts = useMemo(() => {
    return artifacts.filter((art) => {
      // Slot filter
      if (selectedSlot === '1' && art.slot !== 1) return false;
      if (selectedSlot === '2' && art.slot !== 2) return false;

      // Element filter (for slot 1)
      if (selectedElement !== 'all' && art.element && art.element.toLowerCase() !== selectedElement) return false;

      // Archetype filter (for slot 2)
      if (selectedArchetype !== 'all' && art.archetype && art.archetype.toLowerCase() !== selectedArchetype.toLowerCase()) return false;

      // Where filter
      if (whereFilter === 'equipped' && (!art.unit || art.unit === 0)) return false;
      if (whereFilter === 'inventory' && art.unit && art.unit !== 0) return false;

      // Preset Substat filter
      if (activePreset && activePreset.statIds) {
        const hasStat = art.subs.some((s) => activePreset.statIds.includes(s[0]) && s[1] >= minVal);
        if (!hasStat) return false;
      }

      // Keyword search
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase();
        const hasInEffect = art.subs.some((s) => {
          const name = (ARTIFACT_EFFECT_NAMES[s[0]] || '').toLowerCase();
          return name.includes(q);
        });
        const hasInType = (art.element || '').toLowerCase().includes(q) || (art.archetype || '').toLowerCase().includes(q);
        if (!hasInEffect && !hasInType) return false;
      }

      return true;
    });
  }, [artifacts, selectedSlot, selectedElement, selectedArchetype, whereFilter, activePreset, minVal, searchKeyword]);

  if (!hasArtifacts) {
    return (
      <div className="py-16 text-center space-y-3">
        <div className="text-4xl">🔍</div>
        <div className="text-sm font-bold text-white">ยังไม่มีข้อมูลอาร์ติแฟกต์ในเครื่องนี้</div>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          นำเข้าไฟล์ SWEX ที่มีข้อมูลอาร์ติแฟกต์ แล้วหน้านี้จะค้นหาออปชั่นเด็ด (ดาเมจตามสปีด, ดูดเลือด, ฟื้นฟู ฯลฯ) จากอาร์ติแฟกต์จริงของคุณได้ทันที
        </p>
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold cursor-pointer">
          ขึ้นไปนำเข้าไฟล์ด้านบน
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-teal-500/20 bg-gradient-to-r from-teal-950/60 via-[#0a0f19] to-cyan-950/60 p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              ARTIFACT SUBSTAT SEARCH ENGINE
            </div>
            <h2 className="text-2xl font-black text-white">
              ค้นหาอาร์ติแฟกต์ในไอดี <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-300">ตามออปชั่นเด็ด</span>
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl">
              ค้นหาอาร์ติแฟกต์ที่มีดาเมจตามสปีด, ดาเมจคริสกิล 3, ดูดเลือด หรือฟื้นฟูเลือด เพื่อเลือกใส่ให้กับตัวละครที่คุณกำลังจะปั้นได้ทันที
            </p>
          </div>
          <div className="flex items-center gap-3 bg-black/40 border border-white/10 p-3 px-4 rounded-2xl">
            <div className="text-center">
              <div className="text-[10px] uppercase font-bold text-teal-400">อาร์ติแฟกต์ในไอดี</div>
              <div className="text-2xl font-black text-white">{artifacts.length} <span className="text-xs text-slate-400">ชิ้น</span></div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <div className="text-[10px] uppercase font-bold text-cyan-400">ตรงเงื่อนไข</div>
              <div className="text-2xl font-black text-emerald-400">{filteredArtifacts.length} <span className="text-xs text-slate-400">ชิ้น</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Substat Preset Chips */}
      <div className={`${card} p-5 space-y-4`}>
        <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          เลือกออปชั่นเด็ดที่ต้องการค้นหา (Substat Presets):
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => {
            const isSelected = selectedSubstatPreset === p.id;
            return (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedSubstatPreset(p.id);
                  setMinVal(0);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/25 border border-teal-400'
                    : 'bg-white/[0.03] text-slate-300 hover:bg-white/[0.08] border border-white/10'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Filters Row: Slot, Element, Archetype, Where, Search input */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-white/5">
          {/* Search Keyword */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ค้นหาชื่อออปชั่น / ธาตุ..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/50"
            />
          </div>

          {/* Slot */}
          <div>
            <select
              value={selectedSlot}
              onChange={(e) => setSelectedSlot(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl bg-white/5 border border-white/10 text-slate-200 focus:outline-none"
            >
              <option value="all" className="bg-[#0b101c]">ช่อง: ทั้งหมด (ธาตุ + สาย)</option>
              <option value="1" className="bg-[#0b101c]">ช่องซ้าย: ธาตุ (Element)</option>
              <option value="2" className="bg-[#0b101c]">ช่องขวา: สาย (Archetype)</option>
            </select>
          </div>

          {/* Element */}
          <div>
            <select
              value={selectedElement}
              onChange={(e) => setSelectedElement(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl bg-white/5 border border-white/10 text-slate-200 focus:outline-none"
            >
              <option value="all" className="bg-[#0b101c]">ธาตุ: ทั้งหมด</option>
              <option value="water" className="bg-[#0b101c]">ธาตุน้ำ (Water)</option>
              <option value="fire" className="bg-[#0b101c]">ธาตุไฟ (Fire)</option>
              <option value="wind" className="bg-[#0b101c]">ธาตุลม (Wind)</option>
              <option value="light" className="bg-[#0b101c]">ธาตุแสง (Light)</option>
              <option value="dark" className="bg-[#0b101c]">ธาตุมืด (Dark)</option>
            </select>
          </div>

          {/* Archetype */}
          <div>
            <select
              value={selectedArchetype}
              onChange={(e) => setSelectedArchetype(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl bg-white/5 border border-white/10 text-slate-200 focus:outline-none"
            >
              <option value="all" className="bg-[#0b101c]">สาย: ทั้งหมด</option>
              <option value="attack" className="bg-[#0b101c]">สายโจมตี (Attack)</option>
              <option value="defense" className="bg-[#0b101c]">สายป้องกัน (Defense)</option>
              <option value="hp" className="bg-[#0b101c]">สายเลือด (HP)</option>
              <option value="support" className="bg-[#0b101c]">สายสนับสนุน (Support)</option>
            </select>
          </div>

          {/* Where */}
          <div>
            <select
              value={whereFilter}
              onChange={(e) => setWhereFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl bg-white/5 border border-white/10 text-slate-200 focus:outline-none"
            >
              <option value="all" className="bg-[#0b101c]">ที่อยู่: ทั้งหมด</option>
              <option value="equipped" className="bg-[#0b101c]">ใส่อยู่บนมอนสเตอร์</option>
              <option value="inventory" className="bg-[#0b101c]">ในคลัง (พร้อมใส่)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Artifacts Grid Result */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredArtifacts.map((art) => {
          const isElement = art.slot === 1;
          const label = isElement
            ? `${(art.element || 'fire').toUpperCase()} Artifact (ธาตุ${ELEMENT_TH[art.element] || 'ไฟ'})`
            : `${art.archetype || 'Attack'} Artifact (สาย${art.archetype || 'โจมตี'})`;

          const unitInfo = art.unit ? monsterOf(art.unit) : null;
          const mainStatLabel = art.main[0] === 1 ? `HP +${art.main[1]}` : art.main[0] === 3 ? `ATK +${art.main[1]}` : `DEF +${art.main[1]}`;

          return (
            <div
              key={art.id}
              className="p-4 rounded-2xl bg-[#090e18] border border-white/10 hover:border-teal-500/40 transition-all flex flex-col justify-between space-y-3 shadow-lg"
            >
              <div className="space-y-2">
                {/* Header with SWGT Artifact Icon */}
                <div className="flex items-center gap-3">
                  <ArtifactIcon artifact={art} size={52} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white truncate">{label}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                        +{art.lvl ?? 0} {art.rank ? '★'.repeat(art.rank) : ''}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-cyan-300 font-bold mt-1 bg-white/[0.02] px-2 py-0.5 rounded border border-white/5 inline-block">
                      Main: {mainStatLabel}
                    </div>
                  </div>
                </div>

                {/* Substats List */}
                <div className="space-y-1.5 pt-1">
                  {art.subs.map((s, sIdx) => {
                    const statId = s[0];
                    const val = s[1];
                    const isHighlighted = activePreset?.statIds?.includes(statId);
                    const effectName = ARTIFACT_EFFECT_NAMES[statId] || `Stat #${statId}`;

                    return (
                      <div
                        key={sIdx}
                        className={`text-xs p-1.5 rounded-lg flex items-center justify-between transition-colors ${
                          isHighlighted
                            ? 'bg-teal-500/20 border border-teal-500/40 text-teal-200 font-bold'
                            : 'bg-white/[0.02] text-slate-300'
                        }`}
                      >
                        <span className="truncate pr-2">{effectName}</span>
                        <span className="font-mono font-bold text-right shrink-0">+{val}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer: Where Equipped */}
              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                <span className="text-[11px]">สถานะ:</span>
                {unitInfo ? (
                  <div className="flex items-center gap-1.5 text-white font-medium">
                    <MonsterAvatar monster={unitInfo} size="xs" showStars={false} />
                    <span className="truncate max-w-[130px]">{unitInfo.name}</span>
                  </div>
                ) : (
                  <span className="text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded">
                    ✓ ในคลัง (พร้อมใส่)
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {filteredArtifacts.length === 0 && (
          <div className="col-span-full py-16 text-center text-xs text-slate-400">
            ไม่พบอาร์ติแฟกต์ตามเงื่อนไขที่เลือก — ลองเปลี่ยนตัวเลือกออปชั่นเด็ด หรือเลือกธาตุ/สายอื่นดูครับ
          </div>
        )}
      </div>
    </div>
  );
}
