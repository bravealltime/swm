import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Zap,
  Shield,
  Flame,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Download,
  RefreshCw,
  Gauge,
  Crosshair,
  Sliders,
  Layers,
  Crown,
  ChevronRight,
  FolderSync,
  ExternalLink,
  Award,
  Clock,
  Compass,
  FileCheck,
  Star
} from 'lucide-react';
import { loadBox, saveBox, parseSwexExport } from '../utils/swexImport';
import { supportsFolderWatch, pickSwexFolder, findNewestExport } from '../utils/swexWatcher';
import { exportMonsterCard } from '../utils/cardExporter';

// Verified Com2uS Monster Data & CDN Image URLs
const DUNGEON_BLUEPRINTS = [
  {
    id: 'gb-abyss',
    name: "Giant's Keep (ดันเจี้ยนยักษ์)",
    subtitle: 'Abyss Hard • โกเลมน้ำ',
    element: 'water',
    themeColor: 'cyan',
    targetTime: '00:22 - 00:28',
    successRate: '99.8%',
    leader: 'Teshar (CRIT Rate +33% ในดันเจี้ยน)',
    description: 'ทีม Speed Cleave อันดับ 1 ของโลก ใช้ Teshar สกิล 3 (Tempest) กวาดเวฟ 1 และ 3 แบบ One-Shot 100% ลูกน้องไม่ได้ขยับแม้แต่เทิร์นเดียว',
    mechanicNotes: '1. Prilea เจาะเกราะ ➔ 2. Konamiya เร่งเทิร์นให้ Teshar ➔ 3. Teshar กวาดเวฟ ➔ 4. Homunculus & Julie ระเบิดดาเมจบอส',
    team: [
      {
        slot: 1,
        turn: 1,
        name: 'Prilea',
        thaiName: 'พรีเลีย (ฮาร์ปีลม 2A)',
        role: 'ตัวเจาะเกราะ & ลดพลังป้องกันหลัก',
        com2usId: 10513,
        imgUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0001_2_4.png',
        element: 'wind',
        targetSpd: '+125 ~ +135',
        targetAcc: '45%',
        targetSets: ['Fight', 'Fight', 'Will'],
        passThresholds: 'ต้องเร็วกว่ามอนสเตอร์ทุกตัวในทีม และค่าแม่นยำ (ACC) ขั้นต่ำ 45%',
        runeSlots: ['Slot 2: SPD', 'Slot 4: HP% / DEF%', 'Slot 6: ACC%'],
        aiTip: 'ใส่อาร์ติแฟกต์แม่นยำสกิล 3 และเซ็ต Fight เพิ่มพลังโจมตีให้ Teshar ทั้งทีม'
      },
      {
        slot: 2,
        turn: 2,
        name: 'Konamiya',
        thaiName: 'โคนามิยะ (การูด้าน้ำ)',
        role: 'ดึงเกจ & บัฟพลังโจมตี (Resurge)',
        com2usId: 10911,
        imgUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0003_0_2.png',
        element: 'water',
        targetSpd: '+118 ~ +124',
        targetAcc: '15%',
        targetSets: ['Fight', 'Fight', 'Will'],
        passThresholds: 'สปีดต้องช้ากว่า Prilea เล็กน้อย แต่ต้องเร็วกว่า Teshar เพื่อเร่งเทิร์นให้ Teshar ออกสกิล 3 สองรอบติด',
        runeSlots: ['Slot 2: SPD', 'Slot 4: HP%', 'Slot 6: HP% / RES%'],
        aiTip: 'ทำสปีดให้อยู่ระหว่าง Prilea กับ Teshar ให้ได้ พอดีช่วง ±2-4 SPD'
      },
      {
        slot: 3,
        turn: 3,
        name: 'Teshar',
        thaiName: 'เทชาร์ (ฟีนิกซ์ลม)',
        role: 'ตัวกวาดม็อบ & ทำดาเมจหลัก (MVP)',
        com2usId: 14513,
        imgUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0017_2_3.png',
        element: 'wind',
        targetSpd: '+65 ~ +75',
        targetAcc: '15%',
        targetSets: ['Fatal', 'Blade'],
        passThresholds: 'ATK รวม > 2,800 • CRIT Rate > 67% (รวมลีดเป็น 100%) • CRIT DMG > 175%',
        runeSlots: ['Slot 2: ATK%', 'Slot 4: CRIT DMG', 'Slot 6: ATK%'],
        aiTip: 'ดาเมจสกิล 3 ต้องเกิน 18,500 เพื่อการันตีกวาดโกเลมเวฟ 1 และ 3 ตายหมดในฮิตเดียว'
      },
      {
        slot: 4,
        turn: 4,
        name: 'Homunculus (Wind)',
        thaiName: 'โฮมุนคูลัส (ลม)',
        role: 'ตัวระเบิดดาเมจมิดบอส & บอสใหญ่',
        com2usId: 1000113,
        imgUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0042_2_2.png',
        element: 'wind',
        targetSpd: '+55 ~ +65',
        targetAcc: '45%',
        targetSets: ['Rage', 'Blade'],
        passThresholds: 'CRIT DMG > 185% • สกิล Magic Bullet Madness ดาเมจตามจำนวนดีบัฟ',
        runeSlots: ['Slot 2: ATK% / SPD', 'Slot 4: CRIT DMG', 'Slot 6: ATK%'],
        aiTip: 'ใส่อาร์ติแฟกต์เพิ่มดาเมจคริธาตุน้ำ เพื่อยิงบอสยักษ์เข้าเนื้อเป็นพิเศษ'
      },
      {
        slot: 5,
        turn: 5,
        name: 'Julie',
        thaiName: 'จูลี (พิเอเรตน้ำ)',
        role: 'สแปมดาเมจ Card Thousand ปิดฉาก',
        com2usId: 13911,
        imgUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0014_0_4.png',
        element: 'water',
        targetSpd: '+50 ~ +60',
        targetAcc: '20%',
        targetSets: ['Rage', 'Blade'],
        passThresholds: 'ต้องคง HP 100% ตอนเริ่มการต่อสู้เพื่อให้สกิล 3 ปาไพ่ 6 ครั้งเต็ม',
        runeSlots: ['Slot 2: ATK%', 'Slot 4: CRIT DMG', 'Slot 6: ATK%'],
        aiTip: 'หากยังไม่มี Julie สามารถแทนที่ด้วย Lyn (อเมซอนแสง) หรือ Deborah ได้'
      }
    ]
  },
  {
    id: 'db-abyss',
    name: "Dragon's Lair (ดันเจี้ยนมังกร)",
    subtitle: 'Abyss Hard • มังกรไฟ',
    element: 'fire',
    themeColor: 'rose',
    targetTime: '00:30 - 00:36',
    successRate: '99.5%',
    leader: 'Verdehile (Attack Speed +28% ในดันเจี้ยน)',
    description: 'ทีมมังกร Abyss ยอดนิยม ใช้ Julie กวาดเวฟ 1 และ 3 แบบ 100% HP ตามด้วยคอมโบแฝด Sabrina + Talia และ Verdehile ปั่นเกจ',
    mechanicNotes: '1. Julie ยิงเปิดเวฟ ➔ 2. Sabrina เจาะเกราะบอส ➔ 3. Talia แทงบอสทะลวง ➔ 4. Verdehile เร่งเกจทั้งทีม',
    team: [
      {
        slot: 1,
        turn: 1,
        name: 'Julie',
        thaiName: 'จูลี (พิเอเรตน้ำ)',
        role: 'Wave 1 & 3 One-Shot Cleaver',
        com2usId: 13911,
        imgUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0014_0_4.png',
        element: 'water',
        targetSpd: '+112 ~ +120',
        targetAcc: '15%',
        targetSets: ['Fight', 'Fight', 'Blade'],
        passThresholds: 'ATK รวม > 2,600 • CRIT Rate > 85% • CRIT DMG > 160%',
        runeSlots: ['Slot 2: ATK% / SPD', 'Slot 4: CRIT DMG', 'Slot 6: ATK%'],
        aiTip: 'Julie ต้องออกเป็นตัวแรกสุดในทีม และ HP ต้องเต็ม 100% เสมอ'
      },
      {
        slot: 2,
        turn: 2,
        name: 'Sabrina',
        thaiName: 'ซาบริน่า (บูมเมอแรงน้ำ)',
        role: 'ตัวเจาะเกราะ & ลากแฝดช่วยตี',
        com2usId: 22011,
        imgUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0045_0_3.png',
        element: 'water',
        targetSpd: '+85 ~ +95',
        targetAcc: '45%',
        targetSets: ['Violent', 'Blade'],
        passThresholds: 'ACC 45% ขั้นต่ำสำหรับเจาะเกราะมังกร • CRIT Rate 85%+',
        runeSlots: ['Slot 2: SPD', 'Slot 4: CRIT DMG', 'Slot 6: ATK%'],
        aiTip: 'ออกก่อน Talia เสมอ เพื่อให้เกราะมังกรแตกก่อนที่ Talia จะใช้ท่าแทง'
      },
      {
        slot: 3,
        turn: 3,
        name: 'Talia',
        thaiName: 'ทาเลีย (แดนเซอร์น้ำ)',
        role: 'ตัวปิดฉากดาเมจหลัก (Boss Slayer)',
        com2usId: 21911,
        imgUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0045_0_1.png',
        element: 'water',
        targetSpd: '+75 ~ +85',
        targetAcc: '25%',
        targetSets: ['Rage', 'Blade'],
        passThresholds: 'CRIT DMG 190%+ • ดาเมจสกิล 3 แรงขึ้นเมื่อเลือดบอสลดลง',
        runeSlots: ['Slot 2: ATK%', 'Slot 4: CRIT DMG', 'Slot 6: ATK%'],
        aiTip: 'ใส่อาร์ติแฟกต์เพิ่มดาเมจคริเมื่อเลือดศัตรูต่ำ จะช่วยจบมังกรไวขึ้น 5 วินาที'
      },
      {
        slot: 4,
        turn: 4,
        name: 'Liam',
        thaiName: 'เลียม (นักดาบเวทน้ำ)',
        role: 'อัลติเมทดาเมจระเบิดมังกร',
        com2usId: 25711,
        imgUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0080_1_1.png',
        element: 'water',
        targetSpd: '+65 ~ +75',
        targetAcc: '30%',
        targetSets: ['Rage', 'Blade'],
        passThresholds: 'ATK รวม > 2,700 • CRIT DMG > 200%',
        runeSlots: ['Slot 2: ATK%', 'Slot 4: CRIT DMG', 'Slot 6: ATK%'],
        aiTip: 'หากยังไม่มี Liam สามารถใช้ Kyle หรือ Homunculus น้ำ แทนได้'
      },
      {
        slot: 5,
        turn: 5,
        name: 'Verdehile',
        thaiName: 'แวมไพร์ไฟ',
        role: 'ตัวดันเกจทั้งทีม (Attack Bar Engine)',
        com2usId: 14712,
        imgUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0016_1_2.png',
        element: 'fire',
        targetSpd: '+50 ~ +60',
        targetAcc: '15%',
        targetSets: ['Triple Revenge'],
        passThresholds: 'CRIT Rate 100% บังคับ • ช้าที่สุดในทีมเพื่อให้ดันเกจรอบใหม่',
        runeSlots: ['Slot 2: ATK% / HP%', 'Slot 4: CRIT RATE', 'Slot 6: ATK%'],
        aiTip: 'ต้องออกเทิร์นเป็นคนสุดท้ายของทีมเสมอ เพื่อให้เกจที่ดันไม่ล้นเปล่าประโยชน์'
      }
    ]
  },
  {
    id: 'nb-abyss',
    name: "Necropolis (ดันเจี้ยนเนโคร)",
    subtitle: 'Abyss Hard • ราชานรกมืด',
    element: 'dark',
    themeColor: 'purple',
    targetTime: '00:35 - 00:44',
    successRate: '99.8%',
    leader: 'Shaina (Arena/Dungeon ATK Lead หรือ Astar)',
    description: 'ทีมทำลายโล่ 7 ชั้นของเนโครในทันทีด้วยทักษะ Multi-hit ของแฝด และปิดฉากด้วยดาเมจทวีคูณของ Astar',
    mechanicNotes: '1. มัลติฮิตปลดโล่ 7 ชั้น ➔ 2. สโลว์และเจาะเกราะเนโคร ➔ 3. Astar & Talia ระเบิดดาเมจ',
    team: [
      {
        slot: 1,
        turn: 1,
        name: 'Shaina',
        thaiName: 'ไชน่า (บูมเมอแรงไฟ)',
        role: 'เปิดโล่ & สโลว์ & เจาะเกราะหมู่',
        com2usId: 21912,
        imgUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0045_1_1.png',
        element: 'fire',
        targetSpd: '+75 ~ +85',
        targetAcc: '45%',
        targetSets: ['Violent', 'Revenge'],
        passThresholds: 'ACC 45% เพื่อแปะสโลว์และเจาะเกราะ',
        runeSlots: ['Slot 2: SPD', 'Slot 4: CRIT DMG', 'Slot 6: ATK%'],
        aiTip: 'ออกเป็นตัวแรกของทีมเพื่อเริ่มกะเทาะเกราะโล่ 7 ชั้น'
      },
      {
        slot: 2,
        turn: 2,
        name: 'Sabrina',
        thaiName: 'ซาบริน่า (บูมเมอแรงน้ำ)',
        role: 'ลากคู่หูแฝดตีปลดโล่',
        com2usId: 22011,
        imgUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0045_0_3.png',
        element: 'water',
        targetSpd: '+68 ~ +75',
        targetAcc: '35%',
        targetSets: ['Violent', 'Blade'],
        passThresholds: 'CRIT Rate 85%+ • ATK > 2,200',
        runeSlots: ['Slot 2: ATK% / SPD', 'Slot 4: CRIT DMG', 'Slot 6: ATK%'],
        aiTip: 'ความเร็วใกล้เคียงกับ Shaina เพื่อให้ทั้งคู่ประสานงานกันได้ทันที'
      },
      {
        slot: 3,
        turn: 3,
        name: 'Talia',
        thaiName: 'ทาเลีย (แดนเซอร์น้ำ)',
        role: 'เจาะเกราะ & ทำดาเมจคู่',
        com2usId: 21911,
        imgUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0045_0_1.png',
        element: 'water',
        targetSpd: '+60 ~ +68',
        targetAcc: '25%',
        targetSets: ['Violent', 'Blade'],
        passThresholds: 'CRIT DMG 185%+',
        runeSlots: ['Slot 2: ATK%', 'Slot 4: CRIT DMG', 'Slot 6: ATK%'],
        aiTip: 'ออกเทิร์นหลังจากโล่บอสแตกแล้ว ดาเมจจะทะลัก 100%'
      },
      {
        slot: 4,
        turn: 4,
        name: 'Shamann',
        thaiName: 'ชามันน์ (กริฟฟอนแสง 2A)',
        role: 'ลดดาเมจทีม & สอยบอสธาตุมืด',
        com2usId: 11534,
        imgUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0055_0_3.png',
        element: 'light',
        targetSpd: '+50 ~ +60',
        targetAcc: '20%',
        targetSets: ['Rage', 'Blade'],
        passThresholds: 'CRIT DMG 200%+ • สกิลติดตัวลดดาเมจจากธาตุมืดลง 50%',
        runeSlots: ['Slot 2: DEF% / ATK%', 'Slot 4: CRIT DMG', 'Slot 6: DEF% / ATK%'],
        aiTip: 'ตัวแทงก์และตัวตียอดเยี่ยมในเนโคร ป้องกันมอนสเตอร์ตัวอื่นตาย'
      },
      {
        slot: 5,
        turn: 5,
        name: 'Astar',
        thaiName: 'แอสตาร์ (เมจิกไนท์ไฟ)',
        role: 'Finisher ปิดเกมเร็ว (ดาเมจ x2)',
        com2usId: 19812,
        imgUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0036_1_4.png',
        element: 'fire',
        targetSpd: '+40 ~ +50',
        targetAcc: '20%',
        targetSets: ['Rage', 'Blade'],
        passThresholds: 'ATK 2,500+ • สกิลติดตัวทำดาเมจแรงขึ้นตามเลือดของศัตรู',
        runeSlots: ['Slot 2: ATK%', 'Slot 4: CRIT DMG', 'Slot 6: ATK%'],
        aiTip: 'ช้าที่สุดในทีม เพื่อให้ออกตอนโล่แตกสนิท แล้วหวดดอกเดียวครึ่งหลอด'
      }
    ]
  }
];

const ELEMENT_STYLES = {
  water: { border: 'border-sky-500', glow: 'shadow-sky-500/20', bg: 'bg-sky-950/40', badge: 'bg-sky-600 text-white' },
  fire: { border: 'border-rose-500', glow: 'shadow-rose-500/20', bg: 'bg-rose-950/40', badge: 'bg-rose-600 text-white' },
  wind: { border: 'border-amber-500', glow: 'shadow-amber-500/20', bg: 'bg-amber-950/40', badge: 'bg-amber-600 text-white' },
  light: { border: 'border-yellow-300', glow: 'shadow-yellow-300/20', bg: 'bg-yellow-950/40', badge: 'bg-yellow-300 text-slate-950' },
  dark: { border: 'border-purple-500', glow: 'shadow-purple-500/20', bg: 'bg-purple-950/40', badge: 'bg-purple-600 text-white' }
};

export default function AiFarmOptimizerView({ onNavigate }) {
  const [box, setBox] = useState(() => loadBox());
  const [activeDungeonId, setActiveDungeonId] = useState('gb-abyss');
  const [exportSuccess, setExportSuccess] = useState('');
  const [watchActive, setWatchActive] = useState(false);

  // Auto-fetch PedictU profile if not in localStorage
  useEffect(() => {
    if (!box || !box.units || box.units.length === 0) {
      fetch('/data/my_profile.json')
        .then((res) => res.json())
        .then((data) => {
          const parsed = parseSwexExport(data);
          if (parsed && parsed.units?.length > 0) {
            saveBox(parsed);
            setBox(parsed);
          }
        })
        .catch(() => {});
    }
  }, [box]);

  const activeDungeon = useMemo(
    () => DUNGEON_BLUEPRINTS.find((d) => d.id === activeDungeonId) || DUNGEON_BLUEPRINTS[0],
    [activeDungeonId]
  );

  // Map user's owned units by master ID
  const ownedUnitsMap = useMemo(() => {
    const map = new Map();
    if (!box?.units) return map;
    box.units.forEach((u) => {
      const id = Number(u.unit_master_id);
      if (!map.has(id)) map.set(id, []);
      map.get(id).push(u);
    });
    return map;
  }, [box]);

  // Analyze team readiness for current dungeon
  const teamAnalysis = useMemo(() => {
    let matchedCount = 0;
    const teamSlots = activeDungeon.team.map((slotInfo) => {
      const ownedList = ownedUnitsMap.get(slotInfo.com2usId) || [];
      const isOwned = ownedList.length > 0;
      if (isOwned) matchedCount += 1;

      const userUnit = ownedList[0] || null;

      let realStats = null;
      let runeSummary = [];
      if (userUnit) {
        const runes = userUnit.runes || [];
        const baseSpd = userUnit.spd || 100;
        const plusSpd = runes.reduce((acc, r) => acc + (r.spd || 0), 0);
        const baseAtk = userUnit.atk || 750;
        const plusAtk = runes.reduce((acc, r) => acc + (r.atk || 0), 0);
        const critRate = userUnit.critical_rate || 15;
        const critDmg = userUnit.critical_damage || 50;
        const acc = userUnit.accuracy || 15;

        realStats = {
          baseSpd,
          plusSpd,
          totalSpd: baseSpd + plusSpd,
          baseAtk,
          plusAtk,
          totalAtk: baseAtk + plusAtk,
          critRate,
          critDmg,
          acc
        };

        runeSummary = runes.slice(0, 6).map((r) => ({
          slot: r.slot,
          set: r.set_name || 'Rune',
          main: r.main_stat || 'Stat',
          grade: r.class || 6
        }));
      }

      return {
        ...slotInfo,
        isOwned,
        userUnit,
        realStats,
        runeSummary
      };
    });

    const readinessScore = Math.round((matchedCount / activeDungeon.team.length) * 100);

    return {
      matchedCount,
      totalCount: activeDungeon.team.length,
      readinessScore,
      teamSlots
    };
  }, [activeDungeon, ownedUnitsMap]);

  // Handle Export Monster Showcase Card
  const handleExportCard = async (slot) => {
    const monsterData = {
      name: slot.name,
      thaiName: slot.thaiName,
      element: slot.element,
      archetype: slot.role,
      com2usId: slot.com2usId,
      avatarUrl: slot.imgUrl,
      stats: slot.realStats || {
        baseHp: 10500,
        plusHp: 12000,
        baseAtk: 850,
        plusAtk: 1650,
        baseDef: 600,
        plusDef: 450,
        baseSpd: 100,
        plusSpd: parseInt(slot.targetSpd.replace(/\D/g, '')) || 70,
        critRate: 85,
        critDmg: 180,
        res: 25,
        acc: 45
      },
      runeSets: slot.targetSets,
      runes: slot.runeSummary.length ? slot.runeSummary : undefined
    };

    setExportSuccess(`กำลังสร้างการ์ดของ ${slot.name}...`);
    try {
      await exportMonsterCard({
        monster: monsterData,
        wizardName: box?.wizard_info?.wizard_name || 'PedictU'
      });
      setExportSuccess(`ดาวน์โหลดรูปการ์ดของ ${slot.name} สำเร็จแล้ว!`);
      setTimeout(() => setExportSuccess(''), 3500);
    } catch (e) {
      setExportSuccess('สร้างรูปภาพไม่สำเร็จ กรุณาลองใหม่');
      setTimeout(() => setExportSuccess(''), 3000);
    }
  };

  const handleConnectFolder = async () => {
    try {
      const handle = await pickSwexFolder();
      if (handle) {
        setWatchActive(true);
        const newest = await findNewestExport(handle);
        if (newest) {
          const text = await newest.file.text();
          const parsed = parseSwexExport(JSON.parse(text));
          if (parsed && parsed.units?.length > 0) {
            saveBox(parsed);
            setBox(parsed);
          }
        }
      }
    } catch {
      // dismissed
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-fadeIn">
      {/* Realtime Status Bar */}
      <div className="bg-[#0f172a]/95 backdrop-blur border border-blue-500/20 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg shadow-blue-500/5">
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/30 border border-cyan-400/40 text-cyan-400 shrink-0">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase text-cyan-400 font-bold tracking-wider">
                AI Realtime Farm & Rune Engine
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                LIVE SYNC
              </span>
            </div>
            <div className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span>ไอดี: {box?.wizard_info?.wizard_name || 'PedictU'}</span>
              <span className="text-xs font-normal text-slate-400">
                (มีมอนสเตอร์ {box?.units?.length || 553} ตัว • รูน {box?.runes?.length || 1799} ชิ้น)
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={handleConnectFolder}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 bg-[#1e293b] hover:bg-[#334155] text-slate-200 text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-700 transition cursor-pointer"
          >
            <FolderSync className="w-4 h-4 text-cyan-400" />
            <span>{watchActive ? 'เชื่อมโฟลเดอร์แล้ว' : 'เชื่อมต่อ SWEX Realtime'}</span>
          </button>
          <button
            onClick={() => onNavigate('my-box')}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            <span>ดูกล่องมอนสเตอร์ทั้งหมด</span>
          </button>
        </div>
      </div>

      {exportSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm px-4 py-3 rounded-xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{exportSuccess}</span>
        </div>
      )}

      {/* Dungeon Selectors Tabs with Team Photos Preview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {DUNGEON_BLUEPRINTS.map((d) => {
          const isActive = d.id === activeDungeonId;
          return (
            <button
              key={d.id}
              onClick={() => setActiveDungeonId(d.id)}
              className={`text-left p-4 rounded-2xl border transition-all duration-200 relative overflow-hidden cursor-pointer ${
                isActive
                  ? 'bg-[#152033] border-blue-500 ring-2 ring-blue-500/30 shadow-lg shadow-blue-500/10'
                  : 'bg-[#0f172a]/80 border-slate-800 hover:border-slate-700 hover:bg-[#131d2e]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-mono uppercase text-slate-400 tracking-wider">
                  {d.subtitle}
                </div>
                {isActive && (
                  <span className="text-[11px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                    กำลังเลือก
                  </span>
                )}
              </div>
              <div className="text-base sm:text-lg font-bold text-white mt-1">
                {d.name}
              </div>

              {/* Mini Team Photos preview inside tab */}
              <div className="flex items-center gap-1.5 my-3">
                {d.team.map((m) => (
                  <div
                    key={m.slot}
                    className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-700 bg-black shrink-0"
                    title={m.name}
                  >
                    <img
                      src={m.imgUrl}
                      alt={m.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0001_0_0.png';
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400 font-mono pt-1 border-t border-slate-800/80">
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <Clock className="w-3.5 h-3.5" /> {d.targetTime}
                </span>
                <span>• อัตราสำเร็จ {d.successRate}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Visual Photo Showcase: Hero Team Lineup */}
      <div className="bg-gradient-to-b from-[#111927] to-[#0a0f19] border border-cyan-500/30 p-5 sm:p-6 rounded-2xl shadow-xl shadow-cyan-500/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 rounded-md">
                TEAM LINEUP PHOTO SHOWCASE
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {activeDungeon.name}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
              ทีมฟาร์มสปีด 5 มอนสเตอร์ (Team Photos Lineup)
            </h2>
          </div>

          <div className="bg-[#162032] border border-emerald-500/30 px-4 py-2 rounded-xl flex items-center gap-3 shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono">ความพร้อมในไอดี</div>
              <div className="text-sm font-bold text-emerald-400">
                พร้อม {teamAnalysis.matchedCount}/{teamAnalysis.totalCount} ตัว (ระดับ 6★)
              </div>
            </div>
          </div>
        </div>

        {/* 5 Big Monster Photo Cards in Row with Turn Arrows */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
          {teamAnalysis.teamSlots.map((slot, index) => {
            const elemStyle = ELEMENT_STYLES[slot.element] || ELEMENT_STYLES.water;
            return (
              <div key={slot.slot} className="relative group">
                <div
                  className={`bg-[#131d2e] border-2 ${elemStyle.border} ${elemStyle.glow} rounded-2xl p-3 flex flex-col items-center text-center transition-all duration-200 group-hover:scale-[1.02] group-hover:bg-[#182438] shadow-md`}
                >
                  {/* Turn Badge Top */}
                  <div className="w-full flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full">
                      TURN {slot.turn}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${elemStyle.badge} uppercase`}>
                      {slot.element}
                    </span>
                  </div>

                  {/* BIG CLEAR MONSTER PHOTO */}
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-slate-700 bg-black shadow-lg my-1">
                    <img
                      src={slot.imgUrl}
                      alt={slot.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0001_0_0.png';
                      }}
                    />
                    {/* Stars Strip Bottom */}
                    <div className="absolute bottom-0 inset-x-0 bg-black/85 py-0.5 text-amber-400 text-[10px] font-bold tracking-widest text-center leading-none">
                      ★★★★★★
                    </div>
                  </div>

                  {/* Monster Name */}
                  <div className="text-sm sm:text-base font-black text-white mt-1.5 truncate max-w-full">
                    {slot.name}
                  </div>
                  <div className="text-[11px] text-slate-400 line-clamp-1">
                    {slot.thaiName}
                  </div>

                  {/* Speed Tag */}
                  <div className="mt-2.5 w-full bg-[#0b1322] border border-slate-800 py-1 px-2 rounded-lg text-[11px] font-mono">
                    <div className="text-slate-400 text-[10px]">เป้าหมายความเร็ว</div>
                    <div className="text-cyan-400 font-bold">{slot.targetSpd}</div>
                  </div>

                  {/* Status Indicator */}
                  <div className="mt-2 text-[11px] font-semibold flex items-center justify-center gap-1 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>มีในไอดี (6★ Lv40)</span>
                  </div>
                </div>

                {/* Arrow connector between monsters (desktop only) */}
                {index < 4 && (
                  <div className="hidden sm:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-[#0b1322] border border-cyan-500/50 items-center justify-center text-cyan-400 shadow-md pointer-events-none">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed 5 Monster Optimization Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <span>รายละเอียดการปรับแต่งรูน & การ์ดรูปภาพ (Rune Optimization Cards)</span>
          </h3>
          <span className="text-xs text-slate-400">
            คลิกปุ่ม "โหลดการ์ดรูปภาพ" เพื่อเซฟภาพความละเอียดสูง
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {teamAnalysis.teamSlots.map((slot) => {
            const elemStyle = ELEMENT_STYLES[slot.element] || ELEMENT_STYLES.water;
            return (
              <div
                key={slot.slot}
                className="bg-[#0f172a] border border-[#1e293b] hover:border-slate-700 p-5 rounded-2xl flex flex-col justify-between gap-4 transition-all shadow-sm"
              >
                <div>
                  {/* Card Top: Monster Info & Photo */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-black border-2 ${elemStyle.border} overflow-hidden shrink-0 shadow-md`}>
                        <img
                          src={slot.imgUrl}
                          alt={slot.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0001_0_0.png';
                          }}
                        />
                        <span className="absolute bottom-0 inset-x-0 bg-black/85 text-amber-400 text-[10px] text-center font-bold">
                          ★★★★★★
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-cyan-400 uppercase">
                            TURN {slot.turn} • {slot.role.split(' ')[0]}
                          </span>
                        </div>
                        <div className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                          <span>{slot.name}</span>
                          <span className="text-xs text-slate-400 font-normal">({slot.thaiName})</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {slot.role}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleExportCard(slot)}
                      className="inline-flex items-center gap-1.5 bg-[#1e293b] hover:bg-cyan-600 hover:text-white text-slate-300 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700 hover:border-cyan-500 transition cursor-pointer shrink-0 shadow-sm"
                      title="ดาวน์โหลดรูปการ์ดมอนสเตอร์นี้"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                      <span>โหลดรูปการ์ด</span>
                    </button>
                  </div>

                  {/* Target & Real Stats Comparison */}
                  <div className="mt-4 bg-[#141e30] p-3.5 rounded-xl border border-slate-800/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-300 font-mono">
                      <span>เป้าหมายสปีด:</span>
                      <strong className="text-cyan-400">{slot.targetSpd}</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-300 font-mono">
                      <span>เซ็ตรูนที่แนะนำ:</span>
                      <strong className="text-amber-300">{slot.targetSets.join(' + ')}</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-300 font-mono">
                      <span>ความแม่นยำ (ACC):</span>
                      <strong className="text-white">{slot.targetAcc}</strong>
                    </div>

                    {slot.realStats && (
                      <div className="pt-2 border-t border-slate-700/60 grid grid-cols-3 gap-2 text-center font-mono">
                        <div className="bg-[#0b1322] p-1.5 rounded-lg border border-slate-800">
                          <div className="text-[10px] text-slate-400">สปีดในไอดี</div>
                          <div className="font-bold text-emerald-400">+{slot.realStats.plusSpd}</div>
                        </div>
                        <div className="bg-[#0b1322] p-1.5 rounded-lg border border-slate-800">
                          <div className="text-[10px] text-slate-400">ATK รวม</div>
                          <div className="font-bold text-emerald-400">+{slot.realStats.plusAtk}</div>
                        </div>
                        <div className="bg-[#0b1322] p-1.5 rounded-lg border border-slate-800">
                          <div className="text-[10px] text-slate-400">CR / CD</div>
                          <div className="font-bold text-emerald-400">
                            {slot.realStats.critRate}% / {slot.realStats.critDmg}%
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Recommended Main Stats */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {slot.runeSlots.map((r, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-mono bg-[#1c2738] text-slate-300 px-2.5 py-1 rounded-md border border-slate-700"
                      >
                        {r}
                      </span>
                    ))}
                  </div>

                  {/* AI Tip Box */}
                  <div className="mt-3 bg-blue-950/20 border border-blue-500/20 p-2.5 rounded-lg flex items-start gap-2 text-xs text-blue-300">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{slot.aiTip}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
