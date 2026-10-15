import fs from 'node:fs';
import path from 'node:path';
import { buildSkillShards } from './build_skill_shards.mjs';

const root = process.cwd();

// Load index for canonical effect references
const indexFile = path.join(root, 'src/data/monsterSkillsIndex.json');
const index = JSON.parse(fs.readFileSync(indexFile, 'utf8'));

const getCanonicalEffect = (name, chance) => {
  const ef = index.effects.find(e => e.name.toLowerCase() === name.toLowerCase());
  if (!ef) throw new Error(`Unknown effect: ${name}`);
  return { ...ef, chance };
};

// 1. ADD COSMIC WORM TO allMonsters.json
const allMonstersPath = path.join(root, 'src/data/allMonsters.json');
const allMonsters = JSON.parse(fs.readFileSync(allMonstersPath, 'utf8'));

const cosmicWorms = [
  {
    id: 'm-36112',
    com2usId: '36112',
    name: 'Volcaris',
    thaiName: 'โวลคาริส',
    unawakenedName: 'Cosmic Worm',
    family: 'Cosmic Worm',
    thaiFamily: 'หนอนอวกาศ',
    element: 'fire',
    stars: 5,
    archetype: 'HP',
    leaderSkill: 'เพิ่มพลังป้องกัน (DEF) ของมอนสเตอร์ฝ่ายเรา 33% ในทุกคอนเทนต์',
    role: 'ตัวแทงก์สายควบคุม/เพิ่มเลือดสูงสุด (HP Bruiser/Crowd Control)',
    suggestedRunes: 'Violent/Will หรือ Despair/Nemesis (HP%/HP%/HP% หรือ SPD/HP%/HP%)',
    avatarUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0225_1_2.png',
    imageUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0225_1_2.png',
    source: 'patch_9.3.6'
  },
  {
    id: 'm-36111',
    com2usId: '36111',
    name: 'Maris',
    thaiName: 'มาริส',
    unawakenedName: 'Cosmic Worm',
    family: 'Cosmic Worm',
    thaiFamily: 'หนอนอวกาศ',
    element: 'water',
    stars: 5,
    archetype: 'Support',
    leaderSkill: 'เพิ่มความต้านทาน (RES) ของมอนสเตอร์ฝ่ายเรา 44% ในทุกคอนเทนต์',
    role: 'ตัวลบบัฟหมู่ ขโมยบัฟ และแจกบัฟเพื่อน (Stripper/Buffer Support)',
    suggestedRunes: 'Swift/Will หรือ Violent/Will (SPD/HP%/HP%)',
    avatarUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0225_1_1.png',
    imageUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0225_1_1.png',
    source: 'patch_9.3.6'
  },
  {
    id: 'm-36113',
    com2usId: '36113',
    name: 'Auraris',
    thaiName: 'ออราลิส',
    unawakenedName: 'Cosmic Worm',
    family: 'Cosmic Worm',
    thaiFamily: 'หนอนอวกาศ',
    element: 'wind',
    stars: 5,
    archetype: 'Support',
    leaderSkill: 'เพิ่มพลังชีวิต (HP) ของมอนสเตอร์ฝ่ายเรา 33% ในทุกคอนเทนต์',
    role: 'ตัวควบคุมต่อเนื่อง เพิ่มระยะเวลาดีบัฟ และใบ้ศัตรู (Debuff Extender/CC)',
    suggestedRunes: 'Violent/Will หรือ Despair/Will (SPD/HP%/HP% หรือ SPD/HP%/ACC)',
    avatarUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0225_1_3.png',
    imageUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0225_1_3.png',
    source: 'patch_9.3.6'
  },
  {
    id: 'm-36114',
    com2usId: '36114',
    name: 'Luminaris',
    thaiName: 'ลูมินาริส',
    unawakenedName: 'Cosmic Worm',
    family: 'Cosmic Worm',
    thaiFamily: 'หนอนอวกาศ',
    element: 'light',
    stars: 5,
    archetype: 'Attack',
    leaderSkill: 'เพิ่มพลังโจมตี (ATK) ของมอนสเตอร์ฝ่ายเรา 33% ในทุกคอนเทนต์',
    role: 'ตัวเคลียร์หมู่ทะลุต้านตาย รีเซ็ตคูลดาวน์เมื่อฆ่าศัตรู (AOE Cleave Nuker)',
    suggestedRunes: 'Rage/Blade หรือ Fatal/Will (ATK%/CRIT DMG/ATK%)',
    avatarUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0225_1_4.png',
    imageUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0225_1_4.png',
    source: 'patch_9.3.6'
  },
  {
    id: 'm-36115',
    com2usId: '36115',
    name: 'Noctaris',
    thaiName: 'น็อคทาริส',
    unawakenedName: 'Cosmic Worm',
    family: 'Cosmic Worm',
    thaiFamily: 'หนอนอวกาศ',
    element: 'dark',
    stars: 5,
    archetype: 'HP',
    leaderSkill: 'เพิ่มอัตราคริติคอล (CRIT Rate) ของมอนสเตอร์ฝ่ายเรา 24% ในทุกคอนเทนต์',
    role: 'ตัวล็อกสตัน แปะสัญลักษณ์ และห้ามล้างดีบัฟ (Lockdown Bruiser/Disrupter)',
    suggestedRunes: 'Violent/Will หรือ Despair/Revenge (SPD/HP%/HP% หรือ HP%/CRIT DMG/HP%)',
    avatarUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0225_1_5.png',
    imageUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0225_1_5.png',
    source: 'patch_9.3.6'
  }
];

for (const worm of cosmicWorms) {
  const existingIdx = allMonsters.findIndex(m => m.id === worm.id || m.name.toLowerCase() === worm.name.toLowerCase());
  if (existingIdx >= 0) {
    allMonsters[existingIdx] = { ...allMonsters[existingIdx], ...worm };
  } else {
    allMonsters.push(worm);
  }
}

// Sort catalog nicely by name
allMonsters.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
fs.writeFileSync(allMonstersPath, JSON.stringify(allMonsters, null, 2), 'utf8');
console.log(`✅ Updated allMonsters.json (${allMonsters.length} total monsters)`);

// 2. ADD SKILLS TO monsterSkillsData.json
const monsterSkillsPath = path.join(root, 'src/data/monsterSkillsData.json');
const skillsData = JSON.parse(fs.readFileSync(monsterSkillsPath, 'utf8'));

// Common S1
const skill1 = {
  id: 36101,
  slot: 1,
  slotLabel: 'S1',
  isPassive: false,
  isAoe: false,
  hits: 1,
  cooldown: null,
  cooldownText: 'ไม่มีคูลดาวน์',
  multiplier: '3.8*{ATK}',
  scalesWith: ['ATK'],
  name: 'Star Crash',
  description: 'Attacks the enemy and decreases their Attack Power for 2 turns with a 50% chance.',
  descriptionTh: 'พุ่งชนโจมตีศัตรู มีโอกาส 50% ที่จะลดพลังโจมตีของศัตรูนาน 2 เทิร์น',
  tactics: '⚔️ [สกิล 1 / S1] ท่าโจมตีพื้นฐาน ใช้ขัดขวางดาเมจของศัตรูด้วยดีบัฟลดพลังโจมตี (ATK Break) โอกาสติดสูงสุด 70% เมื่ออัปสกิลเต็ม',
  iconUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/skills/skill_icon_0000_1_0.png',
  effects: [
    getCanonicalEffect('Decrease ATK', 50)
  ],
  skillups: ['ความเสียหาย +5%', 'โอกาสติดเอฟเฟกต์ +10%', 'ความเสียหาย +10%', 'โอกาสติดเอฟเฟกต์ +10%'],
  maxLevel: 5
};

// Skill 2A - Big Sigh (Fire, Wind, Light)
const skill2A = {
  id: 36102,
  slot: 2,
  slotLabel: 'S2',
  isPassive: false,
  isAoe: true,
  hits: 2,
  cooldown: 4,
  cooldownText: 'คูลดาวน์ 4 เทิร์น',
  multiplier: '1.7*{ATK} x2',
  scalesWith: ['ATK'],
  name: 'Big Sigh',
  description: 'Attacks all enemies 2 times. Each hit decreases their Attack Bar by 15% with an 80% chance and decreases their Defense for 2 turns with a 30% chance.',
  descriptionTh: 'ถอนหายใจปล่อยคลื่นอวกาศโจมตีศัตรูทั้งหมด 2 ครั้ง แต่ละครั้งมีโอกาส 80% ลดเกจโจมตี 15% และมีโอกาส 30% เจาะเกราะ (ลด DEF) นาน 2 เทิร์น',
  tactics: '🎯 [สกิล 2 / S2] สกิลกวาดหมู่ 2 ฮิต ขัดจังหวะรอบโจมตีด้วยการกดเกจสูงสุด 30% พร้อมโอกาสเปิดเกราะศัตรู (Def Break) เพื่อปูทางให้ดาเมจหลัก',
  iconUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/skills/skill_icon_0000_2_0.png',
  effects: [
    getCanonicalEffect('Decrease ATB', 80),
    getCanonicalEffect('Decrease DEF', 30)
  ],
  skillups: ['ความเสียหาย +10%', 'โอกาสติดเอฟเฟกต์ +10%', 'ความเสียหาย +10%', 'โอกาสติดเอฟเฟกต์ +10%', 'คูลดาวน์ -1 เทิร์น'],
  maxLevel: 6
};

// Skill 2B - Splash (Water, Dark)
const skill2B = {
  id: 36103,
  slot: 2,
  slotLabel: 'S2',
  isPassive: false,
  isAoe: false,
  hits: 2,
  cooldown: 4,
  cooldownText: 'คูลดาวน์ 4 เทิร์น',
  multiplier: '5.8*{ATK}',
  scalesWith: ['ATK'],
  name: 'Splash',
  description: 'Attacks the enemy to stun for 1 turn with an 80% chance. Afterwards, attacks a random enemy to decrease its Attack Speed for 2 turns with a 50% chance. If the random attack hits the same target as the first attack, additionally absorbs its Attack Bar by 50%.',
  descriptionTh: 'กระโดดฟาดโจมตีศัตรูเดี่ยว มีโอกาส 80% สตัน 1 เทิร์น จากนั้นสุ่มฟาดศัตรูอีก 1 ตัว ลดความเร็วโจมตีนาน 2 เทิร์น (โอกาส 50%) หากการสุ่มโดนเป้าหมายเดิม จะดูดเกจโจมตี 50%',
  tactics: '🎯 [สกิล 2 / S2] ควบคุมล็อคเป้าหมายเดี่ยวที่ทรงพลัง สตัน 100% (หลังอัปเต็ม) และหากสุ่มซ้ำเป้าหมายเดิมจะดูดเกจถึง 50% ทำให้เป้าหมายไม่ได้ขยับ',
  iconUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/skills/skill_icon_0000_3_0.png',
  effects: [
    getCanonicalEffect('Stun', 80),
    getCanonicalEffect('Decrease SPD', 50),
    getCanonicalEffect('Absorb ATB', 100)
  ],
  skillups: ['ความเสียหาย +10%', 'โอกาสติดเอฟเฟกต์ +10%', 'ความเสียหาย +10%', 'โอกาสติดเอฟเฟกต์ +10%', 'คูลดาวน์ -1 เทิร์น'],
  maxLevel: 6
};

// Skill 3 Fire - Squash
const skill3Fire = {
  id: 36104,
  slot: 3,
  slotLabel: 'S3',
  isPassive: false,
  isAoe: true,
  hits: 1,
  cooldown: 5,
  cooldownText: 'คูลดาวน์ 5 เทิร์น',
  multiplier: 'MAX_HP * (17% * aliveEnemies + 23%) / aliveEnemies',
  scalesWith: ['HP'],
  name: 'Squash',
  description: 'Attacks all enemies to stun for 1 turn and absorb their Attack Bar. The damage is proportionate to your MAX HP. The fewer enemies there are, the greater the damage dealt and the amount of Attack Bar absorbed. In addition, increases your MAX HP by 20%, up to 100%, each time this skill is used.',
  descriptionTh: 'กระโดดทับศัตรูทั้งหมด สตัน 1 เทิร์น และดูดเกจโจมตี ดาเมจตาม MAX HP ยิ่งศัตรูน้อย ดาเมจและการดูดเกจยิ่งรุนแรงขึ้น นอกจากนี้ เพิ่ม MAX HP รวมของตนเอง 20% สูงสุด 100% ทุกครั้งที่ใช้สกิล!',
  tactics: '💥 [สกิล 3 / S3] ท่าไม้ตายสุดอลังการ ทับหมู่สตันและดูดเกจ พร้อมบัฟเลือดสูงสุด (Total HP) ของตัวเองเพิ่มขึ้นครั้งละ 20% ซ้อนได้ถึง +100% (เลือดพุ่งทะลุ 150k-200k HP)',
  iconUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/skills/skill_icon_0000_4_0.png',
  effects: [
    getCanonicalEffect('Stun', 100),
    getCanonicalEffect('Absorb ATB', 100)
  ],
  skillups: ['ความเสียหาย +10%', 'ความเสียหาย +10%', 'คูลดาวน์ -1 เทิร์น'],
  maxLevel: 4
};

// Skill 3 Water - Deep Inhale
const skill3Water = {
  id: 36105,
  slot: 3,
  slotLabel: 'S3',
  isPassive: false,
  isAoe: true,
  hits: 1,
  cooldown: 5,
  cooldownText: 'คูลดาวน์ 5 เทิร์น',
  multiplier: '4.8*{ATK}',
  scalesWith: ['ATK'],
  name: 'Deep Inhale',
  description: 'Attacks all enemies to steal all beneficial effects and disturb HP recovery for 2 turns. Afterwards, grants 1 of the stolen beneficial effects at random to each other ally for 2 turns.',
  descriptionTh: 'สูดลมหายใจอวกาศโจมตีศัตรูทั้งหมด ขโมยบัฟทั้งหมดของศัตรูมา และห้ามฟื้นฟู HP นาน 2 เทิร์น หลังจากนั้น จะสุ่มมอบบัฟที่ขโมยมาได้ 1 อย่างให้เพื่อนร่วมทีมคนละ 1 บัฟ นาน 2 เทิร์น',
  tactics: '💥 [สกิล 3 / S3] ตัว Stripper ปลดบัฟหมู่และขโมยบัฟมาแจกจ่ายให้ทีม เช่น Immunity หรือ Shield ของศัตรู พร้อมปิดทางฮีล (Unrecoverable) เหมาะมากสำหรับตัดทางทีมบัฟหนา',
  iconUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/skills/skill_icon_0000_5_0.png',
  effects: [
    getCanonicalEffect('Steal Buff', 100),
    getCanonicalEffect('Unrecoverable', 100)
  ],
  skillups: ['ความเสียหาย +10%', 'ความเสียหาย +15%', 'คูลดาวน์ -1 เทิร์น'],
  maxLevel: 4
};

// Skill 3 Wind - Wormhole Dive
const skill3Wind = {
  id: 36106,
  slot: 3,
  slotLabel: 'S3',
  isPassive: false,
  isAoe: true,
  hits: 1,
  cooldown: 5,
  cooldownText: 'คูลดาวน์ 5 เทิร์น',
  multiplier: '0.33*{MAX_HP}',
  scalesWith: ['HP'],
  name: 'Wormhole Dive',
  description: 'Attacks all enemies to increase the duration of harmful effects on them by 1 turn, increase their chance of landing a Glancing Hit for 2 turns, and grant Silence for 1 to 2 turns. The damage is proportionate to your MAX HP.',
  descriptionTh: 'มุดรูหนอนโจมตีศัตรูทั้งหมด เพิ่มระยะเวลาดีบัฟทั้งหมดของศัตรูขึ้น 1 เทิร์น, เพิ่มโอกาสติด Glancing Hit นาน 2 เทิร์น และติดสถานะ Silence (ใบ้สกิล) นาน 1-2 เทิร์น ดาเมจตาม MAX HP',
  tactics: '💥 [สกิล 3 / S3] คอมโบขยายเวลาดีบัฟให้ทีม CC/DoT ยืดดีบัฟสตัน แช่แข็ง หรือพิษออกไปอีก 1 เทิร์น พร้อมใบ้สกิลไม่ให้ศัตรูใช้สกิล 2 หรือสกิล 3 สวนกลับได้',
  iconUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/skills/skill_icon_0000_6_0.png',
  effects: [
    getCanonicalEffect('Increase Glancing Hit Chance', 100),
    getCanonicalEffect('Silence', 100)
  ],
  skillups: ['ความเสียหาย +10%', 'ความเสียหาย +15%', 'คูลดาวน์ -1 เทิร์น'],
  maxLevel: 4
};

// Skill 3 Light - Cosmic Breath
const skill3Light = {
  id: 36107,
  slot: 3,
  slotLabel: 'S3',
  isPassive: false,
  isAoe: true,
  hits: 1,
  cooldown: 5,
  cooldownText: 'คูลดาวน์ 5 เทิร์น',
  multiplier: '5.0*{ATK}',
  scalesWith: ['ATK'],
  name: 'Cosmic Breath',
  description: 'Attacks all enemies to deal damage that ignores all effects that resist death. Resets the cooldown of [Cosmic Breath] if an enemy is defeated by this attack. If the enemy\'s Defense is lower than your Attack Power, increases the damage by up to 100% in proportion to the difference.',
  descriptionTh: 'พ่นลำแสงลมหายใจคอสมิกโจมตีศัตรูทั้งหมด ทะลุเอฟเฟกต์ต้านความตายทั้งหมด (ต้านอมตะ ทนตาย ชุบ) รีเซ็ตคูลดาวน์ทันทีหากสังหารศัตรูได้ และหากค่า DEF ศัตรูต่ำกว่า ATK ของตนเอง จะเพิ่มดาเมจขึ้นสูงสุด 100%!',
  tactics: '💥 [สกิล 3 / S3] ตัวเปิดคลีฟกวาดอารีน่า (AOE Cleave) ขั้นเทพ ดาเมจทะลุอมตะ/ทนตาย หากศัตรูตายคูลดาวน์รีเซ็ตทันที สามารถกดใช้ต่อเนื่องกวาดล้างได้รัวๆ',
  iconUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/skills/skill_icon_0000_7_0.png',
  effects: [
    getCanonicalEffect('Ignores Resist Death', 100)
  ],
  skillups: ['ความเสียหาย +10%', 'ความเสียหาย +20%', 'คูลดาวน์ -1 เทิร์น'],
  maxLevel: 4
};

// Skill 3 Dark - Splash Splash
const skill3Dark = {
  id: 36108,
  slot: 3,
  slotLabel: 'S3',
  isPassive: false,
  isAoe: false,
  hits: 4,
  cooldown: 5,
  cooldownText: 'คูลดาวน์ 5 เทิร์น',
  multiplier: '3.0*{ATK} + 0.33*{MAX_HP}',
  scalesWith: ['HP', 'ATK'],
  name: 'Splash Splash',
  description: 'Attacks the enemy to stun for 1 turn and leave a Branding effect for 2 turns. Afterwards, attacks random enemies 2 to 3 times, each hit stunning them for 1 turn with a 50% chance and blocking them from removing harmful effects for 1 turn with a 50% chance. Decreases the cooldown of this skill by 1 turn whenever you attack a stunned enemy. The damage increases according to your MAX HP.',
  descriptionTh: 'กระโดดฟาดโจมตีศัตรูเป้าหมาย สตัน 1 เทิร์น และติดตราสัญลักษณ์ (Branding) นาน 2 เทิร์น หลังจากนั้น สุ่มฟาดศัตรูอีก 2-3 ครั้ง มีโอกาส 50% สตัน 1 เทิร์น และ 50% ห้ามลบดีบัฟนาน 1 เทิร์น ลดคูลดาวน์สกิลนี้ 1 เทิร์นเมื่อโจมตีศัตรูที่ติดสตัน ดาเมจตาม MAX HP',
  tactics: '💥 [สกิล 3 / S3] ท่าระดมฟาดขัดขวางศัตรูเดี่ยวและสุ่มตัวอื่น สตันและแปะ Branding พร้อมดีบัฟห้ามล้างดีบัฟ และหมุนคูลดาวน์กลับมาใช้อย่างรวดเร็วทุกครั้งที่ซ้ำตัวติดสตัน',
  iconUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/skills/skill_icon_0000_8_0.png',
  effects: [
    getCanonicalEffect('Stun', 100),
    getCanonicalEffect('Brand', 100)
  ],
  skillups: ['ความเสียหาย +10%', 'ความเสียหาย +15%', 'คูลดาวน์ -1 เทิร์น'],
  maxLevel: 4
};

skillsData['m-36112'] = {
  cid: '36112',
  name: 'Volcaris',
  bs: { hp: 12675, atk: 637, def: 670, spd: 101, critRate: 15, critDmg: 50, res: 15, acc: 25 },
  ls: {
    attribute: 'Defense',
    amount: 33,
    area: 'General',
    element: null,
    textTh: 'เพิ่ม พลังป้องกัน (DEF) ของมอนสเตอร์ฝ่ายเรา ในทุกคอนเทนต์การต่อสู้ ขึ้น 33%',
    textEn: 'Increases the Defense of ally Monsters in General by 33%.',
    iconUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/leader_skills36/leader_skill_Defense.png'
  },
  sk: [skill1, skill2A, skill3Fire]
};

skillsData['m-36111'] = {
  cid: '36111',
  name: 'Maris',
  bs: { hp: 11535, atk: 681, def: 703, spd: 101, critRate: 15, critDmg: 50, res: 15, acc: 25 },
  ls: {
    attribute: 'Resistance',
    amount: 44,
    area: 'General',
    element: null,
    textTh: 'เพิ่ม ความต้านทาน (RES) ของมอนสเตอร์ฝ่ายเรา ในทุกคอนเทนต์การต่อสู้ ขึ้น 44%',
    textEn: 'Increases the Resistance of ally Monsters in General by 44%.',
    iconUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/leader_skills36/leader_skill_Resistance.png'
  },
  sk: [skill1, skill2B, skill3Water]
};

skillsData['m-36113'] = {
  cid: '36113',
  name: 'Auraris',
  bs: { hp: 11700, atk: 659, def: 714, spd: 101, critRate: 15, critDmg: 50, res: 15, acc: 25 },
  ls: {
    attribute: 'HP',
    amount: 33,
    area: 'General',
    element: null,
    textTh: 'เพิ่ม พลังชีวิต (HP) ของมอนสเตอร์ฝ่ายเรา ในทุกคอนเทนต์การต่อสู้ ขึ้น 33%',
    textEn: 'Increases the HP of ally Monsters in General by 33%.',
    iconUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/leader_skills36/leader_skill_HP.png'
  },
  sk: [skill1, skill2A, skill3Wind]
};

skillsData['m-36114'] = {
  cid: '36114',
  name: 'Luminaris',
  bs: { hp: 9885, atk: 846, def: 593, spd: 101, critRate: 15, critDmg: 50, res: 15, acc: 25 },
  ls: {
    attribute: 'Attack Power',
    amount: 33,
    area: 'General',
    element: null,
    textTh: 'เพิ่ม พลังโจมตี (ATK) ของมอนสเตอร์ฝ่ายเรา ในทุกคอนเทนต์การต่อสู้ ขึ้น 33%',
    textEn: 'Increases the Attack Power of ally Monsters in General by 33%.',
    iconUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/leader_skills36/leader_skill_Attack_Power.png'
  },
  sk: [skill1, skill2A, skill3Light]
};

skillsData['m-36115'] = {
  cid: '36115',
  name: 'Noctaris',
  bs: { hp: 12510, atk: 648, def: 681, spd: 101, critRate: 15, critDmg: 50, res: 15, acc: 25 },
  ls: {
    attribute: 'Critical Rate',
    amount: 24,
    area: 'General',
    element: null,
    textTh: 'เพิ่ม อัตราคริติคอล (CRIT Rate) ของมอนสเตอร์ฝ่ายเรา ในทุกคอนเทนต์การต่อสู้ ขึ้น 24%',
    textEn: 'Increases the Critical Rate of ally Monsters in General by 24%.',
    iconUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/leader_skills36/leader_skill_Critical_Rate.png'
  },
  sk: [skill1, skill2B, skill3Dark]
};

fs.writeFileSync(monsterSkillsPath, JSON.stringify(skillsData, null, 2), 'utf8');
console.log(`✅ Updated monsterSkillsData.json (${Object.keys(skillsData).length} total monsters)`);

// 3. UPDATE balancePatches.json (ADD PATCH 94)
const patchesPath = path.join(root, 'src/data/balancePatches.json');
const patchesList = JSON.parse(fs.readFileSync(patchesPath, 'utf8'));

const patch94Id = 94;
const patch94Exists = patchesList.some(p => p.link && p.link.includes(`balancePatchID=${patch94Id}`));

if (!patch94Exists) {
  const patch94Meta = {
    id: 1,
    date: 'October 14, 2026',
    monstersCount: '5',
    skillCount: '15',
    daysSincePrevious: '16',
    link: `https://swgt.io/controllers/balancePatch/specific?balancePatchID=${patch94Id}`
  };
  const updatedList = [
    patch94Meta,
    ...patchesList.map(p => ({ ...p, id: p.id + 1 }))
  ];
  fs.writeFileSync(patchesPath, JSON.stringify(updatedList, null, 2), 'utf8');
  console.log(`✅ Added Patch 94 (v9.3.6) to balancePatches.json`);
} else {
  console.log('ℹ️ Patch 94 already exists in balancePatches.json');
}

// 4. UPDATE balancePatchDetails.json
const detailsPath = path.join(root, 'src/data/balancePatchDetails.json');
const patchDetails = JSON.parse(fs.readFileSync(detailsPath, 'utf8'));

const patch94Adjustments = [
  {
    id: '94-1',
    patchId: 94,
    monsterName: 'Volcaris (Fire Cosmic Worm)',
    element: 'Fire',
    monsterImg: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0225_1_2.png',
    skillName: 'Squash (S3)',
    skillBadge: 'S3',
    skillImg: '',
    changeType: 'New Monster Release',
    changeTypeTh: 'เปิดตัวมอนสเตอร์ใหม่ 5★',
    preview: '[New 5★ Monster Release]\r\nAttacks all enemies to stun for 1 turn and absorb ATB. Damage scales with MAX HP. Increases Total MAX HP by 20% (up to 100%) each cast. Can exceed 150k-200k HP in combat.',
    officialText: '[New 5★ Monster Release]\r\nAttacks all enemies to stun for 1 turn and absorb ATB. Damage scales with MAX HP. Increases Total MAX HP by 20% (up to 100%) each cast. Can exceed 150k-200k HP in combat.',
    valueChanges: [{ oldValue: 'Base HP', newValue: 'Max HP +100%' }],
    impact: 'buff'
  },
  {
    id: '94-2',
    patchId: 94,
    monsterName: 'Maris (Water Cosmic Worm)',
    element: 'Water',
    monsterImg: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0225_1_1.png',
    skillName: 'Deep Inhale (S3)',
    skillBadge: 'S3',
    skillImg: '',
    changeType: 'New Monster Release',
    changeTypeTh: 'เปิดตัวมอนสเตอร์ใหม่ 5★',
    preview: '[New 5★ Monster Release]\r\nAttacks all enemies to steal all beneficial effects and disturb HP recovery for 2 turns. Distributes 1 stolen buff to each other ally.',
    officialText: '[New 5★ Monster Release]\r\nAttacks all enemies to steal all beneficial effects and disturb HP recovery for 2 turns. Distributes 1 stolen buff to each other ally.',
    valueChanges: [],
    impact: 'buff'
  },
  {
    id: '94-3',
    patchId: 94,
    monsterName: 'Auraris (Wind Cosmic Worm)',
    element: 'Wind',
    monsterImg: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0225_1_3.png',
    skillName: 'Wormhole Dive (S3)',
    skillBadge: 'S3',
    skillImg: '',
    changeType: 'New Monster Release',
    changeTypeTh: 'เปิดตัวมอนสเตอร์ใหม่ 5★',
    preview: '[New 5★ Monster Release]\r\nAttacks all enemies to increase harmful effects duration by 1 turn, cause Glancing for 2 turns, and Silence for 1-2 turns. Scales with MAX HP.',
    officialText: '[New 5★ Monster Release]\r\nAttacks all enemies to increase harmful effects duration by 1 turn, cause Glancing for 2 turns, and Silence for 1-2 turns. Scales with MAX HP.',
    valueChanges: [],
    impact: 'buff'
  },
  {
    id: '94-4',
    patchId: 94,
    monsterName: 'Luminaris (Light Cosmic Worm)',
    element: 'Light',
    monsterImg: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0225_1_4.png',
    skillName: 'Cosmic Breath (S3)',
    skillBadge: 'S3',
    skillImg: '',
    changeType: 'New Monster Release',
    changeTypeTh: 'เปิดตัวมอนสเตอร์ใหม่ 5★',
    preview: '[New 5★ Monster Release]\r\nAttacks all enemies dealing damage that ignores death-resisting effects. Resets cooldown if an enemy is killed. Increases damage up to 100% if enemy DEF is lower than ATK.',
    officialText: '[New 5★ Monster Release]\r\nAttacks all enemies dealing damage that ignores death-resisting effects. Resets cooldown if an enemy is killed. Increases damage up to 100% if enemy DEF is lower than ATK.',
    valueChanges: [],
    impact: 'buff'
  },
  {
    id: '94-5',
    patchId: 94,
    monsterName: 'Noctaris (Dark Cosmic Worm)',
    element: 'Dark',
    monsterImg: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0225_1_5.png',
    skillName: 'Splash Splash (S3)',
    skillBadge: 'S3',
    skillImg: '',
    changeType: 'New Monster Release',
    changeTypeTh: 'เปิดตัวมอนสเตอร์ใหม่ 5★',
    preview: '[New 5★ Monster Release]\r\nAttacks enemy to stun 1 turn and brand 2 turns. Follows with 2-3 random strikes with 50% stun and 50% block cleanse. Reduces cooldown when hitting stunned targets.',
    officialText: '[New 5★ Monster Release]\r\nAttacks enemy to stun 1 turn and brand 2 turns. Follows with 2-3 random strikes with 50% stun and 50% block cleanse. Reduces cooldown when hitting stunned targets.',
    valueChanges: [],
    impact: 'buff'
  }
];

patchDetails['94'] = patch94Adjustments;
fs.writeFileSync(detailsPath, JSON.stringify(patchDetails, null, 2), 'utf8');
console.log(`✅ Updated balancePatchDetails.json with Patch 94`);

// 5. UPDATE balancePatchAi.json
const aiPath = path.join(root, 'src/data/balancePatchAi.json');
const aiData = JSON.parse(fs.readFileSync(aiPath, 'utf8'));

aiData.patches['94'] = {
  hash: 'oct14_2026_v936',
  overview: 'แพตช์ v9.3.6 (14 ตุลาคม 2026) อัปเดตใหญ่เปิดตัวมอนสเตอร์ตระกูลใหม่ระดับ 5 ดาวแท้ [Cosmic Worm (หนอนอวกาศ)] ครบทั้ง 5 ธาตุ ไฮไลท์สำคัญคือ Volcaris (หนอนไฟ) ที่มีกลไกเพิ่ม MAX HP รวมครั้งละ 20% สูงสุดถึง +100% ส่งผลให้เลือดในเกมจริงสามารถทะลุ 150k-200k HP กลายเป็นสุดยอดตัวรับดาเมจและสตันหมู่, Luminaris (หนอนแสง) ตัวคลีฟทะลุต้านตายที่รีเซ็ตคูลดาวน์เมื่อฆ่าศัตรูได้ และ Maris (หนอนน้ำ) ตัว Stripper ลบบัฟหมู่พร้อมขโมยบัฟมาแจกจ่ายให้ทีม นอกจากนี้ยังมี Mock Battle สำหรับฝึกฝนสกิลหนอนอวกาศ, ปรับปรุงระบบ Rune/Artifact QoL และประกาศตารางทัวร์นาเมนต์ Siege Battle Season 22',
  winners: [
    'Volcaris (Fire Cosmic Worm)',
    'Luminaris (Light Cosmic Worm)',
    'Maris (Water Cosmic Worm)',
    'Noctaris (Dark Cosmic Worm)',
    'ผู้เล่นสาย Arena Cleave (Luminaris ทะลุต้านตาย)'
  ],
  losers: [
    'ทีมตั้งรับที่มีบัฟหนา (โดน Maris ขโมยบัฟไปแจก)',
    'ตัวที่มีพาสซีฟทนตายหรือชุบชีวิต (โดน Luminaris ยิงทะลุตายทันที)'
  ],
  perMonster: {
    'Volcaris': 'สกิล 3 Squash โจมตีหมู่ตาม MAX HP สตันและดูดเกจ ยิ่งศัตรูน้อยยิ่งแรง และเพิ่ม MAX HP รวมครั้งละ 20% สูงสุด 100% ทำให้กลายเป็นตัวที่เลือดเยอะที่สุดในเกม',
    'Maris': 'สกิล 3 Deep Inhale ลบบัฟศัตรูทั้งหมดและขโมยบัฟมาแจกจ่ายให้พันธมิตรคนละ 1 บัฟ พร้อมติดสถานะห้ามฟื้นฟู HP 2 เทิร์น',
    'Auraris': 'สกิล 3 Wormhole Dive ยืดเวลาดีบัฟศัตรูทั้งหมด 1 เทิร์น พร้อมแปะ Glancing และ Silence 1-2 เทิร์น ยอดเยี่ยมในทีมคอนโทรล',
    'Luminaris': 'สกิล 3 Cosmic Breath ดาเมจทะลุเอฟเฟกต์ต้านความตายทั้งหมด รีเซ็ตคูลดาวน์ทันทีเมื่อฆ่าศัตรูได้ และแรงขึ้นสูงสุด 100% ตามผลต่างของ ATK กับ DEF ของศัตรู',
    'Noctaris': 'สกิล 3 Splash Splash สตันและแปะ Branding เป้าหมายเดี่ยว ตามด้วยสุ่มฟาด 2-3 ครั้งติดสตันและบล็อกการล้างดีบัฟ พร้อมลดคูลดาวน์เมื่อตีตัวติดสตัน'
  },
  monsters: 5,
  at: new Date().toISOString()
};

fs.writeFileSync(aiPath, JSON.stringify(aiData, null, 2), 'utf8');
console.log(`✅ Updated balancePatchAi.json with Patch 94`);

// 6. REBUILD SKILL SHARDS
console.log('\n📦 Rebuilding skill shards for fast client-side performance...');
buildSkillShards({ root, force: true });
console.log('✅ Skill shards rebuilt successfully!');
