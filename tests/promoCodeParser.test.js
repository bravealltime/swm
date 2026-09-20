import { describe, it, expect } from 'vitest';
import { extractPromoCode, normalizeRewardText, parsePromoInput, QUICK_REWARD_PRESETS } from '../src/utils/promoCodeParser.js';

describe('promoCodeParser', () => {
  describe('extractPromoCode', () => {
    it('extracts code from standard http withhive url', () => {
      expect(extractPromoCode('http://withhive.me/313/S38L3GENDLEGGO')).toBe('S38L3GENDLEGGO');
    });

    it('extracts code from https withhive url with trailing slash', () => {
      expect(extractPromoCode('https://withhive.me/313/S38L3GENDLEGGO/')).toBe('S38L3GENDLEGGO');
    });

    it('extracts code when user pasted full url into uppercase string', () => {
      expect(extractPromoCode('HTTP://WITHHIVE.ME/313/S38L3GENDLEGGO')).toBe('S38L3GENDLEGGO');
    });

    it('extracts code from swq url', () => {
      expect(extractPromoCode('https://swq.jp/l/?s=S38L3GENDLEGGO')).toBe('S38L3GENDLEGGO');
    });

    it('extracts code from query param', () => {
      expect(extractPromoCode('https://example.com/redeem?code=SW2026GIFT')).toBe('SW2026GIFT');
    });

    it('handles raw code directly', () => {
      expect(extractPromoCode('  sw2026gift  ')).toBe('SW2026GIFT');
    });
  });

  describe('normalizeRewardText', () => {
    it('translates English energy & mystical scroll keywords to Thai standard format', () => {
      const result = normalizeRewardText('Energy x100, Mystical Scroll x5');
      expect(result).toBe('พลังงาน (Energy) x100, คัมภีร์เวทมนตร์ (Mystical Scroll) x5');
    });

    it('translates abbreviations like 500k mana, 40 summoning stones', () => {
      const result = normalizeRewardText('40 Summoning Stones, 500,000 Mana Stones');
      expect(result).toBe('หินซัมมอนพิเศษ (Summoning Stones) x40, หินมานา (Mana Stones) x500,000');
    });

    it('cleans leading label keywords like ของรางวัล: or Rewards:', () => {
      const result = normalizeRewardText('ของรางวัล: พลังงาน x100, คัมภีร์เวทมนตร์ x5');
      expect(result).toBe('พลังงาน (Energy) x100, คัมภีร์เวทมนตร์ (Mystical Scroll) x5');
    });
  });

  describe('parsePromoInput', () => {
    it('extracts both code and rewards when pasted together from social media', () => {
      const parsed = parsePromoInput('http://withhive.me/313/S38L3GENDLEGGO (Energy x100, 5 Mystical Scrolls)');
      expect(parsed.code).toBe('S38L3GENDLEGGO');
      expect(parsed.rewardsText).toBe('พลังงาน (Energy) x100, คัมภีร์เวทมนตร์ (Mystical Scroll) x5');
    });

    it('extracts code from plain withhive url and leaves rewards empty', () => {
      const parsed = parsePromoInput('http://withhive.me/313/S38L3GENDLEGGO');
      expect(parsed.code).toBe('S38L3GENDLEGGO');
      expect(parsed.rewardsText).toBe('');
    });

    it('extracts code and rewards from colon separated string', () => {
      const parsed = parsePromoInput('S38L3GENDLEGGO : 100 Energy, 5 MS');
      expect(parsed.code).toBe('S38L3GENDLEGGO');
      expect(parsed.rewardsText).toContain('พลังงาน (Energy)');
    });
  });

  describe('QUICK_REWARD_PRESETS', () => {
    it('provides standard reward presets', () => {
      expect(QUICK_REWARD_PRESETS.length).toBeGreaterThanOrEqual(6);
      expect(QUICK_REWARD_PRESETS.some(p => p.text.includes('พลังงาน'))).toBe(true);
      expect(QUICK_REWARD_PRESETS.some(p => p.text.includes('คัมภีร์เวทมนตร์'))).toBe(true);
    });
  });
});
