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

export function buildUrl(view, params = {}) {
  const id = normalizeView(view);
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    qs.set(PARAM_KEYS[key] || key, String(value));
  }
  const query = qs.toString();
  return (id === DEFAULT_VIEW ? '/' : `/${id}`) + (query ? `?${query}` : '');
}

export function parseLocation(loc = window.location) {
  const segment = loc.pathname.replace(/^\/+|\/+$/g, '');
  const view = segment ? normalizeView(segment) : DEFAULT_VIEW;
  const params = {};
  for (const [key, value] of new URLSearchParams(loc.search)) {
    params[QUERY_KEYS[key] || key] = value;
  }
  return { view, params };
}

export function titleFor(view) {
  const page = VIEW_TITLES[view];
  return page && view !== DEFAULT_VIEW ? `${page} | SWM` : 'SWM (Summoners War Master) - ศูนย์รวมยุทธวิธีกิลด์วอร์ & สารานุกรมมอนสเตอร์';
}
