const fs = require('fs');
const path = require('path');

const dungeonsMeta = [
  {
    id: 'giants-abyss-hard',
    file: 'dungeon_8011_2.html',
    nameTh: "ดันเจี้ยนยักษ์โบราณ (Giant's Keep) - Abyss Hard",
    nameEn: "Giant's Keep Abyss Hard",
    element: 'Water',
    elementTh: 'ธาตุน้ำ',
    dungeonId: '8011',
    stageId: '2',
    recordTime: '00:24',
    avgTime: '00:32',
    successRate: '99.8%',
    recommendedTeam: [
      { name: 'Teshar (L)', role: 'ดาเมจหลักกวาดม็อบ & ล้างเวฟ', rune: 'Fatal / Blade', spd: '+42', img: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters/unit_icon_0027_2_4.png' },
      { name: 'Homunculus (Wind)', role: 'ดาเมจเจาะเกราะตาม % เลือดบอส', rune: 'Rage / Blade', spd: '+40', img: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters/unit_icon_0047_2_0.png' },
      { name: 'Prilea (Water Harpu 2A)', role: 'เปิดเทิร์น ลดเกราะ Def Break 100%', rune: 'Fight x3 / Will', spd: '+75', img: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters/unit_icon_0009_0_1.png' },
      { name: 'Deborah (Dark Blacksmith)', role: 'พาสซีฟเพิ่มดาเมจเจาะเกราะ +25%', rune: 'Fight x3 / Will', spd: '+65', img: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters/unit_icon_0055_4_0.png' },
      { name: 'Lyn (Light Amazon)', role: 'ปิดฉากบอสตาม Max HP ศัตรู', rune: 'Rage / Blade', spd: '+35', img: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters/unit_icon_0006_3_4.png' }
    ],
    leaderSkill: 'Teshar (เพิ่มอัตราคริติคอล CRIT Rate +33% ในดันเจี้ยน)',
    turnOrderTh: '1. Prilea (เปิดลดเกราะ Def Break) ➔ 2. Deborah (ซัพพอร์ตเจาะเกราะ) ➔ 3. Teshar (สกิล 3 Tempest กวาดล้างม็อบรีเซ็ตคูลดาวน์) ➔ 4. Wind Homunculus (ลดเลือดบอส) ➔ 5. Lyn (สกิล 3 ตีตาม % เลือดบอสปิดฉาก)',
    bossMechanicTh: 'บอสยักษ์จะเคาน์เตอร์โจมตีสวนกลับอัตโนมัติทุกๆ 7 ครั้งที่โดนตี และมีหอคอยบัฟโจมตี + เจาะเกราะ จึงต้องใช้ทีมที่จบเวฟม็อบใน 1 เทิร์น และระเบิดดาเมจใส่บอสให้ตายก่อนโดนสวน'
  },
  {
    id: 'dragons-abyss-hard',
    file: 'dungeon_9011_2.html',
    nameTh: "ดันเจี้ยนมังกรเพลิง (Dragon's Lair) - Abyss Hard",
    nameEn: "Dragon's Lair Abyss Hard",
    element: 'Fire',
    elementTh: 'ธาตุไฟ',
    dungeonId: '9011',
    stageId: '2',
    recordTime: '00:28',
    avgTime: '00:38',
    successRate: '99.4%',
    recommendedTeam: [
      { name: 'Verdehile (L)', role: 'เร่งเกจเทิร์นทั้งทีมเมื่อคริติคอล', rune: 'Rage / Blade (Atk/CD/Atk)', spd: '+30', img: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters/unit_icon_0016_1_2.png' },
      { name: 'Liam (Water Weapon Master)', role: 'ดาเมจเดี่ยวสุดแรงปาดมังกรทีเดียวตาย', rune: 'Rage / Will', spd: '+38', img: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters/unit_icon_0059_0_1.png' },
      { name: 'Julie (Water Pierret)', role: 'สกิลกวาด 6 นัดเคลียร์เวฟ 1 & 3', rune: 'Fatal / Blade (100% HP)', spd: '+85', img: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters/unit_icon_0018_0_1.png' },
      { name: 'Shaina (Fire Boomerang)', role: 'เจาะเกราะ Def Break มินิบอสและมังกร', rune: 'Fight x2 / Will', spd: '+65', img: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters/unit_icon_0049_1_0.png' },
      { name: 'Sabrina (Water Chakram)', role: 'จับคู่แท็กทีมเพิ่มดาเมจ Shaina', rune: 'Fight x2 / Blade', spd: '+55', img: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters/unit_icon_0049_0_0.png' }
    ],
    leaderSkill: 'Verdehile (เพิ่มความเร็วโจมตี Attack Speed +28% ในดันเจี้ยน)',
    turnOrderTh: '1. Julie (กวาดเวฟม็อบเลือดเต็ม 100%) ➔ 2. Shaina (เกราะแตก) ➔ 3. Sabrina (แท็กทีมลดเกจ) ➔ 4. Liam (สกิล 3 ปาดดาเมจหนัก) ➔ 5. Verdehile (เร่งเกจเทิร์นปิดเกม)',
    bossMechanicTh: 'หอคอยขวาจะกางเกราะอมตะ (Immunity) ให้มังกร และมังกรจะโจมตีแรงขึ้นมหาศาลหากเลือดต่ำกว่า 30% กลยุทธ์ที่เร็วที่สุดคือใช้ Liam ยิงปิดฉากในเทิร์นแรกก่อนหอคอยขวาจะได้ขยับ'
  },
  {
    id: 'necropolis-abyss-hard',
    file: 'dungeon_6011_2.html',
    nameTh: "ดันเจี้ยนเนโครพลิส (Necropolis) - Abyss Hard",
    nameEn: "Necropolis Abyss Hard",
    element: 'Dark',
    elementTh: 'ธาตุมืด',
    dungeonId: '6011',
    stageId: '2',
    recordTime: '00:31',
    avgTime: '00:44',
    successRate: '99.5%',
    recommendedTeam: [
      { name: 'Astar (Fire Magic Knight L)', role: 'ตีหลายฮิตทำลายเกราะบาเรีย + กวาดเวฟ', rune: 'Vampire / Revenge', spd: '+35', img: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters/unit_icon_0029_1_2.png' },
      { name: 'Shamann (Light Griffon 2A)', role: 'ดาเมจ x2 ต่อมอนสเตอร์มืดตาม Max HP', rune: 'Rage / Blade', spd: '+38', img: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters/unit_icon_0010_3_4.png' },
      { name: 'Raoq (Fire Inugami 2A)', role: 'รุมโจมตีลดคูลดาวน์เพื่อน & รีเทิร์น', rune: 'Violent / Revenge', spd: '+48', img: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters/unit_icon_0007_1_2.png' },
      { name: 'Icaru (Water Inugami 2A)', role: 'ดึงเพื่อนร่วมโจมตี 3 ตัวทำลายเกราะ', rune: 'Guard x3 (DEF สูงสุด)', spd: '+45', img: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters/unit_icon_0007_0_1.png' },
      { name: 'Lucasha (Fire Harpu 2A)', role: 'ดีบัฟเกราะแตกและห้ามฟื้นฟูเลือด', rune: 'Fight x2 / Revenge', spd: '+55', img: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters/unit_icon_0009_0_2.png' }
    ],
    leaderSkill: 'Astar (เพิ่มพลังโจมตี ATK +33% ในดันเจี้ยน)',
    turnOrderTh: '1. Lucasha (เปิดเกราะแตก + ตีหลายฮิต) ➔ 2. Icaru (รุมตีปลดบาเรีย 7 ชั้น) ➔ 3. Raoq (รุมตีรอบสอง) ➔ 4. Shamann (ทุบมังกร/บอสธาตุมืด ดาเมจทะลุหลอด) ➔ 5. Astar (เคลียร์ซ้ำ)',
    bossMechanicTh: 'บอสเนโครจะกางโล่บาเรีย 7 ฮิตที่ไม่คิดความเสียหาย และจำกัดสปีดโจมตี จึงต้องใช้มอนสเตอร์รุมตีหลายฮิต (Team Up) เพื่อทำลายเกราะก่อน แล้วให้ Shamann ปิดฉาก'
  },
  {
    id: 'spiritual-abyss-hard',
    file: 'dungeon_9513_2.html',
    nameTh: "ดันเจี้ยนแดนวิญญาณ (Spiritual Realm) - Abyss Hard",
    nameEn: "Spiritual Realm Abyss Hard",
    element: 'Wind',
    elementTh: 'ธาตุลม',
    dungeonId: '9513',
    stageId: '2',
    recordTime: '00:42',
    avgTime: '00:54',
    successRate: '99.0%',
    recommendedTeam: [
      { name: 'Veromos (Dark Ifrit L)', role: 'ล้างดีบัฟทั้งทีมทุกเทิร์น + สตั๊นเวฟ', rune: 'Violent / Nemesis', spd: '+85', img: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters/unit_icon_0028_0_5.png' },
      { name: 'Riley (Wind Totemist)', role: 'บัฟดาบ บัฟภูมิคุ้มกัน และฟื้นฟูเลือด', rune: 'Violent / Will', spd: '+75', img: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters/unit_icon_0058_0_0.png' },
      { name: 'Nora (Fire Totemist)', role: 'เผาเลือดด้วย DoT และปลดบัฟศัตรู', rune: 'Despair / Will', spd: '+78', img: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters/unit_icon_0058_0_2.png' },
      { name: 'Loren (Light Cow Girl)', role: 'ลดเกจโจมตี + เจาะเกราะต่อเนื่อง', rune: 'Swift / Focus', spd: '+95', img: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters/unit_icon_0038_0_4.png' },
      { name: 'Belial (Water Demon)', role: 'ฟื้นคืนชีพไม่จำกัด + เจาะเกราะ 100%', rune: 'Vampire / Nemesis', spd: '+30', img: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters/unit_icon_0054_0_1.png' }
    ],
    leaderSkill: 'Veromos (เพิ่มพลังชีวิต HP +33% แก่พรรคพวกทุกคน)',
    turnOrderTh: '1. Loren (เจาะเกราะ + ลดเกจ) ➔ 2. Riley (บัฟดาบ ATK + ภูมิคุ้มกัน) ➔ 3. Veromos (ล้างสถานะผิดปกติ) ➔ 4. Nora (ลงพิษต่อเนื่อง DoT) ➔ 5. Belial (ดาเมจเจาะเกราะสังหารบอส)',
    bossMechanicTh: 'บอสจะขโมยบัฟของทีมเราไปเป็นของตัวเอง และแจกดีบัฟหนัก จึงต้องใช้ Veromos ล้างพิษตลอดเวลา และเน้นดาเมจที่เจาะเกราะทะลวงหลอด'
  },
  {
    id: 'steel-abyss-hard',
    file: 'dungeon_9511_2.html',
    nameTh: "ดันเจี้ยนป้อมปราการเหล็ก (Steel Fortress) - Abyss Hard",
    nameEn: "Steel Fortress Abyss Hard",
    element: 'Wind',
    elementTh: 'ธาตุลม',
    dungeonId: '9511',
    stageId: '2',
    recordTime: '00:29',
    avgTime: '00:39',
    successRate: '99.4%',
    recommendedTeam: [
      { name: 'Eirgar (Dark Vampire Lord L)', role: 'บัฟ ATK บัฟดูดเลือด และนำทีมบุก', rune: 'Fight x3', spd: '+65', img: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters/unit_icon_0016_2_5.png' },
      { name: 'Zinc (Dark Living Armor 2A)', role: 'สกิลห้ามบอสรับบัฟ (Block Buff) 100%', rune: 'Despair / Guard', spd: '+70', img: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters/unit_icon_0013_1_5.png' },
      { name: 'Loren (Light Cow Girl)', role: 'เจาะเกราะ Def Break + ควบคุมเกจบอส', rune: 'Swift / Focus', spd: '+98', img: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters/unit_icon_0038_0_4.png' },
      { name: 'Kro (Dark Inugami 2A)', role: 'ดาเมจระเบิดตามจำนวนดีบัฟบนตัวบอส', rune: 'Rage / Blade', spd: '+42', img: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters/unit_icon_0007_1_5.png' },
      { name: 'Pang (Light Rakshasa)', role: 'ยืดระยะเวลาดีบัฟห้ามบัฟและเกราะแตก', rune: 'Violent / Focus', spd: '+60', img: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters/unit_icon_0015_0_4.png' }
    ],
    leaderSkill: 'Eirgar (เพิ่มพลังโจมตี ATK +38% ในดันเจี้ยน)',
    turnOrderTh: '1. Loren (เจาะเกราะ Def Break) ➔ 2. Zinc (ลงดีบัฟห้ามรับบัฟ Block Beneficial Effects) ➔ 3. Eirgar (แจกบัฟดาบ ATK) ➔ 4. Pang (ยืดระยะดีบัฟ) ➔ 5. Kro (สกิล 3 Scar ระเบิดบอสตายทันที)',
    bossMechanicTh: 'บอสจะสะสมพลังเกราะและยิงสตั๊นทั้งทีมหากได้บัฟ กุญแจสำคัญคือห้ามให้บอสติดบัฟ (Block Buff) โดยเด็ดขาด จะทำให้บอสตัวเปล่าและโดน Kro ยิงดอกเดียวดับ'
  },
  {
    id: 'punishers-abyss-hard',
    file: 'dungeon_9512_2.html',
    nameTh: "ดันเจี้ยนสุสานผู้ลงทัณฑ์ (Punisher's Crypt) - Abyss Hard",
    nameEn: "Punisher's Crypt Abyss Hard",
    element: 'Light',
    elementTh: 'ธาตุแสง',
    dungeonId: '9512',
    stageId: '2',
    recordTime: '00:33',
    avgTime: '00:43',
    successRate: '99.3%',
    recommendedTeam: [
      { name: 'Verdehile (Fire Vampire L)', role: 'เพิ่มความเร็วสปีดดันเจี้ยน + ลีดเดอร์', rune: 'Rage / Blade', spd: '+35', img: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters/unit_icon_0016_1_2.png' },
      { name: 'Loren (Light Cow Girl)', role: 'ชะลอความเร็วบอส Slow + ลดเกจ', rune: 'Swift / Focus', spd: '+92', img: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters/unit_icon_0038_0_4.png' },
      { name: 'Raoq (Fire Inugami 2A)', role: 'ดึงเพื่อนรุมตีลดคูลดาวน์', rune: 'Violent / Blade', spd: '+48', img: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters/unit_icon_0007_1_2.png' },
      { name: 'Jultan (Dark Werewolf 2A)', role: 'เกราะแตก 100% เมื่อคริติคอล + เลือดหนา', rune: 'Energy x3 / Will', spd: '+55', img: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters/unit_icon_0008_1_5.png' },
      { name: 'Kro (Dark Inugami 2A)', role: 'สไนเปอร์บอสด้วยดาเมจคูณดีบัฟ', rune: 'Rage / Blade', spd: '+40', img: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters/unit_icon_0007_1_5.png' }
    ],
    leaderSkill: 'Verdehile (เพิ่มความเร็วโจมตี Attack Speed +28% ในดันเจี้ยน)',
    turnOrderTh: '1. Loren (ใส่ดีบัฟสโลว์ + เจาะเกราะ) ➔ 2. Jultan (เกราะแตกซ้ำ + บล็อกฮีล) ➔ 3. Raoq (รุมตีเร่งเทิร์น) ➔ 4. Kro (สกิล 3 ระเบิดดาเมจมหาศาล) ➔ 5. Verdehile (ดันเกจซ้ำ)',
    bossMechanicTh: 'บอสจะได้รับความเร็วและเกจโจมตีเพิ่มขึ้นตามความเร็วของทีมเรา ห้ามใช้บัฟสปีด และควรใช้ Loren ลดเกจสโลว์บอสไว้ไม่ให้ขยับ'
  }
];

function translateRuneSetName(setName) {
  if (!setName) return '';
  const s = setName.trim();
  if (s === 'Swift') return 'รูนว่องไว (Swift)';
  if (s === 'Despair') return 'รูนสิ้นหวัง (Despair)';
  if (s === 'Energy') return 'รูนพลังชีวิต (Energy)';
  if (s === 'Fatal') return 'รูนสังหาร (Fatal)';
  if (s === 'Blade') return 'รูนคมมีด (Blade)';
  if (s === 'Intangible') return 'รูนไร้รูป (Intangible)';
  if (s === 'Violent') return 'รูนคลุ้มคลั่ง (Violent)';
  if (s === 'Revenge') return 'รูนตอบโต้ (Revenge)';
  if (s === 'Shield') return 'รูนโล่ (Shield)';
  if (s === 'Will') return 'รูนเจตจำนง (Will)';
  if (s === 'Nemesis') return 'รูนพยาบาท (Nemesis)';
  if (s === 'Rage') return 'รูนพิโรธ (Rage)';
  if (s === 'Vampire') return 'รูนดูดเลือด (Vampire)';
  if (s === 'Destroy') return 'รูนทำลาย (Destroy)';
  if (s === 'Fight') return 'รูนต่อสู้ (Fight)';
  if (s === 'Determination') return 'รูนแน่วแน่ (Determination)';
  if (s === 'Enhance') return 'รูนเสริมกำลัง (Enhance)';
  if (s === 'Accuracy') return 'รูนแม่นยำ (Accuracy)';
  if (s === 'Tolerance') return 'รูนอดทน (Tolerance)';
  if (s === 'Seal') return 'รูนผนึก (Seal)';
  if (s === 'Wind') return 'อาร์ติแฟกต์ธาตุลม (Wind Artifact)';
  if (s === 'Fire') return 'อาร์ติแฟกต์ธาตุไฟ (Fire Artifact)';
  if (s === 'Water') return 'อาร์ติแฟกต์ธาตุน้ำ (Water Artifact)';
  if (s === 'Light') return 'อาร์ติแฟกต์ธาตุแสง (Light Artifact)';
  if (s === 'Dark') return 'อาร์ติแฟกต์ธาตุมืด (Dark Artifact)';
  if (s === 'Attack') return 'อาร์ติแฟกต์สายโจมตี (Attack Type)';
  if (s === 'Defense') return 'อาร์ติแฟกต์สายป้องกัน (Defense Type)';
  if (s === 'HP') return 'อาร์ติแฟกต์สายพลังชีวิต (HP Type)';
  if (s === 'Support') return 'อาร์ติแฟกต์สายสนับสนุน (Support Type)';
  return s;
}

function translateItemName(item) {
  if (!item) return '';
  const clean = item.trim();
  if (clean.includes('6-Star Rune')) return 'รูน 6 ดาว (ระดับ Hero / Legend)';
  if (clean.includes('Symbol of Giant')) return 'ชิ้นส่วนสัญลักษณ์ยักษ์ (ใช้คราฟต์รูน)';
  if (clean.includes('Symbol of Dragon')) return 'ชิ้นส่วนสัญลักษณ์มังกร (ใช้คราฟต์รูน)';
  if (clean.includes('Symbol of Death')) return 'ชิ้นส่วนสัญลักษณ์ความตาย (เนโคร)';
  if (clean.includes('Symbol of Harmony')) return 'ชิ้นส่วนสัญลักษณ์แห่งความกลมเกลียว';
  if (clean.includes('Symbol of Transcendance')) return 'ชิ้นส่วนสัญลักษณ์แห่งการก้าวข้าม';
  if (clean.includes('Symbol of Chaos')) return 'ชิ้นส่วนสัญลักษณ์แห่งความโกลาหล';
  if (clean.includes('Rune Piece')) return 'เศษชิ้นส่วนรูน';
  if (clean.includes('3-Star Rainbowmon')) return 'เรนโบว์มอน 3 ดาว เลเวล 1';
  if (clean.includes('4-Star Rainbowmon')) return 'เรนโบว์มอน 4 ดาว เลเวล 1';
  if (clean.includes('Engraved Summoning Pieces')) return 'ชิ้นส่วนคัมภีร์หินอัญเชิญโบราณ';
  if (clean.includes('Unknown Scroll')) return 'คัมภีร์เวทมนตร์นิรนาม (ม้วนขาว)';
  if (clean.includes('Mystical Scroll')) return 'คัมภีร์เวทมนตร์ลึกลับ (ม้วนฟ้า)';
  if (clean.includes('Shapeshifting Stone')) return 'หินแปลงร่างมอนสเตอร์ (Transmog Stone)';
  if (clean.includes('Mana')) return 'หินมานา (Mana Stones)';
  if (clean.includes('Energy')) return 'พลังงาน (Energy)';
  if (clean.includes('Crystals') || clean.includes('Crystal')) return 'คริสตัล (Crystals)';
  if (clean.includes('Artifact')) return 'อาร์ติแฟกต์ (Artifact)';
  return clean;
}

function parseDungeonHtml(html, meta) {
  // Extract total runs
  let totalRuns = '30,000+';
  const runsMatch = html.match(/(\d[\d,]+)\s+Runs/i);
  if (runsMatch) {
    totalRuns = runsMatch[1];
  }

  // Parse General Drop Items (Mana, Energy, Crystals)
  const generalDrops = [];
  const genRegex = /<tr>\s*<td><img[^>]*\/>([^<]+)<\/td>\s*<td class="text-right">\s*([\d\.]+%)(?:<br>[^<]*<span[^>]*>([^<]+)<\/span>)?\s*<\/td>\s*<td class="text-center">\s*([^<]+)\s*<\/td>\s*<td class="text-center">\s*([^<]+)\s*<\/td>\s*<\/tr>/g;
  let gm;
  while ((gm = genRegex.exec(html)) !== null) {
    const rawName = gm[1].trim();
    generalDrops.push({
      itemEn: rawName,
      itemTh: translateItemName(rawName),
      rate: gm[2].trim(),
      counts: (gm[3] || '').trim(),
      amountRange: gm[4].replace(/&nbsp;/g, ' ').trim(),
      avg: gm[5].trim()
    });
  }

  // Parse Item Drops (6-Star Rune, Symbols, Scrolls, Rainbowmon)
  const itemDrops = [];
  const itemRegex = /<tr>\s*<td[^>]*><img[^>]*\/>([^<]+)<\/td>\s*<td class="text-right">\s*([\d\.]+%)(?:<br>[^<]*<span[^>]*>([^<]+)<\/span>)?\s*<\/td>\s*<td class="text-center">\s*([^<]+)\s*<\/td>\s*<\/tr>/g;
  let im;
  while ((im = itemRegex.exec(html)) !== null) {
    const rawName = im[1].trim();
    itemDrops.push({
      itemEn: rawName,
      itemTh: translateItemName(rawName),
      rate: im[2].trim(),
      counts: (im[3] || '').trim(),
      amount: im[4].replace(/&nbsp;/g, ' ').trim()
    });
  }

  // Parse Rune or Artifact Sets
  const runeSets = [];
  const setIdx = html.indexOf("text: 'Rune Set'") !== -1 
    ? html.indexOf("text: 'Rune Set'") 
    : html.indexOf("text: 'Artifact Set'");

  if (setIdx !== -1) {
    const snippet = html.substring(setIdx - 1500, setIdx + 200);
    const labelMatch = snippet.match(/labels:\s*\[([\s\S]*?)\]/);
    const dataMatch = snippet.match(/data:\s*\[([\s\S]*?)\]/);
    if (labelMatch && dataMatch) {
      const labels = labelMatch[1].replace(/['"\s]/g, '').split(',').filter(Boolean);
      const dataVals = dataMatch[1].replace(/\s+/g, '').split(',').map(Number);
      const totalData = dataVals.reduce((a, b) => a + b, 0);

      for (let i = 0; i < labels.length; i++) {
        const val = dataVals[i] || 0;
        const pct = totalData > 0 ? ((val / totalData) * 100).toFixed(1) + '%' : '0%';
        runeSets.push({
          setEn: labels[i],
          setTh: translateRuneSetName(labels[i]),
          count: val.toLocaleString(),
          percent: pct
        });
      }
    }
  }

  // Parse Boss Wave Data
  let bossStats = null;
  const bossIdx = html.indexOf('badge-secondary">BOSS</span>');
  if (bossIdx !== -1) {
    const bossSnippet = html.substring(bossIdx - 400, bossIdx + 1200);
    const nameMatch = bossSnippet.match(/(?:monster-image-16"[^>]*>)?\s*([A-Za-z0-9\s'・\-]+?)\s*<img[\s\S]*?badge-secondary">BOSS/);
    const lvlMatch = bossSnippet.match(/data-title="Level">([^<]+)<\/td>/);
    const hpMatch = bossSnippet.match(/data-title="HP">([^<]+)<\/td>/);
    const atkMatch = bossSnippet.match(/data-title="ATK">([^<]+)<\/td>/);
    const defMatch = bossSnippet.match(/data-title="DEF">([^<]+)<\/td>/);
    const spdMatch = bossSnippet.match(/data-title="SPD">([^<]+)<\/td>/);
    const resMatch = bossSnippet.match(/data-title="RES">([^<]+)<\/td>/);
    const accMatch = bossSnippet.match(/data-title="ACC">([^<]+)<\/td>/);
    const crMatch = bossSnippet.match(/data-title="CR">([^<]+)<\/td>/);

    bossStats = {
      bossName: nameMatch ? nameMatch[1].trim() : 'Abyss Boss',
      level: lvlMatch ? lvlMatch[1].trim() : '75',
      hp: hpMatch ? hpMatch[1].trim() : '350,000+',
      atk: atkMatch ? atkMatch[1].trim() : '7,000+',
      def: defMatch ? defMatch[1].trim() : '1,800+',
      spd: spdMatch ? spdMatch[1].trim() : '90',
      res: resMatch ? resMatch[1].trim() : '50%',
      acc: accMatch ? accMatch[1].trim() : '25%',
      cr: crMatch ? crMatch[1].trim() : '15%'
    };
  }

  return {
    ...meta,
    totalRuns,
    bossStats,
    generalDrops,
    itemDrops: itemDrops.slice(0, 10),
    runeSets
  };
}

const parsedAllDungeons = [];

for (const m of dungeonsMeta) {
  const filePath = path.join(__dirname, `../swgt_raw/${m.file}`);
  if (fs.existsSync(filePath)) {
    const html = fs.readFileSync(filePath, 'utf8');
    const parsed = parseDungeonHtml(html, m);
    parsedAllDungeons.push(parsed);
    console.log(`Parsed ${m.nameEn}: ${parsed.totalRuns} runs, ${parsed.itemDrops.length} drops`);
  }
}

const outPath = path.join(__dirname, '../src/data/dungeonRealStats.json');
fs.writeFileSync(outPath, JSON.stringify(parsedAllDungeons, null, 2));
console.log(`Saved rich dungeon analytics data to ${outPath}`);
