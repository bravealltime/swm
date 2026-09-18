// Grounded draft / counter / all-knowing Summoners War coach advisor.
// The model sees multi-source facts (Skills, Base Stats, Rune Builds, Guardian Benchmarks, 
// Dungeon Abyss teams, 3MDC Siege Counters) and reasons from verified game data.
import fs from 'node:fs';
import path from 'node:path';
import { chat } from './ai.js';
import { MONSTER_BUILDS } from '../../src/data/monsterBuilds.js';

let knowledgeCache = null;

const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim();

// Common Thai nicknames and monster aliases in Summoners War community
const THAI_ALIASES = {
  'โบลิ่งน้ำ': 'Aegir',
  'โบลิ่งไฟ': 'Surtr',
  'โบลิ่งลม': 'Hraesvelg',
  'โบลิ่งมืด': 'Hrungnir',
  'โบลิ่งแสง': 'Mimirr',
  'อินุไฟ': 'Raoq',
  'เปโรว': 'Raoq',
  'อินุน้ำ': 'Icaru',
  'อินุลม': 'Kro',
  'อินุแสง': 'Bella',
  'เบลล่า': 'Belladeon',
  'แพนด้าลม': 'Feng Yan',
  'เฟิงหยาน': 'Feng Yan',
  'แพนด้าไฟ': 'Xiong Fei',
  'แพนด้าน้ำ': 'Mo Long',
  'โม่หลง': 'Mo Long',
  'แพนด้ามืด': 'Mi Ying',
  'แพนด้าแสง': 'Tian Lang',
  'เทียนหลาง': 'Tian Lang',
  'อิฟน้ำ': 'Theomars',
  'เทโอมาร์ส': 'Theomars',
  'ธีโอมาร์ส': 'Theomars',
  'อิฟมืด': 'Veromos',
  'เวโรโมส': 'Veromos',
  'อิฟไฟ': 'Tesarion',
  'เทซาเรียน': 'Tesarion',
  'ไก่ไฟ': 'Perna',
  'เพอร์น่า': 'Perna',
  'ไก่ลม': 'Teshar',
  'เทชาร์': 'Teshar',
  'ไก่น้ำ': 'Sigmarus',
  'ซิกมารัส': 'Sigmarus',
  'โอราเคิลลม': 'Seara',
  'เซียร์ร่า': 'Seara',
  'โอราเคิลไฟ': 'Juno',
  'จูโน่': 'Juno',
  'โอราเคิลน้ำ': 'Praha',
  'พราฮา': 'Praha',
  'โอราเคิลแสง': 'Laima',
  'โอราเคิลมืด': 'Giana',
  'กิอาน่า': 'Giana',
  'กัปตันน้ำ': 'Galleon',
  'กาเลออน': 'Galleon',
  'แวมไฟ': 'Verdehile',
  'เวอร์เดฮิล': 'Verdehile',
  'เวอร์เด': 'Verdehile',
  'แวมมืด': 'Cadiz',
  'คาดิล': 'Cadiz',
  'แวมแสง': 'Julianne',
  'โพล่าลม': 'Tiana',
  'ทิอาน่า': 'Tiana',
  'เทียน่า': 'Tiana',
  'โพล่าน้ำ': 'Alicia',
  'อลิเซีย': 'Alicia',
  'คิเมร่าลม': 'Lagmaron',
  'ลาการอน': 'Lagmaron',
  'คิเมร่าน้ำ': 'Taor',
  'ทาออร์': 'Taor',
  'คิเมร่าไฟ': 'Rakan',
  'รากัน': 'Rakan',
  'พาลาดินแสง': 'Jeanne',
  'จีนน์': 'Jeanne',
  'ฮาร์ปไฟ': 'Harmonia',
  'ฮาโมเนีย': 'Harmonia',
  'ฮาร์ปน้ำ': 'Triana',
  'ทรีอาน่า': 'Triana',
  'เบยองชอล': 'Byungchul',
  'บยองชอล': 'Byungchul',
  'ชาร์ล็อต': 'Charlotte',
  'อนาวิล': 'Anavel',
  'ริก้า': 'Rica',
  'ซาวานนาห์': 'Savannah',
  'ไมลส์': 'Miles',
  'โดมินิค': 'Dominic',
  'มัวร์': 'Moore',
  'โอลิเวอร์': 'Oliver',
  'ลูเชน': 'Lushen',
  'โจ๊กเกอร์ลม': 'Lushen',
  'คามิลล่า': 'Camilla',
  'วาลคิรีน้ำ': 'Camilla',
  'วาเนสซ่า': 'Vanessa',
  'วาลคิรีไฟ': 'Vanessa',
  'คาทาริน่า': 'Katarina',
  'วาลคิรีลม': 'Katarina',
  'ไลล่า': 'Lyla',
  'คาริน': 'Colleen',
  'ฟราน': 'Fran',
  'ไรลีย์': 'Riley',
  'เดโบราห์': 'Deborah',
  'เลียม': 'Liam',
  'ไซรอส': 'Zaiross',
  'มังกรไฟ': 'Zaiross',
  'เวราด': 'Verad',
  'มังกรน้ำ': 'Verad',
  'จามีร์': 'Jamire',
  'มังกรลม': 'Jamire',
  'กิลเลส์': 'Gilles',
  'นาวิกา': 'Navica'
};

function loadKnowledge() {
  if (knowledgeCache) return knowledgeCache;

  const cwd = process.cwd();
  const skillsFile = path.resolve(cwd, 'src/data/monsterSkillsData.json');
  const monstersFile = path.resolve(cwd, 'src/data/allMonsters.json');
  const dungeonFile = path.resolve(cwd, 'src/data/dungeonAbyssData.json');
  const mdcFile = path.resolve(cwd, 'src/data/allMdcData.json');

  const skillsRaw = fs.existsSync(skillsFile) ? JSON.parse(fs.readFileSync(skillsFile, 'utf8')) : {};
  const monstersRaw = fs.existsSync(monstersFile) ? JSON.parse(fs.readFileSync(monstersFile, 'utf8')) : [];
  const dungeonRaw = fs.existsSync(dungeonFile) ? JSON.parse(fs.readFileSync(dungeonFile, 'utf8')) : [];
  const mdcRaw = fs.existsSync(mdcFile) ? JSON.parse(fs.readFileSync(mdcFile, 'utf8')) : [];

  const skillsList = Array.isArray(skillsRaw) ? skillsRaw : Object.values(skillsRaw);

  const monsterByEnName = new Map();
  const monsterByCid = new Map();
  const monsterByThName = new Map();

  for (const m of skillsList) {
    if (m?.name) monsterByEnName.set(m.name.toLowerCase(), m);
    if (m?.cid) monsterByCid.set(String(m.cid), m);
  }

  const catalogMeta = new Map();
  for (const m of monstersRaw) {
    if (m?.name) {
      catalogMeta.set(m.name.toLowerCase(), m);
      if (m.thaiName) {
        monsterByThName.set(m.thaiName.trim().toLowerCase(), m.name);
      }
    }
    if (m?.com2usId) catalogMeta.set(String(m.com2usId), m);
  }

  // Pre-index 3MDC Defenses for fast counter search
  const mdcMap = new Map();
  for (const team of mdcRaw) {
    const defNames = (team.defense?.monsters || []).map(m => (m.name || m || '').toLowerCase()).sort().join(' + ');
    if (defNames) {
      if (!mdcMap.has(defNames)) mdcMap.set(defNames, []);
      mdcMap.get(defNames).push(team);
    }
  }

  knowledgeCache = {
    skillsByEn: monsterByEnName,
    skillsByCid: monsterByCid,
    thNameToEn: monsterByThName,
    catalogMeta,
    dungeons: dungeonRaw,
    mdcMap,
    allMdc: mdcRaw
  };

  return knowledgeCache;
}

/** Resolves any Thai/English name, ID, or alias to the canonical monster entity */
export function resolveMonster(nameOrAlias) {
  const k = loadKnowledge();
  if (!nameOrAlias) return null;
  const raw = String(nameOrAlias).trim();
  const lower = raw.toLowerCase();

  // 1. Direct English / CID match
  let m = k.skillsByEn.get(lower) || k.skillsByCid.get(raw);
  if (m) return m;

  // 2. Thai alias match
  if (THAI_ALIASES[raw] || THAI_ALIASES[lower]) {
    const enName = THAI_ALIASES[raw] || THAI_ALIASES[lower];
    m = k.skillsByEn.get(enName.toLowerCase());
    if (m) return m;
  }

  // 3. Thai name in allMonsters.json
  const resolvedEn = k.thNameToEn.get(lower);
  if (resolvedEn) {
    m = k.skillsByEn.get(resolvedEn.toLowerCase());
    if (m) return m;
  }

  // 4. Catalog meta lookup
  const meta = k.catalogMeta.get(lower) || k.catalogMeta.get(raw);
  if (meta?.name) {
    m = k.skillsByEn.get(meta.name.toLowerCase());
    if (m) return m;
  }

  return null;
}

/** Comprehensive fact sheet for a monster: Stats, Skills in Thai, Rune Builds & Benchmarks */
export function monsterFacts(nameOrId) {
  const m = resolveMonster(nameOrId);
  const k = loadKnowledge();
  if (!m) return `- ${nameOrId}: (ไม่มีข้อมูลสกิลในระบบ)`;

  const meta = k.catalogMeta.get(m.name.toLowerCase()) || {};
  const bs = m.bs || {};
  const lead = m.ls?.textTh || m.ls?.textEn ? `ลีด: ${clean(m.ls.textTh || m.ls.textEn)}` : 'ไม่มีลีด';
  
  // Skills with Thai descriptions, cooldowns, and multipliers
  const skills = (m.sk || []).map((s) => {
    const cd = s.cooldown ? `CD${s.cooldown}` : 'ไม่มีCD';
    const tag = [s.isPassive ? 'พาสซีฟ' : null, s.isAoe ? 'AoE' : null].filter(Boolean).join('/');
    const desc = clean(s.descriptionTh || s.description);
    return `  ${s.slotLabel || 'S'} ${s.name}${tag ? ` [${tag}]` : ''} (${cd}${s.multiplier ? `, ตัวคูณ: ${s.multiplier}` : ''}): ${desc}`;
  });

  // Rune Build & Benchmark info
  let buildInfo = '';
  const buildKey = m.name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const detailedBuild = MONSTER_BUILDS[buildKey];

  if (detailedBuild) {
    const b = detailedBuild.benchmarks || {};
    buildInfo = `\n  [แนวทางการใส่รูนระดับ Guardian]: เซ็ตหลัก: ${detailedBuild.sets.join(' หรือ ')} | ช่อง 2/4/6: ${detailedBuild.slots246.join(' หรือ ')}\n  [สเตตัสเป้าหมาย Guardian]: HP ${b.hp || '-'} | ATK ${b.atk || '-'} | DEF ${b.def || '-'} | SPD ${b.spd || '-'} | CR ${b.cr || '-'}% | CD ${b.cd || '-'}% | RES ${b.res || '-'}% | ACC ${b.acc || '-'}%\n  [อาร์ติแฟกต์ & ทิปส์]: ${detailedBuild.artifacts?.join(', ') || '-'} • ${detailedBuild.tips || ''}`;
  } else if (meta.suggestedRunes) {
    buildInfo = `\n  [แนวทางการใส่รูนแนะนำ]: ${meta.suggestedRunes}${meta.role ? ` (บทบาท: ${meta.role})` : ''}`;
  }

  const thLabel = meta.thaiName ? ` (${meta.thaiName})` : '';
  const elementLabel = meta.element ? `ธาตุ ${meta.element.toUpperCase()}` : '';

  return `- ${m.name}${thLabel} [${elementLabel}] | SPD ${bs.spd || '-'} HP ${bs.hp || '-'} ATK ${bs.atk || '-'} DEF ${bs.def || '-'} | ${lead}\n${skills.join('\n')}${buildInfo}`;
}

/** Detects all monster names/aliases (English & Thai) mentioned in user query */
let namePatterns = null;
function mentionedMonsters(text) {
  const k = loadKnowledge();
  if (!namePatterns) {
    const names = [];
    for (const m of k.skillsByEn.values()) {
      if (m.name && m.name.length >= 3) names.push({ key: m.name.toLowerCase(), target: m.name });
    }
    for (const [th, en] of k.thNameToEn.entries()) {
      if (th.length >= 2) names.push({ key: th, target: en });
    }
    for (const [alias, en] of Object.entries(THAI_ALIASES)) {
      names.push({ key: alias.toLowerCase(), target: en });
    }
    // Longest first to match "dark stark" before "stark", or "แพนด้าลม" before "แพนด้า"
    names.sort((a, b) => b.key.length - a.key.length);
    namePatterns = names;
  }

  const lower = String(text || '').toLowerCase();
  const found = new Set();
  for (const { key, target } of namePatterns) {
    if (found.size >= 8) break;
    if (lower.includes(key)) {
      found.add(target);
    }
  }
  return [...found];
}

/** Check if query is asking for dungeon teams (Giants, Dragons, Necro, Abyss, R5) */
function findDungeonFacts(text) {
  const k = loadKnowledge();
  const lower = String(text || '').toLowerCase();
  const dungeons = k.dungeons || [];
  const matched = [];

  const triggers = [
    { keys: ['giant', 'giants', 'gb12', 'ไจแอนท์', 'ยักษ์'], id: 'giants-abyss-hard' },
    { keys: ['dragon', 'dragons', 'db12', 'ดราก้อน', 'มังกร'], id: 'dragon-abyss-hard' },
    { keys: ['necro', 'necropolis', 'nb12', 'เนโคร'], id: 'necro-abyss-hard' },
    { keys: ['steel', 'sf10', 'สปีล', 'สถิตย์เหล็ก', 'หอคอยเหล็ก'], id: 'steel-fortress-abyss-hard' },
    { keys: ['punisher', 'pc10', 'นักลงทัณฑ์', 'พูนิชเชอร์'], id: 'punishers-crypt-abyss-hard' }
  ];

  for (const t of triggers) {
    if (t.keys.some(k => lower.includes(k))) {
      const dung = dungeons.find(d => d.id === t.id);
      if (dung) matched.push(dung);
    }
  }

  if (!matched.length && (lower.includes('abyss') || lower.includes('ดันเจี้ยน') || lower.includes('อบิส'))) {
    matched.push(...dungeons.slice(0, 2));
  }

  if (!matched.length) return null;

  return matched.map(d => {
    const mons = (d.popularMonsters || []).map(m => m.name).join(', ');
    return `[ข้อมูลทีมดันเจี้ยน ${d.name}]:
- ทีมเมต้าแนะนำ: ${mons}
- ลีดเดอร์สกิล: ${d.leaderSkill || '-'}
- ลำดับเทิร์น (Turn Order): ${d.turnOrder || '-'}
- เวลาเฉลี่ย: ${d.avgTime || '-'} (เร็วสุด ${d.fastestTime || '-'}) | อัตราผ่าน: ${d.successRate || '-'}`;
  }).join('\n\n');
}

/** Check if query asks to counter a specific 3MDC defense team */
function findMdcCounters(text, mentioned) {
  const k = loadKnowledge();
  if (mentioned.length < 2 && !text.includes('3mdc') && !text.includes('แก้') && !text.includes('เจาะ') && !text.includes('กันบ้าน') && !text.includes('siege')) {
    return null;
  }

  const lower = String(text || '').toLowerCase();
  const results = [];

  for (const [defKey, teams] of k.mdcMap.entries()) {
    const defMons = defKey.split(' + ');
    const matchCount = mentioned.filter(m => defMons.includes(m.toLowerCase())).length;
    if (matchCount >= 2 || (matchCount >= 1 && defMons.length <= 2)) {
      for (const t of teams.slice(0, 2)) {
        const counters = (t.counters || []).slice(0, 3).map((c, i) => {
          const names = (c.monsters || []).map(m => m.name || m).join(' + ');
          return `  สูตร ${i + 1}: ${names} (คะแนนความเสถียร ${c.rating ?? '-'}${c.turnOrder ? `, สปีดเทิร์น: ${c.turnOrder}` : ''})`;
        }).join('\n');
        results.push(`[สูตรแก้ทาง 3MDC ชุมชน SWGT สำหรับทีมรับ ${t.defense?.monsters?.map(m => m.name || m).join(' + ')}]:\n${counters}`);
      }
      if (results.length >= 2) break;
    }
  }

  return results.length ? results.join('\n\n') : null;
}

const SYSTEM = `คุณคือโค้ช Summoners War ระดับ Guardian ของเว็บ SWM ตอบเป็นภาษาไทยที่กระชับ อ่านง่าย ใช้หัวข้อสั้นและ bullet
กฎเหล็ก:
1. ใช้เฉพาะข้อมูลสกิล/สถิติที่ให้มาในข้อความนี้ ห้ามเดาสกิลหรือธาตุของมอนสเตอร์เอง ถ้าข้อมูลไม่พอให้บอกว่าไม่พอ
2. อ้างอิงชื่อสกิลจริงเมื่ออธิบายกลไก (เช่น "S3 กวาดล้างลดเกจ 100%")
3. ให้แผนที่ลงมือทำได้: ลำดับเทิร์น, ใครควรเร็วกว่าใคร, เป้าหมายแรก, จุดเสี่ยง
4. ไม่ต้องทักทายหรือสรุปซ้ำ ยาวไม่เกิน ~250 คำ`;

function mdcPrompt({ defense, counters = [] }) {
  const defNames = (defense?.monsters || []).map((m) => m.name || m);
  const facts = defNames.map(monsterFacts).join('\n');
  const counterLines = counters.slice(0, 5).map((c, i) => {
    const names = (c.monsters || []).map((m) => m.name || m).join(' + ');
    return `${i + 1}. ${names} (คะแนนความน่าเชื่อถือ ${c.rating ?? '-'}${c.turnOrder ? `, ลำดับ: ${clean(c.turnOrder)}` : ''}${c.notes ? `, โน้ต: ${clean(c.notes).slice(0, 160)}` : ''})`;
  }).join('\n');
  const counterFacts = [...new Set(counters.slice(0, 3).flatMap((c) => (c.monsters || []).map((m) => m.name || m)))]
    .filter((n) => !defNames.includes(n)).map(monsterFacts).join('\n');

  return `ทีมตั้งรับ 3MDC ที่ต้องเจาะ: ${defNames.join(' + ')}
ข้อมูลสกิลฝั่งตั้งรับ:
${facts}

สูตรแก้ทางที่ชุมชน SWGT ใช้บ่อย (จากฐานข้อมูล SWM):
${counterLines || '(ไม่มีสูตรในระบบ)'}

ข้อมูลสกิลของมอนสเตอร์ในสูตรแก้ทางอันดับต้น:
${counterFacts || '-'}

งาน: อธิบายว่าทำไมทีมตั้งรับนี้อันตราย (กลไกหลักจากสกิลที่ให้มา) แล้วเลือกสูตรแก้ทางที่ดีที่สุด 1–2 สูตรจากรายการ พร้อมลำดับเทิร์น/เป้าหมายแรก/สิ่งที่ต้องระวัง ปิดท้ายด้วยเกณฑ์สปีดคร่าว ๆ ว่าตัวไหนต้องเร็วกว่าตัวไหน`;
}

function draftPrompt({ blue = [], red = [], blueLeader, redLeader, blueBan, redBan, perspective = 'blue' }) {
  const names = (list) => list.map((m) => m?.name || m).filter(Boolean);
  const blueNames = names(blue);
  const redNames = names(red);
  const facts = [...new Set([...blueNames, ...redNames])].map(monsterFacts).join('\n');
  const side = perspective === 'blue' ? 'ฝั่งเรา (Blue)' : 'ฝั่งเรา (Red)';
  return `ดราฟต์ RTA 5v5
Blue: ${blueNames.join(', ') || '-'}${blueLeader ? ` | ลีด: ${blueLeader}` : ''}${blueBan ? ` | Blue แบน: ${blueBan}` : ''}
Red: ${redNames.join(', ') || '-'}${redLeader ? ` | ลีด: ${redLeader}` : ''}${redBan ? ` | Red แบน: ${redBan}` : ''}
มุมมอง: ${side}

ข้อมูลสกิลทุกตัวในดราฟต์:
${facts}

งาน: วิเคราะห์แมตช์อัพนี้จากมุมมองฝั่งเรา — (1) เกมแพลนหลักของแต่ละฝั่ง (2) ตัวที่ควรแบน/ถูกแบนและเหตุผล (3) ลำดับเทิร์นที่ต้องการและเป้าหมายแรก (4) เงื่อนไขชนะ/แพ้ที่ต้องระวัง`;
}

const CHAT_SYSTEM = `คุณคือโค้ช Summoners War: Sky Arena ระดับ Guardian ประจำเว็บ SWM คุยเป็นภาษาไทยแบบเพื่อนร่วมกิลด์ที่เก่งเกม กระชับ ตรงประเด็น
ขอบเขต: ตอบเฉพาะเรื่อง Summoners War เท่านั้น (มอนสเตอร์ รูน อาร์ติแฟกต์ RTA อารีน่า กิลด์วอร์/Siege ดันเจี้ยน อีเวนต์ การจัดทีม)
ถ้าคำถามไม่เกี่ยวกับ Summoners War ให้ตอบสั้น ๆ ประโยคเดียวว่าโค้ชตอบเฉพาะเรื่อง Summoners War แล้วชวนถามเรื่องเกมแทน

ความรู้หลักและแนวทางการตอบ:
1. การใส่รูนและปั้นตัวละคร: อิงจาก "แนวทางการใส่รูนและสเตตัสเป้าหมาย Guardian" ที่แนบมา บอกเซ็ต (เช่น Violent/Will), ออฟหลักช่อง 2/4/6 (เช่น SPD/CD/ATK%), ซับสเตตัสที่ต้องเน้น, และอาร์ติแฟกต์
2. การจัดทีมดันเจี้ยน: อิงจาก "ข้อมูลทีมดันเจี้ยน" ที่แนบมา ระบุตัวมอนสเตอร์, ลำดับเทิร์น (Turn Order เช่น บัฟดาบ -> เจาะเกราะ -> ดาเมจกวาดล้าง), และเกณฑ์สปีด
3. กิลด์วอร์ & 3MDC Siege: อิงจาก "สูตรแก้ทาง 3MDC" ที่แนบมา อธิบายจุดอันตรายของทีมรับ และสเต็ปการเจาะบ้านแบบชัวร์ 100%
4. ถ้ามี "กล่องของผู้ใช้" แนบมา ให้แนะนำตัวที่ผู้ใช้มีจริงในกล่องก่อนเสมอ
5. จัดรูปแบบให้อ่านง่าย: เริ่มด้วยคำตอบสั้น 1 บรรทัด แล้วตามด้วยหัวข้อหรือ bullet point ไม่ต้องทักทายเยิ่นเย้อ`;

function chatPrompt({ question, context = {}, history = [] }) {
  const q = String(question || '').trim();
  if (!q) throw new Error('empty question');
  const NL = '\n';
  const parts = [];

  if (context.box) parts.push(`กล่องของผู้ใช้ (สรุป):${NL}${String(context.box).slice(0, 6000)}`);
  if (context.defense) parts.push(`ทีมตั้งรับที่กำลังดูอยู่: ${context.defense}`);
  if (context.draft) parts.push(`ดราฟต์ที่กำลังดูอยู่: ${context.draft}`);
  if (Array.isArray(context.players) && context.players.length) {
    parts.push(`ข้อมูลผู้เล่น SWRT (สถิติ RTA สาธารณะ):${NL}${context.players.slice(0, 2).map((p) => `- ${String(p).slice(0, 600)}`).join(NL)}`);
  }
  if (context.previousAnswer) parts.push(`คำตอบก่อนหน้าของโค้ช (ย่อ): ${String(context.previousAnswer).slice(0, 1200)}`);

  // Detect monsters from query + context
  const detected = [...new Set([...mentionedMonsters(q), ...(context.monsters || []).slice(0, 12)])].slice(0, 14);
  if (detected.length) {
    parts.push(`ข้อมูลอ้างอิงสกิล/สเตตัส/รูนของมอนสเตอร์ที่เกี่ยวข้อง:${NL}${detected.map(monsterFacts).join(NL + NL)}`);
  }

  // Detect Dungeons (Giants, Dragons, Necro, Abyss Hard, R5)
  const dungeonFacts = findDungeonFacts(q);
  if (dungeonFacts) {
    parts.push(`ข้อมูลดันเจี้ยนที่เกี่ยวข้อง:${NL}${dungeonFacts}`);
  }

  // Detect 3MDC Counters
  const mdcFacts = findMdcCounters(q, detected);
  if (mdcFacts) {
    parts.push(`ข้อมูลสูตรแก้ทาง 3MDC จาก SWGT:${NL}${mdcFacts}`);
  }

  const past = history.slice(-4).map((h) => `${h.role === 'user' ? 'ผู้ใช้' : 'โค้ช'}: ${String(h.text).slice(0, 600)}`).join(NL);
  if (past) parts.push(`บทสนทนาก่อนหน้า:${NL}${past}`);
  parts.push(`คำถาม: ${q}`);

  return parts.join(NL + NL);
}

/**
 * kind: 'mdc' | 'draft' | 'chat'. Returns { answer, model, usage }.
 */
export async function advise(payload) {
  const kind = payload?.kind;
  let user;
  let system = SYSTEM;
  if (kind === 'mdc') user = mdcPrompt(payload);
  else if (kind === 'draft') user = draftPrompt(payload);
  else if (kind === 'chat') { user = chatPrompt(payload); system = CHAT_SYSTEM; }
  else throw new Error('unknown kind');
  if (user.length > 24000) user = user.slice(0, 24000);
  const { text, usage, model } = await chat({ system, user, maxTokens: 950, temperature: kind === 'chat' ? 0.35 : 0.25 });
  return { answer: text, usage, model };
}
