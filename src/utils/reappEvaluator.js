import { boxRunes } from './swexImport.js';

/**
 * Reappraisal Stone (หินรีออปชั่น) Candidate Evaluator & Box Scanner
 * Analyzes whether a 6★ Legend rune is worth using Reappraisal Stones on,
 * and scans the player's account (SWEX import) for the top reapp candidates.
 */

// Set priority tiers for Reappraisal Stones
export const SET_TIERS = {
  // SSS Tier - Always top priority for Reapp
  Violent: { tier: 'SSS', score: 100, label: 'Violent (สำคัญสูงสุดสำหรับทุกโหมด)' },
  Swift: { tier: 'SSS', score: 98, label: 'Swift (สำคัญสูงสุดสำหรับทีมคลีฟ/แข่งสปีด)' },
  Will: { tier: 'SSS', score: 95, label: 'Will (สำคัญสูงสุดสำหรับ Arena/RTA/Siege)' },
  Despair: { tier: 'SS', score: 90, label: 'Despair (สำคัญมากสำหรับตัว Control/CC)' },
  
  // A Tier - Good targets if player needs specific builds
  Rage: { tier: 'A', score: 75, label: 'Rage (เน้นทำตัว Nuker/Abyss Speed)' },
  Fight: { tier: 'A', score: 72, label: 'Fight (เน้นทำทีมสปีด Abyss/Siege)' },
  Vampire: { tier: 'A', score: 70, label: 'Vampire (เน้นตัว Bruiser เฉพาะทาง)' },
  Nemesis: { tier: 'A', score: 68, label: 'Nemesis (เน้นฮีลเลอร์/ตัวดักแทรกเทิร์น)' },
  Seal: { tier: 'A', score: 65, label: 'Seal (เซ็ตใหม่สำหรับ RTA)' },
  Destroy: { tier: 'B', score: 60, label: 'Destroy (รูนเฉพาะทาง Siege Bruiser)' },
  Blade: { tier: 'B', score: 55, label: 'Blade (หาง่ายจาก Giant มักไม่คุ้มรี)' },
  Fatal: { tier: 'B', score: 50, label: 'Fatal (หาง่าย มักไม่คุ้มรี)' },
  Energy: { tier: 'C', score: 25, label: 'Energy (ไม่แนะนำให้รี)' },
  Guard: { tier: 'C', score: 25, label: 'Guard (ไม่แนะนำให้รี)' },
  Focus: { tier: 'C', score: 25, label: 'Focus (ไม่แนะนำให้รี)' },
  Endure: { tier: 'C', score: 20, label: 'Endure (ไม่แนะนำให้รี)' },
};

// Slot & Main Stat priority
export const SLOT_PRIORITIES = {
  // Slot 2, 4, 6 % are king
  4: {
    'CRI Dmg': { weight: 1.0, label: 'CRI Dmg (ช่อง 4 คริแดม หายากและคุ้มที่สุด)' },
    'HP%': { weight: 0.98, label: 'HP% (ช่อง 4 เลือด% ใช้งานได้ครอบจักรวาล)' },
    'DEF%': { weight: 0.90, label: 'DEF% (ช่อง 4 เกราะ% สำหรับตัวป้องกัน)' },
    'CRI Rate': { weight: 0.82, label: 'CRI Rate (ช่อง 4 อัตราคริ เฉพาะทาง)' },
    'ATK%': { weight: 0.85, label: 'ATK% (ช่อง 4 ดาเมจ%)' },
    default: { weight: 0.1, label: 'Flat Stat (ไม่คุ้มรี)' }
  },
  6: {
    'HP%': { weight: 1.0, label: 'HP% (ช่อง 6 เลือด% ใช้งานได้เกือบทุกตัว)' },
    'ATK%': { weight: 0.92, label: 'ATK% (ช่อง 6 โจมตี% สำหรับตัวบุก)' },
    'DEF%': { weight: 0.90, label: 'DEF% (ช่อง 6 เกราะ% สำหรับตัวป้องกัน)' },
    'ACC': { weight: 0.70, label: 'ACC (ช่อง 6 แม่นยำ เฉพาะตัวดีบัฟ)' },
    'RES': { weight: 0.65, label: 'RES (ช่อง 6 ต้านทาน เฉพาะสายทนทาน)' },
    default: { weight: 0.1, label: 'Flat Stat (ไม่คุ้มรี)' }
  },
  2: {
    'SPD': { weight: 1.0, label: 'SPD (ช่อง 2 สปีด คุ้มค่าที่สุดสำหรับ Swift/Vio)' },
    'HP%': { weight: 0.92, label: 'HP% (ช่อง 2 เลือด% สำหรับตัวช้า)' },
    'DEF%': { weight: 0.85, label: 'DEF% (ช่อง 2 เกราะ%)' },
    'ATK%': { weight: 0.85, label: 'ATK% (ช่อง 2 พลังโจมตี%)' },
    default: { weight: 0.1, label: 'Flat Stat (ไม่คุ้มรี)' }
  },
  // Slot 1, 3, 5 are fixed flats (ATK, DEF, HP)
  1: { default: { weight: 0.45, label: 'ช่อง 1 (Flat ATK - คุ้มเฉพาะเซ็ต Swift ล่าสปีด)' } },
  3: { default: { weight: 0.45, label: 'ช่อง 3 (Flat DEF - คุ้มเฉพาะเซ็ต Swift ล่าสปีด)' } },
  5: { default: { weight: 0.48, label: 'ช่อง 5 (Flat HP - คุ้มเฉพาะเซ็ต Swift ล่าสปีด)' } }
};

/**
 * Calculates the Reappraisal Priority Score for a rune (0-100)
 */
export function evaluateRuneForReapp({
  set = 'Violent',
  slot = 4,
  stars = 6,
  originalQuality = 'Legend',
  mainStat = 'HP%',
  innateStat = null, // e.g. 'Flat HP', 'ACC', 'RES', 'Flat DEF', null
  currentEfficiency = 85,
  currentSpd = 0
}) {
  // Rule 1: Non-6 star runes are NEVER worth reappraising
  if (stars < 6) {
    return {
      score: 0,
      grade: 'F',
      recommendation: 'ห้ามรีเด็ดขาด (ไม่ใช่รูน 6 ดาว)',
      reason: 'หินรีออปชั่นหายากมาก ต้องใช้กับรูน 6 ดาวระดับ Legend เท่านั้น',
      pros: [],
      cons: ['ไม่ใช่รูน 6 ดาว เสียหินรีฟรี']
    };
  }

  // Rule 2: Non-Legend original runes have lower max rolls
  const isLegend = originalQuality === 'Legend' || originalQuality === 5;
  if (!isLegend) {
    return {
      score: 15,
      grade: 'D',
      recommendation: 'ไม่แนะนำ (รูนดั้งเดิมไม่ใช่ Legend)',
      reason: 'รูนที่เกิดมาไม่ใช่ Legend จะสุ่มได้เพียง 3 โรล (Hero) หรือ 2 โรล (Rare) ศักยภาพสูงสุดจะต่ำกว่ารูน Legend แท้',
      pros: [],
      cons: ['จำนวนโรลสูงสุดน้อยกว่า Legend']
    };
  }

  // Rule 3: If rune is already God-Tier (e.g. Quad SPD 25+ or Eff 100%+), DO NOT REAPP!
  if (currentSpd >= 24 || currentEfficiency >= 102) {
    return {
      score: 5,
      grade: 'PROTECT',
      recommendation: 'ห้ามรีเด็ดขาด (รูนนี้เทพอยู่แล้ว!)',
      reason: `รูนชิ้นนี้มี SPD สูงถึง +${currentSpd} หรือมีประสิทธิภาพ ${currentEfficiency}% แล้ว หากรีจะเสียสเตตัสระดับพระเจ้านี้ไป`,
      pros: ['สเตตัสปัจจุบันเทพอยู่แล้ว'],
      cons: ['ถ้ากดรีจะเสียของดีทันที']
    };
  }

  // Calculate Base Score based on Set
  const setConfig = SET_TIERS[set] || { tier: 'B', score: 50, label: `${set}` };
  let baseScore = setConfig.score;

  // Calculate Slot & Main Stat Multiplier
  const slotConf = SLOT_PRIORITIES[slot] || { default: { weight: 0.4, label: `ช่อง ${slot}` } };
  const mainConf = slotConf[mainStat] || slotConf.default || { weight: 0.4, label: mainStat };
  let slotWeight = mainConf.weight;

  // Special adjustment: If Slot 1/3/5 is Swift, boost weight because players hunt 30+ SPD on Swift
  if ((slot === 1 || slot === 3 || slot === 5) && set === 'Swift') {
    slotWeight = 0.78; // High priority for Swift speed chasers
  }

  // Innate (Invariable) Substat Bonus:
  // Having an innate stat permanently eliminates that stat from the 4 rolling slots!
  // Flat HP, Flat DEF, Flat ATK, RES, ACC as innate are the best because they remove "bad stats"
  let innateBonus = 0;
  let innateNote = 'ไม่มีออปแถม (Innate)';
  const pros = [];
  const cons = [];

  if (innateStat) {
    const isBadStatRemoved = ['Flat HP', 'Flat DEF', 'Flat ATK', 'RES', 'ACC', 'HP', 'DEF', 'ATK'].some(
      s => String(innateStat).toLowerCase().includes(s.toLowerCase())
    );
    if (isBadStatRemoved) {
      innateBonus = 18;
      innateNote = `มี Innate (${innateStat}) ตัดสเตตัสไม่พึงประสงค์ออกจาก Pool`;
      pros.push(`ออปถาวร "${innateStat}" ช่วยตัดโอกาสที่รูนจะโรลไปลงออปนี้ ทำให้ได้ % หรือ SPD ง่ายขึ้น`);
    } else {
      innateBonus = 12;
      innateNote = `มี Innate (${innateStat})`;
      pros.push(`มีออปถาวร ${innateStat} ช่วยประหยัดช่องสเตตัส`);
    }
  } else {
    cons.push('ไม่มีออปแถม (Innate) ทำให้มีโอกาสสุ่มติดสเตตัส Flat ไร้ประโยชน์');
  }

  // Combine Score
  let totalScore = Math.round((baseScore * 0.55) + (slotWeight * 100 * 0.35) + innateBonus);
  totalScore = Math.min(100, Math.max(10, totalScore));

  // Determine Grade
  let grade = 'B';
  let recommendation = 'รีได้ถ้าขาดรูนตำแหน่งนี้';
  if (totalScore >= 92) {
    grade = 'SSS';
    recommendation = '💎 ควรรีเป็นอันดับแรก (Must-Reapp)';
  } else if (totalScore >= 84) {
    grade = 'SS';
    recommendation = '⭐ ควรรีอย่างยิ่ง (High Priority)';
  } else if (totalScore >= 74) {
    grade = 'S';
    recommendation = '👍 คุ้มค่าแก่การรี (Good Candidate)';
  } else if (totalScore >= 60) {
    grade = 'A';
    recommendation = 'ใช้งานได้ แนะนำรีเมื่อมีหินเหลือ';
  } else {
    grade = 'B';
    recommendation = 'ไม่แนะนำ ควรเก็บหินไว้ใช้กับ Violent/Swift ช่อง 2/4/6 ก่อน';
  }

  pros.push(`${setConfig.label}`);
  pros.push(`${mainConf.label}`);

  return {
    score: totalScore,
    grade,
    recommendation,
    reason: `เซ็ต ${set} ช่อง ${slot} (${mainStat}) ${innateNote}`,
    pros,
    cons,
    slotWeight,
    setTier: setConfig.tier
  };
}

/**
 * Scans all runes in the player's account box to find the Top N best Reapp candidates
 */
export function scanBoxForReappCandidates(box, limit = 15) {
  const candidates = [];

  // boxRunes() gives set / stat names, original quality and the rune's flat SPD for both the
  // compact box the site stores and a raw SWEX dump
  for (const rune of boxRunes(box)) {
    if (rune.stars !== 6) continue;                 // only 6★
    if (rune.originalQuality && rune.originalQuality < 5) continue; // must have dropped as Legend

    const slot = rune.slot;
    const mainStatName = rune.mainStat || '';
    const isFlat246 = [2, 4, 6].includes(slot) && ['HP', 'ATK', 'DEF'].includes(mainStatName);
    if (isFlat246) continue; // flat 2/4/6 is never worth a stone

    const setName = rune.set;
    const innateStat = rune.innateStat || null;
    const currentEff = rune.eff;
    const currentSpd = rune.subSpd; // reappraisal rerolls substats only; main-stat SPD is not at stake

    const evalResult = evaluateRuneForReapp({
      set: setName,
      slot,
      stars: 6,
      originalQuality: 'Legend',
      mainStat: mainStatName,
      innateStat,
      currentEfficiency: currentEff,
      currentSpd
    });

    // Don't include runes that should be protected or scored below 60
    if (evalResult.grade === 'PROTECT' || evalResult.score < 60) continue;

    candidates.push({
      runeId: rune.id,
      set: setName,
      slot,
      mainStat: mainStatName,
      innateStat,
      currentEff,
      currentSpd,
      equippedMonster: rune.monsterName || (rune.unit ? `มอนสเตอร์ #${rune.unit}` : 'คลังเก็บรูน'),
      ...evalResult
    });
  }

  // Sort descending by score, then ascending by current efficiency (worst rune with best potential first)
  candidates.sort((a, b) => b.score - a.score || a.currentEff - b.currentEff);

  return candidates.slice(0, limit);
}
