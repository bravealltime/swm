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
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.client_reference_id || session.metadata?.userId;
        const tier = session.metadata?.tier || 'vip';
        const customerId = session.customer;
        const subscriptionId = session.subscription;

        console.log(`[Stripe] Checkout completed for user: ${userId}, Tier: ${tier}, Customer: ${customerId}`);
        // Synchronize with Supabase if service role key is present
        await updateUserTier(userId, tier, customerId, subscriptionId);
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
        await updateUserTier(userId, 'free', customerId, null);
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

async function updateUserTier(userId, tier, customerId, subscriptionId) {
  if (!userId) return;
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cpcuyhfjnbpjvfdedspa.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return;

  try {
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
          tier,
          role: tier === 'free' ? 'user' : tier,
          is_vip: tier === 'vip' || tier === 'guild',
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
        },
      }),
    });
  } catch (err) {
    console.warn('[Stripe] Could not sync user metadata in Supabase:', err.message);
  }
}
