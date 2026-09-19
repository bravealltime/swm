import React, { useState, useMemo, useEffect } from 'react';
import { buildUrl } from '../router';
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
  Info,
  Crown,
  Star,
  User,
  X
} from 'lucide-react';
import MonsterAvatar from '../components/MonsterAvatar';
import playerProfiles from '../data/playerProfiles.json';
import allMonstersData from '../data/allMonsters.json';
import swrtPlayersDataset from '../data/swrtPlayersIndex.json';
import aiSummaries from '../data/swrtPlayerSummaries.json';
import { buildSwrtProfiles, buildMonsterIndex, loadRecentMatches, SMALL_SAMPLE } from '../data/swrtPlayerAdapter';

// Active Season 38 players from the replay dataset are the primary source of truth
const SWRT_PROFILES = buildSwrtProfiles(swrtPlayersDataset, allMonstersData);
const SWRT_NAME_MAP = new Map(SWRT_PROFILES.map((p) => [p.name.toLowerCase(), p]));

// Curated profiles (Hall of Fame champions like Lest who aren't in current replay dataset)
const HOF_PROFILES = playerProfiles
  .filter((p) => !SWRT_NAME_MAP.has(p.name.toLowerCase()))
  .map((p) => ({
    ...p,
    source: 'hof',
    rankCategory: p.rankCategory || 'legend',
    rankCategoryThai: 'ระดับ Hall of Fame (แชมป์โลก)',
    tagline: p.tagline?.replace(/•\s*(?:Verified|Legacy).*$/i, '• Hall of Fame') || p.tagline,
  }));

// Combined profiles with real Season 38 players first
const ALL_PROFILES = [
  ...SWRT_PROFILES,
  ...HOF_PROFILES,
];
const DATASET_META = swrtPlayersDataset.meta || {};
const ALL_PROFILE_IDS = new Set(ALL_PROFILES.map((p) => p.id));
const MONSTER_INDEX = buildMonsterIndex(allMonstersData);
import { getR2AvatarUrl } from '../services/r2Service';
import { useLocalSet, useRecentList } from '../hooks/useLocalStorage';

const RANK_FILTERS = [
  { id: 'all', label: 'ทุกระดับแรงค์ (All Ranks)', icon: Globe },
  { id: 'legend', label: '👑 Legend (แชมป์โลก)', icon: Crown, color: 'text-amber-400 border-amber-500/40 bg-amber-500/10' },
  { id: 'guardian', label: '⭐⭐⭐ Guardian (G1-G3)', icon: Trophy, color: 'text-rose-400 border-rose-500/40 bg-rose-500/10' },
  { id: 'conqueror', label: '⭐⭐ Conqueror (C1-C3)', icon: Award, color: 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10' },
  { id: 'fighter', label: '⭐ Fighter & ทั่วไป (F1-F3)', icon: Shield, color: 'text-sky-400 border-sky-500/40 bg-sky-500/10' }
];

export default function PlayerTrackerView({ onNavigate, initialPlayer }) {
  // Default to top active player in Season 38 if no initial player is passed
  const defaultPlayerId = initialPlayer || SWRT_PROFILES[0]?.id || 'swrt-489076';
  const [selectedPlayerId, setSelectedPlayerId] = useState(defaultPlayerId);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [matchFilter, setMatchFilter] = useState('all'); // 'all' | 'win' | 'loss'
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'matches'
  const [rankCategoryFilter, setRankCategoryFilter] = useState('all'); // 'all' | 'legend' | 'guardian' | 'conqueror' | 'fighter'
  const [copiedLink, setCopiedLink] = useState(false);

  // Look up active player by id or exact name. Unknown names get an honest "not found"
  // panel instead of an invented profile.
  const activePlayer = useMemo(() => {
    const q = selectedPlayerId.toLowerCase();
    return ALL_PROFILES.find(p => p.id.toLowerCase() === q) || ALL_PROFILES.find(p => p.name.toLowerCase() === q) || null;
  }, [selectedPlayerId]);

  // Closest names for the not-found panel
  const nearMatches = useMemo(() => {
    if (activePlayer) return [];
    const q = selectedPlayerId.toLowerCase().trim();
    const head = q.slice(0, 3);
    return ALL_PROFILES
      .filter(p => p.name.toLowerCase().includes(q) || (head.length >= 2 && p.name.toLowerCase().startsWith(head)))
      .slice(0, 8);
  }, [activePlayer, selectedPlayerId]);

  // Profiles keep their matches in sharded files; fetch on demand
  const [loadedMatches, setLoadedMatches] = useState({}); // profileId -> matches[]
  const needsFetch = !!activePlayer && activePlayer.source === 'swrt' && !(activePlayer.id in loadedMatches);
  const matchesLoading = needsFetch;
  useEffect(() => {
    if (!needsFetch) return;
    let alive = true;
    const { id, swrtId } = activePlayer;
    loadRecentMatches(swrtId, MONSTER_INDEX, DATASET_META.shards || 32)
      .then((matches) => { if (alive) setLoadedMatches((prev) => ({ ...prev, [id]: matches })); })
      .catch(() => { if (alive) setLoadedMatches((prev) => ({ ...prev, [id]: [] })); });
    return () => { alive = false; };
  }, [needsFetch, activePlayer]);

  const recentMatches = useMemo(() => {
    if (!activePlayer) return [];
    return activePlayer.recentMatches ?? loadedMatches[activePlayer.id] ?? [];
  }, [activePlayer, loadedMatches]);

  // Filtered player pool for quick shortcuts: active Season 38 players first, sorted by score
  const filteredPlayerList = useMemo(() => {
    const pool = rankCategoryFilter === 'all' ? ALL_PROFILES : ALL_PROFILES.filter(p => p.rankCategory === rankCategoryFilter);
    return [...pool].sort((a, b) => (b.source !== 'hof') - (a.source !== 'hof') || b.score - a.score);
  }, [rankCategoryFilter]);

  // Autocomplete search suggestions (Fuzzy match)
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    const starts = [];
    const contains = [];
    for (const p of ALL_PROFILES) {
      const name = p.name.toLowerCase();
      if (name.startsWith(q)) starts.push(p);
      else if (name.includes(q) || p.id.toLowerCase().includes(q) || (p.displayName || '').toLowerCase().includes(q) || (p.guild || '').toLowerCase().includes(q)) contains.push(p);
      if (starts.length >= 10) break;
    }
    return [...starts, ...contains].slice(0, 10);
  }, [searchQuery]);

  // Per-device favourites and recent searches (names, so they survive dataset rebuilds)
  const favorites = useLocalSet('swm:fav-players');
  const [recentSearches, pushRecent, clearRecent] = useRecentList('swm:recent-players', 8);

  const handleSelectPlayer = (playerId) => {
    setSelectedPlayerId(playerId);
    setSearchQuery('');
    setIsSearchFocused(false);
    const q = String(playerId).toLowerCase();
    const found = ALL_PROFILES.find(p => p.id.toLowerCase() === q) || ALL_PROFILES.find(p => p.name.toLowerCase() === q);
    if (found) pushRecent(found.name);
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
    if (!activePlayer) return;
    navigator.clipboard.writeText(window.location.origin + buildUrl('player-tracker', { initialPlayer: activePlayer.name }));
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Filtered recent matches
  // Opponents that exist in the dataset become links; count repeat meetings within the loaded matches
  const opponentProfileId = (match) => {
    const sid = match.opponent?.swrtId;
    if (sid && ALL_PROFILE_IDS.has(`swrt-${sid}`)) return `swrt-${sid}`;
    const byName = match.opponent?.name && ALL_PROFILES.find((p) => p.name.toLowerCase() === match.opponent.name.toLowerCase());
    return byName ? byName.id : null;
  };
  const meetings = useMemo(() => {
    const counts = {};
    for (const m of recentMatches) {
      const key = m.opponent?.swrtId || m.opponent?.name;
      if (key) counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [recentMatches]);

  const filteredMatches = useMemo(() => {
    if (matchFilter === 'win') return recentMatches.filter(m => m.result === 'WIN');
    if (matchFilter === 'loss') return recentMatches.filter(m => m.result === 'LOSS');
    return recentMatches;
  }, [recentMatches, matchFilter]);

  // Rank badge styling helper
  const getBadgeStyle = (category, badge) => {
    if (category === 'legend' || badge === 'Legend') {
      return 'bg-gradient-to-r from-amber-500 to-yellow-300 text-slate-950 font-black border-amber-300';
    }
    if (category === 'guardian' || badge?.startsWith('G')) {
      return 'bg-gradient-to-r from-rose-600 to-rose-400 text-white font-black border-rose-300';
    }
    if (category === 'conqueror' || badge?.startsWith('C')) {
      return 'bg-gradient-to-r from-yellow-600 to-amber-400 text-slate-950 font-black border-yellow-300';
    }
    return 'bg-gradient-to-r from-sky-600 to-blue-500 text-white font-black border-sky-300';
  };

  // Star rating color
  const getScoreStarColor = (score) => {
    if (score >= 2000) return 'text-amber-400 fill-amber-400';
    if (score >= 1300) return 'text-rose-500 fill-rose-500';
    return 'text-sky-400 fill-sky-400';
  };

  return (
    <div className="space-y-6 max-w-[1780px] 2xl:max-w-[1880px] mx-auto pb-16 animate-in fade-in duration-300">
      {/* 1. Header & Title Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-r from-[#0c1424] via-[#090e18] to-[#070b12] p-6 sm:p-8 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3 flex-wrap">
                ค้นหาสถิติผู้เล่น <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Player Tracker</span>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {ALL_PROFILES.length.toLocaleString()} ผู้เล่นจริง
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                สถิติผู้เล่นระดับสูงและบันทึกดราฟต์ RTA Season 38 ({(DATASET_META.replaysScanned || 0).toLocaleString()} แมตช์
                {DATASET_META.fetchedAt ? `, ข้อมูลล่าสุด ${DATASET_META.fetchedAt.slice(0, 10)}` : ''}) — สถิติดราฟต์ 5v5 และมอนสเตอร์คู่ใจ
              </p>
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={copyShareLink}
            className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 hover:text-white border border-white/10 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            {copiedLink ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-amber-400" />}
            {copiedLink ? 'คัดลอกลิงก์แล้ว!' : 'แชร์โปรไฟล์นี้'}
          </button>
        </div>
      </div>

      {/* 2. Search Area & Autocomplete Modal */}
      <div className="relative z-50 rounded-3xl border border-white/[0.08] bg-[#0a0f19]/80 backdrop-blur-xl p-5 sm:p-6 shadow-xl space-y-4">
        {/* Backdrop overlay to click outside and dismiss dropdown */}
        {isSearchFocused && searchQuery.trim() && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            onClick={() => setIsSearchFocused(false)}
          />
        )}

        {/* Rank Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 relative z-50">
          <span className="text-xs font-bold text-slate-400 shrink-0 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5 text-blue-400" /> ระดับแรงค์:
          </span>
          {RANK_FILTERS.map((rf) => {
            const isSelected = rankCategoryFilter === rf.id;
            const Icon = rf.icon;
            return (
              <button
                key={rf.id}
                onClick={() => setRankCategoryFilter(rf.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 border border-blue-400'
                    : 'bg-slate-800/70 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-slate-600'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{rf.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search input field with Autocomplete Dropdown */}
        <form onSubmit={handleSearchSubmit} className="relative z-50">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="พิมพ์ชื่อในเกม (ลองพิมพ์ 'ohb', 'oh', 'Lest', 'DragonKing', 'ลูกพี่')..."
              className="w-full pl-12 pr-28 py-3.5 bg-[#0a0f18] text-slate-100 placeholder-slate-500 rounded-xl border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden text-sm transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchFocused(false);
                }}
                className="absolute right-20 text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 cursor-pointer"
                title="ล้างข้อความ"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-2.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md hover:shadow-blue-500/25 cursor-pointer"
            >
              ค้นหา
            </button>
          </div>

          {/* Autocomplete Dropdown Match List */}
          {isSearchFocused && searchQuery.trim() && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#0c1322] border border-blue-500/40 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] z-50 overflow-hidden divide-y divide-slate-800/80 max-h-96 overflow-y-auto ring-1 ring-blue-500/30">
              <div className="px-4 py-2.5 text-xs font-bold text-slate-300 bg-[#080e1a] border-b border-slate-800 flex items-center justify-between">
                <span>Players ({searchSuggestions.length} matches)</span>
                <span className="text-slate-400">คลิกเพื่อเปิดโปรไฟล์</span>
              </div>
              {searchSuggestions.length > 0 ? (
                searchSuggestions.map((sug) => (
                  <button
                    key={sug.id}
                    type="button"
                    onClick={() => handleSelectPlayer(sug.id)}
                    className="w-full px-4 py-3 text-left hover:bg-blue-600/15 flex items-center justify-between transition-colors cursor-pointer group"
                  >
                    {/* Left: Avatar + Name + Flag */}
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={getR2AvatarUrl(sug.id, sug.profileAvatar)}
                        alt={sug.name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-slate-700 group-hover:border-blue-400 transition-colors shrink-0 bg-slate-800"
                        onError={(e) => {
                          e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(sug.name)}`;
                        }}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors flex items-center gap-1.5 truncate">
                          <span>{sug.name}</span>
                          <span className="text-base">{sug.flag}</span>
                        </div>
                        <div className="text-xs text-slate-400 truncate">
                          {sug.guild || 'No Guild'} • {sug.archetype || 'Balanced RTA'}
                        </div>
                      </div>
                    </div>

                    {/* Right: Star + Score */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1 font-mono font-black text-sm">
                        <Star className={`w-3.5 h-3.5 ${getScoreStarColor(sug.score)}`} />
                        <span className="text-slate-100">{sug.score}</span>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-black border uppercase ${getBadgeStyle(sug.rankCategory, sug.rankBadge)}`}>
                        {sug.rankBadge || 'RTA'}
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">
                  ไม่พบ "{searchQuery}" ในฐานข้อมูล — ค้นหาได้จากผู้เล่นระดับ Guardian และผู้เล่นระดับสูงใน RTA
                </div>
              )}
            </div>
          )}
        </form>

        {(favorites.list.length > 0 || recentSearches.length > 0) && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 pt-1 text-xs">
            {favorites.list.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-400 font-semibold flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> ติดตาม:</span>
                {favorites.list.map((name) => (
                  <button key={name} onClick={() => handleSelectPlayer(name)} className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 border border-amber-500/30 font-medium cursor-pointer">
                    {name}
                  </button>
                ))}
              </div>
            )}
            {recentSearches.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-400 font-semibold">ล่าสุด:</span>
                {recentSearches.map((name) => (
                  <button key={name} onClick={() => handleSelectPlayer(name)} className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/10 cursor-pointer">
                    {name}
                  </button>
                ))}
                <button onClick={clearRecent} className="text-slate-500 hover:text-slate-300 cursor-pointer" title="ล้างประวัติ">✕</button>
              </div>
            )}
          </div>
        )}

        {/* Quick Shortcuts for Selected Rank Tier */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            {rankCategoryFilter === 'all' ? 'ผู้เล่นยอดนิยม:' : `ผู้เล่นใน ${RANK_FILTERS.find(r => r.id === rankCategoryFilter)?.label}:`}
          </span>
          {filteredPlayerList.slice(0, 10).map((p) => {
            const isSelected = selectedPlayerId.toLowerCase() === p.id.toLowerCase();
            return (
              <button
                key={p.id}
                onClick={() => handleSelectPlayer(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 border border-blue-400'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-slate-600'
                }`}
              >
                <img
                  src={getR2AvatarUrl(p.id, p.profileAvatar)}
                  alt={p.name}
                  className="w-5 h-5 rounded-full object-cover shrink-0 border border-slate-600"
                  onError={(e) => {
                    e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(p.name)}`;
                  }}
                />
                <span>{p.displayName || p.name}</span>
                <span className={`text-[10px] px-1 py-0.2 rounded font-black border ${getBadgeStyle(p.rankCategory, p.rankBadge)}`}>
                  {p.rankBadge || 'RTA'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {!activePlayer ? (
        <div className="rounded-3xl border border-amber-500/30 bg-amber-500/5 p-8 text-center space-y-4" role="status">
          <Search className="w-10 h-10 text-amber-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">ไม่พบผู้เล่น “{selectedPlayerId}” ในชุดข้อมูล</h2>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
            ฐานข้อมูลครอบคลุมสถิติผู้เล่นระดับ Guardian และการแข่งขันจริงใน RTA World Arena
            {DATASET_META.replaysScanned ? ` (${DATASET_META.replaysScanned.toLocaleString()} แมตช์ล่าสุด)` : ''} —
            ผู้เล่นระดับต่ำกว่า Guardian หรือที่ไม่ได้ลงแข่งช่วงนี้จะยังไม่มีบันทึกข้อมูล
          </p>
          {nearMatches.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <span className="text-xs text-slate-400">ชื่อใกล้เคียง:</span>
              {nearMatches.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPlayer(p.id)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
                >
                  {p.name} <span className="text-slate-400">{p.flag} {p.rankBadge}</span>
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => handleSelectPlayer(defaultPlayerId)}
            className="text-xs font-bold text-blue-400 hover:text-blue-300 cursor-pointer"
          >
            กลับไปดูผู้เล่นแนะนำ
          </button>
        </div>
      ) : (
      <>
      {/* 3. Player Profile Overview Hero Card with Real Profile Picture */}
      <div className="rounded-3xl border border-white/[0.08] bg-[#0a0f19]/90 backdrop-blur-xl p-6 sm:p-8 shadow-2xl relative z-10 overflow-hidden">
        <div className="flex flex-col xl:flex-row gap-6 justify-between items-start xl:items-center">
          {/* Left: Player Profile Picture, Name, Guild, Rank */}
          <div className="flex items-start sm:items-center gap-5">
            <div className="relative shrink-0">
              <img
                src={getR2AvatarUrl(activePlayer.id, activePlayer.profileAvatar)}
                alt={activePlayer.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-blue-400/50 shadow-xl shadow-blue-500/20 bg-slate-900"
                onError={(e) => {
                  e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(activePlayer.name)}`;
                }}
              />
              <div className={`absolute -bottom-2 -right-2 px-2 py-0.5 rounded-md text-xs font-black shadow-md border ${getBadgeStyle(activePlayer.rankCategory, activePlayer.rankBadge)}`}>
                {activePlayer.rankBadge || 'RTA'}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-2xl sm:text-3xl font-black text-white">{activePlayer.name}</span>
                <button
                  onClick={() => favorites.toggle(activePlayer.name)}
                  aria-pressed={favorites.has(activePlayer.name)}
                  aria-label={favorites.has(activePlayer.name) ? 'เลิกติดตามผู้เล่นนี้' : 'ติดตามผู้เล่นนี้'}
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    favorites.has(activePlayer.name)
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                      : 'bg-white/[0.04] border-white/10 text-slate-400 hover:text-amber-300'
                  }`}
                >
                  <Star className={`w-4 h-4 ${favorites.has(activePlayer.name) ? 'fill-amber-400' : ''}`} />
                </button>
                <span className="text-2xl">{activePlayer.flag}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-semibold">
                  เซิร์ฟเวอร์ {activePlayer.server}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 font-medium">
                  {activePlayer.guild}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 font-bold">
                  {activePlayer.rankCategoryThai}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 font-medium">{activePlayer.tagline}</p>
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <Trophy className="w-3.5 h-3.5" />
                  {activePlayer.rankTier}
                </span>
                <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                  คะแนน:
                  <Star className={`w-3.5 h-3.5 ${getScoreStarColor(activePlayer.score)}`} />
                  <strong className="text-white font-mono">{activePlayer.score.toLocaleString()}</strong> pts
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-400 font-semibold">
                  อันดับโลก: <strong className="text-blue-400">#{activePlayer.worldRank.toLocaleString()}</strong>
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-semibold text-emerald-300/90">
                  {activePlayer.source === 'hof' ? 'ทำเนียบแชมป์โลก (Hall of Fame)' : 'สถิติการแข่งขันจริง Season 38'}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Key Analytics Stats Bento */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full xl:w-auto">
            {/* Win Rate */}
            <div className="p-3.5 bg-[#0a0f18] rounded-xl border border-slate-800 text-center min-w-[110px]">
              <div className="text-xs text-slate-400 mb-1 font-medium">Win Rate รวม</div>
              {activePlayer.matchesRecorded < SMALL_SAMPLE ? (
                <>
                  <div className="text-2xl font-black text-slate-400 font-mono" title={`${activePlayer.winRate}% จาก ${activePlayer.matchesRecorded} แมตช์`}>—</div>
                  <div className="text-[11px] text-amber-300/90 mt-1.5">ตัวอย่างน้อย ({activePlayer.matchesRecorded} แมตช์) ยังสรุปไม่ได้</div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-black text-emerald-400 font-mono">{activePlayer.winRate}%</div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${activePlayer.winRate}%` }} />
                  </div>
                </>
              )}
            </div>

            {/* Matches & Record */}
            <div className="p-3.5 bg-[#0a0f18] rounded-xl border border-slate-800 text-center min-w-[110px]">
              <div className="text-xs text-slate-400 mb-1 font-medium">สถิติ ชนะ / แพ้</div>
              <div className="text-base font-black text-white font-mono">
                <span className="text-emerald-400">{activePlayer.wins}W</span>
                <span className="text-slate-400 mx-1">-</span>
                <span className="text-rose-400">{activePlayer.losses}L</span>
              </div>
              <div className="text-xs text-slate-400 mt-1.5">{activePlayer.matchesRecorded} แมตช์ที่บันทึก</div>
            </div>

            {/* Archetype */}
            <div className="p-3.5 bg-[#0a0f18] rounded-xl border border-slate-800 text-center min-w-[130px] col-span-2 sm:col-span-1">
              <div className="text-xs text-slate-400 mb-1 font-medium">สไตล์การเล่นหลัก</div>
              <div className="text-sm font-bold text-blue-400 truncate">{activePlayer.archetype}</div>
              <div className="text-xs text-slate-400 mt-1 truncate">{activePlayer.archetypeThai}</div>
            </div>

            {/* First Pick % */}
            <div className="p-3.5 bg-[#0a0f18] rounded-xl border border-slate-800 text-center min-w-[110px]">
              <div className="text-xs text-slate-400 mb-1 font-medium">First Pick Share</div>
              <div className="text-2xl font-black text-amber-400 font-mono">{activePlayer.firstPickPreference || 50}%</div>
              <div className="text-xs text-slate-400 mt-1">อัตราได้เริ่มก่อน</div>
            </div>
          </div>
        </div>

        {/* Archetype Tactical Explanation — AI summary from real replays when available */}
        {(() => {
          const ai = activePlayer.swrtId ? aiSummaries.players?.[activePlayer.swrtId] : null;
          return (
            <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-300">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                {ai?.summary ? (
                  <>
                    <div>
                      <strong className="text-white font-semibold">สรุปสไตล์จากรีเพลย์จริง (AI): </strong>
                      <span>{ai.summary}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(ai.tags || []).map((t) => <span key={t} className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-200 text-[11px]">{t}</span>)}
                      <span className="text-[11px] text-slate-500">สร้างโดย AI จากสถิติ {activePlayer.matchesRecorded} แมตช์ • {ai.at?.slice(0, 10)}</span>
                    </div>
                  </>
                ) : (
                  <div>
                    <strong className="text-white font-semibold">การวิเคราะห์ทรงทีม (Archetype Insight): </strong>
                    <span>{activePlayer.archetypeDescription}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
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
          <Clock className="w-4 h-4" /> ประวัติการแข่งย้อนหลัง ({recentMatches.length} แมตช์)
        </button>
      </div>

      {/* TAB CONTENT 1: Overview & Signature Monsters */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Signature Monsters Pool */}
          <div className="rounded-3xl border border-white/[0.08] bg-[#0a0f19]/85 backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-400" />
                  มอนสเตอร์คู่ใจที่หยิบบ่อยที่สุด (Signature Monster Pool)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  วิเคราะห์จากอัตราการหยิบ (Pick Share %) และ Win Rate เฉพาะตัวของ {activePlayer.name} ({activePlayer.rankTier})
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-slate-300">
                สถิติเฉพาะตัวผู้เล่นนี้
              </span>
            </div>

            {/* 6 Signature Monsters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 pt-2">
              {activePlayer.signatureMonsters.map((mon, index) => (
                <div
                  key={mon.name + index}
                  className="rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] p-4 border border-white/[0.06] hover:border-amber-500/40 transition-all group flex flex-col justify-between space-y-3 shadow-lg"
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
                      <div className="text-[11px] font-semibold text-blue-400">
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

                    <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
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
              {matchesLoading ? (
                <div className="py-6 text-center text-xs text-slate-400" role="status">กำลังโหลดรีเพลย์...</div>
              ) : recentMatches.length > 0 ? (
                recentMatches.slice(0, 3).map((match) => (
                  <MatchCard key={match.id} match={match} playerName={activePlayer.name} onOpenPlayer={handleSelectPlayer} opponentProfileId={opponentProfileId(match)} meetings={meetings[match.opponent?.swrtId || match.opponent?.name]} />
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  ไม่มีประวัติแมตช์ที่บันทึกไว้สำหรับผู้เล่นนี้
                </div>
              )}
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
                ทั้งหมด ({recentMatches.length})
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
            {matchesLoading ? (
              <div className="p-12 text-center bg-[#0f172a] rounded-2xl border border-slate-800 text-slate-400" role="status">กำลังโหลดรีเพลย์...</div>
            ) : filteredMatches.length > 0 ? (
              filteredMatches.map((match) => (
                <MatchCard key={match.id} match={match} playerName={activePlayer.name} onOpenPlayer={handleSelectPlayer} opponentProfileId={opponentProfileId(match)} meetings={meetings[match.opponent?.swrtId || match.opponent?.name]} />
              ))
            ) : (
              <div className="p-12 text-center bg-[#0f172a] rounded-2xl border border-slate-800 text-slate-400">
                ไม่พบแมตช์ตามเงื่อนไขที่เลือก
              </div>
            )}
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}

// 5. Reusable Match Card Component with 5v5 Pick & Ban Visualization
function MatchCard({ match, playerName, onOpenPlayer, opponentProfileId, meetings }) {
  const isWin = match.result === 'WIN';

  return (
    <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
      isWin
        ? 'bg-gradient-to-r from-emerald-950/20 via-[#0f172a] to-[#0f172a] border-emerald-900/40 hover:border-emerald-700/50'
        : 'bg-gradient-to-r from-rose-950/20 via-[#0f172a] to-[#0f172a] border-rose-900/40 hover:border-rose-700/50'
    }`}>
      {/* Top Match Info Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          {/* Result Tag */}
          <span className={`px-3 py-1 rounded-lg text-xs font-black flex items-center gap-1.5 shadow-xs ${
            isWin
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
          }`}>
            {isWin ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            {match.result}
          </span>

          {/* Score Delta */}
          {match.scoreChange && (
            <span className={`text-xs font-mono font-bold ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
              {match.scoreChange} pts
            </span>
          )}

          {match.firstPick && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30">
              ⚡ First Pick
            </span>
          )}
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span>{match.date}</span>
          {match.duration && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {match.duration}
              </span>
            </>
          )}
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
            <span className="text-xs text-slate-400">ดราฟต์ 5 มอนสเตอร์</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {match.playerPicks && match.playerPicks.map((p, idx) => (
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
            <span className="text-xs text-slate-400">คู่แข่ง</span>
            <span className="font-bold text-slate-200 flex items-center gap-1.5 flex-wrap justify-end">
              {opponentProfileId ? (
                <button
                  onClick={() => onOpenPlayer(opponentProfileId)}
                  className="flex items-center gap-1 text-slate-100 hover:text-rose-300 underline decoration-dotted underline-offset-2 cursor-pointer"
                  title="เปิดโปรไฟล์คู่แข่ง"
                >
                  {match.opponent?.flag} {match.opponent?.name}
                </button>
              ) : (
                <span>{match.opponent?.flag} {match.opponent?.name}</span>
              )}
              <span className="text-xs text-slate-400 font-normal">({match.opponent?.score} pts)</span>
              {meetings > 1 && (
                <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30">
                  เจอกัน {meetings} ครั้ง
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 justify-start lg:justify-end">
            {match.opponent?.picks && match.opponent.picks.map((p, idx) => (
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
        <div className="absolute -top-1.5 -left-1.5 px-1 rounded-xs bg-amber-500 text-slate-950 text-[10px] font-black shadow-xs z-10">
          LEAD
        </div>
      )}

      {/* Banned Overlay Badge */}
      {monster.isBanned && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="w-full bg-rose-600/90 text-white text-[10px] font-black text-center py-0.5 shadow-md uppercase tracking-wider transform -rotate-12 border border-rose-400">
            BAN
          </div>
        </div>
      )}
    </div>
  );
}
