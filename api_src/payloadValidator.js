/**
 * api_src/payloadValidator.js
 *
 * Server-side payload validation for API endpoints.
 * Validates incoming payloads against versioned schemas and logs validation failures.
 *
 * Usage:
 *   const validation = await validateAssessmentSubmission(req.body);
 *   if (!validation.valid) {
 *     return res.status(400).json({ error: 'Validation failed', details: validation.errors });
 *   }
 */

import { createLogger } from './logger.js';

const log = createLogger('[payloadValidator]');

// ============================================================================
// ASSESSMENT PAYLOAD VALIDATION (v2.0.0)
// ============================================================================

export function validateAssessmentPayload(payload) {
  const errors = [];

  if (!payload || typeof payload !== 'object') {
    return {
      valid: false,
      errors: [{ field: 'root', message: 'Assessment payload must be an object' }]
    };
  }

  // Check mode
  if (payload.mode !== 'v2') {
    errors.push({
      field: 'mode',
      message: `Expected mode 'v2', got '${payload.mode}'`
    });
  }

  // Check behaviour
  if (!payload.behaviour || typeof payload.behaviour !== 'object') {
    errors.push({
      field: 'behaviour',
      message: 'Behaviour must be an object'
    });
  }

  // Check awareness
  if (!payload.awareness || typeof payload.awareness !== 'object') {
    errors.push({
      field: 'awareness',
      message: 'Awareness must be an object'
    });
  }

  // Check profile
  if (!payload.profile || typeof payload.profile !== 'object') {
    errors.push({
      field: 'profile',
      message: 'Profile must be an object'
    });
  }

  // Check participant
  if (!payload.participant || typeof payload.participant !== 'object') {
    errors.push({
      field: 'participant',
      message: 'Participant must be an object'
    });
  }

  // Check habits
  if (!payload.habits || typeof payload.habits !== 'object') {
    errors.push({
      field: 'habits',
      message: 'Habits must be an object'
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    schema_version: '2.0.0'
  };
}

// ============================================================================
// RESULT PAYLOAD VALIDATION (v2.0.0)
// ============================================================================

export function validateResultPayload(payload) {
  const errors = [];

  if (!payload || typeof payload !== 'object') {
    return {
      valid: false,
      errors: [{ field: 'root', message: 'Result payload must be an object' }]
    };
  }

  // Core scoring fields (must be numbers)
  const numericFields = [
    'healthScore',
    'behaviourScore',
    'awarenessScore',
    'stabilityScore',
    'survivalMonthsRaw'
  ];

  for (const field of numericFields) {
    if (typeof payload[field] !== 'number') {
      errors.push({
        field,
        message: `Expected number, got ${typeof payload[field]}`
      });
    }
  }

  // Personality type
  if (typeof payload.personalityType !== 'string') {
    errors.push({
      field: 'personalityType',
      message: `Expected string, got ${typeof payload.personalityType}`
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    schema_version: '2.0.0'
  };
}

// ============================================================================
// MEMORY EVENT VALIDATION (v1.0.0)
// ============================================================================

export function validateMemoryEventPayload(payload) {
  const errors = [];

  if (!payload || typeof payload !== 'object') {
    return {
      valid: false,
      errors: [{ field: 'root', message: 'Memory event payload must be an object' }]
    };
  }

  // Check event type
  if (typeof payload.type !== 'string') {
    errors.push({
      field: 'type',
      message: `Expected event type string, got ${typeof payload.type}`
    });
  }

  // Check timestamp (optional but if present, must be valid ISO string)
  if (payload.timestamp) {
    if (typeof payload.timestamp !== 'string') {
      errors.push({
        field: 'timestamp',
        message: `Expected timestamp string, got ${typeof payload.timestamp}`
      });
    } else if (isNaN(new Date(payload.timestamp).getTime())) {
      errors.push({
        field: 'timestamp',
        message: `Invalid ISO timestamp: ${payload.timestamp}`
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    schema_version: '1.0.0'
  };
}

// ============================================================================
// TWIN SNAPSHOT VALIDATION (v1.0.0)
// ============================================================================

export function validateTwinSnapshotPayload(payload) {
  const errors = [];

  if (!payload || typeof payload !== 'object') {
    return {
      valid: false,
      errors: [{ field: 'root', message: 'Twin snapshot payload must be an object' }]
    };
  }

  // Check ID
  if (typeof payload.id !== 'string') {
    errors.push({
      field: 'id',
      message: `Expected id string, got ${typeof payload.id}`
    });
  }

  // Check timestamp (optional but if present, must be valid ISO string)
  if (payload.timestamp) {
    if (typeof payload.timestamp !== 'string') {
      errors.push({
        field: 'timestamp',
        message: `Expected timestamp string, got ${typeof payload.timestamp}`
      });
    } else if (isNaN(new Date(payload.timestamp).getTime())) {
      errors.push({
        field: 'timestamp',
        message: `Invalid ISO timestamp: ${payload.timestamp}`
      });
    }
  }

  // Check currentState exists
  if (!payload.currentState || typeof payload.currentState !== 'object') {
    errors.push({
      field: 'currentState',
      message: 'currentState must be an object'
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    schema_version: '1.0.0'
  };
}

// ============================================================================
// COMBINED ASSESSMENT SUBMISSION VALIDATION
// ============================================================================

/**
 * Validates a complete assessment submission (assessment + result pair).
 * Both payloads must be valid and present.
 */
export function validateAssessmentSubmission(assessment, result) {
  const assessmentValidation = validateAssessmentPayload(assessment);
  const resultValidation = validateResultPayload(result);

  const combinedErrors = [
    ...assessmentValidation.errors.map(e => ({ ...e, source: 'assessment' })),
    ...resultValidation.errors.map(e => ({ ...e, source: 'result' }))
  ];

  const valid = assessmentValidation.valid && resultValidation.valid;

  if (!valid) {
    log.warn('[validateAssessmentSubmission] Validation failed', {
      errorCount: combinedErrors.length,
      errors: combinedErrors
    });
  }

  return {
    valid,
    errors: combinedErrors,
    schemas: {
      assessment: assessmentValidation.schema_version,
      result: resultValidation.schema_version
    }
  };
}

// ============================================================================
// SCORE HISTORY ENTRY VALIDATION
// ============================================================================

export function validateScoreEntry(payload) {
  const errors = [];

  if (!payload || typeof payload !== 'object') {
    return {
      valid: false,
      errors: [{ field: 'root', message: 'Score entry must be an object' }]
    };
  }

  // Score must be a number
  if (typeof payload.score !== 'number') {
    errors.push({
      field: 'score',
      message: `Expected number, got ${typeof payload.score}`
    });
  }

  // Date should be ISO string if present
  if (payload.date && typeof payload.date !== 'string') {
    errors.push({
      field: 'date',
      message: `Expected date string, got ${typeof payload.date}`
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// LOGGING UTILITIES
// ============================================================================

/**
 * Log a validation failure with context.
 */
export function logValidationFailure(source, payload, validation) {
  const errorSummary = validation.errors
    .slice(0, 3)
    .map(e => `${e.field}: ${e.message}`)
    .join('; ');

  log.error(`[${source}] Validation failed`, {
    source,
    errorCount: validation.errors.length,
    errors: errorSummary,
    payloadKeys: Object.keys(payload || {})
  });
}

/**
 * Log successful validation.
 */
export function logValidationSuccess(source, schemaVersion) {
  log.debug(`[${source}] Validation passed (schema: ${schemaVersion})`);
}
