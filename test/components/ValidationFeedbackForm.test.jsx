// test/components/ValidationFeedbackForm.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ValidationFeedbackForm from "../../src/components/ValidationFeedbackForm";

describe("ValidationFeedbackForm", () => {
  let mockOnSubmitFeedback;

  beforeEach(() => {
    mockOnSubmitFeedback = vi.fn();
  });

  it("should render the feedback form when hasVoted is false", () => {
    render(
      <ValidationFeedbackForm
        healthScore={500}
        onSubmitFeedback={mockOnSubmitFeedback}
      />
    );

    expect(screen.getByText("What Did You Find Most Valuable?")).toBeInTheDocument();
  });

  it("should display all impact option buttons", () => {
    render(
      <ValidationFeedbackForm
        healthScore={500}
        onSubmitFeedback={mockOnSubmitFeedback}
      />
    );

    expect(screen.getByText("Time to Financial Crisis")).toBeInTheDocument();
    expect(screen.getByText("Next Action to Take")).toBeInTheDocument();
    expect(screen.getByText("Visibility Blind Spot")).toBeInTheDocument();
    expect(screen.getByText("Money Archetype Profile")).toBeInTheDocument();
  });

  it("should update selectedImpact when option is clicked", async () => {
    render(
      <ValidationFeedbackForm
        healthScore={500}
        onSubmitFeedback={mockOnSubmitFeedback}
      />
    );

    const survivalOption = screen.getByDisplayValue("survival_months");
    await userEvent.click(survivalOption);

    expect(survivalOption).toBeChecked();
  });

  it("should update qualitativeNote textarea", async () => {
    render(
      <ValidationFeedbackForm
        healthScore={500}
        onSubmitFeedback={mockOnSubmitFeedback}
      />
    );

    const textarea = screen.getByPlaceholderText(/share any additional/i);
    await userEvent.type(textarea, "This was helpful!");

    expect(textarea.value).toBe("This was helpful!");
  });

  it("should call onSubmitFeedback with correct payload on submit", async () => {
    mockOnSubmitFeedback.mockResolvedValue(true);

    render(
      <ValidationFeedbackForm
        healthScore={750}
        onSubmitFeedback={mockOnSubmitFeedback}
      />
    );

    const option = screen.getByDisplayValue("recommended_action");
    await userEvent.click(option);

    const textarea = screen.getByPlaceholderText(/share any additional/i);
    await userEvent.type(textarea, "Great insight");

    const submitBtn = screen.getByRole("button", { name: /submit feedback/i });
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockOnSubmitFeedback).toHaveBeenCalledWith({
        score_context: { health_score: 750 },
        primary_value_driver: "recommended_action",
        user_feedback_notes: "Great insight",
      });
    });
  });

  it("should show success message after successful submit", async () => {
    mockOnSubmitFeedback.mockResolvedValue(true);

    render(
      <ValidationFeedbackForm
        healthScore={500}
        onSubmitFeedback={mockOnSubmitFeedback}
      />
    );

    const option = screen.getByDisplayValue("survival_months");
    await userEvent.click(option);

    const submitBtn = screen.getByRole("button", { name: /submit feedback/i });
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Thanks.*feedback received/i)).toBeInTheDocument();
    });
  });

  it("should show error message on failed submit", async () => {
    mockOnSubmitFeedback.mockResolvedValue(false);

    render(
      <ValidationFeedbackForm
        healthScore={500}
        onSubmitFeedback={mockOnSubmitFeedback}
      />
    );

    const option = screen.getByDisplayValue("awareness_gap");
    await userEvent.click(option);

    const submitBtn = screen.getByRole("button", { name: /submit feedback/i });
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/couldn't be submitted/i)
      ).toBeInTheDocument();
    });
  });

  it("should handle submission error gracefully", async () => {
    mockOnSubmitFeedback.mockRejectedValue(new Error("Network error"));

    render(
      <ValidationFeedbackForm
        healthScore={500}
        onSubmitFeedback={mockOnSubmitFeedback}
      />
    );

    const option = screen.getByDisplayValue("personality_archetype");
    await userEvent.click(option);

    const submitBtn = screen.getByRole("button", { name: /submit feedback/i });
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/couldn't be submitted/i)
      ).toBeInTheDocument();
    });
  });

  it("should disable submit button when no option selected", () => {
    render(
      <ValidationFeedbackForm
        healthScore={500}
        onSubmitFeedback={mockOnSubmitFeedback}
      />
    );

    const submitBtn = screen.getByRole("button", { name: /submit feedback/i });
    expect(submitBtn).toBeDisabled();
  });

  it("should enable submit button when option is selected", async () => {
    render(
      <ValidationFeedbackForm
        healthScore={500}
        onSubmitFeedback={mockOnSubmitFeedback}
      />
    );

    const option = screen.getByDisplayValue("survival_months");
    await userEvent.click(option);

    const submitBtn = screen.getByRole("button", { name: /submit feedback/i });
    expect(submitBtn).not.toBeDisabled();
  });

  it("should handle missing healthScore gracefully", () => {
    render(
      <ValidationFeedbackForm onSubmitFeedback={mockOnSubmitFeedback} />
    );

    expect(screen.getByText("What Did You Find Most Valuable?")).toBeInTheDocument();
  });

  it("should reset isSubmitting state after submit completes", async () => {
    mockOnSubmitFeedback.mockResolvedValue(true);

    render(
      <ValidationFeedbackForm
        healthScore={500}
        onSubmitFeedback={mockOnSubmitFeedback}
      />
    );

    const option = screen.getByDisplayValue("survival_months");
    await userEvent.click(option);

    const submitBtn = screen.getByRole("button", { name: /submit feedback/i });
    await userEvent.click(submitBtn);

    await waitFor(() => {
      // After success, should show the thanks message
      expect(screen.getByText(/Thanks.*feedback received/i)).toBeInTheDocument();
    });
  });
});
