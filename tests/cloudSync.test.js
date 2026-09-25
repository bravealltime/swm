import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sanitizeKey, getShareUrl, pullBoxFromCloud, pushBoxToCloud, SUPABASE_STORAGE_CDN } from '../src/services/cloudSyncService';

describe('cloudSyncService', () => {
  it('sanitizes keys properly from names and full URLs', () => {
    expect(sanitizeKey('PedictU')).toBe('pedictu');
    expect(sanitizeKey('PEDICTU-6961')).toBe('pedictu-6961');
    expect(sanitizeKey('https://swm-blue.vercel.app/?sync=PedictU')).toBe('pedictu');
    expect(sanitizeKey('https://swm.com/test?other=1&sync=MY_BOX_123#frag')).toBe('my_box_123');
    expect(sanitizeKey('  Hello World! @#$ ')).toBe('helloworld');
  });

  it('generates proper share URL', () => {
    expect(getShareUrl('PedictU')).toContain('/?sync=pedictu');
    expect(getShareUrl('PEDICTU-6961')).toContain('/?sync=pedictu-6961');
  });

  it('pullBoxFromCloud returns error on empty key', async () => {
    const res = await pullBoxFromCloud('');
    expect(res.ok).toBe(false);
    expect(res.error).toBe('EMPTY_KEY');
  });

  it('pullBoxFromCloud parses box and saves to storage on success', async () => {
    const mockBoxData = {
      wizard_info: { wizard_name: 'PedictU', wizard_id: 9326961 },
      unit_list: [
        { unit_id: 1, unit_master_id: 13911, spd: 103, runes: [] },
      ],
    };

    // Mock global fetch to return mockBoxData from Supabase Storage CDN
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockImplementation((url) => {
      if (String(url).includes('pedictu')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockBoxData),
        });
      }
      return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
    });

    try {
      const res = await pullBoxFromCloud('PedictU');
      expect(res.ok).toBe(true);
      expect(res.wizardName).toBe('PedictU');
      expect(res.unitsCount).toBe(1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
