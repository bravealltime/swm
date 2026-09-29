import React, { useMemo, useEffect } from 'react';
import {
  X,
  Zap,
  Shield,
  Target,
  Swords,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Flame,
  UserCheck
} from 'lucide-react';
import MonsterAvatar from './MonsterAvatar';
import {
  calculateKillPriority,
  checkWillSafety,
  analyzeTurnOrder,
  findSubstitutes
} from '../utils/siegeTactics';

export default function TacticalBattlePlanModal({
  isOpen,
  onClose,
  counter,
  defense,
  userUnitsMap
}) {
  // Close modal on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  // Resolve user's actual units for the counter
  const matchedUnits = useMemo(() => {
    if (!counter?.monsters || !userUnitsMap) return [];
    return counter.monsters.map((m) => {
      const name = String(m.name || '').toLowerCase().trim();
      const cleanName = name.replace(/\s*\(.*\)$/, '').trim();
      return userUnitsMap.get(name) || userUnitsMap.get(cleanName) || null;
    });
  }, [counter, userUnitsMap]);

  // Turn Order analysis using actual rune speed
  const turnAnalysis = useMemo(() => {
    return analyzeTurnOrder(matchedUnits.filter(Boolean));
  }, [matchedUnits]);

  // Will Safety check
  const willAnalysis = useMemo(() => {
    return checkWillSafety(matchedUnits.filter(Boolean), defense?.defenseMonsters || []);
  }, [matchedUnits, defense]);

  // Kill Priority calculation
  const killPriorities = useMemo(() => {
    return calculateKillPriority(defense?.defenseMonsters || []);
  }, [defense]);

  // Missing monster substitute suggestions (if any unit is missing)
  const substitutes = useMemo(() => {
    if (!counter?.monsters) return [];
    const missingMonsters = counter.monsters.filter((m, idx) => !matchedUnits[idx]);
    if (missingMonsters.length === 0) return [];
    return missingMonsters.map((m) => ({
      missingName: m.name,
      subs: findSubstitutes(m.name, userUnitsMap),
    }));
  }, [counter, matchedUnits, userUnitsMap]);

  const canBuildFully = matchedUnits.every(Boolean);

  if (!isOpen || !counter) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl my-auto bg-gradient-to-b from-[#11192e] via-[#0d1322] to-[#070b14] border border-cyan-500/40 rounded-3xl p-5 sm:p-7 shadow-[0_0_60px_rgba(6,182,212,0.2)] text-slate-100 overflow-hidden space-y-6">
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />

        {/* Header with Close Button */}
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold uppercase tracking-wider mb-2">
              <Zap className="w-3.5 h-3.5" />
              <span>SWM Tactical Battle Plan • วิเคราะห์ยุทธวิธีรบ</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span>สูตรเจาะ: {counter.title}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              เป้าหมาย: <strong className="text-white">{defense?.title || 'บ้านรับเป้าหมาย'}</strong>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer border border-white/10 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Turn Order & Speed Gap Analysis */}
        <div className="rounded-2xl border border-white/[0.08] bg-slate-900/60 p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 uppercase tracking-wider">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>ลำดับการออกเทิร์น & สปีดจริงจากไอดี (Turn Order & Speed)</span>
            </div>
            {canBuildFully ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                ✓ รูนครบพร้อมรบ
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                ⚠️ มี {matchedUnits.filter(Boolean).length}/3 ตัว
              </span>
            )}
          </div>

          {turnAnalysis.turnOrder.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {turnAnalysis.turnOrder.map((u, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-3 relative overflow-hidden"
                >
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                    T{u.order}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-white truncate">{u.name}</div>
                    <div className="text-[11px] font-mono text-cyan-400 font-bold mt-0.5">
                      SPD {u.spd} <span className="text-[10px] text-slate-400 font-normal">(+{u.bonusSpd})</span>
                    </div>
                    {u.sets.length > 0 && (
                      <div className="text-[9px] text-slate-400 truncate mt-0.5">
                        {u.sets.join(' / ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic text-center py-2">
              ยังไม่มีข้อมูลมอนสเตอร์ในไอดีสำหรับสูตรนี้
            </div>
          )}

          {/* Speed Gap Status Banner */}
          <div className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
            turnAnalysis.hasSpeedGapWarning
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
          }`}>
            {turnAnalysis.hasSpeedGapWarning ? (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{turnAnalysis.summary || 'ลำดับการออกสกิลผ่านการคำนวณตามสถิติ'}</span>
          </div>
        </div>

        {/* 2. Will / Immunity Safety Check */}
        <div className="rounded-2xl border border-white/[0.08] bg-slate-900/60 p-4 sm:p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider">
            <Shield className="w-4 h-4 text-amber-400" />
            <span>การป้องกันเทิร์นแรก (Will / Immunity Safety Check)</span>
          </div>

          <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
            willAnalysis.status === 'safe'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
              : willAnalysis.status === 'caution'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
          }`}>
            {willAnalysis.status === 'safe' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-bold">{willAnalysis.badge}</div>
              <div className="text-[11px] opacity-90 mt-0.5">{willAnalysis.detail}</div>
            </div>
          </div>
        </div>

        {/* 3. Kill Priority (ลำดับการเล็งเป้าหมาย) */}
        <div className="rounded-2xl border border-white/[0.08] bg-slate-900/60 p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-300 uppercase tracking-wider">
            <Target className="w-4 h-4 text-rose-400" />
            <span>ลำดับการเล็งเป้าหมายสังหาร (Kill Priority Order)</span>
          </div>

          <div className="space-y-2">
            {killPriorities.map((item, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                  item.isPrimary
                    ? 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                    : 'bg-white/[0.02] border-white/10 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-6 h-6 rounded-lg font-mono text-xs font-bold flex items-center justify-center shrink-0 ${
                    item.isPrimary ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.step}
                  </span>
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>{item.targetName}</span>
                      <span className={`text-[10px] font-normal px-2 py-0.5 rounded-full ${
                        item.isPrimary ? 'bg-rose-500/30 text-rose-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {item.badge}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{item.reason}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Substitute Advisor (ถ้าขาดตัวในสูตร) */}
        {substitutes.length > 0 && (
          <div className="rounded-2xl border border-purple-500/30 bg-purple-950/15 p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>ระบบแนะนำตัวแทนที่คุณมีในไอดี (Substitute Advisor)</span>
            </div>

            <div className="space-y-3">
              {substitutes.map((subItem, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="text-xs text-slate-300">
                    ขาดตัว: <strong className="text-rose-400">{subItem.missingName}</strong> • สามารถใช้ตัวแทนในคลังของคุณ:
                  </div>

                  {subItem.subs.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {subItem.subs.map((s, sIdx) => (
                        <div
                          key={sIdx}
                          className="p-2.5 rounded-xl bg-slate-900/80 border border-purple-500/30 text-xs flex items-center gap-2"
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-white truncate">{s.name}</div>
                            <div className="text-[10px] text-purple-300 font-mono">
                              SPD {s.spd} {s.sets.length > 0 ? `• ${s.sets[0]}` : ''}
                            </div>
                            <div className="text-[9px] text-emerald-400">✓ มีรูน {s.runeCount} ชิ้น</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic">
                      ไม่พบตัวแทนที่ใส่รูนพร้อมใช้ในบทบาทนี้ในไอดีของคุณ
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Guardian Strategy Note */}
        <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.08] text-xs text-slate-300 space-y-1">
          <div className="font-bold text-cyan-300 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>คำแนะนำยุทธวิธีจากผู้เล่นระดับ Guardian:</span>
          </div>
          <p className="text-slate-400 leading-relaxed font-sans">{counter.notes}</p>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-cyan-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span>✕ ปิดหน้าต่างยุทธวิธี</span>
        </button>
      </div>
    </div>
  );
}
