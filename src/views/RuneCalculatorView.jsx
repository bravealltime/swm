import React, { useState } from 'react';
import { Sparkles, RotateCcw } from 'lucide-react';

export default function RuneCalculatorView() {
  const [slot, setSlot] = useState(4);
  const [substats, setSubstats] = useState([
    { type: 'spd', name: 'ความเร็ว (SPD)', value: 18, grind: 4, maxRoll: 6, maxGrind: 5 },
    { type: 'crate', name: 'อัตราคริ (CRIT Rate %)', value: 12, grind: 0, maxRoll: 6, maxGrind: 0 },
    { type: 'hp', name: 'พลังชีวิต (HP %)', value: 14, grind: 7, maxRoll: 8, maxGrind: 10 },
    { type: 'atk', name: 'พลังโจมตี (ATK %)', value: 12, grind: 5, maxRoll: 8, maxGrind: 10 },
  ]);

  const updateSubstat = (index, field, val) => {
    const updated = [...substats];
    updated[index][field] = Number(val);
    setSubstats(updated);
  };

  const calculateEfficiency = () => {
    let totalScore = 1.0;
    substats.forEach(sub => {
      const ratio = (sub.value + (sub.grind || 0)) / (sub.maxRoll * 4);
      totalScore += ratio;
    });

    const eff = ((totalScore / 2.8) * 100).toFixed(1);
    return Math.min(115, Math.max(50, Number(eff)));
  };

  const efficiency = calculateEfficiency();

  const getTierLabel = (eff) => {
    if (eff >= 100) return { label: 'ระดับพระเจ้า (God-Tier 100%+)', color: 'text-pink-400 bg-pink-950/40 border-pink-500/40' };
    if (eff >= 90) return { label: 'ระดับยอดเยี่ยม (Legendary 90-99%)', color: 'text-amber-400 bg-amber-950/40 border-amber-500/40' };
    if (eff >= 80) return { label: 'ระดับดีมาก (Heroic 80-89%)', color: 'text-purple-400 bg-purple-950/40 border-purple-500/40' };
    return { label: 'ระดับใช้งานทั่วไป (< 80%)', color: 'text-slate-400 bg-slate-900 border-slate-700' };
  };

  const tier = getTierLabel(efficiency);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-pink-400 mb-1">
          <Sparkles className="w-4 h-4" />
          Rune Efficiency & Gem/Grind Analyzer
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          เครื่องคำนวณคะแนนประสิทธิภาพรูน (Rune Efficiency)
        </h1>
        <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
          วิเคราะห์ค่าออปชั่นย่อยและหินขัดเพื่อประเมินคุณภาพรูนเทียบกับมาตรฐานการแข่งขันสากล
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Panel (7 cols) */}
        <div className="lg:col-span-7 bg-[#101724] border border-[#1d2b3f] p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1d2b3f]">
            <h2 className="text-base font-bold text-white">กรอกค่าออปชั่นย่อย (Substats)</h2>
            <button
              onClick={() => {
                setSubstats([
                  { type: 'spd', name: 'ความเร็ว (SPD)', value: 18, grind: 4, maxRoll: 6, maxGrind: 5 },
                  { type: 'crate', name: 'อัตราคริ (CRIT Rate %)', value: 12, grind: 0, maxRoll: 6, maxGrind: 0 },
                  { type: 'hp', name: 'พลังชีวิต (HP %)', value: 14, grind: 7, maxRoll: 8, maxGrind: 10 },
                  { type: 'atk', name: 'พลังโจมตี (ATK %)', value: 12, grind: 5, maxRoll: 8, maxGrind: 10 },
                ]);
              }}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> รีเซ็ต
            </button>
          </div>

          <div className="space-y-3">
            {substats.map((sub, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-[#0c121c] border border-[#1d2b3f] space-y-2">
                <div className="flex justify-between items-center text-xs sm:text-sm font-bold text-slate-200">
                  <span>{sub.name}</span>
                  <span className="text-slate-400">
                    รวม: <strong className="text-white font-mono">{sub.value + (sub.grind || 0)}</strong>
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">ค่าสเตตัสดิบ:</label>
                    <input
                      type="number"
                      min="0"
                      max="35"
                      value={sub.value}
                      onChange={(e) => updateSubstat(idx, 'value', e.target.value)}
                      className="w-full bg-[#131b26] border border-[#1d2b3f] rounded-lg px-3 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">ค่าจากหินขัด (Grind):</label>
                    <input
                      type="number"
                      min="0"
                      max={sub.maxGrind}
                      disabled={sub.maxGrind === 0}
                      value={sub.grind}
                      onChange={(e) => updateSubstat(idx, 'grind', e.target.value)}
                      className="w-full bg-[#131b26] border border-[#1d2b3f] rounded-lg px-3 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-blue-500 disabled:opacity-30"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Results Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#101724] border border-[#1d2b3f] p-6 rounded-2xl text-center space-y-4">
            <span className="text-xs font-bold text-pink-400 uppercase tracking-wider">
              คะแนนประสิทธิภาพรวม (Rune Efficiency)
            </span>

            <div className="text-5xl sm:text-6xl font-black text-white font-mono tracking-tight">
              {efficiency}%
            </div>

            <div className={`p-3 rounded-xl border text-xs sm:text-sm font-bold ${tier.color}`}>
              {tier.label}
            </div>

            <p className="text-xs sm:text-sm text-slate-300 text-left leading-relaxed">
              * รูนระดับ 100%+ คือรูนที่มีค่าออปชั่นย่อยลงสเตตัสสูงเกือบเต็มทุกครั้งที่อัปเกรด และขัดด้วยหินขัดระดับ Legend เต็ม เป็นรูนระดับแข่งขัน Siege Tournament
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
