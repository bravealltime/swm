import fs from 'fs';
import path from 'path';

const monstersData = JSON.parse(fs.readFileSync('./src/data/allMonsters.json', 'utf8'));

function findMonsterImg(name, element) {
  const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const el = (element || '').toLowerCase().trim();

  let found = monstersData.find(m => {
    const mName = m.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const mEl = (m.element || '').toLowerCase();
    return (mName === cleanName || mName.includes(cleanName) || cleanName.includes(mName)) && (el === 'all' || mEl === el);
  });

  if (!found) {
    const words = name.split(/[\s/()]+/);
    for (const w of words) {
      if (w.length < 3) continue;
      found = monstersData.find(m => {
        const mName = m.name.toLowerCase();
        const mFam = (m.family || '').toLowerCase();
        const mEl = (m.element || '').toLowerCase();
        return (mName.includes(w.toLowerCase()) || mFam.includes(w.toLowerCase())) && (el === 'all' || mEl === el);
      });
      if (found) break;
    }
  }

  return found ? (found.avatarUrl || found.imageUrl || '') : 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0001_0_0.png';
}

const rawAdjustments = [
  {
    monsterName: 'Wind Aya / Nobara Kugisaki',
    element: 'Wind',
    skillName: 'Strong Willpower (Passive)',
    skillBadge: 'Passive',
    changeType: 'Value changed',
    changeTypeTh: 'ปรับเปลี่ยนค่าสถานะ / เพิ่มเอฟเฟกต์',
    preview: '[Value changed]\r\nDamage dealt increased from 40% ➔ 50%.\r\n[Effect added]\r\nRemoves 1 harmful effect granted on yourself when you gain a turn.',
    officialText: '[Value changed]\r\nDamage dealt increased from 40% ➔ 50%.\r\n[Effect added]\r\nRemoves 1 harmful effect granted on yourself when you gain a turn.',
    valueChanges: [{ oldValue: '40%', newValue: '50%' }],
    impact: 'buff'
  },
  {
    monsterName: 'Devil Maiden',
    element: 'Wind',
    skillName: 'Mischievous Curse (Passive)',
    skillBadge: 'Passive',
    changeType: 'Percentage changed',
    changeTypeTh: 'ปรับเปอร์เซ็นต์โอกาสติด',
    preview: '[Percentage changed]\r\nResets the enemy from removing harmful effects for 1 turn with an 80% ➔ 100% chance when you attack an enemy granted with a harmful effect.',
    officialText: '[Percentage changed]\r\nResets the enemy from removing harmful effects for 1 turn with an 80% ➔ 100% chance when you attack an enemy granted with a harmful effect.',
    valueChanges: [{ oldValue: '80%', newValue: '100%' }],
    impact: 'buff'
  },
  {
    monsterName: 'Fami',
    element: 'Light',
    skillName: 'Nyan Cheers (Passive)',
    skillBadge: 'Passive',
    changeType: 'Value changed',
    changeTypeTh: 'ปรับตัวเลขความแรง/สัดส่วน',
    preview: '[Value changed]\r\nIncreases Attack Bar by 10% ➔ 15% when an ally is attacked.\r\nDecreases the damage ally receives by 20% ➔ 30%.',
    officialText: '[Value changed]\r\nIncreases Attack Bar by 10% ➔ 15% when an ally is attacked.\r\nDecreases the damage ally receives by 20% ➔ 30%.',
    valueChanges: [{ oldValue: '10%', newValue: '15%' }, { oldValue: '20%', newValue: '30%' }],
    impact: 'buff'
  },
  {
    monsterName: 'Twin Angels',
    element: 'All',
    skillName: 'Horn of Change',
    skillBadge: 'S2',
    changeType: 'Percentage changed',
    changeTypeTh: 'ปรับเปอร์เซ็นต์/ตัวคูณ',
    preview: '[Percentage changed]\r\nIncreases the Attack Bar of the ally target by 10% ➔ 15%.',
    officialText: '[Percentage changed]\r\nIncreases the Attack Bar of the ally target by 10% ➔ 15%.',
    valueChanges: [{ oldValue: '10%', newValue: '15%' }],
    impact: 'buff'
  },
  {
    monsterName: 'Paul Phoenix',
    element: 'All',
    skillName: 'Mountain Buster',
    skillBadge: 'S2',
    changeType: 'Damage Increased',
    changeTypeTh: 'บัฟเพิ่มความแรงดาเมจ',
    preview: '[Damage increased]\r\nDeals damage in proportion to Attack Power ➔ Deals damage that increases according to the lost HP.',
    officialText: '[Damage increased]\r\nDeals damage in proportion to Attack Power ➔ Deals damage that increases according to the lost HP.',
    valueChanges: [],
    impact: 'buff'
  },
  {
    monsterName: 'Paul Phoenix / Bone Crusher',
    element: 'Fire',
    skillName: 'Phoenix Smasher / Bone Crusher',
    skillBadge: 'S1',
    changeType: 'Percentage changed',
    changeTypeTh: 'ปรับเปอร์เซ็นต์โอกาสติด',
    preview: '[Percentage increased]\r\nDecreases the Attack Bar 1 turn with a 50% ➔ 60% chance.',
    officialText: '[Percentage increased]\r\nDecreases the Attack Bar 1 turn with a 50% ➔ 60% chance.',
    valueChanges: [{ oldValue: '50%', newValue: '60%' }],
    impact: 'buff'
  },
  {
    monsterName: 'Praha',
    element: 'Water',
    skillName: 'Daydream',
    skillBadge: 'S3',
    changeType: 'Value changed',
    changeTypeTh: 'ปรับตัวเลขความแรง/สัดส่วน',
    preview: '[Value changed]\r\nRecovers the HP of all allies by 30% ➔ 35%.',
    officialText: '[Value changed]\r\nRecovers the HP of all allies by 30% ➔ 35%.',
    valueChanges: [{ oldValue: '30%', newValue: '35%' }],
    impact: 'buff'
  },
  {
    monsterName: 'Barbara',
    element: 'Water',
    skillName: 'Spear of Riding',
    skillBadge: 'S2',
    changeType: 'Value changed',
    changeTypeTh: 'ปรับตัวเลขความแรง/สัดส่วน',
    preview: "[Value changed]\r\nThe attack will ignore the enemy's Defense by 20% ➔ 25% for each beneficial effect the enemy has.",
    officialText: "[Value changed]\r\nThe attack will ignore the enemy's Defense by 20% ➔ 25% for each beneficial effect the enemy has.",
    valueChanges: [{ oldValue: '20%', newValue: '25%' }],
    impact: 'buff'
  },
  {
    monsterName: 'Harp Magician',
    element: 'Water',
    skillName: 'Nightmare Melody',
    skillBadge: 'S1',
    changeType: 'Effect added',
    changeTypeTh: 'เพิ่มเอฟเฟกต์ใหม่',
    preview: '[Effect added]\r\nAttacks the enemy, then removing harmful effects for 1 turn if the enemy is already asleep.',
    officialText: '[Effect added]\r\nAttacks the enemy, then removing harmful effects for 1 turn if the enemy is already asleep.',
    valueChanges: [],
    impact: 'buff'
  },
  {
    monsterName: 'Harmonia',
    element: 'Fire',
    skillName: 'Distorted Healing Music',
    skillBadge: 'S2',
    changeType: 'Effect changed',
    changeTypeTh: 'เปลี่ยนเอฟเฟกต์สกิล',
    preview: '[Effect modified]\r\nAttacks all enemies to put them to sleep for 1 ➔ 2 turns.',
    officialText: '[Effect modified]\r\nAttacks all enemies to put them to sleep for 1 ➔ 2 turns.',
    valueChanges: [{ oldValue: '1 turn', newValue: '2 turns' }],
    impact: 'buff'
  },
  {
    monsterName: 'Theomars',
    element: 'Water',
    skillName: 'Triple Crush',
    skillBadge: 'S2',
    changeType: 'Cooldown Changed',
    changeTypeTh: 'ปรับคูลดาวน์สกิล',
    preview: '[Cooltime decreased]\r\nMAX cooltime: [3 turns ➔ 2 turns]. สามารถใช้สกิลเจาะเกราะได้เทิร์นเว้นเทิร์น!',
    officialText: '[Cooltime decreased]\r\nMAX cooltime: [3 turns ➔ 2 turns]',
    valueChanges: [{ oldValue: '3 turns', newValue: '2 turns' }],
    impact: 'buff'
  },
  {
    monsterName: 'Akhamamir',
    element: 'Wind',
    skillName: 'Triple Crush',
    skillBadge: 'S2',
    changeType: 'Cooldown Changed',
    changeTypeTh: 'ปรับคูลดาวน์สกิล',
    preview: '[Cooltime decreased]\r\nMAX cooltime: [3 turns ➔ 2 turns]',
    officialText: '[Cooltime decreased]\r\nMAX cooltime: [3 turns ➔ 2 turns]',
    valueChanges: [{ oldValue: '3 turns', newValue: '2 turns' }],
    impact: 'buff'
  },
  {
    monsterName: 'Elsharion',
    element: 'Light',
    skillName: 'Triple Crush',
    skillBadge: 'S2',
    changeType: 'Cooldown Changed',
    changeTypeTh: 'ปรับคูลดาวน์สกิล',
    preview: '[Cooltime decreased]\r\nMAX cooltime: [3 turns ➔ 2 turns]',
    officialText: '[Cooltime decreased]\r\nMAX cooltime: [3 turns ➔ 2 turns]',
    valueChanges: [{ oldValue: '3 turns', newValue: '2 turns' }],
    impact: 'buff'
  },
  {
    monsterName: 'Veromos',
    element: 'Dark',
    skillName: 'Super Crush',
    skillBadge: 'S2',
    changeType: 'Value changed',
    changeTypeTh: 'ปรับเปลี่ยนค่าสถานะ',
    preview: '[Value changed]\r\nDecreases the Attack Bar of targets that are not stunned by 20% ➔ 30%.',
    officialText: '[Value changed]\r\nDecreases the Attack Bar of targets that are not stunned by 20% ➔ 30%.',
    valueChanges: [{ oldValue: '20%', newValue: '30%' }],
    impact: 'buff'
  },
  {
    monsterName: 'Gargoyle',
    element: 'Wind',
    skillName: "Mountain's Roar",
    skillBadge: 'S2',
    changeType: 'Damage Increased',
    changeTypeTh: 'บัฟเพิ่มความแรงดาเมจ',
    preview: '[Damage increased]\r\nDeals damage equal to 15% ➔ 20% of your MAX HP.',
    officialText: '[Damage increased]\r\nDeals damage equal to 15% ➔ 20% of your MAX HP.',
    valueChanges: [{ oldValue: '15%', newValue: '20%' }],
    impact: 'buff'
  },
  {
    monsterName: 'Amelia',
    element: 'Water',
    skillName: 'Purifying Wave',
    skillBadge: 'S2',
    changeType: 'Effect changed',
    changeTypeTh: 'เปลี่ยนเอฟเฟกต์สกิล',
    preview: '[Effect changed]\r\n(Human Form) Recovers the HP of allies with fewer HP in proportion to MAX HP by 15%.',
    officialText: '[Effect changed]\r\nRecovers the HP of allies with fewer HP in proportion to HP by 15%.',
    valueChanges: [],
    impact: 'buff'
  },
  {
    monsterName: 'Byungchul',
    element: 'Wind',
    skillName: 'Club to Fall',
    skillBadge: 'S2',
    changeType: 'Effect changed',
    changeTypeTh: 'เปลี่ยนเอฟเฟกต์สกิล',
    preview: "[Effect changed]\r\nDecreases the Attack Bar by 50% if your MAX HP is higher than the target's ➔ Decreases the Attack Bar by 60% without conditions.",
    officialText: "[Effect changed]\r\nDecreases the Attack Bar by 50% if your MAX HP is higher than the target's ➔ Decreases the Attack Bar by 60% without conditions.",
    valueChanges: [{ oldValue: '50%', newValue: '60%' }],
    impact: 'buff'
  },
  {
    monsterName: 'Water Aya / Nobara Kugisaki',
    element: 'Water',
    skillName: 'Unique Strike (Passive)',
    skillBadge: 'Passive',
    changeType: 'Value changed',
    changeTypeTh: 'ปรับตัวเลขความแรง/สัดส่วน',
    preview: '[Value changed]\r\nCreates a Shield equivalent to 10% ➔ 15% of your MAX HP for 1 turn at the start of your turn.',
    officialText: '[Value changed]\r\nCreates a Shield equivalent to 10% ➔ 15% of your MAX HP for 1 turn at the start of your turn.',
    valueChanges: [{ oldValue: '10%', newValue: '15%' }],
    impact: 'buff'
  },
  {
    monsterName: 'Dr. Persona',
    element: 'Water',
    skillName: 'Super Solenoid',
    skillBadge: 'S2',
    changeType: 'Damage Increased',
    changeTypeTh: 'บัฟเพิ่มความแรงดาเมจ',
    preview: '[Damage increased]\r\nIncreases your Attack Bar by 20% ➔ 25% for each beneficial effect removed.',
    officialText: '[Damage increased]\r\nIncreases your Attack Bar by 20% ➔ 25% for each beneficial effect removed.',
    valueChanges: [{ oldValue: '20%', newValue: '25%' }],
    impact: 'buff'
  },
  {
    monsterName: 'Dr. Persona',
    element: 'Dark',
    skillName: 'Embarrassment of Riches (Passive)',
    skillBadge: 'Passive',
    changeType: 'Effect and value changed',
    changeTypeTh: 'ปรับกลไกและตัวเลขสกิล',
    preview: '[Effect and value changed]\r\nRecovers 5% of HP and by 20% when you gain a turn under an inability effect ➔ Recovers the HP of all allies by 15% when you gain a turn under an inability effect.',
    officialText: '[Effect and value changed]\r\nRecovers 5% of HP and by 20% when you gain a turn under an inability effect ➔ Recovers the HP of all allies by 15% when you gain a turn under an inability effect.',
    valueChanges: [],
    impact: 'buff'
  },
  {
    monsterName: 'Dr. Persona',
    element: 'Wind',
    skillName: 'Heavyweight Strike',
    skillBadge: 'S3',
    changeType: 'Effect changed',
    changeTypeTh: 'เปลี่ยนเอฟเฟกต์สกิล',
    preview: '[Effect changed]\r\nAttacks all enemies to remove 1 beneficial effect and block them from receiving beneficial effects for 2 turns. Provides a shield to allies with no beneficial effects for 1 turn.',
    officialText: '[Effect changed]\r\nAttacks all enemies to remove 1 beneficial effect and block them from receiving beneficial effects for 2 turns. Provides a shield to allies with no beneficial effects for 1 turn.',
    valueChanges: [],
    impact: 'adjustment'
  },
  {
    monsterName: 'Zandot',
    element: 'Water',
    skillName: 'World Tree Fragment',
    skillBadge: 'S2',
    changeType: 'Effect added',
    changeTypeTh: 'เพิ่มเอฟเฟกต์ใหม่',
    preview: '[Effect added]\r\nRecovers the HP of all allies by 20%.',
    officialText: '[Effect added]\r\nRecovers the HP of all allies by 20%.',
    valueChanges: [],
    impact: 'buff'
  },
  {
    monsterName: 'Arcane Weapon',
    element: 'Fire',
    skillName: 'Overcharge Drive (Passive)',
    skillBadge: 'Passive',
    changeType: 'Value changed',
    changeTypeTh: 'ปรับตัวเลขความแรง/สัดส่วน',
    preview: '[Value changed]\r\nWhile in the judgement of flame state, deals 50% ➔ 70% increased damage.',
    officialText: '[Value changed]\r\nWhile in the judgement of flame state, deals 50% ➔ 70% increased damage.',
    valueChanges: [{ oldValue: '50%', newValue: '70%' }],
    impact: 'buff'
  },
  {
    monsterName: 'Kassandra',
    element: 'Fire',
    skillName: "Cavalry's Drive",
    skillBadge: 'S2',
    changeType: 'Effect changed',
    changeTypeTh: 'เปลี่ยนเอฟเฟกต์สกิล',
    preview: '[Effect changed]\r\nRecovers your HP and that of the ally with the worst HP condition by 20% ➔ Recovers the HP of all allies by 15%.',
    officialText: '[Effect changed]\r\nRecovers your HP and that of the ally with the worst HP condition by 20% ➔ Recovers the HP of all allies by 15%.',
    valueChanges: [],
    impact: 'adjustment'
  },
  {
    monsterName: 'Beetle Guardian',
    element: 'Fire',
    skillName: 'Last Guard (Passive)',
    skillBadge: 'Passive',
    changeType: 'Effect changed',
    changeTypeTh: 'เปลี่ยนเอฟเฟกต์สกิล',
    preview: '[Effect changed]\r\nActivates when an ally receives fatal damage from an attack that ignores Defense ➔ Activates when an ally receives fatal damage from an attack that ignores Defense or if HP falls to 10% or below.',
    officialText: '[Effect changed]\r\nActivates when an ally receives fatal damage from an attack that ignores Defense ➔ Activates when an ally receives fatal damage from an attack that ignores Defense or if HP falls to 10% or below.',
    valueChanges: [],
    impact: 'buff'
  },
  {
    monsterName: 'Hanna',
    element: 'Fire',
    skillName: 'Magic Interpolation (Passive)',
    skillBadge: 'Passive',
    changeType: 'Value changed',
    changeTypeTh: 'ปรับตัวเลขความแรง/สัดส่วน',
    preview: '[Value changed]\r\nIncreases your Attack Bar by 10% ➔ 25% whenever an enemy granted with a harmful effect gains a turn.',
    officialText: '[Value changed]\r\nIncreases your Attack Bar by 10% ➔ 25% whenever an enemy granted with a harmful effect gains a turn.',
    valueChanges: [{ oldValue: '10%', newValue: '25%' }],
    impact: 'buff'
  },
  {
    monsterName: 'Hanna',
    element: 'Light',
    skillName: 'The Weight of Magic (Passive)',
    skillBadge: 'Passive',
    changeType: 'Value changed',
    changeTypeTh: 'ปรับตัวเลขความแรง/สัดส่วน',
    preview: "When attacked, offsets the damage and decreases the enemy's Attack Bar with a 25% ➔ 40% chance.",
    officialText: "When attacked, offsets the damage and decreases the enemy's Attack Bar with a 25% ➔ 40% chance.",
    valueChanges: [{ oldValue: '25%', newValue: '40%' }],
    impact: 'buff'
  },
  {
    monsterName: 'Harkor',
    element: 'Wind',
    skillName: 'Spikes Core (Passive)',
    skillBadge: 'Passive',
    changeType: 'Value changed',
    changeTypeTh: 'ปรับตัวเลขความแรง/สัดส่วน',
    preview: '[Value changed]\r\nWhen you take fatal damage from the enemy, offsets the damage and reflects 50% ➔ 80% of the damage back to the attacker.',
    officialText: '[Value changed]\r\nWhen you take fatal damage from the enemy, offsets the damage and reflects 50% ➔ 80% of the damage back to the attacker.',
    valueChanges: [{ oldValue: '50%', newValue: '80%' }],
    impact: 'buff'
  },
  {
    monsterName: 'Magic Order Guardian',
    element: 'Fire',
    skillName: 'Reaction (Passive)',
    skillBadge: 'Passive',
    changeType: 'Effect added',
    changeTypeTh: 'เพิ่มเอฟเฟกต์ใหม่',
    preview: '[Effect added]\r\nWhenever you attack an enemy, grants one of the following beneficial effects you do not have on yourself for 2 turns: Shield, Counterattack, or Immunity.',
    officialText: '[Effect added]\r\nWhenever you attack an enemy, grants one of the following beneficial effects you do not have on yourself for 2 turns: Shield, Counterattack, or Immunity.',
    valueChanges: [],
    impact: 'buff'
  },
  {
    monsterName: 'Jin Kazama',
    element: 'All',
    skillName: 'Hellfire Tremors Stance',
    skillBadge: 'S1',
    changeType: 'Damage Increased',
    changeTypeTh: 'บัฟเพิ่มความแรงดาเมจ',
    preview: '[Damage increased]\r\nDamage increased by 10% on Skill 1 and 15% on follow-up strikes.',
    officialText: '[Damage increased]\r\nDamage increased by 10% on Skill 1 and 15% on follow-up strikes.',
    valueChanges: [],
    impact: 'buff'
  },
  {
    monsterName: 'Devil Maiden',
    element: 'Light',
    skillName: 'Messenger of Doom (Passive)',
    skillBadge: 'Passive',
    changeType: 'Effect changed',
    changeTypeTh: 'เปลี่ยนเอฟเฟกต์สกิล',
    preview: '[Effect changed]\r\nFor each harmful effect granted on yourself ➔ for each harmful effect granted on all allies, increases damage dealt by 20%, and decreases damage taken by 10% (Up to 200% DMG / 50% RED).',
    officialText: '[Effect changed]\r\nFor each harmful effect granted on yourself ➔ for each harmful effect granted on all allies, increases damage dealt by 20%, and decreases damage taken by 10% (Up to 200% DMG / 50% RED).',
    valueChanges: [],
    impact: 'buff'
  },
  {
    monsterName: 'Hypnomeow',
    element: 'All',
    skillName: 'Bubble Bubble',
    skillBadge: 'S1',
    changeType: 'Effect added',
    changeTypeTh: 'เพิ่มเอฟเฟกต์ใหม่',
    preview: '[Effect added]\r\nAttacks sleeping enemies without waking them up.',
    officialText: '[Effect added]\r\nAttacks sleeping enemies without waking them up.',
    valueChanges: [],
    impact: 'buff'
  },
  {
    monsterName: 'Hypnomeow',
    element: 'Dark',
    skillName: 'Ground Reader (Passive)',
    skillBadge: 'Passive',
    changeType: 'Effect added',
    changeTypeTh: 'เพิ่มเอฟเฟกต์ใหม่',
    preview: '[Effect added]\r\nIf you defeat a sleeping enemy on your turn, the target cannot be revived during battle.',
    officialText: '[Effect added]\r\nIf you defeat a sleeping enemy on your turn, the target cannot be revived during battle.',
    valueChanges: [],
    impact: 'buff'
  },
  {
    monsterName: 'Espresso Cookie / Black Tea Bunny',
    element: 'Water',
    skillName: 'Cold Brew / Iced Tea (Passive)',
    skillBadge: 'Passive',
    changeType: 'Effect changed',
    changeTypeTh: 'เปลี่ยนเอฟเฟกต์สกิล',
    preview: '[Effect changed]\r\nDecreases the Attack Bar by 15% when attacking a frozen enemy ➔ Decreases the Attack Bar by 10% without conditions.',
    officialText: '[Effect changed]\r\nDecreases the Attack Bar by 15% when attacking a frozen enemy ➔ Decreases the Attack Bar by 10% without conditions.',
    valueChanges: [],
    impact: 'buff'
  },
  {
    monsterName: 'Espresso Cookie / Black Tea Bunny',
    element: 'Wind',
    skillName: 'Spinning Tea Spoon',
    skillBadge: 'S2',
    changeType: 'Percentage changed',
    changeTypeTh: 'ปรับเปอร์เซ็นต์โอกาสติด',
    preview: '[Percentage changed]\r\nBeneficial effect block for 1 turn with a 50% ➔ 70% chance.',
    officialText: '[Percentage changed]\r\nBeneficial effect block for 1 turn with a 50% ➔ 70% chance.',
    valueChanges: [{ oldValue: '50%', newValue: '70%' }],
    impact: 'buff'
  },
  {
    monsterName: 'Espresso Cookie / Black Tea Bunny',
    element: 'Fire',
    skillName: 'Caffeine (Passive)',
    skillBadge: 'Passive',
    changeType: 'Effect changed',
    changeTypeTh: 'เปลี่ยนเอฟเฟกต์สกิล',
    preview: '[Effect changed]\r\nWhenever you gain a turn, grants a random ATK, DEF, or SPD increase for 1 ➔ 2 turns.',
    officialText: '[Effect changed]\r\nWhenever you gain a turn, grants a random ATK, DEF, or SPD increase for 1 ➔ 2 turns.',
    valueChanges: [{ oldValue: '1 turn', newValue: '2 turns' }],
    impact: 'buff'
  },
  {
    monsterName: 'Tarosho',
    element: 'Wind',
    skillName: 'Magic Ministry (Passive)',
    skillBadge: 'Passive',
    changeType: 'Effect changed',
    changeTypeTh: 'เปลี่ยนเอฟเฟกต์สกิล',
    preview: '[Effect changed]\r\nRemoves 1 harmful effect from yourself and the ally with highest Attack Bar ➔ Removes 1 harmful effect from the 3 allies with highest Attack Bar and increases their Attack Bar by 20%.',
    officialText: '[Effect changed]\r\nRemoves 1 harmful effect from yourself and the ally with highest Attack Bar ➔ Removes 1 harmful effect from the 3 allies with highest Attack Bar and increases their Attack Bar by 20%.',
    valueChanges: [],
    impact: 'buff'
  },
  {
    monsterName: 'Daphnis',
    element: 'Water',
    skillName: 'Leader Skill',
    skillBadge: 'Leader',
    changeType: 'Leader Skill Changed',
    changeTypeTh: 'ปรับสกิลลีดเดอร์',
    preview: 'Increases the Defense of ally monsters in Guild Content by 28% ➔ Increases the Attack Speed of ally Monsters in Guild Content by 24%.',
    officialText: 'Increases the Defense of ally monsters in Guild Content by 28% ➔ Increases the Attack Speed of ally Monsters in Guild Content by 24%.',
    valueChanges: [],
    impact: 'buff'
  },
  {
    monsterName: 'Iona',
    element: 'Light',
    skillName: 'Leader Skill',
    skillBadge: 'Leader',
    changeType: 'Leader Skill Changed',
    changeTypeTh: 'ปรับสกิลลีดเดอร์',
    preview: 'Increases the Resistance of ally Monsters in Dungeons by 33% ➔ Increases the Resistance of ally Monsters in Guild Content by 33%.',
    officialText: 'Increases the Resistance of ally Monsters in Dungeons by 33% ➔ Increases the Resistance of ally Monsters in Guild Content by 33%.',
    valueChanges: [],
    impact: 'adjustment'
  },
  {
    monsterName: 'Devil Maiden',
    element: 'Dark',
    skillName: 'Awakening Effect',
    skillBadge: 'Awakening',
    changeType: 'Awakening Effect Changed',
    changeTypeTh: 'ปรับเอฟเฟกต์ปลุกพลัง',
    preview: 'Increases Critical Rate by 15% ➔ Increases Critical Damage by 25%.',
    officialText: 'Increases Critical Rate by 15% ➔ Increases Critical Damage by 25%.',
    valueChanges: [],
    impact: 'buff'
  },
  {
    monsterName: 'Ryu',
    element: 'All',
    skillName: 'Stat Changed',
    skillBadge: 'Stat Changed',
    changeType: 'Stat Changed',
    changeTypeTh: 'ปรับสเตตัสพื้นฐาน',
    preview: '(Unawakened) Attack Speed 102 ➔ 104\r\n(Awakened) Attack Speed 103 ➔ 105',
    officialText: '(Unawakened) Attack Speed 102 ➔ 104\r\n(Awakened) Attack Speed 103 ➔ 105',
    valueChanges: [{ oldValue: '103', newValue: '105' }],
    impact: 'buff'
  },
  {
    monsterName: 'Paul Phoenix',
    element: 'All',
    skillName: 'Stat Changed',
    skillBadge: 'Stat Changed',
    changeType: 'Stat Changed',
    changeTypeTh: 'ปรับสเตตัสพื้นฐาน',
    preview: '(Unawakened) Attack Speed 102 ➔ 104\r\n(Awakened) Attack Speed 103 ➔ 105',
    officialText: '(Unawakened) Attack Speed 102 ➔ 104\r\n(Awakened) Attack Speed 103 ➔ 105',
    valueChanges: [{ oldValue: '103', newValue: '105' }],
    impact: 'buff'
  },
  {
    monsterName: 'Slayer',
    element: 'All',
    skillName: 'Stat Changed',
    skillBadge: 'Stat Changed',
    changeType: 'Stat Changed',
    changeTypeTh: 'ปรับสเตตัสพื้นฐาน',
    preview: '(Unawakened) Attack Speed 102 ➔ 104\r\n(Awakened) Attack Speed 103 ➔ 105',
    officialText: '(Unawakened) Attack Speed 102 ➔ 104\r\n(Awakened) Attack Speed 103 ➔ 105',
    valueChanges: [{ oldValue: '103', newValue: '105' }],
    impact: 'buff'
  },
  {
    monsterName: 'Epikion Priest',
    element: 'Water',
    skillName: 'Stat Changed',
    skillBadge: 'Stat Changed',
    changeType: 'Stat Changed',
    changeTypeTh: 'ปรับสเตตัสพื้นฐาน',
    preview: '(Awakened) Attack Speed 95 ➔ 96',
    officialText: '(Awakened) Attack Speed 95 ➔ 96',
    valueChanges: [{ oldValue: '95', newValue: '96' }],
    impact: 'buff'
  },
  {
    monsterName: 'Zeratu',
    element: 'Dark',
    skillName: 'Stat Changed',
    skillBadge: 'Stat Changed',
    changeType: 'Stat Changed',
    changeTypeTh: 'ปรับสเตตัสพื้นฐาน',
    preview: 'HP, Attack Power, and Defense base stats adjusted at 6★ Lv.40',
    officialText: 'HP, Attack Power, and Defense base stats adjusted at 6★ Lv.40',
    valueChanges: [],
    impact: 'adjustment'
  },
  {
    monsterName: 'Dias',
    element: 'Dark',
    skillName: 'Stat Changed',
    skillBadge: 'Stat Changed',
    changeType: 'Stat Changed',
    changeTypeTh: 'ปรับสเตตัสพื้นฐาน',
    preview: 'HP, Attack Power, and Defense base stats adjusted at 6★ Lv.40',
    officialText: 'HP, Attack Power, and Defense base stats adjusted at 6★ Lv.40',
    valueChanges: [],
    impact: 'adjustment'
  },
  {
    monsterName: 'Light Aya / Nobara Kugisaki',
    element: 'Light',
    skillName: 'Exorcism Resonance',
    skillBadge: 'S3',
    changeType: 'Skill Description Changed',
    changeTypeTh: 'ปรับคำอธิบายสกิลให้ชัดเจน',
    preview: 'Adjusted skill description wording for clarity regarding targeting mechanics.',
    officialText: 'Adjusted skill description wording for clarity regarding targeting mechanics.',
    valueChanges: [],
    impact: 'adjustment'
  }
];

// Enrich with id, patchId, monsterImg, skillImg
const patch93Details = rawAdjustments.map((adj, index) => {
  return {
    id: `93-${index + 1}`,
    patchId: 93,
    monsterName: adj.monsterName,
    element: adj.element,
    monsterImg: findMonsterImg(adj.monsterName, adj.element),
    skillName: adj.skillName,
    skillBadge: adj.skillBadge,
    skillImg: '',
    changeType: adj.changeType,
    changeTypeTh: adj.changeTypeTh,
    preview: adj.preview,
    officialText: adj.officialText,
    valueChanges: adj.valueChanges,
    impact: adj.impact
  };
});

console.log(`Generated ${patch93Details.length} adjustments for patch 93`);

// 1. Update balancePatchDetails.json
const detailsPath = './src/data/balancePatchDetails.json';
const patchDetails = JSON.parse(fs.readFileSync(detailsPath, 'utf8'));
patchDetails['93'] = patch93Details;
fs.writeFileSync(detailsPath, JSON.stringify(patchDetails, null, 2), 'utf8');
console.log('Updated balancePatchDetails.json successfully');

// 2. Update balancePatches.json
const patchesPath = './src/data/balancePatches.json';
const patchesList = JSON.parse(fs.readFileSync(patchesPath, 'utf8'));
const exists = patchesList.some(p => p.link && p.link.includes('balancePatchID=93'));
if (!exists) {
  const newPatchMeta = {
    id: 1,
    date: 'September 28, 2026',
    monstersCount: String(new Set(patch93Details.map(x => x.monsterName)).size),
    skillCount: String(patch93Details.length),
    daysSincePrevious: '64',
    link: 'https://swgt.io/controllers/balancePatch/specific?balancePatchID=93'
  };
  const updatedList = [
    newPatchMeta,
    ...patchesList.map(p => ({ ...p, id: p.id + 1 }))
  ];
  fs.writeFileSync(patchesPath, JSON.stringify(updatedList, null, 2), 'utf8');
  console.log('Updated balancePatches.json successfully');
} else {
  console.log('Patch 93 already exists in balancePatches.json');
}

// 3. Update balancePatchAi.json
const aiPath = './src/data/balancePatchAi.json';
const aiData = JSON.parse(fs.readFileSync(aiPath, 'utf8'));
aiData.patches['93'] = {
  hash: 'sept28_2026',
  overview: 'แพตช์ #93 (28 กันยายน 2026) ปรับสมดุลครั้งใหญ่เน้นคืนชีพตัวสายคลาสสิกและตัว Collab โดยไฮไลท์เด่นที่สุดคือตระกูล Ifrit (Theomars, Akhamamir, Elsharion) สกิล 2 Triple Crush ลดคูลดาวน์เหลือ 2 เทิร์น ทำให้สามารถเจาะเกราะได้เทิร์นเว้นเทิร์น และ Super Crush ของ Veromos ลดเกจแรงขึ้นเป็น 30% นอกจากนี้ Daphnis (น้ำ) ได้สปีดลีด 24% ในกิลด์วอร์, Praha ฮีลแรงขึ้น 35%, Barbara เจาะเกราะตามบัฟศัตรูแรงขึ้น 25%, Harmonia ทำให้หลับหมู่ 2 เทิร์น, Ryu/Paul Phoenix/Slayer ได้รับการเพิ่ม Base Speed +2 (103➔105) และ Hypnomeow สามารถโจมตีตัวหลับได้โดยไม่ทำให้ตื่น ส่งผลกระทบอย่างสูงต่อเมต้า Siege Defense และ RTA Bruiser',
  winners: [
    'Theomars (Water)',
    'Daphnis (Water)',
    'Praha (Water)',
    'Barbara (Water)',
    'Harmonia (Fire)',
    'Amelia (Water)'
  ],
  losers: [
    'ศัตรูที่เจอ Theomars วนเจาะเกราะทุก 2 เทิร์น',
    'ทีมตั้งรับ Siege ที่ไม่มี Will ทนหลับ Harmonia 2 เทิร์น'
  ],
  perMonster: {
    'Theomars': 'สกิล 2 Triple Crush ลดคูลดาวน์จาก 3 เหลือ 2 เทิร์น ทำให้วนสกิลเจาะเกราะได้แทบทุกเทิร์น เพิ่มความอันตรายใน Siege และ Guild War มหาศาล',
    'Daphnis': 'Leader Skill เปลี่ยนเป็นเพิ่มความเร็วโจมตีใน Guild Content 24% กลายเป็นตัวสปีดลีดดาเมจเดี่ยวชั้นยอดใน Siege',
    'Praha': 'สกิล 3 Daydream เพิ่มอัตราฟื้นฟูเลือดทั้งทีมจาก 30% เป็น 35% เพิ่มความอึดให้ทีมรับ',
    'Barbara': 'สกิล 2 Spear of Riding เจาะเกราะต่อ 1 บัฟของศัตรูเพิ่มจาก 20% เป็น 25% ทำลายตัวมีบัฟหนาได้รวดเร็วขึ้น',
    'Harmonia': 'สกิล 2 Distorted Healing Music ปรับให้ศัตรูติดสถานะหลับหมู่เป็น 2 เทิร์น (เดิม 1 เทิร์น)',
    'Amelia': 'สกิล 2 ร่างมนุษย์ Purifying Wave เพิ่มการฮีลพันธมิตรที่เลือดน้อยที่สุดอีก 15%',
    'Byungchul': 'สกิล 2 Club to Fall ลดเกจศัตรู 60% โดยไม่มีเงื่อนไขเลือดอีกต่อไป',
    'Fami': 'พาสซีฟ Nyan Cheers ดึงเกจเพิ่มเป็น 15% และลดดาเมจที่เพื่อนได้รับลง 30%',
    'Ryu / Striker': 'ความเร็วโจมตีพื้นฐานหลังตื่นเพิ่มขึ้นจาก 103 เป็น 105',
    'Paul Phoenix': 'ความเร็วโจมตีพื้นฐานหลังตื่นเพิ่มขึ้นจาก 103 เป็น 105 พร้อมปรับสูตรดาเมจ Mountain Buster ตามเลือดที่หายไป',
    'Hypnomeow': 'สามารถโจมตีศัตรูที่หลับอยู่ได้โดยไม่ทำให้ตื่น และแมวมืดฆ่าตัวหลับจะไม่สามารถชุบชีวิตได้'
  },
  monsters: patch93Details.length,
  at: new Date().toISOString()
};
fs.writeFileSync(aiPath, JSON.stringify(aiData, null, 2), 'utf8');
console.log('Updated balancePatchAi.json successfully');
