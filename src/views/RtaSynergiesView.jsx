import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  TrendingUp, 
  Trophy, 
  Flame, 
  Shield, 
  Swords, 
  ArrowRight, 
  Sparkles,
  Layers,
  Filter
} from 'lucide-react';
import MonsterAvatar from '../components/MonsterAvatar';
import { MONSTERS } from '../data/monsters';
import RTA_SYNERGIES from '../data/rtaSynergies.json';

export default function RtaSynergiesView({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('duos'); // 'duos' | 'trios'
  const [searchQuery, setSearchQuery] = useState('');
  const [archetypeFilter, setArchetypeFilter] = useState('all');

  // Helper to find monster object
  const getMonster = (name) => {
    return MONSTERS.find(m => m.name.toLowerCase() === name.toLowerCase()) || {
      name,
      avatarUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0001_0_0.png',
      element: 'wind'
    };
  };

  // Filtered Duos
  const filteredDuos = useMemo(() => {
    return RTA_SYNERGIES.duos.filter(item => {
      if (archetypeFilter !== 'all' && !item.archetype.toLowerCase().includes(archetypeFilter.toLowerCase())) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchM1 = item.monsters[0].toLowerCase().includes(q);
        const matchM2 = item.monsters[1].toLowerCase().includes(q);
        const matchArch = item.archetype.toLowerCase().includes(q);
        const matchTh = item.thaiDesc.toLowerCase().includes(q);
        return matchM1 || matchM2 || matchArch || matchTh;
      }
      return true;
    });
  }, [searchQuery, archetypeFilter]);

  // Filtered Trios
  const filteredTrios = useMemo(() => {
    return RTA_SYNERGIES.trios.filter(item => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match = item.monsters.some(m => m.toLowerCase().includes(q));
        const matchArch = item.archetype.toLowerCase().includes(q);
        const matchTh = item.thaiDesc.toLowerCase().includes(q);
        return match || matchArch || matchTh;
      }
      return true;
    });
  }, [searchQuery]);

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-br from-[#101a2d] via-[#0d1422] to-[#090e18] border border-[#1b2a40] rounded-2xl p-5 sm:p-7 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>RTA Duo & Trio Synergy Analytics • Season 38</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              สถิติทีมคอมโบดูโอ้ & ทริโอ้ (RTA Synergies)
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              วิเคราะห์ความเข้าขากันของคู่มอนสเตอร์ 2 ตัว (Duo) และ 3 ตัวหลัก (Trio) ที่มีอัตรา Synergy Delta สูงสุด เมื่อจับคู่กันแล้ว Win Rate เพิ่มขึ้นอย่างมีนัยสำคัญ
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('draft-explorer')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-600/30 cursor-pointer"
            >
              <Swords className="w-4 h-4" />
              <span>ทดลองดราฟต์ 5v5</span>
            </button>
          </div>
        </div>

        {/* Tab switcher and search bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 bg-[#080d16] p-1 rounded-xl border border-[#1b283d] self-start">
            <button
              onClick={() => setActiveTab('duos')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'duos' 
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              👥 คอมโบคู่ 2 ตัว (Duo Stats - {RTA_SYNERGIES.duos.length})
            </button>
            <button
              onClick={() => setActiveTab('trios')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'trios' 
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🛡️ แกนหลัก 3 ตัว (Trio Cores - {RTA_SYNERGIES.trios.length})
            </button>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อมอนสเตอร์ (เช่น Oliver, Sonia, Leo)..."
              className="w-full bg-[#080d16] border border-[#1b283d] focus:border-cyan-400 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 2. Content View: Duos Tab */}
      {activeTab === 'duos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDuos.map((item) => {
            const m1 = getMonster(item.monsters[0]);
            const m2 = getMonster(item.monsters[1]);

            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-[#0c1320] border border-[#1b2b42] hover:border-cyan-500/50 transition-all space-y-3.5 shadow-lg group"
              >
                {/* Header: Avatars and Synergy Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MonsterAvatar monster={m1} size="md" showStars={false} />
                    <span className="text-sm font-light text-cyan-400">+</span>
                    <MonsterAvatar monster={m2} size="md" showStars={false} />
                  </div>

                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded-full text-xs font-mono font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      {item.synergyDelta} SYNERGY
                    </span>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {item.matches.toLocaleString()} แมตช์
                    </div>
                  </div>
                </div>

                {/* Names and Winrate */}
                <div className="flex items-center justify-between pt-1 border-t border-[#172436]">
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {item.monsters[0]} & {item.monsters[1]}
                    </h3>
                    <span className="text-xs text-amber-400 font-mono font-semibold">
                      {item.archetype}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-lg font-mono font-black text-white">
                      {item.winRate}%
                    </div>
                    <div className="text-[11px] text-slate-400 font-semibold">
                      WIN RATE
                    </div>
                  </div>
                </div>

                {/* Strategy Thai Description */}
                <p className="text-xs text-slate-300 leading-relaxed font-sans bg-[#080d16] p-2.5 rounded-xl border border-[#162130]">
                  {item.thaiDesc}
                </p>

                {/* Best Against */}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>ชนะทาง: <strong className="text-slate-200">{item.bestAgainst.join(', ')}</strong></span>
                  <button
                    onClick={() => onNavigate('draft-explorer')}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    ใส่ในดราฟต์ →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Content View: Trios Tab */}
      {activeTab === 'trios' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTrios.map((item) => {
            const m1 = getMonster(item.monsters[0]);
            const m2 = getMonster(item.monsters[1]);
            const m3 = getMonster(item.monsters[2]);

            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-[#0c1320] border border-[#1b2b42] hover:border-amber-500/50 transition-all space-y-3.5 shadow-lg group"
              >
                {/* Header: 3 Avatars */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MonsterAvatar monster={m1} size="sm" showStars={false} />
                    <MonsterAvatar monster={m2} size="sm" showStars={false} />
                    <MonsterAvatar monster={m3} size="sm" showStars={false} />
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-lg font-mono font-black text-amber-400">
                      {item.winRate}% WR
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {item.matches.toLocaleString()} แมตช์
                    </div>
                  </div>
                </div>

                <div className="pt-1 border-t border-[#172436]">
                  <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                    {item.monsters.join(' + ')}
                  </h3>
                  <div className="text-xs text-cyan-400 font-semibold mt-0.5">
                    {item.archetype}
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-sans bg-[#080d16] p-2.5 rounded-xl border border-[#162130]">
                  {item.thaiDesc}
                </p>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>ตัวควรแบน: <strong className="text-rose-400">{item.banPriority}</strong></span>
                  <button
                    onClick={() => onNavigate('draft-explorer')}
                    className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    ทดสอบคอมโบนี้ →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
