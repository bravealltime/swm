// Artifact Substat Quality & God-Roll Evaluator for Summoners War
import { ARTIFACT_EFFECT_NAMES } from './swexImport';

// High-impact meta substats with their ideal wearers
const ARTIFACT_ARCHETYPES = {
  207: { // Added Damage by SPD
    name: 'ดาเมจเสริมตาม SPD',
    minGod: 16,
    minHigh: 11,
    wearers: ['Juno', 'Miles', 'Moore', 'Dominic', 'Ethna', 'Sonia', 'Adriana', 'Chiwu'],
    role: 'Multi-hit Fast Attackers',
  },
  204: { // Added Damage by HP
    name: 'ดาเมจเสริมตาม HP',
    minGod: 16,
    minHigh: 11,
    wearers: ['Mo Long', 'Skogul', 'Eshir', 'Karnal', 'Chandra', 'Byungchul', 'Vigor'],
    role: 'Tank Bruisers',
  },
  205: { // Added Damage by ATK
    name: 'ดาเมจเสริมตาม ATK',
    minGod: 16,
    minHigh: 11,
    wearers: ['Kaki', 'Dominic', 'Seara', 'Liebli', 'Suiki', 'John'],
    role: 'Pure ATK / Bomb Attackers',
  },
  206: { // Added Damage by DEF
    name: 'ดาเมจเสริมตาม DEF',
    minGod: 16,
    minHigh: 11,
    wearers: ['Feng Yan', 'Tractor', 'Copper', 'Verad', 'Velajuel', 'Abellio'],
    role: 'DEF Scaling Monsters',
  },
  208: { // Crit DMG Taken -%
    name: 'ลดดาเมจคริที่ได้รับ',
    minGod: 16,
    minHigh: 11,
    wearers: ['Camilla', 'Byungchul', 'Chandra', 'Leo', 'Juno', 'Abellio'],
    role: 'Anti-Snipe Tanks',
  },
  404: { // First Turn Crit DMG+
    name: 'ดาเมจคริเทิร์นแรก',
    minGod: 16,
    minHigh: 11,
    wearers: ['Lushen', 'Sonia', 'Savannah', 'Daphnis', 'Katarina', 'Claire'],
    role: 'Turn-1 Cleave / Snipers',
  },
  400: { // Life Drain
    name: 'ดูดเลือด (Life Drain)',
    minGod: 16,
    minHigh: 11,
    wearers: ['Douglas', 'Laika', 'Chow', 'Rakan', 'Trevor'],
    role: 'Solo Carry Bruisers',
  },
  401: { // Crit DMG+ as HP is bad
    name: 'ดาเมจคริเมื่อเลือดลดลง',
    minGod: 20,
    minHigh: 13,
    wearers: ['Douglas', 'Trevor', 'Chow', 'Laika', 'Camilla', 'Rakan'],
    role: 'Clutch Comeback Units',
  },
  302: { // Skill 3 Crit DMG
    name: 'ดาเมจคริ สกิล 3',
    minGod: 16,
    minHigh: 11,
    wearers: ['Lushen', 'Savannah', 'Daphnis', 'Baleygr', 'Sonia', 'Katarina'],
    role: 'S3 Nuke Burst',
  },
  301: { // Skill 2 Crit DMG
    name: 'ดาเมจคริ สกิล 2',
    minGod: 16,
    minHigh: 11,
    wearers: ['Taor', 'Lagmaron', 'Theomars', 'Kaki', 'Suiki'],
    role: 'S2 Heavy Hitters',
  },
};

/**
 * Evaluate single artifact substats and calculate roll quality score
 * @param {Object} art - artifact object from SWEX box
 * @param {Array} ownedUnits - list of owned unit objects in player box
 */
export function evaluateArtifactRolls(art, ownedUnits = []) {
  const subs = Array.isArray(art.subs) ? art.subs : [];
  let totalScore = 50;
  const highRolls = [];
  const recommendedMonsters = new Set();

  subs.forEach((s) => {
    const statId = s[0];
    const val = s[1] || 0;
    const meta = ARTIFACT_ARCHETYPES[statId];

    if (meta) {
      if (val >= meta.minGod) {
        totalScore += 25;
        highRolls.push({
          statId,
          name: meta.name,
          value: val,
          tier: 'GOD',
          label: `🌟 Quad/Triple ${meta.name} +${val}%`,
        });
        meta.wearers.forEach((w) => recommendedMonsters.add(w));
      } else if (val >= meta.minHigh) {
        totalScore += 12;
        highRolls.push({
          statId,
          name: meta.name,
          value: val,
          tier: 'HIGH',
          label: `💎 High Roll ${meta.name} +${val}%`,
        });
        meta.wearers.forEach((w) => recommendedMonsters.add(w));
      }
    }
  });

  // Assign overall roll tier
  let rollTier = 'STANDARD';
  let tierLabel = 'ทั่วไป (Standard)';
  let tierColor = 'text-slate-400 bg-white/[0.04] border-white/10';

  if (highRolls.some((r) => r.tier === 'GOD') || totalScore >= 90) {
    rollTier = 'GOD';
    tierLabel = '🌟 ระดับเทพ (God Roll)';
    tierColor = 'text-amber-300 bg-amber-500/20 border-amber-500/40';
  } else if (highRolls.length >= 2 || totalScore >= 74) {
    rollTier = 'LEGEND';
    tierLabel = '💎 ระดับสูง (Legend Roll)';
    tierColor = 'text-cyan-300 bg-cyan-500/20 border-cyan-500/40';
  } else if (highRolls.length === 1 || totalScore >= 62) {
    rollTier = 'HERO';
    tierLabel = '✨ ออฟสวย (Hero Roll)';
    tierColor = 'text-purple-300 bg-purple-500/20 border-purple-500/40';
  }

  // Find which monsters in player's box match the recommended wearers
  const ownedMatches = [];
  if (Array.isArray(ownedUnits)) {
    ownedUnits.forEach((u) => {
      const uName = u.info?.name || u.name || '';
      if (recommendedMonsters.has(uName)) {
        // Also check if element matches if artifact has element
        const uElement = (u.element || u.info?.element || '').toLowerCase();
        const artElement = (art.element || '').toLowerCase();
        if (!artElement || artElement === uElement) {
          ownedMatches.push({
            id: u.id,
            name: uName,
            thaiName: u.info?.thaiName || uName,
            avatarUrl: u.avatarUrl || u.info?.avatarUrl,
            element: uElement,
          });
        }
      }
    });
  }

  return {
    ...art,
    score: Math.min(100, totalScore),
    rollTier,
    tierLabel,
    tierColor,
    highRolls,
    recommendedMonsters: [...recommendedMonsters],
    matchedOwnedWearers: ownedMatches.slice(0, 5),
  };
}

/**
 * Scan all artifacts in box and find god-tier / high-roll items
 * @param {Array} artifacts - list of artifacts
 * @param {Array} units - player box units
 */
export function scanGodTierArtifacts(artifacts = [], units = []) {
  if (!Array.isArray(artifacts)) return [];
  const evaluated = artifacts.map((art) => evaluateArtifactRolls(art, units));
  return evaluated
    .filter((a) => a.rollTier === 'GOD' || a.rollTier === 'LEGEND')
    .sort((a, b) => b.score - a.score);
}
