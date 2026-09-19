// Arena Offense & Defense Team Matcher for Player Box
// Analyzes owned monsters and returns battle-ready 4-man Arena comps

import arenaData from '../data/arenaMetaTeams.json' with { type: 'json' };
import { MONSTERS } from '../data/monsters.js';
import { boxUnits } from './swexImport.js';

const norm = (s) => String(s || '').replace(/\s*\(.*?\)\s*/g, '').toLowerCase().trim();

/**
 * Matches player box against Arena Offense and Defense meta teams
 * @param {Object} userBox - SWEX box JSON (either parsed box with .units or raw dump with .unit_list)
 * @returns {Object} { offense: Array, defense: Array, summary: Object }
 */
export function matchArenaTeams(userBox) {
  const units = boxUnits(userBox);
  const hasBox = units.length > 0;

  // 1. Owned monsters: first unit per name for display, plus a count so "Lushen ×2" needs two Lushens
  const ownedNames = new Map(); // normName -> unit info
  const ownedCounts = new Map(); // normName -> number of units

  for (const u of units) {
    const name = u.name || u.info?.name;
    if (!name) continue;
    const key = norm(name);
    ownedCounts.set(key, (ownedCounts.get(key) || 0) + 1);
    if (!ownedNames.has(key)) {
      ownedNames.set(key, {
        unitId: u.uid,
        masterId: u.masterId,
        name: u.info?.name || name,
        thaiName: u.thaiName || name,
        stars: u.stars || 6,
        avatarUrl: u.avatarUrl,
        element: u.element,
        isOwned: true,
        isRealOwned: true,
      });
    }
  }

  const catalogMonster = (name) => {
    const key = norm(name);
    const cat = MONSTERS.find((m) => norm(m.name) === key) || {};
    return {
      name: cat.name || name,
      thaiName: cat.thaiName || name,
      avatarUrl: cat.avatarUrl || cat.imageUrl,
      element: cat.element || 'wind',
      stars: cat.stars || 5,
      isOwned: !hasBox, // If no box, show as neutral available slot
      isRealOwned: false,
    };
  };

  // Slot i of a team is owned when the box holds at least (i-th occurrence of that name + 1) copies
  const slotOwned = (name, seen) => {
    const key = norm(name);
    const nth = (seen.get(key) || 0) + 1;
    seen.set(key, nth);
    return hasBox && (ownedCounts.get(key) || 0) >= nth;
  };

  const processTeams = (teamList) => {
    return teamList.map((team) => {
      const seen = new Map();
      const slots = team.slots.map((name) => {
        const owned = slotOwned(name, seen);
        return owned ? { ...ownedNames.get(norm(name)) } : catalogMonster(name);
      });
      const realOwnedCount = slots.filter((s) => s.isRealOwned).length;
      const missingMonsters = slots.filter((s) => !s.isRealOwned).map((s) => s.name);
      const isComplete = hasBox ? realOwnedCount === 4 : false;

      // Alternatives for the slots that are missing; "owned" marks the ones already in the box
      const swapOptions = missingMonsters.map((slot) => ({
        slot,
        alts: (team.swaps?.[slot] || []).map((alt) => ({ name: alt, owned: hasBox && (ownedCounts.get(norm(alt)) || 0) > 0 })),
      }));
      const readyWithSwaps = hasBox && !isComplete && swapOptions.length > 0 && swapOptions.every((o) => o.alts.some((a) => a.owned));

      let statusLabel = 'สูตรคอมมูนิตี้';
      if (hasBox) {
        if (isComplete) statusLabel = 'พร้อมรบ (ครบ 4 ตัว)';
        else if (readyWithSwaps) statusLabel = 'พร้อมรบ (ใช้ตัวแทน)';
        else statusLabel = `ขาดอีก ${4 - realOwnedCount} ตัว`;
      }

      return {
        ...team,
        slots,
        ownedCount: realOwnedCount,
        missingMonsters,
        swapOptions,
        readyWithSwaps,
        isComplete,
        statusLabel,
      };
    }).sort((a, b) => {
      if (hasBox) {
        if (a.isComplete !== b.isComplete) return b.isComplete ? 1 : -1;
        if (a.readyWithSwaps !== b.readyWithSwaps) return b.readyWithSwaps ? 1 : -1;
        return b.ownedCount - a.ownedCount;
      }
      return 0; // maintain catalogue ordering when no box
    });
  };

  const offense = processTeams(arenaData.offense || []);
  const defense = processTeams(arenaData.defense || []);

  const readyAo = offense.filter((t) => t.isComplete).length;
  const readyAd = defense.filter((t) => t.isComplete).length;

  return {
    offense,
    defense,
    meta: arenaData.meta || {},
    summary: {
      totalAo: offense.length,
      readyAo,
      swapAo: offense.filter((t) => t.readyWithSwaps).length,
      totalAd: defense.length,
      readyAd,
      swapAd: defense.filter((t) => t.readyWithSwaps).length,
      ldTeams: [...offense, ...defense].filter((t) => t.ld).length,
      hasBox,
    },
  };
}
