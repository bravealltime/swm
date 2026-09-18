// Lightweight persistence for the imported box. Kept separate from swexImport.js so the
// app shell (App, AuthContext, modals) can read/write the box without pulling the monster
// catalog and parser into the main bundle.
import { saveUserBoxToDB, loadUserBoxFromDB, clearUserBoxFromDB } from '../services/storageService';

export const STORAGE_KEY = 'swm:mybox';
export const BOX_VERSION = 4;

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

export async function loadBoxAsync() {
  return await loadUserBoxFromDB();
}

export function saveBox(box) {
  // Fire and forget to IndexedDB for large boxes; localStorage keeps a synchronous mirror
  saveUserBoxToDB(box).catch((e) => console.warn('IndexedDB save background warning:', e));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(box));
    return true;
  } catch {
    // quota exceeded in localStorage — IndexedDB still holds the full dataset
    return true;
  }
}

export function clearBox() {
  clearUserBoxFromDB().catch(() => {});
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
