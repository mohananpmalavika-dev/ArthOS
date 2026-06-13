// test/components/DecisionSimulator.test.jsx
import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DecisionSimulator from "../../src/components/DecisionSimulator";

describe("DecisionSimulator", () => {
  const mockProfile = {
    monthlyIncome: 100000,
    monthlyExpenses: 60000,
    emergencySavingsFixed: 300000,
    emergencySavingsDiscretionary: 100000,
    totalDebt: 200000,
    monthlyLiabilities: 5000,
  };

  const mockBehaviour = {
    emotionalMoneyLevel: "fully_logical",
    plannedPurchasesOnly: "always",
    impulseWaitRule: "always",
  };

  it("should render the simulator component", () => {
    render(
      <DecisionSimulator
        profile={mockProfile}
        behaviour={mockBehaviour}
      />
    );

    expect(screen.getByText(/Cognitive Decision Simulator/i)).toBeInTheDocument();
  });

  it("should display input field for purchase value", () => {
    render(
      <DecisionSimulator
        profile={mockProfile}
        behaviour={mockBehaviour}
      />
    );

    const input = screen.getByPlaceholderText("45000");
    expect(input).toBeInTheDocument();
  });

  it("should accept numeric input for purchase value", async () => {
    render(
      <DecisionSimulator
        profile={mockProfile}
        behaviour={mockBehaviour}
      />
    );

    const input = screen.getByPlaceholderText("45000");
    await userEvent.type(input, "50000");

    expect(input.value).toBe("50000");
  });

  it("should calculate and display impact metrics", async () => {
    render(
      <DecisionSimulator
        profile={mockProfile}
        behaviour={mockBehaviour}
      />
    );

    const input = screen.getByPlaceholderText("45000");
    await userEvent.type(input, "100000");

    // Wait for calculation to show impact
    await waitFor(() => {
      expect(screen.getByText(/Current runway/i)).toBeInTheDocument();
    });
  });

  it("should display current runway when amount entered", async () => {
    render(
      <DecisionSimulator
        profile={mockProfile}
        behaviour={mockBehaviour}
      />
    );

    const input = screen.getByPlaceholderText("45000");
    await userEvent.type(input, "50000");

    await waitFor(() => {
      expect(screen.getByText(/Current runway/i)).toBeInTheDocument();
    });
  });

  it("should display after purchase runway", async () => {
    render(
      <DecisionSimulator
        profile={mockProfile}
        behaviour={mockBehaviour}
      />
    );

    const input = screen.getByPlaceholderText("45000");
    await userEvent.type(input, "50000");

    await waitFor(() => {
      expect(screen.getByText(/After purchase/i)).toBeInTheDocument();
    });
  });

  it("should show placeholder text when no amount entered", () => {
    render(
      <DecisionSimulator
        profile={mockProfile}
        behaviour={mockBehaviour}
      />
    );

    expect(
      screen.getByText(/Enter an amount to see how a purchase affects/i)
    ).toBeInTheDocument();
  });

  it("should handle zero purchase value", async () => {
    render(
      <DecisionSimulator
        profile={mockProfile}
        behaviour={mockBehaviour}
      />
    );

    const input = screen.getByPlaceholderText("45000");
    await userEvent.type(input, "0");

    expect(input.value).toBe("0");
  });

  it("should clear input value", async () => {
    render(
      <DecisionSimulator
        profile={mockProfile}
        behaviour={mockBehaviour}
      />
    );

    const input = screen.getByPlaceholderText("45000");
    await userEvent.type(input, "50000");
    await userEvent.clear(input);

    expect(input.value).toBe("");
  });

  it("should handle very large purchase amounts", async () => {
    render(
      <DecisionSimulator
        profile={mockProfile}
        behaviour={mockBehaviour}
      />
    );

    const input = screen.getByPlaceholderText("45000");
    await userEvent.type(input, "5000000");

    expect(input.value).toBe("5000000");
  });

  it("should display friction warning and recommendation", async () => {
    render(
      <DecisionSimulator
        profile={mockProfile}
        behaviour={mockBehaviour}
      />
    );

    const input = screen.getByPlaceholderText("45000");
    await userEvent.type(input, "100000");

    await waitFor(() => {
      expect(screen.getByText(/Friction warning/i)).toBeInTheDocument();
    });
  });

  it("should have properly structured component", () => {
    const { container } = render(
      <DecisionSimulator
        profile={mockProfile}
        behaviour={mockBehaviour}
      />
    );

    expect(container.querySelector(".simulator-card")).toBeInTheDocument();
  });

  it("should update calculation when input changes", async () => {
    render(
      <DecisionSimulator
        profile={mockProfile}
        behaviour={mockBehaviour}
      />
    );

    const input = screen.getByPlaceholderText("45000");
    
    await userEvent.type(input, "10000");
    await waitFor(() => {
      expect(screen.getByText(/Current runway/i)).toBeInTheDocument();
    });

    await userEvent.clear(input);
    await userEvent.type(input, "50000");

    // Should still display current runway after update
    expect(screen.getByText(/Current runway/i)).toBeInTheDocument();
  });

  it("should render subtitle text", () => {
    render(
      <DecisionSimulator
        profile={mockProfile}
        behaviour={mockBehaviour}
      />
    );

    expect(
      screen.getByText(/Simulate an unplanned expense/i)
    ).toBeInTheDocument();
  });

  it("should have proper label for input field", () => {
    render(
      <DecisionSimulator
        profile={mockProfile}
        behaviour={mockBehaviour}
      />
    );

    expect(screen.getByText(/Proposed purchase price/i)).toBeInTheDocument();
  });

  it("should display risk indicator when amount entered", async () => {
    render(
      <DecisionSimulator
        profile={mockProfile}
        behaviour={mockBehaviour}
      />
    );

    const input = screen.getByPlaceholderText("45000");
    await userEvent.type(input, "100000");

    await waitFor(() => {
      expect(screen.getByText(/Risk Change/i)).toBeInTheDocument();
    });
  });
});
