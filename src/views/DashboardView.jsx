import React, { useState, useMemo } from 'react';
import { 
  Shield, 
  Gift, 
  Trophy, 
  Search, 
  Copy, 
  Check, 
  ArrowRight, 
  Flame, 
  Zap, 
  Sparkles, 
  TrendingUp, 
  Compass, 
  BookOpen, 
  Calculator, 
  Swords, 
  Award,
  ChevronRight,
  ExternalLink,
  Users,
  Gauge,
  Cpu,
  Star,
  CheckCircle2,
  Sliders,
  Crosshair
} from 'lucide-react';
import MonsterAvatar from '../components/MonsterAvatar';
import ALL_MDC_DATA from '../data/allMdcData.json';
import { MONSTERS } from '../data/monsters';
import { PROMO_CODES } from '../data/promoCodes';
import { LEADERBOARDS } from '../data/leaderboards';
import playerProfiles from '../data/playerProfiles.json';

const POPULAR_PRESETS = [
  { label: 'Seara + Orion + Perna', defKey: 'Seara,Orion,Perna', monsters: ['Seara', 'Orion', 'Perna'] },
  { label: 'Carcano + Savannah + Miles', defKey: 'Carcano,Savannah,Miles', monsters: ['Carcano', 'Savannah', 'Miles'] },
  { label: 'Khmun + Vigor + Skogul', defKey: 'Khmun,Vigor,Skogul', monsters: ['Khmun', 'Vigor', 'Skogul'] },
  { label: 'Mo Long + Harmonia + Taranys', defKey: 'Mo Long,Harmonia,Taranys', monsters: ['Mo Long', 'Harmonia', 'Taranys'] },
  { label: 'Martina + Shaina + Triana', defKey: 'Martina,Shaina,Triana', monsters: ['Martina', 'Shaina', 'Triana'] },
];

export default function DashboardView({ onNavigate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState(POPULAR_PRESETS[0]);
  const [selectedServer, setSelectedServer] = useState('asia');

  const activeCodes = useMemo(() => {
    return PROMO_CODES.filter(c => c.status === 'active').slice(0, 4);
  }, []);

  // Top Real RTA Players from Lucksack/SWC dataset
  const topRtaPlayers = useMemo(() => {
    return playerProfiles.slice(0, 4);
  }, []);

  // Match defense team from ALL_MDC_DATA with real defenseMonsters
  const currentDefenseData = useMemo(() => {
    const targetNames = selectedPreset.monsters;
    const match = ALL_MDC_DATA.find(def => {
      const defNames = def.defenseMonsters?.map(m => m.name?.toLowerCase()) || [];
      return targetNames.every(t => defNames.some(d => d?.includes(t.toLowerCase())));
    });
    return match || ALL_MDC_DATA[0];
  }, [selectedPreset]);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const query = searchQuery.trim();
    // Auto route based on query
    if (['lest', 'diligent', 'pinkroid', 'ลูกพี่', 'braveheart'].some(p => query.toLowerCase().includes(p))) {
      onNavigate('player-tracker', { initialPlayer: query });
    } else {
      onNavigate('where2use', { initialMonster: query });
    }
  };

  const topGuilds = LEADERBOARDS[selectedServer]?.slice(0, 5) || [];

  return (
    <div className="space-y-8 max-w-[1780px] 2xl:max-w-[1880px] mx-auto pb-16 animate-in fade-in duration-300">
      
      {/* 1. HERO COMMAND SPOTLIGHT (2026 Esports Design) */}
      <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-[#0e1626] via-[#090e18] to-[#070b12] p-6 sm:p-10 shadow-2xl">
        {/* Ambient Glow Orbs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-5">
          {/* Badge Chips */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/10 backdrop-blur-md text-xs font-semibold text-slate-300 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-mono font-bold">LIVE RTA S38</span>
            <span className="text-slate-500">•</span>
            <span>ศูนย์ข้อมูลยุทธวิธี Summoners War ภาษาไทย 100%</span>
          </div>

          {/* High-Impact Headline */}
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            คลังกลยุทธ์ & สถิติการแข่งขัน <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
              Summoners War Master
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            วิเคราะห์เมต้า RTA Season 38, สถิติผู้เล่นระดับโลก, ทีมแก้ทาง Siege 3MDC กว่า 1,500+ สูตร, และสารานุกรมมอนสเตอร์ 940 ตัว
          </p>

          {/* Central Spotlight Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative max-w-2xl mx-auto pt-2">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อผู้เล่น (Lest, Diligent) • มอนสเตอร์ (Byungchul, Juno) • ทีม 3MDC..."
                className="w-full bg-[#0d1422]/90 border border-white/15 focus:border-cyan-400 hover:border-white/25 rounded-2xl pl-12 pr-28 py-3.5 sm:py-4 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition-all shadow-2xl backdrop-blur-xl"
              />
              <button
                type="submit"
                className="absolute right-2 px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
              >
                ค้นหาด่วน
              </button>
            </div>

            {/* Quick Hot Suggestions */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-3 text-xs">
              <span className="text-slate-400 text-[11px] font-semibold">แนะนำค้นหา:</span>
              <button
                type="button"
                onClick={() => onNavigate('player-tracker', { initialPlayer: 'Lest' })}
                className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                🔎 Lest (แชมป์โลก)
              </button>
              <button
                type="button"
                onClick={() => onNavigate('where2use', { initialMonster: 'Byungchul' })}
                className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-cyan-300 hover:text-cyan-200 transition-colors cursor-pointer"
              >
                ⚔️ Byungchul (Meta S38)
              </button>
              <button
                type="button"
                onClick={() => onNavigate('3mdc')}
                className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-amber-300 hover:text-amber-200 transition-colors cursor-pointer"
              >
                🛡️ ทีมแก้ทาง 3MDC
              </button>
              <button
                type="button"
                onClick={() => onNavigate('draft-explorer')}
                className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-purple-300 hover:text-purple-200 transition-colors cursor-pointer"
              >
                🔮 จำลองดราฟต์ 5v5
              </button>
            </div>
          </form>

          {/* Metric Stats Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 border-t border-white/[0.06] text-left">
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
              <div className="text-xs text-slate-400 font-medium">ข้อมูลมอนสเตอร์</div>
              <div className="text-lg sm:text-xl font-black text-white mt-0.5">940+ ตัว</div>
              <div className="text-[11px] text-emerald-400 font-medium">แปลสกิลไทย 100%</div>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
              <div className="text-xs text-slate-400 font-medium">ทีมแก้ทาง Siege</div>
              <div className="text-lg sm:text-xl font-black text-white mt-0.5">1,500+ สูตร</div>
              <div className="text-[11px] text-blue-400 font-medium">3MDC Counter Data</div>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
              <div className="text-xs text-slate-400 font-medium">World Arena RTA</div>
              <div className="text-lg sm:text-xl font-black text-white mt-0.5">Season 38</div>
              <div className="text-[11px] text-amber-400 font-medium">SWRT Esports Stats</div>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
              <div className="text-xs text-slate-400 font-medium">โค้ดไอเทมแจกฟรี</div>
              <div className="text-lg sm:text-xl font-black text-white mt-0.5">5 โค้ดแอคทีฟ</div>
              <div className="text-[11px] text-purple-400 font-medium">รับได้ทันทีในเกม</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. INSTANT PROMO CODES BANNER (1-Click Copy) */}
      <section className="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/20 via-[#0a1215] to-[#080d16] p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
              <Gift className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white">โค้ดแจกไอเทมประจำเดือน</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 uppercase">
                  Active Codes
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                กดปุ่มเพื่อคัดลอกโค้ดไปใส่ในเกมได้ทันที
              </p>
            </div>
          </div>

          {/* Promo Code Quick Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {activeCodes.map((item) => {
              const isCopied = copiedCode === item.code;
              return (
                <button
                  key={item.id}
                  onClick={() => handleCopy(item.code)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                    isCopied
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/30'
                      : 'bg-[#0f1826] hover:bg-[#142033] text-emerald-300 border-emerald-500/30 hover:border-emerald-500/50'
                  }`}
                  title="คลิกเพื่อคัดลอกโค้ด"
                >
                  <span>{item.code}</span>
                  {isCopied ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>
              );
            })}
            <button
              onClick={() => onNavigate('codes')}
              className="text-xs font-bold text-slate-300 hover:text-white px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>ดูทั้งหมด</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 3. CORE TACTICAL BENTO GRID (4 MODERN PILLARS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* PILLAR 1: RTA World Arena & Player Tracker (7 Cols) - 100% Real Lucksack Data */}
        <section className="lg:col-span-7 rounded-3xl border border-white/[0.08] bg-[#0c121e]/80 backdrop-blur-xl p-6 shadow-xl flex flex-col justify-between space-y-6 hover:border-amber-500/30 transition-all duration-300">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white">World Arena (RTA) Top Players</h2>
                  <p className="text-xs text-slate-400">ข้อมูลจริงจากระบบแรงกิ้ง SWRT & Lucksack.gg</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('player-tracker')}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
              >
                <span>ค้นหาผู้เล่น</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Real Player Leaderboard Preview Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] text-slate-400 font-semibold">
                    <th className="pb-2">ผู้เล่น</th>
                    <th className="pb-2">เซิร์ฟเวอร์</th>
                    <th className="pb-2">แรงค์</th>
                    <th className="pb-2">คะแนน</th>
                    <th className="pb-2">Win Rate</th>
                    <th className="pb-2 text-right">มอนยอดฮิต</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {topRtaPlayers.map((player) => (
                    <tr 
                      key={player.name}
                      onClick={() => onNavigate('player-tracker', { initialPlayer: player.name })}
                      className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                    >
                      <td className="py-2.5 font-bold text-white group-hover:text-amber-400 transition-colors flex items-center gap-2">
                        <img 
                          src={player.profileAvatar} 
                          alt={player.name}
                          className="w-6 h-6 rounded-full object-cover border border-white/15 bg-slate-800"
                          onError={(e) => {
                            e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(player.name)}`;
                          }}
                        />
                        <span>{player.name}</span>
                        <span className="text-xs">{player.flag}</span>
                      </td>
                      <td className="py-2.5 text-slate-400">{player.server}</td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          {player.rankBadge || player.rankTier}
                        </span>
                      </td>
                      <td className="py-2.5 font-mono font-bold text-slate-200">{player.score}</td>
                      <td className="py-2.5 font-bold text-emerald-400">{player.winRate}%</td>
                      <td className="py-2.5 text-right font-medium text-slate-400">
                        {player.signatureMonsters?.slice(0, 3).map(m => m.name).join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/[0.06]">
            <button
              onClick={() => onNavigate('player-tracker')}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>ค้นหาสถิติผู้เล่น RTA ทุกคน (39+ โปรไฟล์จริง)</span>
            </button>
            <button
              onClick={() => onNavigate('rta')}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>สรุปเมต้า SWRT RTA S38</span>
            </button>
          </div>
        </section>

        {/* PILLAR 2: 3MDC Siege Tactical Interceptor (5 Cols) - Real Defense & Counter Avatars */}
        <section className="lg:col-span-5 rounded-3xl border border-white/[0.08] bg-[#0c121e]/80 backdrop-blur-xl p-6 shadow-xl flex flex-col justify-between space-y-5 hover:border-blue-500/30 transition-all duration-300">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white">3MDC Siege Counter</h2>
                  <p className="text-xs text-slate-400">เลือกทีมตั้งรับเพื่อดูสูตรทีมเจาะที่ดีที่สุด</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('3mdc')}
                className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
              >
                <span>ดูทั้งหมด</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Presets Picker */}
            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-slate-400">ทีมตั้งรับยอดนิยม:</div>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setSelectedPreset(preset)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      selectedPreset.label === preset.label
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] border border-white/[0.06]'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Defense Presentation with REAL Monster Avatars */}
            <div className="p-4 rounded-2xl bg-[#090e18] border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold text-slate-300">ทีมตั้งรับ (Defense):</span>
                <span className="font-mono text-emerald-400 font-bold">อัตราชนะบุก {currentDefenseData.counters?.[0]?.winRate || '90%+'}</span>
              </div>
              
              <div className="flex items-center gap-3">
                {currentDefenseData.defenseMonsters && currentDefenseData.defenseMonsters.length > 0 ? (
                  currentDefenseData.defenseMonsters.map((m, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <MonsterAvatar monster={m} size="sm" />
                      <span className="text-[10px] text-slate-300 font-bold truncate max-w-[64px] text-center">
                        {m.thaiName || m.name}
                      </span>
                    </div>
                  ))
                ) : (
                  selectedPreset.monsters.map((name, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <MonsterAvatar monster={name} size="sm" />
                      <span className="text-[10px] text-slate-300 font-bold truncate max-w-[64px] text-center">{name}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Best Recommended Counter from Real 3MDC Data */}
              <div className="pt-2.5 border-t border-white/[0.06] space-y-2">
                <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>สูตรทีมแก้ทางที่แนะนำอันดับ 1:</span>
                </div>

                {currentDefenseData.counters && currentDefenseData.counters[0] ? (
                  <div className="flex items-center justify-between bg-white/[0.03] p-2.5 rounded-xl border border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      {currentDefenseData.counters[0].monsters?.map((cm, cIdx) => (
                        <MonsterAvatar key={cIdx} monster={cm} size="xs" />
                      ))}
                      <div className="text-xs font-bold text-white ml-1">
                        {currentDefenseData.counters[0].title || currentDefenseData.counters[0].monsters?.map(m => m.name).join(' + ')}
                      </div>
                    </div>
                    <span className="text-emerald-400 font-mono font-black text-xs shrink-0 ml-2">
                      {currentDefenseData.counters[0].winRate}
                    </span>
                  </div>
                ) : (
                  <div className="text-xs text-slate-300 p-2 bg-white/[0.03] rounded-xl">
                    Galleon + Clara + Leah (Speed Cleave 95%)
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('3mdc')}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Shield className="w-4 h-4" />
            <span>เปิดค้นหาทีมแก้ทาง 3MDC เต็มรูปแบบ</span>
          </button>
        </section>

      </div>

      {/* 4. ESSENTIAL TOOLS & DRAFT SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card 1: 5v5 Live Draft Explorer */}
        <div 
          onClick={() => onNavigate('draft-explorer')}
          className="rounded-3xl border border-white/[0.08] bg-[#0c121e]/80 backdrop-blur-xl p-6 shadow-xl space-y-4 hover:border-purple-500/40 transition-all duration-300 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Swords className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
              RTA Simulator
            </span>
          </div>
          <div>
            <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
              ห้องซ้อมดราฟต์ 5v5 (Draft Explorer)
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              จำลองการ Pick & Ban สไตล์ RTA สากล พร้อมระบบ AI แนะนำตัวแก้ทางและคำนวณ Duo Synergies
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-400 group-hover:translate-x-1 transition-transform">
            <span>เข้าสู่ห้องจำลองดราฟต์</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* Card 2: Artifact True Damage Optimizer */}
        <div 
          onClick={() => onNavigate('artifact')}
          className="rounded-3xl border border-white/[0.08] bg-[#0c121e]/80 backdrop-blur-xl p-6 shadow-xl space-y-4 hover:border-cyan-500/40 transition-all duration-300 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
              True Damage
            </span>
          </div>
          <div>
            <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
              คำนวณดาเมจเสริมอาร์ติแฟกต์
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              คำนวณ Additional Damage ตาม % ของ HP, ATK, DEF, และ SPD สำหรับมอนสเตอร์สายตอดดาเมจ
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 group-hover:translate-x-1 transition-transform">
            <span>คำนวณดาเมจเสริมทันที</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* Card 3: Dungeon Abyss Speed Teams */}
        <div 
          onClick={() => onNavigate('dungeons')}
          className="rounded-3xl border border-white/[0.08] bg-[#0c121e]/80 backdrop-blur-xl p-6 shadow-xl space-y-4 hover:border-emerald-500/40 transition-all duration-300 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Cpu className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
              PVE Abyss Hard
            </span>
          </div>
          <div>
            <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
              ทีมฟาร์มดันเจี้ยน Abyss Hard
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              สูตรทีมโกเลม มังกร เนโคร Abyss Hard สปีดรัน 30-40 วินาที วินเรท 100% ปลอดภัย ไม่หลุด
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition-transform">
            <span>ดูสูตรทีม PVE ทั้งหมด</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

      </div>

      {/* 5. TOP GUILDS & LEADERBOARD SPOTLIGHT */}
      <section className="rounded-3xl border border-white/[0.08] bg-[#0c121e]/80 backdrop-blur-xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">อันดับกิลด์ระดับท็อปโลก (Siege & WGB)</h2>
              <p className="text-xs text-slate-400">อัปเดตคะแนนและผลการแข่งขันจากเซิร์ฟเวอร์หลัก</p>
            </div>
          </div>

          {/* Server Switcher */}
          <div className="flex items-center gap-1 bg-[#090e18] p-1 rounded-xl border border-white/[0.06] self-start sm:self-auto">
            {['asia', 'global', 'europe'].map((srv) => (
              <button
                key={srv}
                onClick={() => setSelectedServer(srv)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                  selectedServer === srv
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {srv}
              </button>
            ))}
          </div>
        </div>

        {/* Guild Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {topGuilds.map((guild, idx) => (
            <div 
              key={guild.id || idx}
              className="p-4 rounded-2xl bg-[#090e18] border border-white/[0.06] hover:border-blue-500/30 transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-black font-mono px-2 py-0.5 rounded-md ${
                  idx === 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                  idx === 1 ? 'bg-slate-300/20 text-slate-200 border border-slate-300/30' :
                  idx === 2 ? 'bg-amber-700/20 text-amber-600 border border-amber-700/30' :
                  'bg-white/[0.04] text-slate-400'
                }`}>
                  #{idx + 1}
                </span>
                <span className="text-[10px] text-slate-500 uppercase">{selectedServer}</span>
              </div>
              <div className="font-black text-sm text-white truncate" title={guild.name}>
                {guild.name}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-white/[0.04]">
                <span>คะแนน</span>
                <span className="font-mono font-bold text-cyan-400">{guild.rating || '2,400+'}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
