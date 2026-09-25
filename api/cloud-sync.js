// Vercel Serverless Function & Dev API for Global Cloud Profile Sync
// Stores and retrieves SWEX box profiles in Supabase Storage bucket 'swm-cloud'
// Enables 24/7 cross-device mobile access without keeping the desktop PC on.

import { loadEnv } from './_lib/ai.js';

const getEnv = (k) => {
  loadEnv();
  return process.env[k] || '';
};

const getSupabaseConfig = () => {
  const url = (getEnv('VITE_SUPABASE_URL') || getEnv('SUPABASE_URL') || 'https://cpcuyhfjnbpjvfdedspa.supabase.co').replace(/\/+$/, '');
  const serviceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwY3V5aGZqbmJwanZmZGVkc3BhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTcyNDEwMCwiZXhwIjoyMTA1MzAwMTAwfQ.UyvZBwxLVH6QRx3pYF2BwMrDi--cLHKN1Ce-fTL8A7k';
  const anonKey = getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('SUPABASE_ANON_KEY');
  return { url, serviceKey, anonKey };
};

const sanitizeKey = (k) => String(k || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 50);

export async function handleCloudSync({ method, query, body }) {
  const { url, serviceKey } = getSupabaseConfig();

  // POST: Upload box profile to Cloud Storage
  if (method === 'POST') {
    const rawBox = body?.box || body;
    if (!rawBox || (!rawBox.units && !rawBox.unit_list)) {
      return { status: 400, json: { error: 'INVALID_BOX', message: 'ข้อมูลไอดีไม่ถูกต้อง' } };
    }

    const wizardName = rawBox.wizard?.name || rawBox.wizard_info?.wizard_name || 'guest';
    const wizardId = rawBox.wizard?.idHint || rawBox.wizard_info?.wizard_id || '';
    const customPasskey = body?.passkey || `${wizardName.toUpperCase()}-${wizardId.slice(-4) || '6961'}`;

    const keysToSave = new Set([
      sanitizeKey(wizardName),
      sanitizeKey(customPasskey),
      wizardId ? sanitizeKey(`${wizardName}-${wizardId}`) : null,
      wizardId ? sanitizeKey(wizardId) : null,
      body?.key ? sanitizeKey(body.key) : null,
    ].filter(Boolean));

    const payload = JSON.stringify(rawBox);
    const savedKeys = [];

    for (const key of keysToSave) {
      try {
        const uploadRes = await fetch(`${url}/storage/v1/object/swm-cloud/profiles/${key}.json`, {
          method: 'POST',
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
            'x-upsert': 'true',
          },
          body: payload,
        });

        if (uploadRes.ok) {
          savedKeys.push(key);
        } else {
          const errText = await uploadRes.text();
          console.warn(`Failed upload for key ${key}:`, errText);
        }
      } catch (err) {
        console.warn(`Error uploading ${key}:`, err.message);
      }
    }

    if (savedKeys.length === 0) {
      return { status: 500, json: { error: 'UPLOAD_FAILED', message: 'ไม่สามารถบันทึกขึ้น Cloud ได้' } };
    }

    const primaryKey = sanitizeKey(wizardName);
    const publicUrl = `${url}/storage/v1/object/public/swm-cloud/profiles/${primaryKey}.json`;

    return {
      status: 200,
      json: {
        ok: true,
        primaryKey,
        passkey: customPasskey,
        savedKeys,
        publicUrl,
        wizard: wizardName,
        unitsCount: rawBox.units?.length || rawBox.unit_list?.length || 0,
        updatedAt: new Date().toISOString(),
      },
    };
  }

  // GET: Retrieve box profile from Cloud Storage
  if (method === 'GET') {
    const rawKey = query?.key || query?.sync || query?.passkey || '';
    const key = sanitizeKey(rawKey);

    if (!key) {
      return { status: 400, json: { error: 'MISSING_KEY', message: 'ระบุชื่อไอดีหรือ Passkey' } };
    }

    // Try direct public storage
    const storageRes = await fetch(`${url}/storage/v1/object/public/swm-cloud/profiles/${key}.json`);
    if (storageRes.ok) {
      const data = await storageRes.json();
      return {
        status: 200,
        json: data,
        cache: 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600',
      };
    }

    return {
      status: 404,
      json: { error: 'NOT_FOUND', message: `ไม่พบข้อมูลไอดี "${key}" บนระบบคลาวด์` },
      cache: 'public, max-age=30, s-maxage=30',
    };
  }

  return { status: 405, json: { error: 'METHOD_NOT_ALLOWED' } };
}

export default async function handler(req, res) {
  const { status, json, cache } = await handleCloudSync({
    method: req.method,
    query: req.query,
    body: req.body,
  });

  res.setHeader('Cache-Control', cache || 'no-store');
  return res.status(status).json(json);
}
