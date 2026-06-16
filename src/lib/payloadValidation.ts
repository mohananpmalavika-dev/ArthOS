/**
 * Payload Validation Module
 *
 * Runtime validation and versioning for cross-module data contracts:
 * - assessment (input form data)
 * - result (scoring output)
 * - memory events (financial memory, decisions, goals, twins)
 * - twins (digital twin snapshots)
 *
 * Each schema is versioned independently. Consumers must check schema_version
 * before consuming payloads.
 */

// ============================================================================
// TYPE DEFINITIONS FOR VALIDATION
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// ============================================================================
// ASSESSMENT PAYLOAD SCHEMA (v2.0.0)
// ============================================================================

/**
 * Validates an assessment input payload.
 * Schema version: 2.0.0
 *
 * Expected shape:
 * {
 *   mode: "v2",
 *   behaviour: { emotionalMoneyLevel, socialInfluenceLevel, ... },
 *   awareness: { comparesLifestyleFreq, hasFinancialPlan, ... },
 *   profile: { monthlyExpenses, emergencySavingsFixed, ... },
 *   participant: { name, age, email },
 *   habits: { habitCheckInsPerWeek, debtPaymentDiscipline }
 * }
 */
export function validateAssessmentPayload(payload: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (!payload || typeof payload !== 'object') {
    return {
      valid: false,
      errors: [{ field: 'root', message: 'Assessment payload must be an object' }]
    };
  }

  const p = payload as Record<string, unknown>;

  // Check mode
  if (p.mode !== 'v2') {
    errors.push({
      field: 'mode',
      message: `Expected mode 'v2', got '${p.mode}'`,
      value: p.mode
    });
  }

  // Check behaviour
  if (!p.behaviour || typeof p.behaviour !== 'object') {
    errors.push({
      field: 'behaviour',
      message: 'Behaviour must be an object',
      value: p.behaviour
    });
  }

  // Check awareness
  if (!p.awareness || typeof p.awareness !== 'object') {
    errors.push({
      field: 'awareness',
      message: 'Awareness must be an object',
      value: p.awareness
    });
  }

  // Check profile
  if (!p.profile || typeof p.profile !== 'object') {
    errors.push({
      field: 'profile',
      message: 'Profile must be an object',
      value: p.profile
    });
  }

  // Check participant
  if (!p.participant || typeof p.participant !== 'object') {
    errors.push({
      field: 'participant',
      message: 'Participant must be an object',
      value: p.participant
    });
  }

  // Check habits
  if (!p.habits || typeof p.habits !== 'object') {
    errors.push({
      field: 'habits',
      message: 'Habits must be an object',
      value: p.habits
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// RESULT PAYLOAD SCHEMA (v2.0.0)
// ============================================================================

/**
 * Validates a result (scoring output) payload.
 * Schema version: 2.0.0
 *
 * Expected shape (core fields):
 * {
 *   healthScore: number,
 *   behaviourScore: number,
 *   awarenessScore: number,
 *   stabilityScore: number,
 *   survivalMonthsRaw: number,
 *   personalityType: string,
 *   ...other scoring fields
 * }
 */
export function validateResultPayload(payload: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (!payload || typeof payload !== 'object') {
    return {
      valid: false,
      errors: [{ field: 'root', message: 'Result payload must be an object' }]
    };
  }

  const p = payload as Record<string, unknown>;

  // Core scoring fields
  const numericFields = [
    'healthScore',
    'behaviourScore',
    'awarenessScore',
    'stabilityScore',
    'survivalMonthsRaw'
  ];

  for (const field of numericFields) {
    if (typeof p[field] !== 'number') {
      errors.push({
        field,
        message: `Expected number, got ${typeof p[field]}`,
        value: p[field]
      });
    }
  }

  // Personality type
  if (typeof p.personalityType !== 'string') {
    errors.push({
      field: 'personalityType',
      message: `Expected string, got ${typeof p.personalityType}`,
      value: p.personalityType
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// MEMORY EVENT PAYLOAD SCHEMA (v1.0.0)
// ============================================================================

/**
 * Validates a financial memory event payload.
 * Schema version: 1.0.0
 *
 * Expected shape:
 * {
 *   type: "decision" | "goal_change" | "twin_snapshot" | "checkin" | ...,
 *   timestamp: ISO string,
 *   ...event-specific fields
 * }
 */
export function validateMemoryEventPayload(payload: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (!payload || typeof payload !== 'object') {
    return {
      valid: false,
      errors: [{ field: 'root', message: 'Memory event payload must be an object' }]
    };
  }

  const p = payload as Record<string, unknown>;

  // Check event type
  if (typeof p.type !== 'string') {
    errors.push({
      field: 'type',
      message: `Expected event type string, got ${typeof p.type}`,
      value: p.type
    });
  }

  // Check timestamp
  if (p.timestamp) {
    if (typeof p.timestamp !== 'string') {
      errors.push({
        field: 'timestamp',
        message: `Expected timestamp string, got ${typeof p.timestamp}`,
        value: p.timestamp
      });
    } else if (isNaN(new Date(p.timestamp).getTime())) {
      errors.push({
        field: 'timestamp',
        message: `Invalid ISO timestamp: ${p.timestamp}`,
        value: p.timestamp
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// TWIN SNAPSHOT PAYLOAD SCHEMA (v1.0.0)
// ============================================================================

/**
 * Validates a digital twin snapshot payload.
 * Schema version: 1.0.0
 *
 * Expected shape:
 * {
 *   id: string,
 *   timestamp: ISO string,
 *   currentState: {...},
 *   futureStatistics: {...},
 *   metadata: {...}
 * }
 */
export function validateTwinSnapshotPayload(payload: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (!payload || typeof payload !== 'object') {
    return {
      valid: false,
      errors: [{ field: 'root', message: 'Twin snapshot payload must be an object' }]
    };
  }

  const p = payload as Record<string, unknown>;

  // Check ID
  if (typeof p.id !== 'string') {
    errors.push({
      field: 'id',
      message: `Expected id string, got ${typeof p.id}`,
      value: p.id
    });
  }

  // Check timestamp
  if (p.timestamp) {
    if (typeof p.timestamp !== 'string') {
      errors.push({
        field: 'timestamp',
        message: `Expected timestamp string, got ${typeof p.timestamp}`,
        value: p.timestamp
      });
    } else if (isNaN(new Date(p.timestamp).getTime())) {
      errors.push({
        field: 'timestamp',
        message: `Invalid ISO timestamp: ${p.timestamp}`,
        value: p.timestamp
      });
    }
  }

  // Check currentState exists
  if (!p.currentState || typeof p.currentState !== 'object') {
    errors.push({
      field: 'currentState',
      message: 'currentState must be an object',
      value: p.currentState
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// SCHEMA VERSION REGISTRY
// ============================================================================

export const SCHEMA_VERSIONS = {
  assessment: '2.0.0',
  result: '2.0.0',
  memoryEvent: '1.0.0',
  twinSnapshot: '1.0.0'
} as const;

/**
 * Tag a payload with schema_version for versioned contract enforcement.
 * Used to mark payloads before sending to API.
 */
export function tagPayloadVersion<T extends Record<string, unknown>>(
  payload: T,
  schemaType: keyof typeof SCHEMA_VERSIONS
): T & { schema_version: string } {
  return {
    ...payload,
    schema_version: SCHEMA_VERSIONS[schemaType]
  };
}

// ============================================================================
// COMBINED VALIDATION FOR ASSESSMENT + RESULT PAIR
// ============================================================================

/**
 * Validates a complete assessment submission (assessment + result).
 * Both payloads must be valid and present.
 */
export function validateAssessmentSubmission(
  assessment: unknown,
  result: unknown
): ValidationResult {
  const assessmentValidation = validateAssessmentPayload(assessment);
  const resultValidation = validateResultPayload(result);

  const errors = [
    ...assessmentValidation.errors.map(e => ({ ...e, source: 'assessment' as const })),
    ...resultValidation.errors.map(e => ({ ...e, source: 'result' as const }))
  ];

  return {
    valid: assessmentValidation.valid && resultValidation.valid,
    errors: errors as ValidationError[]
  };
}

// ============================================================================
// VALIDATION ERROR FORMATTING
// ============================================================================

/**
 * Format validation errors into a human-readable message.
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) return '';
  
  const lines = errors.map(
    e => `  - ${e.field}: ${e.message}`
  );
  
  return `Validation failed:\n${lines.join('\n')}`;
}
