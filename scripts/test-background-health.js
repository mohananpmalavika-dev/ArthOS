#!/usr/bin/env node

/**
 * Background services smoke test.
 *
 * Verifies:
 * - GET /api/background/health returns an operational payload
 * - POST /api/durableJobProcessor accepts and processes a test job
 */

import crypto from 'crypto';
import http from 'http';
import https from 'https';
import { URL } from 'url';

const API_URL = process.env.API_URL || 'http://localhost:3000';
const BACKGROUND_HEALTH_PATH = '/api/background/health';
const DURABLE_PROCESSOR_PATH = '/api/durableJobProcessor';

function debugLog(...args) {
  console.log('[background-health-test]', ...args);
}

function makeRequest(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const transport = parsed.protocol === 'https:' ? https : http;
    const request = transport.request(
      parsed,
      {
        method: options.method || 'GET',
        headers: options.headers || {}
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          let parsedBody = data;
          try {
            parsedBody = data ? JSON.parse(data) : null;
          } catch (err) {
            // keep raw body if JSON parse fails
          }
          resolve({ statusCode: res.statusCode, headers: res.headers, body: parsedBody, rawBody: data });
        });
      }
    );

    request.on('error', reject);

    if (body) {
      request.write(body);
    }

    request.end();
  });
}

async function runHealthCheck() {
  debugLog(`Checking ${API_URL}${BACKGROUND_HEALTH_PATH}`);
  const res = await makeRequest(`${API_URL}${BACKGROUND_HEALTH_PATH}`);
  if (res.statusCode !== 200) {
    throw new Error(`Expected 200 from health endpoint, got ${res.statusCode}`);
  }

  if (!res.body || res.body.status !== 'operational') {
    throw new Error(`Background health returned unexpected payload: ${JSON.stringify(res.body)}`);
  }

  debugLog('Background health endpoint is operational.');
  return res.body;
}

async function runProcessorSmokeTest() {
  const jobId = `smoke-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const job = {
    jobId,
    type: 'smoke_test',
    payload: {
      test: true,
      timestamp: new Date().toISOString()
    },
    priority: 'normal',
    retries: 0,
    maxRetries: 1
  };

  debugLog(`Posting test job to ${API_URL}${DURABLE_PROCESSOR_PATH}`);
  const body = JSON.stringify(job);
  const res = await makeRequest(`${API_URL}${DURABLE_PROCESSOR_PATH}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    }
  }, body);

  if (res.statusCode !== 200) {
    throw new Error(`Expected 200 from durable processor, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
  }

  if (!res.body || res.body.status !== 'success') {
    throw new Error(`Durable processor returned unexpected payload: ${JSON.stringify(res.body)}`);
  }

  debugLog(`Durable processor accepted test job ${jobId}.`);
  return res.body;
}

async function main() {
  try {
    debugLog('Starting background services smoke test');
    const health = await runHealthCheck();
    debugLog('Health response:', JSON.stringify(health, null, 2));

    const processorResult = await runProcessorSmokeTest();
    debugLog('Processor response:', JSON.stringify(processorResult, null, 2));

    debugLog('✅ Background services smoke test passed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Background services smoke test failed:', error.message || error);
    process.exit(1);
  }
}

main();
