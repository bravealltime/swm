import React, { useState, useMemo } from 'react';
import { Sparkles, CheckCircle2, Clock, AlertCircle, BookOpen, Layers, Flame, Zap, Shield, ChevronRight } from 'lucide-react';
import { analyzeFusionProgress, analyzeDevilmonPriority } from '../utils/fusionData';
import MonsterAvatar from './MonsterAvatar';

export default function FusionDevilmonPlanner({ box, onNavigate }) {
  const [subTab, setSubTab] = useState('fusion'); // 'fusion' | 'devilmon'

  const fusionData = useMemo(() => analyzeFusionProgress(box), [box]);
  const devilmonData = useMemo(() => analyzeDevilmonPriority(box), [box]);

  const totalDevilmonsNeeded = useMemo(() => {
    return devilmonData.reduce((sum, d) => sum + (d.isMaxed ? 0 : d.estimatedNeeded), 0);
  }, [devilmonData]);

  const completedFusions = useMemo(() => {
    return fusionData.filter((f) => f.isCompleted).length;
  }, [fusionData]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Tab Switcher */}
      <div className="flex items-center justify-between gap-3 flex-wrap border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab('fusion')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              subTab === 'fusion'
                ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                : 'bg-white/[0.04] text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>แผนผังผสมมอนสเตอร์ (Fusion {completedFusions}/{fusionData.length})</span>
          </button>

          <button
            onClick={() => setSubTab('devilmon')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              subTab === 'devilmon'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/30'
                : 'bg-white/[0.04] text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>จัดคิวเดวิลม่อน (Devilmon Queue: {totalDevilmonsNeeded} ตัว)</span>
          </button>
        </div>
      </div>

      {/* 1. Fusion Tab */}
      {subTab === 'fusion' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#0c1220] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" /> มอนสเตอร์ฟิวชั่น 5 ดาวแท้ (Hexagram Fusion)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                ระบบสแกนกล่องมอนสเตอร์ของคุณอัตโนมัติ เพื่อเช็คว่ามีตัวผสมพร้อมแล้วหรือยังขาดวัตถุดิบชิ้นไหน
              </p>
            </div>
            <div className="text-xs font-mono px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold shrink-0">
              ครอบครองแล้ว {completedFusions} จาก {fusionData.length} ตัว
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {fusionData.map((f) => (
              <div
                key={f.id}
                className={`p-5 rounded-3xl border transition-all flex flex-col justify-between gap-4 shadow-xl ${
                  f.isCompleted
                    ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-[#0c1220] to-[#070b14]'
                    : f.percent >= 50
                    ? 'border-amber-500/30 bg-gradient-to-br from-amber-950/15 via-[#0c1220] to-[#070b14]'
                    : 'border-white/[0.08] bg-[#0c1220]'
                }`}
              >
                <div className="space-y-4">
                  {/* Fusion Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <MonsterAvatar monster={f.name} size="lg" showStars={false} />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-black text-white">{f.thaiName}</h3>
                          {f.isCompleted ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> มีในไอดีแล้ว
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                              พร้อม {f.percent}% ({f.readyCount}/{f.totalRequired})
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{f.role}</p>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {!f.isCompleted && (
                    <div className="space-y-1">
                      <div className="w-full h-2 rounded-full bg-white/[0.05] overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-full"
                          style={{ width: `${f.percent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Materials Grid */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-mono text-slate-400 uppercase font-bold">
                      วัตถุดิบ 4 ตัวที่ใช้ผสม:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {f.materials.map((mat, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${
                            mat.owned
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                              : 'bg-white/[0.02] border-white/10 text-slate-400'
                          }`}
                        >
                          <MonsterAvatar monster={mat.name} size="sm" showStars={false} />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold truncate flex items-center gap-1.5">
                              <span>{mat.thaiName || mat.name}</span>
                              {mat.owned ? (
                                <span className="text-[10px] text-emerald-400 font-bold">✓ มีแล้ว</span>
                              ) : (
                                <span className="text-[10px] text-rose-400 font-bold">✕ ยังไม่มี</span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate" title={mat.source}>
                              {mat.source}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Devilmon Queue Tab */}
      {subTab === 'devilmon' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#0c1220] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-400" /> คิวป้อนเดวิลม่อนมอนสเตอร์ 5 ดาวแท้ (Devilmon Queue)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                จัดอันดับตามความคุ้มค่าของสกิลลดคูลดาวน์ (CDR) และบทบาทเมต้า เพื่อให้ไอดีของคุณพัฒนาได้ไวที่สุด
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-xs font-mono px-3 py-1.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 font-bold shrink-0">
                ต้องการทั้งหมด: ~{totalDevilmonsNeeded} ตัว (ประมาณ {(totalDevilmonsNeeded / 6).toFixed(1)} เดือน)
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {devilmonData.map((d, idx) => (
              <div
                key={d.uid || idx}
                className="p-4 rounded-2xl bg-[#0c1220] border border-white/[0.08] hover:border-purple-500/30 transition-all flex flex-col justify-between gap-3 shadow-xl"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <MonsterAvatar monster={d.name} size="md" showStars={false} />
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-white truncate">{d.thaiName}</div>
                        <div className="text-xs text-slate-400 font-mono truncate">{d.name}</div>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-md text-[11px] font-black font-mono shrink-0 border ${
                        d.priorityTier === 'S'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : d.priorityTier === 'A'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-white/[0.05] text-slate-400 border-white/10'
                      }`}
                    >
                      Tier {d.priorityTier}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 bg-[#070b14] p-2.5 rounded-xl border border-white/[0.05] leading-relaxed">
                    {d.priorityReason}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs">
                  <div className="text-slate-400">
                    {d.isMaxed ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> สกิลเต็มแล้ว
                      </span>
                    ) : (
                      <span>ต้องการเดวิลม่อน: <strong className="text-purple-300 font-mono text-sm">~{d.estimatedNeeded}</strong> ตัว</span>
                    )}
                  </div>
                  <button
                    onClick={() => onNavigate && onNavigate('catalog', { initialMonster: d.name })}
                    className="text-[11px] font-bold text-amber-300/90 hover:text-amber-200 flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>ดูสกิล</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}

            {devilmonData.length === 0 && (
              <div className="col-span-full py-16 text-center text-slate-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <div className="text-sm font-bold text-white">ไม่พบมอนสเตอร์ 5★ แท้ในกล่อง</div>
                <p className="text-xs text-slate-500">นำเข้าไฟล์ SWEX หรือกดทดลองด้วย Demo Box เพื่อดูการจัดอันดับ</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
