// Dynamic Tier List Generation Engine
// Calculates objective, data-grounded meta tiers from RTA Guardian Replays, 3MDC, and PVE Abyss stats

import guardianMeta from '../data/swrtGuardianMeta.json' with { type: 'json' };
import mdcSummary from '../data/monsterMdcSummary.json' with { type: 'json' };
import dungeonStats from '../data/dungeonRealStats.json' with { type: 'json' };
import { MONSTERS } from '../data/monsters.js';
import { baseAwakenedId } from './swexImport.js';

const norm = (s) => String(s || '').replace(/\s*\(.*?\)\s*/g, '').toLowerCase().trim();

/**
 * Generates dynamic RTA Guardian Tier List from season 38 replay meta
 */
export function getDynamicRtaTiers() {
  const monsters = guardianMeta?.monsters || [];

  // Map each monster id to catalog
  const ranked = [];
  for (const m of monsters) {
    const cat = MONSTERS.find((c) => Number(c.com2usId) === m.id || c.id === m.id || c.id === baseAwakenedId(m.id));
    if (!cat) continue;

    const picks = m.picks || 0;
    if (picks < 20) continue; // Must have significant sample size

    const winRate = m.picks > 0 ? (m.wins / m.picks) * 100 : 50;
    const banRate = m.picks > 0 ? (m.bans / m.picks) * 100 : 0;
    const fpRate = m.picks > 0 ? (m.fpPicks / m.picks) * 100 : 0;

    // Composite Power Score: picks weighted heavily, multiplied by win rate & ban rate
    const score = picks * (winRate / 50) * (1 + banRate / 75) * (1 + fpRate / 100);

    ranked.push({
      id: cat.id,
      name: cat.name,
      thaiName: cat.thaiName || cat.name,
      avatarUrl: cat.avatarUrl || cat.imageUrl,
      element: cat.element,
      stars: cat.stars || 5,
      picks,
      winRate: `${winRate.toFixed(1)}%`,
      banRate: `${banRate.toFixed(1)}%`,
      fpRate: `${fpRate.toFixed(1)}%`,
      score,
    });
  }

  ranked.sort((a, b) => b.score - a.score);

  return [
    {
      id: 'rta-s-plus',
      label: 'S+ (God Tier • เมต้าระดับสูง)',
      color: 'bg-red-600',
      borderColor: 'border-red-600',
      description: 'มอนสเตอร์ที่ถูกเลือกหรือแบนเกือบทุกแมตช์ มีอิทธิพลต่อเกมสูงสุด',
      monsters: ranked.slice(0, 6),
    },
    {
      id: 'rta-s',
      label: 'S (Top Meta • เสาหลักดราฟต์)',
      color: 'bg-orange-500',
      borderColor: 'border-orange-500',
      description: 'ตัวเลือกหลักยอดนิยม เข้าได้กับเกือบทุกคอมโบทีม',
      monsters: ranked.slice(6, 18),
    },
    {
      id: 'rta-a',
      label: 'A (Strong Pick • ทรงพลัง)',
      color: 'bg-amber-500',
      borderColor: 'border-amber-500',
      description: 'ตัวเลือกที่เก่งมาก มีวินเรตสูงเมื่อได้ดราฟต์ในจังหวะที่เหมาะสม',
      monsters: ranked.slice(18, 36),
    },
    {
      id: 'rta-b',
      label: 'B (Viable Counter • ตัวแก้ทางเฉพาะทาง)',
      color: 'bg-emerald-600',
      borderColor: 'border-emerald-600',
      description: 'ตัวเคาน์เตอร์เฉพาะทาง บังคับแบนเมื่อหยิบมาแก้ทางศัตรู',
      monsters: ranked.slice(36, 56),
    },
  ];
}

/**
 * Generates dynamic Siege / Guild War Meta Tier List from 3MDC database
 */
export function getDynamicSiegeTiers() {
  const byName = mdcSummary?.byName || {};
  const list = [];

  for (const [key, data] of Object.entries(byName)) {
    const cat = MONSTERS.find((m) => norm(m.name) === key);
    if (!cat) continue;

    const cnt = data.cntCount || 0;
    const def = data.defCount || 0;
    const totalUsage = cnt + def * 3; // defense appearance counts extra
    if (totalUsage < 10) continue;

    list.push({
      id: cat.id,
      name: cat.name,
      thaiName: cat.thaiName || cat.name,
      avatarUrl: cat.avatarUrl || cat.imageUrl,
      element: cat.element,
      stars: cat.stars || 5,
      cntCount: cnt,
      defCount: def,
      score: totalUsage,
    });
  }

  list.sort((a, b) => b.score - a.score);

  return [
    {
      id: 'siege-s-plus',
      label: 'S+ (กิลด์วอร์ระดับตำนาน)',
      color: 'bg-red-600',
      borderColor: 'border-red-600',
      description: 'แกนหลักของทีมบุกและตั้งรับใน Siege ทัวร์นาเมนต์',
      monsters: list.slice(0, 6),
    },
    {
      id: 'siege-s',
      label: 'S (ยอดนิยมสูงสุด)',
      color: 'bg-orange-500',
      borderColor: 'border-orange-500',
      description: 'มีสูตรบุกชนะสูงมากกว่า 40+ สูตร หรือเป็นทีมรับประจำหอ',
      monsters: list.slice(6, 18),
    },
    {
      id: 'siege-a',
      label: 'A (ตัวบุกสารพัดประโยชน์)',
      color: 'bg-amber-500',
      borderColor: 'border-amber-500',
      description: 'ตัวเก็บชัยชนะที่เชื่อถือได้ ปรากฏใน 20+ สูตรแก้ทาง',
      monsters: list.slice(18, 36),
    },
    {
      id: 'siege-b',
      label: 'B (ตัวเฉพาะทางยอดเยี่ยม)',
      color: 'bg-emerald-600',
      borderColor: 'border-emerald-600',
      description: 'ตัวแก้ทางหอเฉพาะจุด เช่น ทีมสไนป์, ทีมเจาะอมตะ',
      monsters: list.slice(36, 54),
    },
  ];
}

/**
 * Generates dynamic PVE Abyss Hard Speed Farm Tier List
 */
export function getDynamicPveTiers() {
  const counts = new Map(); // name -> { count, role, avgTime }

  for (const d of dungeonStats) {
    for (const m of d.recommendedTeam || []) {
      const cleanName = norm(m.name);
      if (!counts.has(cleanName)) {
        counts.set(cleanName, {
          rawName: m.name.replace(/\s*\(.*?\)\s*/g, '').trim(),
          role: m.role || 'DPS',
          dungeonCount: 0,
          dungeons: [],
        });
      }
      const entry = counts.get(cleanName);
      entry.dungeonCount += 1;
      entry.dungeons.push(d.nameEn);
    }
  }

  const pveList = [];
  for (const [, item] of counts.entries()) {
    const cat = MONSTERS.find((c) => norm(c.name) === norm(item.rawName));
    if (!cat) continue;

    pveList.push({
      id: cat.id,
      name: cat.name,
      thaiName: cat.thaiName || cat.name,
      avatarUrl: cat.avatarUrl || cat.imageUrl,
      element: cat.element,
      stars: cat.stars || 5,
      role: item.role,
      dungeons: item.dungeons,
      score: item.dungeonCount * 10 + (cat.stars >= 5 ? 5 : 0),
    });
  }

  pveList.sort((a, b) => b.score - a.score);

  return [
    {
      id: 'pve-s-plus',
      label: 'S+ (MVP มหาเทพสปีดรัน)',
      color: 'bg-red-600',
      borderColor: 'border-red-600',
      description: 'ตัวเคลียร์เวฟและปิดบอสที่เร็วที่สุด สถิติต่ำกว่า 25-30 วินาที',
      monsters: pveList.slice(0, 5),
    },
    {
      id: 'pve-s',
      label: 'S (เสาหลักทีมสปีดรัน)',
      color: 'bg-orange-500',
      borderColor: 'border-orange-500',
      description: 'ตัวเร่งเกจ บัฟ ATK เจาะเกราะ หรือนิวเกอร์ชั้นยอด',
      monsters: pveList.slice(5, 12),
    },
    {
      id: 'pve-a',
      label: 'A (ตัวทางเลือกความเสถียร 100%)',
      color: 'bg-amber-500',
      borderColor: 'border-amber-500',
      description: 'เหมาะสำหรับทีมฟาร์มที่ต้องการความปลอดภัยสูง อัตราชนะ 99.9%',
      monsters: pveList.slice(12, 22),
    },
  ];
}
