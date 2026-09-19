// Arena Offense & Defense Team Matcher for Player Box
// Analyzes owned monsters and returns battle-ready 4-man Arena comps

import arenaData from '../data/arenaMetaTeams.json' with { type: 'json' };
import { MONSTERS } from '../data/monsters.js';
import { baseAwakenedId } from './swexImport.js';

const norm = (s) => String(s || '').replace(/\s*\(.*?\)\s*/g, '').toLowerCase().trim();

/**
 * Matches player box against Arena Offense and Defense meta teams
 * @param {Object} userBox - SWEX box JSON
 * @returns {Object} { offense: Array, defense: Array, summary: Object }
 */
export function matchArenaTeams(userBox) {
  // 1. Build owned monsters map
  const ownedNames = new Map(); // normName -> unit info

  if (userBox?.unit_list) {
    for (const u of userBox.unit_list) {
      const bId = baseAwakenedId(u.unit_master_id);
      const cat = MONSTERS.find((m) => m.id === bId || m.id === u.unit_master_id) || {};
      const name = cat.name || u.name;
      if (!name) continue;
      const key = norm(name);

      if (!ownedNames.has(key)) {
        ownedNames.set(key, {
          unitId: u.unit_id,
          masterId: u.unit_master_id,
          name: cat.name || name,
          thaiName: cat.thaiName || name,
          stars: u.class || 6,
          avatarUrl: cat.avatarUrl || cat.imageUrl,
          element: cat.element,
          isOwned: true,
        });
      }
    }
  }

  const findMonster = (name) => {
    const key = norm(name);
    if (ownedNames.has(key)) {
      return ownedNames.get(key);
    }
    const cat = MONSTERS.find((m) => norm(m.name) === key) || {};
    return {
      name: cat.name || name,
      thaiName: cat.thaiName || name,
      avatarUrl: cat.avatarUrl || cat.imageUrl,
      element: cat.element || 'wind',
      stars: cat.stars || 5,
      isOwned: false,
    };
  };

  const processTeams = (teamList) => {
    return teamList.map((team) => {
      const slots = team.slots.map(findMonster);
      const ownedCount = slots.filter((s) => s.isOwned).length;
      const missingMonsters = slots.filter((s) => !s.isOwned).map((s) => s.name);

      return {
        ...team,
        slots,
        ownedCount,
        missingMonsters,
        isComplete: ownedCount === 4,
        statusLabel: ownedCount === 4 ? 'พร้อมรบ (ครบ 4 ตัว)' : `ขาดอีก ${4 - ownedCount} ตัว`,
      };
    }).sort((a, b) => {
      if (a.isComplete !== b.isComplete) return b.isComplete ? 1 : -1;
      return b.ownedCount - a.ownedCount;
    });
  };

  const offense = processTeams(arenaData.offense || []);
  const defense = processTeams(arenaData.defense || []);

  const readyAo = offense.filter((t) => t.isComplete).length;
  const readyAd = defense.filter((t) => t.isComplete).length;

  return {
    offense,
    defense,
    summary: {
      totalAo: offense.length,
      readyAo,
      totalAd: defense.length,
      readyAd,
      hasBox: Boolean(userBox?.unit_list && userBox.unit_list.length > 0),
    },
  };
}
