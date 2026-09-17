import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  Globe, 
  Search, 
  ShieldCheck, 
  Swords, 
  Compass, 
  Flame, 
  Crown, 
  Sparkles 
} from 'lucide-react';
import { LEADERBOARDS } from '../data/leaderboards';

// Additional mock data for WGB, Labyrinth, and Subjugation to mirror SWGT
const MODE_DATA = {
  wgb: {
    asia: [
      { rank: 1, name: 'Siam Paragon', score: 31200, winLoss: '28W - 0L', winRate: '100%', rankTier: 'World Legend #1', flag: '🇹🇭' },
      { rank: 2, name: 'Dragon Nest TW', score: 30450, winLoss: '26W - 2L', winRate: '92.8%', rankTier: 'World Guardian 3', flag: '🇹🇼' },
      { rank: 3, name: 'Apex Legend TH', score: 29800, winLoss: '25W - 3L', winRate: '89.2%', rankTier: 'World Guardian 3', flag: '🇹🇭' },
      { rank: 4, name: 'Royal SG', score: 29100, winLoss: '24W - 4L', winRate: '85.7%', rankTier: 'World Guardian 3', flag: '🇸🇬' },
      { rank: 5, name: 'Bangkhen Knight', score: 28400, winLoss: '23W - 5L', winRate: '82.1%', rankTier: 'World Guardian 2', flag: '🇹🇭' },
    ],
    global: [
      { rank: 1, name: 'SAY SWGT', score: 30900, winLoss: '27W - 1L', winRate: '96.4%', rankTier: 'World Legend #1', flag: '🇺🇸' },
      { rank: 2, name: 'Malicious', score: 30150, winLoss: '25W - 3L', winRate: '89.2%', rankTier: 'World Guardian 3', flag: '🇺🇸' },
      { rank: 3, name: 'SSG Gaming', score: 29400, winLoss: '24W - 4L', winRate: '85.7%', rankTier: 'World Guardian 3', flag: '🇨🇦' },
      { rank: 4, name: 'True Amity', score: 28700, winLoss: '23W - 5L', winRate: '82.1%', rankTier: 'World Guardian 2', flag: '🌐' },
    ],
    europe: [
      { rank: 1, name: 'Dark Phoenix EU', score: 30700, winLoss: '27W - 1L', winRate: '96.4%', rankTier: 'World Legend #1', flag: '🇩🇪' },
      { rank: 2, name: 'Valhalla FR', score: 29900, winLoss: '25W - 3L', winRate: '89.2%', rankTier: 'World Guardian 3', flag: '🇫🇷' },
    ],
    japanKorea: [
      { rank: 1, name: 'Samurai Soul JP', score: 31050, winLoss: '27W - 1L', winRate: '96.4%', rankTier: 'World Legend #1', flag: '🇯🇵' },
      { rank: 2, name: 'K-Overlords', score: 30200, winLoss: '25W - 3L', winRate: '89.2%', rankTier: 'World Guardian 3', flag: '🇰🇷' },
    ]
  },
  labyrinth: {
    asia: [
      { rank: 1, name: 'Siam Paragon', score: 'Day 2 Clear (01:14:20)', winLoss: 'Rank SSS', winRate: '100%', rankTier: 'Rank SSS Speed', flag: '🇹🇭' },
      { rank: 2, name: 'Apex Legend TH', score: 'Day 2 Clear (02:45:10)', winLoss: 'Rank SSS', winRate: '100%', rankTier: 'Rank SSS Speed', flag: '🇹🇭' },
      { rank: 3, name: 'Dragon Nest TW', score: 'Day 2 Clear (03:12:00)', winLoss: 'Rank SSS', winRate: '100%', rankTier: 'Rank SSS Speed', flag: '🇹🇼' },
    ],
    global: [
      { rank: 1, name: 'SAY SWGT', score: 'Day 2 Clear (01:05:40)', winLoss: 'Rank SSS', winRate: '100%', rankTier: 'Rank SSS Speed', flag: '🇺🇸' },
      { rank: 2, name: 'Malicious', score: 'Day 2 Clear (01:42:15)', winLoss: 'Rank SSS', winRate: '100%', rankTier: 'Rank SSS Speed', flag: '🇺🇸' },
    ],
    europe: [
      { rank: 1, name: 'Dark Phoenix EU', score: 'Day 2 Clear (01:25:30)', winLoss: 'Rank SSS', winRate: '100%', rankTier: 'Rank SSS Speed', flag: '🇩🇪' },
    ],
    japanKorea: [
      { rank: 1, name: 'Samurai Soul JP', score: 'Day 2 Clear (01:10:05)', winLoss: 'Rank SSS', winRate: '100%', rankTier: 'Rank SSS Speed', flag: '🇯🇵' },
    ]
  },
  subjugation: {
    asia: [
      { rank: 1, name: 'Siam Paragon', score: 'Score: 4,850,200', winLoss: 'Stage 10 Clear', winRate: '100%', rankTier: 'Guardian 3 (อันดับ 1)', flag: '🇹🇭' },
      { rank: 2, name: 'Royal SG', score: 'Score: 4,680,100', winLoss: 'Stage 10 Clear', winRate: '100%', rankTier: 'Guardian 3', flag: '🇸🇬' },
      { rank: 3, name: 'Apex Legend TH', score: 'Score: 4,520,000', winLoss: 'Stage 10 Clear', winRate: '100%', rankTier: 'Guardian 3', flag: '🇹🇭' },
    ],
    global: [
      { rank: 1, name: 'SAY SWGT', score: 'Score: 4,920,400', winLoss: 'Stage 10 Clear', winRate: '100%', rankTier: 'Guardian 3 (อันดับ 1)', flag: '🇺🇸' },
      { rank: 2, name: 'SSG Gaming', score: 'Score: 4,610,000', winLoss: 'Stage 10 Clear', winRate: '100%', rankTier: 'Guardian 3', flag: '🇨🇦' },
    ],
    europe: [
      { rank: 1, name: 'Dark Phoenix EU', score: 'Score: 4,790,000', winLoss: 'Stage 10 Clear', winRate: '100%', rankTier: 'Guardian 3 (อันดับ 1)', flag: '🇩🇪' },
    ],
    japanKorea: [
      { rank: 1, name: 'Samurai Soul JP', score: 'Score: 4,880,500', winLoss: 'Stage 10 Clear', winRate: '100%', rankTier: 'Guardian 3 (อันดับ 1)', flag: '🇯🇵' },
    ]
  }
};

export default function LeaderboardsView() {
  const [selectedMode, setSelectedMode] = useState('siege'); // 'siege', 'wgb', 'labyrinth', 'subjugation'
  const [selectedServer, setSelectedServer] = useState('asia');
  const [searchQuery, setSearchQuery] = useState('');

  const modes = [
    { id: 'siege', name: '🏰 กิลด์ศึกยึดเกาะ (Siege Battle)', desc: 'การแข่งขันยึดเกาะ 3 กิลด์ชิง 20,000 แต้ม' },
    { id: 'wgb', name: '⚔️ ศึกกิลด์ข้ามเซิร์ฟ (World Guild Battle)', desc: 'กิลด์วอร์แบบ 1v1 ปะทะกิลด์ชั้นนำทั่วโลก' },
    { id: 'labyrinth', name: '🌀 เขาวงกตทาร์ทารัส (Tartarus Labyrinth)', desc: 'อันดับความเร็วเคลียร์บอสทาร์ทารัสระดับ SSS' },
    { id: 'subjugation', name: '🐉 ปราบอสูรกิลด์ (Monster Subjugation)', desc: 'ศึกรวมพลังกำจัดบอสปีศาจประจำสัปดาห์' },
  ];

  const servers = [
    { id: 'asia', name: 'เซิร์ฟเวอร์ Asia (เอเชีย)', flag: '🌏' },
    { id: 'global', name: 'เซิร์ฟเวอร์ Global (สากล)', flag: '🌐' },
    { id: 'europe', name: 'เซิร์ฟเวอร์ Europe (ยุโรป)', flag: '🇪🇺' },
    { id: 'japanKorea', name: 'เซิร์ฟเวอร์ Japan + Korea', flag: '🇯🇵' },
  ];

  const rawData = useMemo(() => {
    if (selectedMode === 'siege') {
      return LEADERBOARDS[selectedServer] || [];
    }
    return (MODE_DATA[selectedMode] && MODE_DATA[selectedMode][selectedServer]) || [];
  }, [selectedMode, selectedServer]);

  const currentGuilds = useMemo(() => {
    return rawData.filter(g => 
      g.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [rawData, searchQuery]);

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-[#1c2738] pb-5">
        <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-wider mb-1">
          <Trophy className="w-4 h-4" />
          SWGT All-Server Guild Leaderboards • 4 โหมดการแข่งขันกิลด์ครบวงจร
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          ตารางจัดอันดับกิลด์ชั้นนำระดับโลก (Guild Leaderboards)
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
          เช็คอันดับกิลด์ท็อปเซิร์ฟเวอร์ทั้ง 4 โหมดการแข่งขัน: Siege Battle, World Guild Battle, Tartarus Labyrinth และ Monster Subjugation แยกตามภูมิภาคทั่วโลก
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 p-1.5 rounded-2xl bg-[#101724] border border-[#1d2b3f]">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => setSelectedMode(m.id)}
            className={`p-3 rounded-xl text-left transition-all cursor-pointer ${
              selectedMode === m.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-300 hover:text-white hover:bg-[#152030]'
            }`}
          >
            <div className="text-xs sm:text-sm font-black">{m.name}</div>
            <div className={`text-[10px] mt-0.5 line-clamp-1 ${selectedMode === m.id ? 'text-blue-100' : 'text-slate-500'}`}>
              {m.desc}
            </div>
          </button>
        ))}
      </div>

      {/* Server Selection Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-xl bg-[#101724] border border-[#1d2b3f]">
        {servers.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedServer(s.id)}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer ${
              selectedServer === s.id
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
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
          placeholder="ค้นหาชื่อกิลด์ เช่น Siam Paragon, SAY SWGT, Dragon Slayer, Apex Legend..."
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
      <div className="bg-[#101724] border border-[#1d2b3f] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1d2b3f] bg-[#0c121c] text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 text-center w-16">อันดับ</th>
                <th className="py-3.5 px-4">ชื่อกิลด์</th>
                <th className="py-3.5 px-4 text-center">ระดับแรงก์</th>
                <th className="py-3.5 px-4 text-center">ผลงาน / เคลียร์</th>
                <th className="py-3.5 px-4 text-center">อัตราการชนะ</th>
                <th className="py-3.5 px-4 text-right">คะแนน / สถิติ</th>
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
                      <span className="inline-block px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-extrabold border border-amber-500/40">
                        👑 #1
                      </span>
                    ) : guild.rank === 2 ? (
                      <span className="inline-block px-2.5 py-0.5 rounded bg-slate-300/20 text-slate-200 font-extrabold border border-slate-400/40">
                        🥈 #2
                      </span>
                    ) : guild.rank === 3 ? (
                      <span className="inline-block px-2.5 py-0.5 rounded bg-amber-700/20 text-amber-400 font-extrabold border border-amber-700/40">
                        🥉 #3
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono">#{guild.rank}</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{guild.flag}</span>
                      <span className="font-extrabold text-white text-sm">{guild.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-block px-2.5 py-1 rounded text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {guild.rankTier}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center font-mono text-slate-300">
                    {guild.winLoss}
                  </td>
                  <td className="py-4 px-4 text-center font-mono font-bold text-emerald-400">
                    {guild.winRate}
                  </td>
                  <td className="py-4 px-4 text-right font-mono font-black text-amber-400 text-sm">
                    {typeof guild.score === 'number' ? guild.score.toLocaleString() : guild.score}
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
