import "@testing-library/jest-dom";
import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";

// Register jest-axe matcher only if available (some Vitest environments can fail here)
if (toHaveNoViolations) {
  expect.extend(toHaveNoViolations);
}

// Make axe available globally for accessibility tests
// jest-axe's exported `axe` may not be initialized in some Vitest setups.
// Provide a safe fallback to prevent tests from crashing during setup.
global.axe = axe || (globalThis.axe ?? null);

// If jest-axe doesn't attach matchers properly, avoid throwing here.
if (!expect?.extend) {
  // no-op; Vitest should have expect
}


// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock DOM APIs used by components/libraries.
// Guard with try/catch so test setup doesn't crash in non-jsdom environments.
// Mock DOM APIs used by components/libraries.
// Keep this extremely defensive because Vitest/JSDOM initialization can differ per environment.
if (typeof window !== 'undefined' && window) {
  try {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  } catch {
    // ignore
  }
}

try {
  if (typeof Element !== 'undefined' && Element?.prototype) {
    Element.prototype.scrollIntoView = vi.fn();
  }
} catch {
  // ignore
}

try {
  class MockResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  global.ResizeObserver = global.ResizeObserver || MockResizeObserver;
} catch {
  // ignore
}


