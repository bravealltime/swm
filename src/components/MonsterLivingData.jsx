import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  Swords, 
  Shield, 
  Sparkles, 
  Flame, 
  History, 
  Gem, 
  Target, 
  ChevronRight, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Users, 
  Zap, 
  Clock, 
  Share2, 
  Download, 
  Bot, 
  HelpCircle,
  Award,
  ArrowUpRight
} from 'lucide-react';
import MonsterAvatar from './MonsterAvatar';
import AiAdvisorPanel from './AiAdvisorPanel';
import { getMonsterLivingData, calculateGuardianReadiness } from '../utils/monsterLivingData.js';
import { exportMonsterCard } from '../utils/cardExporter.js';

const IMPACT_BADGES = {
  buff: { label: 'BUFF', bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  nerf: { label: 'NERF', bg: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
  adjustment: { label: 'REBALANCE', bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
};

export default function MonsterLivingData({ 
  monster, 
  equippedStats = null, 
  wizardName = 'Summoner',
  onNavigate, 
  onSelectMonster 
}) {
  const [activeTab, setActiveTab] = useState('meta'); // 'meta' | 'runes' | 'dungeons' | 'mdc' | 'patches' | 'ai'
  const [isExporting, setIsExporting] = useState(false);
  const [aiPromptPreset, setAiPromptPreset] = useState(null);

  const data = typeof monster === 'object' && monster.guardianStats !== undefined 
    ? monster 
    : getMonsterLivingData(monster);

  const { guardianStats, duos, synergies, counters, dungeonStats = [], balancePatches, mdcStats, builds, summaryTextTh } = data || {};

  const hasMeta = Boolean(guardianStats);
  const hasDuos = duos && duos.length > 0;
  const hasHighData = (synergies && synergies.length > 0) || (counters && counters.length > 0);
  const hasDungeons = dungeonStats && dungeonStats.length > 0;
  const hasMdc = mdcStats && (mdcStats.defCount > 0 || mdcStats.cntCount > 0);
  const hasPatches = balancePatches && balancePatches.length > 0;
  const hasBuilds = Boolean(builds && builds.benchmarks);

  // Guardian Readiness Score when actual equipped stats are passed (from Box view)
  const readiness = useMemo(() => {
    if (!equippedStats || !builds?.benchmarks) return null;
    return calculateGuardianReadiness(equippedStats, builds.benchmarks);
  }, [equippedStats, builds]);

  if (!data || !data.monster) return null;

  const handleExportCard = async () => {
    setIsExporting(true);
    try {
      await exportMonsterCard({
        monster: {
          ...data.monster,
          ...equippedStats,
          runeSets: builds?.sets || ['Violent', 'Will'],
          sets: builds?.sets || ['Violent', 'Will'],
        },
        wizardName,
      });
    } catch (e) {
      console.error('Export card failed:', e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4 text-slate-200">
      {/* 1. Summary Header Card + Quick Action Buttons */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/40 border border-blue-500/20 p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed text-slate-300 shadow-lg space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 font-bold text-blue-400 text-xs uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>บทวิเคราะห์สถานะ & เมต้า (Living Profile)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCard}
              disabled={isExporting}
              className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02]"
              title="สร้างรูปภาพการ์ดพลังมอนสเตอร์สำหรับแชร์ลงโซเชียล"
            >
              <Share2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isExporting ? 'กำลังสร้างรูป...' : 'แชร์การ์ด PNG'}</span>
            </button>
          </div>
        </div>
        <p className="text-slate-200 leading-relaxed">{summaryTextTh}</p>
      </div>

      {/* 2. Guardian Readiness Score Bar (Only if user's equipped stats exist) */}
      {readiness && (
        <div className="rounded-2xl p-4 bg-gradient-to-r from-amber-950/30 via-slate-900 to-amber-950/20 border border-amber-500/30 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">ความพร้อมรูนระดับ Guardian (Readiness Benchmark)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-300">{readiness.gradeLabel}</span>
              <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-black">
                เกรด {readiness.grade} ({readiness.score}%)
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div 
              className={`h-2.5 rounded-full transition-all duration-500 ${
                readiness.score >= 85 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
                readiness.score >= 70 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
                'bg-gradient-to-r from-rose-500 to-amber-500'
              }`}
              style={{ width: `${readiness.score}%` }}
            />
          </div>

          {/* Stat Checklist Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {readiness.items.map((item, i) => (
              <div 
                key={i} 
                className={`p-2 rounded-xl border flex items-center justify-between ${
                  item.passed 
                    ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300' 
                    : 'bg-amber-500/10 border-amber-500/25 text-amber-200'
                }`}
              >
                <div>
                  <span className="font-bold">{item.label}</span>
                  <div className="text-[10px] opacity-75">{item.actual.toLocaleString()}{item.unit} / {item.target.toLocaleString()}{item.unit}</div>
                </div>
                {item.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <span className="text-[10px] font-mono font-bold text-amber-400 shrink-0">
                    {item.diff}{item.unit}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-white/[0.08] pb-2 overflow-x-auto chip-strip">
        <button
          onClick={() => setActiveTab('meta')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === 'meta'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]'
          }`}
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>RTA Guardian {hasMeta && <span className="text-[10px] ml-1 opacity-80">#{guardianStats.rank}</span>}</span>
        </button>

        <button
          onClick={() => setActiveTab('runes')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === 'runes'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]'
          }`}
        >
          <Gem className="w-3.5 h-3.5 text-cyan-400" />
          <span>แนวทางรูน {hasBuilds && <span className="text-[10px] ml-1 opacity-80">เป้าหมาย G1-G3</span>}</span>
        </button>

        <button
          onClick={() => setActiveTab('dungeons')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === 'dungeons'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-yellow-400" />
          <span>ดันเจี้ยน Abyss {hasDungeons && <span className="text-[10px] ml-1 opacity-80">{dungeonStats.length} ดัน</span>}</span>
        </button>

        <button
          onClick={() => setActiveTab('mdc')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === 'mdc'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]'
          }`}
        >
          <Swords className="w-3.5 h-3.5 text-emerald-400" />
          <span>3MDC กิลด์วอร์ {hasMdc && <span className="text-[10px] ml-1 opacity-80">{mdcStats.cntCount + mdcStats.defCount} สูตร</span>}</span>
        </button>

        <button
          onClick={() => setActiveTab('patches')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === 'patches'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]'
          }`}
        >
          <History className="w-3.5 h-3.5 text-purple-400" />
          <span>ประวัติปรับสมดุล {hasPatches && <span className="text-[10px] ml-1 opacity-80">{balancePatches.length} ครั้ง</span>}</span>
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === 'ai'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]'
          }`}
        >
          <Bot className="w-3.5 h-3.5 text-amber-300" />
          <span>โค้ช AI</span>
        </button>
      </div>

      {/* 4. Tab Contents */}

      {/* Tab: Meta & Duos */}
      {activeTab === 'meta' && (
        <div className="space-y-4">
          {hasMeta ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="rounded-xl p-3 bg-[#0a101d] border border-white/[0.07] text-center">
                <div className="text-[11px] text-slate-400 font-semibold mb-0.5 flex items-center justify-center gap-1">
                  <Trophy className="w-3 h-3 text-amber-400" /> อันดับ Guardian
                </div>
                <div className="text-lg sm:text-xl font-black text-amber-400 font-mono">
                  #{guardianStats.rank}
                </div>
                <div className="text-[10px] text-slate-500">จาก {guardianStats.totalMonsters} มอนสเตอร์</div>
              </div>

              <div className="rounded-xl p-3 bg-[#0a101d] border border-white/[0.07] text-center">
                <div className="text-[11px] text-slate-400 font-semibold mb-0.5 flex items-center justify-center gap-1">
                  <TrendingUp className="w-3 h-3 text-blue-400" /> ถูกเลือก (Picks)
                </div>
                <div className="text-lg sm:text-xl font-black text-white font-mono">
                  {guardianStats.picks.toLocaleString()}
                </div>
                <div className="text-[10px] text-emerald-400 font-bold">ชนะ {guardianStats.winRate}%</div>
              </div>

              <div className="rounded-xl p-3 bg-[#0a101d] border border-white/[0.07] text-center">
                <div className="text-[11px] text-slate-400 font-semibold mb-0.5 flex items-center justify-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-rose-400" /> อัตราโดนแบน
                </div>
                <div className="text-lg sm:text-xl font-black text-rose-400 font-mono">
                  {guardianStats.banRate}%
                </div>
                <div className="text-[10px] text-slate-400">{guardianStats.bans.toLocaleString()} แมตช์</div>
              </div>

              <div className="rounded-xl p-3 bg-[#0a101d] border border-white/[0.07] text-center">
                <div className="text-[11px] text-slate-400 font-semibold mb-0.5 flex items-center justify-center gap-1">
                  <Flame className="w-3 h-3 text-purple-400" /> First Pick
                </div>
                <div className="text-lg sm:text-xl font-black text-purple-300 font-mono">
                  {guardianStats.fpRate}%
                </div>
                <div className="text-[10px] text-slate-400">ชนะเมื่อ FP {guardianStats.fpWinRate}%</div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl p-3.5 bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>มอนสเตอร์ตัวนี้ยังไม่ติดท็อปสถิติ RTA Guardian ซีซั่นนี้ (เหมาะสำหรับเน้นใช้งานใน Siege Battle, Guild War หรือดันเจี้ยน PVE)</span>
            </div>
          )}

          {/* Top Duos */}
          {hasDuos && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span>คู่หูที่ดราฟต์ร่วมกันบ่อยที่สุดใน RTA Guardian</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {duos.map((d, i) => (
                  <div
                    key={i}
                    onClick={() => onSelectMonster && onSelectMonster(d.partnerId || d.partnerName)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#0a101d] border border-white/[0.07] hover:border-blue-500/40 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {d.partnerAvatarUrl ? (
                        <img src={d.partnerAvatarUrl} alt={d.partnerName} className="w-9 h-9 rounded-lg border border-white/10 shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-slate-800 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                          {d.partnerThaiName}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {d.partnerName}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-bold text-emerald-400">{d.winRate}%</div>
                      <div className="text-[10px] text-slate-500 font-mono">{d.matches} แมตช์</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Synergies & Counters */}
          {hasHighData && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {synergies.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>คอมโบส่งเสริม (Synergies สูงสุด)</span>
                  </div>
                  <div className="space-y-1.5">
                    {synergies.map((s, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-[#070b14] border border-emerald-500/15 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          {s.avatarUrl && <img src={s.avatarUrl} alt={s.name} className="w-7 h-7 rounded border border-white/10 shrink-0" />}
                          <span className="truncate font-semibold text-slate-200">{s.thaiName || s.name}</span>
                        </div>
                        <span className="font-mono font-bold text-emerald-400 shrink-0">{s.winRate}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {counters.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>ตัวแก้ทางที่แพ้ทาง (Counters อันตราย)</span>
                  </div>
                  <div className="space-y-1.5">
                    {counters.map((c, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-[#070b14] border border-rose-500/15 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          {c.avatarUrl && <img src={c.avatarUrl} alt={c.name} className="w-7 h-7 rounded border border-white/10 shrink-0" />}
                          <span className="truncate font-semibold text-slate-200">{c.thaiName || c.name}</span>
                        </div>
                        <span className="font-mono font-bold text-rose-400 shrink-0">ชนะ {c.winRate}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab: Rune Builds & Benchmarks */}
      {activeTab === 'runes' && builds && (
        <div className="space-y-3.5">
          <div className="rounded-xl p-3.5 bg-[#0a101d] border border-white/[0.07] space-y-2 text-xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-slate-400">เซ็ตแนะนำ:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {builds.sets?.map((set, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-300 font-semibold font-mono">
                    {set}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-white/[0.05]">
              <span className="text-slate-400">ออฟหลักช่อง 2 / 4 / 6:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {builds.slots246?.map((slot, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300 font-semibold font-mono">
                    {slot}
                  </span>
                ))}
              </div>
            </div>

            {builds.artifacts && builds.artifacts.length > 0 && (
              <div className="flex items-start justify-between flex-wrap gap-2 pt-1 border-t border-white/[0.05]">
                <span className="text-slate-400 shrink-0">อาร์ติแฟกต์แนะนำ:</span>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {builds.artifacts.map((art, i) => (
                    <span key={i} className="text-[11px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300">
                      {art}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {builds.tips && (
              <div className="pt-2 border-t border-white/[0.05] text-slate-300 text-xs leading-relaxed italic">
                💡 <span className="text-amber-300 font-semibold">เทคนิค:</span> {builds.tips}
              </div>
            )}
          </div>

          {builds.benchmarks && (
            <div className="rounded-xl overflow-hidden border border-white/[0.08] bg-[#070b14]">
              <div className="px-3.5 py-2 bg-white/[0.03] text-xs font-bold text-white border-b border-white/[0.06] flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-cyan-400" /> สเตตัสเป้าหมายระดับการ์เดียน (G1-G3 Benchmark)</span>
                <span className="text-[10px] text-slate-400">รวมรูน + บัฟฟ์</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-white/[0.05] text-xs font-mono">
                <div className="p-2.5 flex justify-between"><span className="text-slate-400">HP</span><span className="text-emerald-400 font-bold">{builds.benchmarks.hp?.toLocaleString()}</span></div>
                <div className="p-2.5 flex justify-between"><span className="text-slate-400">ATK</span><span className="text-amber-400 font-bold">{builds.benchmarks.atk?.toLocaleString()}</span></div>
                <div className="p-2.5 flex justify-between"><span className="text-slate-400">DEF</span><span className="text-sky-400 font-bold">{builds.benchmarks.def?.toLocaleString()}</span></div>
                <div className="p-2.5 flex justify-between"><span className="text-slate-400">SPD</span><span className="text-purple-400 font-bold">+{builds.benchmarks.spd}</span></div>
                <div className="p-2.5 flex justify-between"><span className="text-slate-400">CRI Rate</span><span className="text-slate-200">{builds.benchmarks.cr}%</span></div>
                <div className="p-2.5 flex justify-between"><span className="text-slate-400">CRI Dmg</span><span className="text-slate-200">{builds.benchmarks.cd}%</span></div>
                <div className="p-2.5 flex justify-between"><span className="text-slate-400">RES</span><span className="text-slate-200">{builds.benchmarks.res}%</span></div>
                <div className="p-2.5 flex justify-between"><span className="text-slate-400">ACC</span><span className="text-slate-200">{builds.benchmarks.acc}%</span></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Dungeons Abyss Hard (PVE) */}
      {activeTab === 'dungeons' && (
        <div className="space-y-3">
          {hasDungeons ? (
            dungeonStats.map((d, i) => (
              <div key={i} className="p-4 rounded-xl bg-[#0a101d] border border-yellow-500/20 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-2.5">
                  <div>
                    <span className="text-[10px] font-mono text-amber-400 uppercase font-bold tracking-wider">
                      {d.dungeonNameEn}
                    </span>
                    <h3 className="text-sm font-bold text-white">{d.dungeonName}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                      ชนะ {d.successRate}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-mono">
                      ⏱️ เฉลี่ย {d.avgTime}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400">บทบาทในทีม:</span>
                    <span className="text-white font-medium ml-1.5">{d.role}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">เซ็ตรูนแนะนำ:</span>
                    <span className="text-amber-300 font-mono font-semibold ml-1.5">{d.recommendedRune}</span>
                  </div>
                </div>

                {d.teammates && (
                  <div className="pt-2 border-t border-white/[0.05]">
                    <div className="text-[11px] text-slate-400 mb-1">สมาชิกในทีมฟาร์ม:</div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {d.teammates.map((tm, idx) => (
                        <span key={idx} className="text-xs px-2 py-0.5 rounded-lg bg-white/[0.05] border border-white/10 text-slate-200">
                          {tm}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {d.turnOrderTh && (
                  <div className="text-xs text-slate-300 bg-black/30 p-2.5 rounded-lg border border-white/[0.04]">
                    <span className="text-amber-400 font-semibold">ลำดับเทิร์น (Turn Order):</span> {d.turnOrderTh}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center text-xs text-slate-400 space-y-1">
              <div>มอนสเตอร์ตัวนี้ไม่ติดเมต้าทีมสปีด Abyss Hard หลัก</div>
              <div className="text-[11px] text-slate-500">มักนำไปใช้ใน Siege Battle, กิลด์วอร์ หรือ RTA เป็นหลัก</div>
            </div>
          )}
        </div>
      )}

      {/* Tab: 3MDC Guild War */}
      {activeTab === 'mdc' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3 bg-[#0a101d] border border-white/[0.07] text-center">
              <div className="text-[11px] text-slate-400 mb-0.5">ปรากฏในทีมตั้งรับ (Defense)</div>
              <div className="text-xl font-black text-rose-400 font-mono">{mdcStats.defCount} ทีม</div>
            </div>
            <div className="rounded-xl p-3 bg-[#0a101d] border border-white/[0.07] text-center">
              <div className="text-[11px] text-slate-400 mb-0.5">ปรากฏในสูตรบุกแก้ทาง (Counter)</div>
              <div className="text-xl font-black text-emerald-400 font-mono">{mdcStats.cntCount} สูตร</div>
            </div>
          </div>

          {mdcStats.defTitles && mdcStats.defTitles.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-rose-400" />
                <span>ทีมตั้งรับยอดนิยมที่มี {data.monster.name}</span>
              </div>
              {mdcStats.defTitles.map((title, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-[#0a101d] border border-white/[0.07] text-xs font-medium text-slate-200 flex items-center justify-between">
                  <span>{title}</span>
                  <button
                    onClick={() => onNavigate && onNavigate('3mdc', { search: data.monster.name })}
                    className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                  >
                    ดูสูตรแก้ทาง <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {mdcStats.counterTeams && mdcStats.counterTeams.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Swords className="w-3.5 h-3.5 text-emerald-400" />
                <span>ตัวอย่างสูตรบุกที่มี {data.monster.name}</span>
              </div>
              {mdcStats.counterTeams.map((c, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-[#0a101d] border border-white/[0.07] text-xs flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-emerald-400 font-bold truncate">{c.team}</div>
                    <div className="text-[11px] text-slate-400 truncate">แก้ทาง: {c.against}</div>
                  </div>
                  <div className="text-right shrink-0 font-mono font-bold text-emerald-400">
                    {c.winRate}
                  </div>
                </div>
              ))}
            </div>
          )}

          {mdcStats.defCount === 0 && mdcStats.cntCount === 0 && (
            <div className="rounded-xl p-3 bg-white/[0.02] border border-white/[0.05] text-xs text-slate-400 text-center">
              ยังไม่มีสูตรแก้ทาง 3MDC ที่ระบุชื่อมอนสเตอร์ตัวนี้โดยตรงในฐานข้อมูล Siege ปัจจุบัน
            </div>
          )}
        </div>
      )}

      {/* Tab: Balance Patches */}
      {activeTab === 'patches' && (
        <div className="space-y-2.5">
          {hasPatches ? (
            balancePatches.map((patch, i) => {
              const badge = IMPACT_BADGES[patch.impact] || IMPACT_BADGES.adjustment;
              return (
                <div key={i} className="p-3 rounded-xl bg-[#0a101d] border border-white/[0.07] space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-xs">แพตช์ #{patch.patchId}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${badge.bg}`}>
                        {badge.label}
                      </span>
                      <span className="text-[11px] text-purple-300 font-semibold">{patch.changeTypeTh}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">{patch.date}</span>
                  </div>

                  <div className="text-xs text-amber-300 font-semibold">{patch.skillName}</div>

                  {patch.translatedText && (
                    <div className="text-xs text-slate-200 leading-relaxed bg-white/[0.03] p-2 rounded-lg border border-white/[0.04]">
                      {patch.translatedText}
                    </div>
                  )}

                  {!patch.translatedText && patch.preview && (
                    <div className="text-xs text-slate-300 leading-relaxed font-mono bg-white/[0.03] p-2 rounded-lg border border-white/[0.04]">
                      {patch.preview}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="rounded-xl p-4 bg-white/[0.02] border border-white/[0.05] text-center text-xs text-slate-400">
              ยังไม่มีการปรับเปลี่ยนสกิล/สเตตัสในรอบ 5 แพตช์สมดุลล่าสุด (Patch #88 - #92)
            </div>
          )}
        </div>
      )}

      {/* Tab: AI Coach Advisor */}
      {activeTab === 'ai' && (
        <div className="space-y-3">
          <div className="text-xs text-slate-400">
            เลือกหัวข้อที่ต้องการปรึกษาโค้ช AI เกี่ยวกับ <span className="text-white font-bold">{data.monster.name}</span> ({data.monster.thaiName || ''}):
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              {
                id: 'counter',
                label: '⚔️ สูตรแก้ทาง & จุดอ่อน',
                prompt: `วิเคราะห์จุดอ่อนและขอสูตรแก้ทาง ${data.monster.name} ใน Siege และ RTA แนะนำตัวที่แก้ทางได้ดีที่สุด`,
              },
              {
                id: 'speed',
                label: '⚡ สปีดจูน & ลำดับเทิร์น',
                prompt: `แนะนำการจูนสปีดและลำดับการออกเทิร์นของ ${data.monster.name} ให้เข้ากับทีม และสเตตัสเป้าหมายที่ควรทำ`,
              },
              {
                id: 'teams',
                label: '🛡️ จัดทีมรับ & ดราฟต์ RTA',
                prompt: `แนะนำคอมโบทีมตั้งรับ Siege และคู่หูดราฟต์ RTA ที่เข้ากับ ${data.monster.name} ได้ดีที่สุด พร้อมอธิบายเหตุผล`,
              },
            ].map((preset) => (
              <button
                key={preset.id}
                onClick={() => setAiPromptPreset(preset.prompt)}
                className={`p-2.5 rounded-xl border text-xs text-left transition-all cursor-pointer ${
                  aiPromptPreset === preset.prompt
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
                    : 'bg-[#0a101d] border-white/[0.07] text-slate-300 hover:border-amber-500/30'
                }`}
              >
                <div className="font-bold">{preset.label}</div>
              </button>
            ))}
          </div>

          <AiAdvisorPanel
            resetKey={`${data.monster.name}-${aiPromptPreset || 'default'}`}
            label="ถามโค้ช AI"
            hint="โค้ช AI จะวิเคราะห์โดยอิงจากสกิล สเตตัส และข้อมูลเมต้าจริงในระบบ"
            buildPayload={() => ({
              kind: 'chat',
              prompt: aiPromptPreset || `วิเคราะห์มอนสเตอร์ ${data.monster.name} (${data.monster.thaiName || ''}) ธาตุ ${data.monster.element} แนะนำจุดเด่น วิธีการใช้ และสูตรแก้ทาง`,
            })}
          />
        </div>
      )}
    </div>
  );
}
