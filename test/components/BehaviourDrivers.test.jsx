// test/components/BehaviourDrivers.test.jsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import BehaviourDrivers from "../../src/components/BehaviourDrivers";

describe("BehaviourDrivers", () => {
  it("should render nothing when drivers array is empty", () => {
    const { container } = render(<BehaviourDrivers drivers={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("should render nothing when drivers prop is undefined", () => {
    const { container } = render(<BehaviourDrivers />);
    expect(container.firstChild).toBeNull();
  });

  it("should render nothing when drivers prop is null", () => {
    const { container } = render(<BehaviourDrivers drivers={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("should render the section title", () => {
    const drivers = [{ title: "Driver 1", impact: 10 }];
    render(<BehaviourDrivers drivers={drivers} />);

    expect(screen.getByText("What Drives Your Score")).toBeInTheDocument();
  });

  it("should render all drivers in the list", () => {
    const drivers = [
      { title: "Positive Savings Behavior", impact: 15 },
      { title: "High Debt Load", impact: -20 },
      { title: "Emergency Fund Present", impact: 12 },
    ];
    render(<BehaviourDrivers drivers={drivers} />);

    expect(screen.getByText("Positive Savings Behavior")).toBeInTheDocument();
    expect(screen.getByText("High Debt Load")).toBeInTheDocument();
    expect(screen.getByText("Emergency Fund Present")).toBeInTheDocument();
  });

  it("should render impact values for each driver", () => {
    const drivers = [
      { title: "Driver 1", impact: 10 },
      { title: "Driver 2", impact: -5 },
      { title: "Driver 3", impact: 8 },
    ];
    render(<BehaviourDrivers drivers={drivers} />);

    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("-5")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
  });

  it("should apply positive class for positive impact", () => {
    const drivers = [{ title: "Good Behavior", impact: 15 }];
    const { container } = render(<BehaviourDrivers drivers={drivers} />);

    const impactDiv = container.querySelector(".driver-impact.positive");
    expect(impactDiv).toBeInTheDocument();
  });

  it("should apply negative class for negative impact", () => {
    const drivers = [{ title: "Bad Behavior", impact: -10 }];
    const { container } = render(<BehaviourDrivers drivers={drivers} />);

    const impactDiv = container.querySelector(".driver-impact.negative");
    expect(impactDiv).toBeInTheDocument();
  });

  it("should apply positive class for zero impact", () => {
    const drivers = [{ title: "Neutral Behavior", impact: 0 }];
    const { container } = render(<BehaviourDrivers drivers={drivers} />);

    const impactDiv = container.querySelector(".driver-impact.positive");
    expect(impactDiv).toBeInTheDocument();
  });

  it("should render multiple drivers with correct structure", () => {
    const drivers = [
      { title: "Driver A", impact: 10 },
      { title: "Driver B", impact: -5 },
    ];
    const { container } = render(<BehaviourDrivers drivers={drivers} />);

    const liItems = container.querySelectorAll(".driver-item");
    expect(liItems).toHaveLength(2);
  });

  it("should handle drivers with missing title", () => {
    const drivers = [{ title: "", impact: 10 }];
    render(<BehaviourDrivers drivers={drivers} />);

    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("should handle drivers with missing impact", () => {
    const drivers = [{ title: "Driver without impact", impact: undefined }];
    const { container } = render(<BehaviourDrivers drivers={drivers} />);

    expect(screen.getByText("Driver without impact")).toBeInTheDocument();
    const impactDiv = container.querySelector(".driver-impact");
    expect(impactDiv).toBeInTheDocument();
  });

  it("should render with correct CSS classes", () => {
    const drivers = [{ title: "Test Driver", impact: 5 }];
    const { container } = render(<BehaviourDrivers drivers={drivers} />);

    expect(container.querySelector(".behaviour-drivers-card")).toBeInTheDocument();
    expect(container.querySelector(".result-heading")).toBeInTheDocument();
    expect(container.querySelector(".drivers-list")).toBeInTheDocument();
  });

  it("should handle large positive impact value", () => {
    const drivers = [{ title: "Big Win", impact: 99 }];
    render(<BehaviourDrivers drivers={drivers} />);

    expect(screen.getByText("99")).toBeInTheDocument();
  });

  it("should handle large negative impact value", () => {
    const drivers = [{ title: "Big Loss", impact: -99 }];
    render(<BehaviourDrivers drivers={drivers} />);

    expect(screen.getByText("-99")).toBeInTheDocument();
  });
});
