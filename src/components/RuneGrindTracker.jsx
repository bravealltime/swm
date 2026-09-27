import React, { useState, useMemo } from 'react';
import { Sparkles, Zap, Gem, Search, Filter, Shield, AlertCircle, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { scanMissingGrinds } from '../utils/runeGrindScanner';
import MonsterAvatar from './MonsterAvatar';

export default function RuneGrindTracker({ box }) {
  const [selectedSet, setSelectedSet] = useState('all');
  const [selectedSlot, setSelectedSlot] = useState('all');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'spd' | 'gem' | 'percent'
  const [searchQuery, setSearchQuery] = useState('');
  const [minEff, setMinEff] = useState(0);

  const { totalRunes, missingGrindRunes, stats } = useMemo(() => scanMissingGrinds(box), [box]);

  const uniqueSets = useMemo(() => {
    return [...new Set(missingGrindRunes.map((r) => r.set))].sort();
  }, [missingGrindRunes]);

  const filteredRunes = useMemo(() => {
    return missingGrindRunes.filter((r) => {
      if (selectedSet !== 'all' && r.set !== selectedSet) return false;
      if (selectedSlot !== 'all' && r.slot !== Number(selectedSlot)) return false;
      if (r.eff < minEff) return false;

      if (filterType === 'spd' && !r.ungroundSubs.some((s) => s.isSpd)) return false;
      if (filterType === 'gem' && r.gemmableFlats.length === 0) return false;
      if (filterType === 'percent' && !r.ungroundSubs.some((s) => s.isPercent)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchMonster = (r.monsterName || '').toLowerCase().includes(q);
        const matchSet = (r.set || '').toLowerCase().includes(q);
        return matchMonster || matchSet;
      }

      return true;
    });
  }, [missingGrindRunes, selectedSet, selectedSlot, filterType, searchQuery, minEff]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* KPI Stats Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[#0c1220] border border-white/[0.08] shadow-xl">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>รูนที่ยังขาดหิน Grind</span>
          </div>
          <div className="text-2xl font-black font-mono text-white mt-1">
            {stats.missingAny.toLocaleString()} <span className="text-xs text-slate-500 font-normal">/ {totalRunes.toLocaleString()} ใบ</span>
          </div>
          <div className="text-[11px] text-amber-300/80 mt-1">รูน 6★/5★ ที่ยังเพิ่มค่าพลังได้อีก</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0c1220] border border-white/[0.08] shadow-xl">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>ขาดหินสปีด (+4~5 SPD)</span>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
            {stats.missingSpd.toLocaleString()} <span className="text-xs text-slate-500 font-normal">ใบ</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">มีออฟ SPD แท้แต่ยังไม่เคยลง Grind</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0c1220] border border-white/[0.08] shadow-xl">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-sky-400" />
            <span>ขาดหินเปอร์เซ็นต์ (+HP/ATK/DEF%)</span>
          </div>
          <div className="text-2xl font-black font-mono text-sky-300 mt-1">
            {stats.missingPercent.toLocaleString()} <span className="text-xs text-slate-500 font-normal">ใบ</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">เพิ่มค่าพลังได้อีก +7~10% ต่อแถว</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0c1220] border border-white/[0.08] shadow-xl">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Gem className="w-3.5 h-3.5 text-purple-400" />
            <span>มี Flat สเตตัส (แปลง Gem ได้)</span>
          </div>
          <div className="text-2xl font-black font-mono text-purple-300 mt-1">
            {stats.gemOpportunities.toLocaleString()} <span className="text-xs text-slate-500 font-normal">ใบ</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">เอาหิน Enchant มาเปลี่ยนออฟขยะได้</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-[#0c1220] border border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xl">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อมอนสเตอร์ หรือเซ็ตรูน..."
              className="w-full bg-[#070b14] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <select
            value={selectedSet}
            onChange={(e) => setSelectedSet(e.target.value)}
            className="bg-[#070b14] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
          >
            <option value="all">ทุกเซ็ต ({uniqueSets.length})</option>
            {uniqueSets.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={selectedSlot}
            onChange={(e) => setSelectedSlot(e.target.value)}
            className="bg-[#070b14] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
          >
            <option value="all">ทุกช่อง (1-6)</option>
            {[1, 2, 3, 4, 5, 6].map((slot) => (
              <option key={slot} value={slot}>ช่อง {slot}</option>
            ))}
          </select>

          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {[
              { id: 'all', label: 'ทั้งหมด' },
              { id: 'spd', label: '⚡ ขาดสปีดเท่านั้น' },
              { id: 'percent', label: '🛡️ ขาด %' },
              { id: 'gem', label: '💎 เปลี่ยนออฟ Gem ได้' },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setFilterType(btn.id)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  filterType === btn.id
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'bg-white/[0.04] text-slate-300 hover:text-white'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-slate-400 font-mono shrink-0">
          พบ <span className="text-amber-300 font-bold">{filteredRunes.length}</span> จาก {missingGrindRunes.length} ใบ
        </div>
      </div>

      {/* Rune Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredRunes.slice(0, 48).map((r) => (
          <div
            key={r.id}
            className="p-4 rounded-2xl bg-[#0c1220] border border-white/[0.08] hover:border-amber-500/30 transition-all flex flex-col justify-between gap-3 shadow-xl"
          >
            <div className="space-y-3">
              {/* Rune Header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center justify-center font-mono">
                    #{r.slot}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{r.set}</span>
                      <span className="text-[10px] text-amber-400 font-mono">+{r.level}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.05] text-slate-400 font-mono">
                        {r.stars}★ {r.quality}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Main: <span className="text-emerald-400 font-bold">{r.mainStat} +{r.mainValue}</span>
                      {r.innateStat && <span className="text-slate-500 ml-1.5">({r.innateStat} +{r.innateValue})</span>}
                    </div>
                  </div>
                </div>

                {r.monsterName ? (
                  <div className="flex items-center gap-1.5 bg-white/[0.04] px-2 py-1 rounded-xl border border-white/10 shrink-0" title={`ใส่อยู่ที่ ${r.monsterName}`}>
                    <MonsterAvatar monster={r.monsterName} size="xs" showStars={false} />
                    <span className="text-[11px] font-bold text-slate-200 truncate max-w-[80px]">{r.monsterName}</span>
                  </div>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-1 rounded-lg bg-slate-800 text-slate-400">
                    ในคลัง
                  </span>
                )}
              </div>

              {/* Substats List with Grind Status */}
              <div className="space-y-1.5 text-xs font-mono bg-[#070b14] p-2.5 rounded-xl border border-white/[0.05]">
                {r.subs.map((s, idx) => {
                  const isUnground = r.ungroundSubs.some((u) => u.stat === s.stat);
                  const isGemmable = r.gemmableFlats.some((g) => g.stat === s.stat);

                  return (
                    <div key={idx} className="flex items-center justify-between text-[11px]">
                      <span className={`${s.stat === 'SPD' ? 'text-amber-300 font-bold' : 'text-slate-300'}`}>
                        {s.stat} +{s.value}
                        {s.grind > 0 && <span className="text-emerald-400 font-bold ml-1">(+{s.grind})</span>}
                      </span>

                      {isUnground ? (
                        <span className="px-1.5 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] font-sans font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> ขาด Grind
                        </span>
                      ) : isGemmable ? (
                        <span className="px-1.5 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[10px] font-sans font-bold flex items-center gap-1">
                          <Gem className="w-3 h-3" /> แปลง Gem ได้
                        </span>
                      ) : (
                        <span className="text-slate-600 text-[10px]">
                          {s.grind > 0 ? '✓ ลงหินแล้ว' : 'ลงหินไม่ได้'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Recommendations */}
              <div className="space-y-1 text-[11px] text-slate-300">
                {r.ungroundSubs.map((u, i) => (
                  <div key={i} className="text-emerald-300 flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>บวก {u.stat} ได้อีก {u.maxGain}</span>
                  </div>
                ))}
                {r.gemmableFlats.map((g, i) => (
                  <div key={i} className="text-purple-300 flex items-center gap-1">
                    <Gem className="w-3 h-3 text-purple-400 shrink-0" />
                    <span>เปลี่ยน {g.stat} แบน เป็น {g.suggestedGem}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Farm Source Footer */}
            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
              <span>ฟาร์มได้จาก: <strong className="text-slate-200">{r.farmSource}</strong></span>
              <span className="font-mono text-amber-300/80 font-bold">Eff: {r.eff}%</span>
            </div>
          </div>
        ))}

        {filteredRunes.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <div className="text-sm font-bold text-white">ไม่พบรูนที่ตรงกับเงื่อนไข</div>
            <p className="text-xs text-slate-500">รูนในหมวดนี้อาจได้รับการลงหิน Grind/Gem ครบถ้วนแล้ว</p>
          </div>
        )}
      </div>

      {filteredRunes.length > 48 && (
        <div className="text-center text-xs text-slate-500 font-mono">
          แสดง 48 รายการแรกที่มีค่าพลังศักยภาพสูงสุด จากทั้งหมด {filteredRunes.length} รายการ
        </div>
      )}
    </div>
  );
}
