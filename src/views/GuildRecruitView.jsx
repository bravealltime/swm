import React, { useState } from 'react';
import { UserPlus, Search, ExternalLink, Shield } from 'lucide-react';
import recruitingGuilds from '../data/recruitingGuilds.json';

export default function GuildRecruitView() {
  const [serverFilter, setServerFilter] = useState('all');
  const [rankFilter, setRankFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = recruitingGuilds.filter(g => {
    if (serverFilter !== 'all' && g.server.toLowerCase() !== serverFilter.toLowerCase()) return false;
    if (rankFilter !== 'all' && !g.rank.toLowerCase().includes(rankFilter.toLowerCase())) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return g.name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q) || g.server.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-[#1c2738] pb-5">
        <div className="flex items-center gap-2 text-xs font-mono text-blue-400 uppercase tracking-wider mb-1">
          <UserPlus className="w-4 h-4" />
          SWM Guild Recruitment Center • ข้อมูลจริง 120 กิลด์
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          ประกาศรับสมัครสมาชิกกิลด์ (Actively Recruiting Guilds)
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
          ค้นหากิลด์ที่กำลังเปิดรับสมัครสมาชิกทั่วโลก ทั้งระดับ Guardian (G1-G3) สำหรับการแข่งขัน Siege Battle และ World Guild Battle
        </p>
      </div>

      {/* Filter and Search */}
      <div className="bg-[#101724] p-4 rounded-2xl border border-[#1d2b3f] flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            className="w-full bg-[#0c121c] border border-[#1d2b3f] rounded-xl pl-10 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            placeholder="ค้นหาชื่อกิลด์ หรือเงื่อนไขรับสมัคร..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Server & Rank Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <span className="text-xs text-slate-400 font-semibold mr-1">เซิร์ฟเวอร์:</span>
          {['all', 'Global', 'Europe', 'Asia'].map((s) => (
            <button
              key={s}
              onClick={() => setServerFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                serverFilter === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#0c121c] text-slate-300 hover:text-white border border-[#1d2b3f]'
              }`}
            >
              {s === 'all' ? 'ทั้งหมด' : s}
            </button>
          ))}

          <span className="text-xs text-slate-400 font-semibold ml-2 mr-1">อันดับ:</span>
          {['all', 'G3', 'G2', 'G1'].map((r) => (
            <button
              key={r}
              onClick={() => setRankFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                rankFilter === r
                  ? 'bg-amber-600 text-white'
                  : 'bg-[#0c121c] text-slate-300 hover:text-white border border-[#1d2b3f]'
              }`}
            >
              {r === 'all' ? 'ทุกแรงก์' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Guild Counter */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>พบกิลด์ที่ตรงตามเงื่อนไข: <strong className="text-white font-mono">{filtered.length}</strong> กิลด์ (จากทั้งหมด {recruitingGuilds.length} กิลด์)</span>
        <span className="text-cyan-400 font-mono">ระบบอัปเดตสด SWM Hub</span>
      </div>

      {/* Guilds Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((guild) => (
          <div
            key={guild.id}
            className="bg-[#111824] border border-[#1d2a3d] hover:border-blue-500/50 rounded-2xl p-5 transition-all flex flex-col justify-between shadow-lg"
          >
            <div>
              {/* Guild Head */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-black border border-[#2b3a50] p-1 flex items-center justify-center overflow-hidden flex-shrink-0">
                    <img
                      src={guild.logo}
                      alt={guild.name}
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => { e.target.src = 'https://do9d4mpqk497d.cloudfront.net/common/images/guild_logos/guildLogoDefault.png'; }}
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                      <span>{guild.name}</span>
                    </h3>
                    <div className="flex items-center gap-2 text-xs mt-0.5">
                      <span className="text-slate-400 font-medium">เซิร์ฟเวอร์: <strong className="text-slate-200">{guild.server}</strong></span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-400">สมาชิก: <strong className="text-slate-200 font-mono">{guild.members}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span className={`px-2 py-0.5 text-xs font-mono font-bold rounded ${
                    guild.rank.includes('G3') ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30' :
                    guild.rank.includes('G2') ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}>
                    {guild.rank}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="bg-[#0b1017] p-3 rounded-xl border border-[#182333] text-xs text-slate-300 leading-relaxed font-sans min-h-[60px]">
                {guild.description}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 pt-3 border-t border-[#182333] flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">ID: #{guild.id}</span>
              {guild.applyUrl ? (
                <a
                  href={guild.applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                >
                  สมัครเข้าร่วมกิลด์
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <span className="text-xs text-slate-400">ติดต่อตามข้อความกิลด์</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
