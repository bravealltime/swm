import React, { useState, useMemo } from 'react';
import { card } from './shared';
import RuneCard from './RuneCard';

// ---------------------------------------------------------------------------
// 1. Rune Efficiency & Quad Rolls Scanner
// ---------------------------------------------------------------------------

export default function RuneEfficiencyAndQuads({ box }) {
  const [filter, setFilter] = useState('ungrinded-spd'); // 'ungrinded-spd', 'ungrinded-pct', 'gem-candidates', 'all-quads', 'quad-spd', 'all-ungrinded', 'top-eff'
  const runes = useMemo(() => box?.runes || [], [box]);

  // Grind & Gem Scanner Analysis
  const analysis = useMemo(() => {
    let sumEff = 0;
    let effCount = 0;
    let count100 = 0;
    let count90 = 0;

    const ungrindedSpd = [];
    const ungrindedPct = [];
    const gemCandidates = [];
    const quadSpd = [];
    const quadStats = [];
    const ungrinded = [];
    const topEff = [...runes].sort((a, b) => (b.eff || 0) - (a.eff || 0)).slice(0, 30);

    for (const r of runes) {
      const eff = r.eff || 0;
      if (r.stars === 6) {
        sumEff += eff;
        effCount++;
      }
      if (eff >= 100) count100++;
      if (eff >= 90) count90++;

      let hasQuadSpd = false;
      let hasQuadOther = false;
      let hasMissingGrind = false;
      let hasHighUngrindedSpd = false;
      let hasHighUngrindedPct = false;
      let hasFlatGemCandidate = false;

      const hasGoodSub = (r.subs || []).some(s => (s[0] === 8 && s[1] >= 14) || (s[0] === 9 && s[1] >= 15));

      for (const s of r.subs || []) {
        const statId = s[0];
        const baseVal = s[1] || 0;
        const grindVal = s[2] || 0;
        const isEnchanted = s[3] === 1;

        // Quad Roll heuristics
        if (statId === 8 && baseVal >= 20) hasQuadSpd = true;
        if ([2, 4, 6].includes(statId) && baseVal >= 28) hasQuadOther = true;
        if (statId === 9 && baseVal >= 22) hasQuadOther = true;
        if (statId === 10 && baseVal >= 25) hasQuadOther = true;

        // High Roll Ungrinded SPD (SPD >= 18 and grindVal === 0)
        if (statId === 8 && baseVal >= 18 && grindVal === 0) {
          hasHighUngrindedSpd = true;
        }

        // High Roll Ungrinded % Stats (HP%, ATK%, DEF% >= 20% and grindVal === 0)
        if ([2, 4, 6].includes(statId) && baseVal >= 20 && grindVal === 0) {
          hasHighUngrindedPct = true;
        }

        // Gem Conversion Candidate: Flat HP (1), Flat ATK (3), Flat DEF (5) on 6★ high-eff runes
        if (r.stars === 6 && [1, 3, 5].includes(statId) && !isEnchanted && (eff >= 74 || hasGoodSub)) {
          hasFlatGemCandidate = true;
        }

        // Generic ungrinded
        if (r.stars === 6 && [1, 2, 3, 4, 5, 6, 8].includes(statId) && grindVal === 0 && r.lvl >= 12) {
          hasMissingGrind = true;
        }
      }

      if (hasHighUngrindedSpd) ungrindedSpd.push(r);
      if (hasHighUngrindedPct) ungrindedPct.push(r);
      if (hasFlatGemCandidate) gemCandidates.push(r);
      if (hasQuadSpd) quadSpd.push(r);
      if (hasQuadOther) quadStats.push(r);
      if (hasMissingGrind) ungrinded.push(r);
    }

    return {
      avgEff: effCount > 0 ? (sumEff / effCount).toFixed(1) : '0.0',
      total6Star: effCount,
      count100,
      count90,
      ungrindedSpd: ungrindedSpd.sort((a, b) => (b.eff || 0) - (a.eff || 0)),
      ungrindedPct: ungrindedPct.sort((a, b) => (b.eff || 0) - (a.eff || 0)),
      gemCandidates: gemCandidates.sort((a, b) => (b.eff || 0) - (a.eff || 0)),
      quadSpd: quadSpd.sort((a, b) => (b.eff || 0) - (a.eff || 0)),
      quadStats: quadStats.sort((a, b) => (b.eff || 0) - (a.eff || 0)),
      ungrinded: ungrinded.sort((a, b) => (b.eff || 0) - (a.eff || 0)),
      topEff,
    };
  }, [runes]);

  const displayedRunes = useMemo(() => {
    if (filter === 'ungrinded-spd') return analysis.ungrindedSpd;
    if (filter === 'ungrinded-pct') return analysis.ungrindedPct;
    if (filter === 'gem-candidates') return analysis.gemCandidates;
    if (filter === 'quad-spd') return analysis.quadSpd;
    if (filter === 'all-ungrinded') return analysis.ungrinded;
    if (filter === 'top-eff') return analysis.topEff;
    // 'all-quads'
    const map = new Map();
    [...analysis.quadSpd, ...analysis.quadStats].forEach((r) => map.set(r.id, r));
    return Array.from(map.values()).sort((a, b) => (b.eff || 0) - (a.eff || 0));
  }, [filter, analysis]);

  return (
    <div className="space-y-6">
      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`${card} p-4 text-center border-cyan-500/30 bg-cyan-950/20`}>
          <div className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider">⚡ SPD ≥ 18 ยังไม่ขัด</div>
          <div className="text-2xl font-black text-white mt-1">{analysis.ungrindedSpd.length} <span className="text-xs text-cyan-400">ชิ้น</span></div>
          <div className="text-[10px] text-slate-400 mt-0.5">ขัดหินตำนานได้ถึง +22~+25</div>
        </div>
        <div className={`${card} p-4 text-center border-amber-500/30 bg-amber-950/20`}>
          <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">🛡️ % สเตตัส ≥ 20% ยังไม่ขัด</div>
          <div className="text-2xl font-black text-white mt-1">{analysis.ungrindedPct.length} <span className="text-xs text-amber-400">ชิ้น</span></div>
          <div className="text-[10px] text-slate-400 mt-0.5">HP%/ATK%/DEF% โรลสูงขาดหินขัด</div>
        </div>
        <div className={`${card} p-4 text-center border-pink-500/30 bg-pink-950/20`}>
          <div className="text-[11px] font-bold text-pink-300 uppercase tracking-wider">💎 ช่องเหมาะใส่หินแปลงออป</div>
          <div className="text-2xl font-black text-white mt-1">{analysis.gemCandidates.length} <span className="text-xs text-pink-400">ชิ้น</span></div>
          <div className="text-[10px] text-slate-400 mt-0.5">แปลง Flat Stat เป็น % เพิ่มประสิทธิภาพ</div>
        </div>
        <div className={`${card} p-4 text-center border-purple-500/30 bg-purple-950/20`}>
          <div className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">Quad Rolls ทั้งหมด</div>
          <div className="text-2xl font-black text-white mt-1">{analysis.quadSpd.length + analysis.quadStats.length} <span className="text-xs text-purple-400">ชิ้น</span></div>
          <div className="text-[10px] text-slate-400 mt-0.5">สปีด 4 เด้ง {analysis.quadSpd.length} ชิ้น</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className={`${card} p-4 space-y-4`}>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilter('ungrinded-spd')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === 'ungrinded-spd' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/25' : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            ⚡ สปีดสูงยังไม่ขัด (SPD ≥ 18) ({analysis.ungrindedSpd.length})
          </button>
          <button
            onClick={() => setFilter('ungrinded-pct')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === 'ungrinded-pct' ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/25' : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            🛡️ % สูงยังไม่ขัด (≥ 20%) ({analysis.ungrindedPct.length})
          </button>
          <button
            onClick={() => setFilter('gem-candidates')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === 'gem-candidates' ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/25' : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            💎 เหมาะใส่หินแปลงออป (Flat to %) ({analysis.gemCandidates.length})
          </button>
          <button
            onClick={() => setFilter('all-quads')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === 'all-quads' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25' : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            ⚡ Quad Rolls ({analysis.quadSpd.length + analysis.quadStats.length})
          </button>
          <button
            onClick={() => setFilter('all-ungrinded')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === 'all-ungrinded' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            🔧 รูนทั้งหมดที่ขาดหินขัด ({analysis.ungrinded.length})
          </button>
          <button
            onClick={() => setFilter('top-eff')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === 'top-eff' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25' : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            🏆 Top 30 ประสิทธิภาพ
          </button>
        </div>

        {/* Rune Grid Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {displayedRunes.map((r) => (
            <RuneCard key={r.id} rune={r} />
          ))}
          {displayedRunes.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 text-xs">
              ไม่พบรูนตามเงื่อนไขที่เลือก
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
