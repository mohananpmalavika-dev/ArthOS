/**
 * Accessibility Testing Helpers
 * Provides utilities for axe-core integration, keyboard navigation testing, and a11y validation
 */

import { axe, toHaveNoViolations } from "jest-axe";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";

expect.extend(toHaveNoViolations);

/**
 * Render a component and run axe accessibility checks
 * @param {React.ReactElement} component - Component to render
 * @param {Object} options - Optional render/axe options
 * @returns {Promise<Object>} - Axe results
 */
export async function renderAndCheckA11y(component, options = {}) {
  const { container } = render(component, options.renderOptions);
  const results = await axe(container);
  return results;
}

/**
 * Assert no accessibility violations
 * @param {Object} results - Axe results object
 */
export function expectNoViolations(results) {
  expect(results).toHaveNoViolations();
}

/**
 * Test keyboard navigation through focusable elements
 * @param {HTMLElement} container - Container with focusable elements
 * @param {Array<string>} expectedSelectors - Selectors of elements in tab order
 */
export async function testKeyboardNavigation(container, expectedSelectors) {
  const user = userEvent.setup();
  const elements = expectedSelectors.map(selector => container.querySelector(selector));

  // Tab through all elements
  for (const element of elements) {
    await user.tab();
    expect(document.activeElement).toBe(element);
  }
}

/**
 * Check focus visibility on an element
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} - True if element has visible focus indicator
 */
export function hasFocusVisible(element) {
  const styles = window.getComputedStyle(element);
  const hasOutline = styles.outlineWidth !== "0px" && styles.outlineStyle !== "none";
  const hasRing = element.className.includes("ring") || element.className.includes("focus");
  return hasOutline || hasRing;
}

/**
 * Verify ARIA attributes on an element
 * @param {HTMLElement} element - Element to check
 * @param {Object} expectedAttrs - Expected ARIA attributes { aria-label: "...", role: "..." }
 */
export function expectAriaAttributes(element, expectedAttrs) {
  Object.entries(expectedAttrs).forEach(([attr, value]) => {
    if (value === null) {
      expect(element).not.toHaveAttribute(attr);
    } else {
      expect(element).toHaveAttribute(attr, value);
    }
  });
}

/**
 * Check color contrast between two colors (simplified WCAG check)
 * @param {string} foreground - Foreground color (hex or rgb)
 * @param {string} background - Background color (hex or rgb)
 * @returns {number} - Contrast ratio
 */
export function getContrastRatio(foreground, background) {
  const getLuminance = (rgb) => {
    const [r, g, b] = rgb.match(/\d+/g).map(x => {
      const val = parseInt(x) / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standard
 * @param {string} foreground - Foreground color
 * @param {string} background - Background color
 * @param {string} type - "normal" (4.5:1) or "large" (3:1)
 * @returns {boolean} - True if meets standard
 */
export function meetsWCAGAA(foreground, background, type = "normal") {
  const contrast = getContrastRatio(foreground, background);
  const minContrast = type === "normal" ? 4.5 : 3;
  return contrast >= minContrast;
}

/**
 * Test that element can be focused and receives focus-visible styles
 * @param {HTMLElement} element - Focusable element
 */
export async function testFocusManagement(element) {
  element.focus();
  expect(document.activeElement).toBe(element);

  // Check for visible focus indicator
  const styles = window.getComputedStyle(element, ":focus-visible");
  const isFocusVisible =
    styles.outlineWidth !== "0px" ||
    element.className.includes("ring") ||
    element.className.includes("focus");

  return isFocusVisible;
}

/**
 * Verify live region updates for screen readers
 * @param {HTMLElement} region - Element with aria-live
 * @param {string} expectedMessage - Message to appear
 * @param {number} timeout - Max time to wait (ms)
 */
export async function waitForLiveRegion(region, expectedMessage, timeout = 3000) {
  return new Promise((resolve, reject) => {
    const observer = new MutationObserver(() => {
      if (region.textContent.includes(expectedMessage)) {
        observer.disconnect();
        resolve(true);
      }
    });

    observer.observe(region, { characterData: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Live region message not found: ${expectedMessage}`));
    }, timeout);
  });
}

export default {
  renderAndCheckA11y,
  expectNoViolations,
  testKeyboardNavigation,
  hasFocusVisible,
  expectAriaAttributes,
  getContrastRatio,
  meetsWCAGAA,
  testFocusManagement,
  waitForLiveRegion,
};
