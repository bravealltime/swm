// Helpers shared by MyBoxView and the tab components in this folder.
import allMonstersData from '../../data/allMonsters.json';
import { buildMonsterIndex } from '../../data/swrtPlayerAdapter';

export const MONSTER_INDEX = buildMonsterIndex(allMonstersData);
export const BY_NAME = new Map(allMonstersData.map((m) => [m.name.toLowerCase(), m]));
export const BY_IMAGE = new Map(allMonstersData.map((m) => [(m.avatarUrl || m.imageUrl || '').split('/').pop(), m]));

// The catalog may only hold the 2A (stage 3) or 1A (stage 1) form of a family — try the siblings
export const monsterOf = (id) => {
  const n = Number(id);
  if (!n) return null;
  const stage = Math.floor(n / 10) % 10;
  const root = n - stage * 10;
  return MONSTER_INDEX.get(n) || MONSTER_INDEX.get(root + 10) || MONSTER_INDEX.get(root + 30) || MONSTER_INDEX.get(root) || null;
};
export const monsterByName = (name) => BY_NAME.get(String(name || '').replace(/\s*\(.*\)$/, '').toLowerCase()) || BY_NAME.get(String(name || '').toLowerCase()) || null;
export const monsterByImage = (url) => BY_IMAGE.get(String(url || '').split('/').pop()) || null;

export const ELEMENT_FILTERS = [['all', 'ทุกธาตุ'], ['water', 'น้ำ'], ['fire', 'ไฟ'], ['wind', 'ลม'], ['light', 'แสง'], ['dark', 'มืด'], ['ld', '✨ แสง-มืด']];
export const ELEMENT_COLOR = { water: 'bg-sky-500', fire: 'bg-rose-500', wind: 'bg-amber-400', light: 'bg-yellow-200', dark: 'bg-purple-500', ld: 'bg-gradient-to-r from-yellow-200 to-purple-500' };
export const ELEMENT_TH = { water: 'น้ำ', fire: 'ไฟ', wind: 'ลม', light: 'แสง', dark: 'มืด', ld: 'แสง-มืด' };

export const card = 'rounded-2xl border border-white/[0.08] bg-[#0a0f19]/80';

// "2026-09-10 21:04" -> "8 วันที่แล้ว"
export function agoLabel(stamp) {
  if (!stamp) return '';
  const t = new Date(stamp.replace(' ', 'T'));
  if (Number.isNaN(t.getTime())) return stamp;
  const days = Math.floor((Date.now() - t.getTime()) / 86400000);
  if (days <= 0) return 'วันนี้';
  if (days === 1) return 'เมื่อวาน';
  if (days < 30) return `${days} วันที่แล้ว`;
  if (days < 365) return `${Math.floor(days / 30)} เดือนที่แล้ว`;
  return `${Math.floor(days / 365)} ปีที่แล้ว`;
}
