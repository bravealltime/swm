// Damage Check & Speed Tuning Calculation Engine for Cairos Dungeon Abyss Hard
// Grounded in official Com2uS damage formulas & dungeon enemy stats

export const ABYSS_DUNGEONS = [
  {
    id: 'giant',
    nameTh: "Giant's Keep (โกเลมยักษ์)",
    element: 'Water',
    waveMobHp: 16500,
    waveMobDef: 1120,
    midBossHp: 85000,
    midBossDef: 1400,
    bossHp: 245000,
    bossDef: 1850,
    defaultNuker: 'Teshar',
    turnOrder: ['Prilea (ดีบัฟเกราะ)', 'Konamiya / Teon (เร่งเทิร์น+บัฟ ATK)', 'Teshar (สกิล 3 กวาดเวฟ)', 'Homunculus / Luna', 'Deborah'],
  },
  {
    id: 'dragon',
    nameTh: "Dragon's Lair (มังกรไฟ)",
    element: 'Fire',
    waveMobHp: 15200,
    waveMobDef: 890,
    midBossHp: 78000,
    midBossDef: 1350,
    bossHp: 215000,
    bossDef: 1650,
    defaultNuker: 'Liam',
    turnOrder: ['Kyle / Shaina (เจาะเกราะ)', 'Konamiya (บูสต์เกจ)', 'Julie (กวาดเวฟแรก)', 'Liam (สกิล 3 ปลิดชีพบอส)'],
  },
  {
    id: 'necro',
    nameTh: "Necropolis (เนโครลิช)",
    element: 'Dark',
    waveMobHp: 14500,
    waveMobDef: 950,
    midBossHp: 72000,
    midBossDef: 1200,
    bossHp: 195000,
    bossDef: 1500,
    defaultNuker: 'Lushen',
    turnOrder: ['Lushen (ตัดเวฟ 1 และ 3)', 'Colleen (บัฟ ATK+ฮีล)', 'Abigail / Icaru', 'Astar / Shamann'],
  },
  {
    id: 'spiritual',
    nameTh: 'Spiritual Realm (วิญญาณเรล์ม)',
    element: 'Wind',
    waveMobHp: 15800,
    waveMobDef: 980,
    midBossHp: 80000,
    midBossDef: 1300,
    bossHp: 220000,
    bossDef: 1700,
    defaultNuker: 'Kahli',
    turnOrder: ['Prilea / Raoq', 'Verdehile (เร่งเกจ)', 'Kahli (สอยบอส)', 'Brandia (ยิงนิวเคลียร์)'],
  },
  {
    id: 'steel',
    nameTh: 'Steel Fortress (ป้อมเหล็ก)',
    element: 'Wind',
    waveMobHp: 16000,
    waveMobDef: 1100,
    midBossHp: 82000,
    midBossDef: 1380,
    bossHp: 230000,
    bossDef: 1800,
    defaultNuker: 'Zinc',
    turnOrder: ['Zinc / Eirgar (ปิดบัฟ)', 'Loren (ลบเกจ)', 'Kro / Brandia', 'Pang'],
  },
];

export const NUKER_PRESETS = [
  {
    name: 'Teshar',
    element: 'wind',
    skillName: 'Tempest (สกิล 3)',
    baseAtk: 1098,
    baseSpd: 109,
    multiplier: 4.5,
    hits: 1,
    ignoresDef: false,
    skillupBonus: 1.25, // 25% extra skillup dmg
    note: 'รีเซ็ตคูลดาวน์ทันทีเมื่อฆ่าศัตรูตาย ใช้เคลียร์เวฟ 1 และ 2 แบบต่อเนื่อง',
  },
  {
    name: 'Lushen',
    element: 'wind',
    skillName: 'Amputation Magic (สกิล 3)',
    baseAtk: 900,
    baseSpd: 103,
    multiplier: 1.0, // 3 hits of 1.0 = 3.0 total
    hits: 3,
    ignoresDef: true,
    skillupBonus: 1.3, // 30% extra skillup dmg
    note: 'ละเลยพลังป้องกัน (Ignore DEF) กวาดเวฟ 100% โดยไม่ต้องพึ่งดีบัฟเกราะแตก',
  },
  {
    name: 'Liam',
    element: 'water',
    skillName: 'Wave Cleave (สกิล 3)',
    baseAtk: 944,
    baseSpd: 105,
    multiplier: 5.2,
    hits: 1,
    ignoresDef: false,
    skillupBonus: 1.2,
    note: 'สกิลรุนแรงสูงมากเมื่อมีบัฟ ATK และศัตรูติดเจาะเกราะ',
  },
  {
    name: 'Julie',
    element: 'water',
    skillName: 'Card Spread (สกิล 3)',
    baseAtk: 834,
    baseSpd: 103,
    multiplier: 0.8,
    hits: 6,
    ignoresDef: false,
    skillupBonus: 1.25,
    note: 'ปาการ์ด 6 ใบเมื่อเลือดเต็ม 100% กวาดเวฟแรกของดราก้อนได้สะอาด',
  },
  {
    name: 'Kahli',
    element: 'fire',
    skillName: 'God of Fire (สกิล 2)',
    baseAtk: 878,
    baseSpd: 102,
    multiplier: 3.2,
    hits: 1,
    ignoresDef: true,
    skillupBonus: 1.2,
    note: 'เจาะเกราะทะลวงเดี่ยว 45,000+ ดาเมจแน่นอน',
  },
];

/**
 * Calculates real in-combat speed including totem and leader skill
 */
export function calculateCombatSpeed({ baseSpd = 100, runeSpd = 0, speedLead = 0, speedTotem = 15 }) {
  const leadBonus = (baseSpd * speedLead) / 100;
  const totemBonus = (baseSpd * speedTotem) / 100;
  return Math.floor(baseSpd + runeSpd + leadBonus + totemBonus);
}

/**
 * Calculates net damage dealt by a speed farm nuker to Abyss Hard mobs
 */
export function calculateAbyssDamage({
  nuker = NUKER_PRESETS[0],
  dungeon = ABYSS_DUNGEONS[0],
  totalAtk = 2800,
  critDmg = 210, // %
  artifactSkillCd = 15, // %
  artifactDmgOnElement = 12, // %
  hasAtkBuff = true,
  hasDefBreak = true,
  fightSetsCount = 2, // 2 Fight sets = +16% base ATK
}) {
  const baseAtk = nuker.baseAtk || 1000;
  const atkBuffMultiplier = hasAtkBuff ? 1.5 : 1.0;
  const fightBonusAtk = (baseAtk * (fightSetsCount * 8)) / 100;
  const effectiveAtk = (totalAtk + fightBonusAtk) * atkBuffMultiplier;

  const cdTotal = 1 + (critDmg + artifactSkillCd) / 100;
  const elemBonus = 1 + artifactDmgOnElement / 100;
  const skillup = nuker.skillupBonus || 1.25;

  let damageReduction = 1.0;
  if (!nuker.ignoresDef) {
    const rawDef = dungeon.waveMobDef || 1000;
    const effectiveDef = hasDefBreak ? rawDef * 0.3 : rawDef;
    damageReduction = 1000 / (1000 + 3 * effectiveDef);
  }

  // Com2uS Damage Formula per hit
  const rawHitDmg = effectiveAtk * nuker.multiplier * cdTotal * elemBonus * skillup * damageReduction;
  const singleHitDmg = Math.round(rawHitDmg);
  const totalDamage = singleHitDmg * (nuker.hits || 1);

  // Compare against wave mob HP
  const targetHp = dungeon.waveMobHp || 16000;
  const isOneShot = totalDamage >= targetHp;
  const margin = totalDamage - targetHp;
  const percentOfHp = Math.round((totalDamage / targetHp) * 100);

  // Calculate missing stat recommendation if failed
  let advice = '';
  if (isOneShot) {
    advice = `วันช็อตสำเร็จ 100%! ดาเมจเกินเลือดม็อบเวฟอยู่ +${margin.toLocaleString()} (${percentOfHp}%)`;
  } else {
    const neededRatio = targetHp / totalDamage;
    const missingArtifactDmg = Math.ceil((neededRatio - 1) * 100);
    const missingAtk = Math.ceil((targetHp - totalDamage) / (totalDamage / effectiveAtk));
    advice = `ดาเมจขาดอีก ${Math.abs(margin).toLocaleString()} (${percentOfHp}%) — แนะนำเพิ่ม ATK +${missingAtk} หรือใส่อาร์ติแฟกต์ Damage on ${dungeon.element} +${missingArtifactDmg}%`;
  }

  return {
    singleHitDmg,
    totalDamage,
    targetHp,
    isOneShot,
    margin,
    percentOfHp,
    advice,
  };
}
