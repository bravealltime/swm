/**
 * AI Tactical Counter Scanner & Battle Plan Engine for Summoners War
 * Analyzes player's real box data (runes, speed, sets) against enemy Siege defenses
 */

// Role mappings for substitute advisor
export const ROLE_TAXONOMY = {
  STRIPPER: {
    title: 'ตัวลบบัพศัตรู (Stripper)',
    monsters: [
      'Tiana', 'Triton', 'Chiwu', 'Juno', 'Praha', 'Moore', 'Haathor',
      'Chilling', 'Clara', 'Soha', 'Aquila', 'Iris', 'Robo (Fire)', 'Robo (Wind)',
      'Gina', 'Gemini', 'Bolverk', 'Elsharion', 'Giana'
    ],
  },
  DEF_BREAKER: {
    title: 'ตัวเจาะเกราะ / ซัพพอร์ต (Def Breaker / Buffer)',
    monsters: [
      'Galleon', 'Luer', 'Bastet', 'Megan', 'Gemini', 'Anavel', 'Savannah',
      'Loren', 'Kahli', 'Belladeon', 'Orion', 'Draco', 'Carcano', 'Mirinae',
      'Feng Yan', 'Chun-Li', 'Celine', 'Ethna', 'Ken'
    ],
  },
  NUKER: {
    title: 'ตัวดาเมจหลัก (Nuker / Damage Dealer)',
    monsters: [
      'Julie', 'Lushen', 'Kaki', 'Theomars', 'Alicia', 'Bael', 'Poseidon',
      'Kage', 'Zaiross', 'Sige', 'Toshar', 'Khmun', 'Skogul', 'Carcano',
      'Tesarion', 'Aegir', 'Dominic', 'Miles', 'Sonia', 'Bael', 'Leah'
    ],
  },
  CLEANSER_HEALER: {
    title: 'ตัวแก้ดีบัพ / ฟื้นฟู (Cleanser & Immunity)',
    monsters: [
      'Tetra', 'Lulu', 'Veromos', 'Riley', 'Fran', 'Woosa', 'Velajuel',
      'Harmonia', 'Triana', 'Delphoi', 'Amelia', 'Ariel', 'Abellio',
      'Racuni', 'Betta', 'Kona', 'Fedora', 'Louise'
    ],
  },
  BRUISER_TANK: {
    title: 'บรูเซอร์ / แทงก์ชนดาเมจ (Bruiser & Tank)',
    monsters: [
      'Skogul', 'Ritesh', 'Feng Yan', 'Camilla', 'Mo Long', 'Byungchul',
      'Dominic', 'Chandra', 'Aegir', 'Khmun', 'Vigor', 'Eshir',
      'Jultan', 'Leo', 'Kinki', 'Mei Hou Wang', 'Kumbhira'
    ],
  },
};

// Enemy threat priority ranking for Kill Priority calculation
const THREAT_PRIORITIES = [
  // Tier 1: Immediate lethal armor breakers / speed openers / one-shot nukers
  { pattern: /savannah|carcano|dominic|miles|sonia|lushen|kaki|julie|kage|perna|seara/i, priority: 1, reason: 'ดาเมจสูงและมีสกิลปลิดชีพ ต้องรีบกำจัดก่อนจะทำลายแถวรบ' },
  // Tier 2: Strippers & turn manipulators
  { pattern: /clara|orion|triton|chiwu|tiana|eshir|vigor|draco|gemini|iris/i, priority: 2, reason: 'ตัวเปิดลบบัพและป่วนเทิร์น กำจัดเพื่อตัดความได้เปรียบ' },
  // Tier 3: Dangerous revivers / sustains
  { pattern: /nana|vanessa|taranys|betta|eladriel|amarna|triana|harmonia/i, priority: 3, reason: 'ตัวชุบชีวิตและเซฟเพื่อน ล็อกเป้าเพื่อป้องกันการยื้อเกม' },
  // Tier 4: Passive tanks / Endure survivors (handle last)
  { pattern: /theomars|camilla|halphas|byungchul|feng yan|chandra|mo long|kinki/i, priority: 4, reason: 'มีพาสซีฟอมตะหรือถึกสูง ให้เคลียร์ตัวอื่นก่อนแล้วค่อยรุมปิดฉาก' },
];

/**
 * Determine the threat rank of an enemy monster
 */
export function getMonsterThreat(monsterName) {
  const name = String(monsterName || '').trim();
  for (const item of THREAT_PRIORITIES) {
    if (item.pattern.test(name)) {
      return { priority: item.priority, reason: item.reason, name };
    }
  }
  return { priority: 3, reason: 'เป้าหมายทั่วไป กำจัดตามลำดับความสะดวก', name };
}

/**
 * Calculates step-by-step Kill Priority for an enemy defense team
 */
export function calculateKillPriority(defenseMonsters = []) {
  if (!Array.isArray(defenseMonsters) || defenseMonsters.length === 0) return [];

  const rated = defenseMonsters.map((m, idx) => {
    const name = typeof m === 'string' ? m : m.name || `Monster #${idx + 1}`;
    const threat = getMonsterThreat(name);
    return { name, ...threat };
  });

  // Sort by priority (lowest number = highest priority)
  rated.sort((a, b) => a.priority - b.priority);

  return rated.map((item, idx) => ({
    step: idx + 1,
    targetName: item.name,
    badge: idx === 0 ? '🎯 เล็งเป้าหมายแรก (Focus 1st)' : idx === 1 ? '🎯 เป้าหมายที่สอง (Focus 2nd)' : '🎯 เป้าหมายสุดท้าย (Clean Up)',
    reason: item.reason,
    isPrimary: idx === 0,
  }));
}

/**
 * Checks Will rune coverage and immunity safety on friendly units
 */
export function checkWillSafety(units = [], enemyMonsters = []) {
  if (!Array.isArray(units) || units.length === 0) {
    return { isSafe: false, willCount: 0, status: 'warning', message: 'ยังไม่มีข้อมูลมอนสเตอร์ในทีม' };
  }

  const willUnits = [];
  const noWillUnits = [];
  let hasImmunityBuffer = false;

  for (const u of units) {
    if (!u) continue;
    const name = String(u.name || '').toLowerCase();
    const sets = Array.isArray(u.sets) ? u.sets : [];
    const hasWill = sets.some((s) => String(s).toLowerCase().includes('will'));

    if (/woosa|velajuel|amelia|riley|fran|delphoi|louise|betta/i.test(name)) {
      hasImmunityBuffer = true;
    }

    if (hasWill) {
      willUnits.push(u.name);
    } else {
      noWillUnits.push(u.name);
    }
  }

  // Check if enemy has dangerous openers
  const hasAggressiveEnemyOpener = (enemyMonsters || []).some((m) => {
    const name = typeof m === 'string' ? m : m?.name || '';
    return /clara|orion|savannah|triton|chiwu|eshir|draco|gemini|iris/i.test(name);
  });

  if (willUnits.length === units.length || hasImmunityBuffer) {
    return {
      isSafe: true,
      willCount: willUnits.length,
      status: 'safe',
      badge: '🛡️ Will / Immunity Check: ปลอดภัย 100%',
      detail: hasImmunityBuffer
        ? 'ทีมมีตัวกางบัพป้องกัน (Immunity) ปลอดภัยจากการโดนสตั้น/ดีบัพเทิร์นแรก'
        : `มอนสเตอร์ทุกตัวใส่รูน Will (${willUnits.length}/${units.length} ตัว) ทนทานต่อการโดนป่วนเทิร์นแรก`,
    };
  }

  if (willUnits.length > 0) {
    return {
      isSafe: true,
      willCount: willUnits.length,
      status: 'caution',
      badge: `⚠️ Will Check: ครอบคลุมบางส่วน (${willUnits.length}/${units.length} ตัว)`,
      detail: `ตัวที่ยังไม่มี Will: ${noWillUnits.join(', ')} — หากศัตรูเปิดด้วย Clara/Orion อาจโดนสลับสถานะได้`,
    };
  }

  return {
    isSafe: !hasAggressiveEnemyOpener,
    willCount: 0,
    status: hasAggressiveEnemyOpener ? 'danger' : 'neutral',
    badge: hasAggressiveEnemyOpener ? '🚨 คำเตือน: ไม่มีรูน Will เสี่ยงโดนคุมเทิร์น' : '⚡ ไม่มีรูน Will (เน้นชิงออกเทิร์นก่อน)',
    detail: hasAggressiveEnemyOpener
      ? 'ศัตรูมีตัวเปิดสปีดสูง หากศัตรูออกเทิร์นก่อน ทีมของคุณอาจโดนใบ้หรือเกราะแตกก่อนได้เดิน'
      : 'หากทีมของคุณมีความเร็วสูงกว่าอย่างชัดเจน สามารถเอาชนะได้โดยไม่ต้องพึ่งรูน Will',
  };
}

/**
 * Analyzes turn order and calculates speed gaps between units
 */
export function analyzeTurnOrder(units = []) {
  if (!Array.isArray(units) || units.length < 2) {
    return { turnOrder: [], hasSpeedGapWarning: false, maxGap: 0, summary: '' };
  }

  const sorted = [...units]
    .filter(Boolean)
    .sort((a, b) => (Number(b.spd) || 0) - (Number(a.spd) || 0));

  const gaps = [];
  let maxGap = 0;

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    const currentSpd = Number(current.spd) || 0;
    const nextSpd = Number(next.spd) || 0;
    const diff = Math.max(0, currentSpd - nextSpd);
    if (diff > maxGap) maxGap = diff;

    gaps.push({
      from: current.name,
      to: next.name,
      gapSpd: diff,
      isDangerous: diff > 28,
    });
  }

  const hasDangerousGap = gaps.some((g) => g.isDangerous);

  return {
    turnOrder: sorted.map((u, idx) => ({
      order: idx + 1,
      name: u.name,
      thaiName: u.thaiName,
      spd: u.spd || 100,
      baseSpd: u.baseSpd || 100,
      bonusSpd: Math.max(0, (u.spd || 100) - (u.baseSpd || 100)),
      sets: u.sets || [],
    })),
    gaps,
    maxGap,
    hasSpeedGapWarning: hasDangerousGap,
    status: hasDangerousGap ? 'warning' : 'optimal',
    summary: hasDangerousGap
      ? `⚠️ ช่องว่างสปีดกว้าง (+${maxGap} SPD): ศัตรูอาจแทรกเทิร์นได้ ควรจูนสปีดให้ห่างไม่เกิน 20-25 SPD`
      : `✅ สปีดจูนนิ่งกลมกลืน (Gap สูงสุด +${maxGap} SPD): ต่อคอมโบไหลลื่น ปลอดภัยจากการโดนแทรกเทิร์น`,
  };
}

/**
 * Suggest substitute monsters from user's box when a counter is missing 1 monster
 */
export function findSubstitutes(missingMonsterName, userUnitsMap) {
  if (!missingMonsterName || !userUnitsMap || userUnitsMap.size === 0) return [];

  const cleanMissing = String(missingMonsterName).toLowerCase().trim();

  // Find which role this missing monster belongs to
  let matchedRoleKey = null;
  for (const [key, roleData] of Object.entries(ROLE_TAXONOMY)) {
    if (roleData.monsters.some((m) => m.toLowerCase().includes(cleanMissing) || cleanMissing.includes(m.toLowerCase()))) {
      matchedRoleKey = key;
      break;
    }
  }

  if (!matchedRoleKey) {
    // Default fallback based on common name detection
    if (/loren|galleon|megan|bastet/i.test(cleanMissing)) matchedRoleKey = 'DEF_BREAKER';
    else if (/julie|lushen|kaki/i.test(cleanMissing)) matchedRoleKey = 'NUKER';
    else if (/lulu|tetra|veromos|riley/i.test(cleanMissing)) matchedRoleKey = 'CLEANSER_HEALER';
    else matchedRoleKey = 'BRUISER_TANK';
  }

  const role = ROLE_TAXONOMY[matchedRoleKey];
  const candidates = [];

  for (const targetName of role.monsters) {
    if (targetName.toLowerCase() === cleanMissing) continue;
    const owned = userUnitsMap.get(targetName.toLowerCase());
    if (owned && owned.runes >= 4) {
      candidates.push({
        name: owned.name,
        thaiName: owned.thaiName,
        spd: owned.spd,
        roleTitle: role.title,
        element: owned.element,
        sets: owned.sets || [],
        runeCount: owned.runes,
      });
    }
  }

  return candidates.slice(0, 3);
}
