/**
 * test/fixtures/mocks.js
 * Mock implementations and helpers
 */

import { vi } from 'vitest';

/**
 * Mock Supabase client
 */
export function createMockSupabaseClient() {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'user_test_123',
              email: 'test@example.com',
            },
          },
        },
      }),
      onAuthStateChange: vi.fn((callback) => {
        return {
          data: { subscription: { unsubscribe: vi.fn() } },
        };
      }),
    },
    from: vi.fn((table) => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: {}, error: null }),
    })),
  };
}

/**
 * Mock localStorage
 */
export function createMockLocalStorage() {
  let store = {};
  
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index) => Object.keys(store)[index] || null,
  };
}

/**
 * Mock window.fetch
 */
export function createMockFetch(responseData = {}, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status < 400,
    status,
    json: vi.fn().mockResolvedValue(responseData),
    text: vi.fn().mockResolvedValue(JSON.stringify(responseData)),
    blob: vi.fn().mockResolvedValue(new Blob()),
  });
}

/**
 * Mock OpenAI client
 */
export function createMockOpenAIClient() {
  return {
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: 'Mock AI response',
              },
            },
          ],
        }),
      },
    },
  };
}

/**
 * Mock Stripe client
 */
export function createMockStripeClient() {
  return {
    checkout: {
      sessions: {
        create: vi.fn().mockResolvedValue({
          id: 'cs_test_123',
          url: 'https://checkout.stripe.com/test',
        }),
      },
    },
    customers: {
      create: vi.fn().mockResolvedValue({
        id: 'cus_test_123',
        email: 'test@example.com',
      }),
      retrieve: vi.fn().mockResolvedValue({
        id: 'cus_test_123',
        subscriptions: { data: [] },
      }),
    },
    subscriptions: {
      retrieve: vi.fn().mockResolvedValue({
        id: 'sub_test_123',
        status: 'active',
        items: { data: [{ price: { product: 'prod_test' } }] },
      }),
    },
  };
}

/**
 * Wait for async operations in tests
 */
export async function waitFor(callback, options = {}) {
  const timeout = options.timeout || 1000;
  const interval = options.interval || 50;
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      callback();
      return;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
  
  throw new Error('Timeout waiting for condition');
}

/**
 * Mock performance API
 */
export function createMockPerformance() {
  return {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByName: vi.fn(() => []),
  };
}

/**
 * Mock console methods for test assertions
 */
export function mockConsole() {
  const originalConsole = { ...console };
  
  const mocks = {
    log: vi.spyOn(console, 'log').mockImplementation(() => {}),
    error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
    info: vi.spyOn(console, 'info').mockImplementation(() => {}),
  };
  
  return {
    mocks,
    restore: () => {
      Object.values(mocks).forEach(mock => mock.mockRestore());
    },
  };
}

export default {
  createMockSupabaseClient,
  createMockLocalStorage,
  createMockFetch,
  createMockOpenAIClient,
  createMockStripeClient,
  waitFor,
  createMockPerformance,
  mockConsole,
};
