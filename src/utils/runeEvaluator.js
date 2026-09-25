/**
 * Summoners War Rune Evaluator & Keep/Sell Advisor
 * Computes Current Efficiency, Max Potential Efficiency, Max Potential SPD,
 * and gives actionable Keep/Sell advice in Thai.
 */

export const RUNE_SET_NAMES = {
  1: 'Energy',
  2: 'Guard',
  3: 'Swift',
  4: 'Blade',
  5: 'Rage',
  6: 'Focus',
  7: 'Endure',
  8: 'Fatal',
  10: 'Despair',
  11: 'Vampire',
  13: 'Violent',
  14: 'Nemesis',
  15: 'Will',
  16: 'Shield',
  17: 'Revenge',
  18: 'Destroy',
  19: 'Fight',
  20: 'Determination',
  21: 'Enhance',
  22: 'Accuracy',
  23: 'Tolerance',
  24: 'Seal',
  25: 'Intangible',
};

export const RUNE_SET_NAMES_TH = {
  Energy: 'เอนเนอร์จี (HP)',
  Guard: 'การ์ด (DEF)',
  Swift: 'สวิฟต์ (SPD)',
  Blade: 'เบลด (CR)',
  Rage: 'เรจ (CD)',
  Focus: 'โฟกัส (ACC)',
  Endure: 'เอนดูร์ (RES)',
  Fatal: 'ฟาทัล (ATK)',
  Despair: 'ดีสแพร์ (สตัน)',
  Vampire: 'แวมไพร์ (ดูดเลือด)',
  Violent: 'ไวโอเลนท์ (เทิร์นซ้อน)',
  Nemesis: 'เนเมซิส (เร่งเกจ)',
  Will: 'วิลล์ (กันสถานะ)',
  Shield: 'ชิลด์ (เกราะทีม)',
  Revenge: 'รีเวนจ์ (สวนกลับ)',
  Destroy: 'เดสทรอย (ทำลายเลือด)',
  Fight: 'ไฟต์ (เพิ่ม ATK ทีม)',
  Determination: 'ดีเทอร์มิเนชัน (เพิ่ม DEF ทีม)',
  Enhance: 'เอนแฮนซ์ (เพิ่ม HP ทีม)',
  Accuracy: 'แอคคูราซี (เพิ่ม ACC ทีม)',
  Tolerance: 'โทเลอรานซ์ (เพิ่ม RES ทีม)',
  Seal: 'ซีล (ผนึกรูน)',
  Intangible: 'อินแทนจิเบิล (แทนได้ทุกเซ็ต)',
};

export const STAT_NAMES = {
  1: 'HP (Flat)',
  2: 'HP%',
  3: 'ATK (Flat)',
  4: 'ATK%',
  5: 'DEF (Flat)',
  6: 'DEF%',
  8: 'SPD',
  9: 'CRIT Rate%',
  10: 'CRIT DMG%',
  11: 'Resistance%',
  12: 'Accuracy%',
};

export const STAT_NAMES_TH = {
  1: 'HP (หน่วย)',
  2: 'HP%',
  3: 'ATK (หน่วย)',
  4: 'ATK%',
  5: 'DEF (หน่วย)',
  6: 'DEF%',
  8: 'SPD (ความเร็ว)',
  9: 'อัตราคริ (CR%)',
  10: 'ความแรงคริ (CD%)',
  11: 'ต้านทาน (RES%)',
  12: 'ความแม่นยำ (ACC%)',
};

// Maximum roll value per upgrade for 6★ Runes
const MAX_ROLLS_6STAR = {
  1: 375, // HP flat
  2: 8,   // HP%
  3: 20,  // ATK flat
  4: 8,   // ATK%
  5: 20,  // DEF flat
  6: 8,   // DEF%
  8: 6,   // SPD
  9: 6,   // CR%
  10: 7,  // CD%
  11: 8,  // RES%
  12: 8,  // ACC%
};

export const RUNE_CLASS_NAMES = {
  1: 'Common (ขาว)',
  2: 'Magic (เขียว)',
  3: 'Rare (ฟ้า)',
  4: 'Hero (ม่วง)',
  5: 'Legend (ส้ม)',
};

/**
 * Evaluates a rune from SWEX packet or raw account export
 */
export function evaluateRune(rune) {
  if (!rune) return null;

  const slot = Number(rune.slot_no || rune.slot || 1);
  const stars = Number(rune.class || rune.stars || rune.rank || 6);
  const upgradeLevel = Number(rune.upgrade_curr || rune.level || rune.upgrade || 0);
  const setId = Number(rune.set_id || 1);
  const setName = RUNE_SET_NAMES[setId] || rune.setName || 'Unknown';
  const setNameTh = RUNE_SET_NAMES_TH[setName] || setName;

  // Grade / Rarity: 1=Normal, 2=Magic, 3=Rare, 4=Hero, 5=Legend
  // Note: in SWEX, extra is often the innate stat, sec_eff are the substats
  const secEff = Array.isArray(rune.sec_eff) ? rune.sec_eff : [];
  const prefixEff = rune.prefix_eff || []; // Innate stat [statId, value]

  // Determine initial quality if not given
  let originalQuality = Number(rune.extra || 0);
  if (!originalQuality) {
    // If upgrade is 0, quality equals number of subs + 1
    if (upgradeLevel === 0) {
      originalQuality = Math.min(5, secEff.length + 1);
    } else {
      // rough guess based on subs count and upgrade level
      originalQuality = Math.min(5, Math.max(1, secEff.length + 1));
    }
  }

  // Parse Main Stat
  const mainStatType = Number(Array.isArray(rune.pri_eff) ? rune.pri_eff[0] : (rune.main_stat ? rune.main_stat[0] : 1));
  const mainStatValue = Number(Array.isArray(rune.pri_eff) ? rune.pri_eff[1] : (rune.main_stat ? rune.main_stat[1] : 0));
  const mainStatName = STAT_NAMES[mainStatType] || 'Unknown';
  const mainStatNameTh = STAT_NAMES_TH[mainStatType] || mainStatName;

  // Parse Innate Stat
  let innate = null;
  if (Array.isArray(prefixEff) && prefixEff.length >= 2 && prefixEff[0] > 0) {
    innate = {
      type: prefixEff[0],
      value: prefixEff[1],
      name: STAT_NAMES[prefixEff[0]] || '',
      nameTh: STAT_NAMES_TH[prefixEff[0]] || '',
    };
  }

  // Parse Substats & Find SPD
  let currentSpd = 0;
  let hasSpdSub = false;
  const subs = [];

  for (const s of secEff) {
    const sType = Number(s[0]);
    const sVal = Number(s[1]);
    const sGrind = Number(s[3] || 0); // grind value if any
    const name = STAT_NAMES[sType] || 'Unknown';
    const nameTh = STAT_NAMES_TH[sType] || name;

    if (sType === 8) {
      currentSpd = sVal;
      hasSpdSub = true;
    }

    subs.push({
      type: sType,
      value: sVal,
      grind: sGrind,
      name,
      nameTh,
    });
  }

  // Calculate Remaining Rolls up to +12
  // Rolls occur at +3, +6, +9, +12 (4 rolls total for Legend)
  const currentRollsDone = Math.min(4, Math.floor(upgradeLevel / 3));
  let totalUpgradesForQuality = 0;
  if (originalQuality === 5) totalUpgradesForQuality = 4; // Legend
  else if (originalQuality === 4) totalUpgradesForQuality = 3; // Hero
  else if (originalQuality === 3) totalUpgradesForQuality = 2; // Rare
  else if (originalQuality === 2) totalUpgradesForQuality = 1; // Magic

  const remainingRolls = Math.max(0, totalUpgradesForQuality - currentRollsDone);

  // Calculate Max Potential SPD
  let maxPotentialSpd = currentSpd;
  if (mainStatType === 8) {
    // Slot 2 Main SPD maxes at 42 (6★)
    maxPotentialSpd = 42;
  } else if (hasSpdSub) {
    // If rune already has SPD substat, remaining rolls can all go into SPD (max +6 per roll)
    maxPotentialSpd = currentSpd + remainingRolls * 6;
  } else if (subs.length < 4 && upgradeLevel < 12 && originalQuality < 5) {
    // If not full 4 subs yet, new sub might appear as SPD (+6 base)
    // But cannot roll again into it once appeared
    maxPotentialSpd = 6;
  }

  // Check Flat Main Stat penalty on 2, 4, 6
  const isSlot246 = slot === 2 || slot === 4 || slot === 6;
  const isFlat246 = isSlot246 && (mainStatType === 1 || mainStatType === 3 || mainStatType === 5); // Flat HP, ATK, DEF

  // Compute Current Efficiency
  let effSum = 0;
  let maxPossibleSum = 0;

  // Efficiency calculation standard formula
  for (const s of subs) {
    const maxVal = MAX_ROLLS_6STAR[s.type] || 8;
    effSum += (s.value / maxVal);
  }
  // Base rune has 4 max rolls (1.0 each) + 4 upgrade rolls (1.0 each) = 8.0 max
  const currentEff = Math.round(((1 + effSum) / (1 + 7)) * 100);

  // Max Potential Efficiency: assume all remaining rolls get 100% max roll value
  const potentialEffSum = effSum + remainingRolls;
  const maxPotentialEff = Math.min(100, Math.round(((1 + potentialEffSum) / (1 + 7)) * 100));

  // Determine Recommendation
  let recommendation = 'SELL_RECOMMENDED'; // 'KEEP_INSTANT' | 'ROLL_TEST' | 'SELL_RECOMMENDED'
  let recommendationTh = 'แนะนำขายทิ้ง';
  let badgeColor = 'red';
  let reason = '';

  if (stars < 5) {
    recommendation = 'SELL_RECOMMENDED';
    recommendationTh = 'แนะนำขายทิ้ง';
    badgeColor = 'red';
    reason = `รูนระดับ ${stars}★ ต่ำกว่ามาตรฐานเอนด์เกม`;
  } else if (isFlat246) {
    recommendation = 'SELL_RECOMMENDED';
    recommendationTh = 'แนะนำขายทิ้ง';
    badgeColor = 'red';
    reason = `สล็อต ${slot} เป็นออปชั่นแฟลต (${mainStatNameTh}) เสียเปรียบเปอร์เซ็นต์มหาศาล`;
  } else if (mainStatType === 8) {
    // Slot 2 SPD is always very valuable
    recommendation = 'KEEP_INSTANT';
    recommendationTh = 'เก็บทันที (สปีดหลัก)';
    badgeColor = 'emerald';
    reason = `สล็อต 2 ออปชั่นหลัก SPD ความเร็ว 42 หน่วย ใช้ได้กับทุกตัวทำเทิร์น`;
  } else if (maxPotentialSpd >= 24) {
    recommendation = 'KEEP_INSTANT';
    recommendationTh = 'เก็บทันที (ลุ้นสปีดสูงมาก)';
    badgeColor = 'amber';
    reason = `มีโอกาสตีบวกติด SPD ได้สูงสุดถึง +${maxPotentialSpd} (สปีดระดับการ์เดียน)`;
  } else if (originalQuality === 5 && stars === 6) {
    // 6★ Legend
    if (hasSpdSub) {
      recommendation = 'KEEP_INSTANT';
      recommendationTh = 'เก็บทันที (รูนส้ม 6★ มีสปีด)';
      badgeColor = 'amber';
      reason = `รูนตำนาน 6★ มีซับ SPD (+${currentSpd}) ลุ้นได้สูงสุด +${maxPotentialSpd}`;
    } else if (slot === 1 || slot === 3 || slot === 5) {
      recommendation = 'ROLL_TEST';
      recommendationTh = 'ตีบวก +6/+9 เช็คโรล';
      badgeColor = 'blue';
      reason = `รูนตำนาน 6★ สล็อตเลขคี่ หากโรลสถิติเปอร์เซ็นต์ซ้ำคุ้มค่าแก่การแปลงหิน`;
    } else {
      recommendation = 'ROLL_TEST';
      recommendationTh = 'ตีบวก +6 เช็คโรล';
      badgeColor = 'blue';
      reason = `รูนตำนาน 6★ สล็อต ${slot} ${mainStatNameTh}`;
    }
  } else if (originalQuality === 4 && stars === 6 && hasSpdSub && currentSpd >= 5) {
    // 6★ Hero with SPD
    recommendation = 'ROLL_TEST';
    recommendationTh = 'ตีบวก +6 เช็คสปีด';
    badgeColor = 'blue';
    reason = `รูนฮีโร่ 6★ มี SPD เริ่มต้น +${currentSpd} ลุ้นติด 3 ครั้งได้สูงสุด +${maxPotentialSpd}`;
  } else if (setName === 'Swift' && hasSpdSub) {
    recommendation = 'ROLL_TEST';
    recommendationTh = 'ตีบวกเช็คสปีด (เซ็ตสวิฟต์)';
    badgeColor = 'blue';
    reason = `เซ็ต Swift มีซับ SPD ลุ้นทำเทิร์นก่อน`;
  } else if (currentEff >= 80) {
    recommendation = 'KEEP_INSTANT';
    recommendationTh = 'เก็บทันที (ประสิทธิภาพสูง)';
    badgeColor = 'emerald';
    reason = `ประสิทธิภาพรูนปัจจุบัน ${currentEff}% อยู่ในเกณฑ์สูงมาก`;
  } else {
    recommendation = 'SELL_RECOMMENDED';
    recommendationTh = 'แนะนำขายทิ้ง';
    badgeColor = 'red';
    reason = `สถิติไม่สอดคล้องกัน และไม่มีซับสปีดโดดเด่น`;
  }

  return {
    slot,
    stars,
    upgradeLevel,
    setName,
    setNameTh,
    originalQuality,
    qualityName: RUNE_CLASS_NAMES[originalQuality] || 'Normal',
    mainStat: { type: mainStatType, value: mainStatValue, name: mainStatName, nameTh: mainStatNameTh },
    innate,
    subs,
    currentEff,
    maxPotentialEff,
    currentSpd,
    hasSpdSub,
    maxPotentialSpd,
    recommendation,
    recommendationTh,
    badgeColor,
    reason,
    isLegend6Star: originalQuality === 5 && stars === 6,
  };
}
