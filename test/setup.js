import "@testing-library/jest-dom";
import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

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

// Mock window.matchMedia
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

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// Mock ResizeObserver for recharts ResponsiveContainer in jsdom
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = global.ResizeObserver || MockResizeObserver;
