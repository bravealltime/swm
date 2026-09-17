// Guardian 1-3 Rune & Stat Benchmarks for Top Meta Monsters
// Based on SWGT Guardian replays and high-level RTA/Siege tournament data

export const MONSTER_BUILDS = {
  byungchul: {
    name: 'Byungchul',
    sets: ['Violent / Will', 'Despair / Will'],
    slots246: ['SPD / HP% / HP%', 'HP% / HP% / HP%'],
    artifacts: ['Additional Damage by HP', 'S3 Crit Dmg', 'Dmg Dealt to Fire'],
    benchmarks: {
      hp: 42000,
      atk: 1100,
      def: 1350,
      spd: 245,
      cr: 75,
      cd: 140,
      res: 50,
      acc: 35
    },
    tips: 'ตัวเมต้าตั้งรับอันดับ 1 ของเกม เลือด 40k+ ควบคู่สปีด 240+ และมีคริเรตเพื่อยิงทะลวงเกราะ'
  },
  juno: {
    name: 'Juno',
    sets: ['Despair / Nemesis', 'Despair / Revenge'],
    slots246: ['SPD / CR / HP%', 'SPD / HP% / HP%'],
    artifacts: ['Additional Damage by SPD', 'Additional Damage by HP', 'S1 Recovery'],
    benchmarks: {
      hp: 36000,
      atk: 1200,
      def: 1250,
      spd: 265,
      cr: 85,
      cd: 70,
      res: 40,
      acc: 45
    },
    tips: 'ต้องการ CR 85%+ เพื่อเร่งเกจจากสกิล 1 และสปีดสูงปรี๊ดเพื่อชิงแก้ดีบัฟฟ์'
  },
  savannah: {
    name: 'Savannah',
    sets: ['Violent / Will', 'Swift / Blade'],
    slots246: ['SPD / CD / ATK%', 'SPD / ATK% / ATK%'],
    artifacts: ['S3 Accuracy', 'Additional Damage by SPD', 'Dmg Dealt to Water'],
    benchmarks: {
      hp: 24000,
      atk: 2200,
      def: 1100,
      spd: 275,
      cr: 85,
      cd: 155,
      res: 15,
      acc: 65
    },
    tips: 'สปีดยิ่งเยอะยิ่งดาเมจแรง สกิล 3 ลดเกจต้องการ Acc 60%+ และต้องเร่งสปีดให้ไวที่สุด'
  },
  dominic: {
    name: 'Dominic',
    sets: ['Violent / Will', 'Violent / Revenge'],
    slots246: ['SPD / ATK% / HP%', 'SPD / HP% / ATK%'],
    artifacts: ['Additional Damage by ATK', 'Additional Damage by HP', 'S1 Lifesteal'],
    benchmarks: {
      hp: 35000,
      atk: 2100,
      def: 1150,
      spd: 250,
      cr: 50,
      cd: 70,
      res: 35,
      acc: 25
    },
    tips: 'เน้น ATK ดิบและ HP สูง ไม่เน้นคริติคอล ดาเมจพาสซีฟคิดจากพลังโจมตีแท้'
  },
  eshir: {
    name: 'Eshir',
    sets: ['Swift / Will', 'Swift / Broken'],
    slots246: ['SPD / HP% / HP%'],
    artifacts: ['Additional Damage by HP', 'S3 Crit Dmg', 'Damage Taken from Wind -%'],
    benchmarks: {
      hp: 44000,
      atk: 1000,
      def: 1200,
      spd: 315,
      cr: 75,
      cd: 130,
      res: 30,
      acc: 25
    },
    tips: 'ตัวเปิดสปีดอันดับ 1 ใน 4 ดาว สปีดต้อง 310+ ถึงจะเปิดเกจตัดเทิร์นใน G3 ได้'
  },
  teshar: {
    name: 'Teshar',
    sets: ['Fatal / Blade', 'Rage / Blade'],
    slots246: ['ATK% / CD / ATK%'],
    artifacts: ['S3 Crit Dmg', 'Additional Damage by ATK', 'Dmg Dealt to Water'],
    benchmarks: {
      hp: 18000,
      atk: 3200,
      def: 950,
      spd: 165,
      cr: 100,
      cd: 220,
      res: 15,
      acc: 0
    },
    tips: 'ราชาฟาร์ม GB Abyss Hard ต้อง CR 100% เป๊ะ และจูนสปีดให้ออกหลังจากตัวบัฟฟ์ดาเมจ/เจาะเกราะ'
  },
  miles: {
    name: 'Miles',
    sets: ['Swift / Will', 'Violent / Will'],
    slots246: ['SPD / HP% / HP%'],
    artifacts: ['Additional Damage by SPD', 'Additional Damage by HP', 'S2 Stun Rate'],
    benchmarks: {
      hp: 38000,
      atk: 1100,
      def: 1250,
      spd: 290,
      cr: 40,
      cd: 70,
      res: 45,
      acc: 40
    },
    tips: 'พาสซีฟเพิ่มสปีดยิ่งมีบัฟฟ์ยิ่งเร็ว ดาเมจพาสซีฟคิดตามสปีด เน้นเร็วถึก'
  },
  tiana: {
    name: 'Tiana',
    sets: ['Swift / Will', 'Shield / Will / Will'],
    slots246: ['SPD / HP% / HP%'],
    artifacts: ['Damage Taken from Fire -%', 'Damage Taken from Wind -%', 'S3 Recovery'],
    benchmarks: {
      hp: 35000,
      atk: 1200,
      def: 1300,
      spd: 305,
      cr: 30,
      cd: 60,
      res: 60,
      acc: 25
    },
    tips: 'ล้างบัฟฟ์ 100% ไม่สนความต้านทาน ต้องทำสปีดให้ชิงเทิร์นแรกหรือจูนติดท้ายตัวเปิด'
  },
  chandra: {
    name: 'Chandra',
    sets: ['Violent / Will', 'Despair / Will'],
    slots246: ['SPD / HP% / HP%'],
    artifacts: ['Additional Damage by HP', 'S1 Stun Rate', 'S2 Hug Shield'],
    benchmarks: {
      hp: 48000,
      atk: 1100,
      def: 1300,
      spd: 250,
      cr: 60,
      cd: 75,
      res: 50,
      acc: 35
    },
    tips: 'พี่เลี้ยงปกป้องตัวดาเมจ เลือดต้องเฉียด 50k เพื่อให้กอดได้หนาและสวนคืนแรง'
  },
  nana: {
    name: 'Nana',
    sets: ['Despair / Will', 'Violent / Will'],
    slots246: ['SPD / HP% / HP%'],
    artifacts: ['S1 Stun Rate', 'S2 Defense Break Rate', 'Damage Taken from Wind -%'],
    benchmarks: {
      hp: 40000,
      atk: 1000,
      def: 1400,
      spd: 240,
      cr: 30,
      cd: 65,
      res: 80,
      acc: 45
    },
    tips: 'เสาชุบชีวิตตัวโกง เน้นถึกมาก ต้านทาน 80%+ ไม่ให้โดนล็อคคูลดาวน์'
  },
  galleon: {
    name: 'Galleon',
    sets: ['Shield / Shield / Will', 'Violent / Will'],
    slots246: ['SPD / HP% / ACC%', 'SPD / ATK% / HP%'],
    artifacts: ['S3 Accuracy', 'S1 Def Break Rate', 'Additional Damage by SPD'],
    benchmarks: {
      hp: 28000,
      atk: 1600,
      def: 1100,
      spd: 260,
      cr: 50,
      cd: 85,
      res: 30,
      acc: 85
    },
    tips: 'หัวใจทีมสปีดเคียร์ คัมภีร์ Time to Loot ต้องมีแม่นยำ (Acc) 85% และเร็วกว่าตัวเคลียร์ 10+ สปีด'
  },
  liam: {
    name: 'Liam',
    sets: ['Rage / Blade', 'Fatal / Blade'],
    slots246: ['ATK% / CD / ATK%'],
    artifacts: ['S3 Crit Dmg', 'Additional Damage by ATK', 'Dmg Dealt to Fire'],
    benchmarks: {
      hp: 19000,
      atk: 3100,
      def: 950,
      spd: 168,
      cr: 100,
      cd: 235,
      res: 15,
      acc: 0
    },
    tips: 'ตัวจบมังกร DB Abyss Hard สกิล 3 ยิงตามเลือดเป้าหมาย คริเรตต้อง 100%'
  },
  mo_long: {
    name: 'Mo Long',
    sets: ['Violent / Will', 'Despair / Will'],
    slots246: ['SPD / HP% / HP%'],
    artifacts: ['S3 Reckless Assault Dmg', 'Damage Taken from Wind -%', 'S2 Stun Rate'],
    benchmarks: {
      hp: 48000,
      atk: 1100,
      def: 1400,
      spd: 245,
      cr: 40,
      cd: 65,
      res: 40,
      acc: 45
    },
    tips: 'สกิล 3 กัด 70% เลือดเป้าหมาย เลือดต้องสูงที่สุดเท่าที่จะทำได้ 48,000+'
  },
  bolverk: {
    name: 'Bolverk',
    sets: ['Shield / Will / Will', 'Violent / Will'],
    slots246: ['SPD / HP% / HP%'],
    artifacts: ['Damage Taken from Wind -%', 'Damage Taken from Fire -%', 'Recovery S3'],
    benchmarks: {
      hp: 46000,
      atk: 1000,
      def: 1450,
      spd: 240,
      cr: 25,
      cd: 60,
      res: 85,
      acc: 20
    },
    tips: 'ยิ่งมีบัฟฟ์ในแมตช์เยอะยิ่งดูดเลือดบ่อย เน้นถึก ต้านทานสูง 85%+'
  },
  feng_yan: {
    name: 'Feng Yan',
    sets: ['Violent / Will', 'Violent / Destroy'],
    slots246: ['DEF% / DEF% / DEF%', 'SPD / DEF% / DEF%'],
    artifacts: ['Additional Damage by DEF', 'Damage Taken from Fire -%', 'S1 Lifesteal'],
    benchmarks: {
      hp: 30000,
      atk: 1000,
      def: 2600,
      spd: 215,
      cr: 30,
      cd: 65,
      res: 60,
      acc: 25
    },
    tips: 'ราชาแพนด้าลม ดาเมจคิดตาม DEF ต้องทำ DEF ให้เกิน 2,500+ พร้อม Vio/Destroy'
  },
  leah: {
    name: 'Leah',
    sets: ['Swift / Blade', 'Fatal / Blade'],
    slots246: ['SPD / CD / ATK%'],
    artifacts: ['Additional Damage by SPD', 'S2 Crit Dmg', 'Dmg Dealt by Light'],
    benchmarks: {
      hp: 20000,
      atk: 2400,
      def: 1000,
      spd: 305,
      cr: 90,
      cd: 180,
      res: 15,
      acc: 15
    },
    tips: 'ดาเมจสกิล 2 แรงมหาศาลตามความเร็วที่มากกว่าศัตรู สปีดรวมต้อง 300+ ใน G3'
  },
  seara: {
    name: 'Seara',
    sets: ['Violent / Will', 'Violent / Focus'],
    slots246: ['SPD / ATK% / HP%', 'SPD / ATK% / ATK%'],
    artifacts: ['S2 Bomb Dmg', 'S2 Accuracy', 'Additional Damage by ATK'],
    benchmarks: {
      hp: 34000,
      atk: 2500,
      def: 1200,
      spd: 260,
      cr: 60,
      cd: 70,
      res: 35,
      acc: 75
    },
    tips: 'วางระเบิดไม่สนธาตุ ต้องการความแม่นยำ (Acc) 70%+ และ ATK สูงเพื่อให้ระเบิดตูมเดียวตาย'
  },
  leo: {
    name: 'Leo',
    sets: ['Vampire / Nemesis', 'Violent / Blade'],
    slots246: ['ATK% / CD / HP%', 'HP% / CD / ATK%'],
    artifacts: ['S2 Crit Dmg', 'S2 Ignore Def Dmg', 'Damage Taken from Water -%'],
    benchmarks: {
      hp: 35000,
      atk: 2200,
      def: 1200,
      spd: 100,
      cr: 85,
      cd: 160,
      res: 30,
      acc: 30
    },
    tips: 'ห้ามเพิ่มสปีด! พาสซีฟจะล็อคทุกคนตามสปีดของ Leo ยิ่งเลือดเหลือน้อย สกิล 2 ยิ่งแทงทะลุเกราะ 70k+'
  }
};

export function getMonsterBuild(name) {
  if (!name) return null;
  const clean = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const [key, build] of Object.entries(MONSTER_BUILDS)) {
    if (key === clean || build.name.toLowerCase().replace(/[^a-z0-9]/g, '') === clean) {
      return build;
    }
  }
  // Generic fallback if not explicitly in benchmark catalog
  return {
    name: name,
    sets: ['Violent / Will', 'Swift / Will'],
    slots246: ['SPD / HP% / HP%', 'SPD / CD / ATK%'],
    artifacts: ['Additional Damage by SPD', 'Additional Damage by HP', 'S3 Crit Dmg'],
    benchmarks: {
      hp: 35000,
      atk: 1800,
      def: 1300,
      spd: 245,
      cr: 75,
      cd: 140,
      res: 40,
      acc: 40
    },
    tips: 'ค่าสถิติมาตรฐานระดับการ์เดียน (G1-G3 Target) เน้นสมดุลความเร็ว เลือด และความแม่นยำตามบทบาท'
  };
}
