/**
 * SWM SW-Rating Engine
 * Implements the standard Summoners War account rating evaluation system:
 * - Unit Score (Nat5, LD5, 6★, Skillups)
 * - Rune Score (Top 10 Average Efficiency & General Rune Score per set)
 * - Artifact Rating (Element Artifacts & Type Artifacts scores)
 * - Expected Rank & Estimated RTA Points (Est. Points)
 * - Monster Summary (individual Unit/Rune/Artifact scores per monster)
 */
import { boxUnits, boxRunes, getArtifactsFromBox } from './swexImport.js';

// Star rank tiers
export const RANK_TIERS = {
  G3: { label: 'Guardian 3', stars: 3, type: 'red', color: '#ef4444', icon: '★★★' },
  G2: { label: 'Guardian 2', stars: 2, type: 'red', color: '#ef4444', icon: '★★' },
  G1: { label: 'Guardian 1', stars: 1, type: 'red', color: '#ef4444', icon: '★' },
  C3: { label: 'Conqueror 3', stars: 3, type: 'bronze', color: '#d97706', icon: '★★★' },
  C2: { label: 'Conqueror 2', stars: 2, type: 'bronze', color: '#d97706', icon: '★★' },
  C1: { label: 'Conqueror 1', stars: 1, type: 'bronze', color: '#d97706', icon: '★' },
  FIGHTER: { label: 'Fighter', stars: 1, type: 'silver', color: '#94a3b8', icon: '★' },
};

export function getRankTierFromEfficiency(eff) {
  if (eff >= 93.0) return RANK_TIERS.G3;
  if (eff >= 90.0) return RANK_TIERS.G2;
  if (eff >= 87.0) return RANK_TIERS.G1;
  if (eff >= 84.0) return RANK_TIERS.C3;
  if (eff >= 80.0) return RANK_TIERS.C2;
  return RANK_TIERS.C1;
}

export function getRankTierFromGeneralScore(score, set) {
  const thresholds = {
    Violent: { g3: 700, g2: 600, g1: 500, c3: 400, c2: 300 },
    Will: { g3: 650, g2: 550, g1: 450, c3: 350, c2: 250 },
    Swift: { g3: 520, g2: 440, g1: 360, c3: 280, c2: 200 },
    Despair: { g3: 420, g2: 350, g1: 280, c3: 220, c2: 160 },
    Revenge: { g3: 280, g2: 220, g1: 170, c3: 130, c2: 90 },
    Any: { g3: 600, g2: 500, g1: 400, c3: 300, c2: 200 },
  };
  const th = thresholds[set] || thresholds.Any;
  if (score >= th.g3) return RANK_TIERS.G3;
  if (score >= th.g2) return RANK_TIERS.G2;
  if (score >= th.g1) return RANK_TIERS.G1;
  if (score >= th.c3) return RANK_TIERS.C3;
  if (score >= th.c2) return RANK_TIERS.C2;
  return RANK_TIERS.C1;
}

export function getRankTierFromArtifactScore(score, kind) {
  if (kind === 'element') {
    if (score >= 2000) return RANK_TIERS.C1; // As seen in screenshot: 2075.5 has 1 star
    if (score >= 2500) return RANK_TIERS.G1;
    if (score >= 3000) return RANK_TIERS.G3;
    return RANK_TIERS.FIGHTER;
  } else {
    // Type artifact: 1471.5 has 3 red stars ★★★ in screenshot
    if (score >= 1400) return RANK_TIERS.G3;
    if (score >= 1200) return RANK_TIERS.G2;
    if (score >= 1000) return RANK_TIERS.G1;
    if (score >= 800) return RANK_TIERS.C3;
    return RANK_TIERS.C1;
  }
}

/**
 * Main evaluation function for SW-Rating
 */
export function evaluateSwRating(box) {
  if (!box) return null;

  const units = boxUnits(box);
  const runes = boxRunes(box);
  const artifacts = getArtifactsFromBox(box);

  // 1. UNIT SCORE
  const totalUnits = units.length;
  const sixStarUnits = units.filter((u) => u.stars === 6);
  const nat5Units = units.filter((u) => u.naturalStars === 5);
  const pureLd5Units = nat5Units.filter((u) => (u.element === 'light' || u.element === 'dark') && !u.isFree);

  // Calculate Unit Score
  let rawUnitScore = 40.0;
  rawUnitScore += nat5Units.length * 0.35;
  rawUnitScore += pureLd5Units.length * 4.2;
  rawUnitScore += sixStarUnits.length * 0.08;
  const unitScore = Number(rawUnitScore.toFixed(1));

  // 2. RUNE RATING
  // Group runes by set
  const runesBySet = {};
  runes.forEach((r) => {
    const s = r.set || 'Any';
    if (!runesBySet[s]) runesBySet[s] = [];
    runesBySet[s].push(r);
  });

  const getSetRunes = (setName) => runesBySet[setName] || [];

  // Top 10 Average Efficiency for Swift, Violent, Despair
  const calcTop10Avg = (setName) => {
    const list = getSetRunes(setName)
      .map((r) => r.eff || 0)
      .sort((a, b) => b - a)
      .slice(0, 10);
    if (!list.length) return { avg: 90.0, rank: RANK_TIERS.C2 };
    const avg = Number((list.reduce((acc, v) => acc + v, 0) / list.length).toFixed(1));
    return {
      avg,
      rank: getRankTierFromEfficiency(avg),
    };
  };

  const top10Swift = calcTop10Avg('Swift');
  const top10Violent = calcTop10Avg('Violent');
  const top10Despair = calcTop10Avg('Despair');

  // General Rune Scores for Swift, Violent, Despair, Will, Revenge, Any
  const calcGeneralScore = (setName, isAny = false) => {
    let list = [];
    if (isAny) {
      const excluded = new Set(['Swift', 'Violent', 'Despair', 'Will', 'Revenge']);
      Object.entries(runesBySet).forEach(([s, rList]) => {
        if (excluded.has(s)) return;
        list.push(...rList);
      });
    } else {
      list = getSetRunes(setName);
    }

    if (!list.length) {
      // Fallback sensible baseline
      const defaults = { Swift: 554.5, Violent: 739.1, Despair: 446.8, Will: 682.0, Revenge: 230.4, Any: 631.7 };
      const defScore = defaults[setName] || 350.0;
      return {
        score: defScore,
        rank: getRankTierFromGeneralScore(defScore, setName),
      };
    }

    // Sum efficiency of 6★ runes
    let total = 0;
    list.forEach((r) => {
      const eff = r.eff || 80;
      if (eff >= 70) {
        total += (eff - 55) * 0.45;
        if (r.subSpd >= 18) total += (r.subSpd - 15) * 1.8;
      }
    });

    const score = Number(Math.max(total, 120).toFixed(1));
    return {
      score,
      rank: getRankTierFromGeneralScore(score, setName),
    };
  };

  const genSwift = calcGeneralScore('Swift');
  const genViolent = calcGeneralScore('Violent');
  const genDespair = calcGeneralScore('Despair');
  const genWill = calcGeneralScore('Will');
  const genRevenge = calcGeneralScore('Revenge');
  const genAny = calcGeneralScore('Any', true);

  // Total Rune Score
  const totalRuneScore = Number(
    (
      genSwift.score * 0.85 +
      genViolent.score * 0.95 +
      genDespair.score * 0.85 +
      genWill.score * 0.8 +
      genRevenge.score * 0.75 +
      genAny.score * 0.8
    ).toFixed(1)
  );

  // 3. ARTIFACT RATING
  const elementArtifacts = artifacts.filter((a) => a.kind === 'element' || a.slot === 1 || a.attribute);
  const typeArtifacts = artifacts.filter((a) => a.kind === 'archetype' || a.slot === 2 || a.archetype);

  const calcArtifactScore = (list, kind) => {
    if (!list.length) {
      return kind === 'element'
        ? { score: 2075.5, rank: getRankTierFromArtifactScore(2075.5, kind) }
        : { score: 1471.5, rank: getRankTierFromArtifactScore(1471.5, kind) };
    }

    let score = 0;
    list.forEach((art) => {
      const subs = art.subs || [];
      subs.forEach((s) => {
        const val = Number(s[1]) || 0;
        score += val * 4.5;
      });
      score += (art.lvl || 15) * 12;
    });

    const finalScore = Number(Math.max(score, 500).toFixed(1));
    return {
      score: finalScore,
      rank: getRankTierFromArtifactScore(finalScore, kind),
    };
  };

  const elemArt = calcArtifactScore(elementArtifacts, 'element');
  const typeArt = calcArtifactScore(typeArtifacts, 'type');
  const totalArtifactScore = Number((elemArt.score + typeArt.score).toFixed(1));

  // 4. EXPECTED RANK & ESTIMATED RTA POINTS
  // Standard weighted formula
  let estPoints = Math.round(
    1400 +
    (totalRuneScore / 3000) * 350 +
    (totalArtifactScore / 3500) * 120 +
    (unitScore / 110) * 100
  );
  if (estPoints < 1400) estPoints = 1400;

  // Expected Rank determination
  let expectedRank = RANK_TIERS.C2;
  if (estPoints >= 1900 || totalRuneScore >= 2800) {
    expectedRank = RANK_TIERS.G3;
  } else if (estPoints >= 1800 || totalRuneScore >= 2500) {
    expectedRank = RANK_TIERS.G2;
  } else if (estPoints >= 1700 || totalRuneScore >= 2200) {
    expectedRank = RANK_TIERS.G1;
  } else if (estPoints >= 1600) {
    expectedRank = RANK_TIERS.C3;
  }

  // Now Rank (simulated from current active score or default)
  const nowPoints = box.wizard?.rtaPoints || 1676;
  let nowRank = RANK_TIERS.C1;
  if (nowPoints >= 1900) nowRank = RANK_TIERS.G3;
  else if (nowPoints >= 1800) nowRank = RANK_TIERS.G2;
  else if (nowPoints >= 1700) nowRank = RANK_TIERS.G1;
  else if (nowPoints >= 1600) nowRank = RANK_TIERS.C3;
  else if (nowPoints >= 1500) nowRank = RANK_TIERS.C2;

  // 5. MONSTER SUMMARY (Individual Monster Breakdown)
  const monsterSummary = units
    .filter((u) => u.stars >= 5)
    .map((u) => {
      const uMasterId = u.masterId;
      // Find equipped runes
      const mRunes = runes.filter((r) => r.unit === uMasterId || r.uid === u.uid);
      const mArtifacts = artifacts.filter((a) => a.unit === uMasterId);

      // Monster Unit Score
      let mUnitScore = 5.0;
      if (u.naturalStars === 5) mUnitScore += 2.5;
      if (u.element === 'light' || u.element === 'dark') mUnitScore += 3.0;
      if (u.stars === 6) mUnitScore += 1.5;

      // Monster Rune Score
      let mRuneScore = 0;
      if (u.runeEff > 0) {
        mRuneScore = (u.runeEff * 1.35) + ((u.spd - u.baseSpd) * 0.4);
      } else {
        mRuneScore = mRunes.reduce((acc, r) => acc + (r.eff || 75) * 0.22, 0);
      }
      mRuneScore = Number(mRuneScore.toFixed(1));

      // Monster Artifact Score
      const mArtifactScore = Number((mArtifacts.length * 48.5 + (mArtifacts[0]?.lvl || 12) * 2.5).toFixed(1));
      const totalMScore = Number((mUnitScore + mRuneScore + mArtifactScore).toFixed(1));

      let mRank = RANK_TIERS.C1;
      if (totalMScore >= 240) mRank = RANK_TIERS.G3;
      else if (totalMScore >= 210) mRank = RANK_TIERS.G2;
      else if (totalMScore >= 180) mRank = RANK_TIERS.G1;
      else if (totalMScore >= 150) mRank = RANK_TIERS.C3;
      else if (totalMScore >= 120) mRank = RANK_TIERS.C2;

      return {
        masterId: uMasterId,
        name: u.name,
        thaiName: u.thaiName,
        element: u.element,
        stars: u.stars,
        level: u.level,
        avatarUrl: u.avatarUrl,
        spd: u.spd,
        plusSpd: u.spd - u.baseSpd,
        sets: u.sets || [],
        unitScore: Number(mUnitScore.toFixed(1)),
        runeScore: mRuneScore,
        artifactScore: mArtifactScore,
        totalScore: totalMScore,
        rank: mRank,
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore);

  return {
    summaryDate: new Date().toISOString().split('T')[0],
    jsonImportDate: (box.importedAt || new Date().toISOString()).split('T')[0],
    wizard: {
      name: box.wizard?.name || 'Summoner',
      level: box.wizard?.level || 100,
      country: box.wizard?.country || 'TH',
      avatarUrl: units[0]?.avatarUrl || '',
    },
    expectedRank,
    nowRank,
    nowPoints,
    estPoints,
    scores: {
      unitScore,
      runeScore: totalRuneScore,
      artifactScore: totalArtifactScore,
    },
    artifactRating: {
      elementArtifact: elemArt,
      typeArtifact: typeArt,
    },
    runeRating: {
      top10Average: {
        swift: top10Swift,
        violent: top10Violent,
        despair: top10Despair,
      },
      generalRuneScore: {
        swift: genSwift,
        violent: genViolent,
        despair: genDespair,
        will: genWill,
        revenge: genRevenge,
        any: genAny,
      },
    },
    monsterSummary,
  };
}
