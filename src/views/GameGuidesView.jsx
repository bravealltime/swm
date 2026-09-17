import React, { useState } from 'react';
import { 
  BookOpen, 
  Compass, 
  ShieldAlert, 
  CheckCircle2, 
  Sparkles, 
  Search, 
  ArrowRight, 
  Flame, 
  Swords, 
  Shield, 
  Zap, 
  Clock, 
  Award,
  Layers
} from 'lucide-react';
import MonsterAvatar from '../components/MonsterAvatar';

const GAME_GUIDES_DATA = [
  {
    id: 'giants-abyss',
    category: 'cairos',
    categoryTh: 'ไครอส ดันเจี้ยน (Cairos Dungeon)',
    title: "ดันเจี้ยนยักษ์โบราณ (Giant's Keep) - Abyss Hard",
    desc: 'กลยุทธ์ฟาร์มรูน Despair, Fatal, Blade, Swift, Energy ด้วยสปีดทีม 25-35 วินาที',
    element: 'Water',
    bossMechanics: [
      'บอสจะเคาน์เตอร์โจมตีสวนกลับทันทีเมื่อโดนครบ 7 ครั้ง (พาสซีฟ Reflexes)',
      'การโจมตีปกติของบอสมีความเสียหายรุนแรงมาก และสร้างสตั๊นหมู่',
      'คริสตัลซ้ายจะลดเกราะทีมเรา คริสตัลขวาจะเพิ่มพลังโจมตีให้บอส'
    ],
    recommendedTeam: [
      { name: 'Teshar (L)', role: 'ล้างเวฟด้วยพาสซีฟรีเซ็ตสกิล + ดาเมจหลัก', rune: 'Fatal/Blade' },
      { name: 'Homunculus (Wind)', role: 'ดาเมจเจาะเกราะตาม % เลือดบอส', rune: 'Rage/Blade' },
      { name: 'Prilea (Water Harpu 2A)', role: 'เปิดเทิร์น ลดเกราะ Def Break 100%', rune: 'Fight x3 / Will' },
      { name: 'Deborah (Dark Blacksmith)', role: 'พาสซีฟเพิ่มดาเมจเจาะเกราะ +25%', rune: 'Fight x3 / Will' },
      { name: 'Konamiya (Water Garuda)', role: 'ปั๊มเทิร์น Resurge ให้ Teshar ออกสกิลซ้ำ', rune: 'Swift / Will' }
    ],
    turnOrder: 'Prilea (เปิดลดเกราะ) ➔ Teshar (กวาดม็อบ/ตีบอส) ➔ Konamiya (ดึงเทิร์น Teshar) ➔ Wind Homu (ปิดจ็อบ)',
    avgClearTime: '00:26 วินาที (Winrate 99.8%)'
  },
  {
    id: 'dragons-abyss',
    category: 'cairos',
    categoryTh: 'ไครอส ดันเจี้ยน (Cairos Dungeon)',
    title: "ดันเจี้ยนมังกรเพลิง (Dragon's Lair) - Abyss Hard",
    desc: 'กลยุทธ์ฟาร์มรูน Violent, Revenge, Shield, Guard, Endure ความเร็วเฉลี่ย 35-45 วินาที',
    element: 'Fire',
    bossMechanics: [
      'บอสจะทำดาเมจแรงขึ้นมหาศาลตามจำนวนดีบัฟพิษที่ติดอยู่บนตัวเรา',
      'คริสตัลขวาจะกางบัฟอมตะ (Immunity) ให้บอส คริสตัลซ้ายจะพ่นดอท',
      'เมื่อบอสเลือดต่ำกว่า 30% พลังโจมตีจะเพิ่มขึ้นแบบก้าวกระโดด'
    ],
    recommendedTeam: [
      { name: 'Liam (Water Battle Angel)', role: 'สกิล 3 พุ่งโจมตีนิวเคลียร์บอส 1 ฮิตดับ', rune: 'Rage / Blade' },
      { name: 'Galleon (Water Pirate Captain)', role: 'สกิล 3 บัฟ ATK หมู่ + เจาะเกราะบอส', rune: 'Fight x3' },
      { name: 'Taor (Water Chimera)', role: 'ดาเมจเสริมสเกลสปีด สกิล Squall', rune: 'Fatal / Blade' },
      { name: 'Kyle (Water Poison Master)', role: 'ดาเมจหลายฮิต + ห้ามฮีล', rune: 'Rage / Will' },
      { name: 'Spectra (Fire Griffon 2A)', role: 'สโลว์บอส + ดาเมจตาม % HP บอส', rune: 'Swift / Focus' }
    ],
    turnOrder: 'Galleon (บัฟ ATK + ลดเกราะ) ➔ Spectra (สโลว์) ➔ Kyle ➔ Liam (นิวเคลียร์ปิดฉาก)',
    avgClearTime: '00:36 วินาที (Winrate 99.5%)'
  },
  {
    id: 'necro-abyss',
    category: 'cairos',
    categoryTh: 'ไครอส ดันเจี้ยน (Cairos Dungeon)',
    title: "ดันเจี้ยนเนโครโพลิส (Necropolis) - Abyss Hard",
    desc: 'กลยุทธ์ฟาร์มรูน Vampire, Will, Nemesis, Rage, Destroy ทลายบาเรีย 7 ชั้น',
    element: 'Dark',
    bossMechanics: [
      'บอสมีบาเรียเวทมนตร์ลดทอนดาเมจ ต้องตีหลายฮิต (Multi-hit) 7 ครั้งก่อนจึงจะทำดาเมจเข้า',
      'ความเร็วการโจมตีถูกจำกัดเพดาน (Speed Cap) ในห้องบอส ไม่สามารถเร่งสปีดเกินกำหนดได้',
      'บอสสามารถกักขังและขโมยมอนสเตอร์ที่ทำดาเมจสูงสุดของเราไปเป็นพวกได้'
    ],
    recommendedTeam: [
      { name: 'Astar (Fire Magic Knight)', role: 'สกิลติดตัวตีแรงขึ้นเมื่อเลือดต่ำกว่าศัตรู หลายฮิต', rune: 'Vampire / Revenge' },
      { name: 'Shamann (Light Griffon 2A)', role: 'พาสซีฟตีแรงขึ้นกับธาตุมืด x2 และลดดาเมจที่ได้รับ', rune: 'Rage / Blade' },
      { name: 'Colleen (Fire Harpu)', role: 'บัฟ ATK + ตีหลายฮิต + ห้ามฮีลบอส', rune: 'Revenge x3' },
      { name: 'Abigail (Water Cannon Girl)', role: 'ล้างบาเรียหลายฮิต + ลดแถบเกจ', rune: 'Fatal / Revenge' },
      { name: 'Lucasha (Fire Harpy 2A)', role: 'เจาะเกราะ + โจมตี 6 ฮิตต่อเนื่อง', rune: 'Revenge x2 / Blade' }
    ],
    turnOrder: 'Colleen ➔ Abigail ➔ Lucasha (ทลายบาเรีย) ➔ Astar ➔ Shamann (กระซวกดาเมจนิวเคลียร์)',
    avgClearTime: '00:41 วินาที (Winrate 99.4%)'
  },
  {
    id: 'steel-fortress',
    category: 'cairos',
    categoryTh: 'ไครอส ดันเจี้ยน (Cairos Dungeon)',
    title: "ป้อมปราการเหล็กกล้า (Steel Fortress) - Tormentor",
    desc: 'กลยุทธ์ฟาร์ม Attribute Artifacts บล็อกบัฟเกราะหนาของบอส Tormentor',
    element: 'Wind',
    bossMechanics: [
      'บอสจะกางบาเรียดูดซับดาเมจและบัฟเกราะหนาทุกครั้งที่เลือดลดลงถึงเกณฑ์',
      'หัวใจสำคัญคือต้องใส่ตัวบล็อกบัฟ (Block Beneficial Effects) เพื่อไม่ให้บอสกางเกราะ'
    ],
    recommendedTeam: [
      { name: 'Zinc (Dark Living Armor 2A)', role: 'สกิล 3 บล็อกบัฟหมู่ 100% + ลดเกราะ', rune: 'Despair / Guard' },
      { name: 'Eirgar (Dark Vampire Lord)', role: 'บัฟ ATK + ดูดเลือด + บล็อกบัฟ', rune: 'Fatal / Blade' },
      { name: 'Kro (Dark Inugami 2A)', role: 'สกิล Scar ทำดาเมจทวีคูณตามจำนวนดีบัฟ', rune: 'Rage / Blade' },
      { name: 'Loren (Light Cow Girl)', role: 'ลดเกราะ + ลบล้างบัฟ + ลดแถบเกจ', rune: 'Swift / Focus' },
      { name: 'Raoq (Fire Inugami 2A)', role: 'พาสซีฟออกเทิร์นต่อเนื่อง Team Up ล้างคูลดาวน์', rune: 'Violent / Blade' }
    ],
    turnOrder: 'Loren (เจาะเกราะ) ➔ Zinc (บล็อกบัฟ) ➔ Eirgar (บัฟดาเมจ) ➔ Raoq/Kro (ปิดเกม)',
    avgClearTime: '00:38 วินาที (Winrate 99.6%)'
  },
  {
    id: 'punishers-crypt',
    category: 'cairos',
    categoryTh: 'ไครอส ดันเจี้ยน (Cairos Dungeon)',
    title: "สุสานผู้ลงทัณฑ์ (Punisher's Crypt)",
    desc: 'กลยุทธ์ฟาร์ม Archetype Artifacts จัดการบอสที่สปีดสูงตามจำนวนเทิร์น',
    element: 'Light',
    bossMechanics: [
      'บอสจะยิ่งมีความเร็วสูงขึ้นเรื่อยๆ ตามจำนวนการเคลื่อนที่ของทีมเรา',
      'การใช้ทีมที่มีการลดเกจ (ATB Reduction) และสโลว์จะช่วยคุมเทิร์นได้อย่างสมบูรณ์แบบ'
    ],
    recommendedTeam: [
      { name: 'Verdehile (Fire Vampire)', role: 'ลีดสปีด + ปั๊มเกจทีมทุกครั้งที่คริติคอล', rune: 'Violent / Revenge' },
      { name: 'Tricaru x3 (Water Inugami 2A)', role: 'ประสานการโจมตี Team Up 4 ตัวทุกเทิร์น', rune: 'Guard x3 (DEF +2300)' },
      { name: 'Icaru (ตัวที่ 1)', role: 'Team Up ลากเพื่อนร่วมโจมตี', rune: 'Guard x3' },
      { name: 'Icaru (ตัวที่ 2)', role: 'Team Up ลากเพื่อนร่วมโจมตี', rune: 'Guard x3' },
      { name: 'Icaru (ตัวที่ 3)', role: 'Team Up ลากเพื่อนร่วมโจมตี', rune: 'Guard x3' }
    ],
    turnOrder: 'Tricaru ประสานการโจมตีวนรอบไม่ให้บอสได้ขยับ',
    avgClearTime: '00:52 วินาที (Winrate 100%)'
  },
  {
    id: 'dimension-karzhan',
    category: 'dimension',
    categoryTh: 'มิติลี้ลับ (Dimension Hole)',
    title: "มิติลี้ลับ Karzhan - ฟาร์มปลุกพลัง 2A Inugami & Warbear",
    desc: 'เงื่อนไขจำกัด: นำมอนสเตอร์ที่เป็นสัตว์อสูรและเกรด 4 ดาวขึ้นไปเข้าสู่สมรภูมิ',
    element: 'All',
    bossMechanics: [
      'บอสในมิติคาร์ซานมีการโจมตีหมู่ที่รุนแรงและฟื้นฟูพลังชีวิตเมื่อศัตรูตาย',
      'ต้องรักษาบัฟอิมมูนและชุบชีวิตเพื่อนร่วมทีมได้อย่างต่อเนื่อง'
    ],
    recommendedTeam: [
      { name: 'Fran (Light Fairy Queen)', role: 'บัฟ ATK + ฮีล + อิมมูนหมู่', rune: 'Violent / Will' },
      { name: 'Verdehile (Fire Vampire)', role: 'เร่งเกจการเคลื่อนที่', rune: 'Violent / Blade' },
      { name: 'Loren (Light Cow Girl)', role: 'ลดเกราะ + คุมเกจบอส', rune: 'Swift / Focus' },
      { name: 'Kro (Dark Inugami 2A)', role: 'ดาเมจปิดชีพเจาะเกราะ', rune: 'Rage / Blade' }
    ],
    turnOrder: 'Fran ➔ Loren ➔ Verdehile ➔ Kro',
    avgClearTime: '01:10 นาที (Winrate 99.9%)'
  },
  {
    id: 'siege-strategy',
    category: 'siege',
    categoryTh: 'ยุทธวิธีกิลด์วอร์ (Siege Tactics)',
    title: "ยุทธวิธีตัดฐานและจังหวะพุช Siege Battle ระดับ Guardian",
    desc: 'คู่มือการเดินแต้ม ยึด 12-14 ฐาน และการตัดสายส่งกำลังบำรุงของกิลด์ศัตรู',
    element: 'Tactics',
    bossMechanics: [
      'การยึดฐานเชื่อมต่อ: ถ้าตัดฐานหน้าค่ายศัตรูได้ ฐานข้างหลังจะถูกตัดขาดทันที',
      'Over-cap Bonus: กิลด์ที่ถือ 13 ฐานขึ้นไปจะได้แต้มเพิ่มทวีคูณ ต้องรีบตัดให้เหลือต่ำกว่า 12',
      'HQ Push: อย่าปล่อยให้ทีมนำเข้าใกล้ 18,000 แต้มโดยที่ยังมีฐานเกิน 12 ฐาน'
    ],
    recommendedTeam: [
      { name: 'ทีมบุกมาตรฐาน 1', role: 'Galleon + Clara + Leah (เจาะทีมเร็วสปีดต่ำกว่า)', rune: 'Swift Speed Combo' },
      { name: 'ทีมบุกมาตรฐาน 2', role: 'Tractor + Windy + Avelson (ทีมรถถังรับมือ Savannah/Miles)', rune: 'Destroy / Vampire / Will' },
      { name: 'ทีมบุกมาตรฐาน 3', role: 'Bolverk + Mo Long + Amelia (สูตรอมตะกำจัดบยองชุล/คาร์นอล)', rune: 'Will / Shield / Violent' }
    ],
    turnOrder: 'สื่อสารในกิลด์ผ่าน Discord ➔ ตัดฐานสำคัญพร้อมกัน ➔ วางทีมรับซ้อน 5 ทีม',
    avgClearTime: 'ยึดสำเร็จภายใน 15-20 นาทีแรกของรอบแข่งขัน'
  }
];

export default function GameGuidesView({ onNavigate }) {
  const [selectedCategory, setSelectedCategory] = useState('all'); // 'all', 'cairos', 'dimension', 'siege'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuideId, setSelectedGuideId] = useState(GAME_GUIDES_DATA[0].id);

  const categories = [
    { id: 'all', name: 'คู่มือทั้งหมด' },
    { id: 'cairos', name: 'ไครอส ดันเจี้ยน (Abyss Hard)' },
    { id: 'dimension', name: 'มิติลี้ลับ (Dimension Hole 2A)' },
    { id: 'siege', name: 'ยุทธวิธีกิลด์วอร์ (Siege Strategy)' },
  ];

  const filteredGuides = GAME_GUIDES_DATA.filter(g => {
    if (selectedCategory !== 'all' && g.category !== selectedCategory) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return g.title.toLowerCase().includes(q) || g.desc.toLowerCase().includes(q);
  });

  const activeGuide = GAME_GUIDES_DATA.find(g => g.id === selectedGuideId) || filteredGuides[0] || GAME_GUIDES_DATA[0];

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-[#1c2738] pb-5">
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider mb-1">
          <BookOpen className="w-4 h-4" />
          SWGT Tactical Game Guides • สารบัญคู่มือกลยุทธ์ฉบับสมบูรณ์
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          คู่มือการเล่นและเจาะดันเจี้ยน (Game Guides & Walkthroughs)
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
          รวมเทคนิคการจัดทีมฟาร์ม Abyss Hard, มิติลี้ลับ 2A, และยุทธวิธีการเดินแต้มกิลด์วอร์ Siege Battle โดยละเอียด พร้อมลำดับเทิร์นและรูนแนะนำ
        </p>
      </div>

      {/* Search and Category Filter Bar */}
      <div className="bg-[#101724] border border-[#1d2b3f] p-4 sm:p-5 rounded-2xl shadow-xl space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            className="w-full bg-[#0c121c] border border-[#1d2b3f] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            placeholder="ค้นหาคู่มือ เช่น ยักษ์, มังกร, เนโคร, Abyss, Siege, Tricaru, Teshar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 pt-1 border-t border-[#182333]">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === c.id
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-[#0c121c] border border-[#1d2b3f] text-slate-400 hover:text-white hover:bg-[#152030]'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Layout: Master-Detail Guide View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Guide Selection List (4 cols) */}
        <div className="lg:col-span-4 space-y-2.5">
          {filteredGuides.map((guide) => {
            const isSelected = guide.id === activeGuide.id;
            return (
              <div
                key={guide.id}
                onClick={() => setSelectedGuideId(guide.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-md ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#101d2d] to-[#101724] border-emerald-500/60 shadow-emerald-500/10'
                    : 'bg-[#101724] border-[#1d2b3f] hover:border-slate-500/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                    {guide.categoryTh}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                    guide.element === 'Water' ? 'bg-sky-500/20 text-sky-400' :
                    guide.element === 'Fire' ? 'bg-rose-500/20 text-rose-400' :
                    guide.element === 'Wind' ? 'bg-amber-500/20 text-amber-400' :
                    guide.element === 'Dark' ? 'bg-purple-500/20 text-purple-400' :
                    'bg-slate-500/20 text-slate-300'
                  }`}>
                    {guide.element}
                  </span>
                </div>

                <div className="text-sm font-black text-white mt-1">
                  {guide.title}
                </div>

                <div className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {guide.desc}
                </div>

                <div className="mt-3 pt-2 border-t border-[#182333] flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono">{guide.avgClearTime}</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    อ่านต่อ <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Detailed Guide Content (8 cols) */}
        <div className="lg:col-span-8 bg-[#101724] border border-[#1d2b3f] rounded-2xl p-6 shadow-2xl space-y-6">
          {/* Guide Header */}
          <div className="border-b border-[#1d2b3f] pb-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {activeGuide.categoryTh}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {activeGuide.avgClearTime}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-2">
              {activeGuide.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
              {activeGuide.desc}
            </p>
          </div>

          {/* Boss Mechanics Alert Card */}
          <div className="bg-[#0c121c] border border-amber-500/30 rounded-2xl p-4 sm:p-5 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4" />
              กลไกการต่อสู้และข้อควรระวัง (Key Mechanics)
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {activeGuide.bossMechanics.map((m, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recommended Team Lineup */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Swords className="w-4 h-4 text-cyan-400" />
                ทีมแนะนำยอดนิยมและการใส่อุปกรณ์ (Team Composition)
              </h3>
            </div>

            <div className="space-y-2.5">
              {activeGuide.recommendedTeam.map((mem, idx) => (
                <div 
                  key={idx}
                  className="p-3 rounded-xl bg-[#0c121c] border border-[#1d2b3f] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <div className="text-xs font-black text-white">{mem.name}</div>
                    <div className="text-xs text-slate-400">{mem.role}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#152030] text-cyan-300 border border-[#1d2b3f]">
                      รูน: {mem.rune}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Turn Order Execution */}
          <div className="p-4 rounded-xl bg-[#0c121c] border border-cyan-500/30 space-y-1.5">
            <div className="text-xs font-bold text-cyan-400 uppercase flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> ลำดับการออกสกิลและเทิร์น (Turn Order):
            </div>
            <div className="text-xs font-mono font-bold text-white">
              {activeGuide.turnOrder}
            </div>
          </div>

          {/* Shortcut CTA */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate && onNavigate('dungeons')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-md shadow-blue-600/30"
            >
              <Compass className="w-3.5 h-3.5" /> ดูสถิติดันเจี้ยนฉบับเต็ม (Abyss Speed Stats)
            </button>
            <button
              onClick={() => onNavigate && onNavigate('speed')}
              className="px-4 py-2 rounded-xl bg-[#0c121c] hover:bg-[#162030] text-slate-300 hover:text-white border border-[#1d2b3f] font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" /> คำนวณสปีดทิกเพื่อจูนทีม
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
