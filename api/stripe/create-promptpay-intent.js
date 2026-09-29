// Vercel Serverless Function: Create Direct PromptPay PaymentIntent
// Generates official Thai PromptPay Dynamic QR code for in-modal scan & pay

import { getStripe } from '../_lib/stripe.js';
import { loadEnv } from '../_lib/ai.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
  }

  try {
    loadEnv();
    const stripe = getStripe();
    const {
      planId = 'monthly',
      userId = '',
      userEmail = '',
    } = req.body || {};

    const isGuild = planId === 'guild';
    const tier = isGuild ? 'guild' : 'vip';
    const amountThb = isGuild ? 24900 : 9900; // ฿249 or ฿99 in satang
    const planTitle = isGuild ? 'SWM Guild Master & Pro (30 วัน)' : 'SWM VIP Member (30 วัน)';

    // Create and confirm PromptPay PaymentIntent immediately to generate dynamic QR
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountThb,
      currency: 'thb',
      payment_method_types: ['promptpay'],
      payment_method_data: {
        type: 'promptpay',
        billing_details: {
          email: userEmail || 'gamer@swm.local',
        },
      },
      confirm: true,
      return_url: 'https://swm-blue.vercel.app',
      metadata: {
        userId,
        planId,
        tier,
        planTitle,
        durationDays: '30',
        app: 'swm',
      },
    });

    const qrData = paymentIntent.next_action?.promptpay_display_qr_code;

    return res.status(200).json({
      ok: true,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      status: paymentIntent.status,
      amountThb: amountThb / 100,
      planId,
      tier,
      planTitle,
      qrSvgUrl: qrData?.image_url_svg || null,
      qrPngUrl: qrData?.image_url_png || null,
      qrPayload: qrData?.data || null,
      hostedInstructionsUrl: qrData?.hosted_instructions_url || null,
      createdAt: Date.now(),
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 mins expiry
    });
  } catch (err) {
    console.error('Error creating PromptPay intent:', err);
    return res.status(500).json({
      ok: false,
      error: 'PROMPTPAY_INTENT_ERROR',
      message: err.message || 'ไม่สามารถสร้าง PromptPay QR Code ได้',
    });
  }
}
