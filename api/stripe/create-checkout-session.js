// Vercel Serverless Function: Create Stripe Checkout Session
// Supports: Payments, Subscriptions (Billing), Automatic Tax & Invoicing

import { getStripe, STRIPE_PRICES } from '../_lib/stripe.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' });
  }

  try {
    const stripe = getStripe();
    const { planId = 'monthly', userId = '', userEmail = '', returnUrl = '' } = req.body || {};

    const priceId = STRIPE_PRICES[planId] || STRIPE_PRICES.monthly;
    if (!priceId) {
      return res.status(400).json({ error: 'INVALID_PLAN', message: `Price ID not configured for plan: ${planId}` });
    }

    // Determine host origin for redirect
    const origin = returnUrl
      ? new URL(returnUrl).origin
      : req.headers.origin || req.headers.referer || 'https://swm-blue.vercel.app';

    const tier = planId === 'guild' ? 'guild' : 'vip';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      // Automated Tax Calculation (Stripe Tax, enabled if supported in merchant country)
      ...(process.env.STRIPE_ENABLE_TAX === 'true' ? { automatic_tax: { enabled: true } } : {}),
      // Invoicing & B2B Tax ID support
      tax_id_collection: {
        enabled: true,
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      customer_email: userEmail || undefined,
      client_reference_id: userId || undefined,
      metadata: {
        userId,
        planId,
        tier,
      },
      subscription_data: {
        metadata: {
          userId,
          planId,
          tier,
        },
      },
      success_url: `${origin}/?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?payment_canceled=true`,
    });

    return res.status(200).json({
      ok: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (err) {
    console.error('Error creating Stripe Checkout Session:', err);
    return res.status(500).json({
      error: 'STRIPE_SESSION_ERROR',
      message: err.message || 'Failed to create checkout session',
    });
  }
}
