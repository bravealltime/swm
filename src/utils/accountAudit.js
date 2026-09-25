/**
 * SWM Account Audit & Diagnosis Engine
 * Evaluates real box statistics: Swift tiers, Violent quality, Meta coverage,
 * and generates an actionable health report and farming priority.
 */
import { getMonsterCatalogInfo, baseAwakenedId } from './swexImport.js';

// Top 30 Meta Monsters in Guardian RTA & Siege
export const CORE_META_MONSTERS = [
  { id: 24713, name: 'Oliver', thaiName: 'โอลิเวอร์ (กังฟูไม้เท้าลม)', element: 'wind', tier: 'SSS', role: 'Speed Lead & Cooldown Reset' },
  { id: 25713, name: 'Sagar', thaiName: 'ซาก้าร์ (สไตรเกอร์ลม)', element: 'wind', tier: 'SSS', role: 'Strip & Taunt Control' },
  { id: 24411, name: 'Haegang', thaiName: 'แฮกัง (ชงปาร์ตี้/แก้คลีนส์)', element: 'water', tier: 'SSS', role: 'Passive ATB Boost on Debuff' },
  { id: 13412, name: 'Vanessa', thaiName: 'วาเนสซ่า (วาลคีรี่ไฟ)', element: 'fire', tier: 'SS', role: '33% SPD Lead & Revive' },
  { id: 24211, name: 'Moore', thaiName: 'มัวร์ (สไตรเกอร์น้ำ)', element: 'water', tier: 'SS', role: '24% SPD Lead & Despair Strip' },
  { id: 16111, name: 'Chow', thaiName: 'เชา (ดราก้อนไนท์น้ำ)', element: 'water', tier: 'SS', role: 'Self Cleanse Bruiser' },
  { id: 13811, name: 'Camilla', thaiName: 'คามิลล่า (วาลคีรี่น้ำ)', element: 'water', tier: 'SSS', role: 'Solo Carry & Tank' },
  { id: 10412, name: 'Racuni', thaiName: 'ราคูนี่ (ฮาร์กไฟ)', element: 'fire', tier: 'SSS', role: 'Turn Cycling & Heal Cleanse' },
  { id: 14611, name: 'Woosa', thaiName: 'วูซ่า (ไพโอเนียร์น้ำ)', element: 'water', tier: 'SS', role: 'Immunity & Shield' },
  { id: 21511, name: 'Amelia', thaiName: 'อเมเลีย (ยูนิคอร์นน้ำ)', element: 'water', tier: 'S', role: 'Permanent Immunity & Cleanse' },
  { id: 23713, name: 'Cheongpung', thaiName: 'ชองพุง (อาร์ตมาสเตอร์ลม)', element: 'wind', tier: 'SS', role: 'Strip, DEF Break & Cooldown' },
  { id: 20412, name: 'Garo', thaiName: 'กาโร่ (นินจาไฟ)', element: 'fire', tier: 'S', role: 'Passive Survival & Counter' },
  { id: 22812, name: 'Kaki', thaiName: 'คากิ (โอนิมูฉะไฟ)', element: 'fire', tier: 'SS', role: 'High Pure ATK Damage' },
  { id: 18812, name: 'Khmun', thaiName: 'คมุน (อนูบิสไฟ)', element: 'fire', tier: 'S', role: 'Shield & Speed Lead' },
  { id: 13812, name: 'Verdehile', thaiName: 'แวร์เดฮิล (แวมไพร์ไฟ)', element: 'fire', tier: 'SS', role: 'ATB Booster on Crit' },
  { id: 18311, name: 'Mihyang', thaiName: 'มิฮยัง (แดนเซอร์น้ำ)', element: 'water', tier: 'S', role: 'Cleanse & Strip' },
  { id: 25112, name: 'Douglas', thaiName: 'ดักลาส (สไตรเกอร์ไฟ)', element: 'fire', tier: 'SSS', role: 'Glance & Counter Sweep' },
  { id: 25113, name: 'Miles', thaiName: 'ไมลส์ (สไตรเกอร์ลม)', element: 'wind', tier: 'SS', role: 'Passive Pure SPD Damage' },
  { id: 26613, name: 'Dominic', thaiName: 'โดมินิค (เวพอนมาสเตอร์ลม)', element: 'wind', tier: 'SS', role: 'Ignore DEF Passive Damage' },
  { id: 23512, name: 'Laika', thaiName: 'ไลก้า (ดราก้อนไนท์ไฟ)', element: 'fire', tier: 'S', role: 'Stun Counter & Max Damage Cap' },
  { id: 14513, name: 'Teshar', thaiName: 'เทชาร์ (ฟีนิกซ์ลม)', element: 'wind', tier: 'S', role: 'Giant Abyss Wave Clearer' },
  { id: 13211, name: 'Sigmarus', thaiName: 'ซิกมารัส (ฟีนิกซ์น้ำ)', element: 'water', tier: 'A', role: 'Max HP Damage & Freeze' },
  { id: 18215, name: 'Veromos', thaiName: 'เวโรโมส (อิฟรีทมืด)', element: 'dark', tier: 'SS', role: 'Auto Cleanse & HP Boost' },
  { id: 14314, name: 'Loren', thaiName: 'ลอเรน (คาวเกิร์ลแสง)', element: 'light', tier: 'SS', role: 'Strip & DEF Break & Slow' },
  { id: 10631, name: 'Tarq', thaiName: 'ทาร์ค (หมาป่าน้ำ)', element: 'water', tier: 'A', role: 'Group Hunt Cycle' },
  { id: 21314, name: 'Fran', thaiName: 'ฟราน (แฟรี่ควีนแสง)', element: 'light', tier: 'S', role: 'Immunity & ATK Buff' },
  { id: 17315, name: 'Fei', thaiName: 'เฟย (กังฟูเกิร์ลมืด)', element: 'dark', tier: 'SS', role: 'Ignore DEF Speed Lead' },
  { id: 10914, name: 'Teon', thaiName: 'ทีออน (การูด้าแสง)', element: 'light', tier: 'S', role: 'Resurrect & Turn Give' },
  { id: 19203, name: 'Copper', thaiName: 'คอปเปอร์ (ลิฟวิงอาร์เมอร์ลม)', element: 'wind', tier: 'S', role: 'DEF Ignore Nuke' },
  { id: 17912, name: 'Bulldozer', thaiName: 'บูลโดเซอร์ (แฟรงเกนสไตน์ไฟ)', element: 'fire', tier: 'S', role: 'Stun & DEF Ignore Nuke' },
];

/**
 * Perform a comprehensive audit on the user box
 */
export function auditAccount(box) {
  if (!box || !Array.isArray(box.units) || box.units.length === 0) {
    return null;
  }

  const units = box.units;
  const runes = box.runes || [];
  const artifacts = box.artifacts || [];

  // 1. Basic Counts
  const totalUnits = units.length;
  const totalRunes = runes.length;
  const totalArtifacts = artifacts.length;
  const sixStarUnits = units.filter((u) => u.stars === 6);
  const nat5Units = units.filter((u) => u.naturalStars === 5);

  // 2. Speed Analysis (Fastest Swift & Speed Sets)
  const sortedBySpd = [...units]
    .map((u) => {
      const bonusSpd = (u.spd || 0) - (u.baseSpd || 0);
      const isSwift = (u.sets || []).some((s) => String(s).toLowerCase().includes('swift'));
      const isViolent = (u.sets || []).some((s) => String(s).toLowerCase().includes('violent') || String(s).toLowerCase().includes('vio'));
      const isWill = (u.sets || []).some((s) => String(s).toLowerCase().includes('will'));
      const isDespair = (u.sets || []).some((s) => String(s).toLowerCase().includes('despair'));
      return {
        ...u,
        bonusSpd,
        isSwift,
        isViolent,
        isWill,
        isDespair,
      };
    })
    .sort((a, b) => (b.spd || 0) - (a.spd || 0));

  const fastestOverall = sortedBySpd.slice(0, 8);
  const fastestSwift = sortedBySpd.filter((u) => u.isSwift).slice(0, 8);
  const fastestViolent = sortedBySpd.filter((u) => u.isViolent).slice(0, 8);

  const maxSwiftBonus = fastestSwift[0]?.bonusSpd || 0;
  const maxOverallSpd = sortedBySpd[0]?.spd || 0;

  // Swift Tiers Count
  const swiftTiers = {
    p220: units.filter((u) => (u.spd - u.baseSpd) >= 220).length,
    p210: units.filter((u) => (u.spd - u.baseSpd) >= 210).length,
    p200: units.filter((u) => (u.spd - u.baseSpd) >= 200).length,
    p190: units.filter((u) => (u.spd - u.baseSpd) >= 190).length,
    p180: units.filter((u) => (u.spd - u.baseSpd) >= 180).length,
    p160: units.filter((u) => (u.spd - u.baseSpd) >= 160).length,
  };

  // Violent Sets Quality
  const violentTiers = {
    p150: sortedBySpd.filter((u) => u.isViolent && u.bonusSpd >= 150).length,
    p140: sortedBySpd.filter((u) => u.isViolent && u.bonusSpd >= 140).length,
    p130: sortedBySpd.filter((u) => u.isViolent && u.bonusSpd >= 130).length,
    p120: sortedBySpd.filter((u) => u.isViolent && u.bonusSpd >= 120).length,
    totalVio: sortedBySpd.filter((u) => u.isViolent).length,
  };

  // 3. Rune Efficiency of Top 30 Runed Units
  const runedUnits = units.filter((u) => u.runes >= 6 && u.runeEff > 0);
  const top30Eff = runedUnits.sort((a, b) => b.runeEff - a.runeEff).slice(0, 30);
  const avgTop30Eff = top30Eff.length > 0
    ? (top30Eff.reduce((s, u) => s + u.runeEff, 0) / top30Eff.length).toFixed(1)
    : 0;

  // 4. Meta Monster Check
  const ownedIdSet = new Set();
  units.forEach((u) => {
    if (u.masterId) {
      ownedIdSet.add(Number(u.masterId));
      ownedIdSet.add(baseAwakenedId(Number(u.masterId)));
    }
    if (u.name) ownedIdSet.add(u.name.toLowerCase().trim());
  });

  const metaMatches = CORE_META_MONSTERS.map((m) => {
    const isOwned = ownedIdSet.has(m.id) || ownedIdSet.has(baseAwakenedId(m.id)) || ownedIdSet.has(m.name.toLowerCase().trim());
    const ownedUnit = isOwned ? units.find((u) => Number(u.masterId) === m.id || baseAwakenedId(Number(u.masterId)) === m.id || u.name?.toLowerCase() === m.name.toLowerCase()) : null;
    return {
      ...m,
      isOwned,
      ownedUnit,
    };
  });

  const ownedMeta = metaMatches.filter((m) => m.isOwned);
  const missingMeta = metaMatches.filter((m) => !m.isOwned);
  const metaCoveragePct = Math.round((ownedMeta.length / metaMatches.length) * 100);

  // 5. Account Grade & Score Calculation
  let score = 50; // base score

  // Speed scoring (up to +25 points)
  if (maxSwiftBonus >= 225) score += 25;
  else if (maxSwiftBonus >= 215) score += 22;
  else if (maxSwiftBonus >= 205) score += 19;
  else if (maxSwiftBonus >= 195) score += 16;
  else if (maxSwiftBonus >= 180) score += 12;
  else score += 6;

  // Rune efficiency scoring (up to +15 points)
  const effNum = Number(avgTop30Eff);
  if (effNum >= 100) score += 15;
  else if (effNum >= 95) score += 12;
  else if (effNum >= 90) score += 9;
  else if (effNum >= 85) score += 6;
  else score += 3;

  // Meta monster scoring (up to +10 points)
  score += Math.min(10, Math.round(metaCoveragePct / 10));

  score = Math.min(100, Math.max(40, score));

  // Determine Grade Badge
  let rankGrade = 'Conqueror 1-2';
  let rankGradeTh = 'คอนเคอร์เรอร์ (C1 - C2)';
  let rankBadgeColor = 'purple';
  let rankDescription = 'ไอดีมีความพร้อมในการแข่งขัน RTA ในระดับกลาง มีตัวทำเทิร์นและรูนหลักที่ใช้งานได้ดี';

  if (score >= 90 || maxSwiftBonus >= 220) {
    rankGrade = 'Guardian 2-3 (High G)';
    rankGradeTh = 'การ์เดียนระดับสูง (G2 - G3 Ready)';
    rankBadgeColor = 'amber';
    rankDescription = 'ความเร็วรูนสวิฟต์ระดับท็อป 1% (+220+ SPD) สามารถเปิดเทิร์น 1 แข่งขันกับผู้เล่นระดับประเทศได้สบาย';
  } else if (score >= 80 || maxSwiftBonus >= 205) {
    rankGrade = 'Guardian 1 (G1 Ready)';
    rankGradeTh = 'การ์เดียนระดับต้น (G1 Ready)';
    rankBadgeColor = 'yellow';
    rankDescription = 'ไอดีมีสปีดเซ็ตหลักเกิน +205 SPD และรูนไวโอเลนท์แน่น พร้อมจบขอบแดง G1 RTA';
  } else if (score >= 70 || maxSwiftBonus >= 190) {
    rankGrade = 'Conqueror 3 (C3 Star)';
    rankGradeTh = 'คอนเคอร์เรอร์ 3 ดาว (C3)';
    rankBadgeColor = 'purple';
    rankDescription = 'ไอดีอยู่ในเกณฑ์ขอบดาว C3 มีพื้นฐานทีมและรูนดีเยี่ยม สามารถดันขึ้น G1 ได้ด้วยการรีโรลรูนเพิ่มสปีด';
  }

  // 6. Recommended Farming Priority
  const farmingPriorities = [];

  if (maxSwiftBonus < 225) {
    farmingPriorities.push({
      dungeon: 'ยักษ์ (Giants Abyss Hard)',
      sets: 'Swift / Despair / Blade',
      reason: `เซ็ตสวิฟต์เร็วสุดของคุณอยู่ที่ +${maxSwiftBonus} SPD การฟาร์มยักษ์จะช่วยดันสปีดให้แตะ +225+ เพื่อรับประกันเทิร์น 1`,
      priority: 'HIGH',
      icon: 'Zap',
      color: 'amber',
    });
  }

  if (violentTiers.p140 < 10 || effNum < 98) {
    farmingPriorities.push({
      dungeon: 'มังกร (Dragons Abyss Hard)',
      sets: 'Violent / Will / Shield',
      reason: `มีเซ็ต Violent สปีด +140 อยู่ ${violentTiers.p140} เซ็ต ควรฟาร์มมังกรเพิ่มความเหนียวและเทิร์นต่อเนื่องให้สาย Bruiser`,
      priority: 'VERY_HIGH',
      icon: 'Flame',
      color: 'rose',
    });
  }

  farmingPriorities.push({
    dungeon: 'เนโคร (Necro Abyss Hard)',
    sets: 'Rage / Vampire / Nemesis / Will',
    reason: 'เสริมเซ็ต Rage ทำวันช็อต และ Nemesis ไว้ตัดเทิร์นในศึก Siege และ Arena',
    priority: 'MEDIUM',
    icon: 'Shield',
    color: 'purple',
  });

  // 7. Action Plan Checklist
  const actionPlan = [
    {
      title: `รีโรลรูนสวิฟต์สล็อต 4 และ 6 ลุ้นสปีดแตะ +${maxSwiftBonus + 4} SPD`,
      done: maxSwiftBonus >= 220,
      desc: 'ใช้หิน Reappraisal สัปดาห์ละ 3 ก้อนกับรูน Swift 6★ Legend สล็อต 4 หรือ 6 เพื่อสร้างเซ็ตเปิดเทิร์นระดับโลก',
    },
    {
      title: `แปลงหินขัดเจม (Grind/Gem) รูน Violent ของตัวตั้งรับหลัก`,
      done: violentTiers.p130 >= 8,
      desc: `ปัจจุบันมีเซ็ต Violent +130 อยู่ ${violentTiers.p130} เซ็ต ตรวจเช็คหินขัดในคลังเพื่อดึงค่าสเตตัสแฝงให้ครบ 100%`,
    },
    {
      title: `จัดทีมบุก Siege ให้ครอบคลุมหอ 4★ (เช่น คากิ, กาโร่, คมุน, ลอเรน)`,
      done: sixStarUnits.length >= 40,
      desc: 'ผู้เล่นการ์เดียนจำเป็นต้องมีตัว 4★ พกรูนครบอย่างน้อย 15-20 ตัวเพื่อไม่ให้เสียโควตาการบุก',
    },
    {
      title: `ติดตั้งอาร์ติแฟกต์ซับ SPD ตามสัดส่วนเลือดที่หายไป (SPD Under Low HP)`,
      done: totalArtifacts >= 50,
      desc: 'อาร์ติแฟกต์มีผลอย่างยิ่งยวดในการตัดเทิร์นช่วงวิกฤต',
    },
    {
      title: `เติมเต็มมอนสเตอร์เมต้าหลักที่ยังขาด (${missingMeta.slice(0, 3).map((m) => m.name).join(', ')})`,
      done: missingMeta.length === 0,
      desc: `ปัจจุบันมีเมต้ามอนสเตอร์แล้ว ${ownedMeta.length}/${metaMatches.length} ตัว (${metaCoveragePct}%) การสะสมตัวสำคัญจะช่วยเพิ่มทางเลือกในดราฟต์ RTA`,
    },
  ];

  return {
    wizard: box.wizard,
    totalUnits,
    totalRunes,
    totalArtifacts,
    sixStarUnits: sixStarUnits.length,
    nat5Units: nat5Units.length,
    score,
    rankGrade,
    rankGradeTh,
    rankBadgeColor,
    rankDescription,
    maxSwiftBonus,
    maxOverallSpd,
    fastestOverall,
    fastestSwift,
    fastestViolent,
    swiftTiers,
    violentTiers,
    avgTop30Eff,
    metaCoveragePct,
    ownedMeta,
    missingMeta,
    farmingPriorities,
    actionPlan,
    auditedAt: new Date().toISOString(),
  };
}
