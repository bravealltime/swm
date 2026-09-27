// Intelligent Realtime RTA Draft & Pick/Ban Assistant Engine
import RTA_SYNERGIES from '../data/rtaSynergies.json';
import recentReplays from '../data/swrtRecentReplays.json';
import { MONSTERS } from '../data/monsters';

// High-impact counter relationships known in G3/Legend RTA meta
const META_COUNTERS = [
  {
    targetRole: 'Control & Reset (Oliver, Cheongpung, Sagar, Robo)',
    targets: ['Oliver', 'Cheongpung', 'Sagar', 'Robo', 'Moore', 'CP'],
    counters: [
      { name: 'Juno', element: 'fire', role: 'Passive Cleanser & Stun', reason: 'ล้างดีบัฟหมู่และฮีลทีมอัตโนมัติเมื่อโดน CC ยิ่งศัตรูออกสกิลดีบัฟเยอะ จูโน่ยิ่งฮีลรัว' },
      { name: 'Haegang', element: 'water', role: 'ATB Reversal & Stripper', reason: 'เร่งเกจสวนกลับทันทีที่ฝ่ายตรงข้ามพยายามล้างบัฟหรือลดเกจ' },
      { name: 'Douglas', element: 'fire', role: 'Glancing Counter', reason: 'หลบการโจมตีธาตุลม (Oliver, CP, Sagar) แล้วสวนกลับดูดเลือดและสตัน' },
      { name: 'Tetra', element: 'water', role: 'Debuff Reducer', reason: 'ลดระยะเวลาดีบัฟทุกตัวในทีมลง 1 เทิร์นทุกครั้งที่ได้ขยับ' },
      { name: 'Josephine', element: 'water', role: 'Anti-Stun Shield & Provoke', reason: 'สร้างบาเรียทั้งทีมทันทีที่มีเพื่อนร่วมทีมโดนสตันหรือแช่แข็ง' },
    ],
  },
  {
    targetRole: 'Speed Snipers (Sonia, Miles, Ethna, Masha)',
    targets: ['Sonia', 'Miles', 'Ethna', 'Masha', 'Claire'],
    counters: [
      { name: 'Chandra', element: 'water', role: 'Defensive Hug', reason: 'กอดปกป้องตัวบางไม่ให้โดนสไนป์ พร้อมสวนสตันและลดสปีด' },
      { name: 'Byungchul', element: 'wind', role: 'Bruiser Sustain & Retaliate', reason: 'เลือดเยอะมาก ไม่ตายในฮิตเดียว และสวนกลับฮีลทั้งทีม' },
      { name: 'Camilla', element: 'water', role: 'Half Crit DMG Tank', reason: 'ลดความเสียหายคริติคอลลงครึ่งหนึ่ง สไนเปอร์เจาะไม่เข้า' },
      { name: 'Leo', element: 'wind', role: 'Speed Equalizer', reason: 'ล็อคสปีดทุกคนเท่ากัน ทำให้สเกลดาเมจของ Sonia และ Miles หายไปทันที' },
    ],
  },
  {
    targetRole: 'Speed Control & Turn-1 Stripper (Moore, Robo, Chiwu, Tiana)',
    targets: ['Moore', 'Robo', 'Chiwu', 'Tiana', 'Sekhmet', 'Eshir'],
    counters: [
      { name: 'Haegang', element: 'water', role: 'Anti-Strip ATB Booster', reason: 'เมื่อศัตรูล้างบัฟทีมเรา แฮกังจะเร่งเกจทีมขึ้นมาตัดหน้าทันที' },
      { name: 'Amidu', element: 'water', role: 'Interrupt & Sleep', reason: 'ขัดจังหวะคอมโบเปิดของคู่แข่ง' },
      { name: 'Vanessa', element: 'fire', role: '33% Spd Lead & Revive', reason: 'สปีดลีด 33% ช่วยแย่งเทิร์นแรก พร้อมชุบเพื่อนร่วมทีม' },
    ],
  },
  {
    targetRole: 'Stall & Heavy Bruiser (Chandra, Velajuel, Camilla, Byungchul, Riley)',
    targets: ['Chandra', 'Velajuel', 'Camilla', 'Byungchul', 'Riley', 'Khmun', 'Feng Yan'],
    counters: [
      { name: 'Bolverk', element: 'water', role: 'HP Drain & Buff Steal', reason: 'สูบเลือดศัตรู 50% ทุกครั้งที่มีบัฟในสนาม ไม่สนค่า DEF' },
      { name: 'Dominic', element: 'wind', role: 'True Damage Shredder', reason: 'ต่อยดาเมจแท้ตามพลังโจมตี ทะลวงเลือดตัวแทงก์ตายไว' },
      { name: 'Tesarion', element: 'fire', role: 'Passive Oblivion', reason: 'ปิดพาสซีฟของ Camilla, Byungchul, Douglas ทำให้กลายเป็นตัวธรรมดา' },
      { name: 'Miles', element: 'water', role: 'Speed Scaling True Damage', reason: 'วิ่งสะสมสปีดเจาะเกราะทะลวงตัวแทงก์' },
    ],
  },
  {
    targetRole: 'Zero-Speed Gimmick (Leo, Lucifer)',
    targets: ['Leo', 'Lucifer'],
    counters: [
      { name: 'Nemesis Healers (Ariel, Abellio)', element: 'water', role: 'Nemesis Cut-In', reason: 'ใส่รูน Nemesis โดนลีโอตีทีแรกเกจพุ่งเต็มแล้วฮีลตัดหน้าทันที' },
      { name: 'Kaki', element: 'fire', role: 'Immune to ATB, AOE Cleave', reason: 'ไม่สนคริติคอล สวนกลับแรงมากในเทิร์นแรก' },
      { name: 'Vanessa', element: 'fire', role: 'Revive Insurance', reason: 'มีประกันชุบชีวิตหากโดนลูซิเฟอร์เร่งแล้วคลีฟตาย' },
    ],
  },
];

/**
 * Intelligent Realtime Draft Analyzer & Recommender
 * @param {Array} blueTeam - [monsterObj | null, ...] (max 5)
 * @param {Array} redTeam - [monsterObj | null, ...] (max 5)
 * @param {number|null} blueBan - index of red team monster banned by blue
 * @param {number|null} redBan - index of blue team monster banned by red
 */
export function analyzeRtaDraft(blueTeam = [], redTeam = [], blueBan = null, redBan = null) {
  const activeBlue = blueTeam.filter((m, i) => m && i !== redBan);
  const activeRed = redTeam.filter((m, i) => m && i !== blueBan);

  const pickedNames = new Set([
    ...blueTeam.filter(Boolean).map((m) => (m.name || '').toLowerCase().trim()),
    ...redTeam.filter(Boolean).map((m) => (m.name || '').toLowerCase().trim()),
  ]);

  const blueNames = activeBlue.map((m) => (m.name || '').toLowerCase().trim());
  const redNames = activeRed.map((m) => (m.name || '').toLowerCase().trim());

  // 1. Calculate Threat Level for each Red monster
  const redThreats = activeRed.map((m, idx) => {
    const name = (m.name || '').toLowerCase();
    let score = 70;
    let reason = 'มอนสเตอร์ตัวสำคัญของคู่แข่ง';

    if (name === 'oliver') { score = 98; reason = 'ลดเกจและรีเซ็ตคูลดาวน์รัวๆ ทำให้ทีมเราไม่ได้ออกสกิล'; }
    else if (name === 'sonia') { score = 96; reason = 'สไนป์ทะลุเกราะแรงมาก เก็บตัวหลักเราตายได้ในเทิร์นแรก'; }
    else if (name === 'leo') { score = 94; reason = 'ล็อคความเร็วทุกคน บังคับเล่นตามเกมของคู่ต่อสู้'; }
    else if (name === 'sagar') { score = 92; reason = 'ยั่วยวนหมู่และรีเซ็ตเทิร์น ตัดจังหวะสกิล'; }
    else if (name === 'byungchul') { score = 91; reason = 'ดาเมจสวนกลับแรง เลือดเยอะ และฮีลทีม'; }
    else if (name === 'moore') { score = 89; reason = 'ตัดเทิร์น ล้างบัฟ และสตัน'; }
    else if (name === 'chandra') { score = 88; reason = 'กอดป้องกันตัวแบก ทำให้เจาะคู่แข่งไม่เข้า'; }
    else if (name === 'lucifer') { score = 95; reason = 'เร่งเกจยกทีมเมื่อศัตรูทำดาเมจ'; }
    else if (name === 'tiana') { score = 87; reason = 'ล้างบัฟ 100% ต้านทานไม่ได้'; }
    else if (name === 'cheongpung') { score = 90; reason = 'ลดเกจและเพิ่มคูลดาวน์หมู่'; }

    return {
      index: idx,
      name: m.name,
      thaiName: m.thaiName || m.name,
      avatarUrl: m.avatarUrl,
      element: m.element,
      score,
      reason,
    };
  }).sort((a, b) => b.score - a.score);

  const topBanTarget = redThreats[0] || null;

  // 2. Discover Synergy Opportunities for Blue Team
  const synergyRecommendations = [];
  const checkedDuoPairs = new Set();

  (RTA_SYNERGIES.duos || []).forEach((duo) => {
    const [mon1, mon2] = duo.monsters;
    const n1 = mon1.toLowerCase();
    const n2 = mon2.toLowerCase();

    const has1 = blueNames.includes(n1);
    const has2 = blueNames.includes(n2);

    // If blue has mon1 but NOT mon2, and mon2 isn't picked yet
    if (has1 && !has2 && !pickedNames.has(n2) && !checkedDuoPairs.has(n2)) {
      const fullMon = MONSTERS.find((m) => m.name.toLowerCase() === n2);
      if (fullMon) {
        checkedDuoPairs.add(n2);
        synergyRecommendations.push({
          type: 'synergy',
          monster: fullMon,
          partnerName: mon1,
          winRate: duo.winRate,
          matches: duo.matches,
          synergyDelta: duo.synergyDelta,
          archetype: duo.archetype,
          thaiDesc: duo.thaiDesc,
          badge: `คอมโบกับ ${mon1} (Win ${duo.winRate}%)`,
        });
      }
    } else if (has2 && !has1 && !pickedNames.has(n1) && !checkedDuoPairs.has(n1)) {
      const fullMon = MONSTERS.find((m) => m.name.toLowerCase() === n1);
      if (fullMon) {
        checkedDuoPairs.add(n1);
        synergyRecommendations.push({
          type: 'synergy',
          monster: fullMon,
          partnerName: mon2,
          winRate: duo.winRate,
          matches: duo.matches,
          synergyDelta: duo.synergyDelta,
          archetype: duo.archetype,
          thaiDesc: duo.thaiDesc,
          badge: `คอมโบกับ ${mon2} (Win ${duo.winRate}%)`,
        });
      }
    }
  });

  // 3. Discover Hard Counter Picks for Blue against Opponent's Red picks
  const counterRecommendations = [];
  const checkedCounters = new Set();

  META_COUNTERS.forEach((group) => {
    // Check if red team has any targets from this group
    const matchedTargets = redNames.filter((rn) =>
      group.targets.some((gt) => gt.toLowerCase() === rn)
    );

    if (matchedTargets.length > 0) {
      group.counters.forEach((c) => {
        const cLower = c.name.toLowerCase();
        if (!pickedNames.has(cLower) && !checkedCounters.has(cLower)) {
          const fullMon = MONSTERS.find((m) => m.name.toLowerCase() === cLower);
          if (fullMon) {
            checkedCounters.add(cLower);
            const targetNamesStr = matchedTargets.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(', ');
            counterRecommendations.push({
              type: 'counter',
              monster: fullMon,
              targetName: targetNamesStr,
              role: c.role,
              reason: c.reason,
              badge: `แก้ทาง ${targetNamesStr}`,
              priorityScore: 85 + matchedTargets.length * 5,
            });
          }
        }
      });
    }
  });

  // 4. Extract Real Replay Patterns from swrtRecentReplays
  const replayInsights = [];
  if (redNames.length > 0 && Array.isArray(recentReplays)) {
    const relevantReplays = recentReplays.filter((rep) => {
      const winNames = (rep.winnerDraft || []).map((m) => (m.name || '').toLowerCase());
      const losNames = (rep.loserDraft || []).map((m) => (m.name || '').toLowerCase());
      // Replays where the loser picked opponent's monsters, and winner countered successfully
      return redNames.some((rn) => losNames.includes(rn));
    }).slice(0, 3);

    relevantReplays.forEach((rep) => {
      replayInsights.push({
        matchId: rep.matchId,
        rank: rep.rankText,
        winnerPlayer: rep.winnerPlayer,
        loserPlayer: rep.loserPlayer,
        winCondition: rep.tacticalBreakdown?.winCondition || 'การดราฟต์แก้ทางระดับโปร',
        mvp: rep.tacticalBreakdown?.keyTurningPoint || '',
      });
    });
  }

  // 5. Overall Archetype Strengths & Win Probability
  let blueSpd = 50, blueCc = 50, blueDmg = 50, blueTank = 50, blueUtil = 50;
  let redSpd = 50, redCc = 50, redDmg = 50, redTank = 50, redUtil = 50;

  activeBlue.forEach((m) => {
    const n = (m.name || '').toLowerCase();
    if (['oliver', 'vanessa', 'sonia', 'ethna', 'adriana', 'moore', 'miles', 'sekhmet'].includes(n)) blueSpd += 14;
    if (['cheongpung', 'oliver', 'robo', 'sagar', 'moore', 'tian lang', 'cp'].includes(n)) blueCc += 15;
    if (['sonia', 'lushen', 'kaki', 'perna', 'miles', 'lucifer', 'masha'].includes(n)) blueDmg += 15;
    if (['camilla', 'chandra', 'velajuel', 'byungchul', 'haeyang', 'riley'].includes(n)) blueTank += 16;
    if (['shizuka', 'adriana', 'woosa', 'tomoe', 'anavel', 'bastet'].includes(n)) blueUtil += 14;
  });

  activeRed.forEach((m) => {
    const n = (m.name || '').toLowerCase();
    if (['oliver', 'vanessa', 'sonia', 'ethna', 'adriana', 'moore', 'miles', 'sekhmet'].includes(n)) redSpd += 14;
    if (['cheongpung', 'oliver', 'robo', 'sagar', 'moore', 'tian lang', 'cp'].includes(n)) redCc += 15;
    if (['sonia', 'lushen', 'kaki', 'perna', 'miles', 'lucifer', 'masha'].includes(n)) redDmg += 15;
    if (['camilla', 'chandra', 'velajuel', 'byungchul', 'haeyang', 'riley'].includes(n)) redTank += 16;
    if (['shizuka', 'adriana', 'woosa', 'tomoe', 'anavel', 'bastet'].includes(n)) redUtil += 14;
  });

  // Synergy bonuses
  let blueSynergyBonus = 0;
  (RTA_SYNERGIES.duos || []).forEach((d) => {
    if (blueNames.includes(d.monsters[0].toLowerCase()) && blueNames.includes(d.monsters[1].toLowerCase())) {
      blueSynergyBonus += 5;
    }
  });

  let redSynergyBonus = 0;
  (RTA_SYNERGIES.duos || []).forEach((d) => {
    if (redNames.includes(d.monsters[0].toLowerCase()) && redNames.includes(d.monsters[1].toLowerCase())) {
      redSynergyBonus += 5;
    }
  });

  if (blueNames.includes('leo') && blueNames.includes('lucifer')) blueSynergyBonus += 12;
  if (redNames.includes('leo') && redNames.includes('lucifer')) redSynergyBonus += 12;

  const blueTotal = blueSpd + blueCc + blueDmg + blueTank + blueUtil + blueSynergyBonus;
  const redTotal = redSpd + redCc + redDmg + redTank + redUtil + redSynergyBonus;
  const sum = Math.max(1, blueTotal + redTotal);

  const blueWinProb = Math.min(85, Math.max(15, Math.round((blueTotal / sum) * 100)));
  const redWinProb = 100 - blueWinProb;

  return {
    blueWinProb,
    redWinProb,
    stats: {
      blue: { spd: blueSpd, cc: blueCc, dmg: blueDmg, tank: blueTank, util: blueUtil },
      red: { spd: redSpd, cc: redCc, dmg: redDmg, tank: redTank, util: redUtil },
    },
    threats: redThreats,
    topBanTarget,
    synergyRecommendations: synergyRecommendations.slice(0, 4),
    counterRecommendations: counterRecommendations.sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 6),
    replayInsights,
  };
}
