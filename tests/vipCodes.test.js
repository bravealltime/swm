import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getVipPromoCodes,
  saveVipPromoCode,
  deleteVipPromoCode,
  redeemVipPromoCode,
  DEFAULT_SETTINGS,
} from '../api/_lib/admin.js';

describe('VIP Promo & Trial Codes', () => {
  it('retrieves default VIP promo codes', async () => {
    const res = await getVipPromoCodes();
    expect(res.ok).toBe(true);
    expect(Array.isArray(res.codes)).toBe(true);
    expect(res.codes.some((c) => c.code === 'VIP3DAY')).toBe(true);
  });

  it('validates code name requirements', async () => {
    const emptyRes = await saveVipPromoCode({ code: '' });
    expect(emptyRes.ok).toBe(false);
    expect(emptyRes.error).toContain('กรุณาระบุรหัสโค้ด');

    const shortRes = await saveVipPromoCode({ code: 'AB' });
    expect(shortRes.ok).toBe(false);
    expect(shortRes.error).toContain('3 ตัวอักษร');
  });

  it('saves and deletes a new VIP promo code', async () => {
    const saveRes = await saveVipPromoCode({
      code: 'TEST7DAY',
      days: 7,
      maxUses: 10,
    }, 'admin@swm.local');

    expect(saveRes.ok).toBe(true);
    expect(saveRes.code.code).toBe('TEST7DAY');
    expect(saveRes.code.days).toBe(7);

    const deleteRes = await deleteVipPromoCode('TEST7DAY', 'admin@swm.local');
    expect(deleteRes.ok).toBe(true);
  });

  it('redeems VIP promo code correctly and rejects invalid code', async () => {
    // Missing code
    const missingRes = await redeemVipPromoCode({ code: '', userId: 'user-1' });
    expect(missingRes.ok).toBe(false);

    // Missing user
    const noUserRes = await redeemVipPromoCode({ code: 'VIP3DAY', userId: '' });
    expect(noUserRes.ok).toBe(false);

    // Invalid non-existent code
    const invalidRes = await redeemVipPromoCode({ code: 'UNKNOWN_CODE', userId: 'user-1' });
    expect(invalidRes.ok).toBe(false);
    expect(invalidRes.error).toContain('ไม่พบโค้ด');

    // Valid code in mock environment with unique user
    const testUid = `test-trial-${Date.now()}`;
    const validRes = await redeemVipPromoCode({ code: 'VIP3DAY', userId: testUid, userEmail: 'test@swm.local' });
    expect(validRes.ok).toBe(true);
    expect(validRes.days).toBe(3);
    expect(validRes.expiresAt).toBeDefined();

    // Prevent duplicate redemption by same user
    const duplicateRes = await redeemVipPromoCode({ code: 'VIP3DAY', userId: testUid, userEmail: 'test@swm.local' });
    expect(duplicateRes.ok).toBe(false);
    expect(duplicateRes.error).toContain('เคยใช้สิทธิ์โค้ด');
  });
});
