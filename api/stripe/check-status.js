// Vercel Serverless Function: Check PromptPay / Stripe Payment Status
// Polls status of a PaymentIntent directly and checks for completion

import { getStripe } from '../_lib/stripe.js';
import { loadEnv } from '../_lib/ai.js';

export default async function handler(req, res) {
  const { paymentIntentId } = req.query;

  if (!paymentIntentId) {
    return res.status(400).json({ ok: false, error: 'MISSING_PAYMENT_INTENT_ID' });
  }

  try {
    loadEnv();
    const stripe = getStripe();
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);

    const isPaid = pi.status === 'succeeded';

    return res.status(200).json({
      ok: true,
      paymentIntentId: pi.id,
      status: pi.status,
      isPaid,
      tier: pi.metadata?.tier || 'vip',
      planId: pi.metadata?.planId || 'monthly',
      userId: pi.metadata?.userId || '',
      amountReceived: (pi.amount_received || 0) / 100,
    });
  } catch (err) {
    console.error('Error checking payment intent status:', err);
    return res.status(500).json({
      ok: false,
      error: 'CHECK_STATUS_ERROR',
      message: err.message || 'ไม่สามารถตรวจสอบสถานะการชำระเงินได้',
    });
  }
}
