import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Shield, 
  Gift, 
  Trophy, 
  Search, 
  Copy, 
  Check, 
  ArrowRight, 
  Zap, 
  Sparkles, 
  Swords, 
  Award,
  ChevronRight,
  Cpu,
  Star,
  CheckCircle2,
  Sliders,
  Package,
  Layers,
  UserCheck,
  Upload,
  Share2,
  Camera,
  Radio,
  Calendar,
  Flame,
  BookOpen,
  HelpCircle,
  MessageSquare,
} from 'lucide-react';
import MonsterAvatar from '../components/MonsterAvatar';
import { PROMO_CODES } from '../data/promoCodes';
import gameEventsData from '../data/gameEvents.json';
import { useLiveData } from '../hooks/useLiveData';
import { copyText } from '../utils/clipboard';
import { useGuildRankings } from '../hooks/useGuildRankings';
import { SERVERS } from '../utils/guildRankings';
import { getR2AvatarUrl } from '../services/r2Service';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { loadBox, saveBox, parseSwexExport, getArtifactsFromBox, getMonsterCatalogInfo, isNonSummonableLd5, boxUnits, boxRunes, topSpeedRunesBySet } from '../utils/swexImport';
import { MONSTERS } from '../data/monsters';

// How many nat5 forms the encyclopedia knows — the denominator of the collection bar
const NAT5_TOTAL = MONSTERS.filter((m) => m.stars === 5).length;

// A summonable light/dark nat5 from boxUnits(): natural 5★, not a fusion / giveaway, not a homunculus
const isPureLd5 = (u) => {
  const ele = (u.element || '').toLowerCase();
  const isLd = ele === 'light' || ele === 'dark';
  const isNat5 = u.naturalStars === 5 && !u.info?.name?.includes('(Homunculus)');
  return isNat5 && isLd && !isNonSummonableLd5(u) && (!u.info || !isNonSummonableLd5(u.info));
};
import { loadUserBoxFromDB } from '../services/storageService';
import { exportProfileCard, exportAccountMilestoneCard } from '../utils/cardExporter';
import AiChatPanel from '../components/AiChatPanel';
import { summarizeBoxForAi, keyMonstersForAi } from '../utils/boxSummary';

const POPULAR_PRESETS = [
  { label: 'Seara + Orion + Perna', defKey: 'Seara,Orion,Perna', monsters: ['Seara', 'Orion', 'Perna'] },
  { label: 'Carcano + Savannah + Miles', defKey: 'Carcano,Savannah,Miles', monsters: ['Carcano', 'Savannah', 'Miles'] },
  { label: 'Khmun + Vigor + Skogul', defKey: 'Khmun,Vigor,Skogul', monsters: ['Khmun', 'Vigor', 'Skogul'] },
  { label: 'Mo Long + Harmonia + Taranys', defKey: 'Mo Long,Harmonia,Taranys', monsters: ['Mo Long', 'Harmonia', 'Taranys'] },
  { label: 'Martina + Shaina + Triana', defKey: 'Martina,Shaina,Triana', monsters: ['Martina', 'Shaina', 'Triana'] },
];

const NEW_MONSTERS_SHOWCASE = [
  {
    name: 'Volcaris',
    thaiName: 'โวลคาริส',
    element: 'fire',
    elementName: 'ไฟ',
    elementIcon: '🔥',
    archetype: 'HP Bruiser',
    stars: 5,
    avatarUrl: '/images/monsters/volcaris.svg',
    cardBorder: 'border-rose-500/30 hover:border-rose-400/80',
    cardBg: 'from-rose-950/40 via-[#120a14] to-[#070b14]',
    ambientGlow: 'bg-rose-500/20',
    glowShadow: 'hover:shadow-[0_20px_40px_-10px_rgba(244,63,94,0.35)]',
    badgeColor: 'border-rose-500/50 bg-rose-950/60 text-rose-300',
    btnGradient: 'from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500',
  },
  {
    name: 'Maris',
    thaiName: 'มาริส',
    element: 'water',
    elementName: 'น้ำ',
    elementIcon: '💧',
    archetype: 'Stripper / Support',
    stars: 5,
    avatarUrl: '/images/monsters/maris.svg',
    cardBorder: 'border-sky-500/30 hover:border-sky-400/80',
    cardBg: 'from-sky-950/40 via-[#0a1420] to-[#070b14]',
    ambientGlow: 'bg-sky-500/20',
    glowShadow: 'hover:shadow-[0_20px_40px_-10px_rgba(56,189,248,0.35)]',
    badgeColor: 'border-sky-500/50 bg-sky-950/60 text-sky-300',
    btnGradient: 'from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500',
  },
  {
    name: 'Auraris',
    thaiName: 'ออราลิส',
    element: 'wind',
    elementName: 'ลม',
    elementIcon: '🌿',
    archetype: 'CC / Debuff Extender',
    stars: 5,
    avatarUrl: '/images/monsters/auraris.svg',
    cardBorder: 'border-emerald-500/30 hover:border-emerald-400/80',
    cardBg: 'from-emerald-950/40 via-[#0a1616] to-[#070b14]',
    ambientGlow: 'bg-emerald-500/20',
    glowShadow: 'hover:shadow-[0_20px_40px_-10px_rgba(52,211,153,0.35)]',
    badgeColor: 'border-emerald-500/50 bg-emerald-950/60 text-emerald-300',
    btnGradient: 'from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500',
  },
  {
    name: 'Luminaris',
    thaiName: 'ลูมินาริส',
    element: 'light',
    elementName: 'แสง',
    elementIcon: '✨',
    archetype: 'AOE Cleave Nuker',
    stars: 5,
    avatarUrl: '/images/monsters/luminaris.svg',
    cardBorder: 'border-amber-400/35 hover:border-amber-300/80',
    cardBg: 'from-amber-950/35 via-[#15120e] to-[#070b14]',
    ambientGlow: 'bg-amber-400/20',
    glowShadow: 'hover:shadow-[0_20px_40px_-10px_rgba(251,191,36,0.35)]',
    badgeColor: 'border-amber-400/50 bg-amber-950/60 text-amber-200',
    btnGradient: 'from-amber-500 to-yellow-500 text-slate-950 hover:from-amber-400 hover:to-yellow-400',
  },
  {
    name: 'Noctaris',
    thaiName: 'น็อคทาริส',
    element: 'dark',
    elementName: 'มืด',
    elementIcon: '🌑',
    archetype: 'Lockdown Bruiser',
    stars: 5,
    avatarUrl: '/images/monsters/noctaris.svg',
    cardBorder: 'border-purple-500/30 hover:border-purple-400/80',
    cardBg: 'from-purple-950/40 via-[#130b1c] to-[#070b14]',
    ambientGlow: 'bg-purple-500/20',
    glowShadow: 'hover:shadow-[0_20px_40px_-10px_rgba(168,85,247,0.35)]',
    badgeColor: 'border-purple-500/50 bg-purple-950/60 text-purple-300',
    btnGradient: 'from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500',
  },
];

const WHATS_NEW_ITEMS = [
  {
    id: 'events-quiz',
    isHero: true,
    badge: 'ใหม่ล่าสุด • มีเฉลย',
    badgeColor: 'amber',
    category: 'events',
    title: 'ศูนย์กิจกรรมทางการ & เฉลยคำถาม Com2uS',
    description: 'รวมทุกกิจกรรม active ในเกม เช็คของรางวัล (เลือก 5★ แท้ / คัมภีร์แสงมืด / เดวิลม่อน), มีระบบติ๊กติดตามรางวัลที่รับแล้ว และเฉลยข้อสอบกิจกรรม 15 ข้อ คัดลอกคำตอบใน 1 คลิก',
    icon: Calendar,
    colorGradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
    borderColor: 'border-amber-500/40',
    tags: ['#กิจกรรมทางการ', '#เฉลยคำถาม', '#นับถอยหลัง', '#ของรางวัล'],
    targetView: 'events',
    targetParams: {},
    primaryActionLabel: 'ดูรายการกิจกรรมทั้งหมด ➔',
  },
  {
    id: 'new-monsters-cosmic-worm',
    badge: '5★ แท้ใหม่ล่าสุด',
    badgeColor: 'purple',
    category: 'monsters',
    title: 'มอนสเตอร์ใหม่ 5★ แท้ [หนอนอวกาศ (Cosmic Worm)] ครบ 5 ธาตุ',
    description: 'เปิดตัว 5★ แท้ตระกูลใหม่ล่าสุด Volcaris (หนอนไฟ เลือดทะลุ 150k+), Maris (หนอนน้ำ ขโมยบัฟหมู่แจกทีม), Auraris (หนอนลม ยืดดีบัฟ), Luminaris (หนอนแสง คลีฟทะลุต้านตาย), Noctaris (หนอนมืด สตันห้ามล้างดีบัฟ)',
    icon: Sparkles,
    colorGradient: 'from-purple-500/20 via-pink-500/10 to-transparent',
    borderColor: 'border-purple-500/40',
    tags: ['#มอนสเตอร์ใหม่', '#CosmicWorm', '#หนอนอวกาศ', '#5ดาวแท้', '#วิเคราะห์สกิล'],
    targetView: 'catalog',
    targetParams: { search: 'Cosmic Worm' },
    primaryActionLabel: 'ส่องสกิลมอนใหม่ทั้งหมด ➔',
  },
  {
    id: 'balance-patch-94',
    badge: 'Patch v9.4.0',
    badgeColor: 'cyan',
    category: 'events',
    title: 'บันทึกแพตช์ 9.4.0 & วิเคราะห์สมดุลมอนสเตอร์',
    description: 'วิเคราะห์การปรับสมดุลล่าสุด Art Master, Beast Rider, Puppeteer พร้อมข้อมูลสกิลและสเตตัสฉบับภาษาไทย ตารางบัฟ/เนิร์ฟ และผลกระทบต่อเมต้า RTA S39',
    icon: BookOpen,
    colorGradient: 'from-cyan-500/15 via-blue-500/5 to-transparent',
    borderColor: 'border-cyan-500/30',
    tags: ['#Patch9.4', '#วิเคราะห์แพตช์', '#บัฟเนิร์ฟมอน'],
    targetView: 'balance',
    primaryActionLabel: 'อ่านบันทึกแพตช์ ➔',
  },
  {
    id: 'community-forum',
    badge: 'เว็บบอร์ดใหม่',
    badgeColor: 'cyan',
    category: 'community',
    title: 'เว็บบอร์ด & ชุมชนผู้เล่น (SWM Community Forum)',
    description: 'พูดคุย แลกเปลี่ยนยุทธวิธี RTA ซีซั่น 39, สูตรเจาะหอ Siege 3MDC, ปรึกษารูน และพื้นที่สำหรับกิลด์รับสมัครสมาชิก',
    icon: MessageSquare,
    colorGradient: 'from-cyan-500/15 via-blue-500/5 to-transparent',
    borderColor: 'border-cyan-500/30',
    tags: ['#เว็บบอร์ด', '#ชุมชนผู้เล่น', '#แลกเปลี่ยนทีม', '#กิลด์รับสมัคร'],
    targetView: 'community',
    primaryActionLabel: 'เข้าสู่เว็บบอร์ด ➔',
  },
  {
    id: 'live-farming',
    badge: 'ระบบสด SWEX',
    badgeColor: 'emerald',
    category: 'tools',
    title: 'ระบบตรวจจับการฟาร์มสด (Live Farming Monitor)',
    description: 'ต่อสายตรง SWEX ดักจับผลดรอปรูน/อาร์ติแฟกต์ดัน Cairos Abyss สดวินาทีต่อวินาที แนะนำ Keep/Sell ทันที พร้อมประเมิน Max Potential SPD (+30)',
    icon: Radio,
    colorGradient: 'from-emerald-500/15 via-teal-500/5 to-transparent',
    borderColor: 'border-emerald-500/30',
    tags: ['#ฟาร์มสด', '#AbyssDrops', '#KeepOrSell', '#SpeedQuad'],
    targetView: 'live-farm-monitor',
    primaryActionLabel: 'เปิดจอฟาร์มสด ➔',
  },
  {
    id: 'ai-account-audit',
    badge: 'AI วินิจฉัย',
    badgeColor: 'amber',
    category: 'tools',
    title: 'AI วินิจฉัยสุขภาพไอดี & คะแนน SW-Rating',
    description: 'วิเคราะห์คุณภาพรูนทั้งไอดี เทียบเกณฑ์สปีด Swift (+221), คุณภาพ Violent, เช็ค 30 มอนการ์เดียน และจัดลำดับดันเจี้ยนที่คุ้มฟาร์มที่สุด',
    icon: Sparkles,
    colorGradient: 'from-amber-500/15 via-yellow-500/5 to-transparent',
    borderColor: 'border-amber-500/30',
    tags: ['#SWRating', '#ตรวจไอดี', '#สปีดSwift221', '#RuneAudit'],
    targetView: 'ai-account-audit',
    primaryActionLabel: 'ตรวจสุขภาพไอดี ➔',
  },
  {
    id: 'siege-tournament-21',
    badge: 'Season 21',
    badgeColor: 'sky',
    category: 'meta',
    title: 'ศูนย์สงคราม Siege & ทัวร์นาเมนต์ Season 21',
    description: 'วิเคราะห์เมต้าตั้งรับฐาน 4★ / 5★, สายการแข่งทัวร์นาเมนต์ Season 21 ล่าสุด และคลังสูตรทีมแก้ทาง 3MDC กว่า 1,500+ สูตร',
    icon: Shield,
    colorGradient: 'from-sky-500/15 via-indigo-500/5 to-transparent',
    borderColor: 'border-sky-500/30',
    tags: ['#SiegeS21', '#3MDCCounter', '#ฐาน4ดาว', '#แชมป์กิลด์'],
    targetView: 'siege-battles',
    primaryActionLabel: 'เข้าศูนย์ Siege ➔',
  },
  {
    id: 'arena-meta',
    badge: 'เมต้า Arena',
    badgeColor: 'rose',
    category: 'meta',
    title: 'สูตรทีมบุก & ตั้งรับ Arena (AO / AD + Rush Hour)',
    description: 'รวมสูตรทีมบุกยอดนิยม (Cleave, Bomb, Bruiser) และสูตรตั้งรับ Rush Hour ต้าน 33% SPD Lead สถิติความเสถียรและเกณฑ์สปีดที่ต้องจูน',
    icon: Swords,
    colorGradient: 'from-rose-500/15 via-red-500/5 to-transparent',
    borderColor: 'border-rose-500/30',
    tags: ['#ArenaAO', '#RushHourAD', '#CleaveTeam', '#33SpdLead'],
    targetView: 'arena',
    primaryActionLabel: 'ดูสูตรทีม Arena ➔',
  },
  {
    id: 'active-promo-codes',
    badge: 'รับของฟรี',
    badgeColor: 'purple',
    category: 'rewards',
    title: 'โค้ดแจกไอเทมประจำเดือนล่าสุด (Active Promo Codes)',
    description: 'แจกคัมภีร์เวทมนตร์ คริสตัล และพลังงาน คัดลอกได้ทันทีใน 1-Click พร้อมลิงก์ตรงกรอกรับรางวัลในเกม ไม่พลาดทุกโค้ดทางการ',
    icon: Gift,
    colorGradient: 'from-purple-500/15 via-fuchsia-500/5 to-transparent',
    borderColor: 'border-purple-500/30',
    tags: ['#โค้ดเกม', '#คัมภีร์ฟรี', '#คริสตัล', '#ActiveCodes'],
    targetView: 'codes',
    primaryActionLabel: 'ดูโค้ดทั้งหมด ➔',
  },
  {
    id: 'pokedex-ld5',
    badge: 'ตู้สะสม',
    badgeColor: 'amber',
    category: 'rewards',
    title: 'ตู้สะสม Nat 5 & ทำเนียบ LD 5★ Pokedex',
    description: 'ตรวจสอบความครบของมอนสเตอร์ 5★ แท้ในไอดีของคุณ, ทำเนียบเกียรติยศ LD5 ที่เปิดได้จริง และบันทึกสปีดมอนสเตอร์ที่เร็วที่สุด',
    icon: Trophy,
    colorGradient: 'from-yellow-500/15 via-amber-500/5 to-transparent',
    borderColor: 'border-yellow-500/30',
    tags: ['#ตู้สะสมNat5', '#LD5Pokedex', '#สถิติไอดี'],
    targetView: 'my-box',
    targetParams: { tab: 'pokedex' },
    primaryActionLabel: 'เปิดดูตู้สะสม ➔',
  },
];

export default function DashboardView({ onNavigate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState(POPULAR_PRESETS[0]);
  const [selectedServer, setSelectedServer] = useState('asia');
  const [whatsNewCategory, setWhatsNewCategory] = useState('all');
  const [userBox, setUserBox] = useState(() => loadBox());
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [cardBusy, setCardBusy] = useState(false);
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

  const activeCodesLive = useLiveData('codes', PROMO_CODES, { pick: (doc) => (Array.isArray(doc?.codes) ? doc.codes : null) });
  const activeCodes = useMemo(() => {
    return activeCodesLive.data.filter((c) => c.status === 'active').slice(0, 4);
  }, [activeCodesLive.data]);
  const activeCodeCount = useMemo(() => activeCodesLive.data.filter((c) => c.status === 'active').length, [activeCodesLive.data]);

  const activeEventsCount = gameEventsData?.events?.length || 4;
  const activeQuizzesCount = gameEventsData?.quizQuestions?.length || 15;

  const filteredWhatsNewItems = useMemo(() => {
    return WHATS_NEW_ITEMS.filter((item) => {
      if (item.isHero) return false;
      if (whatsNewCategory === 'all') return true;
      return item.category === whatsNewCategory;
    });
  }, [whatsNewCategory]);

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

  const handleCopy = async (code) => {
    if (await copyText(code)) {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2500);
    }
  };

  // Questions go to the Summoners War coach; short names route to the player / monster pages
  const [aiPrompt, setAiPrompt] = useState(null); // { question, ts }
  const coachContext = (question) => {
    const ctx = { scope: 'general' };
    if (boxUnitList.length) {
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
      setAiPrompt({ question: query, ts: Date.now() });
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

  const [uploadError, setUploadError] = useState('');
  const handleQuickUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    try {
      setUploadingProfile(true);
      const text = await file.text();
      const parsed = parseSwexExport(JSON.parse(text));
      if (parsed.units && parsed.units.length > 0) {
        saveBox(parsed);
        setUserBox(parsed);
      } else {
        setUploadError('ไฟล์นี้ไม่มีข้อมูลมอนสเตอร์ — เลือกไฟล์ที่ export จาก SWEX (เมนู Profile)');
      }
    } catch (err) {
      console.error('Failed to parse uploaded SWEX file:', err);
      setUploadError('อ่านไฟล์ SWEX ไม่สำเร็จ — ตรวจว่าเป็นไฟล์ JSON ที่ export จาก SWEX (เมนู Profile)');
    } finally {
      setUploadingProfile(false);
      e.target.value = ''; // allow picking the same file again after fixing it
    }
  };

  // One adapter pass per box change; every stat below reads these, not userBox.units
  const boxUnitList = useMemo(() => boxUnits(userBox), [userBox]);
  const boxRuneList = useMemo(() => boxRunes(userBox), [userBox]);

  const userProfileStats = useMemo(() => {
    if (!userBox) return null;
    const units = boxUnitList;
    const totalUnits = units.length;
    const sixStarUnits = units.filter((u) => u.stars === 6).length;
    const fastestUnit = [...units].sort((a, b) => b.spd - a.spd)[0] || null;
    const fastestName = fastestUnit?.name || '';
    const artifacts = getArtifactsFromBox(userBox);

    // Nat 5 & LD5 counts (แยกตัวเปิดได้เอง vs ฟิวชั่น/แจกฟรี)
    let nat5Count = 0;
    let ld5Count = 0;
    let pureLd5Count = 0;
    let freeLd5Count = 0;
    const ld5List = [];
    let sumEff = 0;
    let countEff = 0;
    for (const u of units) {
      const ele = (u.element || '').toLowerCase();
      const isLd = ele === 'light' || ele === 'dark';
      const isNat5 = u.naturalStars === 5 && !u.info?.name?.includes('(Homunculus)');
      if (isNat5) {
        nat5Count++;
        if (isLd) {
          ld5Count++;
          if (isPureLd5(u)) {
            pureLd5Count++;
            ld5List.push({ masterId: u.masterId, name: u.name || 'LD 5★', thaiName: u.thaiName, element: ele, spd: u.spd, sets: u.sets, stars: u.stars, avatarUrl: u.avatarUrl });
          } else {
            freeLd5Count++;
          }
        }
      }
      if (u.runeEff) { sumEff += u.runeEff; countEff++; }
    }
    // No runes in the box → no average; the card and tile show "-" rather than a made-up figure
    const avgRuneEff = countEff > 0 ? (sumEff / countEff).toFixed(1) : null;
    const topFastest = [...units].sort((a, b) => b.spd - a.spd).slice(0, 4);
    // portraits for the share card: fastest monsters first, one entry per monster name
    const seenNames = new Set();
    const cardHeroes = [...units].sort((a, b) => b.spd - a.spd)
      .map((u) => ({ name: u.name, element: (u.element || '').toLowerCase(), spd: u.spd, sets: u.sets || [], avatarUrl: u.avatarUrl }))
      .filter((m) => m.name && !seenNames.has(m.name) && seenNames.add(m.name));

    // SPD substat as rolled (grinds not added) — the same number the passport shows per rune
    const quadSpdCount = boxRuneList.filter((r) => r.subs.some((sub) => sub.stat === 'SPD' && sub.value >= 20)).length;
    const speedRuneSets = topSpeedRunesBySet(userBox, 6);

    // Select active profile avatar:
    // 1. User's manually chosen avatar from localStorage
    // 2. Rep Monster from SWEX (wizard.repMonster)
    // 3. User's #1 LD 5★ (pureLd5)
    // 4. User's fastest monster (fastestUnit)
    // 5. First unit in box
    const asAvatar = (u) => (u ? { masterId: u.masterId, name: u.name, thaiName: u.thaiName, avatarUrl: u.avatarUrl, element: u.element, spd: u.spd, stars: u.stars || 6 } : null);
    const activeAvatar = customAvatar
      || (userBox.wizard?.repMonster?.name ? userBox.wizard.repMonster : null)
      || (ld5List.length > 0 ? ld5List[0] : null)
      || asAvatar(fastestUnit)
      || asAvatar(units[0]);

    const nat5Pct = NAT5_TOTAL ? ((nat5Count / NAT5_TOTAL) * 100).toFixed(1) : '0.0';

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
      nat5Total: NAT5_TOTAL,
      nat5Pct,
      ld5Count,
      pureLd5Count,
      cardHeroes,
      freeLd5Count,
      ld5List,
      quadSpdCount,
      speedRuneSets,
    };
  }, [userBox, boxUnitList, boxRuneList, customAvatar]);

  const availableAvatarUnits = useMemo(() => {
    if (!boxUnitList.length) return [];
    const q = avatarSearch.toLowerCase().trim();
    let list = boxUnitList;

    if (avatarTab === 'ld5') {
      list = list.filter(isPureLd5);
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
  }, [boxUnitList, avatarSearch, avatarTab]);

  return (
    <div className="space-y-8 max-w-[1780px] 2xl:max-w-[1880px] mx-auto pb-16 animate-in fade-in duration-300">
      
      {/* 1. HERO COMMAND SPOTLIGHT (2026 Esports Design) */}
      <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-[#0e1626] via-[#090e18] to-[#070b12] p-5 sm:p-10 shadow-2xl">
        {/* Ambient Glow Orbs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-4 sm:space-y-5">
          {/* Badge Chips & Latest Feature Announcement */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/10 backdrop-blur-md text-xs font-semibold text-slate-300 shadow-inner whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-mono font-bold">RTA S39</span>
              <span className="text-slate-400 hidden sm:inline">•</span>
              <span className="hidden sm:inline">ศูนย์ข้อมูลยุทธวิธี Summoners War ภาษาไทย</span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('catalog', { search: 'Cosmic Worm' })}
              className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 hover:border-purple-400/60 text-xs text-purple-200 transition-all cursor-pointer shadow-lg shadow-purple-500/10 backdrop-blur-md"
            >
              <span className="flex h-2 w-2 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
              <span className="px-1.5 py-0.2 rounded bg-purple-400 text-slate-950 font-black text-[10px] uppercase">NEW</span>
              <span>มอนใหม่ 5★ แท้ [หนอนอวกาศ (Cosmic Worm)] & บันทึกแพตช์ 9.4</span>
              <ChevronRight className="w-3.5 h-3.5 text-purple-300 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* High-Impact Headline */}
          <h1 className="text-2xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            คลังกลยุทธ์ & สถิติการแข่งขัน <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
              Summoners War Master
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            วิเคราะห์เมต้า RTA Season 39, สถิติผู้เล่นระดับโลก, ทีมแก้ทาง Siege 3MDC กว่า 1,500+ สูตร, และสารานุกรมมอนสเตอร์ 940 ตัว
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
                className="w-full bg-[#0d1422]/90 border border-white/15 focus:border-cyan-400 hover:border-white/25 rounded-xl sm:rounded-2xl pl-9 sm:pl-12 pr-28 sm:pr-[13rem] py-2.5 sm:py-4 text-xs sm:text-base text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition-all shadow-2xl backdrop-blur-xl"
              />
              <div className="absolute right-1.5 sm:right-2 flex items-center gap-1 sm:gap-1.5">
                <button
                  type="button"
                  onClick={(e) => handleSearchSubmit(e, true)}
                  title="ถามโค้ช AI (เฉพาะเรื่อง Summoners War)"
                  className="px-2 py-1.5 sm:px-3 sm:py-2.5 rounded-lg sm:rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-200 text-[11px] sm:text-sm font-bold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" /> ถาม AI
                </button>
                <button
                  type="submit"
                  className="px-2.5 py-1.5 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-[11px] sm:text-sm font-bold shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
                >
                  ค้นหา
                </button>
              </div>
            </div>

            {/* Quick Hot Suggestions - Clean & Essential */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-3 text-xs">
              <span className="text-slate-400 text-xs font-semibold">แนะนำค้นหา:</span>
              <button
                type="button"
                onClick={() => onNavigate('catalog', { search: 'Cosmic Worm' })}
                className="px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 hover:text-purple-200 font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                ✨ มอนใหม่ หนอนอวกาศ (5★)
              </button>
              <button
                type="button"
                onClick={() => onNavigate('events')}
                className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 hover:text-amber-200 font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                🎉 ศูนย์กิจกรรม & เฉลยคำถาม
              </button>
              <button
                type="button"
                onClick={() => onNavigate('3mdc')}
                className="px-3 py-1.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 hover:text-blue-200 font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                🛡️ ทีมแก้ทาง 3MDC
              </button>
              <button
                type="button"
                onClick={() => onNavigate('rta')}
                className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 hover:text-white font-medium transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                🏆 เมต้า RTA S39
              </button>
            </div>
          </form>

          {aiPrompt && (
            <div className="text-left mt-3 max-w-2xl mx-auto">
              <AiChatPanel
                initialQuestion={aiPrompt.question}
                questionTrigger={aiPrompt.ts}
                title="โค้ช AI — ตอบเฉพาะเรื่อง Summoners War"
                placeholder="ถามต่อได้เลย..."
                buildContext={(q) => coachContext(q)}
                suggestions={userBox?.units?.length ? ['มอนหลักในกล่องฉันคือตัวไหน', 'จัดทีม Siege ป้องกันจากกล่องฉัน', 'ตัวไหนควรรูนใหม่ก่อน'] : ['เมตา RTA Guardian ตอนนี้เป็นยังไง', 'จัดทีม GB12 สำหรับมือใหม่', 'Seara แก้ทางด้วยอะไร']}
              />
            </div>
          )}
        </div>
      </section>

      {/* 1.5 WHAT'S NEW & LATEST UPDATES HUB (ศูนย์รวมอัปเดต & ฟีเจอร์ใหม่ล่าสุด) */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#0c1527] via-[#09101d] to-[#070b14] p-4 sm:p-7 shadow-2xl">
        {/* Ambient Glow Orbs */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Row: Title & Subtitle */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-5 border-b border-white/[0.08]">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold">
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
              <span>อัปเดต & ฟีเจอร์ใหม่ล่าสุด</span>
              <span className="text-amber-400/60">•</span>
              <span className="text-[11px] font-mono text-amber-200">What's New</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>มีอะไรใหม่ในระบบบ้าง?</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-slate-300">
                {WHATS_NEW_ITEMS.length} อัปเดต
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              รวมทุกฟีเจอร์ มอนสเตอร์ใหม่ 5★ แท้ กิจกรรมพร้อมเฉลยข้อสอบ บันทึกแพตช์ 9.4 และเครื่องมือวิเคราะห์ไอดี
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('events')}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>ดูปฏิทินกิจกรรมทั้งหมด</span>
            <ChevronRight className="w-4 h-4 text-amber-400" />
          </button>
        </div>

        {/* Main Content Area */}
        <div className="relative z-10 pt-5 space-y-5">
          {/* 1. HERO SPOTLIGHT CARD: EVENTS & QUIZ SOLVER */}
          <div className="relative overflow-hidden rounded-2xl border border-amber-500/35 bg-gradient-to-r from-amber-950/40 via-purple-950/25 to-[#09101d] p-4 sm:p-6 shadow-xl hover:border-amber-400/50 transition-all">
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="space-y-2.5 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 uppercase tracking-wide flex items-center gap-1 shadow-sm">
                    <Sparkles className="w-3 h-3 text-slate-950 fill-slate-950" />
                    ไฮไลท์ใหม่ล่าสุด
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Com2uS Events Hub
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    💡 มีเฉลยคำถาม 15 ข้อ
                  </span>
                </div>

                <div>
                  <h3 className="text-base sm:text-xl font-black text-white flex items-center gap-2">
                    <span>🎉 ศูนย์รวมกิจกรรมในเกม & เฉลยคำถามกิจกรรม (Events & Quiz Solver)</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                    ติดตามกิจกรรมทางการทั้งหมด เช่น กิจกรรมเลือกซัมมอน 5★ แท้, รูนตำนาน 6★ สั่งได้, พร้อมระบบนับถอยหลัง, ติ๊กบันทึกของรางวัลที่รับแล้วในเครื่อง, และคลังเฉลยคำถามกิจกรรม 1-Click Copy ตอบถูกรับของรางวัลทันที!
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-amber-200 font-semibold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    {activeEventsCount} กิจกรรมกำลังดำเนินอยู่
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-purple-200 font-semibold flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
                    {activeQuizzesCount} เฉลยข้อสอบกิจกรรมพร้อมเหตุผล
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-emerald-200 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    บันทึกสถานะของรางวัลอัตโนมัติ
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onNavigate('events')}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-amber-500/20 transition-all cursor-pointer group"
                >
                  <span>ดูรายการกิจกรรม & ของรางวัล</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('events', { subItem: 'quiz' })}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 font-bold text-xs sm:text-sm transition-all cursor-pointer group"
                >
                  <HelpCircle className="w-4 h-4 text-purple-300" />
                  <span>เปิดดูเฉลยคำถาม (1-Click Copy)</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>

          {/* 1.6 DEDICATED NEW MONSTERS SHOWCASE: COSMIC WORM (หนอนอวกาศ 5★ แท้) */}
          <div className="relative overflow-hidden rounded-3xl border border-purple-500/25 bg-gradient-to-b from-[#0e1628]/90 via-[#0a101d]/90 to-[#070b14] p-5 sm:p-7 shadow-2xl backdrop-blur-xl">
            {/* Nebula ambient orbs */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header: Title and Quick Navigation */}
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-white/[0.08]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 text-slate-950 uppercase tracking-wider flex items-center gap-1 shadow-md">
                    <Sparkles className="w-3 h-3 text-slate-950 fill-slate-950" />
                    เปิดตัว 5★ แท้ใหม่ล่าสุด
                  </span>
                  <span className="text-xs text-purple-300/80 font-mono font-semibold">
                    Patch v9.4.0 • ตระกูลหนอนอวกาศ
                  </span>
                </div>
                <h3 className="text-lg sm:text-2xl font-black text-white flex items-center gap-2">
                  <span>🌌 หนอนอวกาศ (Cosmic Worm) ครบทั้ง 5 ธาตุ</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  คลิกที่การ์ดมอนสเตอร์เพื่อส่องสกิล สเตตัส และแนวทางใส่รูน 3D แบบเจาะลึกในคลิกเดียว
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('catalog', { search: 'Cosmic Worm' })}
                className="shrink-0 px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/35 border border-purple-500/40 text-purple-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-purple-950/40 self-start sm:self-center group"
              >
                <span>เปิดสารานุกรมมอนสเตอร์</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* 5-Monster 3D Holographic Card Showcase */}
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-6">
              {NEW_MONSTERS_SHOWCASE.map((mon) => (
                <div
                  key={mon.name}
                  onClick={() => onNavigate('catalog', { initialMonster: mon.name })}
                  className={`relative overflow-hidden rounded-2xl border ${mon.cardBorder} bg-gradient-to-b ${mon.cardBg} p-5 flex flex-col items-center text-center cursor-pointer group transition-all duration-300 ease-out hover:-translate-y-3 hover:scale-[1.02] shadow-xl ${mon.glowShadow} transform-gpu backdrop-blur-md`}
                >
                  {/* Radial Ambient Glow */}
                  <div className={`absolute -top-12 left-1/2 -translate-x-1/2 w-36 h-36 ${mon.ambientGlow} rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-all duration-500`} />

                  {/* 3D Monster Artwork Container (Large & Prominent) */}
                  <div className="relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-2xl p-1 bg-gradient-to-tr from-white/10 via-white/5 to-transparent border border-white/15 shadow-2xl group-hover:scale-110 group-hover:-translate-y-1.5 transition-all duration-300 ease-out flex items-center justify-center">
                    <img
                      src={mon.avatarUrl}
                      alt={mon.name}
                      className="w-full h-full object-cover rounded-xl drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]"
                      loading="lazy"
                    />
                    {/* Floating Element Badge */}
                    <span className={`absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full text-[11px] font-black border shadow-lg ${mon.badgeColor} flex items-center gap-1`}>
                      <span>{mon.elementIcon}</span>
                      <span>{mon.elementName}</span>
                    </span>
                  </div>

                  {/* Monster Identity */}
                  <div className="relative z-10 mt-5 space-y-1 w-full">
                    <div className="text-amber-400 text-xs font-mono tracking-widest drop-shadow-sm">
                      ★★★★★
                    </div>
                    <h4 className="font-black text-base sm:text-lg text-white group-hover:text-amber-300 transition-colors truncate">
                      {mon.thaiName}
                    </h4>
                    <p className="text-xs text-slate-400 font-medium">
                      {mon.name}
                    </p>
                  </div>

                  {/* Archetype Role Pill */}
                  <div className="relative z-10 mt-2.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${mon.badgeColor}`}>
                      {mon.archetype}
                    </span>
                  </div>

                  {/* Seamless 3D Action Prompt */}
                  <div className="relative z-10 mt-4 pt-3 border-t border-white/[0.08] w-full flex items-center justify-center gap-1.5 text-xs font-bold text-slate-300 group-hover:text-amber-300 transition-colors">
                    <span>ส่องสกิล & รูน</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. RESPONSIVE GRID OF OTHER NEW FEATURES (Compact, Sleek 3D Glass) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {WHATS_NEW_ITEMS.filter(it => !it.isHero).map((item) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => onNavigate(item.targetView, item.targetParams || {})}
                  className={`relative overflow-hidden rounded-2xl border ${item.borderColor} bg-gradient-to-b ${item.colorGradient} bg-[#090f1d]/85 p-4 flex flex-col justify-between hover:scale-[1.01] hover:border-white/30 transition-all cursor-pointer group shadow-md backdrop-blur-md`}
                >
                  <div className="space-y-2.5">
                    {/* Top Row: Icon & Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="p-2 rounded-xl bg-white/[0.06] border border-white/10 text-white group-hover:scale-110 transition-transform">
                        <IconComponent className="w-4 h-4 text-amber-300" />
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/[0.08] border border-white/15 text-slate-200">
                        {item.badge}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors leading-snug">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {item.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-[10px] font-mono text-slate-400 bg-white/[0.03] px-1.5 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Footer Action Link */}
                  <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-xs font-bold text-amber-300 group-hover:text-amber-200">
                    <span>{item.primaryActionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
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
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={cardBusy}
                  onClick={async () => {
                    if (cardBusy) return;
                    setCardBusy(true);
                    try {
                      await exportProfileCard({
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
                        speedRuneSets: userProfileStats.speedRuneSets || [],
                        box: userBox,
                      });
                    } catch (err) {
                      console.error('profile card export failed', err);
                    } finally {
                      setCardBusy(false);
                    }
                  }}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                  title="บันทึกรูป Passport Card เป็นไฟล์ PNG (มีหน้าต่างดูตัวอย่างก่อนดาวน์โหลด)"
                >
                  <Share2 className={cardBusy ? 'w-4 h-4 animate-pulse' : 'w-4 h-4'} />
                  <span>{cardBusy ? 'กำลังสร้างการ์ด...' : 'บันทึกการ์ดโปรไฟล์'}</span>
                </button>

                <button
                  type="button"
                  disabled={cardBusy}
                  onClick={async () => {
                    if (cardBusy) return;
                    setCardBusy(true);
                    try {
                      await exportAccountMilestoneCard({
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
                        speedRuneSets: userProfileStats.speedRuneSets || [],
                        box: userBox,
                      });
                    } catch (err) {
                      console.error('milestone card export failed', err);
                    } finally {
                      setCardBusy(false);
                    }
                  }}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
                  title="สร้างการ์ด Infographic สรุปไอดีแผ่นเดียว (สปีดสูงสุด + เรคคอร์ดดันเจี้ยน + เกรดไอดี) สำหรับแชร์ลงกลุ่ม"
                >
                  <Trophy className="w-4 h-4 text-slate-950" />
                  <span>การ์ดสรุปไอดี (Milestone)</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('ai-account-audit', { subItem: 'sw-rating' })}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white text-xs font-black shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
                  title="ดูคะแนนไอดีสไตล์ SW-Rating (Unit Score, Rune Score, Artifact Score, Expected Rank)"
                >
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>คะแนน SW-Rating</span>
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
                    {userProfileStats.nat5Count} <span className="text-xs text-slate-400 font-normal">/ {userProfileStats.nat5Total}</span>
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
                  <span>✨ {userProfileStats.pureLd5Count} ตัว LD เปิดเอง</span>
                  {userProfileStats.freeLd5Count > 0 && (
                    <span className="text-slate-400 font-normal">(+{userProfileStats.freeLd5Count} แจกฟรี)</span>
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
                    {userProfileStats.avgRuneEff ? `${userProfileStats.avgRuneEff}%` : '-'}
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

            {/* Bottom Row: Passport Quick Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[0.06]">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate('my-box')}
                  className="px-4 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
                >
                  <Package className="w-4 h-4 text-cyan-400" />
                  <span>เข้าสู่กล่อง My Box เต็มรูปแบบ (ดูรูน & อาร์ติแฟกต์) ➔</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('my-box', { tab: 'pokedex' })}
                  className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-300 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>ตู้สะสม Nat 5 & LD5</span>
                </button>
              </div>

              {/* Upload SWEX quick update button */}
              <label className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5">
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
            {uploadError && (
              <div role="alert" className="mt-2 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">
                {uploadError}
              </div>
            )}
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
                  นำเข้าไฟล์ SWEX JSON เพื่อแสดงโปรไฟล์ สถิติรูน ตู้สะสม Nat 5 & LD และอาร์ติแฟกต์ของคุณที่หน้าแรกทันที เชื่อมต่อข้อมูลจริงของคุณ 100%
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
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
            {uploadError && (
              <div role="alert" className="mt-2 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">
                {uploadError}
              </div>
            )}
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

      {/* 3. CORE TACTICAL 3D BENTO GRID (4 ESSENTIAL PILLARS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* PILLAR 1: 3MDC Siege Tactical Interceptor */}
        <section className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-b from-[#0e1628]/90 via-[#0a101d]/90 to-[#070b14] p-5 sm:p-6 shadow-xl hover:border-blue-500/40 transition-all duration-300 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">3MDC Siege Counter</h3>
                  <p className="text-xs text-slate-400">สูตรทีมเจาะฐานยอดนิยม 1,500+ สูตรจากสถิติจริง</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('3mdc')}
                className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
              >
                <span>ดูทั้งหมด</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Presets Picker */}
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_PRESETS.slice(0, 3).map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setSelectedPreset(preset)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    selectedPreset.label === preset.label
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] border border-white/[0.06]'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Defense Presentation with REAL Monster Avatars */}
            <div className="p-4 rounded-2xl bg-[#090e18] border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300">ทีมตั้งรับ (Defense):</span>
                <span className="font-mono text-emerald-400 font-bold">วินเรท {currentDefenseData?.counters?.[0]?.winRate || '98.5%'}</span>
              </div>
              
              <div className="flex items-center gap-3">
                {currentDefenseData?.defenseMonsters && currentDefenseData.defenseMonsters.length > 0 ? (
                  currentDefenseData.defenseMonsters.map((m, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <MonsterAvatar monster={m} size="sm" />
                      <span className="text-[11px] text-slate-300 font-bold truncate max-w-[72px] text-center">
                        {m.thaiName || m.name}
                      </span>
                    </div>
                  ))
                ) : (
                  selectedPreset.monsters.map((name, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <MonsterAvatar monster={name} size="sm" />
                      <span className="text-[11px] text-slate-300 font-bold truncate max-w-[72px] text-center">{name}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Recommended Counter */}
              <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    สูตรแนะนำ:
                  </span>
                  <div className="flex items-center gap-1.5">
                    {currentDefenseData?.counters?.[0]?.monsters?.map((cm, cIdx) => (
                      <MonsterAvatar key={cIdx} monster={cm} size="xs" />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-white truncate max-w-[140px]">
                    {currentDefenseData?.counters?.[0]?.title || currentDefenseData?.counters?.[0]?.monsters?.map(m => m.name).join(' + ') || 'ทีมเจาะทางสากล'}
                  </span>
                </div>
                <span className="text-emerald-400 font-mono font-black text-xs shrink-0">
                  {currentDefenseData?.counters?.[0]?.winRate || '98.5%'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('3mdc')}
            className="w-full py-2.5 rounded-xl bg-blue-600/90 hover:bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Shield className="w-4 h-4" />
            <span>เปิดค้นหาทีมแก้ทาง 3MDC เต็มรูปแบบ ➔</span>
          </button>
        </section>

        {/* PILLAR 2: World Arena (RTA) & Player Tracker */}
        <section className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-b from-[#14120e]/90 via-[#0d1017]/90 to-[#070b14] p-5 sm:p-6 shadow-xl hover:border-amber-500/40 transition-all duration-300 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">World Arena (RTA) S39</h3>
                  <p className="text-xs text-slate-400">สถิติผู้เล่นระดับโลกและทำเนียบ Guardian ไทย (Season 39)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('player-tracker')}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
              >
                <span>ค้นหาผู้เล่น</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Spotlight Cards: #1 World & #1 Thai Guardian */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* World #1 Card */}
              {topRtaPlayers[0] && (
                <div
                  onClick={() => onNavigate('player-tracker', { initialPlayer: topRtaPlayers[0].name })}
                  className="p-3.5 rounded-2xl bg-[#090e18] border border-amber-500/20 hover:border-amber-400/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-bold text-amber-300">🌍 อันดับ 1 โลก</span>
                    <span className="text-emerald-400 font-bold font-mono">{topRtaPlayers[0].winRate}% Win</span>
                  </div>
                  <div className="flex items-center gap-2.5 mt-2">
                    <img 
                      src={getR2AvatarUrl(topRtaPlayers[0].id, topRtaPlayers[0].profileAvatar)} 
                      alt={topRtaPlayers[0].name}
                      className="w-8 h-8 rounded-full object-cover border border-amber-400/40 bg-slate-800 shrink-0"
                      onError={(e) => {
                        e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(topRtaPlayers[0].name)}`;
                      }}
                    />
                    <div className="min-w-0">
                      <div className="font-black text-sm text-white group-hover:text-amber-300 transition-colors truncate">
                        {topRtaPlayers[0].name} {topRtaPlayers[0].flag}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {topRtaPlayers[0].score} pts • {topRtaPlayers[0].rankBadge || topRtaPlayers[0].rankTier}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Thai Guardian Card */}
              <div
                onClick={() => onNavigate('guardian')}
                className="p-3.5 rounded-2xl bg-[#090e18] border border-rose-500/20 hover:border-rose-400/40 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold text-rose-300">🇹🇭 Guardian ไทย</span>
                  <span className="text-slate-400 text-[11px]">{thaiGuardians ? `${thaiGuardians.total} คน` : 'พร้อมส่อง'}</span>
                </div>
                <div className="flex items-center gap-2.5 mt-2">
                  <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-xs font-bold text-rose-300 shrink-0">
                    G3
                  </div>
                  <div className="min-w-0">
                    <div className="font-black text-sm text-white group-hover:text-rose-300 transition-colors truncate">
                      {thaiGuardians?.players?.[0]?.n || 'สแกนรีเพลย์ล่าสุด'}
                    </div>
                    <div className="text-[11px] text-amber-300 font-mono">
                      {thaiGuardians?.players?.[0]?.s ? `${thaiGuardians.players[0].s.toLocaleString()} pts` : 'อันดับผู้เล่นไทย'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Followed Players if any */}
            {followedPlayers.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap text-xs pt-1">
                <span className="text-amber-300 font-semibold text-[11px]">⭐ ที่คุณติดตาม:</span>
                {followedPlayers.slice(0, 3).map((name) => (
                  <button key={name} type="button" onClick={() => onNavigate('player-tracker', { initialPlayer: name })} className="px-2 py-0.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 border border-amber-500/30 text-[11px] cursor-pointer">
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('player-tracker')}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>ค้นหาผู้เล่น RTA ➔</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('rta')}
              className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white font-bold text-xs transition-all cursor-pointer"
            >
              <span>สรุปเมต้า S39</span>
            </button>
          </div>
        </section>

        {/* PILLAR 3: ห้องซ้อมดราฟต์ 5v5 & จูนสปีด (Tactical Simulator) */}
        <section className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-b from-[#130d22]/90 via-[#0c0d18]/90 to-[#070b14] p-5 sm:p-6 shadow-xl hover:border-purple-500/40 transition-all duration-300 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                  <Swords className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">ห้องซ้อมดราฟต์ & สปีดแล็บ</h3>
                  <p className="text-xs text-slate-400">Pick & Ban AI Simulator และระบบจูนสปีด ATB Timeline</p>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Simulator
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => onNavigate('draft-explorer')}
                className="p-3.5 rounded-2xl bg-[#090e18] border border-white/[0.06] hover:border-purple-400/40 transition-all cursor-pointer group space-y-1"
              >
                <div className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors flex items-center justify-between">
                  <span>🔮 Draft Explorer 5v5</span>
                  <ArrowRight className="w-3.5 h-3.5 text-purple-400 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  จำลองการดราฟต์ RTA สากล พร้อมระบบ AI วิเคราะห์คอมโบ & ตัวแก้ทาง
                </p>
              </div>

              <div
                onClick={() => onNavigate('speed')}
                className="p-3.5 rounded-2xl bg-[#090e18] border border-white/[0.06] hover:border-cyan-400/40 transition-all cursor-pointer group space-y-1"
              >
                <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center justify-between">
                  <span>⚡ ATB Timeline Tuner</span>
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  จูนสปีด 4 ตัวแบบ 0-100% ATB ป้องกันการโดนแทรกเทิร์น 100%
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('draft-explorer')}
              className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/20 transition-all cursor-pointer"
            >
              <Swords className="w-4 h-4" />
              <span>เข้าห้องซ้อมดราฟต์ 5v5 ➔</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('artifact')}
              className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-cyan-300 hover:text-white font-bold text-xs transition-all cursor-pointer"
            >
              <span>ดาเมจเสริม</span>
            </button>
          </div>
        </section>

        {/* PILLAR 4: อันดับกิลด์ & ดันเจี้ยน Abyss Hard */}
        <section className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-[#0a1815]/90 via-[#0a1017]/90 to-[#070b14] p-5 sm:p-6 shadow-xl hover:border-emerald-500/40 transition-all duration-300 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">อันดับกิลด์ & PVE Abyss Hard</h3>
                  <p className="text-xs text-slate-400">คะแนนกิลด์ Siege / WGB และสูตรทีมสปีดรัน</p>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-[#090e18] p-0.5 rounded-xl border border-white/[0.06]">
                {SERVERS.slice(0, 2).map((srv) => (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => setSelectedServer(srv.id)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                      selectedServer === srv.id ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {srv.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Guild #1 Preview */}
              <div
                onClick={() => onNavigate('guardian')}
                className="p-3.5 rounded-2xl bg-[#090e18] border border-white/[0.06] hover:border-emerald-400/40 transition-all cursor-pointer group space-y-1"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-300">🏰 กิลด์ท็อป #{topGuilds[0]?.rank || 1}</span>
                  <span className="font-mono text-cyan-400 text-xs font-bold">{topGuilds[0]?.points?.toLocaleString() || '1,320'} pts</span>
                </div>
                <div className="font-black text-sm text-white group-hover:text-emerald-300 transition-colors truncate">
                  {topGuilds[0]?.name || 'เชื่อมต่อ AegisLink เพื่อดูอันดับ'}
                </div>
                <div className="text-[11px] text-slate-400">
                  {selectedServer === 'asia' ? 'Asia Server' : 'Global Server'}
                </div>
              </div>

              {/* Abyss Hard Speed Teams */}
              <div
                onClick={() => onNavigate('dungeons')}
                className="p-3.5 rounded-2xl bg-[#090e18] border border-white/[0.06] hover:border-emerald-400/40 transition-all cursor-pointer group space-y-1"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-300">⚡ Abyss Hard PVE</span>
                  <span className="text-emerald-400 font-mono text-[11px] font-bold">100% Win</span>
                </div>
                <div className="font-black text-sm text-white group-hover:text-emerald-300 transition-colors">
                  โกเลม • มังกร • เนโคร
                </div>
                <div className="text-[11px] text-slate-400">
                  สปีดรัน 30-40 วินาที ปลอดภัย ไม่หลุด
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('dungeons')}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Cpu className="w-4 h-4" />
              <span>ดูสูตรทีม Abyss Hard ➔</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('aegislink')}
              className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white font-bold text-xs transition-all cursor-pointer"
            >
              <span>AegisLink</span>
            </button>
          </div>
        </section>

      </div>

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
                  ทั้งหมด ({boxUnitList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarTab('ld5')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 cursor-pointer ${
                    avatarTab === 'ld5' ? 'bg-purple-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                  title="แสดงเฉพาะมอนสเตอร์แสง-มืด 5 ดาวแท้ที่เปิดได้เอง (ซ่อนตัวฟิวชั่นและตัวแจกฟรี)"
                >
                  ✨ LD 5★ เปิดเอง ({userProfileStats?.pureLd5Count || 0})
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
