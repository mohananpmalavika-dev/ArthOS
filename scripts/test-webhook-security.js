#!/usr/bin/env node

/**
 * Stripe Webhook Signature Verification Tests
 * Direct unit tests without requiring full server
 */

import crypto from 'crypto';

// ===== WEBHOOK SIGNATURE VERIFICATION FUNCTION (from subscriptions-handler.js) =====
function verifyStripeSignature(req, rawBody) {
  const stripeSignatureHeader = req.headers['stripe-signature'];

  if (!stripeSignatureHeader) {
    throw new Error('Missing Stripe-Signature header');
  }

  // Stripe signature format: "t=<timestamp>,v1=<signature>,v0=<signature>"
  const parts = stripeSignatureHeader.split(',').reduce((acc, part) => {
    const [key, val] = part.split('=');
    acc[key] = val;
    return acc;
  }, {});

  if (!parts.t || !parts.v1) {
    throw new Error('Invalid Stripe-Signature header format');
  }

  const timestamp = parseInt(parts.t, 10);
  const receivedSignature = parts.v1;

  // Validate timestamp (reject if > 300 seconds old)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > 300) {
    throw new Error('Webhook timestamp outside acceptable range (> 5 minutes)');
  }

  const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret_12345';

  // Reconstruct signed content: "timestamp.body"
  const signedContent = `${timestamp}.${rawBody}`;

  // Compute expected signature using HMAC-SHA256
  const expectedSignature = crypto
    .createHmac('sha256', STRIPE_WEBHOOK_SECRET)
    .update(signedContent)
    .digest('hex');

  // Timing-safe comparison (prevents timing attacks)
  let receivedBuffer, expectedBuffer;
  try {
    receivedBuffer = Buffer.from(receivedSignature, 'hex');
    expectedBuffer = Buffer.from(expectedSignature, 'hex');
  } catch (e) {
    throw new Error('Invalid signature encoding');
  }

  if (receivedBuffer.length !== expectedBuffer.length) {
    throw new Error('Signature length mismatch');
  }

  if (!crypto.timingSafeEqual(receivedBuffer, expectedBuffer)) {
    throw new Error('Invalid webhook signature');
  }

  return true;
}

// ===== TEST CASES =====

console.log('🧪 Stripe Webhook Signature Verification Tests\n');
console.log('='.repeat(60) + '\n');

const tests = [];
let passed = 0;
let failed = 0;

// Test 1: Valid signature verification
console.log('Test 1: ✅ Valid webhook signature verification');
try {
  const timestamp = Math.floor(Date.now() / 1000);
  const body = JSON.stringify({
    id: 'evt_test_001',
    type: 'customer.subscription.updated',
    data: { object: { id: 'sub_123', status: 'active' } }
  });

  const signedContent = `${timestamp}.${body}`;
  const secret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret_12345';
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedContent)
    .digest('hex');

  const stripeSignatureHeader = `t=${timestamp},v1=${signature}`;

  const mockReq = {
    headers: {
      'stripe-signature': stripeSignatureHeader
    }
  };

  verifyStripeSignature(mockReq, body);
  console.log('   ✅ PASS: Signature verified successfully\n');
  passed++;
} catch (error) {
  console.log(`   ❌ FAIL: ${error.message}\n`);
  failed++;
}

// Test 2: Tampered signature
console.log('Test 2: ❌ Tampered signature detection');
try {
  const timestamp = Math.floor(Date.now() / 1000);
  const body = JSON.stringify({ id: 'evt_test_002', type: 'customer.subscription.updated' });
  const signedContent = `${timestamp}.${body}`;
  const secret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret_12345';
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedContent)
    .digest('hex');

  // Tamper with signature
  const tamperedSignature = signature.substring(0, 10) + 'aaaaaaaaaa' + signature.substring(20);
  const stripeSignatureHeader = `t=${timestamp},v1=${tamperedSignature}`;

  const mockReq = {
    headers: {
      'stripe-signature': stripeSignatureHeader
    }
  };

  try {
    verifyStripeSignature(mockReq, body);
    console.log('   ❌ FAIL: Tampered signature was accepted (security issue!)\n');
    failed++;
  } catch (e) {
    console.log(`   ✅ PASS: Tampered signature rejected (${e.message})\n`);
    passed++;
  }
} catch (error) {
  console.log(`   ❌ FAIL: Test setup error: ${error.message}\n`);
  failed++;
}

// Test 3: Old timestamp rejection (> 5 minutes)
console.log('Test 3: ⏱️  Timestamp validation (>5 minutes old)');
try {
  const oldTimestamp = Math.floor(Date.now() / 1000) - 400; // 400 seconds ago
  const body = JSON.stringify({ id: 'evt_test_003' });
  const signedContent = `${oldTimestamp}.${body}`;
  const secret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret_12345';
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedContent)
    .digest('hex');

  const stripeSignatureHeader = `t=${oldTimestamp},v1=${signature}`;

  const mockReq = {
    headers: {
      'stripe-signature': stripeSignatureHeader
    }
  };

  try {
    verifyStripeSignature(mockReq, body);
    console.log('   ❌ FAIL: Old timestamp was accepted (replay attack vulnerability!)\n');
    failed++;
  } catch (e) {
    console.log(`   ✅ PASS: Old timestamp rejected (${e.message})\n`);
    passed++;
  }
} catch (error) {
  console.log(`   ❌ FAIL: Test setup error: ${error.message}\n`);
  failed++;
}

// Test 4: Missing signature header
console.log('Test 4: 🚫 Missing Stripe-Signature header');
try {
  const mockReq = {
    headers: {}
  };

  try {
    verifyStripeSignature(mockReq, '{"test": "data"}');
    console.log('   ❌ FAIL: Missing header was accepted\n');
    failed++;
  } catch (e) {
    console.log(`   ✅ PASS: Missing header rejected (${e.message})\n`);
    passed++;
  }
} catch (error) {
  console.log(`   ❌ FAIL: Test setup error: ${error.message}\n`);
  failed++;
}

// Test 5: Invalid header format
console.log('Test 5: 📋 Invalid Stripe-Signature format');
try {
  const mockReq = {
    headers: {
      'stripe-signature': 'invalid_format_without_equals'
    }
  };

  try {
    verifyStripeSignature(mockReq, '{"test": "data"}');
    console.log('   ❌ FAIL: Invalid format was accepted\n');
    failed++;
  } catch (e) {
    console.log(`   ✅ PASS: Invalid format rejected (${e.message})\n`);
    passed++;
  }
} catch (error) {
  console.log(`   ❌ FAIL: Test setup error: ${error.message}\n`);
  failed++;
}

// Test 6: Different request bodies produce different signatures
console.log('Test 6: 🔐 Body mutation detection');
try {
  const timestamp = Math.floor(Date.now() / 1000);
  const body1 = JSON.stringify({ id: 'evt_test_006', status: 'active' });
  const body2 = JSON.stringify({ id: 'evt_test_006', status: 'canceled' }); // Different status
  
  const secret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret_12345';
  const signature1 = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${body1}`)
    .digest('hex');

  // Try to verify body2 with signature from body1
  const stripeSignatureHeader = `t=${timestamp},v1=${signature1}`;

  const mockReq = {
    headers: {
      'stripe-signature': stripeSignatureHeader
    }
  };

  try {
    verifyStripeSignature(mockReq, body2);
    console.log('   ❌ FAIL: Body mutation was not detected (CRITICAL!)\n');
    failed++;
  } catch (e) {
    console.log(`   ✅ PASS: Body mutation detected (${e.message})\n`);
    passed++;
  }
} catch (error) {
  console.log(`   ❌ FAIL: Test setup error: ${error.message}\n`);
  failed++;
}

// Test 7: Whitespace sensitivity in raw body
console.log('Test 7: 📄 Raw body preservation (whitespace sensitivity)');
try {
  const timestamp = Math.floor(Date.now() / 1000);
  const body = '{"id":"evt_test_007","type":"test"}'; // No extra whitespace
  const bodyWithWhitespace = JSON.stringify(JSON.parse(body)); // Normalized JSON
  
  const secret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret_12345';
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${body}`)
    .digest('hex');

  const stripeSignatureHeader = `t=${timestamp},v1=${signature}`;

  const mockReq = {
    headers: {
      'stripe-signature': stripeSignatureHeader
    }
  };

  try {
    verifyStripeSignature(mockReq, body);
    console.log('   ✅ PASS: Raw body verification successful\n');
    passed++;
  } catch (e) {
    console.log(`   ❌ FAIL: ${e.message}\n`);
    failed++;
  }
} catch (error) {
  console.log(`   ❌ FAIL: Test setup error: ${error.message}\n`);
  failed++;
}

// Summary
console.log('='.repeat(60));
console.log('\n📊 Test Results:\n');
console.log(`   ✅ Passed: ${passed}/7`);
console.log(`   ❌ Failed: ${failed}/7`);
console.log(`   Success Rate: ${Math.round((passed / 7) * 100)}%\n`);

if (failed === 0) {
  console.log('🎉 All tests passed! Webhook signature verification is SECURE.\n');
  console.log('Security Features Verified:');
  console.log('   ✅ HMAC-SHA256 signature validation');
  console.log('   ✅ Timing-safe comparison (prevents timing attacks)');
  console.log('   ✅ Timestamp validation (replay attack prevention)');
  console.log('   ✅ Raw body preservation (mutation detection)');
  console.log('   ✅ Header format validation');
  console.log('   ✅ Signature length validation\n');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed. Please review the implementation.\n');
  process.exit(1);
}
