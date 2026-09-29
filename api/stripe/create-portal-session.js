// Vercel Serverless Function: Create Stripe Customer Billing Portal Session
// Allows customers to manage payment methods, download invoices & cancel/resume subscriptions

import { getStripe } from '../_lib/stripe.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' });
  }

  try {
    const stripe = getStripe();
    const { customerId, returnUrl } = req.body || {};

    if (!customerId) {
      return res.status(400).json({ error: 'MISSING_CUSTOMER_ID', message: 'Stripe Customer ID is required' });
    }

    const origin = returnUrl
      ? new URL(returnUrl).origin
      : req.headers.origin || req.headers.referer || 'https://swm-blue.vercel.app';

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/`,
    });

    return res.status(200).json({
      ok: true,
      url: session.url,
    });
  } catch (err) {
    console.error('Error creating Stripe Portal Session:', err);
    return res.status(500).json({
      error: 'PORTAL_SESSION_ERROR',
      message: err.message || 'Failed to create billing portal session',
    });
  }
}
