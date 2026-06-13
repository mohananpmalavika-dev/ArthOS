/**
 * Form validation utilities for ARTH.OS
 */

export function validateAssessmentStep(step, assessment) {
  const issues = [];

  if (step === 0) {
    // Behaviour step validation
    const behaviour = assessment.behaviour || {};
    const behaviourKeys = Object.keys(behaviour).filter(k => k !== "mode");

    if (
      behaviourKeys.length === 0 ||
      Object.values(behaviour).every(v => v === "" || v === undefined)
    ) {
      issues.push("Please answer at least one question in this step");
    }
  } else if (step === 1) {
    // Awareness step validation
    const awareness = assessment.awareness || {};
    const awarenessKeys = Object.keys(awareness).filter(k => k !== "mode");

    if (
      awarenessKeys.length === 0 ||
      Object.values(awareness).every(v => v === "" || v === undefined)
    ) {
      issues.push("Please answer at least one question in this step");
    }
  } else if (step === 2) {
    // Profile step validation
    const profile = assessment.profile || {};

    // Check required numeric fields
    if (profile.monthlyIncome === "" || profile.monthlyIncome === undefined) {
      issues.push("Monthly income is required");
    } else if (Number(profile.monthlyIncome) < 0) {
      issues.push("Monthly income cannot be negative");
    }

    if (profile.monthlyExpense === "" || profile.monthlyExpense === undefined) {
      issues.push("Monthly expense is required");
    } else if (Number(profile.monthlyExpense) < 0) {
      issues.push("Monthly expense cannot be negative");
    }

    if (profile.emergencySavingsFixed !== undefined && Number(profile.emergencySavingsFixed) < 0) {
      issues.push("Emergency savings cannot be negative");
    }

    if (profile.totalDebt !== undefined && Number(profile.totalDebt) < 0) {
      issues.push("Total debt cannot be negative");
    }
  } else if (step === 3) {
    // Habits step validation
    const habits = assessment.habits || {};

    if (Object.values(habits).every(v => v === "" || v === undefined)) {
      issues.push("Please answer at least one question in this step");
    }
  }

  return {
    isValid: issues.length === 0,
    errors: issues
  };
}

export function validateNumericInput(
  value,
  minValue = 0,
  maxValue = Infinity,
  allowDecimals = true
) {
  if (value === "" || value === undefined || value === null) {
    return { isValid: false, error: "This field is required" };
  }

  const numValue = allowDecimals ? parseFloat(value) : parseInt(value, 10);

  if (Number.isNaN(numValue)) {
    return { isValid: false, error: "Please enter a valid number" };
  }

  if (numValue < minValue) {
    return { isValid: false, error: `Minimum value is ${minValue}` };
  }

  if (numValue > maxValue) {
    return { isValid: false, error: `Maximum value is ${maxValue}` };
  }

  return { isValid: true, error: null };
}

export function confirmEmptySubmission() {
  return window.confirm(
    "You haven't answered all questions. Continue anyway?\n\n" +
      "Your answers so far will be saved."
  );
}

export function validateEmailFormat(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
