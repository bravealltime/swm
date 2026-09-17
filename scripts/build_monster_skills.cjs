const fs = require('fs');
const path = require('path');

const myMonsters = JSON.parse(fs.readFileSync(path.resolve('src/data/allMonsters.json'), 'utf8'));
const sfMonsters = JSON.parse(fs.readFileSync(path.resolve('swgt_raw/swarfarm_monsters.json'), 'utf8'));
const sfSkills = JSON.parse(fs.readFileSync(path.resolve('swgt_raw/swarfarm_skills.json'), 'utf8'));

const EFFECT_THAI = {
  'Decrease DEF': { th: 'ลดเกราะ (Def Break)', type: 'debuff', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  'Continuous DMG': { th: 'ความเสียหายต่อเนื่อง (Dot)', type: 'debuff', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  'Stun': { th: 'สตั๊น (Stun)', type: 'debuff', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  'Freeze': { th: 'แช่แข็ง (Freeze)', type: 'debuff', badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
  'Sleep': { th: 'หลับ (Sleep)', type: 'debuff', badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  'Provoke': { th: 'ยั่วยุ (Provoke)', type: 'debuff', badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
  'Silence': { th: 'ใบ้ห้ามใช้สกิล (Silence)', type: 'debuff', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  'Oblivion': { th: 'ปิดพาสซีฟ (Oblivion)', type: 'debuff', badge: 'bg-red-500/20 text-red-300 border-red-500/30' },
  'Beneficial Effects Blocked': { th: 'ห้ามรับบัฟ (Block Buff)', type: 'debuff', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  'Unrecoverable': { th: 'ห้ามฮีล (Unrecoverable)', type: 'debuff', badge: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
  'Brand': { th: 'ตราประทับ (Branding +25% DMG)', type: 'debuff', badge: 'bg-rose-600/20 text-rose-300 border-rose-600/30' },
  'Bomb': { th: 'ติดตั้งระเบิด (Bomb)', type: 'debuff', badge: 'bg-orange-600/20 text-orange-300 border-orange-600/30' },
  'Decrease ATB': { th: 'ลดเกจเทิร์น (ATB Pushback)', type: 'debuff', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  'Absorb ATB': { th: 'ดูดเกจเทิร์น (Absorb ATB)', type: 'neutral', badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  'Increase ATB': { th: 'เพิ่มเกจเทิร์น (Boost ATB)', type: 'buff', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  'Decrease ATK': { th: 'ลดพลังโจมตี (ATK Break)', type: 'debuff', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  'Decrease ATK SPD': { th: 'ลดความเร็วโจมตี (Slow)', type: 'debuff', badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
  'Increase ATK': { th: 'เพิ่มพลังโจมตี (บัฟดาบ)', type: 'buff', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  'Increase DEF': { th: 'เพิ่มพลังป้องกัน (บัฟโล่)', type: 'buff', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  'Increase ATK SPD': { th: 'เพิ่มความเร็ว (บัฟสปีด)', type: 'buff', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  'Increase CRI Rate': { th: 'เพิ่มอัตราคริ (บัฟคริ)', type: 'buff', badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  'Immunity': { th: 'ต้านทานสถานะ (บัฟอิมมูน)', type: 'buff', badge: 'bg-sky-400/20 text-sky-300 border-sky-400/30' },
  'Invincible': { th: 'สถานะอมตะ (Invincible)', type: 'buff', badge: 'bg-yellow-400/20 text-yellow-300 border-yellow-400/30' },
  'Endure': { th: 'สถานะอดทน (Endure)', type: 'buff', badge: 'bg-amber-400/20 text-amber-300 border-amber-400/30' },
  'Shield': { th: 'เกราะบาเรีย (Shield)', type: 'buff', badge: 'bg-blue-400/20 text-blue-300 border-blue-400/30' },
  'Cleanse': { th: 'ล้างดีบัฟ (Cleanse)', type: 'buff', badge: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
  'Strip': { th: 'ลบล้างบัฟศัตรู (Strip)', type: 'neutral', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  'Ignore DEF': { th: 'เจาะเกราะ (Ignore DEF)', type: 'neutral', badge: 'bg-red-500/20 text-red-300 border-red-500/30' },
  'Destroy HP': { th: 'ทำลาย HP สูงสุด (Destroy)', type: 'debuff', badge: 'bg-rose-700/20 text-rose-300 border-rose-700/30' },
  'Additional Turn': { th: 'ได้เทิร์นเพิ่ม (Extra Turn)', type: 'buff', badge: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30' },
  'Additional Attack': { th: 'โจมตีซ้ำ (Multi-Strike)', type: 'neutral', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  'Counter': { th: 'สวนกลับ (Counterattack)', type: 'buff', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  'Threat': { th: 'คุกคาม (Threat State)', type: 'buff', badge: 'bg-rose-600/20 text-rose-300 border-rose-600/30' },
  'Heal': { th: 'ฟื้นฟูพลังชีวิต (Heal)', type: 'buff', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  'Revive': { th: 'ชุบชีวิตพันธมิตร (Revive)', type: 'buff', badge: 'bg-indigo-400/20 text-indigo-300 border-indigo-400/30' },
  'Soul Protection': { th: 'วิญญาณคุ้มครอง (เกิดใหม่เมื่อตาย)', type: 'buff', badge: 'bg-purple-400/20 text-purple-300 border-purple-400/30' }
};

function translateSkillDescription(desc, s) {
  if (!desc) return '';
  let th = desc;
  
  // Smart phrases
  th = th.replace(/Attacks the enemy (\d+) times and deals damage proportionate to your Defense/gi, 'โจมตีศัตรู $1 ครั้ง โดยดาเมจจะรุนแรงขึ้นตามค่าพลังป้องกัน (DEF) ของคุณ');
  th = th.replace(/Attacks the enemy and deals damage proportionate to your Defense/gi, 'โจมตีศัตรูโดยดาเมจจะรุนแรงขึ้นตามค่าพลังป้องกัน (DEF) ของคุณ');
  th = th.replace(/Attacks the enemy (\d+) times and deals damage proportionate to your MAX HP/gi, 'โจมตีศัตรู $1 ครั้ง โดยดาเมจจะรุนแรงขึ้นตามค่า HP สูงสุด (MAX HP) ของคุณ');
  th = th.replace(/Attacks the enemy and deals damage proportionate to your MAX HP/gi, 'โจมตีศัตรูโดยดาเมจจะรุนแรงขึ้นตามค่า HP สูงสุด (MAX HP) ของคุณ');
  th = th.replace(/Attacks all enemies and deals damage proportionate to your Attack Speed/gi, 'โจมตีศัตรูทั้งหมดโดยดาเมจจะรุนแรงขึ้นตามความเร็วโจมตี (SPD) ของคุณ');
  th = th.replace(/Attacks the enemy and deals damage proportionate to your Attack Speed/gi, 'โจมตีศัตรูโดยดาเมจจะรุนแรงขึ้นตามความเร็วโจมตี (SPD) ของคุณ');
  th = th.replace(/Attacks all enemies (\d+) times/gi, 'โจมตีศัตรูทั้งหมด $1 ครั้ง');
  th = th.replace(/Attacks all enemies/gi, 'โจมตีศัตรูทั้งหมด');
  th = th.replace(/Attacks the enemy (\d+) times/gi, 'โจมตีศัตรู $1 ครั้ง');
  th = th.replace(/Attacks the enemy/gi, 'โจมตีเป้าหมายศัตรู');
  
  th = th.replace(/proportionate to the enemy's MAX HP/gi, 'ตามค่า HP สูงสุดของศัตรู');
  th = th.replace(/proportionate to your Defense/gi, 'ตามพลังป้องกัน (DEF) ของคุณ');
  th = th.replace(/proportionate to your MAX HP/gi, 'ตาม HP สูงสุด (MAX HP) ของคุณ');
  th = th.replace(/proportionate to your Attack Speed/gi, 'ตามความเร็วโจมตี (SPD) ของคุณ');
  th = th.replace(/proportionate to your Attack Power/gi, 'ตามพลังโจมตี (ATK) ของคุณ');

  th = th.replace(/with a (\d+)% chance to stun the enemy for (\d+) turn[s]?/gi, 'มีโอกาส $1% ที่จะสตั๊นศัตรูเป็นเวลา $2 เทิร์น');
  th = th.replace(/with a (\d+)% chance to stun for (\d+) turn[s]?/gi, 'มีโอกาส $1% ที่จะสตั๊นเป็นเวลา $2 เทิร์น');
  th = th.replace(/Each attack has a (\d+)% chance to stun the enemy for (\d+) turn[s]?/gi, 'การโจมตีแต่ละครั้งมีโอกาส $1% ที่จะสตั๊นศัตรูเป็นเวลา $2 เทิร์น');
  th = th.replace(/Each attack has a (\d+)% chance to decrease the Defense for (\d+) turn[s]?/gi, 'การโจมตีแต่ละครั้งมีโอกาส $1% ที่จะลดพลังป้องกัน (เกราะแตก) นาน $2 เทิร์น');
  th = th.replace(/decreases the Defense for (\d+) turn[s]? with a (\d+)% chance/gi, 'มีโอกาส $2% ที่จะลดพลังป้องกัน (เกราะแตก) นาน $1 เทิร์น');
  th = th.replace(/decreases the enemy's Defense for (\d+) turn[s]?/gi, 'ลดพลังป้องกัน (เกราะแตก) ของศัตรูนาน $1 เทิร์น');
  
  th = th.replace(/removes all beneficial effects on the target/gi, 'ลบล้างบัฟทั้งหมดของเป้าหมาย (Strip)');
  th = th.replace(/removes all beneficial effects granted on all enemies/gi, 'ลบล้างบัฟทั้งหมดของศัตรูทั้งทีม (AOE Strip)');
  th = th.replace(/removes all harmful effects on all allies/gi, 'ลบล้างดีบัฟทั้งหมดของพันธมิตรทั้งทีม (Cleanse)');
  th = th.replace(/removes all harmful effects/gi, 'ลบล้างดีบัฟทั้งหมด');
  th = th.replace(/increases the Attack Bar of all allies by (\d+)%/gi, 'เพิ่มเกจเทิร์น (ATB) ของพันธมิตรทั้งทีม $1%');
  th = th.replace(/increases your Attack Bar by (\d+)%/gi, 'เพิ่มเกจเทิร์น (ATB) ของตัวเอง $1%');
  th = th.replace(/decreases the Attack Bar of all enemies by (\d+)%/gi, 'ลดเกจเทิร์น (ATB) ของศัตรูทั้งทีม $1%');
  th = th.replace(/decreases the enemy's Attack Bar by (\d+)%/gi, 'ลดเกจเทิร์น (ATB) ของศัตรู $1%');
  th = th.replace(/recovers the HP of all allies by (\d+)%/gi, 'ฟื้นฟู HP ของพันธมิตรทั้งทีม $1%');
  th = th.replace(/grants Immunity for (\d+) turn[s]?/gi, 'มอบสถานะต้านทาน (อิมมูน) นาน $1 เทิร์น');
  th = th.replace(/inflicts Continuous Damage for (\d+) turn[s]?/gi, 'สร้างความเสียหายต่อเนื่อง (Dot) นาน $1 เทิร์น');
  th = th.replace(/provokes all enemies for (\d+) turn[s]?/gi, 'ยั่วยุศัตรูทั้งหมดนาน $1 เทิร์น');
  th = th.replace(/provokes the enemy for (\d+) turn[s]?/gi, 'ยั่วยุศัตรูนาน $1 เทิร์น');
  th = th.replace(/gains another turn immediately/gi, 'ได้รับเทิร์นเพิ่มขึ้นทันที (Extra Turn)');
  th = th.replace(/Becomes immune against/gi, 'ได้รับสถานะต้านทานสมบูรณ์ต่อ');

  return th;
}

function generateTactics(s, m) {
  const parts = [];
  if (s.passive) {
    parts.push('⚡ [สกิลติดตัว / Passive] ทำงานตลอดเวลาโดยอัตโนมัติ ไม่ต้องกดใช้');
  } else if (s.slot === 1) {
    parts.push('⚔️ [สกิล 1 / S1] ท่าโจมตีพื้นฐานประจำตัว ใช้งานได้ทุกเทิร์น');
  } else if (s.slot === 2) {
    parts.push(`🎯 [สกิล 2 / S2] ท่าควบคุมและสนับสนุน ${s.cooltime ? 'คูลดาวน์ ' + s.cooltime + ' เทิร์น' : ''}`);
  } else if (s.slot >= 3) {
    parts.push(`💥 [สกิล 3 / S3] ท่าไม้ตายหลักของมอนสเตอร์ ${s.cooltime ? 'คูลดาวน์ ' + s.cooltime + ' เทิร์น' : ''}`);
  }

  if (s.aoe) parts.push('เป็นดาเมจหมู่ (AOE) โดนศัตรูทั้งทีม');
  if (s.hits > 1) parts.push(`โจมตีต่อเนื่อง ${s.hits} ครั้ง เพิ่มโอกาสติดเอฟเฟกต์และเหมาะกับรูน Despair/Artifact Additional DMG`);
  if (s.scales_with && s.scales_with.length > 0) {
    parts.push(`ความเสียหายคำนวณตาม [${s.scales_with.join(' + ')}] ยิ่งค่าสเตตัสนี้สูงดาเมจยิ่งมหาศาล`);
  }
  if (s.multiplier_formula) {
    parts.push(`สูตรดาเมจตัวคูณ: ${s.multiplier_formula}`);
  }
  return parts.join(' • ');
}

function translateLeaderSkill(ls) {
  if (!ls) return null;
  const attrMap = {
    'HP': 'พลังชีวิต (HP)',
    'Attack Power': 'พลังโจมตี (ATK)',
    'Defense': 'พลังป้องกัน (DEF)',
    'Attack Speed': 'ความเร็วโจมตี (SPD)',
    'Critical Rate': 'อัตราคริติคอล (CRI Rate)',
    'Resistance': 'ความต้านทาน (RES)',
    'Accuracy': 'ความแม่นยำ (ACC)',
    'Critical DMG': 'ความเสียหายคริติคอล (CRI DMG)'
  };
  const areaMap = {
    'Guild': 'ในสงครามกิลด์ & กิลด์ซีจ (Guild Content)',
    'Arena': 'ในอารีน่า (Arena)',
    'Dungeon': 'ในดันเจี้ยน (Dungeon)',
    'General': 'ในทุกคอนเทนต์การต่อสู้'
  };
  const elemMap = {
    'Fire': 'ธาตุไฟ',
    'Water': 'ธาตุน้ำ',
    'Wind': 'ธาตุลม',
    'Light': 'ธาตุแสง',
    'Dark': 'ธาตุมืด'
  };

  const attr = attrMap[ls.attribute] || ls.attribute;
  const scope = ls.element ? `ที่มี${elemMap[ls.element] || ls.element}` : (areaMap[ls.area] || '');
  const textTh = `เพิ่ม ${attr} ของมอนสเตอร์ฝ่ายเรา${scope ? ' ' + scope : ''} ขึ้น ${ls.amount}%`;
  
  let iconName = `leader_skill_${ls.attribute.replace(/\s+/g, '_')}`;
  if (ls.element) iconName += `_${ls.element}`;
  else if (ls.area && ls.area !== 'General') iconName += `_${ls.area}`;
  
  return {
    attribute: ls.attribute,
    amount: ls.amount,
    area: ls.area,
    element: ls.element,
    textTh,
    textEn: `Increases the ${ls.attribute} of ally Monsters ${ls.element ? 'with ' + ls.element + ' attribute' : (ls.area ? 'in ' + ls.area : '')} by ${ls.amount}%.`,
    iconUrl: `https://do9d4mpqk497d.cloudfront.net/common/images/leader_skills36/${iconName}.png`
  };
}

console.log('Building full monster skills dataset for 940 monsters...');
const database = {};
let totalSkillsMapped = 0;

for (const m of myMonsters) {
  const sfM = sfMonsters[m.com2usId];
  if (!sfM) continue;

  const leader = translateLeaderSkill(sfM.leader_skill);
  const monsterSkills = [];

  for (const sid of sfM.skills || []) {
    const s = sfSkills[sid];
    if (!s) continue;

    const slotLabel = s.passive ? 'Passive' : `S${s.slot || 1}`;
    const descTh = translateSkillDescription(s.description, s);
    const tactics = generateTactics(s, m);

    const effects = (s.effects || []).map(e => {
      const trans = EFFECT_THAI[e.name] || { th: e.name, type: e.type || 'neutral', badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30' };
      return {
        name: e.name,
        nameTh: trans.th,
        type: e.type,
        chance: e.chance,
        badgeClass: trans.badge,
        iconUrl: e.icon_filename ? `https://swarfarm.com/static/herders/images/buffs/${e.icon_filename}` : ''
      };
    });

    const skillups = (s.level_progress_description || []).map(u => {
      let uth = u;
      uth = uth.replace(/Damage \+(\d+)%/g, 'ความเสียหาย +$1%');
      uth = uth.replace(/Effect Rate \+(\d+)%/g, 'โอกาสติดผล +$1%');
      uth = uth.replace(/Recovery \+(\d+)%/g, 'การฟื้นฟู HP +$1%');
      uth = uth.replace(/Shield \+(\d+)%/g, 'ปริมาณบาเรีย +$1%');
      uth = uth.replace(/Cooltime Turn -(\d+)/g, 'ลดคูลดาวน์ -$1 เทิร์น');
      return uth;
    });

    const skillObj = {
      id: s.id,
      com2usId: s.com2us_id,
      name: s.name,
      slot: s.slot,
      slotLabel,
      isPassive: s.passive,
      isAoe: s.aoe,
      hits: s.hits || 1,
      cooldown: s.cooltime,
      cooldownText: s.passive ? 'สกิลติดตัว (Passive)' : (s.cooltime ? `คูลดาวน์ ${s.cooltime} เทิร์น` : 'ไม่มีคูลดาวน์'),
      multiplier: s.multiplier_formula || null,
      scalesWith: s.scales_with || [],
      description: s.description,
      descriptionTh: descTh,
      tactics,
      iconUrl: `https://do9d4mpqk497d.cloudfront.net/common/images/skills/${s.icon_filename}`,
      effects,
      skillups,
      maxLevel: s.max_level
    };

    monsterSkills.push(skillObj);
    totalSkillsMapped++;
  }

  const entry = {
    id: m.id,
    com2usId: m.com2usId,
    name: m.name,
    thaiName: m.thaiName || m.name,
    element: m.element,
    stars: m.stars,
    archetype: m.archetype,
    family: m.family,
    thaiFamily: m.thaiFamily,
    role: m.role,
    suggestedRunes: m.suggestedRunes,
    avatarUrl: m.avatarUrl || m.imageUrl,
    baseStats: {
      hp: sfM.raw_hp || 0,
      atk: sfM.raw_atk || 0,
      def: sfM.raw_def || 0,
      spd: sfM.speed || 0,
      critRate: sfM.crit_rate || 15,
      critDmg: sfM.crit_damage || 50,
      res: sfM.resistance || 15,
      acc: sfM.accuracy || 0
    },
    leaderSkill: leader,
    skills: monsterSkills
  };

  database[m.com2usId] = entry;
  database[m.id] = entry;
  database[m.name.toLowerCase()] = entry;
}

console.log(`Finished! Total monsters in database: ${Object.keys(database).length / 3}`);
console.log(`Total skills mapped: ${totalSkillsMapped}`);

// Write JSON
fs.writeFileSync(path.resolve('src/data/monsterSkillsDatabase.json'), JSON.stringify(database, null, 2));

// Also generate JS export helper
const jsHelper = `// Auto-generated Comprehensive Monster Skills & Mechanics Database
import monsterSkillsData from './monsterSkillsDatabase.json';

export const MONSTER_SKILLS_DB = monsterSkillsData;

export function getMonsterSkills(monsterOrId) {
  if (!monsterOrId) return null;
  if (typeof monsterOrId === 'string' || typeof monsterOrId === 'number') {
    return MONSTER_SKILLS_DB[monsterOrId] || MONSTER_SKILLS_DB[String(monsterOrId).toLowerCase()] || null;
  }
  if (monsterOrId.com2usId && MONSTER_SKILLS_DB[monsterOrId.com2usId]) {
    return MONSTER_SKILLS_DB[monsterOrId.com2usId];
  }
  if (monsterOrId.id && MONSTER_SKILLS_DB[monsterOrId.id]) {
    return MONSTER_SKILLS_DB[monsterOrId.id];
  }
  if (monsterOrId.name && MONSTER_SKILLS_DB[monsterOrId.name.toLowerCase()]) {
    return MONSTER_SKILLS_DB[monsterOrId.name.toLowerCase()];
  }
  return null;
}

export default MONSTER_SKILLS_DB;
`;

fs.writeFileSync(path.resolve('src/data/monsterSkills.js'), jsHelper);
console.log('Saved src/data/monsterSkillsDatabase.json and src/data/monsterSkills.js successfully!');
