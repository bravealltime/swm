// Rune Grind & Enchant Missing Tracker Scanner
// Analyzes player runes from SWEX JSON and identifies missing grinds / gem opportunities

import { boxRunes } from './swexImport.js';

export const GRINDABLE_STATS = new Set(['SPD', 'HP%', 'ATK%', 'DEF%', 'HP', 'ATK', 'DEF']);
export const PERCENT_OR_SPD_STATS = new Set(['SPD', 'HP%', 'ATK%', 'DEF%']);
export const FLAT_STATS = new Set(['HP', 'ATK', 'DEF']);

// Max Hero / Legend Grind amounts for reference
export const MAX_GRINDS = {
  SPD: { hero: 4, legend: 5, label: '+4~5 SPD' },
  'HP%': { hero: 7, legend: 10, label: '+7~10% HP' },
  'ATK%': { hero: 7, legend: 10, label: '+7~10% ATK' },
  'DEF%': { hero: 7, legend: 10, label: '+7~10% DEF' },
  HP: { hero: 430, legend: 550, label: '+430~550 HP' },
  ATK: { hero: 22, legend: 30, label: '+22~30 ATK' },
  DEF: { hero: 22, legend: 30, label: '+22~30 DEF' },
};

// Which dungeon or raid drops the grinds for each rune set
export const SET_FARM_SOURCES = {
  Swift: 'ไจแอนท์ (GB10/Abyss) / เรด R5',
  Despair: 'ไจแอนท์ (GB10/Abyss) / เรด R5',
  Fatal: 'ไจแอนท์ (GB10/Abyss) / เรด R5',
  Blade: 'ไจแอนท์ (GB10/Abyss) / เรด R5',
  Energy: 'ไจแอนท์ (GB10/Abyss) / เรด R5',
  Violent: 'ดราก้อน (DB10/Abyss) / เรด R5',
  Revenge: 'ดราก้อน (DB10/Abyss) / เรด R5',
  Shield: 'ดราก้อน (DB10/Abyss) / เรด R5',
  Guard: 'ดราก้อน (DB10/Abyss) / เรด R5',
  Endure: 'ดราก้อน (DB10/Abyss) / เรด R5',
  Will: 'เนโคร (NB10/Abyss) / เรด R5',
  Nemesis: 'เนโคร (NB10/Abyss) / เรด R5',
  Vampire: 'เนโคร (NB10/Abyss) / เรด R5',
  Destroy: 'เนโคร (NB10/Abyss) / เรด R5',
  Rage: 'เนโคร (NB10/Abyss) / เรด R5',
  Fight: 'Rift Beasts (มังกรธาตุ) / คราฟท์',
  Determination: 'Rift Beasts (มังกรธาตุ) / คราฟท์',
  Enhance: 'Rift Beasts (มังกรธาตุ) / คราฟท์',
  Accuracy: 'Rift Beasts (มังกรธาตุ) / คราฟท์',
  Tolerance: 'Rift Beasts (มังกรธาตุ) / คราฟท์',
  Seal: 'Spiritual Realm (SR10) / เรด R5',
  Intangible: 'ดันเจี้ยน Abyss ทุกที่ (โอกาสดรอปพิเศษ)',
};

/**
 * Scan all runes in player box and return detailed grind/gem missing analysis
 * @param {Object} box - parsed SWEX box
 */
export function scanMissingGrinds(box) {
  const runes = boxRunes(box);
  if (!runes.length) {
    return {
      totalRunes: 0,
      missingGrindRunes: [],
      stats: {
        total: 0,
        missingAny: 0,
        missingSpd: 0,
        missingPercent: 0,
        gemOpportunities: 0,
      },
    };
  }

  const analyzed = [];
  let countMissingSpd = 0;
  let countMissingPercent = 0;
  let countGemOpportunities = 0;

  for (const r of runes) {
    // Only analyze 5★ and 6★ runes that are at least +9 or Hero/Legend
    if (r.stars < 5) continue;

    const ungroundSubs = [];
    const lowGroundSubs = [];
    const gemmableFlats = [];
    let potentialScore = 0;
    const isEnchanted = r.subs.some((s) => s.enchanted);

    for (const sub of r.subs) {
      const isGrindable = GRINDABLE_STATS.has(sub.stat);

      if (isGrindable) {
        if (!sub.grind || sub.grind === 0) {
          // Completely unground
          ungroundSubs.push({
            stat: sub.stat,
            value: sub.value,
            maxGain: MAX_GRINDS[sub.stat]?.label || '+Grind',
            isSpd: sub.stat === 'SPD',
            isPercent: sub.stat.endsWith('%'),
          });

          if (sub.stat === 'SPD') {
            potentialScore += 50; // High weight for SPD
          } else if (sub.stat.endsWith('%')) {
            potentialScore += 25;
          } else {
            potentialScore += 5;
          }
        } else {
          // Check if low grind (e.g. SPD was ground +2 or +3, can improve to +4~+5)
          if (sub.stat === 'SPD' && sub.grind < 4) {
            lowGroundSubs.push({
              stat: sub.stat,
              value: sub.value,
              currentGrind: sub.grind,
              maxGain: '+4~5 SPD (อัปเกรดได้อีก)',
            });
            potentialScore += 15;
          } else if (sub.stat.endsWith('%') && sub.grind < 6) {
            lowGroundSubs.push({
              stat: sub.stat,
              value: sub.value,
              currentGrind: sub.grind,
              maxGain: '+7~10% (อัปเกรดได้อีก)',
            });
            potentialScore += 10;
          }
        }
      }

      // Check for flat stat gemmable opportunity (flat HP, flat DEF, flat ATK)
      if (FLAT_STATS.has(sub.stat) && !sub.enchanted && !isEnchanted) {
        gemmableFlats.push({
          stat: sub.stat,
          value: sub.value,
          suggestedGem: sub.stat === 'HP' ? 'HP% / SPD / CRI Rate' : 'DEF% / SPD / CRI Dmg',
        });
        potentialScore += 20;
      }
    }

    if (ungroundSubs.some((s) => s.isSpd)) countMissingSpd++;
    if (ungroundSubs.some((s) => s.isPercent)) countMissingPercent++;
    if (gemmableFlats.length > 0) countGemOpportunities++;

    if (ungroundSubs.length > 0 || lowGroundSubs.length > 0 || gemmableFlats.length > 0) {
      analyzed.push({
        ...r,
        ungroundSubs,
        lowGroundSubs,
        gemmableFlats,
        potentialScore,
        farmSource: SET_FARM_SOURCES[r.set] || 'Rift Raid R5',
        missingCount: ungroundSubs.length,
      });
    }
  }

  // Sort by potential score descending (highest value runes to grind first)
  analyzed.sort((a, b) => b.potentialScore - a.potentialScore || b.eff - a.eff);

  return {
    totalRunes: runes.length,
    missingGrindRunes: analyzed,
    stats: {
      total: runes.length,
      missingAny: analyzed.length,
      missingSpd: countMissingSpd,
      missingPercent: countMissingPercent,
      gemOpportunities: countGemOpportunities,
    },
  };
}
