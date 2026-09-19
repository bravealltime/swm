import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  Crosshair,
  Package,
  Layers,
  UserCheck,
  Upload,
  RefreshCw,
  Share2,
  Camera,
} from 'lucide-react';
import MonsterAvatar from '../components/MonsterAvatar';
import { PROMO_CODES } from '../data/promoCodes';
import { useGuildRankings } from '../hooks/useGuildRankings';
import { SERVERS } from '../utils/guildRankings';
import { getR2AvatarUrl } from '../services/r2Service';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { loadBox, saveBox, parseSwexExport, getArtifactsFromBox, loadDemoBox, getMonsterCatalogInfo, isNonSummonableLd5 } from '../utils/swexImport';
import { loadUserBoxFromDB, saveUserBoxToDB } from '../services/storageService';
import { exportProfileCard } from '../utils/cardExporter';
import AiChatPanel from '../components/AiChatPanel';
import { summarizeBoxForAi, keyMonstersForAi } from '../utils/boxSummary';

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
  const [userBox, setUserBox] = useState(() => loadBox());
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [customAvatar, setCustomAvatar] = useState(() => {
    try {
      const saved = localStorage.getItem('swm:profile-avatar');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [avatarSearch, setAvatarSearch] = useState('');
  const [avatarTab, setAvatarTab] = useState('all');

  const handleSelectAvatar = (monster) => {
    if (!monster) return;
    const payload = {
      masterId: monster.masterId,
      name: monster.name,
      thaiName: monster.thaiName || monster.name,
      avatarUrl: monster.avatarUrl,
      element: monster.element,
      stars: monster.stars || 6,
    };
    setCustomAvatar(payload);
    try {
      localStorage.setItem('swm:profile-avatar', JSON.stringify(payload));
    } catch (e) {
      console.warn(e);
    }
    setIsAvatarPickerOpen(false);
  };

  const handleResetAvatar = () => {
    setCustomAvatar(null);
    try {
      localStorage.removeItem('swm:profile-avatar');
    } catch (e) {
      console.warn(e);
    }
    setIsAvatarPickerOpen(false);
  };

  useEffect(() => {
    loadUserBoxFromDB().then((b) => {
      if (b) setUserBox(b);
    });
  }, []);

  const activeCodes = useMemo(() => {
    return PROMO_CODES.filter(c => c.status === 'active').slice(0, 4);
  }, []);

  // The big datasets are only needed for two preview widgets, so they are
  // fetched after first paint instead of being part of the home-page bundle.
  const [mdcData, setMdcData] = useState(null);
  const [topRtaPlayers, setTopRtaPlayers] = useState([]);
  const [thaiGuardians, setThaiGuardians] = useState(null); // { players, total, fetchedAt }
  const playersRef = useRef({ players: [], adapter: null }); // full SWRT index, for the coach's player lookups
  const [followedPlayers] = useLocalStorage('swm:fav-players', []);
  useEffect(() => {
    let alive = true;
    import('../data/allMdcData.json').then((m) => { if (alive) setMdcData(m.default); });
    import('../data/playerProfiles.json').then((m) => { if (alive) setTopRtaPlayers(m.default.slice(0, 4)); });
    Promise.all([import('../data/swrtPlayersIndex.json'), import('../data/swrtPlayerAdapter')]).then(([idx, adapter]) => {
      if (!alive) return;
      playersRef.current = { players: idx.default.players || [], adapter };
      const th = (idx.default.players || []).filter((p) => p.c === 'TH' && p.m > 0).sort((a, b) => b.s - a.s);
      setThaiGuardians({
        total: th.length,
        fetchedAt: idx.default.meta?.fetchedAt,
        players: th.slice(0, 5).map((p) => ({ ...p, tier: adapter.tierFromLevel(p.lv) })),
      });
    });
    return () => { alive = false; };
  }, []);

  // Match defense team from the MDC dataset with real defenseMonsters
  const currentDefenseData = useMemo(() => {
    if (!mdcData) return null;
    const targetNames = selectedPreset.monsters;
    const match = mdcData.find(def => {
      const defNames = def.defenseMonsters?.map(m => m.name?.toLowerCase()) || [];
      return targetNames.every(t => defNames.some(d => d?.includes(t.toLowerCase())));
    });
    return match || mdcData[0];
  }, [mdcData, selectedPreset]);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Questions go to the Summoners War coach; short names route to the player / monster pages
  const [aiQuestion, setAiQuestion] = useState('');
  const coachContext = (question) => {
    const ctx = { scope: 'general' };
    if (userBox?.units?.length) {
      ctx.box = summarizeBoxForAi(userBox, getMonsterCatalogInfo);
      ctx.monsters = keyMonstersForAi(userBox, getMonsterCatalogInfo);
    }
    const q = String(question || '').toLowerCase();
    const { players, adapter } = playersRef.current;
    if (q && players.length && adapter) {
      ctx.players = players
        .filter((p) => p.n && p.n.length >= 3 && q.includes(p.n.toLowerCase()))
        .sort((a, b) => b.n.length - a.n.length)
        .slice(0, 2)
        .map((p) => {
          const tier = adapter.tierFromLevel(p.lv);
          const top = (p.top || p.ts || []).slice(0, 6).map(([m, n, w]) => `${getMonsterCatalogInfo(m)?.name || `#${m}`} ${n} แมตช์ ชนะ ${w}`);
          return `${p.n} (${p.c || 'GL'}) ${tier.rankTier} คะแนน ${p.s} อันดับโลก ${p.r || '-'} • ${p.m || 0} แมตช์ ชนะ ${p.w || 0} • ใช้บ่อย: ${top.join(', ') || '-'} (พบล่าสุด ${p.seen || '-'})`;
        });
    }
    return ctx;
  };
  const looksLikeQuestion = (q) => /[?？]|ยังไง|อย่างไร|อะไร|ทำไม|ควร|ไหม|มั้ย|แนะนำ|จัดทีม|เทียบ|ดีกว่า|แก้ทาง|ใส่รูน|ตี(?:ยังไง|ไง)/i.test(q) || /(?:^|\W)(how|what|why|should|vs)(?:\W|$)/i.test(q) || q.split(/\s+/).length >= 4;

  const handleSearchSubmit = (e, forceAi = false) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    const query = searchQuery.trim();
    if (forceAi || looksLikeQuestion(query)) {
      setAiQuestion(query);
      return;
    }
    if (['lest', 'diligent', 'pinkroid', 'ลูกพี่', 'braveheart'].some(p => query.toLowerCase().includes(p))) {
      onNavigate('player-tracker', { initialPlayer: query });
    } else {
      onNavigate('where2use', { initialMonster: query });
    }
  };

  const [guildKind, setGuildKind] = useState('siege');
  const rankings = useGuildRankings();
  const guildBoard = rankings.board(selectedServer, guildKind);
  const topGuilds = guildBoard ? guildBoard.rows.slice(0, 5) : [];

  const handleQuickUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingProfile(true);
      const text = await file.text();
      const parsed = parseSwexExport(JSON.parse(text));
      if (parsed.units && parsed.units.length > 0) {
        saveBox(parsed);
        setUserBox(parsed);
      }
    } catch (err) {
      console.error('Failed to parse uploaded SWEX file:', err);
    } finally {
      setUploadingProfile(false);
    }
  };

  const userProfileStats = useMemo(() => {
    if (!userBox) return null;
    const units = userBox.units || [];
    const totalUnits = units.length;
    const sixStarUnits = units.filter((u) => u.stars === 6).length;
    const fastestUnit = [...units].sort((a, b) => b.spd - a.spd)[0] || null;
    const fastestName = fastestUnit ? (fastestUnit.name || getMonsterCatalogInfo(fastestUnit.masterId)?.name || '') : '';
    const artifacts = getArtifactsFromBox(userBox);

    // Calculate Nat 5 & LD5 counts (แยกตัวเปิดได้เอง vs ฟิวชั่น/แจกฟรี)
    let nat5Count = 0;
    let ld5Count = 0;
    let pureLd5Count = 0;
    let freeLd5Count = 0;
    units.forEach((u) => {
      const info = getMonsterCatalogInfo(u.masterId);
      const ele = (u.element || info?.element || '').toLowerCase();
      const isLd = ele === 'light' || ele === 'dark';
      const isNat5 = (info?.stars === 5 || info?.natural_stars === 5 || u.naturalStars === 5) && !info?.name?.includes('(Homunculus)');
      if (isNat5) {
        nat5Count++;
        if (isLd) {
          ld5Count++;
          if (isNonSummonableLd5(u) || (info && isNonSummonableLd5(info))) {
            freeLd5Count++;
          } else {
            pureLd5Count++;
          }
        }
      }
    });

    let sumEff = 0;
    let countEff = 0;
    const ld5List = [];
    units.forEach((u) => {
      const info = getMonsterCatalogInfo(u.masterId);
      const ele = (u.element || info?.element || '').toLowerCase();
      const isLd = ele === 'light' || ele === 'dark';
      const isNat5 = (info?.stars === 5 || info?.natural_stars === 5 || u.naturalStars === 5) && !info?.name?.includes('(Homunculus)');
      if (isNat5 && isLd && !isNonSummonableLd5(u) && (!info || !isNonSummonableLd5(info))) {
        ld5List.push({ name: u.name || info?.name || 'LD 5★', element: ele, spd: u.spd, sets: u.sets, avatarUrl: u.avatarUrl || info?.avatarUrl || info?.imageUrl || '' });
      }
      if (u.runeEff) {
        sumEff += Number(u.runeEff);
        countEff++;
      }
    });
    const avgRuneEff = countEff > 0 ? (sumEff / countEff).toFixed(1) : '85.4';
    const topFastest = [...units].sort((a, b) => b.spd - a.spd).slice(0, 4);
    // portraits for the share card: fastest monsters first, one entry per monster name
    const seenNames = new Set();
    const cardHeroes = [...units].sort((a, b) => b.spd - a.spd).map((u) => {
      const info = getMonsterCatalogInfo(u.masterId);
      return { name: u.name || info?.name || '', element: (u.element || info?.element || '').toLowerCase(), spd: u.spd, sets: u.sets || [], avatarUrl: u.avatarUrl || info?.avatarUrl || info?.imageUrl || '' };
    }).filter((m) => m.name && !seenNames.has(m.name) && seenNames.add(m.name));

    const runes = userBox.runes || [];
    const quadSpdCount = runes.filter(r => (r.subs || []).some(s => s[0] === 8 && s[1] >= 20)).length;

    // Select active profile avatar:
    // 1. User's manually chosen avatar from localStorage
    // 2. Rep Monster from SWEX (wizard.repMonster)
    // 3. User's #1 LD 5★ (pureLd5)
    // 4. User's fastest monster (fastestUnit)
    // 5. First unit in box
    const activeAvatar = customAvatar
      || (userBox.wizard?.repMonster?.name ? userBox.wizard.repMonster : null)
      || (ld5List.length > 0 ? ld5List[0] : null)
      || (fastestUnit ? {
          masterId: fastestUnit.masterId,
          name: fastestUnit.name,
          thaiName: fastestUnit.thaiName,
          avatarUrl: fastestUnit.avatarUrl,
          element: fastestUnit.element,
          spd: fastestUnit.spd,
          stars: fastestUnit.stars || 6,
        } : null)
      || (units[0] ? {
          masterId: units[0].masterId,
          name: units[0].name,
          thaiName: units[0].thaiName,
          avatarUrl: units[0].avatarUrl,
          element: units[0].element,
          stars: units[0].stars || 6,
        } : null);

    const nat5Pct = ((nat5Count / 455) * 100).toFixed(1);

    return {
      name: userBox.wizard?.name || userBox.wizard?.wizard_name || 'ผู้เรียกมอนสเตอร์ของคุณ',
      server: userBox.wizard?.country === 'TH' ? 'Asia Server (TH)' : (userBox.wizard?.server || 'Asia Server'),
      guild: userBox.wizard?.guild || '',
      level: userBox.wizard?.level || userBox.wizard?.wizard_level || 100,
      activeAvatar,
      totalUnits,
      sixStarUnits,
      fastestSpd: fastestUnit ? fastestUnit.spd : 0,
      fastestName,
      avgRuneEff,
      totalArtifacts: artifacts.length,
      topFastest,
      nat5Count,
      nat5Pct,
      ld5Count,
      pureLd5Count,
      cardHeroes,
      freeLd5Count,
      ld5List,
      quadSpdCount,
      isDemo: !!userBox.isDemo,
    };
  }, [userBox, customAvatar]);

  const availableAvatarUnits = useMemo(() => {
    if (!userBox?.units) return [];
    const q = avatarSearch.toLowerCase().trim();
    let list = userBox.units;

    if (avatarTab === 'ld5') {
      list = list.filter((u) => {
        const ele = (u.element || '').toLowerCase();
        return (ele === 'light' || ele === 'dark') && (u.naturalStars === 5 || u.stars === 5);
      });
    } else if (avatarTab === 'fast') {
      list = [...list].sort((a, b) => b.spd - a.spd).slice(0, 30);
    } else if (avatarTab === 'six_star') {
      list = list.filter((u) => u.stars === 6);
    }

    if (q) {
      list = list.filter((u) =>
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.thaiName && u.thaiName.toLowerCase().includes(q))
      );
    }

    const seen = new Set();
    return list.filter((u) => {
      const key = `${u.name}-${u.element}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 72);
  }, [userBox, avatarSearch, avatarTab]);

  return (
    <div className="space-y-8 max-w-[1780px] 2xl:max-w-[1880px] mx-auto pb-16 animate-in fade-in duration-300">
      
      {/* 1. HERO COMMAND SPOTLIGHT (2026 Esports Design) */}
      <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-[#0e1626] via-[#090e18] to-[#070b12] p-5 sm:p-10 shadow-2xl">
        {/* Ambient Glow Orbs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-4 sm:space-y-5">
          {/* Badge Chips */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/10 backdrop-blur-md text-xs font-semibold text-slate-300 shadow-inner whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-mono font-bold">RTA S38</span>
            <span className="text-slate-400 hidden sm:inline">•</span>
            <span className="hidden sm:inline">ศูนย์ข้อมูลยุทธวิธี Summoners War ภาษาไทย</span>
          </div>

          {/* High-Impact Headline */}
          <h1 className="text-2xl sm:text-5xl font-black tracking-tight text-white leading-tight">
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
                placeholder="พิมพ์ชื่อผู้เล่น / มอนสเตอร์ หรือถามโค้ช AI เช่น Seara แก้ยังไง..."
                className="w-full bg-[#0d1422]/90 border border-white/15 focus:border-cyan-400 hover:border-white/25 rounded-2xl pl-12 pr-[11.5rem] sm:pr-[13rem] py-3.5 sm:py-4 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition-all shadow-2xl backdrop-blur-xl"
              />
              <div className="absolute right-2 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => handleSearchSubmit(e, true)}
                  title="ถามโค้ช AI (เฉพาะเรื่อง Summoners War)"
                  className="px-3 py-2 sm:py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-200 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" /> ถาม AI
                </button>
                <button
                  type="submit"
                  className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
                >
                  ค้นหา
                </button>
              </div>
            </div>

            {/* Quick Hot Suggestions */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-3 text-xs">
              <span className="text-slate-400 text-xs font-semibold">แนะนำค้นหา:</span>
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

          {aiQuestion && (
              <div className="text-left mt-3 max-w-2xl mx-auto">
                <AiChatPanel
                  key={aiQuestion}
                  initialQuestion={aiQuestion}
                  title="โค้ช AI — ตอบเฉพาะเรื่อง Summoners War"
                  placeholder="ถามต่อได้เลย..."
                  buildContext={(q) => coachContext(q)}
                  suggestions={userBox?.units?.length ? ['มอนหลักในกล่องฉันคือตัวไหน', 'จัดทีม Siege ป้องกันจากกล่องฉัน', 'ตัวไหนควรรูนใหม่ก่อน'] : ['เมตา RTA Guardian ตอนนี้เป็นยังไง', 'จัดทีม GB12 สำหรับมือใหม่', 'Seara แก้ทางด้วยอะไร']}
                />
              </div>
            )}


          {/* Metric Stats Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 border-t border-white/[0.06] text-left">
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
              <div className="text-xs text-slate-400 font-medium">ข้อมูลมอนสเตอร์</div>
              <div className="text-lg sm:text-xl font-black text-white mt-0.5">940+ ตัว</div>
              <div className="text-xs text-emerald-400 font-medium">แปลสกิลไทย 100%</div>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
              <div className="text-xs text-slate-400 font-medium">ทีมแก้ทาง Siege</div>
              <div className="text-lg sm:text-xl font-black text-white mt-0.5">1,500+ สูตร</div>
              <div className="text-xs text-blue-400 font-medium">3MDC Counter Data</div>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
              <div className="text-xs text-slate-400 font-medium">World Arena RTA</div>
              <div className="text-lg sm:text-xl font-black text-white mt-0.5">Season 38</div>
              <div className="text-xs text-amber-400 font-medium">SWRT Esports Stats</div>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
              <div className="text-xs text-slate-400 font-medium">โค้ดไอเทมแจกฟรี</div>
              <div className="text-lg sm:text-xl font-black text-white mt-0.5">5 โค้ดแอคทีฟ</div>
              <div className="text-xs text-purple-400 font-medium">รับได้ทันทีในเกม</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. MY SUMMONER PROFILE PASSPORT (โปรไฟล์เราเอง เข้าดูง่ายๆ) */}
      <section className="relative overflow-hidden rounded-3xl border border-cyan-500/25 bg-gradient-to-br from-[#0c172a] via-[#080e1b] to-[#040710] p-5 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl">
        {/* Ambient Glow Orbs */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-12 left-10 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {userProfileStats ? (
          <div className="relative z-10 space-y-6">
            {/* Top Row: Identity & Hero Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/[0.07]">
              {/* Left: Real Avatar & Details */}
              <div className="flex items-center gap-4 sm:gap-5">
                {/* Clickable Avatar with Element Ring Glow */}
                <div
                  onClick={() => setIsAvatarPickerOpen(true)}
                  className="relative group cursor-pointer shrink-0"
                  title="คลิกเพื่อเลือกรูปมอนสเตอร์ประจำโปรไฟล์"
                >
                  <div className={`p-1 rounded-2xl transition-all duration-300 group-hover:scale-105 ${
                    userProfileStats.activeAvatar?.element === 'dark'
                      ? 'bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-indigo-600 shadow-[0_0_25px_rgba(168,85,247,0.35)]'
                      : userProfileStats.activeAvatar?.element === 'light'
                      ? 'bg-gradient-to-tr from-amber-400 via-yellow-300 to-orange-400 shadow-[0_0_25px_rgba(251,191,36,0.35)]'
                      : userProfileStats.activeAvatar?.element === 'water'
                      ? 'bg-gradient-to-tr from-cyan-400 via-blue-500 to-sky-400 shadow-[0_0_25px_rgba(34,211,238,0.35)]'
                      : userProfileStats.activeAvatar?.element === 'wind'
                      ? 'bg-gradient-to-tr from-emerald-400 via-teal-500 to-green-400 shadow-[0_0_25px_rgba(52,211,153,0.35)]'
                      : 'bg-gradient-to-tr from-rose-500 via-orange-500 to-red-500 shadow-[0_0_25px_rgba(244,63,94,0.35)]'
                  }`}>
                    <div className="relative rounded-2xl overflow-hidden bg-[#0a0f1d] flex items-center justify-center">
                      <MonsterAvatar
                        monster={userProfileStats.activeAvatar}
                        size="lg"
                        showStars={false}
                      />
                      {/* Hover Overlay with Camera Icon */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white">
                        <Camera className="w-5 h-5 text-amber-300" />
                        <span className="text-[10px] font-bold">เปลี่ยนรูป</span>
                      </div>
                    </div>
                  </div>

                  {/* Level 100 Badge */}
                  <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-emerald-500 text-black text-[10px] font-black shadow-lg ring-2 ring-[#0a0f1d]">
                    Lv.{userProfileStats.level}
                  </span>
                </div>

                {/* Name & Badges */}
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 uppercase tracking-wide">
                      👑 โปรไฟล์ของฉัน (My Profile)
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {userProfileStats.server}
                    </span>
                    {userProfileStats.guild && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        🛡️ {userProfileStats.guild}
                      </span>
                    )}
                    {userProfileStats.isDemo && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        ⭐ G3 Demo
                      </span>
                    )}
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2 truncate">
                    <span>{userProfileStats.name}</span>
                    <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                  </h2>

                  <div className="flex items-center gap-2 text-xs text-slate-300 flex-wrap">
                    <span className="font-semibold text-cyan-300">
                      ตัวแทน: {userProfileStats.activeAvatar?.thaiName || userProfileStats.activeAvatar?.name || 'มอนสเตอร์'}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">
                      มอนสเตอร์ {userProfileStats.totalUnits} ตัว ({userProfileStats.sixStarUnits} ตัว 6★)
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAvatarPickerOpen(true)}
                      className="ml-1 text-[11px] text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer inline-flex items-center gap-0.5"
                    >
                      <Camera className="w-3 h-3" />
                      เปลี่ยนรูปตัวแทน
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: Primary Hero Actions */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    exportProfileCard({
                      wizard: {
                        ...userBox.wizard,
                        repMonster: userProfileStats.activeAvatar,
                      },
                      stats: {
                        total6Star: userProfileStats.sixStarUnits,
                        ld5Count: userProfileStats.pureLd5Count,
                        avgEff: userProfileStats.avgRuneEff,
                        quadSpdCount: userProfileStats.quadSpdCount,
                        totalUnits: userProfileStats.totalUnits,
                        nat5Count: userProfileStats.nat5Count,
                        totalArtifacts: userProfileStats.totalArtifacts,
                      },
                      topLd5: userProfileStats.ld5List || [],
                      heroes: [userProfileStats.activeAvatar, ...(userProfileStats.cardHeroes || [])].filter(Boolean),
                    });
                  }}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all cursor-pointer"
                  title="บันทึกรูป Passport Card เป็นไฟล์ PNG (มีหน้าต่างดูตัวอย่างก่อนดาวน์โหลด)"
                >
                  <Share2 className="w-4 h-4" />
                  <span>บันทึกการ์ดโปรไฟล์ (PNG)</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('my-box')}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  <Package className="w-4 h-4 text-cyan-400" />
                  <span>เปิดดู My Box</span>
                </button>
              </div>
            </div>

            {/* Middle Row: 5 Command Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* Card 1: Nat 5 & LD5 Hall */}
              <div
                onClick={() => onNavigate('my-box', { tab: 'pokedex' })}
                className="p-3.5 rounded-2xl bg-gradient-to-b from-amber-500/[0.08] to-amber-500/[0.02] border border-amber-500/25 hover:border-amber-500/40 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="text-[10px] text-amber-300 font-bold uppercase flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-amber-400" /> ตู้สะสม Nat 5
                    </span>
                    <span className="text-[10px] font-black text-amber-400">{userProfileStats.nat5Pct}%</span>
                  </div>
                  <div className="text-xl font-black text-white mt-1">
                    {userProfileStats.nat5Count} <span className="text-xs text-slate-400 font-normal">/ 455</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 rounded-full"
                      style={{ width: `${Math.min(userProfileStats.nat5Pct, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="text-[10px] text-amber-300/90 font-semibold mt-2.5 pt-2 border-t border-amber-500/15 flex items-center justify-between">
                  <span>✨ {userProfileStats.pureLd5Count} ตัว LD กาชา</span>
                  {userProfileStats.freeLd5Count > 0 && (
                    <span className="text-slate-400 font-normal">(+{userProfileStats.freeLd5Count} ฟรี)</span>
                  )}
                </div>
              </div>

              {/* Card 2: Fastest SPD */}
              <div
                onClick={() => onNavigate('my-box', { tab: 'speed' })}
                className="p-3.5 rounded-2xl bg-gradient-to-b from-cyan-500/[0.08] to-cyan-500/[0.02] border border-cyan-500/20 hover:border-cyan-500/40 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="text-[10px] text-cyan-300 font-bold uppercase flex items-center gap-1">
                    <Zap className="w-3 h-3 text-cyan-400" /> สปีดสูงสุด
                  </div>
                  <div className="text-xl font-black text-cyan-300 mt-1 flex items-baseline gap-1">
                    {userProfileStats.fastestSpd} <span className="text-xs text-slate-400 font-bold">SPD</span>
                  </div>
                </div>
                <div className="mt-2.5 pt-2 border-t border-cyan-500/15 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white truncate max-w-[100px]">
                    {userProfileStats.fastestName || 'ไม่มีข้อมูล'}
                  </span>
                  <span className="text-[10px] text-cyan-400 font-medium">เร็วสุดในไอดี</span>
                </div>
              </div>

              {/* Card 3: Total Units */}
              <div
                onClick={() => onNavigate('my-box')}
                className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:border-white/20 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                    <Package className="w-3 h-3 text-blue-400" /> มอนสเตอร์ทั้งหมด
                  </div>
                  <div className="text-xl font-black text-white mt-1">
                    {userProfileStats.totalUnits} <span className="text-xs text-slate-400 font-normal">ตัว</span>
                  </div>
                </div>
                <div className="text-[10px] text-emerald-400 font-semibold mt-2.5 pt-2 border-t border-white/[0.05] flex items-center gap-1">
                  <Star className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                  <span>{userProfileStats.sixStarUnits} ตัว 6★ พร้อมรบ</span>
                </div>
              </div>

              {/* Card 4: Rune Efficiency */}
              <div
                onClick={() => onNavigate('my-box', { tab: 'runes' })}
                className="p-3.5 rounded-2xl bg-gradient-to-b from-purple-500/[0.08] to-purple-500/[0.02] border border-purple-500/20 hover:border-purple-500/40 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="text-[10px] text-purple-300 font-bold uppercase flex items-center gap-1">
                    <Sliders className="w-3 h-3 text-purple-400" /> คุณภาพรูนเฉลี่ย
                  </div>
                  <div className="text-xl font-black text-purple-200 mt-1">
                    {userProfileStats.avgRuneEff}%
                  </div>
                </div>
                <div className="text-[10px] text-purple-300 font-semibold mt-2.5 pt-2 border-t border-purple-500/15 flex items-center justify-between">
                  <span>⚡ Quad SPD:</span>
                  <span className="font-bold text-white">{userProfileStats.quadSpdCount} เม็ด</span>
                </div>
              </div>

              {/* Card 5: Artifacts */}
              <div
                onClick={() => onNavigate('my-box', { subItem: 'artifacts' })}
                className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-gradient-to-b from-teal-500/[0.08] to-teal-500/[0.02] border border-teal-500/20 hover:border-teal-500/40 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="text-[10px] text-teal-300 font-bold uppercase flex items-center gap-1">
                    <Layers className="w-3 h-3 text-teal-400" /> อาร์ติแฟกต์
                  </div>
                  <div className="text-xl font-black text-teal-200 mt-1">
                    {userProfileStats.totalArtifacts} <span className="text-xs text-slate-400 font-normal">ชิ้น</span>
                  </div>
                </div>
                <div className="text-[10px] text-teal-300 font-semibold mt-2.5 pt-2 border-t border-teal-500/15 flex items-center justify-between">
                  <span>ในไอดี</span>
                  <span className="text-slate-400 text-[10px]">พร้อมฟาร์ม</span>
                </div>
              </div>
            </div>

            {/* Bottom Row: Quick Navigation Ribbon */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.05]">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate('my-box', { tab: 'pokedex' })}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-300 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>ตู้สะสม Nat 5 & LD5</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('my-box', { subItem: 'artifacts' })}
                  className="px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/25 text-teal-300 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5 text-teal-400" />
                  <span>ค้นหาอาร์ติแฟกต์</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('guild-war-room')}
                  className="px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 text-indigo-300 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                  <span>ห้องบัญชาการกิลด์</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('arena')}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Swords className="w-3.5 h-3.5 text-rose-400" />
                  <span>ค้นหาทีมเจาะ Arena</span>
                </button>
              </div>

              {/* Upload SWEX quick update button */}
              <label className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-slate-400" />
                <span>{uploadingProfile ? 'กำลังอัปเดต...' : 'อัปเดตไฟล์ SWEX'}</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleQuickUpload}
                  disabled={uploadingProfile}
                />
              </label>
            </div>
          </div>
        ) : (
          /* Empty State: Prompt to connect profile in 1 click */
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
                <UserCheck className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold text-white">เชื่อมต่อโปรไฟล์ไอดีของคุณเข้าสู่หน้าแรก</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-300 uppercase">
                    1-Click Connect
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
                  นำเข้าไฟล์ SWEX JSON เพื่อแสดงโปรไฟล์ สถิติรูน ตู้สะสม Nat 5 & LD และอาร์ติแฟกต์ของคุณที่หน้าแรกทันที หรือทดลองด้วยไอดีตัวอย่าง Guardian
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                onClick={() => {
                  const demo = loadDemoBox();
                  setUserBox(demo);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Trophy className="w-4 h-4 text-slate-950" />
                <span>โหลดไอดีตัวอย่าง Guardian G3</span>
              </button>
              <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/20 transition-all cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>{uploadingProfile ? 'กำลังอ่านไฟล์...' : 'นำเข้าไฟล์ SWEX JSON'}</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleQuickUpload}
                  disabled={uploadingProfile}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}
      </section>

      {/* 3. INSTANT PROMO CODES BANNER (1-Click Copy) */}
      <section className="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/20 via-[#0a1215] to-[#080d16] p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
              <Gift className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white">โค้ดแจกไอเทมประจำเดือน</h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 uppercase">
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
                          src={getR2AvatarUrl(player.id, player.profileAvatar)} 
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
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
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

          {followedPlayers.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-amber-300 font-bold">⭐ ที่คุณติดตาม:</span>
              {followedPlayers.map((name) => (
                <button key={name} onClick={() => onNavigate('player-tracker', { initialPlayer: name })} className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 border border-amber-500/30 cursor-pointer">
                  {name}
                </button>
              ))}
            </div>
          )}

          {/* Thai Guardians from the public replay feed */}
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.04] p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-white">🇹🇭 Guardian คนไทยจากรีเพลย์จริง</h3>
                <p className="text-[11px] text-slate-400">
                  {thaiGuardians ? `${thaiGuardians.total} คนใน Guardian ตอนนี้ • SWRT ${thaiGuardians.fetchedAt?.slice(0, 10) || ''}` : 'กำลังโหลด...'}
                </p>
              </div>
              <button
                onClick={() => onNavigate('guardian')}
                className="text-xs font-bold text-rose-300 hover:text-rose-200 flex items-center gap-1 cursor-pointer shrink-0"
              >
                ดูอันดับทั้งหมด <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {thaiGuardians && thaiGuardians.players.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {thaiGuardians.players.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => onNavigate('player-tracker', { initialPlayer: p.n })}
                    className="flex sm:flex-col items-center sm:items-start gap-2 p-2.5 rounded-xl bg-[#090e18] border border-white/[0.06] hover:border-rose-500/40 text-left cursor-pointer"
                  >
                    <span className="text-xs font-mono text-slate-400">#{i + 1}</span>
                    <span className="text-xs font-bold text-white truncate w-full">{p.n}</span>
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <span className="px-1 py-0.5 rounded font-black bg-rose-500/15 text-rose-300 border border-rose-500/30">{p.tier.rankBadge}</span>
                      <span className="font-mono text-amber-300">{p.s.toLocaleString()}</span>
                    </span>
                  </button>
                ))}
              </div>
            ) : thaiGuardians ? (
              <div className="text-xs text-slate-400">ยังไม่พบผู้เล่นไทยในรีเพลย์ที่สแกน</div>
            ) : (
              <div className="h-16 rounded-xl bg-white/[0.02] animate-pulse" aria-busy="true" />
            )}
          </div>

          {/* Bottom Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/[0.06]">
            <button
              onClick={() => onNavigate('player-tracker')}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>ค้นหาสถิติผู้เล่น RTA (Lucksack + รีเพลย์ SWRT)</span>
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
              <div className="text-xs font-semibold text-slate-400">ทีมตั้งรับยอดนิยม:</div>
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
            {!currentDefenseData ? (
              <div className="p-4 rounded-2xl bg-[#090e18] border border-white/[0.06] h-40 animate-pulse" aria-busy="true" />
            ) : (
            <div className="p-4 rounded-2xl bg-[#090e18] border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold text-slate-300">ทีมตั้งรับ (Defense):</span>
                <span className="font-mono text-emerald-400 font-bold">ความน่าเชื่อถือ {currentDefenseData.counters?.[0]?.winRate || '—'}</span>
              </div>
              
              <div className="flex items-center gap-3">
                {currentDefenseData.defenseMonsters && currentDefenseData.defenseMonsters.length > 0 ? (
                  currentDefenseData.defenseMonsters.map((m, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <MonsterAvatar monster={m} size="sm" />
                      <span className="text-[11px] text-slate-300 font-bold truncate max-w-[64px] text-center">
                        {m.thaiName || m.name}
                      </span>
                    </div>
                  ))
                ) : (
                  selectedPreset.monsters.map((name, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <MonsterAvatar monster={name} size="sm" />
                      <span className="text-[11px] text-slate-300 font-bold truncate max-w-[64px] text-center">{name}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Best Recommended Counter from Real 3MDC Data */}
              <div className="pt-2.5 border-t border-white/[0.06] space-y-2">
                <div className="text-xs font-bold text-amber-400 flex items-center gap-1">
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
            )}
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
            <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
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
            <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
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
            <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
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

      {/* 5. TOP GUILDS — real leaderboards contributed through AegisLink */}
      <section className="rounded-3xl border border-white/[0.08] bg-[#0c121e]/80 backdrop-blur-xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">อันดับกิลด์ระดับท็อป (Siege & WGB)</h2>
              <p className="text-xs text-slate-400">
                {guildBoard
                  ? `ข้อมูลจริงจากหน้าอันดับในเกม • อัปเดต ${new Date(guildBoard.at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}${guildBoard.source === 'live' ? ' • จากเครื่องนี้ (AegisLink)' : ''}`
                  : 'ข้อมูลจริงจากหน้าอันดับในเกม แชร์โดยผู้เล่นที่เชื่อมต่อ AegisLink'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center gap-1 bg-[#090e18] p-1 rounded-xl border border-white/[0.06]">
              {[['siege', 'Siege'], ['wgb', 'WGB']].map(([k, label]) => (
                <button key={k} onClick={() => setGuildKind(k)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${guildKind === k ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}`}>{label}</button>
              ))}
            </div>
            <div className="flex items-center gap-1 bg-[#090e18] p-1 rounded-xl border border-white/[0.06]">
              {SERVERS.map((srv) => (
                <button
                  key={srv.id}
                  onClick={() => setSelectedServer(srv.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                    selectedServer === srv.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {srv.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {topGuilds.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {topGuilds.map((guild, idx) => (
              <div
                key={guild.guildId || guild.name}
                className="p-4 rounded-2xl bg-[#090e18] border border-white/[0.06] hover:border-blue-500/30 transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-black font-mono px-2 py-0.5 rounded-md ${
                    idx === 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    idx === 1 ? 'bg-slate-300/20 text-slate-200 border border-slate-300/30' :
                    idx === 2 ? 'bg-amber-700/20 text-amber-600 border border-amber-700/30' :
                    'bg-white/[0.04] text-slate-400'
                  }`}>
                    #{guild.rank}
                  </span>
                  <span className="text-[11px] text-slate-400 uppercase">{selectedServer}</span>
                </div>
                <div className="font-black text-sm text-white truncate" title={guild.name}>
                  {guild.name}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-white/[0.04]">
                  <span>คะแนน</span>
                  <span className="font-mono font-bold text-cyan-400">{guild.points ? guild.points.toLocaleString() : '—'}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-5 rounded-2xl border border-dashed border-white/10 bg-[#090e18]/60 text-sm text-slate-300 space-y-2">
            <div className="font-bold text-white">
              {rankings.loading ? 'กำลังโหลด…' : `ยังไม่มีอันดับ ${guildKind === 'siege' ? 'Siege' : 'WGB'} ของเซิร์ฟเวอร์ ${SERVERS.find((x) => x.id === selectedServer)?.label} — เราไม่แต่งตัวเลขขึ้นเอง`}
            </div>
            {!rankings.loading && (
              <p className="text-xs text-slate-400 leading-relaxed">
                อันดับกิลด์ไม่มีแหล่งข้อมูลสาธารณะ ระบบจึงรับจากหน้าอันดับในเกมโดยตรง: เชื่อมต่อ <button onClick={() => onNavigate('aegislink')} className="text-cyan-300 underline cursor-pointer">AegisLink</button> แล้วเปิดหน้า <strong className="text-white">อันดับ Siege / World Guild Battle</strong> ในเกม 1 ครั้ง — อันดับจะขึ้นที่นี่ทันที และถ้าเข้าสู่ระบบไว้จะถูกแชร์ให้ผู้เล่นทุกคนเห็นด้วย
                {rankings.error === 'TABLE_MISSING' && <span className="block mt-1 text-amber-300">ผู้ดูแล: ยังไม่ได้สร้างตาราง guild_rankings (supabase/admin_schema.sql)</span>}
              </p>
            )}
          </div>
        )}
        {guildBoard?.source === 'live' && guildBoard.error && (
          <p className="text-[11px] text-amber-300">⚠ {guildBoard.error}</p>
        )}
      </section>

      {/* Avatar Picker Modal */}
      {isAvatarPickerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAvatarPickerOpen(false);
          }}
        >
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-[#0b1120] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">เลือกรูปมอนสเตอร์ประจำโปรไฟล์</h3>
                  <p className="text-xs text-slate-400">เลือกตัวที่คุณชื่นชอบเพื่อแสดงบนโปรไฟล์และการ์ดแชร์</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAvatarPickerOpen(false)}
                className="p-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white cursor-pointer"
                aria-label="ปิด"
              >
                ✕
              </button>
            </div>

            {/* Search & Category Tabs */}
            <div className="p-4 bg-[#090e1a] border-b border-slate-800 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={avatarSearch}
                  onChange={(e) => setAvatarSearch(e.target.value)}
                  placeholder="พิมพ์ชื่อมอนสเตอร์เพื่อค้นหา..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <button
                  type="button"
                  onClick={() => setAvatarTab('all')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 cursor-pointer ${
                    avatarTab === 'all' ? 'bg-cyan-500 text-black font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  ทั้งหมด ({userBox?.units?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarTab('ld5')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 cursor-pointer ${
                    avatarTab === 'ld5' ? 'bg-purple-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  ✨ แสง-มืด 5★ ({userProfileStats?.ld5List?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarTab('fast')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 cursor-pointer ${
                    avatarTab === 'fast' ? 'bg-cyan-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  ⚡ สปีดสูงสุด
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarTab('six_star')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 cursor-pointer ${
                    avatarTab === 'six_star' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  ⭐ 6 ดาว ({userProfileStats?.sixStarUnits || 0})
                </button>
              </div>
            </div>

            {/* Monsters Grid */}
            <div className="flex-1 overflow-y-auto p-4 max-h-[50vh] bg-[#070b14]">
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                {availableAvatarUnits.map((m, idx) => (
                  <button
                    key={`${m.masterId || m.name}-${m.element}-${idx}`}
                    type="button"
                    onClick={() => handleSelectAvatar(m)}
                    className="p-2 rounded-xl bg-white/[0.03] hover:bg-cyan-500/20 border border-white/[0.05] hover:border-cyan-400/50 flex flex-col items-center gap-1.5 transition-all group cursor-pointer"
                  >
                    <MonsterAvatar monster={m} size="md" showStars={false} />
                    <span className="text-[10px] font-bold text-slate-300 truncate w-full text-center group-hover:text-cyan-300">
                      {m.thaiName || m.name}
                    </span>
                    {m.spd ? (
                      <span className="text-[9px] text-slate-400 font-mono">
                        +{m.spd - (m.baseSpd || 100)} SPD
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
              {availableAvatarUnits.length === 0 && (
                <div className="py-12 text-center text-slate-500 text-xs">
                  ไม่พบมอนสเตอร์ที่ค้นหา
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between">
              {customAvatar ? (
                <button
                  type="button"
                  onClick={handleResetAvatar}
                  className="text-xs text-slate-400 hover:text-rose-400 underline font-medium cursor-pointer"
                >
                  รีเซ็ตเป็นตัวแทนเริ่มต้น
                </button>
              ) : <span />}

              <button
                type="button"
                onClick={() => setIsAvatarPickerOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-all cursor-pointer"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
