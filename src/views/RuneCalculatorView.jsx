import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  RotateCcw, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Gem, 
  ArrowRight, 
  Flame, 
  Info,
  Layers,
  ChevronRight,
  TrendingUp,
  Sliders
} from 'lucide-react';
import { evaluateRuneForReapp, scanBoxForReappCandidates, SET_TIERS } from '../utils/reappEvaluator';
import { loadBox } from '../utils/swexImport';

const MAIN_STATS_BY_SLOT = {
  1: ['Flat ATK'],
  2: ['SPD', 'HP%', 'DEF%', 'ATK%', 'Flat HP', 'Flat DEF', 'Flat ATK'],
  3: ['Flat DEF'],
  4: ['CRI Dmg', 'HP%', 'DEF%', 'CRI Rate', 'ATK%', 'Flat HP', 'Flat DEF', 'Flat ATK'],
  5: ['Flat HP'],
  6: ['HP%', 'ATK%', 'DEF%', 'ACC', 'RES', 'Flat HP', 'Flat DEF', 'Flat ATK']
};

const INNATE_OPTIONS = [
  { value: '', label: 'ไม่มี (None)' },
  { value: 'Flat HP', label: 'Flat HP (ดีมาก - ตัดออปแบน)' },
  { value: 'Flat DEF', label: 'Flat DEF (ดีมาก - ตัดออปแบน)' },
  { value: 'Flat ATK', label: 'Flat ATK (ดีมาก - ตัดออปแบน)' },
  { value: 'ACC', label: 'ACC % (ดี - ตัดออปแม่นยำ)' },
  { value: 'RES', label: 'RES % (ดี - ตัดออปต้านทาน)' },
  { value: 'HP%', label: 'HP %' },
  { value: 'ATK%', label: 'ATK %' },
  { value: 'DEF%', label: 'DEF %' },
  { value: 'CRI Rate', label: 'CRI Rate %' },
  { value: 'CRI Dmg', label: 'CRI Dmg %' },
  { value: 'SPD', label: 'SPD (หายาก)' },
];

export default function RuneCalculatorView({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('efficiency'); // 'efficiency' | 'reapp' | 'box-scan'
  
  // Tab 1: Efficiency state
  const [slot, setSlot] = useState(4);
  const [substats, setSubstats] = useState([
    { type: 'spd', name: 'ความเร็ว (SPD)', value: 18, grind: 4, maxRoll: 6, maxGrind: 5 },
    { type: 'crate', name: 'อัตราคริ (CRIT Rate %)', value: 12, grind: 0, maxRoll: 6, maxGrind: 0 },
    { type: 'hp', name: 'พลังชีวิต (HP %)', value: 14, grind: 7, maxRoll: 8, maxGrind: 10 },
    { type: 'atk', name: 'พลังโจมตี (ATK %)', value: 12, grind: 5, maxRoll: 8, maxGrind: 10 },
  ]);

  // Tab 2: Reapp Evaluator state
  const [reappSet, setReappSet] = useState('Violent');
  const [reappSlot, setReappSlot] = useState(4);
  const [reappMainStat, setReappMainStat] = useState('CRI Dmg');
  const [reappInnate, setReappInnate] = useState('Flat HP');
  const [reappCurrentEff, setReappCurrentEff] = useState(82);
  const [reappCurrentSpd, setReappCurrentSpd] = useState(5);

  // Tab 3: Account box runes
  const userBox = useMemo(() => loadBox(), []);
  const boxReappCandidates = useMemo(() => {
    return scanBoxForReappCandidates(userBox, 15);
  }, [userBox]);

  // Calculate Efficiency & Max Potential
  const { currentEff, maxPotentialEff, missingGrinds } = useMemo(() => {
    let currentScore = 1.0;
    let maxScore = 1.0;
    const missing = [];

    substats.forEach(sub => {
      const curTotal = sub.value + (sub.grind || 0);
      currentScore += curTotal / (sub.maxRoll * 4);

      const maxTotal = sub.value + sub.maxGrind;
      maxScore += maxTotal / (sub.maxRoll * 4);

      if (sub.maxGrind > 0 && (sub.grind || 0) < sub.maxGrind) {
        missing.push({
          name: sub.name,
          diff: sub.maxGrind - (sub.grind || 0)
        });
      }
    });

    const cur = Math.min(125, Math.max(50, Number(((currentScore / 2.8) * 100).toFixed(1))));
    const max = Math.min(125, Math.max(cur, Number(((maxScore / 2.8) * 100).toFixed(1))));

    return { currentEff: cur, maxPotentialEff: max, missingGrinds: missing };
  }, [substats]);

  const getTierLabel = (eff) => {
    if (eff >= 105) return { label: 'ระดับพระเจ้า (God-Tier 105%+)', color: 'text-pink-400 bg-pink-950/40 border-pink-500/40' };
    if (eff >= 100) return { label: 'ระดับแข่งขันระดับโลก (Guardian / Tourney 100-104%)', color: 'text-amber-300 bg-amber-950/40 border-amber-500/40' };
    if (eff >= 90) return { label: 'ระดับยอดเยี่ยม (Legendary 90-99%)', color: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/40' };
    if (eff >= 80) return { label: 'ระดับดีมาก (Heroic 80-89%)', color: 'text-blue-400 bg-blue-950/40 border-blue-500/40' };
    return { label: 'ระดับใช้งานทั่วไป (< 80%)', color: 'text-slate-400 bg-slate-900 border-slate-700' };
  };

  const currentTier = getTierLabel(currentEff);
  const maxTier = getTierLabel(maxPotentialEff);

  const updateSubstat = (index, field, val) => {
    const updated = [...substats];
    updated[index][field] = Number(val);
    setSubstats(updated);
  };

  // Live Reapp Evaluation
  const reappResult = useMemo(() => {
    return evaluateRuneForReapp({
      set: reappSet,
      slot: Number(reappSlot),
      stars: 6,
      originalQuality: 'Legend',
      mainStat: reappMainStat,
      innateStat: reappInnate || null,
      currentEfficiency: Number(reappCurrentEff),
      currentSpd: Number(reappCurrentSpd)
    });
  }, [reappSet, reappSlot, reappMainStat, reappInnate, reappCurrentEff, reappCurrentSpd]);

  // Change slot in Reapp view
  const handleReappSlotChange = (newSlot) => {
    setReappSlot(newSlot);
    const availableMains = MAIN_STATS_BY_SLOT[newSlot] || ['HP%'];
    setReappMainStat(availableMains[0]);
  };

  return (
    <div className="space-y-6 pb-16 max-w-[1780px] 2xl:max-w-[1880px] mx-auto animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-r from-[#0c1424] via-[#0d172e] to-[#070b12] p-6 sm:p-8 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-mono font-bold uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Summoners War • Rune Mastery & Reapp Lab</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            เครื่องคำนวณประสิทธิภาพรูน & ประเมินหินรีออปชั่น (Reapp)
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
            คำนวณคะแนนประสิทธิภาพรูนแท้จริง ประเมินศักยภาพเมื่อขัดหินตำนานเต็ม (Max Potential) และวิเคราะห์ว่ารูนชิ้นไหนในไอดีคุ้มค่าที่จะใช้หินรีออปชั่น (Reappraisal Stone) มากที่สุด
          </p>
        </div>

        {/* Action / Mode Selector */}
        <div className="relative z-10 flex items-center gap-2 bg-white/[0.03] p-1.5 rounded-2xl border border-white/10 shrink-0">
          <button
            onClick={() => setActiveTab('efficiency')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'efficiency'
                ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>คะแนนประสิทธิภาพ</span>
          </button>

          <button
            onClick={() => setActiveTab('reapp')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'reapp'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>ประเมินหินรี (Reapp)</span>
          </button>

          <button
            onClick={() => setActiveTab('box-scan')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'box-scan'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>สแกนรูนในกล่อง {userBox?.runes?.length ? `(${userBox.runes.length})` : ''}</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Rune Efficiency & Grind Optimization */}
      {activeTab === 'efficiency' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Input Panel */}
          <div className="lg:col-span-7 bg-[#101724] border border-[#1d2b3f] p-5 sm:p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1d2b3f]">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-pink-400" />
                <h2 className="text-base font-bold text-white">กรอกค่าออปชั่นย่อย (Substats)</h2>
              </div>
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
                <RotateCcw className="w-3.5 h-3.5" /> รีเซ็ตตัวอย่าง
              </button>
            </div>

            <div className="space-y-3">
              {substats.map((sub, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-[#0c121c] border border-[#1d2b3f] space-y-2">
                  <div className="flex justify-between items-center text-xs sm:text-sm font-bold text-slate-200">
                    <span>{sub.name}</span>
                    <span className="text-slate-400">
                      รวมปัจจุบัน: <strong className="text-white font-mono font-bold">{sub.value + (sub.grind || 0)}</strong>
                      {sub.maxGrind > 0 && (
                        <span className="ml-2 text-pink-400 text-xs font-normal">
                          (ขัดเต็ม Max: {sub.value + sub.maxGrind})
                        </span>
                      )}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">ค่าสเตตัสดิบ (Base Sub):</label>
                      <input
                        type="number"
                        min="0"
                        max="35"
                        value={sub.value}
                        onChange={(e) => updateSubstat(idx, 'value', e.target.value)}
                        className="w-full bg-[#131b26] border border-[#1d2b3f] rounded-lg px-3 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-pink-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">ค่าหินขัดปัจจุบัน (Grind):</label>
                      <input
                        type="number"
                        min="0"
                        max={sub.maxGrind}
                        disabled={sub.maxGrind === 0}
                        value={sub.grind}
                        onChange={(e) => updateSubstat(idx, 'grind', e.target.value)}
                        className="w-full bg-[#131b26] border border-[#1d2b3f] rounded-lg px-3 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-pink-500 disabled:opacity-30"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#101724] border border-[#1d2b3f] p-6 rounded-2xl text-center space-y-4 shadow-xl">
              <span className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>คะแนนประสิทธิภาพรวมปัจจุบัน (Current Efficiency)</span>
              </span>

              <div className="text-5xl sm:text-6xl font-black text-white font-mono tracking-tight">
                {currentEff}%
              </div>

              <div className={`p-3 rounded-xl border text-xs sm:text-sm font-bold ${currentTier.color}`}>
                {currentTier.label}
              </div>

              {/* Potential with Legend Grinds */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-pink-950/30 to-purple-950/30 border border-pink-500/20 text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-pink-300">ศักยภาพเมื่อขัดหินตำนานเต็ม (Max Grind):</span>
                  <span className="text-lg font-mono font-black text-pink-400">{maxPotentialEff}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-400"
                    style={{ width: `${Math.min(100, (maxPotentialEff / 115) * 100)}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-300">
                  {missingGrinds.length > 0 ? (
                    <span>
                      💡 เพิ่มได้อีก <strong>+{(maxPotentialEff - currentEff).toFixed(1)}%</strong> โดยการขัดหินตำนานเพิ่มใน: {missingGrinds.map(m => `${m.name} (+${m.diff})`).join(', ')}
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-bold">✨ รูนชิ้นนี้ขัดหินระดับตำนานเต็มทุกช่องแล้ว!</span>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-400 text-left leading-relaxed">
                * คำนวณตามมาตรฐานสูตรสากลของ Com2uS (รูน 100%+ คือรูนระดับ Legend ที่โรลสูงเกือบเต็มทุกครั้ง เหมาะสำหรับระดับ Guardian และ Siege Tournament)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Reappraisal Stone Evaluator */}
      {activeTab === 'reapp' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Config Panel */}
          <div className="lg:col-span-7 bg-[#101724] border border-[#1d2b3f] p-5 sm:p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1d2b3f]">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-amber-400" />
                <h2 className="text-base font-bold text-white">ตั้งค่าสเตตัสรูนที่ต้องการรี (Rune Setup)</h2>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                6★ Legend Only
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Rune Set */}
              <div>
                <label className="text-xs text-slate-400 block mb-1.5 font-semibold">เซ็ตรูน (Rune Set):</label>
                <select
                  value={reappSet}
                  onChange={(e) => setReappSet(e.target.value)}
                  className="w-full bg-[#131b26] border border-[#1d2b3f] rounded-xl px-3 py-2.5 text-sm text-white font-bold focus:outline-none focus:border-amber-500"
                >
                  {Object.keys(SET_TIERS).map(setName => (
                    <option key={setName} value={setName}>
                      {setName} ({SET_TIERS[setName].tier} Tier)
                    </option>
                  ))}
                </select>
              </div>

              {/* Slot */}
              <div>
                <label className="text-xs text-slate-400 block mb-1.5 font-semibold">ตำแหน่งช่อง (Slot 1-6):</label>
                <div className="grid grid-cols-6 gap-1.5">
                  {[1, 2, 3, 4, 5, 6].map(s => (
                    <button
                      key={s}
                      onClick={() => handleReappSlotChange(s)}
                      className={`py-2 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all ${
                        reappSlot === s
                          ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                          : 'bg-[#131b26] border border-[#1d2b3f] text-slate-300 hover:text-white'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Stat */}
              <div>
                <label className="text-xs text-slate-400 block mb-1.5 font-semibold">ออปหลัก (Main Stat):</label>
                <select
                  value={reappMainStat}
                  onChange={(e) => setReappMainStat(e.target.value)}
                  className="w-full bg-[#131b26] border border-[#1d2b3f] rounded-xl px-3 py-2.5 text-sm text-white font-bold focus:outline-none focus:border-amber-500"
                >
                  {(MAIN_STATS_BY_SLOT[reappSlot] || ['HP%']).map(main => (
                    <option key={main} value={main}>{main}</option>
                  ))}
                </select>
              </div>

              {/* Innate Stat */}
              <div>
                <label className="text-xs text-slate-400 block mb-1.5 font-semibold">ออปถาวร (Innate Substat):</label>
                <select
                  value={reappInnate}
                  onChange={(e) => setReappInnate(e.target.value)}
                  className="w-full bg-[#131b26] border border-[#1d2b3f] rounded-xl px-3 py-2.5 text-sm text-white font-bold focus:outline-none focus:border-amber-500"
                >
                  {INNATE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Current Efficiency */}
              <div>
                <label className="text-xs text-slate-400 block mb-1.5 font-semibold">ประสิทธิภาพปัจจุบัน (%):</label>
                <input
                  type="number"
                  min="50"
                  max="120"
                  value={reappCurrentEff}
                  onChange={(e) => setReappCurrentEff(e.target.value)}
                  className="w-full bg-[#131b26] border border-[#1d2b3f] rounded-xl px-3 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Current SPD */}
              <div>
                <label className="text-xs text-slate-400 block mb-1.5 font-semibold">สปีดปัจจุบัน (Current SPD):</label>
                <input
                  type="number"
                  min="0"
                  max="35"
                  value={reappCurrentSpd}
                  onChange={(e) => setReappCurrentSpd(e.target.value)}
                  className="w-full bg-[#131b26] border border-[#1d2b3f] rounded-xl px-3 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Invariable Stat Advice Box */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 leading-relaxed space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-300">
                <Info className="w-3.5 h-3.5" />
                <span>ทำไม Innate Stat ถึงส่งผลต่อการรีออปชั่นมหาศาล?</span>
              </div>
              <p>
                ใน Summoners War ออปถาวร (Innate) จะไม่มีวันเปลี่ยนและ<strong>ไม่มีวันซ้ำกับ 4 ออปชั่นย่อย</strong> การมี Innate เป็น Flat HP/DEF/ATK หรือ RES/ACC จะช่วยตัดออปที่แย่ออกจาก Pool ทำให้โอกาสที่รูนจะโรลไปลง <strong>Quad SPD หรือ Triple ATK%/CR% สูงขึ้นถึง 25%!</strong>
              </p>
            </div>
          </div>

          {/* Reapp Result Card */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#101724] border border-[#1d2b3f] p-6 rounded-2xl space-y-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  ผลการประเมินความคุ้มค่าหินรี (Reapp Score)
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-mono font-black border ${
                  reappResult.grade === 'SSS' ? 'bg-pink-500/20 text-pink-300 border-pink-500/40' :
                  reappResult.grade === 'SS' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                  reappResult.grade === 'S' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                  reappResult.grade === 'PROTECT' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                  'bg-slate-700 text-slate-300 border-slate-600'
                }`}>
                  GRADE {reappResult.grade}
                </span>
              </div>

              <div className="text-center space-y-1">
                <div className="text-6xl font-black text-white font-mono tracking-tight">
                  {reappResult.score} <span className="text-xl text-slate-400 font-sans">/ 100</span>
                </div>
                <div className="text-sm font-bold text-amber-300">{reappResult.recommendation}</div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div 
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    reappResult.score >= 90 ? 'bg-gradient-to-r from-pink-500 to-amber-400' :
                    reappResult.score >= 75 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
                    'bg-gradient-to-r from-blue-500 to-slate-400'
                  }`}
                  style={{ width: `${reappResult.score}%` }}
                />
              </div>

              {/* Pros & Cons */}
              <div className="space-y-2 text-xs">
                <div className="font-bold text-slate-300">จุดเด่นที่คุ้มค่า:</div>
                <div className="space-y-1.5">
                  {reappResult.pros.map((p, i) => (
                    <div key={i} className="flex items-start gap-2 text-emerald-300 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{p}</span>
                    </div>
                  ))}
                </div>

                {reappResult.cons.length > 0 && (
                  <>
                    <div className="font-bold text-slate-300 pt-1">ข้อควรระวัง:</div>
                    <div className="space-y-1.5">
                      {reappResult.cons.map((c, i) => (
                        <div key={i} className="flex items-start gap-2 text-rose-300 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>{c}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Account Box Reapp Scanner */}
      {activeTab === 'box-scan' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#101724] border border-[#1d2b3f] p-5 sm:p-6 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span>รูน 6 ดาวระดับ Legend ที่คุ้มค่าการรีที่สุดในไอดี (Top Reapp Targets)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  ระบบคัดกรองรูน 6★ Legend ทั้งหมดในไอดี กรองรูนขยะออก และจัดอันดับรูนที่คู่ควรแก่การเอาหินรีไปลง
                </p>
              </div>

              {userBox?.runes?.length ? (
                <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl font-bold font-mono">
                  สแกนแล้ว {userBox.runes.length} ชิ้น • พบรูนเป้าหมาย {boxReappCandidates.length} ชิ้น
                </div>
              ) : (
                <button
                  onClick={() => onNavigate && onNavigate('my-box')}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/30"
                >
                  <span>นำเข้าไฟล์ SWEX ก่อน</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* List of Reapp Candidates */}
            {boxReappCandidates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                {boxReappCandidates.map((c, idx) => (
                  <div 
                    key={idx}
                    className="p-4 rounded-xl bg-[#0c121c] border border-white/[0.08] hover:border-amber-500/40 transition-all space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-white text-sm">{c.set} ช่อง {c.slot}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        คะแนน {c.score}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 space-y-1 bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.04]">
                      <div className="flex justify-between">
                        <span className="text-slate-400">ออปหลัก:</span>
                        <span className="font-bold text-white">{c.mainStat}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">ออปถาวร (Innate):</span>
                        <span className={c.innateStat ? 'text-amber-300 font-bold' : 'text-slate-500'}>
                          {c.innateStat || 'ไม่มี'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">อยู่ที่:</span>
                        <span className="text-slate-300 truncate max-w-[140px]">{c.equippedMonster}</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-amber-200/90 flex items-center gap-1.5 font-medium">
                      <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>{c.recommendation}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : userBox?.runes?.length ? (
              // runes were scanned, none is worth a stone: every 6★ Legend is either protected or scores under 60
              <div className="p-8 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/20 text-center space-y-2">
                <div className="text-sm font-bold text-emerald-300">สแกน {userBox.runes.length} ชิ้นแล้ว — ไม่มีรูนที่คุ้มค่าหินรี</div>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  รูน 6★ Legend ของคุณเป็นชิ้นที่ควรเก็บไว้ (SPD สูงหรือประสิทธิภาพเกิน 100%) หรือเป็นเซ็ต/ช่องที่รีแล้วไม่คุ้ม ระบบจึงไม่แนะนำให้รีชิ้นไหน — นำเข้าไฟล์ SWEX ใหม่หลังได้รูนเพิ่มแล้วสแกนอีกครั้ง
                </p>
              </div>
            ) : (
              <div className="p-8 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center space-y-2">
                <div className="text-sm font-bold text-slate-300">ยังไม่มีข้อมูลรูนในระบบ</div>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  อัปโหลดไฟล์ JSON จาก SWEX ที่หน้า "กล่องมอนสเตอร์ของฉัน" เพื่อให้ระบบสแกนรูน 6★ Legend ทั้งหมดและแนะนำรูนที่ควรเอาหินรีไปใช้ทันที
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => onNavigate && onNavigate('my-box')}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>ไปที่หน้ากล่องของฉัน (My Box)</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
