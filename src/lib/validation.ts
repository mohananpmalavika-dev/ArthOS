/**
 * src/lib/validation.ts
 * Form validation utilities for ARTH.OS with full type safety
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

interface NumericValidationResult {
  isValid: boolean;
  error: string | null;
}

interface AssessmentStep {
  behaviour?: Record<string, string | number | undefined>;
  awareness?: Record<string, string | number | undefined>;
  profile?: Record<string, string | number | undefined>;
  habits?: Record<string, string | number | undefined>;
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate a specific step of the assessment form
 * @param step - Step number (0=behaviour, 1=awareness, 2=profile, 3=habits)
 * @param assessment - Assessment object containing user responses
 * @returns ValidationResult with isValid flag and error messages
 */
export function validateAssessmentStep(step: number, assessment: AssessmentStep): ValidationResult {
  const issues: string[] = [];

  if (step === 0) {
    // Behaviour step validation
    const behaviour = assessment.behaviour || {};
    const behaviourKeys = Object.keys(behaviour).filter(k => k !== 'mode');

    if (behaviourKeys.length === 0 || Object.values(behaviour).every(v => v === '' || v === undefined)) {
      issues.push('Please answer at least one question in this step');
    }
  } else if (step === 1) {
    // Awareness step validation
    const awareness = assessment.awareness || {};
    const awarenessKeys = Object.keys(awareness).filter(k => k !== 'mode');

    if (awarenessKeys.length === 0 || Object.values(awareness).every(v => v === '' || v === undefined)) {
      issues.push('Please answer at least one question in this step');
    }
  } else if (step === 2) {
    // Profile step validation
    const profile = assessment.profile || {};

    // Check required numeric fields
    if (profile.monthlyIncome === '' || profile.monthlyIncome === undefined) {
      issues.push('Monthly income is required');
    } else if (Number(profile.monthlyIncome) < 0) {
      issues.push('Monthly income cannot be negative');
    }

    if (profile.monthlyExpense === '' || profile.monthlyExpense === undefined) {
      issues.push('Monthly expense is required');
    } else if (Number(profile.monthlyExpense) < 0) {
      issues.push('Monthly expense cannot be negative');
    }

    if (profile.emergencySavingsFixed !== undefined && Number(profile.emergencySavingsFixed) < 0) {
      issues.push('Emergency savings cannot be negative');
    }

    if (profile.totalDebt !== undefined && Number(profile.totalDebt) < 0) {
      issues.push('Total debt cannot be negative');
    }
  } else if (step === 3) {
    // Habits step validation
    const habits = assessment.habits || {};

    if (Object.values(habits).every(v => v === '' || v === undefined)) {
      issues.push('Please answer at least one question in this step');
    }
  }

  return {
    isValid: issues.length === 0,
    errors: issues,
  };
}

/**
 * Validate numeric input with min/max bounds
 * @param value - Input value to validate
 * @param minValue - Minimum allowed value (default: 0)
 * @param maxValue - Maximum allowed value (default: Infinity)
 * @param allowDecimals - Allow decimal numbers (default: true)
 * @returns NumericValidationResult with isValid flag and error message
 */
export function validateNumericInput(
  value: string | number | undefined | null,
  minValue: number = 0,
  maxValue: number = Infinity,
  allowDecimals: boolean = true
): NumericValidationResult {
  if (value === '' || value === undefined || value === null) {
    return { isValid: false, error: 'This field is required' };
  }

  const numValue = allowDecimals ? parseFloat(String(value)) : parseInt(String(value), 10);

  if (Number.isNaN(numValue)) {
    return { isValid: false, error: 'Please enter a valid number' };
  }

  if (numValue < minValue) {
    return { isValid: false, error: `Minimum value is ${minValue}` };
  }

  if (numValue > maxValue) {
    return { isValid: false, error: `Maximum value is ${maxValue}` };
  }

  return { isValid: true, error: null };
}

/**
 * Confirm empty form submission with user dialog
 * @returns True if user confirms, false if user cancels
 */
export function confirmEmptySubmission(): boolean {
  if (typeof window === 'undefined') return false;

  return window.confirm(
    'You haven\'t answered all questions. Continue anyway?\n\n' +
    'Your answers so far will be saved.'
  );
}

/**
 * Validate email format using regex
 * @param email - Email string to validate
 * @returns True if email format is valid, false otherwise
 */
export function validateEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * Requires at least 8 characters, one uppercase, one lowercase, one number, one special char
 * @param password - Password string to validate
 * @returns Object with isValid flag and error message
 */
export function validatePasswordStrength(password: string): NumericValidationResult {
  if (!password || password.length === 0) {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters' };
  }

  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' };
  }

  if (!/\d/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one special character' };
  }

  return { isValid: true, error: null };
}
