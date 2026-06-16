/**
 * Subscriptions API Handler
 * Routes:
 *   POST /api/subscriptions/create - Create subscription
 *   GET /api/subscriptions/:userId - Get user's subscription
 *   POST /api/subscriptions/:userId/upgrade - Upgrade plan
 *   POST /api/subscriptions/:userId/cancel - Cancel subscription
 *   POST /api/subscriptions/webhook - Stripe webhook (with signature verification)
 */

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import {
  createSubscription,
  getActiveSubscription,
  upgradeSubscription,
  cancelSubscription,
  handleStripeWebhook,
} from './subscriptions.js';

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
}

/**
 * Verify Stripe webhook signature
 * 
 * Stripe sends webhooks with a signature header that must be validated to ensure
 * the webhook came from Stripe and hasn't been tampered with.
 * 
 * Signature format: t=<timestamp>,v1=<signature>,v0=<signature>
 * We verify against v1 (current) using HMAC-SHA256
 */
function verifyStripeSignature(req, rawBody) {
  const stripeSignatureHeader = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSignatureHeader) {
    throw new Error('Missing Stripe-Signature header');
  }

  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET environment variable not configured');
  }

  if (!rawBody) {
    throw new Error('Missing request body for signature verification');
  }

  // Parse signature header: "t=<timestamp>,v1=<signature>,v0=<signature>"
  const timestampMatch = stripeSignatureHeader.match(/t=(\d+)/);
  const v1SignatureMatch = stripeSignatureHeader.match(/v1=([a-f0-9]+)/);

  if (!timestampMatch || !v1SignatureMatch) {
    throw new Error('Invalid Stripe-Signature header format');
  }

  const timestamp = parseInt(timestampMatch[1], 10);
  const receivedSignature = v1SignatureMatch[1];

  // Reject if timestamp is outside acceptable window (5 minutes = 300 seconds)
  const now = Math.floor(Date.now() / 1000);
  const timeDiff = Math.abs(now - timestamp);

  if (timeDiff > 300) {
    throw new Error(`Webhook timestamp outside acceptable range (${timeDiff}s difference)`);
  }

  // Compute expected signature: HMAC-SHA256 of "timestamp.payload"
  const payload = `${timestamp}.${rawBody}`;
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(payload)
    .digest('hex');

  // Use timing-safe comparison to prevent timing attacks
  try {
    const receivedBuffer = Buffer.from(receivedSignature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (!crypto.timingSafeEqual(receivedBuffer, expectedBuffer)) {
      throw new Error('Stripe webhook signature verification failed');
    }
  } catch (error) {
    throw new Error(`Signature verification failed: ${error.message}`);
  }

  return true;
}

async function handler(req, res) {
  const pathname = req.url?.split('?')[0] || '';
  const method = req.method?.toUpperCase();

  try {
    // POST /api/subscriptions
    if (method === 'POST' && pathname === '/api/subscriptions') {
      const { endpoint, auth, p256dh, userAgent, userId } = req.body || {};
      if (!endpoint) {
        return res.status(400).json({ error: 'Missing push subscription endpoint' });
      }

      const supabase = getSupabaseClient();
      if (!supabase) {
        return res.status(500).json({ error: 'Database client not configured' });
      }

      const record = {
        endpoint,
        auth: auth || null,
        p256dh: p256dh || null,
        user_agent: userAgent || req.headers['user-agent'] || null,
        user_id: userId || null,
        created_at: new Date().toISOString(),
        last_used_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('subscription_endpoints')
        .upsert(record, { returning: 'representation' });

      if (error) {
        console.error('Supabase upsert error', error);
        return res.status(500).json({ error: 'Failed to upsert subscription', detail: error.message });
      }

      return res.status(200).json({ success: true, subscription: data?.[0] || null });
    }

    // POST /api/subscriptions/create
    if (method === 'POST' && pathname === '/api/subscriptions/create') {
      const { userId, email, name, planId } = req.body || {};

      if (!userId || !email) {
        return res.status(400).json({ error: 'Missing userId or email' });
      }

      const result = await createSubscription(userId, email, name || 'User', planId || 'plus');
      return res.status(200).json(result);
    }

    // GET /api/subscriptions/:userId
    const userIdMatch = /^\/api\/subscriptions\/([^/]+)$/.exec(pathname);
    if (method === 'GET' && userIdMatch) {
      const userId = userIdMatch[1];
      const subscription = await getActiveSubscription(userId);
      return res.status(200).json(subscription);
    }

    // POST /api/subscriptions/:userId/upgrade
    const upgradeMatch = /^\/api\/subscriptions\/([^/]+)\/upgrade$/.exec(pathname);
    if (method === 'POST' && upgradeMatch) {
      const userId = upgradeMatch[1];
      const { planId } = req.body || {};

      if (!planId) {
        return res.status(400).json({ error: 'Missing planId' });
      }

      const result = await upgradeSubscription(userId, planId);
      return res.status(200).json(result);
    }

    // POST /api/subscriptions/:userId/cancel
    const cancelMatch = /^\/api\/subscriptions\/([^/]+)\/cancel$/.exec(pathname);
    if (method === 'POST' && cancelMatch) {
      const userId = cancelMatch[1];
      const result = await cancelSubscription(userId);
      return res.status(200).json(result);
    }

    // POST /api/subscriptions/webhook (Stripe webhook - with signature verification)
    if (method === 'POST' && pathname === '/api/subscriptions/webhook') {
      const bodyData = await parseBody(req);
      
      try {
        // ✅ CRITICAL: Verify Stripe webhook signature BEFORE processing
        verifyStripeSignature(req, bodyData.raw);
        console.log('✅ Stripe webhook signature verified');
      } catch (verifyError) {
        console.error('❌ Stripe webhook signature verification failed:', verifyError.message);
        // Return 401 Unauthorized for failed verification
        return res.status(401).json({ error: 'Webhook verification failed' });
      }

      try {
        const result = await handleStripeWebhook(bodyData.parsed);
        // Stripe expects 200 within 30 seconds
        return res.status(200).json(result);
      } catch (processError) {
        console.error('❌ Error processing Stripe webhook:', processError.message);
        // Still return 200 to Stripe so it doesn't retry forever
        // But log the error for investigation
        return res.status(200).json({ 
          success: false,
          error: processError.message 
        });
      }
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (error) {
    console.error('Subscriptions handler error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error',
    });
  }
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      if (!body) return resolve({ raw: '', parsed: {} });
      try {
        resolve({
          raw: body,
          parsed: JSON.parse(body)
        });
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

export default handler;
