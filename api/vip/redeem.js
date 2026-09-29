// Vercel Serverless Function: Redeem VIP Trial / Promo Code
// Validates code, grants trial days, and synchronizes expiration with Supabase user metadata

import { userFromToken, redeemVipPromoCode } from '../_lib/admin.js';
import { loadEnv } from '../_lib/ai.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
  }

  loadEnv();

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  const { code, userId: clientUserId, userEmail: clientUserEmail } = req.body || {};

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ ok: false, error: 'กรุณากรอกรหัสโค้ด VIP' });
  }

  let user = null;
  if (token) {
    user = await userFromToken(token);
  }

  // Fallback to client user info if dev or valid
  const targetId = user?.id || clientUserId;
  const targetEmail = user?.email || clientUserEmail || '';

  if (!targetId) {
    return res.status(401).json({
      ok: false,
      error: 'กรุณาเข้าสู่ระบบก่อน เพื่อบันทึกสิทธิ์ VIP เข้าบัญชีของคุณ',
      requireLogin: true,
    });
  }

  try {
    const result = await redeemVipPromoCode({
      code: code.trim(),
      userId: targetId,
      userEmail: targetEmail,
    });

    return res.status(result.ok ? 200 : 400).json(result);
  } catch (err) {
    console.error('Redeem code error:', err);
    return res.status(500).json({
      ok: false,
      error: err.message || 'เกิดข้อผิดพลาดในการแลกสิทธิ์ VIP',
    });
  }
}
