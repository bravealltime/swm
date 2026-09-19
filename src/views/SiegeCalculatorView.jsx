import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  Trophy, 
  Clock, 
  Flame, 
  ShieldAlert, 
  RotateCcw, 
  TrendingUp, 
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Swords,
  Shield
} from 'lucide-react';

export default function SiegeCalculatorView() {
  const [guilds, setGuilds] = useState([
    { id: 'red', name: 'กิลด์สีแดง (Red)', color: 'rose', score: 14500, bases: 11 },
    { id: 'blue', name: 'กิลด์สีฟ้า (Blue)', color: 'sky', score: 16200, bases: 14 },
    { id: 'yellow', name: 'กิลด์สีเหลือง (Yellow)', color: 'amber', score: 12800, bases: 11 },
  ]);

  // Points calculation helper
  // Base rate: 10 pts per base per min
  // Over-cap bonus: When holding >= 13 bases, +15 bonus pts per base above 12
  const getPointsPerMinute = (bases) => {
    const basePts = bases * 10;
    const bonusBases = Math.max(0, bases - 12);
    const bonusPts = bonusBases * 15;
    return basePts + bonusPts;
  };

  const calculations = useMemo(() => {
    return guilds.map(g => {
      const ppm = getPointsPerMinute(g.bases);
      const pointsNeeded = Math.max(0, 20000 - g.score);
      const minutesToWin = ppm > 0 ? Math.ceil(pointsNeeded / ppm) : Infinity;

      return {
        ...g,
        ppm,
        pph: ppm * 60,
        pointsNeeded,
        minutesToWin,
        isFinished: g.score >= 20000
      };
    }).sort((a, b) => a.minutesToWin - b.minutesToWin);
  }, [guilds]);

  const winner = calculations[0];
  const secondPlace = calculations[1];

  // Update single guild
  const handleUpdate = (id, field, val) => {
    setGuilds(prev => prev.map(g => {
      if (g.id !== id) return g;
      return {
        ...g,
        [field]: field === 'name' ? val : Math.max(0, Number(val))
      };
    }));
  };

  // Presets
  const handleSetPreset = (type) => {
    if (type === 'balanced') {
      setGuilds([
        { id: 'red', name: 'ทีมสีแดง', color: 'rose', score: 10000, bases: 12 },
        { id: 'blue', name: 'ทีมสีฟ้า', color: 'sky', score: 10500, bases: 12 },
        { id: 'yellow', name: 'ทีมสีเหลือง', color: 'amber', score: 9800, bases: 12 },
      ]);
    } else if (type === 'blueLeader') {
      setGuilds([
        { id: 'red', name: 'ทีมสีแดง', color: 'rose', score: 13200, bases: 10 },
        { id: 'blue', name: 'ทีมสีฟ้า (นำโด่ง)', color: 'sky', score: 17100, bases: 16 },
        { id: 'yellow', name: 'ทีมสีเหลือง', color: 'amber', score: 11400, bases: 10 },
      ]);
    } else if (type === 'endgame') {
      setGuilds([
        { id: 'red', name: 'ทีมสีแดง', color: 'rose', score: 18500, bases: 11 },
        { id: 'blue', name: 'ทีมสีฟ้า', color: 'sky', score: 18900, bases: 14 },
        { id: 'yellow', name: 'ทีมสีเหลือง', color: 'amber', score: 16200, bases: 11 },
      ]);
    }
  };

  const formatTime = (minutes) => {
    if (minutes === Infinity || isNaN(minutes)) return 'ไม่มีวันถึง (0 ฐาน)';
    if (minutes <= 0) return 'ชนะแล้ว!';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs === 0) return `${mins} นาที`;
    return `${hrs} ชั่วโมง ${mins} นาที`;
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-[#1c2738] pb-5">
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1">
          <Calculator className="w-4 h-4" />
          Siege Calculator & Victory Prediction • เครื่องคำนวณยุทธวิธีชิง 20,000 แต้ม
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          เครื่องคำนวณคะแนนศึกยึดเกาะ (Siege Battle Calculator)
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
          จำลองสถานการณ์คะแนน 3 กิลด์ คำนวณแต้มต่อนาที (Tick Rate) เวลาที่เหลือจนกว่าจะคว้าชัยชนะ 20,000 คะแนน และวิเคราะห์จำนวนฐานที่ต้องตัดเพื่อพลิกสถานการณ์
        </p>
      </div>

      {/* Preset Scenarios */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-[#101724] border border-[#1d2b3f] rounded-2xl">
        <span className="text-xs font-bold text-slate-400 mr-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          โหลดสถานการณ์จำลอง:
        </span>
        <button
          onClick={() => handleSetPreset('blueLeader')}
          className="px-3 py-1.5 rounded-lg bg-[#0c121c] hover:bg-[#152030] text-slate-200 border border-[#1d2b3f] text-xs font-bold transition-all cursor-pointer"
        >
          💥 ทีมฟ้านำโด่ง (16 ฐาน)
        </button>
        <button
          onClick={() => handleSetPreset('balanced')}
          className="px-3 py-1.5 rounded-lg bg-[#0c121c] hover:bg-[#152030] text-slate-200 border border-[#1d2b3f] text-xs font-bold transition-all cursor-pointer"
        >
          ⚖️ สูสี 3 ฝ่าย (12 vs 12 vs 12)
        </button>
        <button
          onClick={() => handleSetPreset('endgame')}
          className="px-3 py-1.5 rounded-lg bg-[#0c121c] hover:bg-[#152030] text-slate-200 border border-[#1d2b3f] text-xs font-bold transition-all cursor-pointer"
        >
          🔥 โค้งสุดท้าย (18,000+ แต้ม)
        </button>
      </div>

      {/* Inputs Grid for 3 Guilds */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {guilds.map((g) => {
          const ppm = getPointsPerMinute(g.bases);
          const borderColor = 
            g.color === 'rose' ? 'border-rose-500/40' :
            g.color === 'sky' ? 'border-sky-500/40' : 'border-amber-500/40';
          const badgeBg =
            g.color === 'rose' ? 'bg-rose-500/20 text-rose-400' :
            g.color === 'sky' ? 'bg-sky-500/20 text-sky-400' : 'bg-amber-500/20 text-amber-400';

          return (
            <div 
              key={g.id}
              className={`bg-[#101724] border ${borderColor} p-5 rounded-2xl space-y-4 shadow-xl relative overflow-hidden`}
            >
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  value={g.name}
                  onChange={(e) => handleUpdate(g.id, 'name', e.target.value)}
                  className="bg-transparent text-white font-black text-base border-b border-transparent hover:border-slate-500 focus:border-cyan-400 focus:outline-none px-1"
                />
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${badgeBg}`}>
                  {g.color}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                {/* Score Input */}
                <div>
                  <div className="flex justify-between font-bold text-slate-300 mb-1">
                    <span>คะแนนปัจจุบัน:</span>
                    <span className="font-mono font-black text-sm text-white">{g.score.toLocaleString()} / 20,000</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20000"
                    step="100"
                    value={g.score}
                    onChange={(e) => handleUpdate(g.id, 'score', e.target.value)}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                  <input
                    type="number"
                    min="0"
                    max="20000"
                    value={g.score}
                    onChange={(e) => handleUpdate(g.id, 'score', e.target.value)}
                    className="w-full mt-1 bg-[#0c121c] border border-[#1d2b3f] rounded-lg px-3 py-1.5 text-white font-mono font-bold text-right"
                  />
                </div>

                {/* Bases Input */}
                <div>
                  <div className="flex justify-between font-bold text-slate-300 mb-1">
                    <span>จำนวนฐานที่ครอง:</span>
                    <span className="font-mono font-black text-sm text-cyan-400">{g.bases} ฐาน</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={g.bases}
                    onChange={(e) => handleUpdate(g.id, 'bases', e.target.value)}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-0.5">
                    <span>0 ฐาน</span>
                    <span>12 ฐาน (สมดุล)</span>
                    <span>30 ฐาน</span>
                  </div>
                </div>

                {/* Live tick stats for this guild */}
                <div className="pt-2 border-t border-[#182333] space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">อัตราเพิ่มแต้ม:</span>
                    <span className="font-mono font-bold text-emerald-400">+{ppm} แต้ม/นาที</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">อัตราต่อชั่วโมง:</span>
                    <span className="font-mono font-bold text-slate-300">+{ppm * 60} แต้ม/ชม.</span>
                  </div>
                  {g.bases >= 13 && (
                    <div className="text-[11px] text-amber-400 font-bold bg-amber-500/10 p-1.5 rounded border border-amber-500/20">
                      ⚡ ได้รับโบนัส Over-cap (+{(g.bases - 12) * 15} แต้ม/นาที)
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Victory Analysis & Prediction Banner */}
      <div className="bg-gradient-to-r from-[#101724] via-[#131f33] to-[#101724] border border-[#1d2b3f] rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6 text-amber-400" />
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white">
              ผลวิเคราะห์ทำนายชัยชนะ (Victory Projection)
            </h2>
            <p className="text-xs text-slate-400">
              คำนวณตามสถานะฐานและอัตราการเพิ่มแต้มในปัจจุบัน
            </p>
          </div>
        </div>

        {/* Winner Callout Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {calculations.map((res, rankIdx) => {
            const isFirst = rankIdx === 0;
            return (
              <div 
                key={res.id}
                className={`p-4 rounded-xl border flex flex-col justify-between ${
                  isFirst 
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/10' 
                    : 'bg-[#0c121c] border-[#1d2b3f]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      {isFirst ? '🥇 อันดับ 1 (จะชนะก่อน)' : rankIdx === 1 ? '🥈 อันดับ 2' : '🥉 อันดับ 3'}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-400">
                      {res.score.toLocaleString()} แต้ม
                    </span>
                  </div>
                  <div className="text-base font-black text-white">{res.name}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    เหลืออีก <strong className="text-white font-mono">{res.pointsNeeded.toLocaleString()}</strong> แต้ม
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#1d2b3f] flex items-center justify-between">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" /> เวลาที่ใช้:
                  </span>
                  <span className={`text-sm font-mono font-black ${isFirst ? 'text-amber-400' : 'text-slate-300'}`}>
                    {formatTime(res.minutesToWin)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tactical Strategy Recommendation */}
        <div className="bg-[#0c121c] border border-cyan-500/30 rounded-xl p-4 flex items-start gap-3 mt-4">
          <ShieldAlert className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-relaxed space-y-1">
            <div className="font-bold text-cyan-300 text-sm">💡 คำแนะนำยุทธวิธีสำหรับกิลด์ตามหลัง:</div>
            <div>
              • <strong>{winner.name}</strong> จะคว้า 20,000 คะแนน ในอีกประมาณ <strong>{formatTime(winner.minutesToWin)}</strong> ด้วยอัตราปัจจุบัน (+{winner.ppm} แต้ม/นาที)
            </div>
            {winner.bases >= 13 && secondPlace && (
              <div>
                • เพื่อหยุดไม่ให้ {winner.name} ชนะเร็วเกินไป กิลด์ฝ่ายตรงข้ามต้องร่วมกันตัดฐานของ {winner.name} ให้เหลือไม่เกิน <strong>11-12 ฐาน</strong> เพื่อยกเลิกโบนัส Over-cap ทันที
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
