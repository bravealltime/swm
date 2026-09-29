// Vercel Serverless Function: Create Stripe Checkout Session
// Supports: PromptPay Dynamic QR Code, Credit/Debit Cards, Apple Pay, Google Pay, Invoicing & Tax

import { getStripe, STRIPE_PRICES } from '../_lib/stripe.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' });
  }

  try {
    const stripe = getStripe();
    const {
      planId = 'monthly',
      userId = '',
      userEmail = '',
      returnUrl = '',
      recurring = false, // false = One-time 30 days with PromptPay QR + Card; true = Auto-renew subscription (Card only)
    } = req.body || {};

    const origin = returnUrl
      ? new URL(returnUrl).origin
      : req.headers.origin || req.headers.referer || 'https://swm-blue.vercel.app';

    const isGuild = planId === 'guild';
    const tier = isGuild ? 'guild' : 'vip';
    const amountThb = isGuild ? 24900 : 9900; // ฿249 or ฿99 in satang
    const planTitle = isGuild ? 'SWM Guild Master & Pro (30 วัน)' : 'SWM VIP Member (30 วัน)';
    const planDesc = isGuild
      ? 'สิทธิ์ระดับสูงสำหรับหัวหน้ากิลด์และทีมแข่ง (War Room สด 30 คน)'
      : 'ปลดล็อกระบบฟาร์มสด, Siege 10 ทีมบุก, สถิติ RTA และการ์ด TCG';

    let session;

    if (recurring) {
      // Recurring Subscription mode (Card only, auto-renew every month)
      const priceId = STRIPE_PRICES[planId] || STRIPE_PRICES.monthly;
      session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        ...(process.env.STRIPE_ENABLE_TAX === 'true' ? { automatic_tax: { enabled: true } } : {}),
        tax_id_collection: { enabled: true },
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
        customer_email: userEmail || undefined,
        client_reference_id: userId || undefined,
        metadata: { userId, planId, tier, type: 'subscription' },
        subscription_data: {
          metadata: { userId, planId, tier },
        },
        success_url: `${origin}/?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/?payment_canceled=true`,
      });
    } else {
      // Payment mode with Dynamic PromptPay QR Code + Card (30-day VIP access)
      // Any Thai mobile banking app can scan and pay!
      session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['promptpay', 'card'],
        line_items: [
          {
            price_data: {
              currency: 'thb',
              product_data: {
                name: planTitle,
                description: planDesc,
                metadata: { tier, app: 'swm' },
              },
              unit_amount: amountThb,
            },
            quantity: 1,
          },
        ],
        ...(process.env.STRIPE_ENABLE_TAX === 'true' ? { automatic_tax: { enabled: true } } : {}),
        tax_id_collection: { enabled: true },
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
        customer_email: userEmail || undefined,
        client_reference_id: userId || undefined,
        metadata: {
          userId,
          planId,
          tier,
          durationDays: '30',
          type: 'promptpay_checkout',
        },
        success_url: `${origin}/?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/?payment_canceled=true`,
      });
    }

    return res.status(200).json({
      ok: true,
      url: session.url,
      sessionId: session.id,
      paymentMethodTypes: session.payment_method_types,
    });
  } catch (err) {
    console.error('Error creating Stripe Checkout Session:', err);
    return res.status(500).json({
      error: 'STRIPE_SESSION_ERROR',
      message: err.message || 'Failed to create checkout session',
    });
  }
}
