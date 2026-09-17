import React, { useState } from 'react';
import { Trophy, Globe, Search, ShieldCheck } from 'lucide-react';
import { LEADERBOARDS } from '../data/leaderboards';

export default function LeaderboardsView() {
  const [selectedServer, setSelectedServer] = useState('asia');
  const [searchQuery, setSearchQuery] = useState('');

  const servers = [
    { id: 'asia', name: 'เซิร์ฟเวอร์ Asia (เอเชีย)', flag: '🌏' },
    { id: 'global', name: 'เซิร์ฟเวอร์ Global (สากล)', flag: '🌐' },
    { id: 'europe', name: 'เซิร์ฟเวอร์ Europe (ยุโรป)', flag: '🇪🇺' },
    { id: 'japanKorea', name: 'เซิร์ฟเวอร์ Japan + Korea', flag: '🇯🇵' },
  ];

  const currentGuilds = (LEADERBOARDS[selectedServer] || []).filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-amber-400 mb-1">
          <Trophy className="w-4 h-4" />
          Siege & World Guild Battle Leaderboards
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          ตารางจัดอันดับกิลด์ระดับโลก (Leaderboard)
        </h1>
        <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
          ติดตามคะแนนการแข่งขัน ประวัติ ชนะ-แพ้ และอันดับกิลด์ชั้นนำในแต่ละเซิร์ฟเวอร์
        </p>
      </div>

      {/* Server Selection Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-xl bg-[#101724] border border-[#1d2b3f]">
        {servers.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedServer(s.id)}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer ${
              selectedServer === s.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-[#16202f]'
            }`}
          >
            <span>{s.flag}</span>
            <span>{s.name}</span>
          </button>
        ))}
      </div>

      {/* Guild Search Bar */}
      <div className="bg-[#101724] p-3 rounded-xl border border-[#1d2b3f] flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 ml-1 shrink-0" />
        <input
          type="text"
          className="w-full bg-transparent border-none text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
          placeholder="ค้นหาชื่อกิลด์ เช่น Siam Paragon, SAY SWGT, Dragon Slayer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-xs text-slate-400 hover:text-white mr-1">
            ✕
          </button>
        )}
      </div>

      {/* Leaderboard Table */}
      <div className="bg-[#101724] border border-[#1d2b3f] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1d2b3f] bg-[#0c121c] text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 text-center w-16">อันดับ</th>
                <th className="py-3.5 px-4">ชื่อกิลด์</th>
                <th className="py-3.5 px-4 text-center">ระดับแรงก์</th>
                <th className="py-3.5 px-4 text-center">ชนะ - แพ้</th>
                <th className="py-3.5 px-4 text-center">อัตราการชนะ</th>
                <th className="py-3.5 px-4 text-right">คะแนนซีซัน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1d2b3f] text-xs sm:text-sm">
              {currentGuilds.map((guild) => (
                <tr 
                  key={guild.rank}
                  className="hover:bg-[#152030] transition-colors"
                >
                  <td className="py-4 px-4 text-center font-mono font-bold">
                    {guild.rank === 1 ? (
                      <span className="inline-block px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-extrabold border border-amber-500/40">
                        #1
                      </span>
                    ) : guild.rank === 2 ? (
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-300/20 text-slate-200 font-extrabold border border-slate-400/40">
                        #2
                      </span>
                    ) : guild.rank === 3 ? (
                      <span className="inline-block px-2 py-0.5 rounded bg-amber-700/20 text-amber-600 font-extrabold border border-amber-700/40">
                        #3
                      </span>
                    ) : (
                      <span className="text-slate-400">#{guild.rank}</span>
                    )}
                  </td>

                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{guild.flag}</span>
                      <div>
                        <div className="font-bold text-white text-sm">
                          {guild.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          Siege Tournament Qualified
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-600/20 text-red-300 border border-red-500/30 font-bold text-xs">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {guild.rankTier}
                    </span>
                  </td>

                  <td className="py-4 px-4 text-center font-mono font-semibold text-slate-200">
                    {guild.winLoss}
                  </td>

                  <td className="py-4 px-4 text-center font-mono font-bold text-emerald-400">
                    {guild.winRate}
                  </td>

                  <td className="py-4 px-4 text-right font-mono font-bold text-blue-400 text-sm sm:text-base">
                    {guild.score.toLocaleString()} แต้ม
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
