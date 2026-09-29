// Stripe Helper & Client Configuration
import Stripe from 'stripe';
import { loadEnv } from './ai.js';

let stripeInstance = null;

export function getStripe() {
  if (stripeInstance) return stripeInstance;
  loadEnv();

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }

  stripeInstance = new Stripe(key, {
    apiVersion: '2025-02-24.acacia',
    appInfo: {
      name: 'Summoners War Master (SWM)',
      version: '1.0.0',
      url: 'https://swm-blue.vercel.app',
    },
  });

  return stripeInstance;
}

export const STRIPE_PRICES = {
  monthly: process.env.STRIPE_VIP_PRICE_ID || 'price_1UKr4pLZSk5C1PIDQ0Bvhc8V',
  vip: process.env.STRIPE_VIP_PRICE_ID || 'price_1UKr4pLZSk5C1PIDQ0Bvhc8V',
  guild: process.env.STRIPE_GUILD_PRICE_ID || 'price_1UKr4qLZSk5C1PIDp1D3aj0Q',
};
