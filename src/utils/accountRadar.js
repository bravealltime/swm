// Account Assessment & 6-Axis Power Radar Engine
// Analyzes a player's box JSON (runes, artifacts, units) and calculates scores from 0 to 100

import { baseAwakenedId, getMonsterCatalogInfo } from './swexImport.js';
import guardianMeta from '../data/swrtGuardianMeta.json' with { type: 'json' };

const PVE_SPEED_FARMERS = new Set(['teshar', 'liam', 'lushen', 'julie', 'shaina', 'deborah', 'kyle', 'brandia', 'prilea']);

/**
 * Calculates 6 distinct account dimensions from player box data
 * @param {Object} box - SWEX box JSON
 * @returns {Object} { axes: Array<{ key, label, score, maxLabel }>, overallGrade, overallScore, advice }
 */
export function calculateAccountRadar(box) {
  if (!box || !box.units || box.units.length === 0) {
    return {
      axes: [
        { key: 'swift', label: 'ความเร็ว (Swift)', score: 65, value: '+145 SPD' },
        { key: 'bruiser', label: 'ความถึก (Vio/Will)', score: 70, value: 'เฉลี่ย 82%' },
        { key: 'artifact', label: 'อาร์ติแฟกต์', score: 60, value: '45 ชิ้น' },
        { key: 'guardian', label: 'เมต้า RTA', score: 68, value: '8 ตัว' },
        { key: 'siege', label: 'กิลด์วอร์ (Siege)', score: 75, value: '24 ตัว' },
        { key: 'pve', label: 'สปีดฟาร์ม Abyss', score: 72, value: '4 ดันเจี้ยน' },
      ],
      overallScore: 68,
      overallGrade: 'B',
      gradeLabel: 'ระดับพัฒนาต่อเนื่อง (Fighter - Conqueror)',
      advice: 'นำเข้าไฟล์ SWEX กล่องจริงเพื่อประเมินคะแนนที่แม่นยำ 100%',
    };
  }

  const units = box.units || [];
  const runes = box.runes || [];
  const artifacts = box.artifacts || [];

  // 1. Swift Speed Cap (Max rune SPD on any Swift monster)
  let maxSwiftSpd = 0;
  for (const u of units) {
    if (!u) continue;
    // If unit has swift runes, calculate rune speed bonus
    const monRunes = runes.filter((r) => r && (r.uid ? r.uid === u.uid : r.unit === u.masterId));
    const sets = new Set(monRunes.map((r) => r?.set));
    const hasSwift = sets.has(3); // 3 = Swift

    let spd = 0;
    for (const r of monRunes) {
      if (!r) continue;
      if (r.main?.[0] === 8) spd += Number(r.main[1]) || 0;
      if (r.innate?.[0] === 8) spd += Number(r.innate[1]) || 0;
      for (const s of r.subs || []) {
        if (s && s[0] === 8) spd += (Number(s[1]) || 0) + (Number(s[2]) || 0);
      }
    }
    if (hasSwift) {
      const baseSpd = Number(u.baseSpd || u.spd) || 100;
      const swiftBonus = Math.floor(baseSpd * 0.25);
      const totalRuneSpd = spd + swiftBonus;
      if (Number.isFinite(totalRuneSpd) && totalRuneSpd > maxSwiftSpd) maxSwiftSpd = totalRuneSpd;
    } else {
      if (Number.isFinite(spd) && spd > maxSwiftSpd) maxSwiftSpd = spd;
    }
  }

  // Swift Score: 220+ = 100, 200 = 90, 180 = 80, 160 = 70, 140 = 60
  const swiftScore = Math.min(100, Math.max(30, Math.round(((maxSwiftSpd - 80) / 140) * 100))) || 50;

  // 2. Violent / Will Bruiser Power (Efficiency and quantity of Violent runes)
  const vioRunes = runes.filter((r) => r && r.set === 13); // 13 = Violent
  const avgVioEff = vioRunes.length > 0 
    ? Math.round(vioRunes.reduce((s, r) => s + (Number(r?.eff) || 65), 0) / vioRunes.length) 
    : 60;
  const bruiserScore = Math.min(100, Math.max(30, Math.round(((avgVioEff - 50) / 45) * 100))) || 60;

  // 3. Artifact Quality (Number of max +15 rank artifacts & total artifacts)
  const plus15Artifacts = artifacts.filter((a) => a && (Number(a.lvl) || 0) >= 15).length;
  const artifactScore = Math.min(100, Math.max(25, Math.round((plus15Artifacts / 60) * 100))) || 40;

  // 4. Guardian RTA Meta Readiness (Count of top Guardian Nat5s equipped)
  const metaIds = new Set((guardianMeta?.monsters || []).slice(0, 50).map((m) => Number(m.id)));
  let guardianReadyCount = 0;
  for (const u of units) {
    const bId = baseAwakenedId(u.masterId || 0);
    if ((metaIds.has(Number(u.masterId)) || metaIds.has(Number(bId))) && (u.stars || 0) >= 6) {
      guardianReadyCount += 1;
    }
  }
  const guardianScore = Math.min(100, Math.max(20, Math.round((guardianReadyCount / 15) * 100)));

  // 5. Siege Guild War Depth (Count of 6-star battle-ready units)
  const sixStarCount = units.filter((u) => (u.stars || 0) >= 6).length;
  const siegeScore = Math.min(100, Math.max(20, Math.round((sixStarCount / 50) * 100)));

  // 6. PVE Abyss Mastery (Core speed farm monsters equipped)
  let pveCount = 0;
  for (const u of units) {
    const cat = getMonsterCatalogInfo(u.masterId);
    const monName = (cat?.name || u.name || '').toLowerCase();
    if (PVE_SPEED_FARMERS.has(monName) && (u.stars || 0) >= 6) {
      pveCount += 1;
    }
  }
  const pveScore = Math.min(100, Math.max(30, Math.round((pveCount / 5) * 100)));

  // Overall Score & Grade
  const axes = [
    { key: 'swift', label: 'ความเร็ว (Swift)', score: swiftScore, value: `+${maxSwiftSpd} SPD` },
    { key: 'bruiser', label: 'ความถึก (Vio/Will)', score: bruiserScore, value: `Vio ${avgVioEff}%` },
    { key: 'artifact', label: 'อาร์ติแฟกต์', score: artifactScore, value: `+15 (${plus15Artifacts} ชิ้น)` },
    { key: 'guardian', label: 'เมต้า RTA', score: guardianScore, value: `${guardianReadyCount} ตัวเมต้า` },
    { key: 'siege', label: 'กิลด์วอร์ (Siege)', score: siegeScore, value: `${sixStarCount} ตัว 6★` },
    { key: 'pve', label: 'สปีดฟาร์ม Abyss', score: pveScore, value: `${pveCount}/5 ตัวหลัก` },
  ];

  const overallScore = Math.round(axes.reduce((sum, a) => sum + a.score, 0) / axes.length);
  const overallGrade = overallScore >= 90 ? 'S+' : overallScore >= 80 ? 'S' : overallScore >= 70 ? 'A' : overallScore >= 60 ? 'B' : 'C';
  const gradeLabel = overallScore >= 90 
    ? 'ระดับการ์เดียนขั้นสูง (G2–G3 Legend Ready)' 
    : overallScore >= 80 
    ? 'ระดับการ์เดียน (Guardian G1 Ready)' 
    : overallScore >= 70 
    ? 'ระดับคอนเคอเรอร์ (Conqueror C2–C3)' 
    : 'ระดับไฟต์เตอร์ (Fighter F3–C1)';

  // Find lowest axis for actionable advice
  const sortedAxes = [...axes].sort((a, b) => a.score - b.score);
  const lowest = sortedAxes[0];
  let advice = `จุดเด่นของไอดีคือ ${sortedAxes[sortedAxes.length - 1].label} (${sortedAxes[sortedAxes.length - 1].score}/100)`;
  if (lowest.key === 'artifact') {
    advice += ` • จุดที่ควรเน้นฟาร์มด่วนคือ การตีบวกอาร์ติแฟกต์ +15 และหาซับดาเมจเสริม`;
  } else if (lowest.key === 'swift') {
    advice += ` • ควรลงดันเจี้ยน Giants เพื่อดันสปีดรูนช่อง 2/4/6 ให้ทะลุ +180+`;
  } else if (lowest.key === 'pve') {
    advice += ` • ปั้นตัวทำเวลา PVE เช่น Teshar / Julie เพื่อลดเวลาฟาร์มเหลือต่ำกว่า 30 วินาที`;
  } else if (lowest.key === 'guardian') {
    advice += ` • แนะนำปรับรูนมอนสเตอร์เมต้า RTA ให้สอดคล้องกับ Benchmark G1`;
  } else {
    advice += ` • ดันคะแนน ${lowest.label} เพิ่มอีกนิดจะก้าวสู่ระดับถัดไป`;
  }

  return {
    axes,
    overallScore,
    overallGrade,
    gradeLabel,
    advice,
  };
}
