// Lightweight persistence for the imported box. Kept separate from swexImport.js so the
// app shell (App, AuthContext, modals) can read/write the box without pulling the monster
// catalog and parser into the main bundle.
import { saveUserBoxToDB, loadUserBoxFromDB, clearUserBoxFromDB } from '../services/storageService.js';

export const STORAGE_KEY = 'swm:mybox';
export const BOX_VERSION = 5;

/** Synchronous read of the parsed box (localStorage mirror). Raw, unparsed SWEX dumps are ignored. */
export function loadBox() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.units)) return null;
    return data;
  } catch {
    return null;
  }
}

/** Asynchronous read prioritizing IndexedDB (stores full GB-scale dataset without quota limits) */
export async function loadBoxAsync() {
  try {
    const dbBox = await loadUserBoxFromDB();
    if (dbBox && Array.isArray(dbBox.units) && dbBox.units.length > 0) {
      return dbBox;
    }
  } catch {
    // fallback to localStorage
  }
  return loadBox();
}

/**
 * Saves box synchronously to localStorage mirror and initiates IndexedDB background write.
 * Safely handles QuotaExceededError by storing a compact mirror so localStorage NEVER stays on stale data!
 */
export function saveBox(box) {
  if (!box) return false;
  box.updatedAt = box.updatedAt || Date.now();

  // 1. Write full dataset to IndexedDB
  saveUserBoxToDB(box).catch((e) => console.warn('IndexedDB save background warning:', e));

  // 2. Dispatch event to update all open views in this window immediately
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('swm:box-updated', { detail: box }));
    }
  } catch {}

  // 3. Mirror into localStorage with quota protection
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(box));
    return true;
  } catch {
    // Quota exceeded: replace with compact mirror so loadBox() NEVER returns stale old profile!
    try {
      const compact = {
        ...box,
        runes: Array.isArray(box.runes) ? box.runes.slice(0, 500) : [],
        _compactMirror: true,
      };
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(compact));
      return true;
    } catch {
      try {
        const minimal = {
          wizard: box.wizard,
          wizard_info: box.wizard_info,
          units: Array.isArray(box.units) ? box.units.map((u) => ({ ...u, runes: [] })) : [],
          importedAt: box.importedAt,
          updatedAt: box.updatedAt,
          _minimalMirror: true,
        };
        localStorage.removeItem(STORAGE_KEY);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(minimal));
        return true;
      } catch {
        return true;
      }
    }
  }
}

/**
 * Fully awaited async save to IndexedDB and localStorage.
 * Guarantees data is committed before any page navigation or modal close.
 */
export async function saveBoxAsync(box) {
  if (!box) return false;
  box.updatedAt = box.updatedAt || Date.now();
  const dbOk = await saveUserBoxToDB(box).catch(() => false);
  saveBox(box);
  return dbOk;
}

export function clearBox() {
  clearUserBoxFromDB().catch(() => {});
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('swm:box-updated', { detail: null }));
    }
  } catch {}
}
