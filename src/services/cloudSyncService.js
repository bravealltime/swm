// Service for True 24/7 Global Cloud Sync (No Desktop PC Needed)
// Uses Supabase Storage (public CDN) + Vercel Serverless API (/api/cloud-sync)
// Allows accessing user's box, runes, and teams on mobile devices anywhere via 4G/5G.

import { saveBox, loadBox } from '../utils/boxStorage.js';
import { parseSwexExport } from '../utils/swexImport.js';

export const SUPABASE_STORAGE_CDN = 'https://cpcuyhfjnbpjvfdedspa.supabase.co/storage/v1/object/public/swm-cloud/profiles/';

export function sanitizeKey(key) {
  let clean = String(key || '').trim().toLowerCase();
  // If a full URL is passed, extract ?sync= parameter
  if (clean.includes('sync=')) {
    try {
      const u = new URL(clean, 'https://swm-blue.vercel.app');
      clean = u.searchParams.get('sync') || clean;
    } catch {
      const match = clean.match(/sync=([^&#\s]+)/i);
      if (match) clean = match[1];
    }
  }
  return clean.replace(/[^a-z0-9_-]/g, '').slice(0, 50);
}

export function getShareUrl(keyOrWizardName) {
  const clean = sanitizeKey(keyOrWizardName);
  const base = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'https://swm-blue.vercel.app';
  return `${base}/?sync=${clean}`;
}

export function getQrCodeUrl(url) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=10&data=${encodeURIComponent(url)}`;
}

/**
 * Upload active box to Cloud Storage for 24/7 global mobile access.
 */
export async function pushBoxToCloud(box, customPasskey) {
  if (!box || (!box.units && !box.unit_list)) {
    return { ok: false, error: 'NO_BOX_DATA', message: 'ไม่พบข้อมูลไอดีในเครื่อง กรุณานำเข้าไฟล์ก่อน' };
  }

  const wizardName = box.wizard?.name || box.wizard_info?.wizard_name || 'guest';
  const wizardId = box.wizard?.idHint || box.wizard_info?.wizard_id || '';
  const passkey = (customPasskey || `${wizardName.toUpperCase()}-${String(wizardId).slice(-4) || '6961'}`).trim();
  const primaryKey = sanitizeKey(wizardName);

  try {
    const res = await fetch('/api/cloud-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ box, passkey, key: primaryKey }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }

    const data = await res.json();

    // Mark box as synced
    const updatedBox = { ...box, cloudSync: { syncedAt: new Date().toISOString(), passkey, key: primaryKey } };
    saveBox(updatedBox);

    return {
      ok: true,
      primaryKey,
      passkey,
      publicUrl: data.publicUrl || `${SUPABASE_STORAGE_CDN}${primaryKey}.json`,
      shareUrl: getShareUrl(primaryKey),
      unitsCount: data.unitsCount || box.units?.length || 0,
      updatedAt: data.updatedAt,
    };
  } catch (err) {
    return { ok: false, error: err.message, message: 'บันทึกขึ้นคลาวด์ไม่สำเร็จ: ' + err.message };
  }
}

/**
 * Download box from Cloud Storage without needing desktop PC or local server.
 */
export async function pullBoxFromCloud(targetKey) {
  const clean = sanitizeKey(targetKey);
  if (!clean) {
    return { ok: false, error: 'EMPTY_KEY', message: 'กรุณากรอกชื่อไอดีหรือ Passkey' };
  }

  const candidates = [
    // 1. Direct public Supabase Storage CDN (instant ~50ms, works anywhere on mobile 4G/5G)
    `${SUPABASE_STORAGE_CDN}${clean}.json`,
  ];

  // If clean key has hyphen (e.g. pedictu-6961), also try prefix (pedictu)
  if (clean.includes('-')) {
    const prefix = clean.split('-')[0];
    if (prefix) candidates.push(`${SUPABASE_STORAGE_CDN}${prefix}.json`);
  }

  // 2. Serverless API fallback
  candidates.push(`/api/cloud-sync?key=${encodeURIComponent(clean)}`);

  // 3. Dev LAN fallback
  candidates.push(`/api/profile/${encodeURIComponent(clean)}`);

  let fetchedData = null;
  let lastError = null;

  for (const url of candidates) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json && (json.units || json.unit_list || json.wizard || json.wizard_info)) {
          fetchedData = json;
          break;
        }
      }
    } catch (err) {
      lastError = err;
    }
  }

  if (!fetchedData) {
    return {
      ok: false,
      error: 'NOT_FOUND',
      message: `ไม่พบข้อมูลไอดี "${clean}" บนระบบคลาวด์ กรุณาตรวจสอบรหัส Sync Key หรืออัปเดตจากคอมพิวเตอร์ก่อน`,
    };
  }

  try {
    // Parse using swexImport into standard shape
    const parsed = parseSwexExport(fetchedData);
    if (!parsed || !parsed.units || parsed.units.length === 0) {
      return { ok: false, error: 'EMPTY_UNITS', message: 'ไฟล์ข้อมูลไอดีบนคลาวด์ไม่มีมอนสเตอร์' };
    }

    saveBox(parsed);
    return {
      ok: true,
      box: parsed,
      wizardName: parsed.wizard?.name || clean,
      unitsCount: parsed.units.length,
      runesCount: parsed.runes?.length || 0,
      decksCount: parsed.decks?.length || 0,
    };
  } catch (err) {
    return { ok: false, error: err.message, message: 'ประมวลผลข้อมูลไอดีไม่สำเร็จ: ' + err.message };
  }
}
