import React, { useState, useMemo } from 'react';
import { Search, Lock, X, Sparkles, Trophy, Check, Crown, Eye, EyeOff, Share2 } from 'lucide-react';
import MonsterAvatar from '../../components/MonsterAvatar';
import allMonstersData from '../../data/allMonsters.json';
import { baseAwakenedId, isNonSummonableLd5 } from '../../utils/swexImport';
import { exportLdShowcaseCard } from '../../utils/cardExporter';
import { monsterOf, monsterByName, ELEMENT_FILTERS, ELEMENT_COLOR, ELEMENT_TH, card } from './shared';
import swrtTierList from '../../data/swrtTierList.json';
import { useLiveData } from '../../hooks/useLiveData';

// The hall of fame's tier and rates come from the current RTA tier list (live, bundled as fallback), not from opinion
const indexTierList = (doc) => ({
  season: doc?.season,
  byId: new Map(Object.entries(doc?.tiers || {}).flatMap(([tier, list]) => (list || []).map((m) => [Number(m.monsterId), { tier, winRate: m.winRate, pickTotal: m.pickTotal }]))),
});
const TOP_TIERS = new Set(['SS', 'S']);

// ---------------------------------------------------------------------------
// 2. Pokedex & Missing Nat 5 / LD 5★ Showcase (ตู้สะสม Nat 5 & ทำเนียบ LD 5★)
// ---------------------------------------------------------------------------

const TOP_LD5_HALL_OF_FAME = [
  { name: 'Tian Lang', com2usId: '21214', element: 'light', role: 'ตัวตัดเทิร์นขัดจังหวะยอดฮิต & สตริปสตันหมู่' },
  { name: 'Giana', com2usId: '15715', element: 'dark', role: 'สตริปหมู่ติดสตัน 100% & ปาระเบิดพิฆาต' },
  { name: 'Nephthys', com2usId: '20515', element: 'dark', role: 'ลดเกจ + ใบ้ + เจาะเกราะหมู่ทะลุต้านทาน 100%' },
  { name: 'Lucifer', com2usId: '23114', element: 'light', role: 'ดึงเกจทั้งทีมทันทีเมื่อมีดาเมจเกินเกณฑ์ (Cleave Engine)' },
  { name: 'Ragdoll', com2usId: '16615', element: 'dark', role: 'ดึงเกจเพื่อนทั้งทีมทุกครั้งที่โดนคริติคอล' },
  { name: 'Maximilian', com2usId: '25715', element: 'dark', role: 'ดาเมจคลีฟสุดโหด + สโลว์ + ลดเกจ + เจาะเกราะ' },
  { name: 'Veronica', com2usId: '26114', element: 'light', role: 'สปีดลีดเดอร์ + ดึงคูลดาวน์ + ปลดบัฟ + ตอดดาเมจ' },
  { name: 'Julianne', com2usId: '14714', element: 'light', role: 'อมตะดูดเลือดเพื่อน + วันช็อตเป้าเดี่ยวสตัน' },
  { name: 'Shan', com2usId: '14614', element: 'light', role: 'สปีดลีดเดอร์ + สปีดบัฟ + บูสต์เกจ + สตันหมู่' },
  { name: 'Han', com2usId: '13515', element: 'dark', role: 'สปีดลีดเดอร์ + สตันเดี่ยว 100% วนเทิร์นไม่หยุด' },
  { name: 'Asima', com2usId: '17914', element: 'light', role: 'เจาะเกราะหมู่ + แปะพิษไม่สนต้านทาน + ตอดดาเมจหนัก' },
  { name: 'Zerath', com2usId: '14414', element: 'light', role: 'ดาเมจคลีฟหมู่มหาศาลตาม % เลือดสูงสุด' },
  { name: 'Kiki', com2usId: '25215', element: 'dark', role: 'แพสซีฟกระจายดีบัฟทุกเทิร์น & ดูดเกจศัตรู' },
  { name: 'Lora', com2usId: '16114', element: 'light', role: 'สปีดลีด + สตริปหมู่ + เพิ่มบัฟป้องกัน + สโลว์' },
  { name: 'Destiny', com2usId: '26115', element: 'dark', role: 'เจาะเกราะทะลุการป้องกัน 100% สังหารเป้าหมายเดี่ยว' },
  { name: 'Wedjat', com2usId: '17014', element: 'light', role: 'สปีดลีด RTA + บูสต์เกจ + บัฟเกราะป้องกันตามสปีด' },
  { name: 'Craig / M. BISON', com2usId: '24714', element: 'light', role: 'สละเลือด 50% บูสต์เกจเต็ม + เพิ่มพลังโจมตีคลีฟ' },
  { name: 'Gurkha / M. BISON', com2usId: '24715', element: 'dark', role: 'ยั่วยุเคาน์เตอร์ไม่รู้จบ + ฟื้นเลือดเมื่อโดนตี' },
  { name: 'Talisman / RYU', com2usId: '24514', element: 'light', role: 'สกัดกั้นดาเมจ + หมัดระเบิดหมู่ทะลุต้านทาน' },
  { name: 'Vancliffe / RYU', com2usId: '24515', element: 'dark', role: 'ยืดระยะเวลาดีบัฟ + สตริปหมู่สตันสุดกวน' },
  { name: 'Cadiz', com2usId: '14715', element: 'dark', role: 'แจกดีบัฟ 4 ชนิด + ดึงเกจทั้งทีมทุกการโจมตี' },
  { name: 'Vivachel', com2usId: '19315', element: 'dark', role: 'สลับหลอดเลือด & สลับเกจโจมตีฉับพลัน' },
  { name: 'Eleanor', com2usId: '21514', element: 'light', role: 'ลดอัตราคริติคอลของศัตรูทั้งทีม + ปลดดีบัฟ' },
  { name: 'Alexandra', com2usId: '21515', element: 'dark', role: 'สะท้อนดาเมจ 30% + กางโล่หนา + สตริปตอดเลือดยับ' },
  { name: 'Yeonhwa', com2usId: '23914', element: 'light', role: 'บรรเลงเพลงตัดเกจ & สตริปทุกครั้งที่ศัตรูออกเทิร์น' },
  { name: 'Sylvia', com2usId: '19015', element: 'dark', role: 'สปีดลีดเดอร์กิลด์ + ดึงเพื่อนรุมตีฟรีทุกเทิร์น' },
  { name: 'Pater', com2usId: '22315', element: 'dark', role: 'แปลงร่างล้างดีบัฟทั้งทีมทันทีเมื่อเพื่อนโดน CC' },
  { name: 'Valantis', com2usId: '22314', element: 'light', role: 'สตริปหมู่ติดสตัน Despair + ชุบชีวิตตัวเอง' },
  { name: 'Woonsa', com2usId: '18615', element: 'dark', role: 'เบสสปีดสูงปรี๊ด 118 สตริปหมู่ + ขโมยบัฟเป็นโล่' },
  { name: 'Narsha', com2usId: '23414', element: 'light', role: 'ขโมยสปีด + เจาะเกราะวนเทิร์นเดี่ยวรัวๆ' },
  { name: 'Xiana', com2usId: '23415', element: 'dark', role: 'ใบ้หมู่ + ลดเกจ 100% + ปิดผนึกสกิลศัตรู' },
  { name: 'Shun', com2usId: '26414', element: 'light', role: 'ผูกเงาส่งผ่านดาเมจ + กำจัดเป้าหมายทันที' },
  { name: 'Ritsu', com2usId: '26415', element: 'dark', role: 'ขังศัตรูในมิติเงา 1v1 ปิดการช่วยเพื่อนทั้งทีม' },
  { name: 'Dorothy', com2usId: '25414', element: 'light', role: 'ทำลายเลือดสูงสุดศัตรู + ระเบิดดาเมจหมู่กวาดล้าง' },
  { name: 'Thebae', com2usId: '18215', element: 'dark', role: 'แปะตรา Brand หมู่ + ดาเมจทะลุเกราะตาม HP' },
  { name: 'Celia', com2usId: '19314', element: 'light', role: 'แพสซีฟสตริปบัฟศัตรู + หลับทุกเทิร์น' },
  { name: 'Artamiel', com2usId: '13914', element: 'light', role: 'ฮีโร่สัญลักษณ์เกม สวนกลับเมื่อศัตรูคริ + สตริปบัฟ' },
  { name: 'Fermion', com2usId: '13915', element: 'dark', role: 'แทงก์ถึกทนดาเมจเพิ่มขึ้นตามเพื่อนที่ตาย + ยั่วยุ' },
  { name: 'Nicki', com2usId: '16115', element: 'dark', role: 'ล้างดีบัฟทั้งทีม + บัฟดาเมจ 3 เทิร์น + ฮีลแรง' },
  { name: 'Pontos', com2usId: '20414', element: 'light', role: 'สปีดลีด 24% + อมตะและกันดีบัฟทั้งทีม 3 เทิร์น' },
];

export default function PokedexCollection({ box, onNavigate, onLoadDemo }) {
  const tierList = useLiveData('rta-tierlist', swrtTierList);
  const { season: RTA_SEASON, byId: RTA_BY_ID } = useMemo(() => indexTierList(tierList.data), [tierList.data]);
  const [cardBusy, setCardBusy] = useState(false);
  const [eleFilter, setEleFilter] = useState('all');
  const [ownershipFilter, setOwnershipFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState('element');
  const [hofFilter, setHofFilter] = useState('all');

  const units = useMemo(() => box?.units || [], [box]);

  // Robust ID & Name Matching Set
  const ownedSet = useMemo(() => {
    const set = new Set();
    units.forEach((u) => {
      const mId = Number(u.masterId);
      if (mId) {
        set.add(mId);
        set.add(String(mId));
        const baseId = baseAwakenedId(mId);
        set.add(baseId);
        set.add(String(baseId));
        set.add(`m-${mId}`);
        set.add(`m-${baseId}`);
      }
      if (u.name) set.add(u.name.toLowerCase().trim());
      const info = monsterOf(u.masterId) || monsterOf(baseAwakenedId(u.masterId));
      if (info?.name) set.add(info.name.toLowerCase().trim());
      if (info?.com2usId) {
        set.add(Number(info.com2usId));
        set.add(String(info.com2usId));
        set.add(`m-${info.com2usId}`);
      }
    });
    return set;
  }, [units]);

  const checkIsOwned = useMemo(() => {
    return (m) => {
      if (!box || !units.length) return false;
      const num = Number(m.com2usId || String(m.id || '').replace(/\D/g, ''));
      if (num && (ownedSet.has(num) || ownedSet.has(String(num)) || ownedSet.has(`m-${num}`))) return true;
      if (m.id && ownedSet.has(m.id)) return true;
      if (m.name && ownedSet.has(m.name.toLowerCase().trim())) return true;
      return false;
    };
  }, [box, units.length, ownedSet]);

  // Extract all Nat 5 monsters in catalog
  const nat5Catalog = useMemo(() => {
    const map = new Map();
    for (const m of allMonstersData) {
      const isNat5 = m.natural_stars === 5 || m.default_stars === 5 || m.stars === 5;
      if (isNat5 && m.name && !m.name.includes('(Homunculus)')) {
        const key = m.name.toLowerCase();
        if (!map.has(key)) map.set(key, m);
      }
    }
    return Array.from(map.values());
  }, []);

  // Option to hide non-summonable LDs (Veromos, Jeanne, Elsharion, Eirgar, Altair, Homunculus)
  const [hideNonSummonLd, setHideNonSummonLd] = useState(() => {
    try {
      const saved = localStorage.getItem('swm:hide-non-summon-ld');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const toggleHideNonSummonLd = () => {
    setHideNonSummonLd((prev) => {
      const next = !prev;
      try { localStorage.setItem('swm:hide-non-summon-ld', String(next)); } catch {}
      return next;
    });
  };

  // Owned Natural 5★ Light/Dark monsters with rich data
  const ownedLd5s = useMemo(() => {
    return units
      .map((u) => {
        const info = monsterOf(u.masterId) || monsterOf(baseAwakenedId(u.masterId)) || monsterByName(u.name);
        const ele = (u.element || info?.element || '').toLowerCase();
        const isLd = ele === 'light' || ele === 'dark';
        const isNat5 = (info?.stars === 5 || info?.natural_stars === 5 || u.naturalStars === 5) && !info?.name?.includes('(Homunculus)');
        if (isLd && isNat5) {
          const isNonSummon = isNonSummonableLd5(u) || (info && isNonSummonableLd5(info));
          return {
            ...u,
            name: info?.name || u.name || 'Unknown',
            thaiName: info?.thaiName || u.thaiName || '',
            avatarUrl: info?.avatarUrl || info?.imageUrl || u.avatarUrl || '',
            element: ele,
            isNonSummon,
            info,
          };
        }
        return null;
      })
      .filter(Boolean);
  }, [units]);

  const pureOwnedLd5s = useMemo(() => ownedLd5s.filter((u) => !u.isNonSummon), [ownedLd5s]);
  const freeOwnedLd5s = useMemo(() => ownedLd5s.filter((u) => u.isNonSummon), [ownedLd5s]);
  const displayedLd5s = hideNonSummonLd ? pureOwnedLd5s : ownedLd5s;

  // The shelf opens on the owned LD5s whenever the box has any; the user can still switch to the hall of fame
  const [shelfChoice, setShelfChoice] = useState(null);
  const [shelfBox, setShelfBox] = useState(box);
  if (shelfBox !== box) { setShelfBox(box); setShelfChoice(null); }
  const ldShelfTab = shelfChoice || (displayedLd5s.length > 0 ? 'owned' : 'hall-of-fame');
  const setLdShelfTab = setShelfChoice;

  // Active catalog respecting hideNonSummonLd
  const activeCatalog = useMemo(() => {
    if (!hideNonSummonLd) return nat5Catalog;
    return nat5Catalog.filter((m) => !isNonSummonableLd5(m));
  }, [nat5Catalog, hideNonSummonLd]);

  // Breakdown by element
  const statsByElement = useMemo(() => {
    const counts = {
      water: { owned: 0, total: 0 },
      fire: { owned: 0, total: 0 },
      wind: { owned: 0, total: 0 },
      light: { owned: 0, total: 0 },
      dark: { owned: 0, total: 0 },
    };

    for (const m of activeCatalog) {
      const ele = (m.element || 'fire').toLowerCase();
      if (counts[ele]) {
        counts[ele].total++;
        if (checkIsOwned(m)) {
          counts[ele].owned++;
        }
      }
    }
    return counts;
  }, [activeCatalog, checkIsOwned]);

  const totalOwned = useMemo(() => {
    return Object.values(statsByElement).reduce((s, c) => s + c.owned, 0);
  }, [statsByElement]);
  const totalNat5 = activeCatalog.length;
  const overallPct = totalNat5 > 0 ? Math.round((totalOwned / totalNat5) * 100) : 0;

  // Hall of Fame monsters with ownership matching
  const hallOfFameMonsters = useMemo(() => {
    return TOP_LD5_HALL_OF_FAME.map((entry) => {
      const num = Number(entry.com2usId);
      const catalogMonster = monsterOf(num) || monsterByName(entry.name) || allMonstersData.find((m) => m.name.toLowerCase() === entry.name.toLowerCase());
      const isOwned = checkIsOwned(entry) || (catalogMonster && checkIsOwned(catalogMonster));
      const ownedUnit = isOwned
        ? units.find((u) => u.masterId === num || baseAwakenedId(u.masterId) === num || u.name?.toLowerCase() === entry.name.toLowerCase())
        : null;
      const rta = RTA_BY_ID.get(num) || (catalogMonster ? RTA_BY_ID.get(Number(catalogMonster.com2usId)) : null) || null;
      return {
        ...entry,
        tier: rta?.tier || null,
        rta,
        monster: catalogMonster,
        isOwned,
        ownedUnit,
      };
    });
  }, [checkIsOwned, units, RTA_BY_ID]);

  const filteredHof = useMemo(() => {
    return hallOfFameMonsters.filter((item) => {
      if (hofFilter === 'top' && !TOP_TIERS.has(item.tier)) return false;
      if (hofFilter === 'light' && item.element !== 'light') return false;
      if (hofFilter === 'dark' && item.element !== 'dark') return false;
      if (hofFilter === 'owned' && !item.isOwned) return false;
      return true;
    });
  }, [hallOfFameMonsters, hofFilter]);

  // Catalog filtered and sorted
  const filteredMonsters = useMemo(() => {
    let list = activeCatalog.filter((m) => {
      // Element filter
      if (eleFilter !== 'all' && (m.element || '').toLowerCase() !== eleFilter) return false;

      // Ownership filter
      const isOwned = checkIsOwned(m);
      if (ownershipFilter === 'owned' && !isOwned) return false;
      if (ownershipFilter === 'missing' && isOwned) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = m.name?.toLowerCase().includes(q);
        const matchThai = m.thaiName?.toLowerCase().includes(q);
        const matchFamily = m.family?.toLowerCase().includes(q) || m.thaiFamily?.toLowerCase().includes(q);
        if (!matchName && !matchThai && !matchFamily) return false;
      }

      return true;
    });

    if (sortMode === 'name') {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortMode === 'owned-first') {
      list.sort((a, b) => {
        const ownA = checkIsOwned(a) ? 1 : 0;
        const ownB = checkIsOwned(b) ? 1 : 0;
        return ownB - ownA || (a.name || '').localeCompare(b.name || '');
      });
    } else {
      const eleOrder = { water: 1, fire: 2, wind: 3, light: 4, dark: 5 };
      list.sort((a, b) => {
        const oA = eleOrder[(a.element || '').toLowerCase()] || 9;
        const oB = eleOrder[(b.element || '').toLowerCase()] || 9;
        return oA - oB || (a.name || '').localeCompare(b.name || '');
      });
    }

    return list;
  }, [activeCatalog, eleFilter, ownershipFilter, searchQuery, sortMode, checkIsOwned]);

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & COMPLETION BANNER */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-[#0d1627] via-[#090e18] to-[#120f24] p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 shrink-0 shadow-lg shadow-amber-500/10">
              <Trophy className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                  Summoners War Pokedex & Showcase
                </span>
                {box?.isDemo && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Guardian Demo Account
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                ตู้สะสม Nat 5 & ทำเนียบ LD 5★
              </h2>
              <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                เช็คความคืบหน้า 5 ดาวแท้ทั้งหมดในสารานุกรม พร้อมตู้โชว์มอนสเตอร์แสง-มืด และสถิติการครอบครองในไอดีของคุณ
              </p>
            </div>
          </div>

          {/* Quick Progress Indicator */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <div className="px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/5 text-center sm:text-right">
              <div className="text-[11px] text-slate-400 font-medium">ความคืบหน้า 5 ดาวแท้ทั้งหมด</div>
              <div className="text-xl font-black text-amber-300 mt-0.5 font-mono">
                {totalOwned} <span className="text-xs text-slate-400">/ {totalNat5} ตัว</span>
                <span className="ml-2 text-sm px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  {overallPct}%
                </span>
              </div>
              <div className="w-full sm:w-48 bg-white/10 rounded-full h-1.5 mt-2 overflow-hidden mx-auto sm:ml-auto">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 transition-all duration-500"
                  style={{ width: `${overallPct}%` }}
                />
              </div>
            </div>

            {(!box || !box.units?.length) && onLoadDemo && (
              <button
                onClick={onLoadDemo}
                className="px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>โหลดไอดีตัวอย่าง Guardian</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. DUAL-MODE LD 5★ TROPHY CABINET (ตู้เกียรติยศแสง-มืด) */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-b from-[#140e26] via-[#090d16] to-[#070b12] p-5 sm:p-7 shadow-2xl backdrop-blur-xl">
        {/* Ambient Rarity Glow */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-yellow-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-5">
          {/* Header & Mode Switcher */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-yellow-500/20 to-purple-500/20 border border-yellow-500/40 text-yellow-300 shadow shrink-0">
                <Crown className="w-6 h-6 text-yellow-300" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2 flex-wrap">
                  <span>ตู้ LD 5★ (แสง-มืดแท้ที่เปิดได้เอง)</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 text-xs font-bold border border-yellow-500/30 font-mono">
                    {displayedLd5s.length} ตัวในไอดี
                  </span>
                  {hideNonSummonLd && freeOwnedLd5s.length > 0 && (
                    <span className="text-[11px] text-slate-400 font-normal">
                      (ซ่อนตัวฟิวชั่น/แจกฟรี {freeOwnedLd5s.length} ตัว: {freeOwnedLd5s.map((u) => u.name).join(', ')})
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  มอนสเตอร์ระดับสมบัติล้ำค่าที่สุดในเกม Summoners War
                </p>
              </div>
            </div>

            {/* Controls: Hide Filter Toggle + Mode Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Export LD5 Showcase Card PNG */}
              <button
                onClick={async () => {
                  if (cardBusy) return;
                  setCardBusy(true);
                  try {
                    await exportLdShowcaseCard({ wizardName: box?.wizard?.name || 'Summoner', ld5List: displayedLd5s });
                  } catch (err) {
                    console.error('LD showcase card export failed', err);
                  } finally {
                    setCardBusy(false);
                  }
                }}
                disabled={cardBusy}
                className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/20 disabled:opacity-50 disabled:cursor-wait"
                title="บันทึกรูปการ์ดตู้สะสม LD 5★ เป็นไฟล์ PNG สำหรับแชร์โซเชียล"
              >
                <Share2 className={cardBusy ? 'w-3.5 h-3.5 animate-pulse' : 'w-3.5 h-3.5'} />
                <span>{cardBusy ? 'กำลังสร้างรูป...' : 'บันทึกรูปตู้สะสม LD (PNG)'}</span>
              </button>

              {/* Toggle to Hide Non-Summonable LDs */}
              <button
                onClick={toggleHideNonSummonLd}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                  hideNonSummonLd
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25 shadow-sm'
                    : 'bg-white/[0.04] text-slate-400 border-white/10 hover:text-white'
                }`}
                title="ซ่อนมอนสเตอร์แสง-มืดที่ไม่ได้เปิดได้เองจากคัมภีร์ เช่น ตัวผสม/ฟิวชั่น (Veromos, Jeanne), ตัวแจกกิจกรรม (Ryomen Sukuna, Gapsoo, Altaïr), เหรียญโบราณ (Elsharion, Eirgar), และโฮมุนครุส"
              >
                {hideNonSummonLd ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{hideNonSummonLd ? 'ซ่อนแสงมืดที่ไม่ได้เปิดได้เอง' : 'แสดงแสงมืดทั้งหมด (รวมฟิวชั่น/ตัวแจก)'}</span>
                {freeOwnedLd5s.length > 0 && hideNonSummonLd && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono">
                    -{freeOwnedLd5s.length}
                  </span>
                )}
              </button>

              {/* Mode Toggle Buttons */}
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.04] border border-white/10 self-start sm:self-auto">
                <button
                  onClick={() => setLdShelfTab('owned')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    ldShelfTab === 'owned'
                      ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  <span>มอนสเตอร์ในไอดีของฉัน ({displayedLd5s.length})</span>
                </button>
                <button
                  onClick={() => setLdShelfTab('hall-of-fame')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    ldShelfTab === 'hall-of-fame'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Crown className="w-3.5 h-3.5 text-purple-300" />
                  <span>ทำเนียบ LD 5★ ยอดนิยม 40 ตัว</span>
                </button>
              </div>
            </div>
          </div>

          {/* VIEW A: OWNED LD 5★ TROPHY SHELF */}
          {ldShelfTab === 'owned' && (
            <div>
              {displayedLd5s.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
                  {displayedLd5s.map((u, idx) => {
                    const isLight = u.element === 'light';
                    return (
                      <div
                        key={idx}
                        onClick={() => onNavigate('where2use', { initialMonster: u.name })}
                        className={`relative group p-4 rounded-2xl border transition-all cursor-pointer hover:scale-[1.02] shadow-xl ${
                          u.isNonSummon
                            ? 'border-slate-600/40 bg-gradient-to-b from-slate-900/60 via-[#0a0f19] to-black shadow-slate-500/10 hover:border-slate-400'
                            : isLight
                            ? 'border-yellow-400/40 bg-gradient-to-b from-yellow-950/30 via-[#0a0f19] to-black shadow-yellow-500/10 hover:border-yellow-400/70'
                            : 'border-purple-500/40 bg-gradient-to-b from-purple-950/30 via-[#0a0f19] to-black shadow-purple-500/10 hover:border-purple-400/70'
                        }`}
                      >
                        {/* Pedestal Top Accent */}
                        <div className="flex items-center justify-between mb-3">
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                              u.isNonSummon
                                ? 'bg-slate-500/20 text-slate-300 border-slate-500/40'
                                : isLight
                                ? 'bg-yellow-400/20 text-yellow-200 border-yellow-400/40'
                                : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                            }`}
                          >
                            {u.isNonSummon ? '🔨 ผสม / แจกฟรี' : isLight ? '☀️ Light 5★ (Gacha)' : '🌙 Dark 5★ (Gacha)'}
                          </span>
                          <span className="text-[11px] font-mono font-bold text-amber-300">
                            +{u.spd - u.baseSpd} SPD
                          </span>
                        </div>

                        {/* Centered Avatar */}
                        <div className="flex flex-col items-center text-center gap-2">
                          <div className="relative">
                            <MonsterAvatar
                              monster={u.info || u}
                              size={68}
                              className={`rounded-2xl border-2 shadow-2xl ${
                                u.isNonSummon
                                  ? 'border-slate-500/60'
                                  : isLight
                                  ? 'border-yellow-400/60'
                                  : 'border-purple-400/60'
                              }`}
                            />
                            <span className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-emerald-500 text-white shadow">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          </div>

                          <div>
                            <div className="text-sm font-black text-white group-hover:text-amber-300 transition-colors">
                              {u.name}
                            </div>
                            {u.thaiName && u.thaiName !== u.name && (
                              <div className="text-[11px] text-slate-400">{u.thaiName}</div>
                            )}
                          </div>

                          {/* Quick Stats Badges */}
                          <div className="w-full pt-2 mt-1 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-slate-300">
                            <span className="font-semibold text-slate-400">
                              {u.sets && u.sets.length > 0 ? u.sets.join(' / ') : 'ยังไม่ใส่เซ็ต'}
                            </span>
                            {u.runeEff > 0 && (
                              <span className="font-mono text-emerald-400 font-bold">
                                {u.runeEff}% Eff
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : hideNonSummonLd && freeOwnedLd5s.length > 0 ? (
                /* Empty state when user only has non-summonable LDs and has hidden them */
                <div className="py-10 sm:py-14 text-center space-y-4 rounded-2xl bg-white/[0.02] border border-white/5 p-6">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Trophy className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-white">
                      ยังไม่พบมอนสเตอร์แสง-มืด 5 ดาวแท้ (เปิดได้เองจากคัมภีร์) ในไอดีนี้
                    </h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      ขณะนี้เปิดโหมด <span className="text-amber-300 font-semibold">"ซ่อนแสงมืดที่ไม่ได้เปิดได้เอง"</span> อยู่ โดยไอดีของคุณมีมอนสเตอร์ LD 5★ จากฟิวชั่น/แจกฟรี <span className="text-white font-bold">{freeOwnedLd5s.length} ตัว</span> ({freeOwnedLd5s.map((u) => u.name).join(', ')})
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <button
                      onClick={toggleHideNonSummonLd}
                      className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Eye className="w-4 h-4 text-amber-300" />
                      <span>คลิกเพื่อแสดงตัวฟิวชั่น/แจกฟรี ({freeOwnedLd5s.length} ตัว)</span>
                    </button>
                    <button
                      onClick={() => setLdShelfTab('hall-of-fame')}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-purple-600/20 transition-all"
                    >
                      <Crown className="w-4 h-4 text-yellow-300" />
                      <span>เปิดดูทำเนียบ LD 5★ ยอดนิยม 40 ตัว (ระดับ/อัตราชนะจาก RTA Tier List)</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-10 sm:py-14 text-center space-y-4 rounded-2xl bg-white/[0.02] border border-white/5 p-6">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Trophy className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-white">
                      ยังไม่พบมอนสเตอร์แสง-มืด 5 ดาวแท้ในไอดีนี้
                    </h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      มอนสเตอร์แสง-มืดแท้ (LD 5★) ออกจากคัมภีร์แสง-มืดได้ยากมาก ขอให้การซัมมอนครั้งต่อไปของคุณได้รับแสงสว่างระดับตำนานครับ!
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <button
                      onClick={() => setLdShelfTab('hall-of-fame')}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-purple-600/20 transition-all"
                    >
                      <Crown className="w-4 h-4 text-yellow-300" />
                      <span>เปิดดูทำเนียบ LD 5★ ยอดนิยม 40 ตัว (ระดับ/อัตราชนะจาก RTA Tier List)</span>
                    </button>
                    {onLoadDemo && (
                      <button
                        onClick={onLoadDemo}
                        className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>🎮 โหลดไอดีตัวอย่าง Guardian G3 เพื่อทดสอบตู้สะสม</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW B: 40 META LD 5★ GUARDIAN HALL OF FAME */}
          {ldShelfTab === 'hall-of-fame' && (
            <div className="space-y-4">
              {/* Filter Chips */}
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="text-xs text-slate-400 font-medium">
                  แสดง {filteredHof.length} จาก {hallOfFameMonsters.length} — ระดับและอัตราชนะจาก RTA Tier List ซีซั่น {RTA_SEASON}{tierList.live ? ' · อัปเดตล่าสุด ' + new Date(tierList.updatedAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : ''}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    ['all', `ทั้งหมด (${hallOfFameMonsters.length})`],
                    ['top', `RTA S${RTA_SEASON} ระดับ S ขึ้นไป (${hallOfFameMonsters.filter((m) => TOP_TIERS.has(m.tier)).length})`],
                    ['light', 'ธาตุแสง (☀️)'],
                    ['dark', 'ธาตุมืด (🌙)'],
                    ['owned', `ที่คุณครอบครอง (${hallOfFameMonsters.filter((m) => m.isOwned).length})`],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setHofFilter(key)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        hofFilter === key
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-white/[0.03] text-slate-400 hover:text-white border border-white/5'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 40 Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {filteredHof.map((item, idx) => {
                  const isLight = item.element === 'light';
                  return (
                    <div
                      key={idx}
                      onClick={() => onNavigate('where2use', { initialMonster: item.name })}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between gap-2.5 ${
                        item.isOwned
                          ? 'bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-400 shadow-md shadow-emerald-950/30'
                          : 'bg-[#0a0f19] border-white/[0.08] hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative shrink-0">
                          <MonsterAvatar
                            monster={item.monster || item}
                            size={52}
                            className={`rounded-2xl border-2 ${
                              item.isOwned ? 'border-emerald-400' : isLight ? 'border-yellow-400/40' : 'border-purple-400/40'
                            }`}
                          />
                          {item.isOwned ? (
                            <span className="absolute -top-1 -right-1 p-0.5 rounded-full bg-emerald-500 text-white shadow">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          ) : (
                            <span className="absolute -top-1 -right-1 p-0.5 rounded-full bg-slate-800 text-slate-400 border border-white/10 shadow">
                              <Lock className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              title={item.tier ? `ระดับใน RTA Tier List ซีซั่น ${RTA_SEASON}` : 'ไม่อยู่ใน RTA Tier List ซีซั่นนี้'}
                              className={`text-[10px] font-black px-1.5 py-0.2 rounded font-mono ${
                                item.tier === 'SS'
                                  ? 'bg-amber-500 text-slate-950'
                                  : item.tier === 'S'
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : 'bg-white/[0.05] text-slate-400 border border-white/10'
                              }`}
                            >
                              {item.tier || '—'}
                            </span>
                            <span className="text-xs font-black text-white group-hover:text-amber-300 transition-colors truncate">
                              {item.name}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            {item.monster?.thaiName || (isLight ? 'ธาตุแสง' : 'ธาตุมืด')}
                          </div>
                          <div className="text-[10px] text-slate-400 line-clamp-1 mt-1 font-medium leading-relaxed">
                            {item.role}
                          </div>
                        </div>
                      </div>

                      {/* Card Bottom Status Badge */}
                      <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[11px]">
                        <span className="text-[10px] font-mono text-slate-400">
                          {item.rta ? `RTA S${RTA_SEASON}: ชนะ ${item.rta.winRate}%` : 'ไม่มีข้อมูล RTA ซีซั่นนี้'}
                        </span>
                        {item.isOwned ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" /> ครอบครองแล้ว
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-white/5 text-slate-400 text-[10px] font-medium flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> มอนสเตอร์ในฝัน
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. NAT 5 COMPLETION PROGRESS BY ELEMENT */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-white flex items-center gap-2">
            <span>ความคืบหน้าการสะสม 5 ดาวแท้แยกตามธาตุ</span>
            <span className="text-xs text-slate-400 font-normal hidden sm:inline">
              (คลิกที่การ์ดธาตุเพื่อกรองสารบัญทันที)
            </span>
          </div>
          {eleFilter !== 'all' && (
            <button
              onClick={() => setEleFilter('all')}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 cursor-pointer"
            >
              แสดงทุกธาตุ
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Object.entries(statsByElement).map(([ele, val]) => {
            const pct = val.total > 0 ? Math.round((val.owned / val.total) * 100) : 0;
            const isSelected = eleFilter === ele;
            return (
              <div
                key={ele}
                onClick={() => setEleFilter(isSelected ? 'all' : ele)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-center ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-950/30 shadow-lg shadow-cyan-500/15 ring-2 ring-cyan-400/30'
                    : `${card} hover:border-white/20 hover:bg-white/[0.04]`
                }`}
              >
                <div className="text-xs font-bold capitalize text-slate-300 mb-1 flex items-center justify-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${ELEMENT_COLOR[ele]}`} />
                  <span>ธาตุ{ELEMENT_TH[ele]}</span>
                </div>
                <div className="text-xl font-black text-white font-mono">
                  {val.owned} <span className="text-xs text-slate-400 font-normal">/ {val.total}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5 mt-2.5 overflow-hidden">
                  <div className={`h-full ${ELEMENT_COLOR[ele]} transition-all duration-500`} style={{ width: `${pct}%` }} />
                </div>
                <div className="text-[11px] text-slate-400 mt-1.5 font-mono font-bold">{pct}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. NAT 5 CATALOG CHECKLIST & SEARCH ENGINE */}
      <div className={`${card} p-5 sm:p-6 space-y-4`}>
        {/* Search & Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-white">
              สารบัญ 5 ดาวแท้ทั้งหมด
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-slate-300 text-xs font-bold font-mono">
              {filteredMonsters.length} / {nat5Catalog.length}
            </span>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อมอนสเตอร์ (Seara, Byungchul, บยองชอล, เซียร์ร่า)..."
              className="w-full bg-[#070b12] border border-white/10 focus:border-cyan-400 rounded-xl pl-10 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400/30 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                aria-label="ล้างคำค้นหา"
                className="absolute right-0.5 top-1/2 -translate-y-1/2 p-2.5 text-slate-500 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills & Sort Options */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/[0.06]">
          {/* Element Filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {ELEMENT_FILTERS.map(([id, label]) => (
              <button
                key={id}
                onClick={() => setEleFilter(id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  eleFilter === id
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Ownership Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              ['all', 'ทั้งหมด'],
              ['owned', `ครอบครองแล้ว (${totalOwned})`],
              ['missing', `ยังไม่มี (${totalNat5 - totalOwned})`],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setOwnershipFilter(id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  ownershipFilter === id
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                {label}
              </button>
            ))}

            {/* Hide Non-Summonable LD Filter Toggle */}
            <button
              onClick={toggleHideNonSummonLd}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                hideNonSummonLd
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-white/[0.04] text-slate-400 hover:text-white border-white/5'
              }`}
              title="ซ่อนมอนสเตอร์แสง-มืดที่ไม่ได้เปิดได้เองจากคัมภีร์ เช่น Veromos, Jeanne, Elsharion, Eirgar, Altaïr"
            >
              {hideNonSummonLd ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{hideNonSummonLd ? 'ซ่อน LD ฟรี/ฟิวชั่น' : 'แสดง LD ฟรี/ฟิวชั่น'}</span>
            </button>

            {/* Sort Mode */}
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value)}
              className="bg-[#070b12] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              <option value="element">เรียงตามธาตุ</option>
              <option value="name">เรียงตามชื่อ A-Z</option>
              <option value="owned-first">มอนสเตอร์ที่มีขึ้นก่อน</option>
            </select>
          </div>
        </div>

        {/* Monster Checklist Grid */}
        {filteredMonsters.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2.5 pt-2">
            {filteredMonsters.map((m) => {
              const isOwned = checkIsOwned(m);
              return (
                <div
                  key={m.id || m.name}
                  onClick={() => onNavigate('where2use', { initialMonster: m.name })}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all cursor-pointer group hover:scale-105 ${
                    isOwned
                      ? 'border-emerald-500/50 bg-gradient-to-b from-emerald-950/25 to-[#0a0f19] shadow-md shadow-emerald-950/30'
                      : 'border-white/5 bg-white/[0.02] opacity-45 grayscale hover:opacity-80 hover:grayscale-0'
                  }`}
                  title={`${m.name} (${m.thaiName || m.element}) - คลิกเพื่อดูคู่มือ & สกิล`}
                >
                  <div className="relative">
                    <MonsterAvatar monster={m} size={46} className="rounded-xl" />
                    {isOwned ? (
                      <span className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="absolute -top-1 -right-1 bg-slate-800 text-slate-400 rounded-full p-0.5 border border-white/10 shadow">
                        <Lock className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-bold text-slate-200 truncate max-w-full group-hover:text-cyan-300 transition-colors">
                    {m.name}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate max-w-full">
                    {m.thaiName && m.thaiName !== m.name ? m.thaiName : `${ELEMENT_TH[m.element] || m.element}`}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 text-xs">
            ไม่พบมอนสเตอร์ 5 ดาวแท้ตามเงื่อนไขที่เลือก
          </div>
        )}
      </div>
    </div>
  );
}
