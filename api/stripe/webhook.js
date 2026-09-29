// Vercel Serverless Function: Stripe Webhook Handler
// Handles subscription lifecycles, payments, and synchronizes status with Supabase

import { getStripe } from '../_lib/stripe.js';
import { loadEnv } from '../_lib/ai.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }

  loadEnv();
  const stripe = getStripe();
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    const rawBody = await getRawBody(req);

    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } else {
      // In development or when webhook secret is not set yet, parse raw JSON
      event = JSON.parse(rawBody.toString('utf8'));
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle specific Stripe events
  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const userId = paymentIntent.metadata?.userId;
        const tier = paymentIntent.metadata?.tier || 'vip';
        const durationDays = Number(paymentIntent.metadata?.durationDays) || 30;
        const customerId = paymentIntent.customer;
        console.log(`[Stripe] PromptPay PaymentIntent succeeded for user: ${userId}, Tier: ${tier}, Days: ${durationDays}`);
        await updateUserTier(userId, tier, customerId, null, durationDays);
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.client_reference_id || session.metadata?.userId;
        const tier = session.metadata?.tier || 'vip';
        const durationDays = Number(session.metadata?.durationDays) || 30;
        const customerId = session.customer;
        const subscriptionId = session.subscription;

        console.log(`[Stripe] Checkout completed for user: ${userId}, Tier: ${tier}, Customer: ${customerId}`);
        await updateUserTier(userId, tier, customerId, subscriptionId, durationDays);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        const customerId = invoice.customer;
        console.log(`[Stripe] Invoice payment succeeded for customer ${customerId}, subscription ${subscriptionId}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        const userId = subscription.metadata?.userId;
        console.log(`[Stripe] Subscription canceled for user ${userId}, customer ${customerId}`);
        await updateUserTier(userId, 'free', customerId, null, 0);
        break;
      }

      default:
        console.log(`[Stripe] Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Error handling webhook event:', err);
    return res.status(500).json({ error: 'WEBHOOK_HANDLER_ERROR', message: err.message });
  }
}

export async function updateUserTier(userId, tier, customerId, subscriptionId, durationDays = 30) {
  if (!userId) return;
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cpcuyhfjnbpjvfdedspa.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return;

  try {
    let existingExpiry = null;
    let existingMeta = {};
    try {
      const getRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      });
      if (getRes.ok) {
        const u = await getRes.json();
        existingMeta = u?.user_metadata || {};
        existingExpiry = existingMeta.vip_expires_at ? new Date(existingMeta.vip_expires_at).getTime() : null;
      }
    } catch {}

    const isVip = tier === 'vip' || tier === 'guild' || tier === 'lifetime';
    let vip_expires_at = null;
    if (tier === 'lifetime') {
      vip_expires_at = null;
    } else if (isVip) {
      const days = Number(durationDays) || 30;
      const baseTime = existingExpiry && existingExpiry > Date.now() ? existingExpiry : Date.now();
      vip_expires_at = new Date(baseTime + days * 86400000).toISOString();
    }

    // Update Supabase auth user metadata
    await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_metadata: {
          ...existingMeta,
          tier,
          role: tier === 'free' ? 'user' : tier,
          is_vip: isVip,
          stripe_customer_id: customerId || existingMeta.stripe_customer_id || null,
          stripe_subscription_id: subscriptionId || existingMeta.stripe_subscription_id || null,
          vip_expires_at,
          vip_granted_at: new Date().toISOString(),
          vip_trial: false,
        },
      }),
    });
  } catch (err) {
    console.warn('[Stripe] Could not sync user metadata in Supabase:', err.message);
  }
}
