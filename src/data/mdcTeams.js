export const MDC_TEAMS = [
  {
    id: 'def-1',
    towerType: 'nat4',
    title: 'Carcano + Clara + Vigor',
    difficulty: 'ยากมาก (Meta G1-G3)',
    defenseMonsters: ['carcano', 'clara', 'vigor'],
    winRateDefense: '64.8%',
    totalBattles: 14200,
    tags: ['4-Star Tower', 'Speed Lead', 'Strip Stun', 'One Shot'],
    strategyTh: 'คลาร่าสปีดสูงล้างบัฟและสตัน คาร์คาโนจะเจาะเป้าหมายที่เกราะแตกให้ตายทันที วิกอร์คอยบัฟสปีดและซ้ำดาเมจ',
    counters: [
      {
        id: 'c-1-1',
        name: 'Galleon + Tiana + Leah',
        monsters: ['tiana', 'galleon', 'leah'],
        winRate: '94.2%',
        rating: 4.9,
        votes: 382,
        strategy: 'เทียน่าล้างสนามทั้งหมด กัลเลียนบัฟดาเมจลดเกราะ ลีอาห์สปีดสูงปาดดอกเดียวตายยกทีม',
        runeAdvice: 'เทียน่า Swift +210 SPD ขึ้นไป, ลีอาห์เน้น SPD + CRIT Dmg'
      },
      {
        id: 'c-1-2',
        name: 'Khmun + Jultan + Aegir',
        monsters: ['khmun', 'jultan', 'aegir'],
        winRate: '88.5%',
        rating: 4.6,
        votes: 219,
        strategy: 'ทีมสวนกลับทนทาน จูลแทนแทงก์คาร์คาโนให้สะท้อนตาย เอจิร์ขโมยบัฟวิกอร์และเก็บงาน',
        runeAdvice: 'จูลแทน HP 45,000+ รูน Triple Revenge หรือ Violent'
      },
      {
        id: 'c-1-3',
        name: 'Shaina + Martina + Triana',
        monsters: ['shaina', 'martina', 'khmun'],
        winRate: '85.1%',
        rating: 4.4,
        votes: 145,
        strategy: 'มาร์ติน่าขโมยเกราะวิกอร์และคมุน สตันควบคุมคาร์คาโนไม่ให้ยิง',
        runeAdvice: 'มาร์ติน่า Will + Violent สปีดจูนให้เร็วกว่าเชน่า'
      }
    ]
  },
  {
    id: 'def-2',
    towerType: 'nat5',
    title: 'Savannah + Miles + Carcano',
    difficulty: 'ยอดนิยม (Meta Siege)',
    defenseMonsters: ['carcano', 'savannah', 'miles'],
    winRateDefense: '68.2%',
    totalBattles: 21500,
    tags: ['Nat 5 Tower', 'High Speed', 'Pushback', 'Defense Break'],
    strategyTh: 'ซาวันนาห์สปีดสูงฉีดเกราะแตกหมู่พร้อมลดเกจ ไมล์สและคาร์คาโนไล่เก็บตัวเกราะแตกในเทิร์นแรก',
    counters: [
      {
        id: 'c-2-1',
        name: 'Chandra + Perna + Elsharion',
        monsters: ['chandra', 'perna', 'elsharion'],
        winRate: '92.6%',
        rating: 4.8,
        votes: 412,
        strategy: 'จันทรา Hug คุ้มกันเพอร์น่า เอลชาริออนขโมยสปีดบัฟจากไมล์ส เพอร์น่าฟื้นคืนชีพยิงซาวันนาห์ทิ้ง',
        runeAdvice: 'จันทรา Violent/Revenge HP หนาๆ 48k+ เพอร์น่า Will'
      },
      {
        id: 'c-2-2',
        name: 'Dominic + Nana + Vigor',
        monsters: ['dominic', 'nana', 'vigor'],
        winRate: '87.9%',
        rating: 4.5,
        votes: 198,
        strategy: 'นานาให้ประกันชีวิตด้วยการชุบ โดมินิกเจาะไมล์สและคาร์คาโนอย่างรวดเร็ว',
        runeAdvice: 'โดมินิก Violent/Revenge ATK+HP'
      }
    ]
  },
  {
    id: 'def-3',
    towerType: 'nat5',
    title: 'Dominic + Nana + Savannah',
    difficulty: 'ระดับการแข่งขัน (Tournament Meta)',
    defenseMonsters: ['dominic', 'nana', 'savannah'],
    winRateDefense: '61.4%',
    totalBattles: 18900,
    tags: ['Revive Support', 'Bruiser', 'Heavy Damage'],
    strategyTh: 'มีชุบจากนานา ดาเมจทะลุเกราะจากโดมินิก และซาวันนาห์ควบคุมเกจ ทำให้ล้มทีมได้ยากหากขาดแผนชัดเจน',
    counters: [
      {
        id: 'c-3-1',
        name: 'Chandra + Perna + Vigor',
        monsters: ['chandra', 'perna', 'vigor'],
        winRate: '90.1%',
        rating: 4.7,
        votes: 304,
        strategy: 'เพอร์น่าเป็นเหยื่อล่อให้โดมินิก จันทรากด Hug รับแทน จากนั้นเพอร์น่าเบิร์สต์ซาวันนาห์ในนัดเดียว',
        runeAdvice: 'จันทรา + เพอร์น่า ต้องมี Will ทุกตัว'
      },
      {
        id: 'c-3-2',
        name: 'Galleon + Tiana + Leah',
        monsters: ['tiana', 'galleon', 'leah'],
        winRate: '84.3%',
        rating: 4.3,
        votes: 167,
        strategy: 'เปิดเทิร์นด้วยลีอาห์ล้างทีม แม้นานาจะชุบแต่ทีมฝั่งตรงข้ามจะเหลือเลือดน้อยจนเก็บงานง่าย',
        runeAdvice: 'ต้องมั่นใจว่าลีอาห์เร็วกว่าซาวันนาห์อย่างน้อย 40 SPD'
      }
    ]
  },
  {
    id: 'def-4',
    towerType: 'nat4',
    title: 'Eshir + Jultan + Aegir',
    difficulty: 'ทีมปั่นหัว (4-Star Tower)',
    defenseMonsters: ['eshir', 'jultan', 'aegir'],
    winRateDefense: '57.9%',
    totalBattles: 9800,
    tags: ['Tanky', 'Bruiser', 'Reflect Dmg'],
    strategyTh: 'เอเชียร์เปิดบัฟสปีด เอจิร์ขโมยบัฟ และจูลแทนสะท้อนดาเมจคริติคอลอย่างรุนแรง',
    counters: [
      {
        id: 'c-4-1',
        name: 'Kaki + Khmun + Triana',
        monsters: ['kaki', 'khmun', 'vigor'],
        winRate: '93.5%',
        rating: 4.9,
        votes: 278,
        strategy: 'คากิไม่ติดคริติคอล ทำให้ไม่โดนจูลแทนสะท้อนดาเมจสวน คากิฟันเกราะแตกตายพร้อมกัน',
        runeAdvice: 'คากิ ATK% ล้วน ห้ามมี CRIT Rate'
      }
    ]
  }
];
