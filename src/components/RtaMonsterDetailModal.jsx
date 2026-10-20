import React from 'react';
import { 
  X, 
  Trophy, 
  Swords, 
  Shield, 
  Zap, 
  Sparkles, 
  Users, 
  Target, 
  ExternalLink, 
  TrendingUp, 
  XCircle,
  CheckCircle2, 
  ArrowRight, 
  Flame,
  Award
} from 'lucide-react';
import MonsterAvatar from './MonsterAvatar';
import allMonstersData from '../data/allMonsters.json';
import guardianMeta from '../data/swrtGuardianMeta.json';
import highdataMap from '../data/swrtMonsterHighdata.json';
import { buildMonsterIndex } from '../data/swrtPlayerAdapter';

const MONSTER_INDEX = buildMonsterIndex(allMonstersData);
const monsterOf = (id) => MONSTER_INDEX.get(Number(id)) || {
  id: `m-${id}`,
  com2usId: String(id),
  name: `#${id}`,
  thaiName: `#${id}`,
  element: 'wind',
  stars: 5,
  avatarUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0001_0_0.png'
};

export default function RtaMonsterDetailModal({ monster, onClose, onNavigate, onSelectForCore }) {
  if (!monster) return null;

  const mId = monster.monsterId || monster.id;
  const highdata = highdataMap[mId] || null;
  const realInfo = monsterOf(mId);

  // Tactical FP / SP calculation from guardianMeta
  const guardianEntry = (guardianMeta.monsters || []).find(m => m.id === mId);
  const fpPicks = guardianEntry?.fpPicks || 0;
  const fpWins = guardianEntry?.fpWins || 0;
  const picks = guardianEntry?.picks || monster.pickTotal || 1;
  const wins = guardianEntry?.wins || 0;
  const spPicks = Math.max(0, picks - fpPicks);
  const spWins = Math.max(0, wins - fpWins);

  const fpWinRate = fpPicks > 0 ? +((fpWins / fpPicks) * 100).toFixed(1) : +(monster.winRate || 50).toFixed(1);
  const spWinRate = spPicks > 0 ? +((spWins / spPicks) * 100).toFixed(1) : +(monster.winRate || 50).toFixed(1);
  const fpRate = +(monster.firstPickRate || (fpPicks / picks * 100) || 0).toFixed(1);

  let strategy = 'flexible';
  if (fpWinRate >= 50.5 && fpRate >= 8 && fpWinRate >= spWinRate + 1.2) {
    strategy = 'first_pick';
  } else if (spWinRate >= 50.5 && spWinRate >= fpWinRate + 1.2) {
    strategy = 'counter_pick';
  }

  // Recommended runes from monster catalog
  const runeSuggestion = realInfo.suggestedRunes || 'Violent / Will (SPD / HP% / HP%)';
  const roleText = realInfo.role || 'ตัวควบคุมและป่วนเทิร์นใน RTA (CC / Utility)';

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl bg-gradient-to-b from-[#131b2e] via-[#0d1322] to-[#080c16] border border-cyan-500/30 rounded-3xl shadow-[0_0_60px_rgba(6,182,212,0.18)] overflow-hidden text-slate-200 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient spots */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Bar */}
        <div className="relative z-10 p-5 sm:p-7 border-b border-white/10 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="p-1 rounded-2xl bg-[#090e18] border-2 border-cyan-400 shadow-xl shadow-cyan-500/20">
                <MonsterAvatar monster={monster} size="lg" />
              </div>
              <div className="absolute -bottom-2 -right-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-black bg-black border border-white/20 text-white shadow">
                ★ {realInfo.stars || 5}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider ${
                  monster.element === 'fire' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                  monster.element === 'water' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' :
                  monster.element === 'wind' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  monster.element === 'light' ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/30' :
                  'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                }`}>
                  {monster.element}
                </span>

                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {monster.tier ? `${monster.tier} Tier` : 'S Tier'}
                </span>

                {monster.aiScore > 0 && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    <span>AI RATING ★ {Number(monster.aiScore).toFixed(1)}</span>
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>{monster.thaiName || monster.name}</span>
                <span className="text-xs sm:text-sm font-normal text-slate-400">({monster.name})</span>
              </h2>

              <p className="text-xs text-slate-400">
                {roleText}
              </p>
            </div>
          </div>

          {/* Close & Action Buttons */}
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            {onSelectForCore && (
              <button
                onClick={() => {
                  onSelectForCore(mId);
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/25 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Target className="w-3.5 h-3.5" />
                <span>เปิดใน Core Finder</span>
              </button>
            )}

            <button
              onClick={() => {
                if (onNavigate) onNavigate('draft-explorer');
                onClose();
              }}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-[#141d30] hover:bg-[#1a2640] text-slate-200 border border-white/10 hover:border-white/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Swords className="w-3.5 h-3.5 text-blue-400" />
              <span>ดราฟต์ 5v5</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="ปิด"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="relative z-10 p-5 sm:p-7 space-y-6 max-h-[72vh] overflow-y-auto no-scrollbar">
          {/* 1. Telemetry Bento Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Pick Rate */}
            <div className="p-3.5 rounded-2xl bg-[#0a0f1a] border border-white/10 flex flex-col justify-between">
              <div className="text-xs text-slate-400 font-medium">อัตราการเลือก (Pick Rate)</div>
              <div className="text-2xl font-black text-white font-mono my-1">
                {monster.pickRate}%
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-500 h-full rounded-full" 
                  style={{ width: `${Math.min(100, (Number(monster.pickRate) || 0) * 3)}%` }} 
                />
              </div>
            </div>

            {/* Win Rate */}
            <div className="p-3.5 rounded-2xl bg-[#0a0f1a] border border-white/10 flex flex-col justify-between">
              <div className="text-xs text-slate-400 font-medium">อัตราการชนะ (Win Rate)</div>
              <div className={`text-2xl font-black font-mono my-1 ${
                (Number(monster.winRate) || 50) >= 50 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {monster.winRate}%
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                {(Number(monster.winRate) || 50) >= 50 ? '+ ' : ''}
                {((Number(monster.winRate) || 50) - 50).toFixed(1)}% เทียบกับค่าเฉลี่ย
              </div>
            </div>

            {/* Ban Rate */}
            <div className="p-3.5 rounded-2xl bg-[#0a0f1a] border border-white/10 flex flex-col justify-between">
              <div className="text-xs text-slate-400 font-medium">อัตราการแบน (Ban Rate)</div>
              <div className="text-2xl font-black text-amber-400 font-mono my-1">
                {monster.banRate}%
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                {Number(monster.banRate) >= 15 ? '🔥 โดนแบนบ่อยมาก' : '🛡️ ไม่ค่อยถูกแบน'}
              </div>
            </div>

            {/* First Pick Tactical Split */}
            <div className="p-3.5 rounded-2xl bg-[#0a0f1a] border border-white/10 flex flex-col justify-between">
              <div className="text-xs text-slate-400 font-medium">สถิติตำแหน่งดราฟต์ (FP vs SP)</div>
              <div className="flex items-center justify-between text-xs font-mono my-1">
                <span className="text-amber-300">FP Win: <strong>{fpWinRate}%</strong></span>
                <span className="text-slate-600">|</span>
                <span className="text-cyan-300">Counter: <strong>{spWinRate}%</strong></span>
              </div>
              <div>
                {strategy === 'first_pick' ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400">
                    👑 FP Priority (เหมาะเปิดตัวแรก)
                  </span>
                ) : strategy === 'counter_pick' ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-400">
                    🎯 Counter Pick (เหมาะสวนรอบหลัง)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400">
                    ⚖️ Flexible (หยิบรอบไหนก็ได้)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 2. Synergies and Hard Counters Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Best Synergies */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#090e18] border border-emerald-500/20 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>คู่หูที่ดีที่สุด (Best Synergies)</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  {highdata?.synergies?.length || 0} ตัวเลือก
                </span>
              </div>

              <div className="space-y-2">
                {(highdata?.synergies || []).map((syn, idx) => {
                  const partner = monsterOf(syn.monsterId);
                  return (
                    <div 
                      key={idx}
                      className="p-2.5 rounded-xl bg-[#0c1322] border border-white/5 hover:border-emerald-500/30 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <MonsterAvatar monster={partner} size="sm" />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">
                            {partner.thaiName || partner.name}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {partner.name} ({partner.element})
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 font-mono">
                        <div className="text-xs font-black text-emerald-400">
                          {syn.winRate}% WR
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {syn.matches ? `${syn.matches.toLocaleString()} เกม` : ''}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {(!highdata || !highdata.synergies || highdata.synergies.length === 0) && (
                  <div className="p-4 text-center text-xs text-slate-500 italic">
                    ไม่มีข้อมูลคู่หูเฉพาะในชุดตัวอย่างนี้
                  </div>
                )}
              </div>
            </div>

            {/* Hard Counters */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#090e18] border border-rose-500/20 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <h3 className="text-sm font-bold text-rose-400 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" />
                  <span>ตัวแก้ทางที่แพ้บ่อยสุด (Hard Counters)</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  {highdata?.counters?.length || 0} ตัวแก้
                </span>
              </div>

              <div className="space-y-2">
                {(highdata?.counters || []).map((cnt, idx) => {
                  const counterMon = monsterOf(cnt.monsterId);
                  return (
                    <div 
                      key={idx}
                      className="p-2.5 rounded-xl bg-[#0c1322] border border-white/5 hover:border-rose-500/30 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <MonsterAvatar monster={counterMon} size="sm" />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">
                            {counterMon.thaiName || counterMon.name}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {counterMon.name} ({counterMon.element})
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 font-mono">
                        <div className="text-xs font-black text-rose-400">
                          {cnt.winRate}% WR
                        </div>
                        <div className="text-[10px] text-rose-300/70">
                          แพ้ทางบ่อย
                        </div>
                      </div>
                    </div>
                  );
                })}

                {(!highdata || !highdata.counters || highdata.counters.length === 0) && (
                  <div className="p-4 text-center text-xs text-slate-500 italic">
                    ไม่มีข้อมูลตัวแก้ทางเฉพาะในชุดตัวอย่างนี้
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. Recommended Runes & Strategy */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0a0f19] border border-white/10 space-y-2">
            <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>การจัดรูนและสเตตัสแนะนำสำหรับ RTA:</span>
            </div>
            <div className="p-3 rounded-xl bg-[#060a12] border border-white/5 text-xs text-slate-300 font-mono leading-relaxed">
              <div className="text-cyan-300 font-bold mb-1">เซ็ตรูนยอดนิยม: {runeSuggestion}</div>
              <div className="text-slate-400">จุดเด่น: {roleText}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
