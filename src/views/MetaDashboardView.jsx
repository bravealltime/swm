import React, { useState } from 'react';
import { 
  TrendingUp, 
  BarChart3, 
  Trophy, 
  Flame, 
  Award, 
  Users, 
  Swords, 
  Shield, 
  ArrowRight,
  Sparkles,
  PieChart
} from 'lucide-react';
import MonsterAvatar from '../components/MonsterAvatar';
import { MONSTERS } from '../data/monsters';

// Player rank distribution data
const RANK_DISTRIBUTION = [
  { rank: 'Guardian 3 (G3)', percent: 0.1, count: '300 คน', cutoff: '2,185 คะแนน', color: 'bg-red-500' },
  { rank: 'Guardian 2 (G2)', percent: 0.3, count: '1,000 คน', cutoff: '2,040 คะแนน', color: 'bg-orange-500' },
  { rank: 'Guardian 1 (G1)', percent: 1.0, count: '3,500 คน', cutoff: '1,915 คะแนน', color: 'bg-amber-400' },
  { rank: 'Punisher 3 (P3)', percent: 2.5, count: '7,500 คน', cutoff: '1,830 คะแนน', color: 'bg-emerald-500' },
  { rank: 'Punisher 2 (P2)', percent: 5.0, count: '15,000 คน', cutoff: '1,750 คะแนน', color: 'bg-teal-500' },
  { rank: 'Punisher 1 (P1)', percent: 10.0, count: '30,000 คน', cutoff: '1,680 คะแนน', color: 'bg-cyan-500' },
  { rank: 'Conqueror 3 (C3)', percent: 15.0, count: '45,000 คน', cutoff: '1,590 คะแนน', color: 'bg-blue-500' },
  { rank: 'Conqueror 2 (C2)', percent: 20.0, count: '60,000 คน', cutoff: '1,510 คะแนน', color: 'bg-indigo-500' },
  { rank: 'Conqueror 1 (C1)', percent: 25.0, count: '75,000 คน', cutoff: '1,420 คะแนน', color: 'bg-purple-500' },
  { rank: 'Fighter & Below', percent: 21.1, count: '100,000+ คน', cutoff: '< 1,420 คะแนน', color: 'bg-slate-600' }
];

// Top Contested Monsters
const TOP_CONTESTED = [
  { name: 'Oliver', contestRate: '84.2%', pickRate: '48.5%', banRate: '35.7%', winRate: '53.8%' },
  { name: 'Cheongpung', contestRate: '78.6%', pickRate: '45.1%', banRate: '33.5%', winRate: '52.9%' },
  { name: 'Moore', contestRate: '75.3%', pickRate: '52.0%', banRate: '23.3%', winRate: '51.4%' },
  { name: 'Sonia', contestRate: '72.1%', pickRate: '39.4%', banRate: '32.7%', winRate: '54.6%' },
  { name: 'Byungchul', contestRate: '69.8%', pickRate: '42.6%', banRate: '27.2%', winRate: '53.1%' },
  { name: 'Chandra', contestRate: '66.4%', pickRate: '44.8%', banRate: '21.6%', winRate: '52.7%' },
];

export default function MetaDashboardView({ onNavigate }) {
  const getMonsterObj = (name) => {
    return MONSTERS.find(m => m.name.toLowerCase() === name.toLowerCase()) || {
      name,
      avatarUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0001_0_0.png',
      element: 'wind'
    };
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-br from-[#101a2d] via-[#0d1422] to-[#090e18] border border-[#1b2a40] rounded-2xl p-5 sm:p-7 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <span>Lucksack Meta Dashboard • Season 38 Analytics</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              เมต้าแดชบอร์ด & การกระจายแรงค์ (Meta Dashboard)
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              ภาพรวมสถิติซีซั่น 38 ครบวงจร: กราฟการกระจายผู้เล่นในแต่ละแรงค์ (Rank Distribution), ความได้เปรียบของฝ่าย First Pick, และมอนสเตอร์ที่ถูกแย่งพิก/แบนสูงสุด (Contested Rate)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('draft-explorer')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-600/30 cursor-pointer"
            >
              <Swords className="w-4 h-4" />
              <span>เปิดระบบจำลองดราฟต์</span>
            </button>
          </div>
        </div>

        {/* First Pick Advantage Statistics Box */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[#182638]">
          <div className="p-4 rounded-xl bg-[#080d16] border border-[#1b283d] space-y-1">
            <div className="text-xs text-slate-400 font-medium">ความได้เปรียบ First Pick (พิกแรก)</div>
            <div className="text-xl font-mono font-black text-cyan-400">51.8% WIN RATE</div>
            <div className="text-[11px] text-slate-500">ฝ่ายเริ่มก่อนได้เปรียบชิงมอนสเตอร์เมต้า Tier S+</div>
          </div>

          <div className="p-4 rounded-xl bg-[#080d16] border border-[#1b283d] space-y-1">
            <div className="text-xs text-slate-400 font-medium">ความได้เปรียบ Second Pick (พิกหลัง)</div>
            <div className="text-xl font-mono font-black text-rose-400">48.2% WIN RATE</div>
            <div className="text-[11px] text-slate-500">ได้เปรียบจังหวะ Double Pick และ Last Pick เคาน์เตอร์</div>
          </div>

          <div className="p-4 rounded-xl bg-[#080d16] border border-[#1b283d] space-y-1">
            <div className="text-xs text-slate-400 font-medium">จำนวนแมตช์ที่เก็บรวบรวม</div>
            <div className="text-xl font-mono font-black text-amber-400">6,842,100 แมตช์</div>
            <div className="text-[11px] text-slate-500">บันทึกสดผ่านระบบ SWRT & Lucksack Engine</div>
          </div>
        </div>
      </div>

      {/* 2. Player Rank Distribution Breakdown */}
      <div className="bg-[#0c1320] border border-[#1b2b42] rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#182638]">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">
              การกระจายตัวของผู้เล่นและเกณฑ์คะแนนตัดเกรด (Rank Cutoffs & Player Distribution)
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">Season 38 Official</span>
        </div>

        {/* Stacked Percentage Bar */}
        <div className="space-y-2">
          <div className="w-full h-5 rounded-lg bg-slate-900 overflow-hidden flex p-0.5 border border-[#1f3047]">
            {RANK_DISTRIBUTION.map((item, idx) => (
              <div
                key={idx}
                className={`${item.color} h-full transition-all hover:opacity-80 cursor-pointer`}
                style={{ width: `${item.percent}%` }}
                title={`${item.rank}: ${item.percent}%`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono px-1">
            <span>◄ Top 0.1% (Guardian 3)</span>
            <span>Conqueror (Top 15-25%)</span>
            <span>Fighter (ผู้เล่นทั่วไป) ►</span>
          </div>
        </div>

        {/* Ranks Table Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {RANK_DISTRIBUTION.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-[#080d16] border border-[#182638] flex items-center justify-between hover:border-slate-500 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className={`w-3 h-3 rounded-full ${item.color}`} />
                <div>
                  <div className="text-xs font-bold text-white">{item.rank}</div>
                  <div className="text-[10px] text-slate-400 font-mono">สัดส่วน {item.percent}% ({item.count})</div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-mono font-bold text-amber-300">{item.cutoff}</div>
                <div className="text-[9px] text-slate-500 uppercase">จุดตัดคะแนน</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Top Contested Monsters Grid */}
      <div className="bg-[#0c1320] border border-[#1b2b42] rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#182638]">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">
              มอนสเตอร์ที่ถูกแย่งชิงสูงสุดในซีซั่น 38 (Top Contested Units)
            </h2>
          </div>
          <span className="text-xs text-slate-400">คำนวณจาก Pick Rate + Ban Rate</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOP_CONTESTED.map((unit, idx) => {
            const m = getMonsterObj(unit.name);
            return (
              <div
                key={idx}
                className="p-4 rounded-xl bg-[#080d16] border border-[#182638] hover:border-rose-500/50 transition-all flex items-center justify-between group shadow-md"
              >
                <div className="flex items-center gap-3">
                  <MonsterAvatar monster={m} size="md" showStars={false} />
                  <div>
                    <div className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors">
                      {unit.name}
                    </div>
                    <div className="text-xs text-rose-400 font-mono font-bold">
                      Contested: {unit.contestRate}
                    </div>
                  </div>
                </div>

                <div className="text-right text-xs font-mono space-y-0.5">
                  <div className="text-slate-300">Pick: <strong className="text-cyan-400">{unit.pickRate}</strong></div>
                  <div className="text-slate-300">Ban: <strong className="text-amber-400">{unit.banRate}</strong></div>
                  <div className="text-slate-300">WR: <strong className="text-emerald-400">{unit.winRate}</strong></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
