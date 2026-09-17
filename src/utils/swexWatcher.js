// Watches the SWEX "Files" folder with the File System Access API so a fresh export is
// picked up automatically. Chromium desktop only (Chrome / Edge); other browsers keep the
// manual import. The directory handle is persisted in IndexedDB — the browser still asks
// the user to re-confirm read access after a restart, which requires a click.

const DB_NAME = 'swm-fs';
const STORE = 'handles';
const KEY = 'swex-dir';

export const supportsFolderWatch = () => typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore(mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    const req = fn(store);
    tx.oncomplete = () => resolve(req?.result);
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadDirHandle() {
  try {
    return (await withStore('readonly', (s) => s.get(KEY))) || null;
  } catch {
    return null;
  }
}

export async function saveDirHandle(handle) {
  try {
    await withStore('readwrite', (s) => s.put(handle, KEY));
  } catch {
    // IndexedDB unavailable — watching still works for this session
  }
}

export async function clearDirHandle() {
  try {
    await withStore('readwrite', (s) => s.delete(KEY));
  } catch {
    // ignore
  }
}

/** Opens the folder picker (must be called from a click). */
export async function pickSwexFolder() {
  const handle = await window.showDirectoryPicker({ id: 'swex-files', mode: 'read' });
  await saveDirHandle(handle);
  return handle;
}

/** true when we can read the folder; `request` triggers the permission prompt (needs a click). */
export async function ensurePermission(handle, { request = false } = {}) {
  if (!handle) return false;
  const opts = { mode: 'read' };
  if ((await handle.queryPermission(opts)) === 'granted') return true;
  if (!request) return false;
  return (await handle.requestPermission(opts)) === 'granted';
}

/** The most recently modified *.json in the folder (SWEX writes one per account). */
export async function findNewestExport(handle) {
  let newest = null;
  for await (const [name, entry] of handle.entries()) {
    if (entry.kind !== 'file' || !/\.json$/i.test(name)) continue;
    const file = await entry.getFile();
    if (!newest || file.lastModified > newest.lastModified) newest = { name, file, lastModified: file.lastModified };
  }
  return newest;
}
