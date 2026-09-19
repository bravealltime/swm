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
};

export const VIEW_TITLES = {
  dashboard: 'หน้าแรก',
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

export function titleFor(view) {
  const page = VIEW_TITLES[view];
  return page && view !== DEFAULT_VIEW ? `${page} | SWM` : 'SWM (Summoners War Master) - ศูนย์รวมยุทธวิธีกิลด์วอร์ & สารานุกรมมอนสเตอร์';
}
