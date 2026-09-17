import React, { useState } from 'react';
import { Gauge, Zap, RotateCcw, Info, ArrowRight } from 'lucide-react';

export default function SpeedCalculatorView() {
  const [baseSpd, setBaseSpd] = useState(105);
  const [runeSpd, setRuneSpd] = useState(150);
  const [hasSwift, setHasSwift] = useState(true);
  const [speedLead, setSpeedLead] = useState(24);
  const [hasSpdBuff, setHasSpdBuff] = useState(false);

  // Formulas
  const swiftBonus = hasSwift ? Math.floor(baseSpd * 0.25) : 0;
  const leadBonus = Math.floor(baseSpd * (speedLead / 100));
  const combatSpdBeforeBuff = Number(baseSpd) + Number(runeSpd) + swiftBonus + leadBonus;
  const totalCombatSpd = hasSpdBuff 
    ? Math.floor(combatSpdBeforeBuff * 1.33) 
    : combatSpdBeforeBuff;

  const tickBrackets = [
    { tick: 'Tick 1 (ความเร็วสูงสุด)', minCombatSpd: 286, desc: 'ออกเทิร์นแรกแน่นอนในเกือบทุกสถานการณ์' },
    { tick: 'Tick 2 (ระดับแข่งขัน G1-G3)', minCombatSpd: 239, desc: 'มาตรฐานตัวเปิดทีมกิลด์วอร์ระดับแข่งขัน' },
    { tick: 'Tick 3 (มาตรฐานตัวทำเกม)', minCombatSpd: 205, desc: 'ตัวดาเมจจูนตามหลังตัวเปิด' },
    { tick: 'Tick 4 (ตัวช้า / ตัวแทงก์)', minCombatSpd: 179, desc: 'ตัวรับดาเมจ หรือตัวปิดจ็อบท้ายเทิร์น' },
  ];

  const currentBracket = tickBrackets.find(b => totalCombatSpd >= b.minCombatSpd) || {
    tick: 'Tick 5+ (ช้า)', minCombatSpd: 0, desc: 'ความเร็วไม่เพียงพอในสังเวียนกิลด์วอร์'
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 mb-1">
          <Gauge className="w-4 h-4" />
          Speed Tick Bracket Calculator
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          เครื่องคำนวณสปีดทิกและลำดับเทิร์น (Speed Calculator)
        </h1>
        <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
          คำนวณความเร็วจริงในสนามต่อสู้ (Combat SPD) รวมผลลัพธ์ของรูน Swift, ลีดเดอร์สปีด และบัฟความเร็ว เพื่อเช็คว่ามอนสเตอร์ออกเทิร์นใน Tick ไหน
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Panel (5 cols) */}
        <div className="lg:col-span-5 bg-[#101724] border border-[#1d2b3f] p-6 rounded-2xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#1d2b3f]">
            <h2 className="text-base font-bold text-white">กำหนดค่าความเร็วมอนสเตอร์</h2>
            <button
              onClick={() => {
                setBaseSpd(105);
                setRuneSpd(150);
                setHasSwift(true);
                setSpeedLead(24);
                setHasSpdBuff(false);
              }}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> รีเซ็ต
            </button>
          </div>

          <div className="space-y-4 text-xs sm:text-sm">
            {/* Base SPD */}
            <div>
              <div className="flex justify-between font-bold text-slate-300 mb-1">
                <span>ความเร็วพื้นฐาน (Base SPD):</span>
                <span className="text-blue-400 font-mono text-base font-black">{baseSpd}</span>
              </div>
              <input
                type="number"
                min="90"
                max="130"
                value={baseSpd}
                onChange={(e) => setBaseSpd(Number(e.target.value))}
                className="w-full bg-[#0c121c] border border-[#1d2b3f] rounded-xl px-3.5 py-2.5 text-base text-white font-mono font-bold focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Rune SPD */}
            <div>
              <div className="flex justify-between font-bold text-slate-300 mb-1">
                <span>ความเร็วจากรูน (+SPD):</span>
                <span className="text-emerald-400 font-mono text-base font-black">+{runeSpd}</span>
              </div>
              <input
                type="number"
                min="0"
                max="250"
                value={runeSpd}
                onChange={(e) => setRuneSpd(Number(e.target.value))}
                className="w-full bg-[#0c121c] border border-[#1d2b3f] rounded-xl px-3.5 py-2.5 text-base text-white font-mono font-bold focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Swift Set Checkbox */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0c121c] border border-[#1d2b3f]">
              <div>
                <div className="font-bold text-slate-200">ใส่เซ็ตรูน Swift (+25% ของ Base)</div>
                <div className="text-xs text-slate-400">เพิ่มความเร็ว +{Math.floor(baseSpd * 0.25)} หน่วย</div>
              </div>
              <input
                type="checkbox"
                checked={hasSwift}
                onChange={(e) => setHasSwift(e.target.checked)}
                className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
              />
            </div>

            {/* Speed Leader Options */}
            <div>
              <div className="font-bold text-slate-300 mb-1.5">
                ลีดเดอร์สกิลความเร็ว (Speed Lead):
              </div>
              <div className="grid grid-cols-4 gap-2 font-mono">
                {[0, 19, 24, 33].map((lead) => (
                  <button
                    key={lead}
                    type="button"
                    onClick={() => setSpeedLead(lead)}
                    className={`py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                      speedLead === lead
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#0c121c] border border-[#1d2b3f] text-slate-300 hover:text-white'
                    }`}
                  >
                    {lead === 0 ? 'ไม่มี' : `+${lead}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Combat SPD Buff */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0c121c] border border-[#1d2b3f]">
              <div>
                <div className="font-bold text-slate-200">มีบัฟความเร็วในการต่อสู้ (+33%)</div>
                <div className="text-xs text-slate-400">จากสกิลของ Vigor, Eshir, Bernard ฯลฯ</div>
              </div>
              <input
                type="checkbox"
                checked={hasSpdBuff}
                onChange={(e) => setHasSpdBuff(e.target.checked)}
                className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Results Panel (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#101724] p-6 rounded-2xl border border-[#1d2b3f] space-y-4">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              ผลการคำนวณความเร็วจริงในสนามแข่ง
            </span>

            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-black text-white font-mono">
                {totalCombatSpd}
              </span>
              <span className="text-base font-bold text-slate-400 font-mono">COMBAT SPD</span>
            </div>

            <div className="p-4 rounded-xl bg-[#0c121c] border border-[#1d2b3f] flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400">ช่วงทิกปัจจุบัน (Current Bracket):</div>
                <div className="text-base font-black text-cyan-300">{currentBracket.tick}</div>
              </div>
              <div className="text-right text-xs text-slate-400 max-w-xs">
                {currentBracket.desc}
              </div>
            </div>

            {/* Breakdown */}
            <div className="pt-3 border-t border-[#1d2b3f] space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between text-slate-300">
                <span>ความเร็วแสดงในหน้าไอดี:</span>
                <span className="font-mono font-bold text-white">{baseSpd + runeSpd} ({baseSpd} + {runeSpd})</span>
              </div>
              {hasSwift && (
                <div className="flex justify-between text-slate-300">
                  <span>โบนัสรูน Swift (25%):</span>
                  <span className="font-mono font-bold text-blue-400">+{swiftBonus}</span>
                </div>
              )}
              {speedLead > 0 && (
                <div className="flex justify-between text-slate-300">
                  <span>โบนัสลีดเดอร์สกิล ({speedLead}%):</span>
                  <span className="font-mono font-bold text-amber-400">+{leadBonus}</span>
                </div>
              )}
              {hasSpdBuff && (
                <div className="flex justify-between text-slate-300">
                  <span>โบนัสบัฟความเร็ว (+33%):</span>
                  <span className="font-mono font-bold text-emerald-400">+{totalCombatSpd - combatSpdBeforeBuff}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tick Table Reference */}
          <div className="bg-[#101724] p-5 rounded-2xl border border-[#1d2b3f] space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              เกณฑ์ความเร็ว Speed Tick มาตรฐานการแข่งขัน
            </h3>

            <div className="space-y-2 text-xs sm:text-sm">
              {tickBrackets.map((tb, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border flex items-center justify-between ${
                    totalCombatSpd >= tb.minCombatSpd && (idx === 0 || totalCombatSpd < tickBrackets[idx - 1].minCombatSpd)
                      ? 'bg-cyan-950/40 border-cyan-500/50 text-white'
                      : 'bg-[#0c121c] border-[#1d2b3f] text-slate-400'
                  }`}
                >
                  <div>
                    <div className="font-bold text-slate-200">{tb.tick}</div>
                    <div className="text-xs text-slate-400">{tb.desc}</div>
                  </div>
                  <div className="font-mono font-bold text-cyan-400 text-sm">
                    &ge; {tb.minCombatSpd} SPD
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
