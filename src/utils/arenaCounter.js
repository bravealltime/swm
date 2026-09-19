// "เจอทีมรับนี้ บุกด้วยอะไร" — ranks the Arena Offense catalogue against an enemy defense.
//
// The enemy is described only by mechanics read off its monsters' real skills (arenaMonsterTraits.json):
// does it lead SPD, does it carry immunity/shields, revives, counterattacks, CC… Each AO team is then
// scored by whether its own mechanics answer those threats, plus the structured counters written on a
// matching catalogue defense. The score is an ordering aid, not a win probability.

import traitsMap from '../data/arenaMonsterTraits.json' with { type: 'json' };
import arenaData from '../data/arenaMetaTeams.json' with { type: 'json' };
import { teamTraits, TRAIT_LABEL } from './arenaTraits.js';

const norm = (s) => String(s || '').replace(/\s*\(.*?\)\s*/g, '').toLowerCase().trim();
const traitIndex = new Map();
for (const [name, t] of Object.entries(traitsMap)) {
  traitIndex.set(norm(name), t);
  if (name.includes('/')) {
    name.split('/').forEach((part) => {
      const p = norm(part);
      if (p && !traitIndex.has(p)) traitIndex.set(p, t);
    });
  }
}

export const traitsOfName = (name) => {
  const direct = traitIndex.get(norm(name));
  if (direct) return direct;
  if (name && name.includes('/')) {
    for (const part of name.split('/')) {
      const hit = traitIndex.get(norm(part));
      if (hit) return hit;
    }
  }
  return [];
};

export const hasSkill = (name) => {
  const n = norm(name);
  if (traitIndex.has(n)) return true;
  if (name && name.includes('/')) {
    return name.split('/').some((part) => traitIndex.has(norm(part)));
  }
  return false;
};

const has = (list, tr) => list.includes(tr);
// Team slots are plain names in the catalogue but { name, … } objects once matchArenaTeams() has run
const slotName = (s) => (typeof s === 'string' ? s : s?.name || '');
const names = (list) => list.join(', ');

/**
 * What the enemy line-up does. Slot 0 is treated as the leader.
 * @param {string[]} enemyNames 1–4 monster names
 */
export function profileEnemy(enemyNames) {
  const members = enemyNames.filter(Boolean).slice(0, 4).map((name) => ({ name, traits: traitsOfName(name) }));
  const withTrait = (tr, exceptLeaderOnly = false) => members.filter((m, i) => m.traits.includes(tr) && (!exceptLeaderOnly || i === 0)).map((m) => m.name);
  const leaderTraits = members[0]?.traits || [];
  const lead = (tr) => leaderTraits.includes(tr);
  const groups = {
    buffers: withTrait('buffer'),
    immunityAoe: withTrait('immunityAoe'),
    healers: withTrait('heal'),
    revivers: withTrait('revive'),
    walls: [...new Set([...withTrait('counter'), ...withTrait('provoke')])],
    cc: withTrait('cc'),
    atb: withTrait('atb'),
    strippers: withTrait('strip'),
    cooldown: withTrait('cooldown'),
    passives: withTrait('passive'),
    bombers: withTrait('bomb'),
    antiSpeed: withTrait('antiSpeed'),
  };
  const flags = {
    speedLead: lead('speedLead'),
    resLead: lead('resLead'),
    defLead: lead('defLead'),
    hpLead: lead('hpLead'),
    // A wall: a DEF/HP lead or most of the team built to survive (buffs / heals / revives / counters)
    wall: lead('defLead') || lead('hpLead') || new Set([...groups.buffers, ...groups.healers, ...groups.revivers, ...groups.walls]).size >= 3,
    stall: groups.healers.length >= 2,
  };
  const unknown = members.filter((m) => !hasSkill(m.name)).map((m) => m.name);
  // Other members carrying an arena lead — the picker cannot know which one the defender put first
  const otherLeads = members.slice(1).filter((m) => m.traits.some((t) => t.endsWith('Lead') && t !== 'accLead' && t !== 'crLead' && t !== 'atkLead')).map((m) => m.name);

  const chips = [];
  if (flags.speedLead) chips.push({ key: 'speedLead', label: `ลีด SPD: ${members[0].name}` });
  if (flags.resLead) chips.push({ key: 'resLead', label: `ลีด RES: ${members[0].name}` });
  if (flags.defLead) chips.push({ key: 'defLead', label: `ลีด DEF: ${members[0].name}` });
  if (flags.hpLead) chips.push({ key: 'hpLead', label: `ลีด HP: ${members[0].name}` });
  if (lead('atkLead')) chips.push({ key: 'atkLead', label: `ลีด ATK: ${members[0].name}` });
  if (lead('accLead')) chips.push({ key: 'accLead', label: `ลีด ACC: ${members[0].name}` });
  if (lead('crLead')) chips.push({ key: 'crLead', label: `ลีด CRI: ${members[0].name}` });
  const chip = (key, list) => { if (list.length) chips.push({ key, label: `${TRAIT_LABEL[key] || key}: ${names(list)}` }); };
  chip('buffer', groups.buffers);
  chip('revive', groups.revivers);
  chip('heal', groups.healers);
  chip('counter', groups.walls);
  chip('cc', groups.cc);
  chip('atb', groups.atb);
  chip('strip', groups.strippers);
  chip('cooldown', groups.cooldown);
  chip('bomb', groups.bombers);
  chip('antiSpeed', groups.antiSpeed);
  if (flags.wall && !flags.defLead && !flags.hpLead) chips.push({ key: 'wall', label: 'กำแพง: ทีมเน้นอยู่รอด' });

  return { members, leader: members[0]?.name || '', flags, groups, chips, unknown, otherLeads };
}

/** Catalogue defenses that share members with the enemy (3+ = the same formula, 2 = a relative). */
export function matchDefenses(enemyNames, defense = arenaData.defense) {
  const normKeys = (str) => {
    const n = norm(str);
    if (!n) return [];
    if (n.includes('/')) {
      return [n, ...n.split('/').map((p) => p.trim()).filter(Boolean)];
    }
    return [n];
  };

  const enemyKeys = new Set(enemyNames.flatMap(normKeys));

  return defense
    .map((team) => {
      const matchedSlots = team.slots.filter((x) => normKeys(slotName(x)).some((k) => enemyKeys.has(k)));
      const overlap = new Set(matchedSlots.map((x) => norm(slotName(x)))).size;
      return { team, overlap };
    })
    .filter((m) => m.overlap >= 2)
    .sort((a, b) => b.overlap - a.overlap || (a.team.tier > b.team.tier ? 1 : -1));
}

/**
 * Score every AO team against the enemy profile.
 * @param {string[]} enemyNames
 * @param {{ offense?: object[], defense?: object[] }} pools — pass the box-matched offense list to keep isComplete etc.
 */
export function findArenaCounters(enemyNames, { offense = arenaData.offense, defense = arenaData.defense } = {}) {
  const enemy = profileEnemy(enemyNames);
  const matched = matchDefenses(enemyNames, defense);
  // Structured counters come only from the closest formula(s): a 4/4 match must not be outranked by a 3/4 relative
  const best = matched[0]?.overlap || 0;
  const exact = best >= 3 ? matched.filter((m) => m.overlap === best) : [];
  const recommendedIds = new Map(); // ao id -> defense nameTh that names it
  for (const m of exact) for (const id of m.team.counters || []) if (!recommendedIds.has(id)) recommendedIds.set(id, m.team.nameTh);

  const { flags, groups } = enemy;
  const results = offense.map((team) => {
    const caps = team.caps || teamTraits(team.slots.map(slotName), traitsOfName);
    const ourLeader = slotName(team.slots[0]);
    const cap = (tr) => has(caps, tr);
    const bruiser = /Bruiser/i.test(team.archetype || '');
    let score = 0;
    const reasons = [];
    const warnings = [];

    if (groups.buffers.length) {
      if (cap('strip')) { score += 3; reasons.push(`มีตัวล้างบัฟ — จัดการ ${names(groups.buffers)} ที่เปิดภูมิคุ้มกัน/โล่/อมตะได้`); }
      else if (cap('bomb')) { score -= 2; warnings.push(`ไม่มีตัวล้างบัฟ: ภูมิคุ้มกันของ ${names(groups.buffers)} กันบอมบ์ได้`); }
      else { score -= 3; warnings.push(`ไม่มีตัวล้างบัฟ — ${names(groups.buffers)} จะเปิดบัฟป้องกันไว้ก่อน`); }
    }
    if (flags.speedLead) {
      if (cap('antiSpeed')) { score += 4; reasons.push(`Leo ลงโทษความเร็ว — ลีด SPD ของ ${enemy.leader} กลายเป็นโทษ`); }
      else if (cap('speedLead')) { score += 2; reasons.push(`ลีด SPD ของ ${ourLeader} ช่วยให้ยังแซง ${enemy.leader} ได้`); }
      else if (cap('immunityAoe')) { score += 1; reasons.push('เปิดภูมิคุ้มกัน/อมตะเทิร์นแรก กันโดนดักสปีด'); }
      else if (!bruiser) { score -= 1; warnings.push(`ต้องแซง ${enemy.leader} ที่มีลีด SPD ให้ได้ ไม่งั้นโดนตัดเทิร์น`); }
    }
    if (groups.revivers.length) {
      if (cap('cooldown')) { score += 2; reasons.push(`ดันคูลดาวน์ให้ ${names(groups.revivers)} ชุบไม่ทัน`); }
      if (cap('atb')) { score += 2; reasons.push(`ล็อกเกจ ไม่ให้ ${names(groups.revivers)} ได้เทิร์นชุบ`); }
      if (cap('bomb')) { score += 1; reasons.push('บอมบ์ระเบิดพร้อมกัน ฆ่าครบก่อนชุบ'); }
      if (cap('antiRevive')) { score += 2; reasons.push('มีกันชุบ'); }
      if (!cap('cooldown') && !cap('atb') && !cap('bomb') && !cap('antiRevive')) { score -= 1; warnings.push(`ต้องฆ่าครบ 4 ในรอบเดียว ไม่งั้น ${names(groups.revivers)} ชุบกลับ`); }
    }
    if (groups.walls.length) {
      if (cap('bomb')) { score += 3; reasons.push(`บอมบ์ไม่โดนสวนกลับ/ยั่วยุจาก ${names(groups.walls)}`); }
      if (cap('oblivion')) { score += 2; reasons.push(`Oblivion ปิด Passive ของ ${names(groups.walls)}`); }
      if (cap('atb') && !cap('bomb')) { score += 1; reasons.push('ล็อกเกจไม่ให้ตัวสวนกลับได้เทิร์น'); }
      if (!cap('bomb') && !cap('oblivion') && !cap('atb')) { score -= 1; warnings.push(`ตีตรงจะโดน ${names(groups.walls)} สวนกลับ/ยั่วยุ`); }
    }
    if (flags.wall) {
      if (cap('bomb')) { score += 3; reasons.push('บอมบ์ไม่สน DEF/โล่ เหมาะกับกำแพง'); }
      if (cap('ignoreDef')) { score += 2; reasons.push('มีตัวเจาะ DEF'); }
      if (bruiser) { score += 1; reasons.push('บรุยเซอร์ค่อย ๆ ทุบกำแพงได้'); }
      if (!cap('bomb') && !cap('ignoreDef') && !bruiser) { score -= 2; warnings.push('คลีฟรอบเดียวอาจฆ่ากำแพงไม่ตาย'); }
    }
    if (flags.stall) {
      if (cap('bomb')) { score += 2; reasons.push(`ทีมลากเกม (${names(groups.healers)}) แพ้บอมบ์`); }
      if (cap('cooldown')) { score += 1; reasons.push('ดันคูลดาวน์สกิลฮีล'); }
      if (cap('provoke')) { score += 1; reasons.push('ยั่วยุแล้วเก็บทีละตัว'); }
    }
    if (groups.cc.length) {
      if (cap('immunityAoe')) { score += 2; reasons.push(`ภูมิคุ้มกันทั้งทีมกัน CC ของ ${names(groups.cc)}`); }
      if (cap('antiSpeed') && flags.speedLead) { score += 1; }
      if (bruiser && !cap('immunityAoe')) { score -= 1; warnings.push(`ลากยาวเสี่ยงโดน CC ของ ${names(groups.cc)} ซ้ำ`); }
    }
    if (flags.resLead) {
      if (cap('cc') || cap('atb')) { score -= 2; warnings.push(`ลีด RES ของ ${enemy.leader} ทำให้สตัน/ลดเกจติดยาก`); }
      if (cap('bomb')) { score -= 1; warnings.push('บอมบ์ต้องการ ACC สูงขึ้นเมื่อเจอลีด RES'); }
      if (cap('ignoreRes')) { score += 2; reasons.push('ล้างบัฟแบบไม่สน RES (Tiana/Ganymede)'); }
    }
    if (groups.passives.length >= 2 && cap('oblivion')) { score += 1; reasons.push(`Oblivion ปิด Passive ของ ${names(groups.passives)}`); }
    if (groups.strippers.length) {
      if (cap('immunityAoe')) { score -= 2; warnings.push(`${names(groups.strippers)} ล้างภูมิคุ้มกัน/อมตะของเราได้`); }
    }
    if (groups.atb.length && !flags.speedLead) {
      if (cap('immunityAoe')) { score += 1; reasons.push('ภูมิคุ้มกันกันโดนลดเกจ'); }
      if (cap('antiSpeed')) { score += 1; }
    }
    if (recommendedIds.has(team.id)) { score += 3; reasons.unshift(`สูตรแก้ที่ระบุไว้สำหรับ "${recommendedIds.get(team.id)}"`); }

    return { ...team, score, reasons, warnings, recommended: recommendedIds.has(team.id) };
  });

  results.sort((a, b) => b.score - a.score || Number(Boolean(b.isComplete)) - Number(Boolean(a.isComplete)) || (a.tier > b.tier ? 1 : a.tier < b.tier ? -1 : 0));
  return { enemy, matched, results };
}
