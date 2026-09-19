import React, { useState, useMemo } from 'react';
import { 
  Zap, 
  Target, 
  CheckCircle2, 
  AlertTriangle, 
  Sliders, 
  Gauge, 
  Clock, 
  Sparkles,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { 
  ABYSS_DUNGEONS, 
  NUKER_PRESETS, 
  calculateAbyssDamage, 
  calculateCombatSpeed 
} from '../utils/abyssDamageCalculator';

export default function AbyssCalculatorPanel() {
  const [selectedDungeonId, setSelectedDungeonId] = useState('giant');
  const [selectedNukerName, setSelectedNukerName] = useState('Teshar');

  // Stat sliders
  const [totalAtk, setTotalAtk] = useState(2850);
  const [critDmg, setCritDmg] = useState(215);
  const [artifactSkillCd, setArtifactSkillCd] = useState(15);
  const [artifactDmgOnElement, setArtifactDmgOnElement] = useState(14);
  const [hasAtkBuff, setHasAtkBuff] = useState(true);
  const [hasDefBreak, setHasDefBreak] = useState(true);
  const [fightSetsCount, setFightSetsCount] = useState(2);

  // Speed tuning
  const [runeSpd, setRuneSpd] = useState(82);
  const [speedLead, setSpeedLead] = useState(24); // 24% or 33%
  const [speedTotem, setSpeedTotem] = useState(15); // 15% standard max

  const dungeon = useMemo(() => 
    ABYSS_DUNGEONS.find(d => d.id === selectedDungeonId) || ABYSS_DUNGEONS[0],
    [selectedDungeonId]
  );

  const nuker = useMemo(() => 
    NUKER_PRESETS.find(n => n.name === selectedNukerName) || NUKER_PRESETS[0],
    [selectedNukerName]
  );

  const damageResult = useMemo(() => {
    return calculateAbyssDamage({
      nuker,
      dungeon,
      totalAtk,
      critDmg,
      artifactSkillCd,
      artifactDmgOnElement,
      hasAtkBuff,
      hasDefBreak,
      fightSetsCount,
    });
  }, [nuker, dungeon, totalAtk, critDmg, artifactSkillCd, artifactDmgOnElement, hasAtkBuff, hasDefBreak, fightSetsCount]);

  const combatSpeed = useMemo(() => {
    return calculateCombatSpeed({
      baseSpd: nuker.baseSpd,
      runeSpd,
      speedLead,
      speedTotem,
    });
  }, [nuker, runeSpd, speedLead, speedTotem]);

  return (
    <div className="rounded-3xl border border-white/10 bg-[#0a0f19] p-5 sm:p-7 space-y-6 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider">
            <Sliders className="w-4 h-4" />
            <span>Cairos Speed Run Simulator</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1 flex items-center gap-2">
            เครื่องคำนวณวันช็อต & จูนสปีด Abyss Hard
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            ทดสอบสเตตัส ATK, CRI Dmg, อาร์ติแฟกต์ ว่าสามารถกวาดม็อบ Wave 1–3 ตาย 100% หรือไม่
          </p>
        </div>

        {/* Status Pill */}
        <div className={`px-4 py-2 rounded-2xl border flex items-center gap-2 font-mono font-bold text-sm ${
          damageResult.isOneShot 
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' 
            : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
        }`}>
          {damageResult.isOneShot ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{damageResult.isOneShot ? 'วันช็อตสำเร็จ (100% Pass)' : 'ดาเมจไม่พอ (Failed)'}</span>
        </div>
      </div>

      {/* Select Dungeon & Nuker */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-300 mb-1.5 block">1. เลือกดันเจี้ยน Abyss Hard</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ABYSS_DUNGEONS.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDungeonId(d.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                  selectedDungeonId === d.id
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-sm'
                    : 'bg-white/[0.03] border-white/[0.08] text-slate-400 hover:text-white'
                }`}
              >
                {d.nameTh}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 mb-1.5 block">2. เลือกตัวทำดาเมจหลัก (Nuker)</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {NUKER_PRESETS.map((n) => (
              <button
                key={n.name}
                onClick={() => setSelectedNukerName(n.name)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                  selectedNukerName === n.name
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm'
                    : 'bg-white/[0.03] border-white/[0.08] text-slate-400 hover:text-white'
                }`}
              >
                {n.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sliders & Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-[#070b14] p-4 sm:p-6 rounded-2xl border border-white/[0.06]">
        {/* Left Column: Attack & Damage Sliders */}
        <div className="space-y-4">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>ค่าสเตตัสตัวละคร & อาร์ติแฟกต์</span>
          </div>

          {/* ATK */}
          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-slate-400">ATK รวม (Total ATK)</span>
              <span className="text-amber-400 font-mono text-sm">{totalAtk.toLocaleString()}</span>
            </div>
            <input 
              type="range" 
              min="1500" 
              max="4000" 
              step="25"
              value={totalAtk} 
              onChange={(e) => setTotalAtk(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* CRI Dmg */}
          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-slate-400">CRI Dmg รวม (%)</span>
              <span className="text-purple-300 font-mono text-sm">{critDmg}%</span>
            </div>
            <input 
              type="range" 
              min="100" 
              max="320" 
              step="5"
              value={critDmg} 
              onChange={(e) => setCritDmg(Number(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer"
            />
          </div>

          {/* Artifact Skill CD% */}
          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-slate-400">อาร์ติแฟกต์: สกิล 3 CRI Dmg (%)</span>
              <span className="text-cyan-400 font-mono text-sm">+{artifactSkillCd}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="40" 
              step="1"
              value={artifactSkillCd} 
              onChange={(e) => setArtifactSkillCd(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* Artifact Dmg on Element% */}
          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-slate-400">อาร์ติแฟกต์: ดาเมจต่อธาตุ {dungeon.element} (%)</span>
              <span className="text-emerald-400 font-mono text-sm">+{artifactDmgOnElement}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="35" 
              step="1"
              value={artifactDmgOnElement} 
              onChange={(e) => setArtifactDmgOnElement(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.06]">
            <button
              onClick={() => setHasAtkBuff(!hasAtkBuff)}
              className={`py-2 px-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                hasAtkBuff ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-white/[0.02] border-white/10 text-slate-500'
              }`}
            >
              บัฟ ATK (+50%)
            </button>

            <button
              onClick={() => setHasDefBreak(!hasDefBreak)}
              className={`py-2 px-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                hasDefBreak ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' : 'bg-white/[0.02] border-white/10 text-slate-500'
              }`}
            >
              เจาะเกราะ (-70%)
            </button>

            <div className="flex items-center justify-between px-2 bg-white/[0.02] border border-white/10 rounded-xl text-xs">
              <span className="text-slate-400">Fight x{fightSetsCount}</span>
              <button 
                onClick={() => setFightSetsCount((fightSetsCount + 1) % 6)}
                className="text-cyan-400 font-bold px-1.5 py-0.5 rounded bg-white/5 cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Speed & Turn Order Analysis */}
        <div className="space-y-4">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            <span>การจูนสปีด & ลำดับเทิร์น (Speed Tuning)</span>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-slate-400">SPD จากรูน (+Rune SPD)</span>
              <span className="text-cyan-400 font-mono text-sm">+{runeSpd} (สปีดรวมในเกม {nuker.baseSpd + runeSpd})</span>
            </div>
            <input 
              type="range" 
              min="20" 
              max="180" 
              value={runeSpd} 
              onChange={(e) => setRuneSpd(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <span className="text-slate-400 text-[11px]">สปีดลีดเดอร์ (Lead %)</span>
              <div className="text-sm font-bold text-white mt-1 font-mono">+{speedLead}% Lead</div>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <span className="text-slate-400 text-[11px]">สปีดในแมตช์จริง (Combat SPD)</span>
              <div className="text-lg font-black text-cyan-400 font-mono">{combatSpeed} SPD</div>
            </div>
          </div>

          {/* Turn Order Box */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> ลำดับเทิร์นที่ถูกต้องใน {dungeon.nameTh}
            </div>
            <div className="space-y-1 text-xs text-slate-300">
              {dungeon.turnOrder.map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold flex items-center justify-center text-[10px]">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Result Card & Gauge */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/40 border border-blue-500/20 space-y-3">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div>
            <div className="text-xs text-slate-400">ดาเมจสุทธิที่ทำได้ (Total Net Damage)</div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono flex items-baseline gap-2">
              <span>{damageResult.totalDamage.toLocaleString()}</span>
              <span className="text-xs font-bold text-slate-400">/ เลือดม็อบ {damageResult.targetHp.toLocaleString()}</span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-400">อัตราส่วนดาเมจเทียบเลือด</div>
            <div className={`text-2xl font-black font-mono ${damageResult.isOneShot ? 'text-emerald-400' : 'text-rose-400'}`}>
              {damageResult.percentOfHp}%
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-white/10">
          <div 
            className={`h-full rounded-full transition-all duration-300 ${
              damageResult.isOneShot ? 'bg-emerald-400' : 'bg-rose-500'
            }`}
            style={{ width: `${Math.min(100, damageResult.percentOfHp)}%` }}
          />
        </div>

        {/* Advice Banner */}
        <div className={`p-3 rounded-xl text-xs leading-relaxed border ${
          damageResult.isOneShot 
            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300' 
            : 'bg-rose-500/10 border-rose-500/25 text-rose-300'
        }`}>
          💡 <strong>คำแนะนำจากระบบ:</strong> {damageResult.advice}
        </div>
      </div>
    </div>
  );
}
