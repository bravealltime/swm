import { describe, it, expect } from 'vitest';
import {
  calculateGachaProbabilities,
  calculateWishlistOdds,
  calculateSaltIndex,
  calculateTimeline,
} from '../src/utils/gachaPredictor.js';

describe('Gacha Luck Predictor & Wishlist Engine', () => {
  describe('calculateGachaProbabilities', () => {
    it('calculates 100% Nat5 probability when Transcendence scroll is present', () => {
      const inv = { transcendence: 1, mystical: 0, ld: 0 };
      const res = calculateGachaProbabilities(inv);
      expect(res.probAtLeastOneNat5).toBe(100);
    });

    it('calculates cumulative Nat5 and LD5 odds accurately using binomial distribution', () => {
      // 200 MS (rate 0.5% each) -> 1 - (1 - 0.005)^200 ≈ 63.3%
      const inv = { mystical: 200, ld: 20 };
      const res = calculateGachaProbabilities(inv);

      expect(res.probAtLeastOneNat5).toBeGreaterThanOrEqual(60);
      expect(res.probAtLeastOneNat5).toBeLessThanOrEqual(65);

      // 20 LD (rate 0.35% each) -> 1 - (1 - 0.0035)^20 ≈ 6.8%
      expect(res.probAtLeastOneLd5).toBeGreaterThan(6.0);
      expect(res.probAtLeastOneLd5).toBeLessThan(7.5);
    });

    it('handles empty inventory without error', () => {
      const res = calculateGachaProbabilities({});
      expect(res.totalSummons).toBe(0);
      expect(res.probAtLeastOneNat5).toBe(0);
      expect(res.probAtLeastOneLd5).toBe(0);
      expect(res.totalValueThb).toBe(0);
    });
  });

  describe('calculateWishlistOdds', () => {
    it('calculates specific single dream monster odds', () => {
      const inv = { ld: 100 };
      const res = calculateWishlistOdds(inv, 110);

      expect(Number(res.probSpecificPercent)).toBeGreaterThan(0);
      expect(res.oneInX).toBeGreaterThan(25000);
      expect(res.totalLdSummons).toBe(100);
    });
  });

  describe('calculateSaltIndex', () => {
    it('identifies extreme dryness above 800 scrolls', () => {
      const res = calculateSaltIndex(850);
      expect(res.grade).toContain('มหากาพย์');
      expect(res.unluckierThanPercent).toBeGreaterThanOrEqual(94);
    });

    it('identifies normal range for under 150 scrolls', () => {
      const res = calculateSaltIndex(50);
      expect(res.grade).toContain('ปกติ');
      expect(res.unluckierThanPercent).toBeLessThan(50);
    });
  });

  describe('calculateTimeline', () => {
    it('estimates remaining days and projected date based on monthly income', () => {
      const currentLd = 18;
      const monthlyPace = 15; // 15 scrolls per month
      const res = calculateTimeline(currentLd, monthlyPace);

      expect(res.target50Scrolls).toBe(198);
      expect(res.remainingTo50).toBe(180); // 198 - 18
      expect(res.monthsTo50).toBe(12);     // 180 / 15 = 12 months
      expect(res.targetDateThai).toBeDefined();
    });
  });
});
