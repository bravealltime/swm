// Arena Offense & Defense Team Matcher for Player Box
// Analyzes owned monsters and returns battle-ready 4-man Arena comps

import arenaData from '../data/arenaMetaTeams.json' with { type: 'json' };
import { MONSTERS } from '../data/monsters.js';
import { getMonsterCatalogInfo } from './swexImport.js';

const norm = (s) => String(s || '').replace(/\s*\(.*?\)\s*/g, '').toLowerCase().trim();

/**
 * Matches player box against Arena Offense and Defense meta teams
 * @param {Object} userBox - SWEX box JSON (either parsed box with .units or raw dump with .unit_list)
 * @returns {Object} { offense: Array, defense: Array, summary: Object }
 */
export function matchArenaTeams(userBox) {
  const rawUnits = userBox?.units || userBox?.unit_list || [];
  const hasBox = Boolean(rawUnits.length > 0);

  // 1. Build owned monsters map
  const ownedNames = new Map(); // normName -> unit info

  if (hasBox) {
    for (const u of rawUnits) {
      const masterId = Number(u.masterId || u.unit_master_id) || 0;
      const cat = getMonsterCatalogInfo(masterId) || {};
      const name = u.name || cat.name;
      if (!name) continue;
      const key = norm(name);

      if (!ownedNames.has(key)) {
        ownedNames.set(key, {
          unitId: u.uid || u.unit_id || 0,
          masterId,
          name: cat.name || name,
          thaiName: cat.thaiName || u.thaiName || name,
          stars: Number(u.stars || u.class) || 6,
          avatarUrl: cat.avatarUrl || cat.imageUrl || u.avatarUrl,
          element: cat.element || u.element,
          isOwned: true,
          isRealOwned: true,
        });
      }
    }
  }

  const findMonster = (name) => {
    const key = norm(name);
    if (hasBox && ownedNames.has(key)) {
      return ownedNames.get(key);
    }
    const cat = MONSTERS.find((m) => norm(m.name) === key) || {};
    return {
      name: cat.name || name,
      thaiName: cat.thaiName || name,
      avatarUrl: cat.avatarUrl || cat.imageUrl,
      element: cat.element || 'wind',
      stars: cat.stars || 5,
      isOwned: hasBox ? false : true, // If no box, show as neutral available slot
      isRealOwned: hasBox ? Boolean(ownedNames.has(key)) : false,
    };
  };

  const processTeams = (teamList) => {
    return teamList.map((team) => {
      const slots = team.slots.map(findMonster);
      const realOwnedCount = slots.filter((s) => s.isRealOwned).length;
      const missingMonsters = slots.filter((s) => !s.isRealOwned).map((s) => s.name);
      const isComplete = hasBox ? realOwnedCount === 4 : false;

      let statusLabel = 'สูตรเมต้ามาตรฐาน';
      if (hasBox) {
        statusLabel = realOwnedCount === 4 ? 'พร้อมรบ (ครบ 4 ตัว)' : `ขาดอีก ${4 - realOwnedCount} ตัว`;
      }

      return {
        ...team,
        slots,
        ownedCount: realOwnedCount,
        missingMonsters,
        isComplete,
        statusLabel,
      };
    }).sort((a, b) => {
      if (hasBox) {
        if (a.isComplete !== b.isComplete) return b.isComplete ? 1 : -1;
        return b.ownedCount - a.ownedCount;
      }
      return 0; // maintain meta ordering when no box
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
      hasBox,
    },
  };
}
