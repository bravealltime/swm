import React, { useState } from 'react';
import dungeonList from '../data/dungeonRealStats.json';
import { 
  Zap, 
  Clock, 
  Award, 
  ShieldAlert, 
  BarChart3, 
  Sparkles, 
  Layers, 
  RotateCcw,
  Target,
  Flame,
  Droplets,
  Wind,
  Sun,
  Moon,
  Compass,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  Sliders
} from 'lucide-react';
import AbyssCalculatorPanel from '../components/AbyssCalculatorPanel';

const ELEMENT_STYLES = {
  Water: { label: 'ธาตุน้ำ', color: '#38bdf8', bg: 'bg-sky-500/15 text-sky-400 border-sky-500/30', icon: Droplets },
  Fire: { label: 'ธาตุไฟ', color: '#f87171', bg: 'bg-red-500/15 text-red-400 border-red-500/30', icon: Flame },
  Wind: { label: 'ธาตุลม', color: '#facc15', bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30', icon: Wind },
  Light: { label: 'ธาตุแสง', color: '#fbbf24', bg: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30', icon: Sun },
  Dark: { label: 'ธาตุมืด', color: '#c084fc', bg: 'bg-purple-500/15 text-purple-300 border-purple-500/30', icon: Moon }
};

export default function DungeonStatsView({ onNavigate }) {
  const [selectedDungeonId, setSelectedDungeonId] = useState(dungeonList[0].id);
  const [activeSubTab, setActiveSubTab] = useState('team'); // 'team' | 'drops' | 'boss'

  const currentDungeon = dungeonList.find(d => d.id === selectedDungeonId) || dungeonList[0];
  const elemMeta = ELEMENT_STYLES[currentDungeon.element] || ELEMENT_STYLES.Water;
  const ElemIcon = elemMeta.icon;

  return (
    <div className="space-y-6 max-w-[1780px] 2xl:max-w-[1880px] mx-auto pb-16 animate-in fade-in duration-300">
      {/* Top Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-r from-[#0c1424] via-[#090e18] to-[#070b12] p-6 sm:p-8 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono font-bold uppercase">
            <Zap className="w-3.5 h-3.5" />
            <span>Cairos Dungeon Abyss Hard • สถิติการฟาร์มจริง 110,000+ รอบ</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            สถิติและทีมสปีดรันดันเจี้ยน (Dungeon Speed Analytics)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
            สูตรทีมสปีดรันระดับ Abyss Hard ครบทั้ง 6 ดันเจี้ยนใหญ่ พร้อมลำดับเทิร์น (Turn Order) ความเร็วสปีดที่ต้องจูน และอัตราการดรอปรูน/อาร์ติแฟกต์จริงจากระบบฐานข้อมูล SWM แปลไทยครบถ้วน 100%
          </p>
        </div>

        {/* Aggregate KPI */}
        <div className="relative z-10 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl p-3.5 flex items-center gap-4 text-xs font-mono shadow-xl shrink-0">
          <div>
            <div className="text-slate-400 text-[11px]">บันทึกการฟาร์ม</div>
            <div className="text-cyan-400 font-bold text-sm">110,000+ รอบ</div>
          </div>
          <div className="w-px h-8 bg-white/10"></div>
          <div>
            <div className="text-slate-400 text-[11px]">ความแม่นยำ</div>
            <div className="text-emerald-400 font-bold text-sm">99.8% Success</div>
          </div>
        </div>
      </div>

      {/* 6 Dungeon Selector Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5">
        {dungeonList.map((d) => {
          const isSelected = selectedDungeonId === d.id;
          const e = ELEMENT_STYLES[d.element] || ELEMENT_STYLES.Water;
          const Icon = e.icon;

          return (
            <button
              key={d.id}
              onClick={() => setSelectedDungeonId(d.id)}
              className={`p-3 rounded-xl border text-left transition-all duration-200 relative group flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#152336] border-cyan-500/80 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                  : 'bg-[#101724] border-[#1d2a3c] hover:border-slate-500 hover:bg-[#131d2d]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${e.bg}`}>
                    <Icon className="w-3 h-3" />
                    <span>{e.label}</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 font-medium">
                    {d.totalRuns} รอบ
                  </span>
                </div>
                <div className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                  {d.nameTh.split('(')[0]}
                </div>
              </div>

              <div className="mt-2 pt-1.5 border-t border-[#1d2a3c] flex items-center justify-between text-[11px] font-mono">
                <span className="text-emerald-400 font-bold">⏱ {d.avgTime}</span>
                <span className="text-slate-400">{d.successRate}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Dungeon Overview Box */}
      <div className="bg-[#111927] border border-[#1e2a3c] rounded-2xl p-5 sm:p-6 space-y-6">
        
        {/* Dungeon Title & Header Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#1c2738] pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${elemMeta.bg}`}>
                <ElemIcon className="w-3.5 h-3.5" />
                <span>{elemMeta.label}</span>
              </span>
              <span className="text-xs font-mono text-slate-400">
                SWM Dungeon ID #{currentDungeon.dungeonId} (Stage {currentDungeon.stageId})
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-1.5">
              {currentDungeon.nameTh}
            </h2>
            <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
              <span>สกิลหัวหน้าทีม (Leader Skill):</span>
              <span className="text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {currentDungeon.leaderSkill}
              </span>
            </div>
          </div>

          {/* Performance Badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="bg-[#0b1018] border border-[#1d2b3e] px-3.5 py-2 rounded-xl text-center min-w-[100px]">
              <div className="text-[11px] text-slate-400 font-mono">เวลาเฉลี่ย (Avg)</div>
              <div className="text-base sm:text-lg font-mono font-bold text-emerald-400">{currentDungeon.avgTime} นาที</div>
            </div>
            <div className="bg-[#0b1018] border border-[#1d2b3e] px-3.5 py-2 rounded-xl text-center min-w-[100px]">
              <div className="text-[11px] text-slate-400 font-mono">เร็วสุด (Record)</div>
              <div className="text-base sm:text-lg font-mono font-bold text-cyan-400">{currentDungeon.recordTime} นาที</div>
            </div>
            <div className="bg-[#0b1018] border border-[#1d2b3e] px-3.5 py-2 rounded-xl text-center min-w-[100px]">
              <div className="text-[11px] text-slate-400 font-mono">อัตราผ่าน (Win)</div>
              <div className="text-base sm:text-lg font-mono font-bold text-amber-400">{currentDungeon.successRate}</div>
            </div>
            <div className="bg-[#0b1018] border border-[#1d2b3e] px-3.5 py-2 rounded-xl text-center min-w-[100px]">
              <div className="text-[11px] text-slate-400 font-mono">ฐานข้อมูล (Runs)</div>
              <div className="text-base sm:text-lg font-mono font-bold text-indigo-300">{currentDungeon.totalRuns} รอบ</div>
            </div>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#1c2738] pb-3 text-xs sm:text-sm font-semibold">
          <button
            onClick={() => setActiveSubTab('team')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-2 ${
              activeSubTab === 'team'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                : 'text-slate-400 hover:text-white bg-[#152030]'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>สูตรทีมสปีด & ลำดับเทิร์น (Speed Team)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('drops')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-2 ${
              activeSubTab === 'drops'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                : 'text-slate-400 hover:text-white bg-[#152030]'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>สถิติดรอปไอเทม & รูนจริง ({currentDungeon.totalRuns} รอบ)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('boss')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-2 ${
              activeSubTab === 'boss'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                : 'text-slate-400 hover:text-white bg-[#152030]'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>สเตตัสบอส & กลไกแก้ทาง (Boss Mechanics)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('calc')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'calc'
                ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white bg-[#152030]'
            }`}
          >
            <Sliders className="w-4 h-4 text-amber-300" />
            <span>🎛️ เครื่องคำนวณวันช็อต & สปีด (Simulator)</span>
          </button>
        </div>

        {/* TAB 0: Interactive Damage & Speed Simulator */}
        {activeSubTab === 'calc' && (
          <AbyssCalculatorPanel />
        )}

        {/* TAB 1: Speed Team & Turn Order */}
        {activeSubTab === 'team' && (
          <div className="space-y-6">
            {/* Monster 5-Slot Card Grid */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
                  <span>มอนสเตอร์ในทีมที่แนะนำ (Recommended 5-Monster Team)</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">เรียงตามตำแหน่ง Pos #1 ถึง #5</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {currentDungeon.recommendedTeam.map((m, idx) => (
                  <div
                    key={idx}
                    className="bg-[#0e1624] border border-[#1e2d42] hover:border-cyan-500/50 rounded-xl p-3 flex flex-col justify-between transition-all group"
                  >
                    <div>
                      {/* Portrait & Position Badge */}
                      <div className="flex items-center gap-3">
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden border-2 border-[#25374e] group-hover:border-cyan-400 transition-colors shadow-md flex-shrink-0 bg-black">
                          <img
                            src={m.img}
                            alt={m.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0001_0_0.png'; }}
                          />
                          <span className="absolute bottom-0 right-0 bg-cyan-600 text-white text-[10px] font-mono font-bold px-1 rounded-tl">
                            #{idx + 1}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-white font-bold text-xs truncate group-hover:text-cyan-300 transition-colors">
                            {m.name}
                          </h4>
                          <span className="text-[11px] text-amber-400 font-mono block mt-0.5">
                            SPD {m.spd}
                          </span>
                          <span className="text-[11px] text-cyan-400/90 font-mono block">
                            {m.rune}
                          </span>
                        </div>
                      </div>

                      {/* Role Explanation in Thai */}
                      <div className="mt-2.5 pt-2 border-t border-[#182333] text-xs text-slate-300 leading-tight">
                        {m.role}
                      </div>
                    </div>

                    {/* Quick Link to Catalog */}
                    {onNavigate && (
                      <button
                        onClick={() => onNavigate('catalog', { search: m.name.replace(/\s*\(.*\)/, '') })}
                        className="mt-3 text-[11px] text-blue-400 hover:text-blue-300 flex items-center justify-end gap-1 transition-colors"
                      >
                        <span>ดูสเตตัสในสารานุกรม</span>
                        <span>→</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Turn Order Sequence Callout */}
            <div className="bg-[#0b121c] border border-cyan-500/30 rounded-xl p-4 sm:p-5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 uppercase tracking-wider font-mono">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span>ลำดับการออกสกิลที่แม่นยำ (Optimal Turn Order & Tactics):</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans font-medium">
                {currentDungeon.turnOrderTh}
              </p>
            </div>

            {/* Boss Mechanics Warning */}
            <div className="bg-[#121927] border border-amber-500/30 rounded-xl p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300 font-mono">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>จุดสำคัญที่ต้องระวังในการสปีดรัน (Boss Mechanic Strategy):</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {currentDungeon.bossMechanicTh}
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: Real Drop Rates & Rune Distributions */}
        {activeSubTab === 'drops' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left (7 cols): Main Item Drops Table */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-bold text-white font-mono flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>อัตราการดรอปไอเทมและรูน (จากบันทึกจริง {currentDungeon.totalRuns} รอบ)</span>
                  </h3>
                </div>

                <div className="bg-[#0c121d] border border-[#1e2a3c] rounded-xl overflow-hidden shadow-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#141d2c] text-slate-300 font-semibold border-b border-[#1f2c3f]">
                      <tr>
                        <th className="py-2.5 px-3">ไอเทมที่ดรอป (Item)</th>
                        <th className="py-2.5 px-3 text-right">อัตราดรอป (Drop Rate)</th>
                        <th className="py-2.5 px-3 text-center">จำนวนที่ดรอป</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#182333] text-slate-300 font-sans">
                      {currentDungeon.itemDrops.map((drop, idx) => (
                        <tr key={idx} className="hover:bg-[#141f30] transition-colors">
                          <td className="py-2.5 px-3 font-medium text-white flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                            <div>
                              <div>{drop.itemTh}</div>
                              <div className="text-[11px] text-slate-400 font-mono">{drop.itemEn}</div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                            {drop.rate}
                            <div className="text-[11px] text-slate-400 font-normal">{drop.counts}</div>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-300">
                            {drop.amount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right (5 cols): Rune Sets or Artifact Sets Distribution */}
              <div className="lg:col-span-5 space-y-3">
                <h3 className="text-xs sm:text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>สัดส่วนการดรอปเซ็ตรูน / อาร์ติแฟกต์</span>
                </h3>

                <div className="bg-[#0c121d] border border-[#1e2a3c] rounded-xl p-4 space-y-2.5">
                  {currentDungeon.runeSets.map((rs, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-white">{rs.setTh || rs.setEn}</span>
                        <span className="font-mono text-cyan-300 font-bold">{rs.percent} ({rs.count})</span>
                      </div>
                      <div className="w-full bg-[#182333] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                          style={{ width: rs.percent }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* General Resource Drops */}
                <div className="bg-[#0c121d] border border-[#1e2a3c] rounded-xl p-3.5 space-y-2">
                  <div className="text-xs font-bold text-slate-400 uppercase font-mono">
                    ทรัพยากรพื้นฐานที่ได้รับเฉลี่ยต่อรอบ (General Resources)
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    {currentDungeon.generalDrops.map((gd, idx) => (
                      <div key={idx} className="bg-[#131d2b] p-2 rounded-lg border border-[#1f2e43]">
                        <div className="text-slate-400 text-[11px]">{gd.itemTh.split('(')[0]}</div>
                        <div className="text-emerald-400 font-mono font-bold mt-0.5">{gd.rate}</div>
                        <div className="text-[11px] text-slate-400">เฉลี่ย {gd.avg}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: Boss Stats & Detailed Attributes */}
        {activeSubTab === 'boss' && (
          <div className="space-y-4">
            <h3 className="text-xs sm:text-sm font-bold text-white font-mono flex items-center gap-2">
              <Target className="w-4 h-4 text-rose-400" />
              <span>สเตตัสอย่างเป็นทางการของบอสประจำชั้น (Official Boss Wave Stats)</span>
            </h3>

            {currentDungeon.bossStats ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                <div className="bg-[#0b1018] border border-[#1d2b3e] p-3 rounded-xl text-center">
                  <div className="text-[11px] text-slate-400">เลเวล (Level)</div>
                  <div className="text-lg font-mono font-bold text-white mt-1">{currentDungeon.bossStats.level}</div>
                </div>
                <div className="bg-[#0b1018] border border-[#1d2b3e] p-3 rounded-xl text-center">
                  <div className="text-[11px] text-slate-400">พลังชีวิต (HP)</div>
                  <div className="text-lg font-mono font-bold text-emerald-400 mt-1">{currentDungeon.bossStats.hp}</div>
                </div>
                <div className="bg-[#0b1018] border border-[#1d2b3e] p-3 rounded-xl text-center">
                  <div className="text-[11px] text-slate-400">พลังโจมตี (ATK)</div>
                  <div className="text-lg font-mono font-bold text-rose-400 mt-1">{currentDungeon.bossStats.atk}</div>
                </div>
                <div className="bg-[#0b1018] border border-[#1d2b3e] p-3 rounded-xl text-center">
                  <div className="text-[11px] text-slate-400">พลังป้องกัน (DEF)</div>
                  <div className="text-lg font-mono font-bold text-blue-400 mt-1">{currentDungeon.bossStats.def}</div>
                </div>
                <div className="bg-[#0b1018] border border-[#1d2b3e] p-3 rounded-xl text-center">
                  <div className="text-[11px] text-slate-400">ความเร็ว (SPD)</div>
                  <div className="text-lg font-mono font-bold text-cyan-400 mt-1">{currentDungeon.bossStats.spd}</div>
                </div>
                <div className="bg-[#0b1018] border border-[#1d2b3e] p-3 rounded-xl text-center">
                  <div className="text-[11px] text-slate-400">ต้านทาน (RES)</div>
                  <div className="text-lg font-mono font-bold text-amber-400 mt-1">{currentDungeon.bossStats.res}</div>
                </div>
                <div className="bg-[#0b1018] border border-[#1d2b3e] p-3 rounded-xl text-center">
                  <div className="text-[11px] text-slate-400">แม่นยำ (ACC)</div>
                  <div className="text-lg font-mono font-bold text-indigo-300 mt-1">{currentDungeon.bossStats.acc}</div>
                </div>
                <div className="bg-[#0b1018] border border-[#1d2b3e] p-3 rounded-xl text-center">
                  <div className="text-[11px] text-slate-400">อัตราคริ (CR)</div>
                  <div className="text-lg font-mono font-bold text-pink-400 mt-1">{currentDungeon.bossStats.cr}</div>
                </div>
              </div>
            ) : (
              <div className="text-slate-400 text-xs py-4 text-center">ไม่พบข้อมูลสเตตัสบอสสำหรับดันเจี้ยนนี้</div>
            )}

            {/* Strategic Summary Box */}
            <div className="bg-[#0b121c] border border-[#1f2e43] rounded-xl p-4 sm:p-5 space-y-2">
              <h4 className="text-xs font-bold text-cyan-300 font-mono">
                คำแนะนำในการปรับสปีดและการทำดาเมจ:
              </h4>
              <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-300 leading-relaxed">
                <li>
                  <strong className="text-white">ความเร็วโจมตี (SPD Tuning):</strong> มอนสเตอร์เปิดเกราะแตก (เช่น Prilea หรือ Loren) ต้องมีความเร็ว SPD รวมสูงกว่ามอนสเตอร์ตัวดาเมจเสมออย่างน้อย 15-20 แต้ม เพื่อป้องกันการโดนแทรกเทิร์น
                </li>
                <li>
                  <strong className="text-white">ความแม่นยำ (Accuracy):</strong> ตัวเจาะเกราะ Def Break และตัวห้ามบัฟ Block Buff ต้องการความแม่นยำ ACC อย่างน้อย <strong>45% - 55%</strong> เพื่อให้ติดดีบัฟ 100% ต่อค่าความต้านทาน RES ของบอส
                </li>
                <li>
                  <strong className="text-white">การทำดาเมจตาม % HP:</strong> บอสระดับ Abyss Hard มีพลังชีวิตหนากว่า 350,000+ HP การใช้มอนสเตอร์อย่าง Lyn, Shamann, หรือ Wind Homunculus ที่มีสกิลโจมตีตามสัดส่วน HP สูงสุดของศัตรู จะทำดาเมจได้หลักแสนต่อการโจมตีหนึ่งครั้ง
                </li>
              </ul>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
