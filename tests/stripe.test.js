import { describe, it, expect } from 'vitest';
import { STRIPE_PRICES } from '../api/_lib/stripe.js';

describe('Stripe Configuration & Products', () => {
  it('has valid Stripe Price IDs configured for VIP and Guild tiers', () => {
    expect(STRIPE_PRICES.monthly).toBeDefined();
    expect(STRIPE_PRICES.monthly.startsWith('price_')).toBe(true);
    expect(STRIPE_PRICES.guild).toBeDefined();
    expect(STRIPE_PRICES.guild.startsWith('price_')).toBe(true);
  });

  it('maps monthly and vip to the same price ID', () => {
    expect(STRIPE_PRICES.monthly).toEqual(STRIPE_PRICES.vip);
  });

  it('provides distinct price IDs for VIP (99 THB) vs Guild (249 THB)', () => {
    expect(STRIPE_PRICES.monthly).not.toEqual(STRIPE_PRICES.guild);
  });
});
