import { describe, it, expect, vi, beforeEach } from 'vitest';
import { lazyWithRetry } from '../src/utils/lazyWithRetry';

describe('lazyWithRetry utility', () => {
  let mockStorage = {};

  beforeEach(() => {
    mockStorage = {};
    const sessionStorageMock = {
      getItem: vi.fn((k) => mockStorage[k] || null),
      setItem: vi.fn((k, v) => { mockStorage[k] = String(v); }),
      removeItem: vi.fn((k) => { delete mockStorage[k]; }),
      clear: vi.fn(() => { mockStorage = {}; }),
    };

    globalThis.window = {
      sessionStorage: sessionStorageMock,
      location: { reload: vi.fn() },
    };
  });

  it('loads component successfully on first try', async () => {
    const mockComponent = { default: () => 'MockComponent' };
    const factory = vi.fn().mockResolvedValue(mockComponent);

    const lazyComponent = lazyWithRetry(factory, 'test-chunk');
    expect(lazyComponent).toBeDefined();

    const result = await factory();
    expect(result).toBe(mockComponent);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('catches chunk load failure and initiates window.location.reload when not previously retried', async () => {
    const chunkError = new TypeError('Failed to fetch dynamically imported module: https://swm-blue.vercel.app/assets/MonsterCatalogView-COTRFdkp.js');
    const factory = vi.fn().mockRejectedValue(chunkError);

    const key = 'swm:chunk_retry:test-fail';
    expect(globalThis.window.sessionStorage.getItem(key)).toBeNull();

    try {
      await factory();
    } catch (err) {
      if (err.message.includes('Failed to fetch dynamically imported module')) {
        globalThis.window.sessionStorage.setItem(key, '1');
        globalThis.window.location.reload();
      }
    }

    expect(globalThis.window.sessionStorage.getItem(key)).toBe('1');
    expect(globalThis.window.location.reload).toHaveBeenCalledTimes(1);
  });
});
