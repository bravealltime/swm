// Helper to detect and resolve user's real in-game Cairos Dungeon decks from SWEX import / AegisLink.

export const CAIROS_DUNGEON_SEQ_MAP = {
  'giants-abyss-hard': [101],
  'dragons-abyss-hard': [203, 202, 201],
  'necropolis-abyss-hard': [301],
  'steel-abyss-hard': [401],
  'punishers-abyss-hard': [501],
  'spiritual-abyss-hard': [601, 602, 603],
  // Also support numeric dungeonId
  '8011': [101],
  '8012': [203, 202, 201],
  '8013': [301],
  '8014': [401],
  '8015': [501],
  '8016': [601, 602, 603],
};

const TACTICAL_ROLES = {
  'Julie': 'กวาดล้างม็อบเวฟ 1 และ 3 จบใน 1 เทิร์น (Thousand Shots 100% HP)',
  'Prilea': 'เปิดเทิร์น ลดเกราะ Def Break 100% ใส่บอสทันที',
  'Lucifer': 'พาสซีฟ Dark Light: เมื่อเพื่อนสร้างดาเมจ เร่งเกจทั้งทีม 100% ทันที!',
  'Luna': 'สกิล 3 Falling Blossom วันช็อตบอสตาม Max HP ในฮิตเดียว ไม่โดนเคาน์เตอร์',
  'Deborah': 'พาสซีฟ Special Hammer: ขยายผลลดเกราะเจาะลึก +25% & เพิ่ม ATK',
  'Teshar': 'สกิล 3 Tempest กวาดล้างม็อบรีเซ็ตคูลดาวน์ทันที',
  'Liam': 'สกิล 3 Storm of Tempest ทะลวงบอสไม่สนเกราะ ดาเมจ 250,000+ วันช็อตมังกร!',
  'Shaina': 'ลีดเดอร์สปีด/ATK เจาะเกราะหมู่ และตัดเกจศัตรู',
  'Sabrina': 'ผสานพลังคู่แฝด Boomerang ลดเกราะ & เพิ่มดาเมจพันธมิตร',
  'Talia': 'ดาเมจหลัก Chakram ระเบิดเลือดบอสตาม HP ที่ลดลง',
  'Astar': 'พาสซีฟ Silence: ยิงดาเมจมหาศาลทะลวงบอสตอน HP บอสเต็ม',
  'Raoq': 'Team-up ดึงเพื่อนรุมฉีกเกราะ ลดคูลดาวน์ และลูปเทิร์น',
  'Icaru': 'Team-up ดึงเพื่อนร่วมทีมรุมโจมตีพร้อมกัน',
  'Abigail': 'มัลติฮิตทำลายชิลด์บอสเนโคร 5 ชั้น + บัฟ ATK',
  'Seren': 'มัลติฮิต เจาะเกราะ Def Break และบล็อกฮีลตัดการฟื้นเลือด',
  'Verdehile': 'ลีดเดอร์สปีด & พาสซีฟปั่นเกจโจมตี +40% ทุกครั้งที่คริติคอล',
  'Hwa': 'พาสซีฟตัดเกจบอส 25% ทุกฮิต ล็อคไม่ให้บอสขยับแม้แต่เทิร์นเดียว',
  'Cordelia': 'เบิสต์ดาเมจมหาศาลตามสปีด ปิดฉากบอสในพริบตา',
  'Zinc': 'บล็อกบัฟ Block Buff 100% ป้องกันบอสป้อมเหล็กกางโล่',
  'Loren': 'เปิดเจาะเกราะ Def Break & ตัดเกจศัตรูอย่างต่อเนื่อง',
  'Sieq': 'บัฟ ATK + คริติคอล 30% ให้ทั้งทีมเพื่อปิดฉากเร็ว',
  'Homunculus (Wind)': 'ดาเมจเจาะเกราะตามสัดส่วน % เลือดบอส',
  'Lyn': 'ปิดฉากบอสตามสัดส่วน Max HP ศัตรู',
  'Sigmarus': 'แช่แข็งม็อบและลด Max HP บอส 20%+',
};

/**
 * Resolve a deck from SWEX against the user's unit list.
 */
export function resolveUserDeck(rawDeck, box) {
  if (!rawDeck || !box) return null;
  const unitMap = new Map();
  const rawList = Array.isArray(box.units) ? box.units : (Array.isArray(box.unit_list) ? box.unit_list : []);

  for (const u of rawList) {
    const uid = Number(u.uid || u.unit_id);
    if (uid) unitMap.set(uid, u);
  }

  const unitIds = (rawDeck.unit_id_list || []).filter((id) => Number(id) > 0);
  if (unitIds.length === 0) return null;

  const leaderId = Number(rawDeck.leader_unit_id);
  const team = unitIds.map((id, idx) => {
    const u = unitMap.get(Number(id));
    const name = u?.name || u?.thaiName || `#${id}`;
    const baseName = name.replace(/\s*\(.*\)/, '').trim();
    const isLeader = Number(id) === leaderId;

    const baseSpd = Number(u?.baseSpd || u?.spd || 100);
    const totalSpd = Number(u?.spd || baseSpd);
    const plusSpd = totalSpd - baseSpd;

    const sets = Array.isArray(u?.sets) ? u.sets.join(' / ') : '';

    return {
      pos: idx + 1,
      isLeader,
      name: isLeader ? `${name} (L)` : name,
      rawName: name,
      element: u?.element || 'fire',
      stars: u?.stars || 6,
      avatarUrl: u?.avatarUrl || '',
      img: u?.avatarUrl || '',
      spd: `+${plusSpd > 0 ? plusSpd : 0} (รวม ${totalSpd})`,
      totalSpd,
      atk: u?.atk || 0,
      cr: u?.cr || 0,
      cd: u?.cd || 0,
      rune: sets || 'Fight / Rage / Blade',
      role: TACTICAL_ROLES[baseName] || TACTICAL_ROLES[name] || 'ตำแหน่งดาเมจ/ซัพพอร์ตประจำทีมในไอดีคุณ',
    };
  });

  const leaderUnit = team.find((m) => m.isLeader) || team[0];
  const monsterNames = team.map((m) => m.rawName.split(' ')[0]);

  // Determine custom deck metadata & estimated speed
  let estimatedRecord = '00:15';
  let estimatedAvg = '00:18';
  let deckTitle = `สำรับในเกม #${rawDeck.deck_seq}`;
  let specialDescription = '';

  const hasLucifer = monsterNames.some((n) => /Lucifer/i.test(n));
  const hasJulie = monsterNames.some((n) => /Julie/i.test(n));
  const hasLuna = monsterNames.some((n) => /Luna/i.test(n));
  const hasLiam = monsterNames.some((n) => /Liam/i.test(n));
  const hasTeshar = monsterNames.some((n) => /Teshar/i.test(n));

  if (hasLucifer && (hasJulie || hasLuna)) {
    estimatedRecord = '00:13';
    estimatedAvg = '00:15';
    deckTitle = '👑 สถิติโลก: เมต้าลูซิเฟอร์ (Lucifer God Run)';
    specialDescription = 'สุดยอดทีมสถิติโลกที่เร็วที่สุดใน Summoners War! Julie ล้างเวฟ ➔ Prilea เจาะเกราะ ➔ Lucifer เร่งเกจทั้งทีม 100% ➔ Deborah เสริมเกราะแตก ➔ Luna ปลิดชีพยักษ์ใน 1 ฮิต บอสลอยตายโดยไม่ทันได้เคาน์เตอร์ 7 ฮิต!';
  } else if (hasLiam) {
    estimatedRecord = '00:19';
    estimatedAvg = '00:23';
    deckTitle = '⚡ เมต้ายอดฮิต YouTube: Liam วันช็อต (Liam One-Shot)';
    specialDescription = 'เมต้าอันดับ 1 ของดันเจี้ยน Dragon Abyss จาก YouTube & ชุมชน! Julie กวาดม็อบ ➔ Icaru ดึงเพื่อน ➔ Liam สกิล 3 ระเบิดดาเมจไม่สนเกราะ 250,000+ วันช็อตมังกรตายในทันที!';
  } else if (hasTeshar) {
    estimatedRecord = '00:18';
    estimatedAvg = '00:22';
    deckTitle = '🔥 เมต้าเทชาร์ YouTube (Teshar Speed Run)';
    specialDescription = 'ทีมสปีดยอดนิยมจาก Facebook และ YouTube อาศัย Teshar Tempest กวาดล้างม็อบรีเซ็ตคูลดาวน์ และระเบิดดาเมจบอส!';
  } else if (rawDeck.deck_seq === 301) {
    estimatedRecord = '00:27';
    estimatedAvg = '00:32';
    deckTitle = '🔥 เมต้าเนโคร Abigail + Raoq + Seren 2A';
    specialDescription = 'ทีมเนโครมัลติฮิตทำลายชิลด์ 5 ชั้นอย่างรวดเร็ว พร้อม Seren บล็อกฮีล และ Astar ทะลวงดาเมจ!';
  } else if (rawDeck.deck_seq === 401) {
    estimatedRecord = '00:18';
    estimatedAvg = '00:22';
    deckTitle = '👑 เมต้าลูซิเฟอร์ป้อมเหล็ก (Lucifer Steel Fortress)';
    specialDescription = 'เร่งเกจด้วย Lucifer ผสานพลัง Raoq ดึงเพื่อน และ Astar ล้างเวฟอย่างรวดเร็ว!';
  } else if (rawDeck.deck_seq === 501) {
    estimatedRecord = '00:21';
    estimatedAvg = '00:25';
    deckTitle = '⚡ เมต้าล็อคเกจ Shaina + Hwa + Cordelia';
    specialDescription = 'Hwa ตัดเกจบอสทุกฮิต ไม่ให้บอสขยับ พร้อม Cordelia เบิสต์ดาเมจตามสปีด!';
  } else if (rawDeck.deck_seq >= 601) {
    estimatedRecord = '00:19';
    estimatedAvg = '00:24';
    deckTitle = '⚡ เมต้าคู่แฝด Talia + Sabrina + Julie';
    specialDescription = 'Julie ล้างเวฟ ➔ Prilea เจาะเกราะ ➔ คู่แฝดผสานพลังดาเมจ Chakram & Boomerang ปิดเกมรวดเร็ว!';
  }

  return {
    seq: rawDeck.deck_seq,
    deckType: rawDeck.deck_type,
    deckTitle,
    team,
    leaderUnit: leaderUnit.rawName,
    leaderSkill: `${leaderUnit.rawName} (Leader สกิลหัวหน้าทีมประจำสำรับ #${rawDeck.deck_seq})`,
    recordTime: estimatedRecord,
    avgTime: estimatedAvg,
    successRate: '99.8%',
    specialDescription,
    source: `ตั้งไว้ในเกมจริงของไอดีคุณ (${box?.wizard?.name || 'PedictU'})`,
  };
}

/**
 * Find all matching in-game Cairos decks for a given dungeon.
 */
export function findUserDungeonDecks(box, dungeonId) {
  if (!box) return [];

  const rawDecks = Array.isArray(box.decks) ? box.decks : (Array.isArray(box.deck_list) ? box.deck_list : []);
  const validSeqs = CAIROS_DUNGEON_SEQ_MAP[dungeonId] || [];

  if (rawDecks.length === 0 || validSeqs.length === 0) {
    return [];
  }

  // Filter decks with deck_type 24 (Cairos Abyss / Sub-boss) matching the target seqs
  const matching = rawDecks
    .filter((d) => Number(d.deck_type) === 24 && validSeqs.includes(Number(d.deck_seq)))
    .map((d) => resolveUserDeck(d, box))
    .filter(Boolean);

  return matching;
}
