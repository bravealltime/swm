import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Zap, 
  ShieldAlert, 
  Layers, 
  Sliders, 
  Trophy, 
  RotateCcw, 
  Check, 
  ArrowRight, 
  Flame, 
  Target, 
  TrendingUp, 
  Cpu, 
  Compass, 
  Sword, 
  Shield, 
  Heart, 
  Gauge, 
  Plus, 
  Eye, 
  HelpCircle 
} from 'lucide-react';
import ArtifactIcon from '../components/ArtifactIcon';

// Curated Top Meta Monsters that scale massively with Additional Damage Artifacts
const POPULAR_OPTIMIZER_MONSTERS = [
  {
    id: 'juno',
    name: 'Juno (จูโน่)',
    element: 'Fire',
    elementTh: 'ไฟ',
    family: 'Oracle',
    archetype: 'Support',
    archetypeTh: 'สายสนับสนุน',
    stars: 6,
    hitsPerAttack: 3, // Skill 1 hits 3 times
    skillDescription: 'สกิล 1 โจมตี 3 ฮิตต่อเนื่อง (ดาเมจเสริม x3 ทุกเทิร์น)',
    img: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters/unit_icon_0020_0_2.png',
    base: { hp: 11370, atk: 703, def: 681, spd: 100, cr: 15, cd: 50, res: 15, acc: 25 },
    defaultRune: { hp: 28867, atk: 1060, def: 1046, spd: 172, cr: 70, cd: 4, res: 0, acc: 22 },
    currentArtifacts: {
      left: {
        name: 'Fire Artifact (ธาตุไฟ)',
        main: 'HP +1500',
        sub1: "Add'l DMG by 95% of SPD",
        sub2: "Add'l DMG by 3.5% of HP",
        sub3: "Add'l DMG by 8% of DEF",
        sub4: "Crit DMG Taken -8%",
        eff: '86.8%'
      },
      right: {
        name: 'Support Artifact (สายซัพพอร์ต)',
        main: 'HP +1500',
        sub1: "Add'l DMG by 22% of SPD",
        sub2: "Add'l DMG by 1.0% of HP",
        sub3: "Add'l DMG by 4.5% of DEF",
        sub4: "Recovery S3 +9%",
        eff: '93.4%'
      }
    }
  },
  {
    id: 'miles',
    name: 'Miles (ไมลส์)',
    element: 'Water',
    elementTh: 'น้ำ',
    family: 'Sky Surfer',
    archetype: 'Attack',
    archetypeTh: 'สายโจมตี',
    stars: 6,
    hitsPerAttack: 2,
    skillDescription: 'สกิล 2 และพาสซีฟทำดาเมจเสริมตามความเร็ว SPD สูงสุด',
    img: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters/unit_icon_0056_0_1.png',
    base: { hp: 10215, atk: 780, def: 604, spd: 106, cr: 15, cd: 50, res: 15, acc: 25 },
    defaultRune: { hp: 21500, atk: 950, def: 780, spd: 195, cr: 55, cd: 15, res: 15, acc: 30 },
    currentArtifacts: {
      left: {
        name: 'Water Artifact (ธาตุน้ำ)',
        main: 'HP +1500',
        sub1: "Add'l DMG by 110% of SPD",
        sub2: "Add'l DMG by 4% of HP",
        sub3: "Water DMG +7%",
        sub4: "ACC S2 +8%",
        eff: '88.5%'
      },
      right: {
        name: 'Attack Artifact (สายโจมตี)',
        main: 'ATK +100',
        sub1: "Add'l DMG by 35% of SPD",
        sub2: "Add'l DMG by 14% of ATK",
        sub3: "Crit DMG +6%",
        sub4: "Single Target CD +5%",
        eff: '91.0%'
      }
    }
  },
  {
    id: 'dominic',
    name: 'Dominic (โดมินิก)',
    element: 'Wind',
    elementTh: 'ลม',
    family: 'Weapon Master',
    archetype: 'Attack',
    archetypeTh: 'สายโจมตี',
    stars: 6,
    hitsPerAttack: 3,
    skillDescription: 'พาสซีฟระเบิดดาเมจแท้ตามพลังโจมตี ATK ทุกครั้งที่ตีโดน',
    img: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters/unit_icon_0059_0_0.png',
    base: { hp: 10380, atk: 823, def: 582, spd: 102, cr: 15, cd: 50, res: 15, acc: 25 },
    defaultRune: { hp: 24000, atk: 1580, def: 650, spd: 145, cr: 40, cd: 10, res: 20, acc: 18 },
    currentArtifacts: {
      left: {
        name: 'Wind Artifact (ธาตุลม)',
        main: 'ATK +100',
        sub1: "Add'l DMG by 18% of ATK",
        sub2: "Add'l DMG by 85% of SPD",
        sub3: "Add'l DMG by 3.2% of HP",
        sub4: "Wind DMG +6%",
        eff: '89.2%'
      },
      right: {
        name: 'Attack Artifact (สายโจมตี)',
        main: 'ATK +100',
        sub1: "Add'l DMG by 16% of ATK",
        sub2: "Add'l DMG by 40% of SPD",
        sub3: "Life Drain +5%",
        sub4: "Counter Atk +8%",
        eff: '92.1%'
      }
    }
  },
  {
    id: 'ethna',
    name: 'Ethna (เอธน่า)',
    element: 'Wind',
    elementTh: 'ลม',
    family: 'Hell Lady',
    archetype: 'Attack',
    archetypeTh: 'สายโจมตี',
    stars: 6,
    hitsPerAttack: 5, // Capture hits 5 times!
    skillDescription: 'สกิล 3 Capture โจมตีรัว 5 ฮิต (รับประโยชน์ดาเมจเสริม x5!)',
    img: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters/unit_icon_0023_0_0.png',
    base: { hp: 10875, atk: 845, def: 593, spd: 119, cr: 15, cd: 50, res: 15, acc: 25 },
    defaultRune: { hp: 16500, atk: 1250, def: 620, spd: 205, cr: 85, cd: 60, res: 10, acc: 35 },
    currentArtifacts: {
      left: {
        name: 'Wind Artifact (ธาตุลม)',
        main: 'HP +1500',
        sub1: "Add'l DMG by 125% of SPD",
        sub2: "Add'l DMG by 12% of ATK",
        sub3: "Water DMG +8%",
        sub4: "ACC S3 +9%",
        eff: '94.0%'
      },
      right: {
        name: 'Attack Artifact (สายโจมตี)',
        main: 'ATK +100',
        sub1: "Add'l DMG by 42% of SPD",
        sub2: "Add'l DMG by 14% of ATK",
        sub3: "Crit DMG +7%",
        sub4: "First Hit CD +6%",
        eff: '90.5%'
      }
    }
  }
];

const ARTIFACT_FINDER_OPTIONS = [
  {
    id: 'addl_spd',
    name: "Add'l DMG by SPD (ดาเมจเสริมตามสปีด)",
    desc: 'เหมาะกับมอนสเตอร์ความเร็วสูงและออกหลายฮิต',
    monsters: [
      { name: 'Juno (จูโน่)', element: 'fire', role: 'สกิล 1 ตี 3 ฮิต + สปีดสูง', eff: 'ระดับ SSS' },
      { name: 'Miles (ไมลส์)', element: 'water', role: 'พาสซีฟสเกลสปีด + สกิล 2 ตี 2 ฮิต', eff: 'ระดับ SSS' },
      { name: 'Ethna (เอธน่า)', element: 'wind', role: 'สกิล 3 Capture โจมตี 5 ฮิตต่อเนื่อง', eff: 'ระดับ SSS' },
      { name: 'Sonia (โซเนีย)', element: 'wind', role: 'สปีดนำ = เจาะเกราะดาเมจนิวเคลียร์', eff: 'ระดับ SS' },
      { name: 'Eshir (เอเชียร์ 2A)', element: 'light', role: 'สกิล 3 Massacre ตี 4 ฮิต สปีด 115', eff: 'ระดับ SS' },
      { name: 'Liam (เลียม)', element: 'water', role: 'ตีหลายฮิตดาเมจมหาศาล', eff: 'ระดับ SS' },
    ]
  },
  {
    id: 'addl_hp',
    name: "Add'l DMG by HP (ดาเมจเสริมตามเลือดสูงสุด)",
    desc: 'เหมาะกับสายแทงก์เลือดหนา 40,000+ HP ที่ออกหลายฮิตหรือตีเคาน์เตอร์',
    monsters: [
      { name: 'Byungchul (บยองชุล)', element: 'wind', role: 'ตีหมู่ตามเลือด + สกิล 1 เคาน์เตอร์', eff: 'ระดับ SSS' },
      { name: 'Karnal (คาร์นอล)', element: 'fire', role: 'สกิล 3 ดูดเกจหลายฮิต เลือดหนา', eff: 'ระดับ SSS' },
      { name: 'Vigor (วิกอร์ 2A)', element: 'water', role: 'สกิล 3 Predator ตี 3 ฮิตลดเกราะ', eff: 'ระดับ SS' },
      { name: 'Chandra (จันทรา)', element: 'water', role: 'กอดเพื่อน เคาน์เตอร์สตั๊นตามเลือด', eff: 'ระดับ SS' },
      { name: 'Mo Long (โม่หลง)', element: 'water', role: 'สกิล 2 สตั๊น 3 ฮิต เลือด 45,000+', eff: 'ระดับ SS' },
    ]
  },
  {
    id: 'addl_def',
    name: "Add'l DMG by DEF (ดาเมจเสริมตามพลังป้องกัน)",
    desc: 'เหมาะกับตัวถึกสายป้องกัน เช่น แฟรงเกนสไตน์ หรือการ์กอยล์',
    monsters: [
      { name: 'Tractor (แทรคเตอร์ 2A)', element: 'fire', role: 'ยั่วยุ + สกิล 1 ตี 2 ฮิต ไม่ติดคริ', eff: 'ระดับ SSS' },
      { name: 'Windy (วินดี้)', element: 'wind', role: 'บาเรีย + เคาน์เตอร์ตีหลายฮิต', eff: 'ระดับ SS' },
      { name: 'Feng Yan (แพนด้าลม)', element: 'wind', role: 'พาสซีฟเพิ่มดาเมจตาม DEF + ตี 3 ฮิต', eff: 'ระดับ SS' },
      { name: 'Copper (คอปเปอร์)', element: 'wind', role: 'สายทุบเจาะเกราะตาม DEF', eff: 'ระดับ S' },
    ]
  },
  {
    id: 'addl_atk',
    name: "Add'l DMG by ATK (ดาเมจเสริมตามพลังโจมตี)",
    desc: 'เหมาะกับตัวดาเมจที่ตีหลายฮิตแต่ไม่พึ่งพาคริติคอล',
    monsters: [
      { name: 'Dominic (โดมินิก)', element: 'wind', role: 'พาสซีฟดาเมจแท้ไม่สนใจพลังป้องกัน', eff: 'ระดับ SSS' },
      { name: 'Seara (เซียร์ร่า)', element: 'wind', role: 'สกิล 1 ตี 3 ฮิต ปั๊มเกจ 45%', eff: 'ระดับ SSS' },
      { name: 'Kaki (คากิ)', element: 'fire', role: 'ไม่ติดคริ พลังโจมตีพื้นฐานสูงลิ่ว ตีหมู่', eff: 'ระดับ SSS' },
      { name: 'Suiki (ซุยกิ)', element: 'water', role: 'สะสมสแต็ค ATK/DEF ตีหมู่ดูดเลือด', eff: 'ระดับ SS' },
    ]
  },
  {
    id: 'bomb_dmg',
    name: 'Bomb DMG +% (เพิ่มความแรงระเบิด)',
    desc: 'เร่งดาเมจระเบิดนิวเคลียร์ให้ทะลุ 30,000 - 45,000+',
    monsters: [
      { name: 'Seara (เซียร์ร่า)', element: 'wind', role: 'ติดระเบิด + จุดชนวนระเบิดทันที', eff: 'ระดับ SSS' },
      { name: 'Giana (เจียน่า)', element: 'dark', role: 'ล้างบัฟแปลงเป็นสตั๊น + ติดระเบิด', eff: 'ระดับ SSS' },
      { name: 'Liebli (โจ๊กเกอร์มืด)', element: 'dark', role: 'พาสซีฟเคาน์เตอร์ + ติดระเบิดลดคูลดาวน์', eff: 'ระดับ SS' },
      { name: 'John (สกายเซิร์ฟเฟอร์ไฟ)', element: 'fire', role: 'วางระเบิดหมู่ 3 เม็ด', eff: 'ระดับ SS' },
    ]
  },
  {
    id: 'life_drain',
    name: 'Life Drain +% (ดูดเลือดจากการทำดาเมจ)',
    desc: 'เพิ่มความอึดให้ตัวยืนโซโล่ 1v3',
    monsters: [
      { name: 'Camilla (คามิลล่า)', element: 'water', role: 'ฮีลล้างดีบัฟ + ดูดเลือดจากทุกการโจมตี', eff: 'ระดับ SSS' },
      { name: 'Chow (เชาว์)', element: 'water', role: 'พาสซีฟเพิ่มดาเมจตามเลือดหาย + ดูดเลือด', eff: 'ระดับ SSS' },
      { name: 'Laika (ไลก้า)', element: 'fire', role: 'จำกัดดาเมจต่อฮิต + เคาน์เตอร์ดูดเลือด', eff: 'ระดับ SS' },
      { name: 'Douglas (ดักลาส)', element: 'fire', role: 'หลบการโจมตี + เคาน์เตอร์ดูดเลือด', eff: 'ระดับ SS' },
    ]
  }
];

export default function ArtifactOptimizerView({ onNavigate }) {
  const [activeMode, setActiveMode] = useState('calc'); // 'calc' or 'finder'
  const [selectedFinderSubstat, setSelectedFinderSubstat] = useState('addl_spd');
  const [selectedMonsterId, setSelectedMonsterId] = useState(POPULAR_OPTIMIZER_MONSTERS[0].id);

  // Combat Modifiers (Towers, Leaders, Buffs)
  const [modifiers, setModifiers] = useState({
    leaderSpd: 24, // e.g. 24% or 33% SPD lead
    leaderAtk: 0,
    leaderHp: 0,
    speedBuff: true, // +33% Total SPD in battle
    atkBuff: false, // +50% ATK buff
    defBuff: false, // +70% DEF buff
    towersEnabled: true // Max Glory Towers (SPD +15%, ATK +20%, HP +20%, DEF +20%)
  });

  const currentMonster = useMemo(() => {
    return POPULAR_OPTIMIZER_MONSTERS.find(m => m.id === selectedMonsterId) || POPULAR_OPTIMIZER_MONSTERS[0];
  }, [selectedMonsterId]);

  // Compute Total Combat Stats considering Base + Runes + Towers + Leaders + Combat Buffs
  const combatStats = useMemo(() => {
    const base = currentMonster.base;
    const rune = currentMonster.defaultRune;

    // Tower bonuses
    const towerSpd = modifiers.towersEnabled ? base.spd * 0.15 : 0;
    const towerAtk = modifiers.towersEnabled ? base.atk * 0.20 : 0;
    const towerHp = modifiers.towersEnabled ? base.hp * 0.20 : 0;
    const towerDef = modifiers.towersEnabled ? base.def * 0.20 : 0;

    // Leader bonuses
    const leadSpd = base.spd * (modifiers.leaderSpd / 100);
    const leadAtk = base.atk * (modifiers.leaderAtk / 100);
    const leadHp = base.hp * (modifiers.leaderHp / 100);

    // Raw out-of-combat total
    const outHp = base.hp + rune.hp;
    const outAtk = base.atk + rune.atk;
    const outDef = base.def + rune.def;
    const outSpd = base.spd + rune.spd;

    // In-combat with buffs
    let inSpd = outSpd + towerSpd + leadSpd;
    if (modifiers.speedBuff) inSpd *= 1.33;

    let inAtk = outAtk + towerAtk + leadAtk;
    if (modifiers.atkBuff) inAtk *= 1.50;

    let inDef = outDef + towerDef;
    if (modifiers.defBuff) inDef *= 1.70;

    let inHp = outHp + towerHp + leadHp;

    return {
      outHp: Math.round(outHp),
      outAtk: Math.round(outAtk),
      outDef: Math.round(outDef),
      outSpd: Math.round(outSpd),
      inHp: Math.round(inHp),
      inAtk: Math.round(inAtk),
      inDef: Math.round(inDef),
      inSpd: Math.round(inSpd),
      cr: base.cr + rune.cr,
      cd: base.cd + rune.cd,
      res: base.res + rune.res,
      acc: base.acc + rune.acc
    };
  }, [currentMonster, modifiers]);

  // Calculate Current Artifact Additional Damage
  const currentAddlDmg = useMemo(() => {
    // Current Left: 95% SPD, 3.5% HP, 8% DEF
    // Current Right: 22% SPD, 1.0% HP, 4.5% DEF
    const spd = combatStats.inSpd;
    const hp = combatStats.inHp;
    const def = combatStats.inDef;
    const atk = combatStats.inAtk;

    const leftDmg = Math.round((spd * 0.95) + (hp * 0.0035) + (def * 0.08));
    const rightDmg = Math.round((spd * 0.22) + (hp * 0.0010) + (def * 0.045));
    const totalHit = leftDmg + rightDmg;
    const totalMulti = totalHit * currentMonster.hitsPerAttack;

    return { leftDmg, rightDmg, totalHit, totalMulti };
  }, [combatStats, currentMonster]);

  // Optimized Best Combination Artifacts
  const optimizedArtifacts = useMemo(() => {
    const spd = combatStats.inSpd;
    const hp = combatStats.inHp;
    const def = combatStats.inDef;
    const atk = combatStats.inAtk;

    // Best Left (Element): 139% SPD + 5% ATK + 6.0% HP (Pure Additional Damage focus)
    const bestLeftDmg = Math.round((spd * 1.39) + (atk * 0.05) + (hp * 0.006));
    
    // Best Right (Archetype): 31% SPD + 1.2% HP + 6.0% DEF
    const bestRightDmg = Math.round((spd * 0.31) + (hp * 0.0012) + (def * 0.06));

    const totalHit = bestLeftDmg + bestRightDmg;
    const totalMulti = totalHit * currentMonster.hitsPerAttack;
    const deltaHit = totalHit - currentAddlDmg.totalHit;
    const deltaPercent = ((deltaHit / currentAddlDmg.totalHit) * 100).toFixed(1);

    return {
      bestLeft: {
        name: `Best Element Artifact (${currentMonster.elementTh})`,
        main: 'HP +1500',
        sub1: "Add'l DMG by 139% of SPD",
        sub2: "Add'l DMG by 5% of ATK",
        sub3: "Add'l DMG by 6.0% of HP",
        dmg: bestLeftDmg
      },
      bestRight: {
        name: `Best Archetype Artifact (${currentMonster.archetypeTh})`,
        main: 'HP +1500',
        sub1: "Add'l DMG by 31% of SPD",
        sub2: "Add'l DMG by 1.2% of HP",
        sub3: "Add'l DMG by 6% of DEF",
        dmg: bestRightDmg
      },
      totalHit,
      totalMulti,
      deltaHit,
      deltaPercent
    };
  }, [combatStats, currentMonster, currentAddlDmg]);

  return (
    <div className="space-y-6 max-w-[1780px] 2xl:max-w-[1880px] mx-auto pb-16 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-r from-[#0c1424] via-[#090e18] to-[#070b12] p-6 sm:p-8 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-mono font-bold uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Artifact Tactical Engine • True Damage Optimizer</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            ระบบจำลองและค้นหาอาร์ติแฟกต์ดาเมจเสริม
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
            ค้นหาคู่ผสมอาร์ติแฟกต์ (ธาตุ + สาย) ที่ให้ค่า <strong>Additional Damage (ดาเมจเสริมแท้ต่อฮิต)</strong> สูงสุด โดยคำนวณรวมทั้ง Base Stats, สเตตัสรูน, เสาอารีน่า (Towers), สกิลหัวหน้าทีม, และบัฟในสมรภูมิจริง
          </p>
        </div>

        {/* Global Feature Badge */}
        <div className="relative z-10 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl p-3.5 flex items-center gap-3 self-start lg:self-center shadow-xl">
          <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 font-bold">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-[11px] font-mono text-orange-400 uppercase font-bold">True Damage Math</div>
            <div className="text-xs sm:text-sm font-bold text-white">Full SWM Engine</div>
          </div>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#0a0f19]/80 border border-white/[0.08] backdrop-blur-xl shadow-lg">
        <button
          onClick={() => setActiveMode('calc')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeMode === 'calc'
              ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/25'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          💥 เครื่องจำลองดาเมจเสริมละเอียด (Damage Optimizer)
        </button>
        <button
          onClick={() => setActiveMode('finder')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeMode === 'finder'
              ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/25'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          🔍 ค้นหามอนสเตอร์ตามออปชั่นอาร์ติแฟกต์ (Monster Finder)
        </button>
      </div>

      {/* Artifact Monster Finder View */}
      {activeMode === 'finder' ? (
        <div className="space-y-6">
          <div className="bg-[#111927] border border-[#1e2a3c] p-5 rounded-2xl shadow-xl space-y-4">
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-400" />
                เลือกออปชั่นอาร์ติแฟกต์ที่สุ่มได้ (Select Artifact Sub-stat)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                เลือกสเตตัสรองอาร์ติแฟกต์ เพื่อดูทันทีว่ามอนสเตอร์ตัวไหนในเกมสามารถรีดประสิทธิภาพของออปชั่นนี้ได้สูงที่สุด
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {ARTIFACT_FINDER_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedFinderSubstat(opt.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedFinderSubstat === opt.id
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                      : 'bg-[#0c121c] border-[#1e2a3c] text-slate-300 hover:text-white hover:bg-[#152030]'
                  }`}
                >
                  <div className="text-xs font-black">{opt.name}</div>
                  <div className={`text-[11px] mt-0.5 line-clamp-1 ${selectedFinderSubstat === opt.id ? 'text-slate-800' : 'text-slate-400'}`}>
                    {opt.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Recommended Monsters for Selected Substat */}
          {(() => {
            const currentOption = ARTIFACT_FINDER_OPTIONS.find(o => o.id === selectedFinderSubstat) || ARTIFACT_FINDER_OPTIONS[0];
            return (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    มอนสเตอร์แนะนำสูงสุดสำหรับ: <span className="text-amber-400">{currentOption.name}</span>
                  </h3>
                  <span className="text-xs text-slate-400">แนะนำ {currentOption.monsters.length} ตัวยอดนิยม</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentOption.monsters.map((m, idx) => (
                    <div 
                      key={idx}
                      className="p-4 rounded-2xl bg-[#111927] border border-[#1e2a3c] hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-3 shadow-lg"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-black text-white">{m.name}</div>
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                            m.element === 'fire' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                            m.element === 'water' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' :
                            m.element === 'wind' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            m.element === 'light' ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/30' :
                            'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          }`}>
                            {m.element}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          {m.eff}
                        </span>
                      </div>

                      <div className="p-3 bg-[#0c121c] rounded-xl border border-[#1e2a3c]/60 text-xs text-slate-300">
                        <div className="text-[11px] text-slate-400 font-bold uppercase mb-1">เหตุผลที่เหมาะสม:</div>
                        <div>{m.role}</div>
                      </div>

                      <button
                        onClick={() => onNavigate && onNavigate('where2use', { initialMonster: m.name.split(' ')[0] })}
                        className="w-full py-2 rounded-lg bg-[#0c121c] hover:bg-[#182333] border border-[#1e2a3c] text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Compass className="w-3.5 h-3.5" />
                        <span>ตรวจสอบทีมใช้งาน (Where to Use)</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      ) : (
        <>
      {/* Monster Selector Bar */}
      <div className="bg-[#111927] border border-[#1e2a3c] p-4 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
            เลือกมอนสเตอร์ที่ต้องการ Optimize ดาเมจเสริม:
          </span>
          <span className="text-xs text-slate-400">มอนสเตอร์ที่พึ่งพา Additional Damage สูงสุด</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {POPULAR_OPTIMIZER_MONSTERS.map(m => {
            const isSelected = selectedMonsterId === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedMonsterId(m.id)}
                className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                  isSelected
                    ? 'bg-[#182538] border-orange-500 text-white shadow-md shadow-orange-500/10 ring-1 ring-orange-500/40'
                    : 'bg-[#121a28] border-[#1d2b3e] text-slate-300 hover:border-slate-500'
                }`}
              >
                <div className="w-12 h-12 rounded-lg overflow-hidden border border-[#2b3d56] flex-shrink-0 bg-black">
                  <img src={m.img} alt={m.name} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs truncate">{m.name}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{m.elementTh} • {m.archetypeTh}</div>
                  <div className="text-[11px] text-orange-400 font-mono font-semibold">{m.hitsPerAttack} ฮิต/ครั้ง</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Two-Row HUD Layout matching the user screenshot */}
      <div className="bg-[#0b121e] border border-[#1a293e] rounded-2xl p-5 sm:p-7 space-y-6 shadow-2xl">
        
        {/* Row 1: Monster Profile + Stat Sheet + Current Artifacts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-6 border-b border-[#18263a]">
          
          {/* Col A (3 cols): Monster Card */}
          <div className="lg:col-span-3 bg-[#111927] border border-[#1d2b3e] rounded-xl p-4 flex flex-col items-center text-center justify-between">
            <div className="w-full">
              <div className="text-left text-xs font-mono font-bold text-slate-400 mb-2">
                {currentMonster.name}
              </div>
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-orange-500/70 shadow-lg mx-auto bg-black relative">
                <img src={currentMonster.img} alt={currentMonster.name} className="w-full h-full object-cover" />
                <span className="absolute bottom-0 right-0 bg-black/80 text-[11px] font-mono text-orange-400 px-1.5 py-0.5 rounded-tl">
                  6★
                </span>
              </div>
              <h3 className="text-white font-bold text-base mt-2">{currentMonster.name}</h3>
              <div className="text-xs text-slate-400 mt-0.5">LEVEL 40 / 40</div>
              <div className="flex items-center justify-center gap-2 mt-2 text-xs">
                <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">
                  {currentMonster.archetypeTh}
                </span>
                <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">
                  {currentMonster.family}
                </span>
              </div>
            </div>

            <div className="mt-3 text-xs text-slate-400 bg-[#0c131f] p-2.5 rounded-lg border border-[#1a283b] w-full text-left">
              <div className="text-[11px] text-orange-400 font-mono uppercase font-bold">ลักษณะสกิล:</div>
              {currentMonster.skillDescription}
            </div>
          </div>

          {/* Col B (5 cols): Monster Base vs Final Stats Table */}
          <div className="lg:col-span-5 bg-[#111927] border border-[#1d2b3e] rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between border-b border-[#1b2a3d] pb-2">
              <span className="text-xs font-bold text-white uppercase font-mono">สเตตัส (Stat Sheet)</span>
              <span className="text-[11px] font-mono text-slate-400">Base | Final (+Rune)</span>
            </div>

            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between p-1.5 rounded bg-[#152030]">
                <span className="text-slate-300 flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-emerald-400" /> HP</span>
                <span className="text-slate-400">{currentMonster.base.hp.toLocaleString()}</span>
                <span className="text-white font-bold">{combatStats.outHp.toLocaleString()}</span>
                <span className="text-emerald-400 font-semibold">+{currentMonster.defaultRune.hp.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between p-1.5 rounded bg-[#152030]">
                <span className="text-slate-300 flex items-center gap-1.5"><Sword className="w-3.5 h-3.5 text-rose-400" /> ATK</span>
                <span className="text-slate-400">{currentMonster.base.atk.toLocaleString()}</span>
                <span className="text-white font-bold">{combatStats.outAtk.toLocaleString()}</span>
                <span className="text-emerald-400 font-semibold">+{currentMonster.defaultRune.atk.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between p-1.5 rounded bg-[#152030]">
                <span className="text-slate-300 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-blue-400" /> DEF</span>
                <span className="text-slate-400">{currentMonster.base.def.toLocaleString()}</span>
                <span className="text-white font-bold">{combatStats.outDef.toLocaleString()}</span>
                <span className="text-emerald-400 font-semibold">+{currentMonster.defaultRune.def.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between p-1.5 rounded bg-[#152030]">
                <span className="text-slate-300 flex items-center gap-1.5"><Gauge className="w-3.5 h-3.5 text-cyan-400" /> SPD</span>
                <span className="text-slate-400">{currentMonster.base.spd}</span>
                <span className="text-white font-bold">{combatStats.outSpd}</span>
                <span className="text-emerald-400 font-semibold">+{currentMonster.defaultRune.spd}</span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1 text-xs">
                <div className="bg-[#152030] p-1.5 rounded flex justify-between">
                  <span className="text-slate-400">CR Rate:</span>
                  <span className="text-white font-bold">{combatStats.cr}%</span>
                </div>
                <div className="bg-[#152030] p-1.5 rounded flex justify-between">
                  <span className="text-slate-400">CR Dmg:</span>
                  <span className="text-white font-bold">{combatStats.cd}%</span>
                </div>
                <div className="bg-[#152030] p-1.5 rounded flex justify-between">
                  <span className="text-slate-400">Resistance:</span>
                  <span className="text-white font-bold">{combatStats.res}%</span>
                </div>
                <div className="bg-[#152030] p-1.5 rounded flex justify-between">
                  <span className="text-slate-400">Accuracy:</span>
                  <span className="text-white font-bold">{combatStats.acc}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Col C (4 cols): Current Artifacts & Current Add'l Dmg */}
          <div className="lg:col-span-4 bg-[#111927] border border-[#1d2b3e] rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#1b2a3d] pb-2">
                <span className="text-xs font-bold text-white uppercase font-mono">อาร์ติแฟกต์ปัจจุบัน (Current)</span>
                <span className="text-[11px] text-cyan-400 font-mono">In-Game Equipped</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 mt-3">
                <div className="bg-[#152030] border border-[#22334a] p-2.5 rounded-lg text-center">
                  <ArtifactIcon
                    artifact={{
                      slot: 1,
                      kind: 'element',
                      element: currentMonster.element.toLowerCase(),
                      rank: 5,
                      lvl: 15,
                    }}
                    size={46}
                    className="mx-auto mb-1.5"
                  />
                  <div className="text-xs font-bold text-white truncate">{currentMonster.currentArtifacts.left.main}</div>
                  <div className="text-[11px] text-slate-400 font-mono">Eff: {currentMonster.currentArtifacts.left.eff}</div>
                </div>

                <div className="bg-[#152030] border border-[#22334a] p-2.5 rounded-lg text-center">
                  <ArtifactIcon
                    artifact={{
                      slot: 2,
                      kind: 'archetype',
                      archetype: currentMonster.archetype,
                      rank: 5,
                      lvl: 15,
                    }}
                    size={46}
                    className="mx-auto mb-1.5"
                  />
                  <div className="text-xs font-bold text-white truncate">{currentMonster.currentArtifacts.right.main}</div>
                  <div className="text-[11px] text-slate-400 font-mono">Eff: {currentMonster.currentArtifacts.right.eff}</div>
                </div>
              </div>
            </div>

            {/* Current Damage Display */}
            <div className="mt-4 pt-3 border-t border-[#1b2a3d] text-center">
              <div className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">
                ดาเมจเสริมปัจจุบัน (ADD'L DMG / HIT)
              </div>
              <div className="text-3xl font-mono font-extrabold text-indigo-300 mt-0.5">
                {currentAddlDmg.totalHit} <span className="text-xs font-normal text-slate-400">/ ฮิต</span>
              </div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">
                รวม {currentMonster.hitsPerAttack} ฮิต = <span className="text-white font-bold">{currentAddlDmg.totalMulti}</span> ดาเมจต่อการโจมตี
              </div>
            </div>
          </div>

        </div>

        {/* Row 2: Optimization Results (Best Left + Best Right = Best Combination) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase font-mono flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>ผลลัพธ์การค้นหาคู่ผสมอาร์ติแฟกต์ที่ดีที่สุด (Optimization Results)</span>
            </h3>
            <span className="text-xs text-emerald-400 font-mono font-semibold">
              สแกนอาร์ติแฟกต์ที่เข้าเกณฑ์ทั้งหมดแล้ว
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            
            {/* Current Damage Card (2 cols) */}
            <div className="lg:col-span-2 bg-[#101724] border border-[#1e2a3c] p-4 rounded-xl text-center">
              <div className="text-[11px] font-mono text-slate-400 uppercase">ดาเมจปัจจุบัน</div>
              <div className="text-2xl font-mono font-bold text-slate-300 mt-1">{currentAddlDmg.totalHit}</div>
              <div className="text-[11px] text-slate-400">Per Hit</div>
            </div>

            {/* Arrow separator */}
            <div className="hidden lg:flex lg:col-span-1 justify-center text-orange-400 font-bold text-xl">
              ➔
            </div>

            {/* Best Left Artifact (3 cols) */}
            <div className="lg:col-span-3 bg-[#131d2c] border border-amber-500/40 p-4 rounded-xl relative shadow-lg shadow-amber-500/5">
              <div className="text-[11px] font-mono text-amber-400 font-bold uppercase flex items-center justify-between">
                <span>BEST LEFT ARTIFACT (ธาตุ)</span>
                <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded text-[10px]">BEST 1</span>
              </div>

              <div className="mt-2 text-xs font-bold text-white">{optimizedArtifacts.bestLeft.main}</div>

              <div className="mt-2 space-y-1 text-xs font-mono text-slate-300">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <span>1.</span> <span>{optimizedArtifacts.bestLeft.sub1}</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <span>2.</span> <span>{optimizedArtifacts.bestLeft.sub2}</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <span>3.</span> <span>{optimizedArtifacts.bestLeft.sub3}</span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-[#1e2e42] flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">ดาเมจเฉพาะชิ้นนี้:</span>
                <span className="text-cyan-400 font-bold">{optimizedArtifacts.bestLeft.dmg} DMG</span>
              </div>
            </div>

            {/* Plus separator */}
            <div className="hidden lg:flex lg:col-span-1 justify-center text-slate-400 font-bold text-xl">
              +
            </div>

            {/* Best Right Artifact (3 cols) */}
            <div className="lg:col-span-3 bg-[#131d2c] border border-amber-500/40 p-4 rounded-xl relative shadow-lg shadow-amber-500/5">
              <div className="text-[11px] font-mono text-amber-400 font-bold uppercase flex items-center justify-between">
                <span>BEST RIGHT ARTIFACT (สาย)</span>
                <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded text-[10px]">BEST 1</span>
              </div>

              <div className="mt-2 text-xs font-bold text-white">{optimizedArtifacts.bestRight.main}</div>

              <div className="mt-2 space-y-1 text-xs font-mono text-slate-300">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <span>1.</span> <span>{optimizedArtifacts.bestRight.sub1}</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <span>2.</span> <span>{optimizedArtifacts.bestRight.sub2}</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <span>3.</span> <span>{optimizedArtifacts.bestRight.sub3}</span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-[#1e2e42] flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">ดาเมจเฉพาะชิ้นนี้:</span>
                <span className="text-cyan-400 font-bold">{optimizedArtifacts.bestRight.dmg} DMG</span>
              </div>
            </div>

            {/* Equals / Best Combination Card (2 cols) */}
            <div className="lg:col-span-2 bg-gradient-to-b from-[#1c2c44] to-[#121c2d] border-2 border-emerald-500 p-4 rounded-xl text-center shadow-xl shadow-emerald-500/10">
              <div className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                คู่ผสมที่ดีที่สุด
              </div>
              <div className="text-3xl font-mono font-black text-white mt-1">
                {optimizedArtifacts.totalHit}
              </div>
              <div className="text-[11px] text-slate-400">Per Hit</div>
              
              <div className="mt-2 pt-2 border-t border-[#233754] text-xs font-mono font-bold text-emerald-400">
                +{optimizedArtifacts.deltaHit} (+{optimizedArtifacts.deltaPercent}%)
                <span className="block text-[10px] text-slate-400 font-normal mt-0.5">vs อาร์ติแฟกต์เดิม</span>
              </div>
            </div>

          </div>
        </div>

        {/* Row 3: Battle Modifiers & Buffs Simulator Bar */}
        <div className="bg-[#111927] border border-[#1e2a3c] p-4 rounded-xl space-y-3">
          <div className="flex items-center justify-between border-b border-[#1c2738] pb-2">
            <span className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>จำลองบัฟในสมรภูมิจริง (Battle Modifiers & Combat Buffs)</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">
              สเตตัสในเกมจริง: SPD {combatStats.inSpd} • ATK {combatStats.inAtk} • HP {combatStats.inHp}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
            <label className="flex items-center gap-2 p-2 rounded bg-[#162232] border border-[#223348] cursor-pointer">
              <input
                type="checkbox"
                checked={modifiers.speedBuff}
                onChange={(e) => setModifiers(prev => ({ ...prev, speedBuff: e.target.checked }))}
                className="w-3.5 h-3.5 rounded text-cyan-500"
              />
              <span className="text-slate-200">บัฟ SPD (+33%)</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded bg-[#162232] border border-[#223348] cursor-pointer">
              <input
                type="checkbox"
                checked={modifiers.atkBuff}
                onChange={(e) => setModifiers(prev => ({ ...prev, atkBuff: e.target.checked }))}
                className="w-3.5 h-3.5 rounded text-rose-500"
              />
              <span className="text-slate-200">บัฟ ATK (+50%)</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded bg-[#162232] border border-[#223348] cursor-pointer">
              <input
                type="checkbox"
                checked={modifiers.defBuff}
                onChange={(e) => setModifiers(prev => ({ ...prev, defBuff: e.target.checked }))}
                className="w-3.5 h-3.5 rounded text-blue-500"
              />
              <span className="text-slate-200">บัฟ DEF (+70%)</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded bg-[#162232] border border-[#223348] cursor-pointer">
              <input
                type="checkbox"
                checked={modifiers.towersEnabled}
                onChange={(e) => setModifiers(prev => ({ ...prev, towersEnabled: e.target.checked }))}
                className="w-3.5 h-3.5 rounded text-amber-500"
              />
              <span className="text-slate-200">เสา Glory ตัน</span>
            </label>

            <div className="flex items-center gap-1.5 p-2 rounded bg-[#162232] border border-[#223348] col-span-2 sm:col-span-3">
              <span className="text-slate-400 text-xs">ลีดเดอร์ SPD:</span>
              {[0, 19, 24, 33].map(val => (
                <button
                  key={val}
                  onClick={() => setModifiers(prev => ({ ...prev, leaderSpd: val }))}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-colors ${
                    modifiers.leaderSpd === val ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {val === 0 ? 'None' : `+${val}%`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4 Pillars at the bottom matching the banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div className="bg-[#101724] border border-[#1e2a3c] p-3.5 rounded-xl flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white uppercase font-mono">SCAN & COMPARE</div>
              <p className="text-xs text-slate-400 mt-0.5">
                สแกนและเปรียบเทียบทุกอาร์ติแฟกต์ในคลังที่มอนสเตอร์ใส่ได้
              </p>
            </div>
          </div>

          <div className="bg-[#101724] border border-[#1e2a3c] p-3.5 rounded-xl flex items-start gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white uppercase font-mono">ALL MODIFIERS INCLUDED</div>
              <p className="text-xs text-slate-400 mt-0.5">
                คำนวณรวมเสาอารีน่า บัฟดาบ บัฟสปีด และลีดเดอร์ในเกม
              </p>
            </div>
          </div>

          <div className="bg-[#101724] border border-[#1e2a3c] p-3.5 rounded-xl flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white uppercase font-mono">SEE THE BEST COMBINATION</div>
              <p className="text-xs text-slate-400 mt-0.5">
                จัดอันดับชิ้นซ้าย (ธาตุ) ชิ้นขวา (สาย) และคู่ผสมที่ดีที่สุด
              </p>
            </div>
          </div>

          <div className="bg-[#101724] border border-[#1e2a3c] p-3.5 rounded-xl flex items-start gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white uppercase font-mono">MAXIMIZE YOUR DAMAGE</div>
              <p className="text-xs text-slate-400 mt-0.5">
                รีดดาเมจเสริมแท้ทะลุเกราะได้สูงสุดในทุกการโจมตี
              </p>
            </div>
          </div>
        </div>

      </div>
      </>
      )}
    </div>
  );
}
