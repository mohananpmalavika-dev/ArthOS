#!/usr/bin/env node

/**
 * Local Stripe Webhook Testing Script
 * 
 * Tests:
 * 1. Signature verification (happy path)
 * 2. Signature tampering detection
 * 3. Timestamp validation
 * 4. Missing signature header rejection
 * 5. Invalid signature format rejection
 * 6. Event handler processing
 */

const crypto = require('crypto');
const http = require('http');
const querystring = require('querystring');

// Configuration
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret_12345';
const API_URL = process.env.API_URL || 'http://localhost:3000';
const WEBHOOK_PATH = '/api/subscriptions/webhook';

console.log('🧪 Stripe Webhook Security Test Suite');
console.log('=====================================\n');
console.log(`Webhook Secret: ${WEBHOOK_SECRET.substring(0, 20)}...`);
console.log(`API URL: ${API_URL}`);
console.log(`Webhook Path: ${WEBHOOK_PATH}`);
console.log('\n');

// Helper: Create properly signed webhook payload
function createSignedWebhookPayload(eventData, timestamp = Math.floor(Date.now() / 1000)) {
  const payload = JSON.stringify(eventData);
  
  // Stripe signature format: "t=<timestamp>,v1=<signature>,v0=<signature>"
  const signedContent = `${timestamp}.${payload}`;
  
  // Compute HMAC-SHA256
  const signature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(signedContent)
    .digest('hex');
  
  const stripeSignature = `t=${timestamp},v1=${signature}`;
  
  return {
    payload,
    signature: stripeSignature,
    timestamp
  };
}

// Helper: Send webhook request
async function sendWebhook(eventData, options = {}) {
  return new Promise((resolve, reject) => {
    const {
      signature = null,
      tampered = false,
      oldTimestamp = false,
      customHeaders = {}
    } = options;
    
    let timestamp = Math.floor(Date.now() / 1000);
    if (oldTimestamp) {
      timestamp = Math.floor(Date.now() / 1000) - 400; // 400 seconds ago (> 5 min)
    }
    
    let signed = createSignedWebhookPayload(eventData, timestamp);
    let body = signed.payload;
    let sig = signed.signature;
    
    // Apply tampering if requested
    if (tampered) {
      sig = sig.replace(/[a-f0-9]/, 'x'); // Replace first hex char to break signature
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      ...customHeaders
    };
    
    if (signature !== null && signature !== 'none') {
      headers['Stripe-Signature'] = sig;
    } else if (signature === 'none') {
      // Don't include header
    }
    
    const url = new URL(WEBHOOK_PATH, API_URL);
    const req = http.request(url, {
      method: 'POST',
      headers
    }, (res) => {
      let data = '';
      
      res.on('data', chunk => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data ? JSON.parse(data).catch(e => data) : null,
          rawBody: data
        });
      });
    });
    
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Test cases
const tests = [];

// Test 1: Valid subscription.updated event
tests.push({
  name: '✅ Valid subscription.updated event',
  event: {
    id: 'evt_test_sub_update_001',
    type: 'customer.subscription.updated',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'sub_test_12345',
        object: 'subscription',
        customer: 'cus_test_12345',
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 2592000, // +30 days
        metadata: {}
      }
    }
  },
  options: {},
  expectedStatus: 200,
  description: 'Should verify signature and process event'
});

// Test 2: Tampered signature
tests.push({
  name: '❌ Tampered signature (security test)',
  event: {
    id: 'evt_test_tamper_001',
    type: 'customer.subscription.updated',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'sub_tamper_12345',
        status: 'active'
      }
    }
  },
  options: { tampered: true },
  expectedStatus: 401,
  description: 'Should reject tampered signature'
});

// Test 3: Old timestamp (>5 minutes)
tests.push({
  name: '⏱️ Old timestamp (>5 minutes)',
  event: {
    id: 'evt_test_old_ts_001',
    type: 'customer.subscription.updated',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'sub_old_ts_12345',
        status: 'active'
      }
    }
  },
  options: { oldTimestamp: true },
  expectedStatus: 401,
  description: 'Should reject timestamp outside acceptable range'
});

// Test 4: Missing signature header
tests.push({
  name: '🚫 Missing Stripe-Signature header',
  event: {
    id: 'evt_test_no_sig_001',
    type: 'customer.subscription.updated',
    data: {
      object: {
        id: 'sub_no_sig_12345',
        status: 'active'
      }
    }
  },
  options: { signature: 'none' },
  expectedStatus: 401,
  description: 'Should reject missing signature header'
});

// Test 5: Invalid signature format
tests.push({
  name: '📋 Invalid signature format',
  event: {
    id: 'evt_test_bad_fmt_001',
    type: 'customer.subscription.updated',
    data: {
      object: {
        id: 'sub_bad_fmt_12345',
        status: 'active'
      }
    }
  },
  options: { 
    customHeaders: { 'Stripe-Signature': 'invalid_header_format' }
  },
  expectedStatus: 401,
  description: 'Should reject invalid signature format'
});

// Test 6: Subscription deleted
tests.push({
  name: '🗑️ Subscription deleted event',
  event: {
    id: 'evt_test_sub_delete_001',
    type: 'customer.subscription.deleted',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'sub_delete_12345',
        customer: 'cus_delete_12345',
        status: 'canceled'
      }
    }
  },
  options: {},
  expectedStatus: 200,
  description: 'Should process subscription deletion'
});

// Test 7: Payment succeeded
tests.push({
  name: '💰 Payment succeeded event',
  event: {
    id: 'evt_test_pay_succ_001',
    type: 'invoice.payment_succeeded',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'inv_test_12345',
        subscription: 'sub_pay_succ_12345',
        customer: 'cus_pay_succ_12345',
        amount_paid: 1299,
        currency: 'usd'
      }
    }
  },
  options: {},
  expectedStatus: 200,
  description: 'Should process successful payment'
});

// Test 8: Payment failed
tests.push({
  name: '❌ Payment failed event',
  event: {
    id: 'evt_test_pay_fail_001',
    type: 'invoice.payment_failed',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'inv_fail_12345',
        subscription: 'sub_pay_fail_12345',
        customer: 'cus_pay_fail_12345',
        amount: 1299
      }
    }
  },
  options: {},
  expectedStatus: 200,
  description: 'Should process payment failure'
});

// Test 9: Customer deleted
tests.push({
  name: '🗑️ Customer deleted event',
  event: {
    id: 'evt_test_cust_del_001',
    type: 'customer.deleted',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'cus_deleted_12345',
        object: 'customer'
      }
    }
  },
  options: {},
  expectedStatus: 200,
  description: 'Should process customer deletion'
});

// Run tests
async function runTests() {
  console.log('🚀 Running webhook security tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    process.stdout.write(`${test.name}: `);
    
    try {
      const result = await sendWebhook(test.event, test.options);
      
      if (result.statusCode === test.expectedStatus) {
        console.log(`✅ PASS (${result.statusCode})`);
        console.log(`   └─ ${test.description}`);
        passed++;
      } else {
        console.log(`❌ FAIL (expected ${test.expectedStatus}, got ${result.statusCode})`);
        console.log(`   └─ Response: ${result.rawBody.substring(0, 100)}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      failed++;
    }
    
    console.log('');
  }
  
  // Summary
  console.log('='.repeat(50));
  console.log(`\n📊 Test Results:`);
  console.log(`   ✅ Passed: ${passed}/${tests.length}`);
  console.log(`   ❌ Failed: ${failed}/${tests.length}`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Webhook security is working correctly.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please review the webhook implementation.');
    process.exit(1);
  }
}

// Run with error handling
runTests().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});
