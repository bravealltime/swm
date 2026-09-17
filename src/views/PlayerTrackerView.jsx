import React, { useState, useMemo } from 'react';
import {
  Search,
  Trophy,
  Shield,
  Swords,
  Flame,
  Zap,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Award,
  Globe,
  Users,
  CheckCircle2,
  XCircle,
  BarChart2,
  Sliders,
  Filter,
  RefreshCw,
  Share2,
  Copy,
  Info
} from 'lucide-react';
import MonsterAvatar from '../components/MonsterAvatar';
import playerProfiles from '../data/playerProfiles.json';
import allMonstersData from '../data/allMonsters.json';

const PRO_SHORTCUTS = [
  { id: 'lest', label: 'Lest (แชมป์โลก 2 สมัย)', flag: '🇨🇳' },
  { id: 'diligent', label: 'Diligent (แชมป์ SWC)', flag: '🇦🇺' },
  { id: 'pinkroid', label: 'Pinkroid (ยอดฝีมือยุโรป)', flag: '🇫🇷' },
  { id: 'lookpee', label: 'ลูกพี่ (การ์เดียนไทย 🇹🇭)', flag: '🇹🇭' },
  { id: 'braveheart', label: 'Braveheart (สายบรูเซอร์)', flag: '🇺🇸' },
  { id: 'obabo', label: 'Obabo (เจ้าพ่อดีบัฟ)', flag: '🇸🇪' },
  { id: 'mrchung', label: 'Mr.Chung (แชมป์โลก 2020)', flag: '🇭🇰' },
  { id: 'thompsin', label: 'Thompsin (จอมวางแผน)', flag: '🇺🇸' },
];

export default function PlayerTrackerView({ onNavigate, initialPlayer }) {
  // Currently selected player
  const [selectedPlayerId, setSelectedPlayerId] = useState(initialPlayer || 'lest');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [matchFilter, setMatchFilter] = useState('all'); // 'all' | 'win' | 'loss'
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'matches' | 'monsters'
  const [copiedLink, setCopiedLink] = useState(false);

  // Active player data lookup
  const activePlayer = useMemo(() => {
    const found = playerProfiles.find(p => p.id.toLowerCase() === selectedPlayerId.toLowerCase() || p.name.toLowerCase() === selectedPlayerId.toLowerCase());
    if (found) return found;

    // Fallback dynamic profile if user searched an arbitrary name
    const cleanName = selectedPlayerId;
    return {
      id: 'custom-' + cleanName.toLowerCase(),
      name: cleanName,
      displayName: cleanName,
      tagline: 'Summoners War RTA Contender (Season 38)',
      server: 'Global',
      country: 'GLOBAL',
      flag: '🌐',
      guild: 'Independent Summoner',
      rankTier: 'Guardian 1 ★ (ประเมินสถิติ)',
      rankBadge: 'G1',
      score: 1850,
      worldRank: 4250,
      matchesRecorded: 120,
      wins: 74,
      losses: 46,
      winRate: 61.7,
      firstPickPreference: 52.0,
      archetype: 'Flexible Counter Draft',
      archetypeThai: 'ดราฟต์แก้ทางยืดหยุ่นตามเมต้า',
      archetypeDescription: 'ผู้เล่นที่ปรับเปลี่ยนทรงทีมตามสถานการณ์ เน้นการดักทางมอนสเตอร์ตัวสำคัญของฝ่ายตรงข้าม',
      signatureMonsters: playerProfiles[0].signatureMonsters.map((m, idx) => ({
        ...m,
        pickShare: Math.max(30, 80 - idx * 10),
        winRate: Math.max(50, 68 - idx * 3),
        matches: Math.max(20, 90 - idx * 12)
      })),
      recentMatches: playerProfiles[0].recentMatches.map((m, idx) => ({
        ...m,
        id: 'cust-' + idx,
        result: idx % 3 === 0 ? 'LOSS' : 'WIN',
        scoreChange: idx % 3 === 0 ? '-10' : '+12'
      }))
    };
  }, [selectedPlayerId]);

  // Autocomplete search suggestions
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return playerProfiles.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.displayName && p.displayName.toLowerCase().includes(q)) ||
      (p.guild && p.guild.toLowerCase().includes(q)) ||
      (p.server && p.server.toLowerCase().includes(q))
    ).slice(0, 6);
  }, [searchQuery]);

  const handleSelectPlayer = (playerId) => {
    setSelectedPlayerId(playerId);
    setSearchQuery('');
    setIsSearchFocused(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const match = searchSuggestions[0];
    if (match) {
      handleSelectPlayer(match.id);
    } else {
      handleSelectPlayer(searchQuery.trim());
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.origin + '?player=' + activePlayer.name);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Filtered recent matches
  const filteredMatches = useMemo(() => {
    if (!activePlayer.recentMatches) return [];
    if (matchFilter === 'win') return activePlayer.recentMatches.filter(m => m.result === 'WIN');
    if (matchFilter === 'loss') return activePlayer.recentMatches.filter(m => m.result === 'LOSS');
    return activePlayer.recentMatches;
  }, [activePlayer, matchFilter]);

  return (
    <div className="space-y-6 max-w-[1720px] mx-auto pb-12">
      {/* 1. Header & Title */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-linear-to-r from-[#0c1424] via-[#111c33] to-[#0c1424] p-6 rounded-2xl border border-blue-900/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                ค้นหาสถิติผู้เล่น <span className="text-blue-400">Player Tracker</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  RTA S38
                </span>
              </h1>
              <p className="text-sm text-slate-400">
                เจาะลึกสถิติแรงค์ RTA มอนสเตอร์คู่ใจ และประวัติการดราฟต์แข่งย้อนหลังของโปรเพลเยอร์ระดับโลก
              </p>
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={copyShareLink}
            className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            {copiedLink ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-blue-400" />}
            {copiedLink ? 'คัดลอกลิงก์แล้ว!' : 'แชร์โปรไฟล์นี้'}
          </button>
        </div>
      </div>

      {/* 2. Intelligent Live Search Bar & Shortcuts */}
      <div className="bg-[#0f172a]/90 backdrop-blur-md rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-lg space-y-4">
        {/* Search input field */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="พิมพ์ชื่อในเกม (เช่น Lest, Diligent, Pinkroid, ลูกพี่, Braveheart หรือชื่อไอดีใดๆ)..."
              className="w-full pl-12 pr-28 py-3.5 bg-[#0a0f18] text-slate-100 placeholder-slate-500 rounded-xl border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden text-sm transition-all shadow-inner"
            />
            <button
              type="submit"
              className="absolute right-2.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md hover:shadow-blue-500/25 cursor-pointer"
            >
              ค้นหา
            </button>
          </div>

          {/* Autocomplete Dropdown */}
          {isSearchFocused && searchQuery.trim() && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#0c1322] border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-800">
              {searchSuggestions.length > 0 ? (
                searchSuggestions.map((sug) => (
                  <button
                    key={sug.id}
                    type="button"
                    onClick={() => handleSelectPlayer(sug.id)}
                    className="w-full px-4 py-3 text-left hover:bg-blue-600/10 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{sug.flag}</span>
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          {sug.name}
                          <span className="text-xs font-normal text-slate-400">({sug.server})</span>
                        </div>
                        <div className="text-xs text-slate-400">{sug.guild} • {sug.archetype}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-amber-400">{sug.rankTier}</div>
                      <div className="text-[11px] text-slate-400">{sug.score} pts • WR {sug.winRate}%</div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">
                  ไม่พบผู้เล่นที่ตรงเป๊ะ กด <span className="text-blue-400 font-bold">"ค้นหา"</span> เพื่อดูสถิติประเมินของชื่อ "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </form>

        {/* Quick Pro Player Badges */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> ทางลัดโปรเพลเยอร์:
          </span>
          {PRO_SHORTCUTS.map((p) => {
            const isSelected = selectedPlayerId.toLowerCase() === p.id.toLowerCase();
            return (
              <button
                key={p.id}
                onClick={() => handleSelectPlayer(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 border border-blue-400'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-slate-600'
                }`}
              >
                <span>{p.flag}</span>
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Player Profile Overview Hero Card */}
      <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col xl:flex-row gap-6 justify-between items-start xl:items-center">
          {/* Left: Player Avatar, Name, Guild, Rank */}
          <div className="flex items-start sm:items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-linear-to-br from-blue-600 to-indigo-800 border-2 border-blue-400/50 flex items-center justify-center text-3xl sm:text-4xl font-black text-white shadow-lg shadow-blue-500/20">
                {activePlayer.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[11px] font-black shadow-md border border-amber-300">
                {activePlayer.rankBadge || 'G3'}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-2xl sm:text-3xl font-black text-white">{activePlayer.name}</span>
                <span className="text-2xl">{activePlayer.flag}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-semibold">
                  เซิร์ฟเวอร์ {activePlayer.server}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 font-medium">
                  {activePlayer.guild}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 font-medium">{activePlayer.tagline}</p>
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <Trophy className="w-3.5 h-3.5" />
                  {activePlayer.rankTier}
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  คะแนน: <strong className="text-white font-mono">{activePlayer.score.toLocaleString()}</strong> pts
                </span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-slate-400 font-semibold">
                  อันดับโลก: <strong className="text-blue-400">#{activePlayer.worldRank.toLocaleString()}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Right: Key Analytics Stats Bento */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full xl:w-auto">
            {/* Win Rate */}
            <div className="p-3.5 bg-[#0a0f18] rounded-xl border border-slate-800 text-center min-w-[110px]">
              <div className="text-xs text-slate-400 mb-1 font-medium">Win Rate รวม</div>
              <div className="text-2xl font-black text-emerald-400 font-mono">{activePlayer.winRate}%</div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${activePlayer.winRate}%` }} />
              </div>
            </div>

            {/* Matches & Record */}
            <div className="p-3.5 bg-[#0a0f18] rounded-xl border border-slate-800 text-center min-w-[110px]">
              <div className="text-xs text-slate-400 mb-1 font-medium">สถิติ ชนะ / แพ้</div>
              <div className="text-base font-black text-white font-mono">
                <span className="text-emerald-400">{activePlayer.wins}W</span>
                <span className="text-slate-500 mx-1">-</span>
                <span className="text-rose-400">{activePlayer.losses}L</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1.5">{activePlayer.matchesRecorded} แมตช์ที่บันทึก</div>
            </div>

            {/* Archetype */}
            <div className="p-3.5 bg-[#0a0f18] rounded-xl border border-slate-800 text-center min-w-[130px] col-span-2 sm:col-span-1">
              <div className="text-xs text-slate-400 mb-1 font-medium">สไตล์การเล่นหลัก</div>
              <div className="text-sm font-bold text-blue-400 truncate">{activePlayer.archetype}</div>
              <div className="text-[11px] text-slate-400 mt-1 truncate">{activePlayer.archetypeThai}</div>
            </div>

            {/* First Pick % */}
            <div className="p-3.5 bg-[#0a0f18] rounded-xl border border-slate-800 text-center min-w-[110px]">
              <div className="text-xs text-slate-400 mb-1 font-medium">First Pick Share</div>
              <div className="text-2xl font-black text-amber-400 font-mono">{activePlayer.firstPickPreference || 50}%</div>
              <div className="text-[11px] text-slate-400 mt-1">อัตราได้เริ่มก่อน</div>
            </div>
          </div>
        </div>

        {/* Archetype Tactical Explanation */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-300">
          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-white font-semibold">การวิเคราะห์ทรงทีม (Archetype Insight): </strong>
            <span>{activePlayer.archetypeDescription}</span>
          </div>
        </div>
      </div>

      {/* 4. Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart2 className="w-4 h-4" /> ภาพรวม & มอนสเตอร์คู่ใจ (Signature Pool)
        </button>
        <button
          onClick={() => setActiveTab('matches')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'matches'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" /> ประวัติการแข่งย้อนหลัง ({activePlayer.recentMatches?.length || 0} แมตช์)
        </button>
      </div>

      {/* TAB CONTENT 1: Overview & Signature Monsters */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Signature Monsters Pool */}
          <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-400" />
                  มอนสเตอร์คู่ใจที่หยิบบ่อยที่สุด (Signature Monster Pool)
                </h2>
                <p className="text-xs text-slate-400">
                  วิเคราะห์จากอัตราการหยิบ (Pick Share %) และ Win Rate เฉพาะตัวของ {activePlayer.name}
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                สถิติเฉพาะตัวผู้เล่นนี้
              </span>
            </div>

            {/* 6 Signature Monsters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 pt-2">
              {activePlayer.signatureMonsters.map((mon, index) => (
                <div
                  key={mon.name + index}
                  className="bg-[#0a0f18] hover:bg-[#121c2e] p-4 rounded-xl border border-slate-800 hover:border-blue-500/40 transition-all group flex flex-col justify-between space-y-3"
                >
                  {/* Top Monster Header */}
                  <div className="flex items-center gap-3">
                    <MonsterAvatar monster={mon} size="md" />
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors truncate">
                        {mon.name}
                      </div>
                      <div className="text-xs text-slate-400 truncate">
                        {mon.thaiName || mon.name}
                      </div>
                      <div className="text-[10px] font-semibold text-blue-400">
                        อันดับ #{index + 1} Most Picked
                      </div>
                    </div>
                  </div>

                  {/* Pick & Win Rate Stats */}
                  <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Pick Share:</span>
                      <strong className="text-blue-400 font-mono font-bold">{mon.pickShare}%</strong>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: `${mon.pickShare}%` }} />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-slate-400 font-medium">Win Rate:</span>
                      <strong className="text-emerald-400 font-mono font-bold">{mon.winRate}%</strong>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${mon.winRate}%` }} />
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                      <span>จำนวนแมตช์:</span>
                      <span className="font-mono text-slate-400">{mon.matches} เกม</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Preview of Recent Matches */}
          <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  แมตช์ล่าสุด (Recent Match Logs)
                </h3>
                <p className="text-xs text-slate-400">บันทึกผลการดราฟต์ 5v5 และผลแพ้ชนะ</p>
              </div>
              <button
                onClick={() => setActiveTab('matches')}
                className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                ดูประวัติทั้งหมด <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Matches list */}
            <div className="space-y-3">
              {activePlayer.recentMatches.slice(0, 3).map((match) => (
                <MatchCard key={match.id} match={match} playerName={activePlayer.name} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: Full Match History & Draft Logs */}
      {activeTab === 'matches' && (
        <div className="space-y-4">
          {/* Filter Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0f172a] p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-blue-400" /> กรองผลการแข่ง:
              </span>
              <button
                onClick={() => setMatchFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  matchFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                ทั้งหมด ({activePlayer.recentMatches.length})
              </button>
              <button
                onClick={() => setMatchFilter('win')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  matchFilter === 'win'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-emerald-400'
                }`}
              >
                เฉพาะชนะ (WIN 🏆)
              </button>
              <button
                onClick={() => setMatchFilter('loss')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  matchFilter === 'loss'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-rose-400'
                }`}
              >
                เฉพาะแพ้ (LOSS 💀)
              </button>
            </div>

            <div className="text-xs text-slate-400">
              แสดง {filteredMatches.length} แมตช์ล่าสุด
            </div>
          </div>

          {/* Matches List */}
          <div className="space-y-4">
            {filteredMatches.length > 0 ? (
              filteredMatches.map((match) => (
                <MatchCard key={match.id} match={match} playerName={activePlayer.name} />
              ))
            ) : (
              <div className="p-12 text-center bg-[#0f172a] rounded-2xl border border-slate-800 text-slate-400">
                ไม่พบแมตช์ตามเงื่อนไขที่เลือก
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// 5. Reusable Match Card Component with 5v5 Pick & Ban Visualization
function MatchCard({ match, playerName }) {
  const isWin = match.result === 'WIN';

  return (
    <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
      isWin
        ? 'bg-linear-to-r from-emerald-950/20 via-[#0f172a] to-[#0f172a] border-emerald-900/40 hover:border-emerald-700/50'
        : 'bg-linear-to-r from-rose-950/20 via-[#0f172a] to-[#0f172a] border-rose-900/40 hover:border-rose-700/50'
    }`}>
      {/* Top Match Info Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          {/* Result Tag */}
          <span className={`px-3 py-1 rounded-lg text-xs font-black flex items-center gap-1.5 shadow-sm ${
            isWin
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
          }`}>
            {isWin ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            {match.result}
          </span>

          {/* Score Delta */}
          <span className={`text-xs font-mono font-bold ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
            {match.scoreChange} pts
          </span>

          {match.firstPick && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30">
              ⚡ First Pick
            </span>
          )}
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span>{match.date}</span>
          <span>•</span>
          <span className="flex items-center gap-1 font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            {match.duration || '2:15'}
          </span>
        </div>
      </div>

      {/* 5v5 Pick Comparison Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-11 gap-4 items-center pt-4">
        {/* Left: Player's 5 Monsters (5 cols) */}
        <div className="lg:col-span-5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-blue-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              {playerName}
            </span>
            <span className="text-[11px] text-slate-400">ดราฟต์ 5 มอนสเตอร์</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {match.playerPicks.map((p, idx) => (
              <DraftSlot key={idx} monster={p} />
            ))}
          </div>
        </div>

        {/* Center: VS divider (1 col) */}
        <div className="lg:col-span-1 flex flex-col items-center justify-center py-2 lg:py-0">
          <span className="text-xs font-black px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            VS
          </span>
        </div>

        {/* Right: Opponent's 5 Monsters (5 cols) */}
        <div className="lg:col-span-5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-400">คู่แข่ง</span>
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              {match.opponent.flag} {match.opponent.name}
              <span className="text-xs text-slate-400 font-normal">({match.opponent.score} pts)</span>
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 justify-start lg:justify-end">
            {match.opponent.picks.map((p, idx) => (
              <DraftSlot key={idx} monster={p} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 6. Draft Slot with Leader & Banned badges
function DraftSlot({ monster }) {
  return (
    <div className="relative group shrink-0">
      <div className={`relative ${monster.isBanned ? 'opacity-40 grayscale' : ''}`}>
        <MonsterAvatar monster={monster} size="sm" />
      </div>

      {/* Leader Crown Badge */}
      {monster.isLeader && (
        <div className="absolute -top-1.5 -left-1.5 px-1 rounded-sm bg-amber-500 text-slate-950 text-[9px] font-black shadow-xs z-10">
          LEAD
        </div>
      )}

      {/* Banned Overlay Badge */}
      {monster.isBanned && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="w-full bg-rose-600/90 text-white text-[9px] font-black text-center py-0.5 shadow-md uppercase tracking-wider transform -rotate-12 border border-rose-400">
            BAN
          </div>
        </div>
      )}
    </div>
  );
}
