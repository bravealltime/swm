import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Shield, 
  Swords, 
  Compass, 
  Search, 
  Flame, 
  Trophy, 
  ArrowRight, 
  Zap, 
  Award, 
  Sparkles,
  Layers,
  Activity,
  CheckCircle2
} from 'lucide-react';
import ALL_MDC_DATA from '../data/allMdcData.json';
import MonsterAvatar from '../components/MonsterAvatar';

export default function MdcStatsView({ onNavigate }) {
  const [activeCategory, setActiveCategory] = useState('all'); // 'all', 'meta', 'activity', 'performance', 'utility'

  // Calculations for stats
  const totalDefenses = ALL_MDC_DATA.length;
  const totalBattles = ALL_MDC_DATA.reduce((acc, d) => acc + (d.totalBattles || 0), 0);
  const totalCounters = ALL_MDC_DATA.reduce((acc, d) => acc + (d.counters?.length || 0), 0);

  // Top defenses by battle count
  const topBattledDefenses = [...ALL_MDC_DATA]
    .sort((a, b) => (b.totalBattles || 0) - (a.totalBattles || 0))
    .slice(0, 6);

  // Top defenses by winrate (min 30 battles)
  const highestWinrateDefenses = [...ALL_MDC_DATA]
    .filter(d => (d.totalBattles || 0) >= 20)
    .sort((a, b) => (b.winRate || 0) - (a.winRate || 0))
    .slice(0, 6);

  // High win rate counters (>88% win rate)
  const topCounters = [];
  ALL_MDC_DATA.forEach(def => {
    (def.counters || []).forEach(c => {
      if ((c.winRate || 0) >= 88 && (c.battles || 0) >= 15) {
        topCounters.push({
          counter: c,
          againstDef: def
        });
      }
    });
  });
  const sortedTopCounters = topCounters
    .sort((a, b) => (b.counter.winRate || 0) - (a.counter.winRate || 0))
    .slice(0, 6);

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-[#1c2738] pb-5">
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1">
          <BarChart3 className="w-4 h-4" />
          SWGT 3MDC Statistics & Analytics Hub • ศูนย์รวมรายงานและแนวโน้มการแข่งขัน
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          สถิติและรายงานผล 3MDC (3MDC Statistics)
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
          สำรวจรายงานแนวโน้มทีมตั้งรับ, ประสิทธิภาพทีมบุกเคาน์เตอร์, สถิติอัตราการชนะ ชนะ/แพ้ จากฐานข้อมูลการแข่งขันจริงกว่า {totalBattles.toLocaleString()} แมตช์
        </p>
      </div>

      {/* Overview Stat Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#101724] border border-[#1d2b3f] shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>ทีมรับในระบบ</span>
            <Shield className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-black text-white mt-1">
            {totalDefenses.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">ทีมเมต้าหอ 4★ และ 5★</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#101724] border border-[#1d2b3f] shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>สูตรทีมบุกเคาน์เตอร์</span>
            <Swords className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-black text-emerald-400 mt-1">
            {totalCounters.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">สูตรเจาะพร้อม Win Rate</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#101724] border border-[#1d2b3f] shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>แมตช์ที่บันทึก</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-black text-amber-400 mt-1">
            {totalBattles.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">รอบการต่อสู้ทั่วทุกเซิร์ฟ</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#101724] border border-[#1d2b3f] shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>มาตรฐานความแม่นยำ</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-black text-purple-400 mt-1">
            100%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">SWGT Authentic Certified</div>
        </div>
      </div>

      {/* Category Chips Bar */}
      <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[#101724] border border-[#1d2b3f] overflow-x-auto">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeCategory === 'all' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          📊 ดูรายงานทั้งหมด
        </button>
        <button
          onClick={() => setActiveCategory('meta')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeCategory === 'meta' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          🔥 Trending & Meta (แนวโน้มเมต้า)
        </button>
        <button
          onClick={() => setActiveCategory('activity')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeCategory === 'activity' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          🔍 Popular & Activity (ยอดนิยม)
        </button>
        <button
          onClick={() => setActiveCategory('performance')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeCategory === 'performance' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          ⚡ Battle Log Performance (ผลงานการต่อสู้)
        </button>
        <button
          onClick={() => setActiveCategory('utility')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeCategory === 'utility' ? 'bg-amber-500 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          🧭 Community & Utility (เครื่องมือช่วยเล่น)
        </button>
      </div>

      {/* 1. Trending & Meta Section */}
      {(activeCategory === 'all' || activeCategory === 'meta') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-400" />
              Trending & Meta • รายงานแนวโน้มเมต้าล่าสุด
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              onClick={() => onNavigate && onNavigate('trending', { subItem: 'defense-trending' })}
              className="p-5 rounded-2xl bg-[#101724] border border-[#1d2b3f] hover:border-rose-500/50 transition-all cursor-pointer space-y-3 group shadow-xl"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white group-hover:text-rose-400 transition-colors">
                  96 ทีมตั้งรับยอดนิยมทั่วโลก
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  สถิติ 96 ทีมรับที่มีการใช้งานสูงสุดในเซิร์ฟเวอร์ Global, Asia, Europe พร้อมอัตราการชนะและจำนวนแมตช์
                </p>
              </div>
              <div className="pt-2 text-xs font-bold text-rose-400 flex items-center gap-1">
                เปิดรายงานวิเคราะห์ <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            <div 
              onClick={() => onNavigate && onNavigate('trending', { subItem: 'monster-defense-trending' })}
              className="p-5 rounded-2xl bg-[#101724] border border-[#1d2b3f] hover:border-blue-500/50 transition-all cursor-pointer space-y-3 group shadow-xl"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                  Monster Defense Trending (Tier List 202 ตัว)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  จัดอันดับ Tier List มอนสเตอร์สายป้องกัน SSS ถึง F ตามข้อมูล Bayesian แท้ 1:1 ของ SWGT
                </p>
              </div>
              <div className="pt-2 text-xs font-bold text-blue-400 flex items-center gap-1">
                ดู Tier List แท้ 100% <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            <div 
              onClick={() => onNavigate && onNavigate('trending', { subItem: 'monster-offense-trending' })}
              className="p-5 rounded-2xl bg-[#101724] border border-[#1d2b3f] hover:border-emerald-500/50 transition-all cursor-pointer space-y-3 group shadow-xl"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Swords className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                  Monster Offense Trending (ตัวบุกยอดฮิต 247 ตัว)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  สถิติตัวบุกยอดนิยมและประสิทธิภาพในการเจาะทีมรับกิลด์วอร์
                </p>
              </div>
              <div className="pt-2 text-xs font-bold text-emerald-400 flex items-center gap-1">
                ดูสถิติตัวบุก <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Popular & Activity Section */}
      {(activeCategory === 'all' || activeCategory === 'activity') && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-400" />
              Popular & Activity • ทีมรับที่มีการปะทะบ่อยที่สุด (Top Battled Defenses)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topBattledDefenses.map((def) => (
              <div 
                key={def.id}
                className="p-4 rounded-2xl bg-[#101724] border border-[#1d2b3f] hover:border-blue-500/50 transition-all flex flex-col justify-between space-y-3 shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-black text-white">{def.title}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{def.towerType === 'nat4' ? 'หอ 4 ดาว' : 'หอ 5 ดาว'}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    {def.totalBattles} แมตช์
                  </span>
                </div>

                <div className="flex items-center gap-2 bg-[#0c121c] p-2.5 rounded-xl border border-[#1d2b3f]">
                  {def.defenseMonsters.map((m, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <MonsterAvatar monster={m} size="sm" />
                      <span className="text-[11px] font-bold text-slate-300 hidden sm:inline">{m.name}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-[#182333]">
                  <span className="text-slate-400">อัตราป้องกันสำเร็จ: <strong className="text-white font-mono">{def.winRate}%</strong></span>
                  <button
                    onClick={() => onNavigate && onNavigate('3mdc', { search: def.title })}
                    className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    ดูทีมเจาะ <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Battle Log Performance Section */}
      {(activeCategory === 'all' || activeCategory === 'performance') && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-400" />
              Battle Log Performance • สูตรทีมบุกที่มีอัตราการชนะสูงสุด (&gt;88% Win Rate)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedTopCounters.map((item, idx) => (
              <div 
                key={idx}
                className="p-4 rounded-2xl bg-[#101724] border border-[#1d2b3f] hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-3 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300">เจาะทีม: <strong className="text-white">{item.againstDef.title}</strong></span>
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    WR {item.counter.winRate}%
                  </span>
                </div>

                <div className="bg-[#0c121c] p-2.5 rounded-xl border border-[#1d2b3f]">
                  <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">ทีมบุกที่ใช้:</div>
                  <div className="flex items-center gap-2">
                    {item.counter.monsters.map((m, mIdx) => (
                      <div key={mIdx} className="flex items-center gap-1.5">
                        <MonsterAvatar monster={m} size="sm" />
                        <span className="text-[11px] font-bold text-slate-200 hidden sm:inline">{m.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-[#182333]">
                  <span>สถิติการรบ: <strong className="text-slate-200 font-mono">{item.counter.battles} รอบ</strong></span>
                  <button
                    onClick={() => onNavigate && onNavigate('3mdc', { search: item.againstDef.title })}
                    className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    ดูรายละเอียด <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Community & Utility Section */}
      {(activeCategory === 'all' || activeCategory === 'utility') && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-400" />
              Community & Utility • เครื่องมือวิเคราะห์เสริมสำหรับผู้เล่น
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              onClick={() => onNavigate && onNavigate('where2use')}
              className="p-5 rounded-2xl bg-[#101724] border border-[#1d2b3f] hover:border-amber-500/50 transition-all cursor-pointer space-y-3 group shadow-xl"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                Where to Use? (มอนสเตอร์ตัวนี้ใช้ที่ไหน?)
              </h3>
              <p className="text-xs text-slate-400">
                ค้นหาการใช้งานแบบ All-in-One: ทีมรับกิลด์วอร์, ทีมบุกเคาน์เตอร์, สปีดดันเจี้ยน และ RTA
              </p>
              <div className="pt-2 text-xs font-bold text-amber-400 flex items-center gap-1">
                เข้าสู่เครื่องมือ <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            <div 
              onClick={() => onNavigate && onNavigate('siege-calculator')}
              className="p-5 rounded-2xl bg-[#101724] border border-[#1d2b3f] hover:border-cyan-500/50 transition-all cursor-pointer space-y-3 group shadow-xl"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Trophy className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">
                Siege Battle Points Calculator
              </h3>
              <p className="text-xs text-slate-400">
                คำนวณอัตราคะแนนต่อนาที (Tick Rate) เวลาที่เหลือจนกว่าจะชนะ 20,000 แต้ม และคำแนะนำตัดฐาน
              </p>
              <div className="pt-2 text-xs font-bold text-cyan-400 flex items-center gap-1">
                เข้าสู่เครื่องมือ <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            <div 
              onClick={() => onNavigate && onNavigate('artifact')}
              className="p-5 rounded-2xl bg-[#101724] border border-[#1d2b3f] hover:border-orange-500/50 transition-all cursor-pointer space-y-3 group shadow-xl"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
                <Flame className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-orange-400 transition-colors">
                Artifact Additional Damage Optimizer
              </h3>
              <p className="text-xs text-slate-400">
                จำลองสูตรคำนวณดาเมจเสริม Multi-hit และค้นหามอนสเตอร์ตามออปชั่นอาร์ติแฟกต์
              </p>
              <div className="pt-2 text-xs font-bold text-orange-400 flex items-center gap-1">
                เข้าสู่เครื่องมือ <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
