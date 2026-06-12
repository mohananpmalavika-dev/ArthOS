# Phase 1.6: Stripe Webhook Testing Guide

**Status**: 🟢 **SIGNATURE VERIFICATION + HANDLERS IMPLEMENTED**  
**Last Updated**: Current session  
**Testing Checklist**: Ready for validation

---

## Implementation Complete ✅

### Changes Made

**File: `api_src/subscriptions-handler.js`**
- ✅ Added `verifyStripeSignature()` function with HMAC-SHA256 validation
- ✅ Timestamp validation (reject if > 5 minutes old)
- ✅ Timing-safe signature comparison (prevents timing attacks)
- ✅ Modified `parseBody()` to preserve raw body for signature verification
- ✅ Updated webhook handler to verify signature BEFORE processing

**File: `api_src/subscriptions.js`**
- ✅ Enhanced `handleSubscriptionUpdated()` with logging and status transitions
- ✅ Enhanced `handleSubscriptionDeleted()` with soft delete logic
- ✅ Enhanced `handlePaymentSucceeded()` with subscription reactivation
- ✅ Enhanced `handlePaymentFailed()` with past_due status handling
- ✅ Added `handleCustomerDeleted()` handler
- ✅ Updated `handleStripeWebhook()` dispatcher with comprehensive logging

---

## Testing with Stripe CLI

### Step 1: Install Stripe CLI

**macOS (Homebrew)**:
```bash
brew install stripe/stripe-cli/stripe
```

**Linux (Debian/Ubuntu)**:
```bash
curl https://files.stripe.com/stripe-cli/install.sh -s | sh
```

**Windows (Scoop)**:
```powershell
scoop install stripe
```

**Or download directly**: https://stripe.com/docs/stripe-cli

### Step 2: Authenticate with Stripe Account

```bash
stripe login
# Follow prompts to authorize CLI access to your Stripe account
```

### Step 3: Get Webhook Signing Secret

When you run `stripe listen`, it will output a webhook signing secret:

```bash
stripe listen --forward-to localhost:3000/api/subscriptions/webhook
```

**Output** (example):
```
> Ready! Your webhook signing secret is: whsec_test_secret_xxxxx
```

### Step 4: Configure Environment

Add to `.env` file:
```env
STRIPE_WEBHOOK_SECRET=whsec_test_secret_xxxxx
```

Restart your local dev server.

### Step 5: Test Webhook Events

**In a new terminal**, use `stripe trigger` to send test events:

#### Test 5a: Signature Verification (Happy Path)
```bash
stripe trigger customer.subscription.updated
```

**Expected**:
- Webhook reaches your server (forwarded by Stripe CLI)
- Signature verification ✅ succeeds
- Event processed successfully
- Database updated
- Console logs show: `✅ Stripe webhook signature verified`

**Check logs**:
```
✅ Stripe webhook signature verified
📝 Subscription updated: sub_1234..., status: active
✅ Updated subscription sub_1234...: active → active
✅ Webhook processed successfully
```

**Check database**:
```sql
SELECT stripe_subscription_id, status, updated_at 
FROM subscriptions 
WHERE stripe_subscription_id LIKE 'sub_%' 
ORDER BY updated_at DESC LIMIT 1;
```

---

#### Test 5b: Signature Verification (Tamper Test)

**Tamper with webhook manually** (demonstrates security):

```bash
curl -X POST http://localhost:3000/api/subscriptions/webhook \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: t=1234567890,v1=fakesignature123" \
  -d '{"id":"evt_test","type":"customer.subscription.updated","data":{"object":{"id":"sub_test","status":"active"}}}'
```

**Expected**:
- ❌ Response: `401 Unauthorized` with `{"error":"Webhook verification failed"}`
- Console logs show: `❌ Stripe webhook signature verification failed: Invalid webhook signature`
- Database NOT updated (no spurious data)

---

#### Test 5c: Subscription Updated

```bash
stripe trigger customer.subscription.updated
```

**Expected flow**:
1. Stripe CLI captures test subscription data
2. Sends to your webhook endpoint
3. Signature verified ✅
4. `handleSubscriptionUpdated()` called
5. Database row updated with new status
6. Console shows status transition

**Sample console output**:
```
📝 Subscription updated: sub_test123, status: active
✅ Updated subscription sub_test123: active → active
🎉 User user_123: subscription activated
✅ Webhook processed successfully
```

---

#### Test 5d: Subscription Deleted

```bash
stripe trigger customer.subscription.deleted
```

**Expected**:
- `handleSubscriptionDeleted()` called
- Subscription status set to 'canceled'
- `current_period_end` set to NOW()
- Console shows: `🗑️ Subscription deleted`

**Sample output**:
```
🗑️ Subscription deleted: sub_test456
✅ Marked subscription sub_test456 as canceled for user user_456
✅ Webhook processed successfully
```

---

#### Test 5e: Payment Succeeded

```bash
stripe trigger invoice.payment_succeeded
```

**Expected**:
- `handlePaymentSucceeded()` called
- Subscription reactivated (if was past_due)
- Console shows: `💰 Payment succeeded`

**Sample output**:
```
💰 Payment succeeded: invoice inv_test789
✅ Subscription sub_test789 reactivated due to successful payment
📧 User user_789: payment successful, invoice inv_test789 ($12.99)
✅ Webhook processed successfully
```

---

#### Test 5f: Payment Failed

```bash
stripe trigger invoice.payment_failed
```

**Expected**:
- `handlePaymentFailed()` called
- Subscription status set to 'past_due'
- Console shows: `❌ Payment failed`

**Sample output**:
```
❌ Payment failed: invoice inv_test000
⚠️ Subscription sub_test000 marked as past_due
📧 User user_000: payment failed on invoice inv_test000, retry scheduled
✅ Webhook processed successfully
```

---

#### Test 5g: Customer Deleted

```bash
stripe trigger customer.deleted
```

**Expected**:
- `handleCustomerDeleted()` called
- All subscriptions for customer marked canceled
- Console shows: `🗑️ Customer deleted`

**Sample output**:
```
🗑️ Customer deleted from Stripe: cus_test123
✅ Canceled subscription sub_test111 (local ID 42)
✅ Canceled subscription sub_test222 (local ID 43)
✅ Webhook processed successfully
```

---

## Advanced Testing Scenarios

### Scenario 1: Timestamp Validation

**Test rejection of old timestamp**:

```bash
# Get current timestamp
CURRENT=$(date +%s)
OLD_TIMESTAMP=$((CURRENT - 400))  # 400 seconds ago (> 5 min)

# Create signature for old timestamp (requires understanding HMAC)
# For testing, just send request with old timestamp header
```

Expected: ❌ Webhook rejected with "timestamp outside acceptable range"

---

### Scenario 2: Missing Signature Header

```bash
curl -X POST http://localhost:3000/api/subscriptions/webhook \
  -H "Content-Type: application/json" \
  -d '{"id":"evt_test","type":"customer.subscription.updated"}'
```

**Expected**: ❌ `401` response with "Missing Stripe-Signature header"

---

### Scenario 3: Invalid Signature Format

```bash
curl -X POST http://localhost:3000/api/subscriptions/webhook \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: invalid_header" \
  -d '{"id":"evt_test","type":"customer.subscription.updated"}'
```

**Expected**: ❌ `401` response with "Invalid Stripe-Signature header format"

---

### Scenario 4: Missing Webhook Secret

```bash
# Temporarily unset STRIPE_WEBHOOK_SECRET in .env
export STRIPE_WEBHOOK_SECRET=""
```

**Expected**: ❌ Error in logs: "STRIPE_WEBHOOK_SECRET environment variable not configured"

---

## Debugging Checklist

### ✅ Signature Not Verifying?

1. **Confirm webhook secret in .env**:
   ```bash
   echo $STRIPE_WEBHOOK_SECRET
   ```

2. **Check if using Stripe CLI secret**:
   ```bash
   stripe listen --format JSON
   # Copy the signing secret from output
   ```

3. **Verify raw body is being captured**:
   - Add temporary logging in `verifyStripeSignature()`
   - Log `rawBody` length (should be > 0)
   - Log `stripeSignatureHeader` value

4. **Compare signatures manually**:
   ```javascript
   // Add to verifyStripeSignature for debugging
   console.log('Raw body:', rawBody);
   console.log('Stripe-Signature:', stripeSignatureHeader);
   console.log('Computed signature:', expectedSignature);
   console.log('Received signature:', receivedSignature);
   ```

### ✅ Events Not Processing?

1. **Check database connection**:
   ```sql
   SELECT * FROM subscriptions LIMIT 1;
   ```

2. **Verify `stripe_subscription_id` format**:
   - Should look like: `sub_1Abcd1234...` (from Stripe CLI: `sub_test1234`)

3. **Check for errors in event handler**:
   ```javascript
   // Add try-catch logging to individual handlers
   console.error('Handler error:', error.message);
   console.error('Handler error stack:', error.stack);
   ```

4. **Verify database user has UPDATE permissions**:
   ```sql
   GRANT UPDATE ON database.subscriptions TO user@'localhost';
   ```

### ✅ Webhook Not Reaching Server?

1. **Check if Stripe CLI is still running**:
   ```bash
   # Must have: stripe listen --forward-to localhost:3000/api/subscriptions/webhook
   # Still running in another terminal
   ```

2. **Verify local server is running**:
   ```bash
   curl http://localhost:3000/health
   ```

3. **Check firewall/network**:
   - If on Windows, allow Node.js through Windows Defender Firewall
   - If on VM, check port forwarding

4. **Check Stripe CLI logs for forwarding errors**:
   ```
   Error forwarding request: connection refused
   ```

---

## Production Deployment Checklist

Once local testing is complete:

### 1. Configure Webhook in Stripe Dashboard

- Go to: https://dashboard.stripe.com/webhooks
- Click "Add Endpoint"
- Enter URL: `https://yourdomain.com/api/subscriptions/webhook`
- Select events:
  - ✅ `customer.subscription.created`
  - ✅ `customer.subscription.updated`
  - ✅ `customer.subscription.deleted`
  - ✅ `invoice.created`
  - ✅ `invoice.payment_succeeded`
  - ✅ `invoice.payment_failed`
  - ✅ `customer.deleted`
- Copy **Signing Secret** (starts with `whsec_`)

### 2. Set Production Secret

```bash
# In production environment
export STRIPE_WEBHOOK_SECRET=whsec_live_xxxxx
```

### 3. Test with Production Mode

```bash
# Use Stripe test card first
stripe trigger customer.subscription.updated --live

# Should work with production secret
```

### 4. Enable Error Alerts

```javascript
// In handleStripeWebhook, add monitoring:
if (error) {
  // Send alert to monitoring service (e.g., Sentry, DataDog)
  logError('Webhook processing failed', {
    eventId: event.id,
    eventType: event.type,
    error: error.message,
    timestamp: new Date().toISOString()
  });
}
```

### 5. Monitor Webhook Health

**Check Stripe dashboard regularly**:
- https://dashboard.stripe.com/webhooks
- View "Recent Deliveries"
- Verify success rate (should be 100%)
- Check any failed attempts

---

## Monitoring & Observability

### Logging Pattern

All webhook events now follow consistent logging format:

```
[emoji] [action_type]: [description]
```

Examples:
- `📬 Received Stripe webhook: invoice.payment_succeeded (ID: evt_xxx)`
- `✅ Webhook processed successfully`
- `❌ Stripe webhook signature verification failed: Invalid signature`
- `🎉 User user_123: subscription activated`

### Recommended Metrics

Track these in production:

| Metric | Target | Alert |
|---|---|---|
| Webhook signature failures | < 0.1% | > 1 failure/day |
| Event processing time | < 500ms | > 5s |
| Database update success | 100% | < 99% |
| Webhook delivery latency | < 100ms | > 1s |

---

## Success Criteria

- ✅ All 6 event types tested locally
- ✅ Signature verification rejects tampered events
- ✅ Timestamp validation rejects old events
- ✅ Database correctly updated for each event
- ✅ Console logging clear and informative
- ✅ Error handling graceful (no crashes)
- ✅ Ready for production deployment

---

## Next Steps

1. **Run local tests** using Stripe CLI (15 minutes)
2. **Deploy to staging** and test with real Stripe account (15 minutes)
3. **Configure production webhook** in Stripe dashboard (5 minutes)
4. **Monitor first week** for any webhook errors (ongoing)

---

## Support

If webhook events aren't processing:
1. Check `.env` has `STRIPE_WEBHOOK_SECRET` set
2. Restart dev server after changing `.env`
3. Verify database connection is working
4. Check Stripe dashboard "Recent Deliveries" for failed events
5. Review server logs for error messages

---

**Total Testing Time**: ~30 minutes for local validation + CI/CD pipeline time for staging/prod
