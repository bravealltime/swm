// SWM Persistent Storage Service using Browser IndexedDB
// Provides GB-scale zero-cost offline storage for SWEX profiles, runes, and Real-Time Guild War data.

const DB_NAME = 'swm_intelligence_db';
const DB_VERSION = 1;
const STORE_USER_BOX = 'user_box';
const STORE_GUILD_WAR = 'guild_war';
const STORE_CUSTOM_BUILDS = 'custom_builds';

let dbInstance = null;
const broadcast = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('swm_live_sync_channel')
  : null;

function openDB() {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_USER_BOX)) {
        db.createObjectStore(STORE_USER_BOX, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_GUILD_WAR)) {
        db.createObjectStore(STORE_GUILD_WAR, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_CUSTOM_BUILDS)) {
        db.createObjectStore(STORE_CUSTOM_BUILDS, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

// Generic Put
async function putItem(storeName, item) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(item);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

// Generic Get
async function getItem(storeName, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

// Generic Delete
async function deleteItem(storeName, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(key);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

// ================= USER BOX API =================
export async function saveUserBoxToDB(boxData) {
  try {
    const item = {
      id: 'current_profile',
      ...boxData,
      updatedAt: Date.now(),
    };
    await putItem(STORE_USER_BOX, item);

    // Also mirror into localStorage for instant synchronous boots if small enough
    try {
      localStorage.setItem('swm:mybox', JSON.stringify({
        wizard: boxData.wizard,
        units: boxData.units,
        runes: boxData.runes?.slice(0, 1500), // compact mirror
        importedAt: boxData.importedAt,
        version: boxData.version,
      }));
    } catch {
      // quota exceeded in localStorage is fine since IndexedDB has everything
    }

    if (broadcast) {
      broadcast.postMessage({ type: 'BOX_UPDATED', timestamp: Date.now() });
    }
    return true;
  } catch (err) {
    console.error('Failed to save user box to IndexedDB:', err);
    return false;
  }
}

export async function loadUserBoxFromDB() {
  try {
    const data = await getItem(STORE_USER_BOX, 'current_profile');
    if (data) return data;
  } catch (err) {
    console.warn('IndexedDB read failed, trying localStorage fallback:', err);
  }

  // Fallback to localStorage
  try {
    const raw = localStorage.getItem('swm:mybox');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function clearUserBoxFromDB() {
  try {
    await deleteItem(STORE_USER_BOX, 'current_profile');
    localStorage.removeItem('swm:mybox');
    if (broadcast) {
      broadcast.postMessage({ type: 'BOX_CLEARED', timestamp: Date.now() });
    }
    return true;
  } catch (err) {
    console.error('Failed to clear user box:', err);
    return false;
  }
}

// ================= GUILD WAR ROOM API =================
export async function saveGuildWarState(warState) {
  try {
    const item = {
      id: 'active_siege_war',
      ...warState,
      updatedAt: Date.now(),
    };
    await putItem(STORE_GUILD_WAR, item);
    if (broadcast) {
      broadcast.postMessage({ type: 'GUILD_WAR_UPDATED', data: item, timestamp: Date.now() });
    }
    return true;
  } catch (err) {
    console.error('Failed to save guild war state:', err);
    return false;
  }
}

export async function loadGuildWarState() {
  try {
    return await getItem(STORE_GUILD_WAR, 'active_siege_war');
  } catch (err) {
    console.error('Failed to load guild war state:', err);
    return null;
  }
}

// Subscribe to real-time events across browser tabs/windows
export function subscribeToSync(onMessage) {
  if (!broadcast) return () => {};
  const handler = (event) => onMessage(event.data);
  broadcast.addEventListener('message', handler);
  return () => broadcast.removeEventListener('message', handler);
}

// ================= BACKUP & RESTORE =================
export async function exportAllDataAsJSON() {
  const box = await loadUserBoxFromDB();
  const war = await loadGuildWarState();

  const backup = {
    app: 'SWM Intelligence Platform',
    exportedAt: new Date().toISOString(),
    userBox: box,
    guildWar: war,
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SWM_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importDataFromJSON(jsonString) {
  const parsed = JSON.parse(jsonString);
  if (parsed.userBox) {
    await saveUserBoxToDB(parsed.userBox);
  }
  if (parsed.guildWar) {
    await saveGuildWarState(parsed.guildWar);
  }
  return true;
}
