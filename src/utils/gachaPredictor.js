/**
 * Gacha Luck Predictor & Wishlist Probability Engine
 * Accurately calculates binomial probability distribution, wishlist odds, salt gauges, and timelines
 */

export const GACHA_RATES = {
  mystical: { name: 'คัมภีร์เวทมนตร์ (MS)', nat5: 0.005, ld5: 0, costThb: 49 },
  ld: { name: 'คัมภีร์แสง-มืด (LD)', nat5: 0, ld5: 0.0035, costThb: 990 },
  legendary: { name: 'คัมภีร์ในตำนาน (LS)', nat5: 0.065, ld5: 0, costThb: 1490 },
  allAttribute: { name: 'คัมภีร์ทุกธาตุ (All-Attr)', nat5: 0.005, ld5: 0.002, costThb: 1990 },
  transcendence: { name: 'คัมภีร์ข้ามภพ (Trans)', nat5: 1.0, ld5: 0, costThb: 3500 },
  legendaryLd: { name: 'คัมภีร์แสง-มืดในตำนาน (Legendary LD)', nat5: 0, ld5: 0.065, costThb: 4900 },
  summoningStones: { name: 'หินซัมมอน (50 เม็ด/ครั้ง)', nat5: 0.005, ld5: 0, costThb: 25 },
};

// Total summonable LD5s currently in the game pool (~110 monsters)
export const TOTAL_SUMMONABLE_LD5_COUNT = 110;

// Popular dream LD5 monsters for instant wishlist selection
export const POPULAR_DREAM_LD5S = [
  { name: 'Lucifer', thaiName: 'ลูซิเฟอร์ (ปีศาจแสง)', element: 'light', title: 'ตัวเปิดเมต้าเร่งเกจอันดับ 1 ของโลก' },
  { name: 'Giana', thaiName: 'เกียนา (ออราเคิลมืด)', element: 'dark', title: 'เทพสตรีปหมู่และสตั้น 100%' },
  { name: 'Nephthys', thaiName: 'เนฟทิส (ดีเซิร์ตควีนมืด)', element: 'dark', title: 'เทพแจกดีบัพไม่สนรีซิสท์' },
  { name: 'Tian Lang', thaiName: 'เทียนหลาง (แพนด้าแสง)', element: 'light', title: 'เทพตัดเทิร์นแก้ทางทีมเร่งเกจ' },
  { name: 'Ragdoll', thaiName: 'แร็กดอล (ดราก้อนไนท์มืด)', element: 'dark', title: 'โดนคริแล้วทีมเร่งเกจทั้งตี้' },
  { name: 'Maximillian', thaiName: 'แม็กซิมิเลียน (เวพอนมาสเตอร์มืด)', element: 'dark', title: 'ดาเมจหมู่มหาศาลพร้อมเกราะแตก' },
  { name: 'Asima', thaiName: 'อาซิมะ (เฮลเลดี้แสง)', element: 'light', title: 'ราชินีแจก Dot และเกราะแตก 3 สกิล' },
  { name: 'Veronica', thaiName: 'เวโรนิกา (แบทเทิลแองเจิลแสง)', element: 'light', title: 'สต็อกคูลดาวน์และลบบัพสุดโกง' },
  { name: 'Bella', thaiName: 'เบลล่า (แคนนอนเกิร์ลแสง)', element: 'light', title: 'ปืนใหญ่ยิงทำลายทั้งแถว' },
  { name: 'Cadiz', thaiName: 'คาเดียส (แวมไพร์มืด)', element: 'dark', title: 'เทพดูดเลือด ดีบัพ และเร่งเกจ PVE/Siege' },
];

/**
 * Calculates overall probability of pulling at least 1 Nat 5 and 1 LD5 from an inventory of scrolls
 */
export function calculateGachaProbabilities(inventory = {}) {
  const msCount = Number(inventory.mystical) || 0;
  const ldCount = Number(inventory.ld) || 0;
  const lsCount = Number(inventory.legendary) || 0;
  const aaCount = Number(inventory.allAttribute) || 0;
  const transCount = Number(inventory.transcendence) || 0;
  const legLdCount = Number(inventory.legendaryLd) || 0;
  const stoneSummons = Math.floor((Number(inventory.summoningStones) || 0) / 50);

  const totalSummons = msCount + ldCount + lsCount + aaCount + transCount + legLdCount + stoneSummons;

  // Probability of getting 0 Regular Nat5
  // (Transcendence guarantees 100% if > 0)
  let probZeroNat5 = transCount > 0 ? 0 : 1;
  if (probZeroNat5 > 0) {
    probZeroNat5 *= Math.pow(1 - GACHA_RATES.mystical.nat5, msCount);
    probZeroNat5 *= Math.pow(1 - GACHA_RATES.legendary.nat5, lsCount);
    probZeroNat5 *= Math.pow(1 - GACHA_RATES.allAttribute.nat5, aaCount);
    probZeroNat5 *= Math.pow(1 - GACHA_RATES.summoningStones.nat5, stoneSummons);
  }
  const probAtLeastOneNat5 = Math.max(0, Math.min(1, 1 - probZeroNat5));

  // Probability of getting 0 LD5
  let probZeroLd5 = 1;
  probZeroLd5 *= Math.pow(1 - GACHA_RATES.ld.ld5, ldCount);
  probZeroLd5 *= Math.pow(1 - GACHA_RATES.legendaryLd.ld5, legLdCount);
  probZeroLd5 *= Math.pow(1 - GACHA_RATES.allAttribute.ld5, aaCount);
  const probAtLeastOneLd5 = Math.max(0, Math.min(1, 1 - probZeroLd5));

  // Total shop market value in THB
  const totalValueThb =
    msCount * GACHA_RATES.mystical.costThb +
    ldCount * GACHA_RATES.ld.costThb +
    lsCount * GACHA_RATES.legendary.costThb +
    aaCount * GACHA_RATES.allAttribute.costThb +
    transCount * GACHA_RATES.transcendence.costThb +
    legLdCount * GACHA_RATES.legendaryLd.costThb +
    stoneSummons * GACHA_RATES.summoningStones.costThb;

  return {
    totalSummons,
    probAtLeastOneNat5: Math.round(probAtLeastOneNat5 * 1000) / 10, // e.g. 42.5%
    probAtLeastOneLd5: Math.round(probAtLeastOneLd5 * 1000) / 10,   // e.g. 3.4%
    totalValueThb,
    nat5Status: probAtLeastOneNat5 >= 0.7 ? 'high' : probAtLeastOneNat5 >= 0.35 ? 'medium' : 'low',
    ld5Status: probAtLeastOneLd5 >= 0.5 ? 'legendary' : probAtLeastOneLd5 >= 0.15 ? 'high' : probAtLeastOneLd5 >= 0.05 ? 'medium' : 'low',
  };
}

/**
 * Calculates the exact probability of pulling a specific wishlist monster
 */
export function calculateWishlistOdds(inventory = {}, poolSize = TOTAL_SUMMONABLE_LD5_COUNT) {
  const ldCount = Number(inventory.ld) || 0;
  const legLdCount = Number(inventory.legendaryLd) || 0;
  const aaCount = Number(inventory.allAttribute) || 0;

  // Single scroll specific odds
  const singleLdOdds = GACHA_RATES.ld.ld5 / poolSize;
  const singleLegLdOdds = GACHA_RATES.legendaryLd.ld5 / poolSize;
  const singleAaOdds = GACHA_RATES.allAttribute.ld5 / poolSize;

  let probZeroSpecific = 1;
  probZeroSpecific *= Math.pow(1 - singleLdOdds, ldCount);
  probZeroSpecific *= Math.pow(1 - singleLegLdOdds, legLdCount);
  probZeroSpecific *= Math.pow(1 - singleAaOdds, aaCount);

  const probSpecific = Math.max(0, 1 - probZeroSpecific);
  const oneInX = singleLdOdds > 0 ? Math.round(1 / singleLdOdds) : 31428;

  return {
    probSpecificPercent: (probSpecific * 100).toFixed(3), // e.g. 0.032%
    oneInX,
    totalLdSummons: ldCount + legLdCount + aaCount,
  };
}

/**
 * Calculates Salt Index & Luck Meter based on streak of scrolls without LD5
 */
export function calculateSaltIndex(dryStreakLdScrolls = 0) {
  const k = Math.max(0, Number(dryStreakLdScrolls) || 0);
  const probStillDry = Math.pow(1 - GACHA_RATES.ld.ld5, k);
  const unluckierThanPercent = Math.max(0, Math.min(99.9, Math.round((1 - probStillDry) * 1000) / 10));

  let grade = 'ปกติ (Normal)';
  let color = 'text-cyan-400';
  let badge = 'bg-cyan-500/10 border-cyan-500/30';
  let desc = 'อยู่ในเกณฑ์สถิติมาตรฐานทั่วไปของเกม Summoners War';

  if (k >= 800) {
    grade = 'เกลือระดับมหากาพย์ (Epic Dryness)';
    color = 'text-rose-400';
    badge = 'bg-rose-500/20 border-rose-500/40';
    desc = 'คุณซวยกว่าผู้เล่น 94% ทั่วโลก! สถิติทางคณิตศาสตร์ใกล้จะชดเชยคืนให้คุณในเร็วๆ นี้แน่นอน';
  } else if (k >= 500) {
    grade = 'เกลือระดับทะเลเดดซี (Dead Sea)';
    color = 'text-amber-400';
    badge = 'bg-amber-500/20 border-amber-500/40';
    desc = 'คุณซวยกว่าผู้เล่น 82.7% ทั่วโลก อยู่ในกลุ่มสะสมแต้มบุญขั้นสูง';
  } else if (k >= 286) {
    grade = 'เลยจุดค่าเฉลี่ยสถิติแล้ว (Past Mean)';
    color = 'text-yellow-400';
    badge = 'bg-yellow-500/15 border-yellow-500/30';
    desc = 'เปิดเกินค่าเฉลี่ย 286 ใบแล้ว โอกาสแตกสายฟ้าม่วงใกล้เข้ามาทุกม้วน';
  } else if (k >= 150) {
    grade = 'สะสมความเค็ม (Building Salt)';
    color = 'text-sky-300';
    badge = 'bg-sky-500/15 border-sky-500/30';
    desc = 'ผ่านครึ่งทางของค่าเฉลี่ย เริ่มมีโอกาสลุ้นได้ทุกเมื่อ';
  }

  return {
    k,
    unluckierThanPercent,
    probStillDryPercent: Math.round(probStillDry * 1000) / 10,
    grade,
    color,
    badge,
    desc,
  };
}

/**
 * Calculates timeline & days required to hit LD5 milestone
 */
export function calculateTimeline(currentLdScrolls = 0, monthlyPace = 15) {
  const current = Math.max(0, Number(currentLdScrolls) || 0);
  const pace = Math.max(1, Number(monthlyPace) || 15);

  // Milestone targets (cumulative probability thresholds)
  // 50% Median = ~198 scrolls
  // 75% High = ~395 scrolls
  // 90% Near Guarantee = ~656 scrolls
  const target50 = 198;
  const target75 = 395;
  const target90 = 656;

  const remaining50 = Math.max(0, target50 - current);
  const remaining75 = Math.max(0, target75 - current);

  const monthsTo50 = Math.round((remaining50 / pace) * 10) / 10;
  const monthsTo75 = Math.round((remaining75 / pace) * 10) / 10;

  const targetDate50 = new Date(Date.now() + monthsTo50 * 30 * 86400000);

  return {
    target50Scrolls: target50,
    target75Scrolls: target75,
    target90Scrolls: target90,
    remainingTo50: remaining50,
    monthsTo50,
    targetDateThai: targetDate50.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' }),
    daysTo50: Math.round(monthsTo50 * 30),
  };
}
