// Lightweight URL <-> view state mapping for the SPA.
// Each view id becomes a path segment ("/rta", "/player-tracker"), dashboard is "/".
// View params are carried in the query string so links can be shared / refreshed.

export const DEFAULT_VIEW = 'dashboard';

// Old ids that some callers still use → canonical view id
const VIEW_ALIASES = {
  'siege-calc': 'siege-calculator',
  optimizer: 'artifact',
  'war-room': 'guild-war-room',
  summon: 'summon-simulator',
  'deck-builder': 'siege-planner',
  'arena-defense': 'arena',
  'arena-offense': 'arena',
};

export const VIEW_TITLES = {
  dashboard: 'หน้าแรก',
  arena: 'ทีมบุก & ตั้งรับ Arena (AO/AD)',
  'guild-war-room': 'ศูนย์บัญชาการกิลด์สด (War Room)',
  '3mdc': 'ค้นหาทีมแก้ทาง 3MDC',
  where2use: 'มอนสเตอร์นี้ใช้ที่ไหน',
  '3mdc-stats': 'สถิติ 3MDC',
  'game-guides': 'คู่มือกลยุทธ์',
  'siege-calculator': 'คำนวณคะแนน Siege',
  'siege-tournament': 'ทัวร์นาเมนต์ Siege',
  'siege-planner': 'จัด 10 ทีมบุก Siege (Deck Builder)',
  'player-tracker': 'ค้นหาสถิติผู้เล่น',
  'draft-explorer': 'จำลองดราฟต์ 5v5',
  'rta-synergies': 'คอมโบ RTA',
  'meta-dashboard': 'เมต้าแดชบอร์ด',
  guardian: 'อันดับ Guardian & เมต้าจากรีเพลย์จริง',
  'tier-list-maker': 'สร้าง Tier List',
  trending: 'สถิติเทรนด์ทั่วโลก',
  dungeons: 'ทีมฟาร์มดันเจี้ยน',
  balance: 'ประวัติ Balance Patch',
  faq: 'คำถามพบบ่อย',
  codes: 'โค้ดแจกไอเทม',
  leaderboards: 'ตารางอันดับกิลด์',
  catalog: 'สารานุกรมมอนสเตอร์',
  quiz: 'ทายมอนจากสกิล',
  speed: 'จูนสปีด',
  rune: 'คำนวณรูน',
  artifact: 'ดาเมจเสริมอาร์ติแฟกต์',
  'summon-simulator': 'ตู้จำลองเปิดคัมภีร์ (Summon Simulator)',
  recruit: 'กิลด์รับสมัคร',
  aegislink: 'AegisLink',
  'my-box': 'กล่องมอนสเตอร์ของฉัน',
  admin: 'หลังบ้าน SWM',
  'ai-farm-optimizer': '🤖 AI จัดทีม & รูน Abyss (Realtime)',
  rta: 'วิเคราะห์ RTA',
};

// viewParams key <-> short query-string key
const PARAM_KEYS = {
  search: 'q',
  subItem: 'tab',
  initialPlayer: 'player',
  initialMonster: 'monster',
};
const QUERY_KEYS = Object.fromEntries(Object.entries(PARAM_KEYS).map(([k, v]) => [v, k]));

export function normalizeView(view) {
  const id = VIEW_ALIASES[view] || view;
  return VIEW_TITLES[id] ? id : DEFAULT_VIEW;
}

/**
 * URL slug for a monster name: "Alice / Hollyberry Cookie" → "alice-hollyberry-cookie".
 * Shared with scripts/prerender_monsters.mjs so /monster/<slug> means the same thing on both sides.
 */
export function monsterSlug(name) {
  return String(name || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// /monster/<slug> is the crawlable, shareable address of a monster in the encyclopedia
const MONSTER_PATH = /^monster\/([^/]+)$/;

export function buildUrl(view, params = {}) {
  const id = normalizeView(view);
  const qs = new URLSearchParams();
  let path = id === DEFAULT_VIEW ? '/' : `/${id}`;
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    if (id === 'catalog' && key === 'initialMonster') { path = `/monster/${monsterSlug(value) || encodeURIComponent(value)}`; continue; }
    qs.set(PARAM_KEYS[key] || key, String(value));
  }
  const query = qs.toString();
  return path + (query ? `?${query}` : '');
}

export function parseLocation(loc = window.location) {
  const segment = loc.pathname.replace(/^\/+|\/+$/g, '');
  const monster = MONSTER_PATH.exec(segment);
  const view = monster ? 'catalog' : segment ? normalizeView(segment) : DEFAULT_VIEW;
  const params = {};
  for (const [key, value] of new URLSearchParams(loc.search)) {
    params[QUERY_KEYS[key] || key] = value;
  }
  if (monster) params.initialMonster = decodeURIComponent(monster[1]);
  return { view, params };
}

export const VIEW_SEO = {
  dashboard: {
    title: 'SWM • Summoners War Master | ศูนย์รวมโค้ดล่าสุด สูตรตีบ้าน 3MDC & เมต้า RTA ภาษาไทย',
    description: 'Summoners War ภาษาไทย: ศูนย์รวมโค้ดแจกไอเทมล่าสุด อัปเดตทุกวัน, สูตรแก้ทางกิลด์วอร์ 3MDC 1,200+ สูตร, สถิติ RTA Guardian จากรีเพลย์จริง, สารานุกรมสกิลแปลไทย 940 ตัว และ AI โค้ชช่วยดราฟต์',
  },
  codes: {
    title: 'โค้ด Summoners War ล่าสุด 2026 แจกไอเทมฟรี (กดรับทันที) | SWM',
    description: 'รวบรวมโค้ดแจกไอเทมฟรี Summoners War ล่าสุด คัมภีร์เวทมนตร์, หินซัมมอน, พลังงาน, หินมานา กดรับผ่าน WithHive ได้ทันที อัปเดตเรียลไทม์',
  },
  '3mdc': {
    title: 'สูตรแก้ทางกิลด์วอร์ 3MDC ภาษาไทย (1,200+ ทีมชนะ Siege) | SWM',
    description: 'ค้นหาสูตรแก้ทางทีมกันบ้าน Siege 3MDC อัปเดตล่าสุด ดูทีมบุกอัตราการชนะสูง ลำดับสปีด พร้อมคำแนะนำการแก้ทางจาก AI',
  },
  rta: {
    title: 'วิเคราะห์ RTA & สถิติเมต้า Summoners War ซีซั่นล่าสุด | SWM',
    description: 'สถิติ RTA World Arena จากรีเพลย์ผู้เล่น Guardian วิเคราะห์ Win Rate, Pick Rate, Ban Rate และคอมโบเมต้าที่แข็งแกร่งที่สุด',
  },
  guardian: {
    title: 'ทำเนียบ Guardian & สถิติ RTA จากรีเพลย์ผู้เล่นระดับโลก | SWM',
    description: 'จัดอันดับมอนสเตอร์ระดับ Guardian สถิติ Pick/Win rate ละเอียดที่สุดในไทย เจาะลึกการจัดรูนและมอนสเตอร์ยอดนิยม',
  },
  'my-box': {
    title: 'กล่องมอนสเตอร์ของฉัน & ตรวจสอบประสิทธิภาพรูน SWEX ภาษาไทย | SWM',
    description: 'นำเข้าข้อมูลเกม Summoners War ผ่าน SWEX วิเคราะห์คะแนนไอดี ประสิทธิภาพรูน อาร์ติแฟกต์ และจัดทีมจากมอนสเตอร์ที่มีจริงในไอดี',
  },
  catalog: {
    title: 'สารานุกรมมอนสเตอร์ | SWM',
    description: 'ค้นหามอนสเตอร์ Summoners War ทุกตัว สกิลแปลไทยแท้ 940 ตัว สเตตัสพื้นฐาน รูนแนะนำ และอันดับในเมต้า',
  },
  dungeons: {
    title: 'ทีมฟาร์มดันเจี้ยน Abyss Hard & คำนวณดาเมจ PVE | SWM',
    description: 'จัดทีมฟาร์ม Giant, Dragon, Necro, Spiritual Realm Abyss Hard สถิติทีมฟาร์มเร็วและเสถียรที่สุด พร้อมโปรแกรมคำนวณดาเมจ',
  },
  arena: {
    title: 'ทีมบุก & ตั้งรับ Arena (AO/AD) Summoners War อัปเดตล่าสุด | SWM',
    description: 'รวมทีมตีอารีน่า AO ความเร็วสูง และทีมตั้งรับ AD เหนียวแน่น จัดรูนและสปีดทูนนิ่งสำหรับดันแรงก์ Legend / Guardian',
  },
  speed: {
    title: 'โปรแกรมจูนสปีด Summoners War (Speed Tuner) คำนวณเทิร์นทีม | SWM',
    description: 'เครื่องมือคำนวณและจูนสปีดมอนสเตอร์ ป้องกันการโดนแทรกเทิร์นใน Arena, RTA และ Siege แม่นยำตามสูตรเกมจริง',
  },
  rune: {
    title: 'โปรแกรมคำนวณรูน & วิเคราะห์ความคุ้มค่าหินหลอม (Reapp) | SWM',
    description: 'ประเมินประสิทธิภาพรูน Substat Efficiency และวิเคราะห์โอกาสการใช้หินหลอม Reappraisal Stone ให้คุ้มค่าที่สุด',
  },
  artifact: {
    title: 'เครื่องมือค้นหา & คำนวณดาเมจเสริมอาร์ติแฟกต์ (Artifact Search) | SWM',
    description: 'ค้นหาอาร์ติแฟกต์ที่เหมาะกับสกิลมอนสเตอร์ คำนวณดาเมจเสริมตามความเร็ว, พลังป้องกัน, หรือ HP สูญเสีย',
  },
  'draft-explorer': {
    title: 'จำลองดราฟต์ RTA 5v5 & ระบบแนะนำมอนสเตอร์เคาน์เตอร์ | SWM',
    description: 'ฝึกฝนการดราฟต์ World Arena 5v5 จำลองสถานการณ์ First Pick, Counter Pick และให้ AI แนะนำตัวเลือกที่ดีที่สุด',
  },
  'guild-war-room': {
    title: 'ศูนย์บัญชาการกิลด์วอร์สด (Guild War Room) แผนที่ Siege | SWM',
    description: 'ระบบวางแผนกิลด์วอร์แบบเรียลไทม์ บันทึกการตีบ้าน แจกจ่ายเป้าหมาย และประสานงานสมาชิกในกิลด์',
  },
  'siege-planner': {
    title: 'จัด 10 ทีมบุก Siege (Deck Builder) จากมอนสเตอร์ในไอดี | SWM',
    description: 'วางแผน 10 ทีมบุกกิลด์วอร์ ป้องกันการใช้มอนสเตอร์ซ้ำ คำนวณความพร้อมของทีมและแชร์เดสก์กิลด์ได้ทันที',
  },
};

export function titleFor(view) {
  const seo = VIEW_SEO[view];
  if (seo?.title) return seo.title;
  const page = VIEW_TITLES[view];
  return page && view !== DEFAULT_VIEW ? `${page} | SWM` : 'SWM • Summoners War Master | ศูนย์รวมโค้ดล่าสุด สูตรตีบ้าน 3MDC & เมต้า RTA ภาษาไทย';
}

export function descriptionFor(view) {
  const seo = VIEW_SEO[view];
  return seo?.description || 'Summoners War ภาษาไทย: ศูนย์รวมโค้ดแจกไอเทมล่าสุด, สูตรแก้ทางกิลด์วอร์ 3MDC 1,200+ สูตร, สถิติ RTA Guardian จากรีเพลย์จริง, สารานุกรมสกิลแปลไทย 940 ตัว และ AI โค้ชช่วยดราฟต์';
}
