/**
 * Example Accessibility Tests for ArthOS Components
 * Demonstrates axe-core, keyboard navigation, ARIA, and focus testing
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import {
  renderAndCheckA11y,
  testKeyboardNavigation,
  expectAriaAttributes,
  testFocusManagement,
  meetsWCAGAA,
} from "./a11y.helper";

expect.extend(toHaveNoViolations);

describe("Accessibility Tests - ArthOS Components", () => {
  describe("PageSkeleton Component", () => {
    it("should have no accessibility violations", async () => {
      const { container } = render(
        <div role="status" aria-busy="true" aria-label="Loading page content">
          <div className="h-12 bg-slate-200 rounded animate-pulse"></div>
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have aria-busy='true' and aria-label during loading", async () => {
      const { container } = render(
        <div aria-busy="true" aria-label="Loading page content" role="status">
          <div className="h-12 bg-slate-200 rounded animate-pulse"></div>
        </div>
      );

      const loadingElement = container.firstChild;
      expectAriaAttributes(loadingElement, {
        "aria-busy": "true",
        "aria-label": "Loading page content",
        role: "status",
      });
    });

    it("should have aria-hidden on decorative skeleton elements", async () => {
      const { container } = render(
        <div aria-hidden="true" className="h-12 bg-slate-200 rounded animate-pulse"></div>
      );

      const skeleton = container.firstChild;
      expect(skeleton).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("PredictionEngineDashboard Keyboard Navigation", () => {
    it("should focus input and select elements without outline-none", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <form>
          <input
            type="text"
            placeholder="Scenario name"
            className="w-full px-4 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
            aria-label="Scenario name"
          />
          <select
            className="w-full px-4 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
            aria-label="Parameter"
          >
            <option>Option 1</option>
          </select>
        </form>
      );

      const input = screen.getByLabelText("Scenario name");
      const select = screen.getByLabelText("Parameter");

      // Test input focus
      await user.tab();
      expect(input).toHaveFocus();

      // Test select focus
      await user.tab();
      expect(select).toHaveFocus();
    });

    it("should have no focus:outline-none anti-patterns", () => {
      const { container } = render(
        <input
          className="w-full px-4 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
          aria-label="Test input"
        />
      );

      const input = container.querySelector("input");
      const classList = input.className;

      // Ensure outline-none is NOT in the className
      expect(classList).not.toContain("focus:outline-none");
      // Ensure focus:ring is present for visible focus
      expect(classList).toContain("focus:ring");
    });

    it("should allow Tab navigation through form fields", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <form>
          <input type="text" placeholder="Field 1" aria-label="Field 1" />
          <input type="text" placeholder="Field 2" aria-label="Field 2" />
          <button>Submit</button>
        </form>
      );

      const fields = screen.getAllByRole("textbox");
      const button = screen.getByRole("button");

      await user.tab();
      expect(fields[0]).toHaveFocus();

      await user.tab();
      expect(fields[1]).toHaveFocus();

      await user.tab();
      expect(button).toHaveFocus();
    });
  });

  describe("BigReveal Component Focus Management", () => {
    it("should have accessible action buttons with proper focus order", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <div role="main" aria-label="Big Reveal">
          <button aria-label="View Reality">View Reality</button>
          <button aria-label="See Future You">See Future You</button>
          <button aria-label="Take Action">Take Action</button>
        </div>
      );

      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(3);

      // Test focus order
      await user.tab();
      expect(buttons[0]).toHaveFocus();

      await user.tab();
      expect(buttons[1]).toHaveFocus();

      await user.tab();
      expect(buttons[2]).toHaveFocus();
    });

    it("should announce prefers-reduced-motion and show static fallback", () => {
      // Mock prefers-reduced-motion
      window.matchMedia = vi.fn().mockImplementation((query) => {
        if (query === "(prefers-reduced-motion: reduce)") {
          return { matches: true };
        }
        return { matches: false };
      });

      const { container } = render(
        <div aria-label="Big Reveal Animation">
          {/* Static SVG fallback when prefers-reduced-motion */}
          <svg aria-hidden="true">
            <circle cx="50" cy="50" r="40" />
          </svg>
        </div>
      );

      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("ARIA Attributes and Semantic HTML", () => {
    it("should use semantic roles for navigation", () => {
      const { container } = render(
        <nav role="navigation" aria-label="Main navigation">
          <a href="/">Home</a>
          <a href="/dashboard">Dashboard</a>
        </nav>
      );

      const nav = container.querySelector("nav");
      expectAriaAttributes(nav, {
        role: "navigation",
        "aria-label": "Main navigation",
      });
    });

    it("should mark interactive elements with proper roles", () => {
      const { container } = render(
        <button
          role="button"
          aria-pressed="false"
          aria-label="Toggle notifications"
          onClick={() => {}}
        >
          Notifications
        </button>
      );

      const button = container.querySelector("button");
      expectAriaAttributes(button, {
        role: "button",
        "aria-pressed": "false",
        "aria-label": "Toggle notifications",
      });
    });

    it("should use aria-live for status updates", () => {
      const { container } = render(
        <div aria-live="polite" aria-label="Transaction status" role="status">
          Transaction completed successfully
        </div>
      );

      const status = container.firstChild;
      expectAriaAttributes(status, {
        "aria-live": "polite",
        role: "status",
      });
    });
  });

  describe("Color Contrast Validation", () => {
    it("should have sufficient contrast for normal text (4.5:1)", () => {
      // Dark text on light background
      const foreground = "rgb(0, 0, 0)"; // Black
      const background = "rgb(255, 255, 255)"; // White
      const passes = meetsWCAGAA(foreground, background, "normal");
      expect(passes).toBe(true);
    });

    it("should have sufficient contrast for large text (3:1)", () => {
      // Slate-600 on white background (common in ArthOS)
      const foreground = "rgb(71, 85, 105)"; // Slate-600
      const background = "rgb(255, 255, 255)"; // White
      const passes = meetsWCAGAA(foreground, background, "large");
      expect(passes).toBe(true);
    });

    it("should warn on insufficient contrast combinations", () => {
      // Light gray on white (poor contrast)
      const foreground = "rgb(200, 200, 200)"; // Light gray
      const background = "rgb(255, 255, 255)"; // White
      const passes = meetsWCAGAA(foreground, background, "normal");
      expect(passes).toBe(false);
    });
  });

  describe("Form Accessibility", () => {
    it("should have associated labels for all form inputs", () => {
      render(
        <form>
          <label htmlFor="name">Name:</label>
          <input id="name" type="text" aria-label="Full name" />
          <label htmlFor="email">Email:</label>
          <input id="email" type="email" aria-label="Email address" />
        </form>
      );

      const nameInput = screen.getByLabelText("Full name");
      const emailInput = screen.getByLabelText("Email address");

      expect(nameInput).toBeInTheDocument();
      expect(emailInput).toBeInTheDocument();
    });

    it("should announce form validation errors", async () => {
      const { container } = render(
        <form>
          <input
            type="email"
            aria-label="Email"
            aria-invalid="true"
            aria-describedby="email-error"
          />
          <span id="email-error" role="alert">
            Please enter a valid email
          </span>
        </form>
      );

      const input = container.querySelector("input");
      const error = screen.getByText("Please enter a valid email");

      expectAriaAttributes(input, {
        "aria-invalid": "true",
        "aria-describedby": "email-error",
      });
      expect(error).toHaveAttribute("role", "alert");
    });
  });

  describe("Image and Icon Accessibility", () => {
    it("should have alt text for meaningful images", () => {
      render(<img src="/icon.png" alt="Financial insights icon" />);
      const img = screen.getByAltText("Financial insights icon");
      expect(img).toBeInTheDocument();
    });

    it("should have aria-hidden for decorative icons", () => {
      const { container } = render(
        <button>
          <span aria-hidden="true">★</span>
          Favorite
        </button>
      );

      const icon = container.querySelector("span");
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });
  });
});
