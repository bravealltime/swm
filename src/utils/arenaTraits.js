// Arena "traits": what a monster does that matters when picking an arena attack — derived from the
// real skill effects in monsterSkillsData.json (scripts/build_arena_teams.mjs writes them to
// src/data/arenaMonsterTraits.json). No numbers here, only the presence of mechanics.
// This file has no imports so the build script and the browser share it.

const CC = new Set(['Stun', 'Freeze', 'Sleep', 'Silence']);
const BUFFERS = new Set(['Immunity', 'Invincible', 'Endure', 'Shield']);
const LEAD_TRAIT = {
  'Attack Speed': 'speedLead', Resistance: 'resLead', Defense: 'defLead', HP: 'hpLead',
  'Attack Power': 'atkLead', Accuracy: 'accLead', 'Critical Rate': 'crLead',
};
export const LEAD_TRAITS = new Set(Object.values(LEAD_TRAIT));

// Mechanics the skill database cannot express as an effect tag
const SPECIAL = { Leo: ['antiSpeed'] };

export const TRAIT_LABEL = {
  speedLead: 'ลีด SPD', resLead: 'ลีด RES', defLead: 'ลีด DEF', hpLead: 'ลีด HP', atkLead: 'ลีด ATK', accLead: 'ลีด ACC', crLead: 'ลีด CRI',
  strip: 'ล้างบัฟ', buffer: 'บัฟป้องกัน (Immunity/โล่/อมตะ)', immunityAoe: 'ภูมิคุ้มกันทั้งทีม', heal: 'ฮีล', revive: 'ชุบ',
  provoke: 'ยั่วยุ', counter: 'สวนกลับ', cc: 'CC (สตัน/แช่/หลับ/ใบ้)', atb: 'ลดเกจ', cooldown: 'ดันคูลดาวน์', oblivion: 'Oblivion',
  bomb: 'บอมบ์', ignoreDef: 'เจาะ DEF', antiRevive: 'กันชุบ', ignoreRes: 'ไม่สน RES', passive: 'มี Passive', antiSpeed: 'ลงโทษความเร็ว',
};

/** Traits of one skill record from monsterSkillsData.json (`{ name, ls, sk[] }`). */
export function monsterTraits(rec) {
  const t = new Set(SPECIAL[rec?.name] || []);
  const ls = rec?.ls;
  if (ls?.attribute && ['Arena', 'General'].includes(ls.area || 'General') && LEAD_TRAIT[ls.attribute]) t.add(LEAD_TRAIT[ls.attribute]);
  for (const s of rec?.sk || []) {
    // S1 procs are too weak to plan around; passives, AoE and S2/S3 are what an arena team is built on
    const strong = Boolean(s.isPassive || s.isAoe || Number(s.slot || 1) >= 2);
    // ally-wide buffs are not flagged isAoe in the data; the description says "all allies"
    const teamWide = Boolean(s.isAoe || /all allies|all ally/i.test(s.description || ''));
    for (const e of s.effects || []) {
      const n = e?.name;
      if (n === 'Remove Buff' || n === 'Steal Buff') t.add('strip');
      if (BUFFERS.has(n)) t.add('buffer');
      if (n === 'Immunity' && teamWide) t.add('immunityAoe');
      if (n === 'Heal' || n === 'Recovery') t.add('heal');
      if (n === 'Revive') t.add('revive');
      if (n === 'Provoke') t.add('provoke');
      if (n === 'Counter' || n === 'Passive Reflect DMG' || n === 'Reflect DMG') t.add('counter');
      if (CC.has(n) && strong) t.add('cc');
      // single-target ATB nibbles (Galleon S2) do not lock a team; AoE or passive ATB control does
      if ((n === 'Decrease ATB' || n === 'Absorb ATB') && (s.isAoe || s.isPassive)) t.add('atb');
      if (n === 'Increase Cooltime') t.add('cooldown');
      if (n === 'Oblivion') t.add('oblivion');
      if (n === 'Bomb' && s.isAoe) t.add('bomb'); // a bomb team plants on everyone (Liebli/Jojo/Malaka/Seara), not Giana S2
      if (n === 'Ignore DEF') t.add('ignoreDef');
      if (n === 'Anti-Revive' || n === 'Unrevivable') t.add('antiRevive');
      if (n === 'Ignore Resistance') t.add('ignoreRes');
    }
    if (s.isPassive) t.add('passive');
  }
  return [...t].sort();
}

/**
 * Traits of a 4-monster line-up: every member's mechanics, but leader traits only from slot 0
 * (a SPD lead in slot 3 leads nothing).
 */
export function teamTraits(names, traitsOf) {
  const out = new Set();
  names.forEach((name, i) => {
    for (const tr of traitsOf(name) || []) {
      if (LEAD_TRAITS.has(tr) && i !== 0) continue;
      out.add(tr);
    }
  });
  return [...out].sort();
}
