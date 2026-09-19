import guardianMeta from '../data/swrtGuardianMeta.json' with { type: 'json' };
import monsterHighData from '../data/swrtMonsterHighdata.json' with { type: 'json' };
import balancePatchDetails from '../data/balancePatchDetails.json' with { type: 'json' };
import balancePatches from '../data/balancePatches.json' with { type: 'json' };
import mdcSummary from '../data/monsterMdcSummary.json' with { type: 'json' };
import dungeonStatsData from '../data/dungeonRealStats.json' with { type: 'json' };
import arenaData from '../data/arenaMetaTeams.json' with { type: 'json' };
import { MONSTERS } from '../data/monsters.js';
import { getMonsterBuild } from '../data/monsterBuilds.js';
import { getChangeTypeThai, translatePatchSnippet } from './patchTranslator.js';

// Build lookups once
let _byId = null;
let _byName = null;
let _metaMap = null;
let _metaRankMap = null;
let _patchMetaMap = null;

function initMaps() {
  if (_byId) return;
  _byId = new Map();
  _byName = new Map();
  for (const m of MONSTERS) {
    if (m.com2usId) _byId.set(Number(m.com2usId), m);
    if (m.id) _byId.set(m.id, m);
    if (m.name) _byName.set(m.name.toLowerCase().trim(), m);
  }

  _metaMap = new Map();
  _metaRankMap = new Map();
  const sortedMeta = [...(guardianMeta.monsters || [])].sort((a, b) => (b.picks || 0) - (a.picks || 0));
  sortedMeta.forEach((item, idx) => {
    _metaMap.set(Number(item.id), item);
    _metaRankMap.set(Number(item.id), idx + 1);
  });

  _patchMetaMap = new Map();
  for (const p of balancePatches) {
    if (p.link) {
      const match = p.link.match(/balancePatchID=(\d+)/);
      if (match) _patchMetaMap.set(match[1], p);
    }
    if (p.id) _patchMetaMap.set(String(p.id), p);
  }
}

/**
 * Normalizes input monster parameter to object.
 */
export function resolveMonster(m) {
  if (!m) return null;
  if (typeof m === 'object') return m;
  initMaps();

  if (_byId.has(m)) return _byId.get(m);
  const num = Number(m);
  if (!isNaN(num) && _byId.has(num)) return _byId.get(num);

  const cleanId = String(m).trim().replace(/^m-/, '');
  const cleanNum = Number(cleanId);
  if (!isNaN(cleanNum) && _byId.has(cleanNum)) return _byId.get(cleanNum);

  const str = String(m).toLowerCase().trim();
  if (_byName.has(str)) return _byName.get(str);
  return null;
}

/**
 * Returns comprehensive living data for any given monster:
 * 1. RTA Guardian Stats (Season 38)
 * 2. Duos (top draft partner pairings)
 * 3. Synergies & Counters
 * 4. Balance Patch History
 * 5. 3MDC Siege Defense & Counter comps
 * 6. Rune Builds & Benchmarks
 * 7. Thai summary text
 */
export function getMonsterLivingData(monsterInput) {
  const monster = resolveMonster(monsterInput);
  if (!monster) return null;
  initMaps();

  const com2usId = Number(monster.com2usId || monster.id?.replace(/^m-/, ''));
  const monName = monster.name || '';
  const monNameLower = monName.toLowerCase().trim();
  const monThaiName = monster.thaiName || monster.nameTh || monName;

  // 1. RTA Guardian Stats
  const rawMeta = com2usId ? _metaMap.get(com2usId) : null;
  const guardianRank = com2usId ? _metaRankMap.get(com2usId) : null;
  const totalReplays = guardianMeta.meta?.replaysScanned || 2998;

  let guardianStats = null;
  if (rawMeta) {
    const picks = rawMeta.picks || 0;
    const wins = rawMeta.wins || 0;
    const bans = rawMeta.bans || 0;
    const fpPicks = rawMeta.fpPicks || 0;
    const fpWins = rawMeta.fpWins || 0;
    const leaders = rawMeta.leaders || 0;

    guardianStats = {
      isMeta: true,
      rank: guardianRank || 0,
      totalMonsters: guardianMeta.monsters.length,
      season: guardianMeta.meta?.season || 38,
      totalReplays,
      picks,
      wins,
      winRate: picks > 0 ? ((wins / picks) * 100).toFixed(1) : '0.0',
      bans,
      banRate: picks > 0 ? ((bans / picks) * 100).toFixed(1) : '0.0',
      fpPicks,
      fpWins,
      fpRate: picks > 0 ? ((fpPicks / picks) * 100).toFixed(1) : '0.0',
      fpWinRate: fpPicks > 0 ? ((fpWins / fpPicks) * 100).toFixed(1) : '0.0',
      leaders,
    };
  }

  // 2. Duos (Top draft partners in Guardian replays)
  const duos = [];
  if (com2usId && guardianMeta.duos) {
    const rawDuos = guardianMeta.duos
      .filter((d) => Array.isArray(d.ids) && d.ids.includes(com2usId))
      .sort((a, b) => (b.n || 0) - (a.n || 0))
      .slice(0, 5);

    for (const d of rawDuos) {
      const partnerId = d.ids.find((x) => x !== com2usId);
      const partner = partnerId ? _byId.get(partnerId) : null;
      duos.push({
        partnerId,
        partnerName: partner?.name || `#${partnerId}`,
        partnerThaiName: partner?.thaiName || partner?.name || `#${partnerId}`,
        partnerElement: partner?.element || 'all',
        partnerAvatarUrl: partner?.avatarUrl || partner?.imageUrl || '',
        matches: d.n,
        wins: d.w,
        winRate: d.n > 0 ? ((d.w / d.n) * 100).toFixed(1) : '0.0',
      });
    }
  }

  // 3. Synergies & Counters from highdata
  const rawHigh = com2usId ? monsterHighData[String(com2usId)] : null;
  const synergies = (rawHigh?.synergies || []).slice(0, 5).map((s) => ({
    monsterId: s.monsterId,
    name: s.name,
    thaiName: s.thaiName || s.name,
    element: s.element,
    winRate: typeof s.winRate === 'number' ? s.winRate.toFixed(1) : s.winRate,
    matches: s.matches || 0,
    avatarUrl: s.avatarUrl,
  }));

  const counters = (rawHigh?.counters || []).slice(0, 5).map((c) => ({
    monsterId: c.monsterId,
    name: c.name,
    thaiName: c.thaiName || c.name,
    element: c.element,
    winRate: typeof c.winRate === 'number' ? c.winRate.toFixed(1) : c.winRate,
    matches: c.matches || 0,
    avatarUrl: c.avatarUrl,
  }));

  // 4. Balance Patch History
  const balancePatchesList = [];
  for (const [patchId, list] of Object.entries(balancePatchDetails)) {
    for (const item of list) {
      const nameMatch = (item.monsterName || '').toLowerCase().trim() === monNameLower;
      const unawMatch = monster.unawakenedName && (item.monsterName || '').toLowerCase().trim() === monster.unawakenedName.toLowerCase().trim();
      const famMatch = monster.family && (item.monsterName || '').toLowerCase().trim() === monster.family.toLowerCase().trim();
      const elemMatch = !item.element || !monster.element || item.element.toLowerCase() === monster.element.toLowerCase();

      if (nameMatch || ((unawMatch || famMatch) && elemMatch)) {
        const patchMeta = _patchMetaMap.get(String(patchId)) || {};
        balancePatchesList.push({
          patchId,
          date: patchMeta.date || `Patch #${patchId}`,
          skillName: item.skillName || 'ทั่วไป',
          changeType: item.changeType || 'Adjustment',
          changeTypeTh: getChangeTypeThai(item.changeType),
          preview: item.preview || item.officialText || '',
          translatedText: translatePatchSnippet(item.preview || item.officialText || ''),
          officialText: item.officialText || '',
          impact: item.impact || 'adjustment',
        });
      }
    }
  }

  // Sort patches descending (latest first)
  balancePatchesList.sort((a, b) => Number(b.patchId) - Number(a.patchId));

  // 5. 3MDC Siege Defense & Counter Appearances
  const mdcData = (com2usId && mdcSummary.byId?.[String(com2usId)]) || mdcSummary.byName?.[monNameLower] || {
    defCount: 0,
    cntCount: 0,
    defTitles: [],
    counterTeams: [],
  };

  // 6. Dungeon Abyss Hard Presence (PVE)
  const dungeonStats = [];
  for (const d of dungeonStatsData) {
    const member = (d.recommendedTeam || []).find((m) => {
      const mn = (m.name || '').replace(/\s*\(.*?\)\s*/g, '').toLowerCase().trim();
      return mn === monNameLower || (m.name || '').toLowerCase().includes(monNameLower);
    });
    if (member) {
      dungeonStats.push({
        dungeonId: d.id,
        dungeonName: d.nameTh,
        dungeonNameEn: d.nameEn,
        avgTime: d.avgTime,
        recordTime: d.recordTime,
        successRate: d.successRate,
        role: member.role || 'ตัวทำดาเมจ/ซัพพอร์ตหลัก',
        recommendedRune: member.rune || 'Rage / Blade',
        turnOrderTh: d.turnOrderTh,
        bossMechanicTh: d.bossMechanicTh,
        teammates: (d.recommendedTeam || []).map((x) => x.name),
      });
    }
  }

  // 7. Rune Builds & Benchmarks
  const builds = getMonsterBuild(monName);

  // 8. Arena Meta Comps (AO & AD)
  const normName = monName.toLowerCase();
  const arenaOffense = (arenaData.offense || []).filter((t) =>
    (t.slots || []).some((s) => s.toLowerCase() === normName)
  );
  const arenaDefense = (arenaData.defense || []).filter((t) =>
    (t.slots || []).some((s) => s.toLowerCase() === normName)
  );
  const arenaComps = {
    offense: arenaOffense,
    defense: arenaDefense,
    totalComps: arenaOffense.length + arenaDefense.length,
  };

  // 9. Thai Summary Text Generator
  const summaryParts = [];
  summaryParts.push(`${monThaiName} (${monName}) เป็นมอนสเตอร์ธาตุ${monster.element || ''} ${monster.stars || 5}★`);

  if (guardianStats) {
    summaryParts.push(
      `ในเมต้า RTA Guardian ซีซั่น ${guardianStats.season} อยู่ในอันดับที่ #${guardianStats.rank} จาก ${guardianStats.totalMonsters} มอนสเตอร์เมต้า ถูกเลือกทั้งหมด ${guardianStats.picks.toLocaleString()} ครั้ง มีอัตราชนะเฉลี่ย ${guardianStats.winRate}% อัตราแบน ${guardianStats.banRate}% และได้รับเลือกเป็น First Pick ถึง ${guardianStats.fpRate}% (อัตราชนะเมื่อเปิดตัวแรก ${guardianStats.fpWinRate}%)`
    );
  }

  if (duos.length > 0) {
    const topDuo = duos[0];
    summaryParts.push(
      `คู่หูที่เล่นด้วยกันบ่อยที่สุดใน RTA คือ ${topDuo.partnerThaiName} (${topDuo.partnerName}) ดราฟต์คู่กัน ${topDuo.matches.toLocaleString()} แมตช์ อัตราชนะ ${topDuo.winRate}%`
    );
  }

  if (arenaComps.totalComps > 0) {
    const parts = [];
    if (arenaComps.offense.length > 0) parts.push(`ทีมบุก (AO) ${arenaComps.offense.length} ทีม`);
    if (arenaComps.defense.length > 0) parts.push(`ทีมตั้งรับ (AD) ${arenaComps.defense.length} ทีม`);
    summaryParts.push(`ในสมรภูมิ Arena ติดเมต้า${parts.join(' และ ')}`);
  }

  if (dungeonStats.length > 0) {
    const topDungeon = dungeonStats[0];
    summaryParts.push(
      `ในดันเจี้ยน PVE เป็นตัวหลักของทีมสปีดฟาร์ม ${topDungeon.dungeonNameEn} ทำเวลาเฉลี่ย ${topDungeon.avgTime} นาที ด้วยอัตราชนะสูงถึง ${topDungeon.successRate}`
    );
  }

  if (mdcData.cntCount > 0 || mdcData.defCount > 0) {
    summaryParts.push(
      `ในศึกกิลด์วอร์และ Siege Battle (ฐานข้อมูล 3MDC) ปรากฏในสูตรบุกแก้ทาง ${mdcData.cntCount} สูตร ${mdcData.defCount > 0 ? `และเป็นเสาหลักในทีมตั้งรับ ${mdcData.defCount} ทีม` : ''}`
    );
  }

  if (builds?.sets && builds.sets.length > 0) {
    summaryParts.push(`แนวทางการใส่รูนแนะนำ: ${builds.sets.join(' หรือ ')} ช่อง 2/4/6 เน้น ${builds.slots246?.join(' / ')} ${builds.tips ? `(${builds.tips})` : ''}`);
  }

  if (balancePatchesList.length > 0) {
    summaryParts.push(`ผ่านการปรับสมดุลทั้งหมด ${balancePatchesList.length} ครั้ง ครั้งล่าสุดในแพตช์ #${balancePatchesList[0].patchId} (${balancePatchesList[0].date})`);
  }

  const summaryTextTh = summaryParts.join(' ');

  return {
    monster,
    com2usId,
    guardianStats,
    duos,
    synergies,
    counters,
    dungeonStats,
    balancePatches: balancePatchesList,
    mdcStats: mdcData,
    builds,
    arenaComps,
    summaryTextTh,
  };
}

/**
 * Calculates readiness percentage and checklist comparing equipped stats vs Guardian benchmarks
 */
export function calculateGuardianReadiness(equippedStats, benchmarks) {
  if (!equippedStats || !benchmarks) return null;

  const checks = [
    { key: 'hp', label: 'HP รวม', target: benchmarks.hp, actual: equippedStats.hp || 0 },
    { key: 'atk', label: 'ATK รวม', target: benchmarks.atk, actual: equippedStats.atk || 0 },
    { key: 'def', label: 'DEF รวม', target: benchmarks.def, actual: equippedStats.def || 0 },
    { key: 'spd', label: 'SPD รวม', target: benchmarks.spd, actual: equippedStats.spd || 0 },
    { key: 'cr', label: 'CRI Rate', target: benchmarks.cr, actual: equippedStats.cr || 0, unit: '%' },
    { key: 'cd', label: 'CRI Dmg', target: benchmarks.cd, actual: equippedStats.cd || 0, unit: '%' },
    { key: 'res', label: 'Resistance', target: benchmarks.res, actual: equippedStats.res || 0, unit: '%' },
    { key: 'acc', label: 'Accuracy', target: benchmarks.acc, actual: equippedStats.acc || 0, unit: '%' },
  ];

  let totalWeight = 0;
  let earnedScore = 0;
  const items = [];

  for (const c of checks) {
    if (!c.target || c.target <= 0) continue;
    totalWeight += 1;
    const ratio = Math.min(1.05, c.actual / c.target);
    earnedScore += ratio;
    const passed = c.actual >= c.target;
    const diff = c.actual - c.target;
    items.push({
      key: c.key,
      label: c.label,
      target: c.target,
      actual: c.actual,
      passed,
      diff,
      unit: c.unit || '',
    });
  }

  const score = totalWeight > 0 ? Math.min(100, Math.round((earnedScore / totalWeight) * 100)) : 0;
  const grade = score >= 95 ? 'S' : score >= 85 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : 'D';
  const gradeLabel = score >= 90 ? 'พร้อมรบระดับ Guardian G2-G3' : score >= 80 ? 'พร้อมรบระดับ Guardian G1' : score >= 70 ? 'ระดับ Conqueror C3 ปรับรูนอีกนิด' : 'ต้องฟาร์มปรับปรุงรูนเพิ่ม';

  return {
    score,
    grade,
    gradeLabel,
    items,
    passedCount: items.filter((i) => i.passed).length,
    totalCount: items.length,
  };
}

export default getMonsterLivingData;
