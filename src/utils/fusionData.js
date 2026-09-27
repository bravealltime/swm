// Official Summoners War Fusion Recipes & Devilmon Priority Matrix

export const FUSION_RECIPES = [
  {
    id: 'veromos',
    name: 'Veromos',
    thaiName: 'เวโรโมส (อิฟริตมืด)',
    element: 'dark',
    stars: 5,
    role: 'ตัวแก้สถานะผิดปกติ ล้างดีบัฟทุกเทิร์น เสาหลัก PVE และหอคอย ToA',
    avatarUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0014_4_3.png',
    materials: [
      { name: 'Akia', thaiName: 'อาเกีย (ซัคคิวบัสไฟ)', element: 'fire', stars: 4, source: 'ผสมจาก: นังริม + รีเบกก้า + แครกดอน + ซีก' },
      { name: 'Mikene', thaiName: 'มิเคเน่ (อันดีนน้ำ)', element: 'water', stars: 4, source: 'ผสมจาก: กาลูด้าไฟ + แบร์แมนน้ำ + แฟรี่ลม + ธาตุลม' },
      { name: 'Argen', thaiName: 'อาร์เกน (แวมไพร์ลม)', element: 'wind', stars: 4, source: 'ผสมจาก: มินอเทารัสลม + จอมเวทไฟ + ลิซาร์ดแมนน้ำ + กิลด์' },
      { name: 'Kumae', thaiName: 'คูมาเอะ (เยติมืด)', element: 'dark', stars: 4, source: 'ดันเจี้ยนลับมืด (SD วันจันทร์)' },
    ],
  },
  {
    id: 'riley',
    name: 'Riley',
    thaiName: 'ไรลีย์ (โทเทมิสต์ลม)',
    element: 'wind',
    stars: 5,
    role: 'สุดยอดซัพพอร์ตสายฮีล/ภูมิคุ้มกัน เมต้ากิลด์วอร์ Siege และ RTA ลากเกมระดับ SSS',
    avatarUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0078_1_2.png',
    materials: [
      { name: 'Chilling', thaiName: 'ชิลลิ่ง (แจ็คโอแลนเทิร์นน้ำ)', element: 'water', stars: 4, source: 'ผสมหรือเปิดได้จากคัมภีร์เวทมนตร์' },
      { name: 'Smokey', thaiName: 'สโมกกี้ (แจ็คโอแลนเทิร์นไฟ)', element: 'fire', stars: 4, source: 'ผสมหรือเปิดได้จากคัมภีร์เวทมนตร์' },
      { name: 'Ling Ling', thaiName: 'ลิงลิง (กังฟูเกิร์ลลม)', element: 'wind', stars: 4, source: 'ผสมจากวัตถุดิบ 3★ ธาตุลม' },
      { name: 'Ursha', thaiName: 'เออร์ชา (วอร์แบร์ไฟ)', element: 'fire', stars: 3, source: 'ร้านค้าเวทมนตร์ / ดันเจี้ยนลับไฟ' },
    ],
  },
  {
    id: 'jeanne',
    name: 'Jeanne',
    thaiName: 'ฌาน (พาลาดินแสง)',
    element: 'light',
    stars: 5,
    role: 'ราชินียั่วยุ 2 เทิร์น รักษาสมดุล ป้องกันทีมในกิลด์วอร์ ลุยหอคอย ToAH และ Siege',
    avatarUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0047_1_4.png',
    materials: [
      { name: 'Harmonia', thaiName: 'ฮาร์โมเนีย (ฮาร์ปเมจิกเชี่ยนไฟ)', element: 'fire', stars: 4, source: 'ผสมจากวัตถุดิบ 3★ ธาตุไฟ' },
      { name: 'Aqueila', thaiName: 'อควิลา (คาวเกิร์ลน้ำ)', element: 'water', stars: 4, source: 'ซื้อชิ้นส่วนจากร้านค้ากิลด์' },
      { name: 'Ling Ling', thaiName: 'ลิงลิง (กังฟูเกิร์ลลม)', element: 'wind', stars: 4, source: 'ผสมจากวัตถุดิบ 3★ ธาตุลม' },
      { name: 'Dagora', thaiName: 'ดาโกรา (วอร์แบร์น้ำ)', element: 'water', stars: 3, source: 'ดรอปจากฉากเทเลน / ดันลับน้ำ' },
    ],
  },
  {
    id: 'baleygr',
    name: 'Baleygr',
    thaiName: 'เบลย์เกอร์ (จักรพรรดิสายฟ้าไฟ)',
    element: 'fire',
    stars: 5,
    role: 'หัวใจหลักทีม BJR5 (ยิงเรด 5 ตายใน 27 วินาที) ดาเมจทะลุเกราะแรงที่สุดในเกม PVE',
    avatarUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0055_1_0.png',
    materials: [
      { name: 'Aegir', thaiName: 'เอกิร์ (บาร์บาเรี่ยนคิงน้ำ)', element: 'water', stars: 4, source: 'ผสมหรือเปิดจากคัมภีร์' },
      { name: 'Fran', thaiName: 'แฟรน (แฟรี่ควีนแสง)', element: 'light', stars: 3, source: 'ซื้อจากร้านเหรียญโบราณ (Ancient Coins)' },
      { name: 'Loren', thaiName: 'ลอเรน (คาวเกิร์ลแสง)', element: 'light', stars: 3, source: 'ดันเจี้ยนลับแสง (SD วันอาทิตย์)' },
      { name: 'Dagora', thaiName: 'ดาโกรา (วอร์แบร์น้ำ)', element: 'water', stars: 3, source: 'ดรอปจากฉากเทเลน' },
    ],
  },
  {
    id: 'sigmarus',
    name: 'Sigmarus',
    thaiName: 'ซิกมารัส (ฟีนิกซ์น้ำ)',
    element: 'water',
    stars: 5,
    role: 'ตัวดาเมจ AoE ลดพลังโจมตีศัตรู แช่แข็ง ดาเมจตาม MAX HP ของบอสยักษ์/มังกร',
    avatarUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0007_1_1.png',
    materials: [
      { name: 'Susano', thaiName: 'ซูซาโนะ (นินจาน้ำ)', element: 'water', stars: 4, source: 'ผสมจากวัตถุดิบ 3★ ธาตุน้ำ' },
      { name: 'Mina', thaiName: 'มิน่า (มาร์เชียลแคทน้ำ)', element: 'water', stars: 3, source: 'ร้านค้ากิลด์ / ดันเจี้ยนลับน้ำ' },
      { name: 'Jojo', thaiName: 'โจโจ้ (โจ๊กเกอร์ไฟ)', element: 'fire', stars: 4, source: 'ผสมจากวัตถุดิบ 3★ ธาตุไฟ' },
      { name: 'Arang', thaiName: 'อารัง (จิ้งจอกเก้าหางลม)', element: 'wind', stars: 4, source: 'ผสมจากวัตถุดิบ 3★ ธาตุลม' },
    ],
  },
  {
    id: 'xiongfei',
    name: 'Xiong Fei',
    thaiName: 'เซียงเฟย (แพนด้าไฟ)',
    element: 'fire',
    stars: 5,
    role: 'สายแท็งก์/ฮีล/ดีบัฟครบเครื่อง ยอดเยี่ยมในดันเจี้ยนเนโคร (NB10) และรอยแยกมิติ',
    avatarUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0039_1_0.png',
    materials: [
      { name: 'Xiao Lin', thaiName: 'เสี่ยวหลิน (กังฟูเกิร์ลน้ำ)', element: 'water', stars: 4, source: 'ผสมจากวัตถุดิบ 3★' },
      { name: 'Lucasha', thaiName: 'ลูคาชา (ฮาร์ปี้ไฟ)', element: 'fire', stars: 3, source: 'ดรอปจากฉาก / ดันลับไฟ' },
      { name: 'Wind Horus', thaiName: 'โฮรุสลม', element: 'wind', stars: 4, source: 'ผสมจากวัตถุดิบ 3★' },
      { name: 'Iron', thaiName: 'ไอรอน (ลิฟวิ่งอาร์เมอร์ไฟ)', element: 'fire', stars: 3, source: 'ดรอปจากฉากเฟอร์เรกิ' },
    ],
  },
  {
    id: 'katarina',
    name: 'Katarina',
    thaiName: 'คาทาริน่า (วาลคิรีลม)',
    element: 'wind',
    stars: 5,
    role: 'ดาเมจทะลุเกราะ 3 นัดรวดเมื่อมีบัฟอมตะ ใช้คู่กับ Jamire / Chloe / Woosa ตีบ้านไว',
    avatarUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0009_1_2.png',
    materials: [
      { name: 'Baretta', thaiName: 'บาเร็ตต้า (ซิลฟ์ไฟ)', element: 'fire', stars: 4, source: 'ผสมจากวัตถุดิบ 3★' },
      { name: 'Arang', thaiName: 'อารัง (จิ้งจอกเก้าหางลม)', element: 'wind', stars: 4, source: 'ผสมจากวัตถุดิบ 3★' },
      { name: 'Shakan', thaiName: 'ชาคัน (แวร์วูล์ฟลม)', element: 'wind', stars: 3, source: 'ดรอปจากฉากวิเทียร์' },
      { name: 'Chloe', thaiName: 'โคลอี้ (เอพิกิออนพรีสต์ไฟ)', element: 'fire', stars: 4, source: 'เปิดจากคัมภีร์เวทมนตร์' },
    ],
  },
];

// High-impact Nat 5s where Devilmons yield the highest value (CDR reduction & core skill rate)
export const DEVILMON_META_TIERS = {
  S: new Set([
    'oliver', 'cheongpung', 'miles', 'savannah', 'tiana', 'woosa', 'nana', 'moore',
    'shizuka', 'dominic', 'byungchul', 'federica', 'haegang', 'karnal', 'chandra',
    'ragdoll', 'gianna', 'giana', 'veronica', 'maximilian', 'nephtys', 'lucifer', 'tian lang',
    'narsha', 'asima', 'craig', 'valantis', 'oberon', 'kiki', 'craig / m. bison'
  ]),
  A: new Set([
    'vanessa', 'psamathe', 'perna', 'seara', 'verad', 'anavel', 'bastet', 'leo',
    'charlotte', 'rica', 'okeanos', 'sekhmet', 'chiwu', 'praha', 'juno', 'camilla',
    'chow', 'laika', 'tesarion', 'theomars', 'elsharion', 'bellerophon', 'amber'
  ]),
};

/**
 * Scan player's box and evaluate fusion status
 * @param {Object} box - parsed SWEX box
 */
export function analyzeFusionProgress(box) {
  const units = box?.units || [];
  const ownedNames = new Set(units.map((u) => (u.info?.name || u.name || '').toLowerCase().trim()));

  return FUSION_RECIPES.map((recipe) => {
    const isCompleted = ownedNames.has(recipe.name.toLowerCase());
    let readyCount = 0;

    const materialsWithStatus = recipe.materials.map((mat) => {
      const have = ownedNames.has(mat.name.toLowerCase());
      if (have) readyCount++;
      return {
        ...mat,
        owned: have,
      };
    });

    const percent = isCompleted ? 100 : Math.round((readyCount / recipe.materials.length) * 100);

    return {
      ...recipe,
      isCompleted,
      readyCount,
      totalRequired: recipe.materials.length,
      percent,
      materials: materialsWithStatus,
    };
  });
}

/**
 * Scan player's Nat 5s and generate Devilmon priority recommendations
 * @param {Object} box - parsed SWEX box
 */
export function analyzeDevilmonPriority(box) {
  const units = box?.units || [];

  // Filter Nat 5s (excluding Homunculus and fuseable non-summonables if desired)
  const nat5s = units.filter((u) => {
    const name = (u.info?.name || u.name || '').toLowerCase();
    const natStars = u.naturalStars || u.info?.stars || 0;
    if (natStars < 5) return false;
    if (name.includes('homunculus')) return false;
    return true;
  });

  return nat5s.map((u) => {
    const name = u.info?.name || u.name || '';
    const cleanName = name.toLowerCase().trim();
    const thaiName = u.info?.thaiName || u.thaiName || name;

    // Determine Priority Tier
    let priorityTier = 'B';
    let priorityReason = 'ใช้งานได้ทั่วไป หรือคุ้มค่าในระดับมาตรฐาน';

    if (DEVILMON_META_TIERS.S.has(cleanName)) {
      priorityTier = 'S';
      priorityReason = '🔥 แกนนำเมต้าระดับสูง สกิลลดคูลดาวน์ (CDR) เปลี่ยนรูปเกมทันที';
    } else if (DEVILMON_META_TIERS.A.has(cleanName)) {
      priorityTier = 'A';
      priorityReason = '⚡ ตัวดาเมจ/คอนโทรลหลัก ช่วยเพิ่มพลังโจมตีและอัตราติดสถานะอย่างมาก';
    }

    // Check skillups from u.skills if available
    let totalSkillLevel = 0;
    let maxSkillLevelEstimated = 12; // Typical Nat 5 needs 9-14 skillups
    let isMaxed = false;

    if (Array.isArray(u.skills) && u.skills.length > 0) {
      totalSkillLevel = u.skills.reduce((sum, s) => {
        const lvl = Array.isArray(s) ? Number(s[1]) : Number(s?.level || 1);
        return sum + (lvl - 1);
      }, 0);
      if (totalSkillLevel >= 10) isMaxed = true;
    }

    return {
      uid: u.uid || u.id,
      name,
      thaiName,
      element: u.element || u.info?.element || 'fire',
      stars: u.stars || 6,
      avatarUrl: u.avatarUrl || u.info?.avatarUrl || '',
      priorityTier,
      priorityReason,
      isMaxed,
      currentSkillups: totalSkillLevel,
      estimatedNeeded: isMaxed ? 0 : Math.max(1, maxSkillLevelEstimated - totalSkillLevel),
    };
  }).sort((a, b) => {
    const order = { S: 0, A: 1, B: 2 };
    return order[a.priorityTier] - order[b.priorityTier] || (a.isMaxed ? 1 : -1) - (b.isMaxed ? 1 : -1);
  });
}
