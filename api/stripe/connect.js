// Vercel Serverless Function: Stripe Connect Express Onboarding
// Enables Guild Masters, Tournament Winners, and Coaches to receive payouts

import { getStripe } from '../_lib/stripe.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }

  try {
    const stripe = getStripe();
    const { userId, email, country = 'TH', returnUrl } = req.body || {};

    const origin = returnUrl
      ? new URL(returnUrl).origin
      : req.headers.origin || req.headers.referer || 'https://swm-blue.vercel.app';

    // 1. Create a Connect Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country,
      email: email || undefined,
      capabilities: {
        transfers: { requested: true },
      },
      business_type: 'individual',
      metadata: {
        userId: userId || '',
        platform: 'swm',
      },
    });

    // 2. Generate the hosted onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${origin}/?connect_refresh=true`,
      return_url: `${origin}/?connect_success=true&account_id=${account.id}`,
      type: 'account_onboarding',
    });

    return res.status(200).json({
      ok: true,
      accountId: account.id,
      url: accountLink.url,
    });
  } catch (err) {
    console.error('Error creating Stripe Connect onboarding link:', err);
    return res.status(500).json({
      error: 'CONNECT_ERROR',
      message: err.message || 'Failed to create Connect account link',
    });
  }
}
