# Phase 1.6: Stripe Webhook Handlers — Analysis & Implementation Plan

**Status**: 🔴 **CRITICAL SECURITY ISSUE FOUND**  
**Priority**: HIGH (blocks monetization)  
**Estimated Time**: 1-2 hours  
**Complexity**: Medium

---

## Executive Summary

**Current State**:
- ✅ Stripe webhook endpoint exists (`POST /api/subscriptions/webhook`)
- ✅ Event handlers partially implemented (subscription.updated, subscription.deleted, invoice.payment_succeeded/failed)
- ✅ Database schema ready (subscriptions table with Stripe fields)
- 🔴 **CRITICAL: No webhook signature verification** — accepts ANY JSON without validation
- 🔴 **CRITICAL: Using parsed JSON instead of raw body** — Stripe signature verification requires raw request body

**Impact**:
- Anyone can send fake webhook events to update subscription status
- Database could be corrupted with malicious data
- Users could upgrade/downgrade without payment
- Cannot deploy to production without fixing

---

## Current Implementation Analysis

### ✅ What's Already Done

**File**: `api_src/subscriptions-handler.js`
```javascript
if (method === 'POST' && pathname === '/api/subscriptions/webhook') {
  const body = await parseBody(req);  // ⚠️ PARSED JSON, not raw
  const result = await handleStripeWebhook(body);
  return res.status(200).json(result);
}
```

**Issue**: `parseBody()` reads request body as string and parses to JSON. Stripe's signature verification requires:
1. **Raw body** (exact bytes Stripe sent)
2. **Stripe-Signature header** with timestamp and signature

### Event Handlers in `api_src/subscriptions.js`

```javascript
export async function handleStripeWebhook(event) {
  switch (event.type) {
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object);
      break;
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
  }
}
```

**Status**: Handlers exist but are **SKELETAL** — mostly just logging, not full business logic

### Missing Implementation Details

#### 1. **Webhook Signature Verification** 🔴 CRITICAL
**Required by Stripe docs**: https://stripe.com/docs/webhooks/signatures
- Must verify `Stripe-Signature` header
- Uses HMAC-SHA256 with webhook secret
- Timestamp validation (reject if > 5 minutes old)
- Exact signature matching

**Current code**: NONE

#### 2. **Event Handler Completeness**

| Event | Current | Needed |
|---|---|---|
| `customer.subscription.updated` | ✅ Basic SQL update | Need: validate status changes, log transitions |
| `customer.subscription.deleted` | ✅ Sets status='canceled' | Need: cleanup, notify user |
| `invoice.payment_succeeded` | ✅ Logs event | Need: update subscription status, send receipt email |
| `invoice.payment_failed` | ✅ Logs event | Need: retry logic, notify user, suspend if needed |
| `customer.deleted` | ❌ Not handled | Need: cascade delete subscriptions |
| `payment_method.detached` | ❌ Not handled | Need: flag subscription for renewal issues |

#### 3. **Error Handling**
- No retry logic for failed database updates
- No idempotency (could process same event twice)
- No logging of webhook processing

#### 4. **Testing**
- No test webhook integration
- No Stripe CLI setup instructions
- No test scenarios documented

---

## Implementation Roadmap

### Phase 1.6a: Signature Verification (30 minutes) 🔴 CRITICAL

**Goal**: Validate webhook authenticity before processing

**Changes needed in `api_src/subscriptions-handler.js`**:

```javascript
import crypto from 'crypto';

function verifyStripeSignature(req) {
  const signature = req.headers['stripe-signature'];
  if (!signature) {
    throw new Error('Missing Stripe-Signature header');
  }

  // Get raw body (must be preserved before JSON parsing)
  const rawBody = req.rawBody || '';  // Must capture BEFORE parsing
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET not configured');
  }

  // Stripe signature format: t=timestamp,v1=signature,v0=signature
  const timestamps = signature.match(/t=(\d+)/);
  const v1Signature = signature.match(/v1=([a-f0-9]+)/);
  
  if (!timestamps || !v1Signature) {
    throw new Error('Invalid Stripe-Signature format');
  }

  const timestamp = timestamps[1];
  const receivedSignature = v1Signature[1];

  // Check timestamp (reject if > 5 minutes old)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > 300) {
    throw new Error('Webhook timestamp outside acceptable range');
  }

  // Compute expected signature
  const payload = `${timestamp}.${rawBody}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  // Compare signatures (use timing-safe comparison)
  if (!crypto.timingSafeEqual(
    Buffer.from(receivedSignature),
    Buffer.from(expectedSignature)
  )) {
    throw new Error('Invalid webhook signature');
  }

  return true;
}

// ─── Main handler ───
async function handler(req, res, params) {
  // ... existing code ...

  // POST /api/subscriptions/webhook (Stripe webhook)
  if (method === 'POST' && pathname === '/api/subscriptions/webhook') {
    try {
      // ✅ Verify signature FIRST
      verifyStripeSignature(req);

      const body = await parseBody(req);
      const result = await handleStripeWebhook(body);
      
      // Stripe expects 200 within 30 seconds
      return res.status(200).json(result);
    } catch (error) {
      console.error('Webhook verification failed:', error.message);
      return res.status(401).json({ error: 'Webhook verification failed' });
    }
  }
}
```

**Issue**: Node.js default request handling doesn't preserve raw body after parsing. Need to:
1. Read raw body before JSON parsing
2. Store in `req.rawBody`
3. Pass to verification function

**Solution**: Modify request pipeline to capture raw body first

### Phase 1.6b: Enhanced Event Handlers (45 minutes)

**Goal**: Complete business logic for each event type

**Changes needed in `api_src/subscriptions.js`**:

```javascript
async function handleSubscriptionUpdated(subscription) {
  console.log(`Subscription updated: ${subscription.id}, status: ${subscription.status}`);

  // Only update if subscription belongs to a known user
  const result = await query(
    'SELECT user_id FROM subscriptions WHERE stripe_subscription_id = ?',
    [subscription.id]
  );
  
  if (!result || result.length === 0) {
    console.warn(`Subscription ${subscription.id} not found in DB`);
    return;
  }

  const userId = result[0].user_id;

  // Update subscription details
  await query(
    `UPDATE subscriptions 
     SET status = ?, 
         current_period_start = ?, 
         current_period_end = ?,
         updated_at = NOW()
     WHERE stripe_subscription_id = ?`,
    [
      subscription.status,
      new Date(subscription.current_period_start * 1000),
      new Date(subscription.current_period_end * 1000),
      subscription.id,
    ]
  );

  // Handle status transitions
  if (subscription.status === 'active') {
    console.log(`User ${userId}: subscription activated`);
    // Could send "Welcome to Plus tier!" email
  } else if (subscription.status === 'past_due') {
    console.log(`User ${userId}: subscription past due`);
    // Could send "Payment failed, please update" email
  } else if (subscription.status === 'canceled') {
    console.log(`User ${userId}: subscription canceled`);
    // Could send "Sorry to see you go" email
  }

  // Log transition for analytics
  await query(
    `INSERT INTO subscription_events 
     (user_id, event_type, event_data, created_at)
     VALUES (?, ?, ?, NOW())`,
    [userId, 'subscription_updated', JSON.stringify(subscription)]
  );
}

async function handleSubscriptionDeleted(subscription) {
  console.log(`Subscription deleted: ${subscription.id}`);

  // Soft delete: set status to 'canceled' and end date to now
  await query(
    `UPDATE subscriptions 
     SET status = 'canceled', 
         current_period_end = NOW(),
         updated_at = NOW()
     WHERE stripe_subscription_id = ?`,
    [subscription.id]
  );

  // Log event
  const result = await query(
    'SELECT user_id FROM subscriptions WHERE stripe_subscription_id = ?',
    [subscription.id]
  );

  if (result && result.length > 0) {
    await query(
      `INSERT INTO subscription_events 
       (user_id, event_type, event_data, created_at)
       VALUES (?, ?, ?, NOW())`,
      [result[0].user_id, 'subscription_deleted', JSON.stringify(subscription)]
    );
  }
}

async function handlePaymentSucceeded(invoice) {
  console.log(`Payment succeeded: ${invoice.id}`);

  // Update subscription status if there's a subscription
  if (invoice.subscription) {
    await query(
      `UPDATE subscriptions 
       SET status = 'active',
           updated_at = NOW()
       WHERE stripe_subscription_id = ?`,
      [invoice.subscription]
    );

    // Log event
    const result = await query(
      'SELECT user_id FROM subscriptions WHERE stripe_subscription_id = ?',
      [invoice.subscription]
    );

    if (result && result.length > 0) {
      const userId = result[0].user_id;
      await query(
        `INSERT INTO subscription_events 
         (user_id, event_type, event_data, created_at)
         VALUES (?, ?, ?, NOW())`,
        [userId, 'payment_succeeded', JSON.stringify(invoice)]
      );

      // Could send receipt email here
      console.log(`User ${userId}: payment successful, invoice ${invoice.id}`);
    }
  }
}

async function handlePaymentFailed(invoice) {
  console.log(`Payment failed: ${invoice.id}`);

  // Update subscription status
  if (invoice.subscription) {
    await query(
      `UPDATE subscriptions 
       SET status = 'past_due',
           updated_at = NOW()
       WHERE stripe_subscription_id = ?`,
      [invoice.subscription]
    );

    // Log event
    const result = await query(
      'SELECT user_id FROM subscriptions WHERE stripe_subscription_id = ?',
      [invoice.subscription]
    );

    if (result && result.length > 0) {
      const userId = result[0].user_id;
      await query(
        `INSERT INTO subscription_events 
         (user_id, event_type, event_data, created_at)
         VALUES (?, ?, ?, NOW())`,
        [userId, 'payment_failed', JSON.stringify(invoice)]
      );

      // Could send payment failure email here
      console.log(`User ${userId}: payment failed on invoice ${invoice.id}`);
    }
  }
}

// Add handlers for additional events
async function handleCustomerDeleted(customer) {
  console.log(`Customer deleted: ${customer.id}`);

  // Find and cancel all subscriptions for this customer
  const subscriptions = await query(
    'SELECT id FROM subscriptions WHERE stripe_customer_id = ?',
    [customer.id]
  );

  for (const sub of subscriptions) {
    await query(
      'UPDATE subscriptions SET status = ? WHERE id = ?',
      ['canceled', sub.id]
    );
  }
}

async function handlePaymentMethodDetached(paymentMethod) {
  console.log(`Payment method detached: ${paymentMethod.id}`);

  // Find subscriptions using this payment method and flag them
  // (would need to query Stripe for this relationship)
  // For now, just log the event
}
```

**Database schema additions needed** (for event tracking):

```sql
CREATE TABLE IF NOT EXISTS subscription_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  event_data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX (user_id, created_at)
);
```

### Phase 1.6c: Testing with Stripe (15 minutes)

**Goal**: Verify webhooks work in test environment

**Steps**:
1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Authenticate: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:3000/api/subscriptions/webhook`
4. Copy webhook signing secret to `.env`: `STRIPE_WEBHOOK_SECRET=whsec_xxxxx`
5. Test events from Stripe CLI:
   ```bash
   stripe trigger customer.subscription.updated
   stripe trigger invoice.payment_succeeded
   stripe trigger invoice.payment_failed
   ```
6. Verify database updates and logs
7. Test with Stripe test mode (test_4242...)

---

## Implementation Checklist

### Part A: Signature Verification (CRITICAL)
- [ ] Modify request pipeline to preserve raw body
- [ ] Implement `verifyStripeSignature()` function
- [ ] Add error handling for invalid signatures
- [ ] Test with Stripe CLI `stripe trigger` command
- [ ] Verify rejected if signature tampered with
- [ ] Verify rejected if timestamp outside 5-minute window

### Part B: Event Handlers
- [ ] Implement `handleSubscriptionUpdated()` with status transition logic
- [ ] Implement `handleSubscriptionDeleted()` with soft delete
- [ ] Implement `handlePaymentSucceeded()` with subscription activation
- [ ] Implement `handlePaymentFailed()` with past_due status
- [ ] Add `handleCustomerDeleted()` handler
- [ ] Add event logging to subscription_events table
- [ ] Create subscription_events schema migration

### Part C: Testing
- [ ] Install Stripe CLI
- [ ] Configure webhook signing secret in .env
- [ ] Test each event type with `stripe trigger`
- [ ] Verify database updates for each event
- [ ] Test signature validation (reject tampered events)
- [ ] Test timestamp validation (reject old events)
- [ ] Document webhook test procedures

### Part D: Deployment Prep
- [ ] Add webhook URL to Stripe dashboard
- [ ] Set webhook signing secret in production .env
- [ ] Configure webhook events in Stripe (select all needed events)
- [ ] Test with real Stripe test account
- [ ] Create runbook for webhook troubleshooting

---

## Security Considerations

### ✅ Signature Verification
- Validates webhook came from Stripe
- Prevents replay attacks via timestamp
- Prevents tampering with event data
- Uses timing-safe comparison

### ✅ Idempotency
**Current issue**: Could process same event twice if retried
**Solution**: Add unique constraint on `(stripe_event_id, user_id)` in events table
```sql
ALTER TABLE subscription_events 
ADD COLUMN stripe_event_id VARCHAR(255) UNIQUE,
ADD INDEX (stripe_event_id);
```

### ✅ Data Validation
- Verify subscription belongs to user before updating
- Log unexpected/malformed events
- Graceful handling of missing data

### ⚠️ Email Notifications (Future)
- Payment failure emails should trigger retry instructions
- Success emails should confirm new tier features
- Cancellation emails should offer discounts

---

## Testing Scenarios

### Scenario 1: Successful Payment Flow
1. User creates subscription (Stripe session)
2. User completes payment with test card 4242 4242 4242 4242
3. Stripe sends `customer.subscription.created`
4. Webhook receives and stores subscription
5. Verify: `subscriptions` table has active subscription

### Scenario 2: Payment Failure
1. User creates subscription with failing test card 4000 0000 0000 0002
2. Stripe sends `invoice.payment_failed`
3. Webhook receives and updates status to past_due
4. Verify: Database shows past_due status

### Scenario 3: Subscription Upgrade
1. User upgrades from free to plus
2. Stripe sends `customer.subscription.updated`
3. Webhook receives with new plan details
4. Verify: Database reflects new plan

### Scenario 4: Cancellation
1. User cancels subscription from Stripe dashboard
2. Stripe sends `customer.subscription.deleted`
3. Webhook receives and marks as canceled
4. Verify: Database shows canceled status

### Scenario 5: Webhook Replay Protection
1. Attacker sends webhook with old timestamp (> 5 min ago)
2. Webhook handler rejects with timestamp error
3. Verify: Event not processed

### Scenario 6: Webhook Signature Tampering
1. Attacker modifies webhook data
2. Attacker recalculates signature with wrong secret
3. Webhook handler rejects with invalid signature error
4. Verify: Event not processed

---

## Dependencies

- `stripe` npm package (already installed)
- `crypto` Node.js built-in module
- PostgreSQL for event logging
- Stripe CLI for testing (local dev only)

---

## Success Criteria

- ✅ All webhook events properly verified
- ✅ Subscription status correctly updated in database
- ✅ Events logged for audit trail
- ✅ Tested with Stripe test mode
- ✅ No data corruption from tampered webhooks
- ✅ Payment flow end-to-end working

---

## Estimated Effort

| Task | Time |
|---|---|
| Signature verification | 30 min |
| Event handler logic | 45 min |
| Testing setup | 15 min |
| **Total** | **1.5 hours** |

**Risk Level**: 🟡 **MEDIUM** (signature verification is standard Stripe pattern, but requires careful implementation)

---

## Next Priority After 1.6

Once Phase 1.6 completes:
1. **Gap G5: Salary Roast Viral Share** — Growth lever (4-6 hours)
2. **Gap G3: Adaptive Assessment** — UX improvement (8-10 hours)
3. **L06+ Advanced Layers** — Cognitive stack enhancements

---

## References

- Stripe Webhooks: https://stripe.com/docs/webhooks
- Webhook Security: https://stripe.com/docs/webhooks/signatures
- Stripe CLI: https://stripe.com/docs/stripe-cli
- Node.js Crypto: https://nodejs.org/api/crypto.html
