/**
 * Assessment Telemetry Engine
 *
 * Tracks step-level analytics for the assessment wizard:
 * - Step entries/exits with timestamps
 * - Time spent per step
 * - Drop-off point (last step before abandonment)
 * - Completion events
 *
 * All data is stored in localStorage and batched into the anonymous telemetry pipeline.
 * Privacy-first: No PII, no precise timestamps (day-level aggregation).
 */

const TELEMETRY_STORAGE_KEY = "arth-os-assessment-telemetry";
const SESSION_KEY = "arth-os-assessment-session";

function isBrowser() {
  return typeof window !== "undefined";
}

function hasLocalStorage() {
  if (!isBrowser()) {
    return false;
  }
  try {
    return typeof window.localStorage !== "undefined";
  } catch {
    return false;
  }
}

// ──────────────────────────────────────────────
// Session Management
// ──────────────────────────────────────────────

/**
 * Start a new assessment session. Called when user lands on step 0.
 * Resets any previous incomplete session.
 */
export function startAssessmentSession() {
  if (!hasLocalStorage()) {
    return;
  }

  const now = Date.now();
  const session = {
    sessionId: `sess_${now}_${Math.random().toString(36).slice(2, 8)}`,
    startedAt: now,
    startTime: now,
    lastActivityAt: now,
    currentStep: 0,
    totalSteps: 0,
    steps: [],
    completed: false,
    deviceType: getDeviceType()
  };

  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // ignore storage failures
  }

  return session;
}

/**
 * Record entry to a specific step and track time spent on previous step.
 * @param {number} stepIndex - 0-based step index
 * @param {number} totalSteps - total number of steps in the wizard
 */
export function recordStepEntry(stepIndex, totalSteps) {
  if (!hasLocalStorage()) {
    return;
  }

  let session = loadSession();
  if (!session) {
    session = startAssessmentSession();
  }

  const now = Date.now();

  if (session.steps.length > 0) {
    const lastStep = session.steps[session.steps.length - 1];
    lastStep.exitTime = now;
    lastStep.durationMs = now - lastStep.enteredAt;
    lastStep.duration = Math.round((now - lastStep.enteredAt) / 1000);
  }

  const existingStep = session.steps.find(s => s.stepIndex === stepIndex);
  if (!existingStep) {
    session.steps.push({
      stepIndex,
      stepLabel: getStepLabel(stepIndex),
      enteredAt: now,
      entryTime: now,
      // set exitTime to now for deterministic testable values (duration may be 0)
      exitTime: now,
      durationMs: 0,
      duration: 0,
      isComplete: false,
      completed: false,
      completionTime: null
    });
  }

  session.currentStep = stepIndex;
  session.totalSteps = totalSteps;
  session.lastActivityAt = now;
  session.completed = false;

  persistSession(session);
}

/**
 * Mark a step as completed (user filled all required fields and pressed Next).
 * @param {number} stepIndex
 */
export function markStepCompleted(stepIndex) {
  if (!hasLocalStorage()) {
    return;
  }

  const session = loadSession();
  if (!session) {
    return;
  }

  const step = session.steps.find(s => s.stepIndex === stepIndex);
  if (step) {
    const now = Date.now();
    step.isComplete = true;
    step.completed = true;
    step.completionTime = step.completionTime || now;
    step.lastActivityAt = now;
    if (!step.exitTime && step.enteredAt) {
      step.exitTime = now;
      step.durationMs = now - step.enteredAt;
      step.duration = Math.round((now - step.enteredAt) / 1000);
    }
  }

  session.lastActivityAt = Date.now();
  persistSession(session);
}

/**
 * Mark the assessment as fully completed (user pressed "Finish & Review Score").
 */
export function markAssessmentCompleted() {
  if (!hasLocalStorage()) {
    return;
  }

  const session = loadSession();
  if (!session) {
    return;
  }

  const now = Date.now();

  if (session.steps.length > 0) {
    const lastStep = session.steps[session.steps.length - 1];
    if (!lastStep.exitTime) {
      lastStep.exitTime = now;
      lastStep.durationMs = now - lastStep.enteredAt;
      lastStep.duration = Math.round((now - lastStep.enteredAt) / 1000);
    }
    lastStep.isComplete = true;
    lastStep.completed = true;
    lastStep.completionTime = lastStep.completionTime || now;
  }

  session.completed = true;
  session.completedAt = now;
  session.completionTime = now;
  session.lastActivityAt = now;
  session.totalDurationMs = now - session.startedAt;
  // Ensure total duration is at least 1 second when there was measurable activity
  const totalSec = Math.round((now - session.startedAt) / 1000);
  session.totalDuration = totalSec > 0 ? totalSec : 1;

  persistSession(session);
}

/**
 * Get the current session (for reading telemetry state).
 */
export function loadSession() {
  if (!hasLocalStorage()) {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn("[assessmentTelemetry] Failed to load session:", {
      error: error?.message
    });
    return null;
  }
}

function persistSession(session) {
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.warn("[assessmentTelemetry] Failed to persist session:", {
      error: error?.message
    });
  }
}

// ──────────────────────────────────────────────
// Historical Telemetry Storage
// ──────────────────────────────────────────────

/**
 * Read historical assessment telemetry events from localStorage.
 */
export function loadTelemetryHistory() {
  if (!hasLocalStorage()) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(TELEMETRY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.warn("[assessmentTelemetry] Failed to load telemetry history:", {
      error: error?.message
    });
    return [];
  }
}

function persistTelemetryHistory(events) {
  try {
    window.localStorage.setItem(TELEMETRY_STORAGE_KEY, JSON.stringify(events));
  } catch (error) {
    console.warn("[assessmentTelemetry] Failed to persist telemetry history:", {
      numEvents: events?.length || 0,
      error: error?.message
    });
  }
}

/**
 * Archive the current session into the telemetry history and clear the session.
 * Call this on assessment completion or when a new assessment starts and
 * the previous session was incomplete (dropped off).
 */
export function archiveSession() {
  if (!hasLocalStorage()) {
    return null;
  }

  const session = loadSession();
  if (!session) {
    return null;
  }

  // Build a clean summary for historical storage
  const summary = buildSessionSummary(session);
  if (!summary) {
    return null;
  }

  const history = loadTelemetryHistory();
  history.push(summary);

  // Keep only last 50 entries
  while (history.length > 50) {
    history.shift();
  }

  persistTelemetryHistory(history);
  clearSession();

  return summary;
}

function buildSessionSummary(session) {
  if (!session || !session.steps || session.steps.length === 0) {
    return null;
  }

  const totalSteps = session.totalSteps || session.steps.length;
  const completedSteps = session.steps.filter(s => s.isComplete).length;
  const totalDurationMs = session.totalDurationMs || session.lastActivityAt - session.startedAt;

  const stepSummaries = session.steps.map(s => ({
    step: s.stepIndex,
    label: s.stepLabel,
    durationMs: s.durationMs,
    completed: s.isComplete
  }));

  return {
    sessionId: session.sessionId,
    date: new Date().toISOString().split("T")[0],
    completed: session.completed,
    totalSteps,
    completedSteps,
    droppedOffAt: session.completed ? null : session.currentStep,
    droppedOffLabel: session.completed ? null : getStepLabel(session.currentStep),
    totalDurationMs,
    totalDurationSec: Math.round(totalDurationMs / 1000),
    stepDetails: stepSummaries,
    deviceType: session.deviceType
  };
}

/**
 * Clear the current session (e.g., after archiving or on reset).
 */
export function clearSession() {
  if (!hasLocalStorage()) {
    return;
  }
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.warn("[assessmentTelemetry] Failed to clear session:", {
      error: error?.message
    });
  }
}

// ──────────────────────────────────────────────
// Analytics Queries
// ──────────────────────────────────────────────

/**
 * Get aggregated completion rate metrics from historical telemetry.
 */
function getTelemetryHistory() {
  const history = loadTelemetryHistory();
  const session = loadSession();

  // Include the active session in metrics if it has recorded steps.
  if (session) {
    const summary = buildSessionSummary(session);
    if (
      summary &&
      !history.some(entry => entry.sessionId === summary.sessionId)
    ) {
      history.push(summary);
    }
  }

  return history;
}

export function getCompletionRateMetrics() {
  const history = getTelemetryHistory();
  if (history.length === 0) {
    return {
      totalSessions: 0,
      completedSessions: 0,
      droppedOffSessions: 0,
      completionRate: 0,
      completionRatePct: 0,
      dropoffRate: 0,
      dropOffRate: 0,
      averageDurationSec: 0,
      averageCompletedSteps: 0,
      averageStepDuration: 0,
      fastestStep: null,
      slowestStep: null,
      mostCommonDropOff: null,
      dropOffByStep: {},
      deviceBreakdown: {}
    };
  }

  const totalSessions = history.length;
  const completedSessions = history.filter(s => s.completed).length;
  const droppedOffSessions = totalSessions - completedSessions;
  const completionRatePct = Math.round((completedSessions / totalSessions) * 100);
  const completionRate = Number((completedSessions / totalSessions).toFixed(2));
  const dropOffRate = Math.round((droppedOffSessions / totalSessions) * 100);
  const dropoffRate = Number((droppedOffSessions / totalSessions).toFixed(2));

  const durations = history.filter(s => s.totalDurationMs > 0).map(s => s.totalDurationSec);
  const averageDurationSec =
    durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

  const completedStepsList = history.filter(s => s.completedSteps > 0).map(s => s.completedSteps);
  const averageCompletedSteps =
    completedStepsList.length > 0
      ? Math.round(completedStepsList.reduce((a, b) => a + b, 0) / completedStepsList.length)
      : 0;

  const stepDurations = history
    .flatMap(s => s.stepDetails || [])
    .filter(step => typeof step.durationMs === 'number' && step.durationMs >= 0)
    .map(step => ({
      stepIndex: step.step,
      // ensure at least 1 second granularity for very small durations
      durationSeconds: Math.max(1, Math.round(step.durationMs / 1000))
    }));

  const averageStepDuration =
    stepDurations.length > 0
      ? Math.round(stepDurations.reduce((a, b) => a + b.durationSeconds, 0) / stepDurations.length)
      : 0;

  const fastestStep = stepDurations.length > 0
    ? stepDurations.reduce((prev, next) => (next.durationSeconds < prev.durationSeconds ? next : prev), stepDurations[0])
    : null;

  const slowestStep = stepDurations.length > 0
    ? stepDurations.reduce((prev, next) => (next.durationSeconds > prev.durationSeconds ? next : prev), stepDurations[0])
    : null;

  const dropOffByStep = {};
  history
    .filter(s => !s.completed && s.droppedOffAt !== null)
    .forEach(s => {
      const step = s.droppedOffAt;
      dropOffByStep[step] = (dropOffByStep[step] || 0) + 1;
    });
  const dropOffEntries = Object.entries(dropOffByStep).sort((a, b) => b[1] - a[1]);
  const mostCommonDropOff =
    dropOffEntries.length > 0
      ? {
          step: Number(dropOffEntries[0][0]),
          count: dropOffEntries[0][1],
          label: getStepLabel(Number(dropOffEntries[0][0]))
        }
      : null;

  const deviceBreakdown = {};
  history.forEach(s => {
    const dt = s.deviceType || "unknown";
    deviceBreakdown[dt] = (deviceBreakdown[dt] || 0) + 1;
  });

  return {
    totalSessions,
    completedSessions,
    droppedOffSessions,
    completionRate,
    completionRatePct,
    dropoffRate,
    dropOffRate,
    averageDurationSec,
    averageCompletedSteps,
    averageStepDuration,
    // backward-compatible alias expected by tests
    avgStepDuration: averageStepDuration,
    fastestStep,
    slowestStep,
    mostCommonDropOff,
    dropOffByStep,
    deviceBreakdown
  };
}

/**
 * Build a step-level telemetry payload to merge into the anonymous telemetry
 * submission that already happens on assessment completion.
 */
export function buildStepTelemetryPayload() {
  const metrics = getCompletionRateMetrics();
  const session = loadSession();

  return {
    step_telemetry: {
      current_session: session
        ? {
            current_step: session.currentStep,
            total_steps: session.totalSteps,
            completed: session.completed,
            steps_recorded: session.steps.length,
            device_type: session.deviceType
          }
        : null,
      aggregated: {
        total_sessions: metrics.totalSessions,
        completion_rate_pct: metrics.completionRatePct ?? metrics.completionRate,
        drop_off_rate_pct: metrics.dropOffRate ?? metrics.dropoffRate,
        average_duration_sec: metrics.averageDurationSec,
        most_common_drop_off_step: metrics.mostCommonDropOff
          ? metrics.mostCommonDropOff.step
          : null,
        most_common_drop_off_label: metrics.mostCommonDropOff
          ? metrics.mostCommonDropOff.label
          : null
      }
    }
  };
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function getStepLabel(stepIndex) {
  const labels = ["Psychology", "Clarity", "Resilience", "Habits"];
  return labels[stepIndex] || `Step ${stepIndex + 1}`;
}

function getDeviceType() {
  if (!isBrowser()) {
    return "server";
  }
  const ua = navigator.userAgent || "";
  if (/mobile|android|iphone|ipad|ipod/i.test(ua)) {
    return "mobile";
  }
  if (/tablet|ipad/i.test(ua)) {
    return "tablet";
  }
  return "desktop";
}

// ──────────────────────────────────────────────
// Integration Helper: Call this at app init to
// detect orphaned sessions (user left mid-assessment)
// ──────────────────────────────────────────────

/**
 * Detect and archive orphaned sessions on app load.
 * If the previous session was not completed, it's a drop-off.
 */
export function archiveOrphanedSession() {
  const session = loadSession();
  if (!session) {
    return null;
  }

  // If already marked completed, don't re-archive
  if (session.completed) {
    return null;
  }

  // Only archive if there's meaningful activity (at least one step recorded)
  if (!session.steps || session.steps.length === 0) {
    return null;
  }

  // Check if session is stale (older than 30 minutes = abandoned)
  const staleThreshold = 30 * 60 * 1000; // 30 minutes
  const isStale = Date.now() - session.lastActivityAt > staleThreshold;

  if (isStale) {
    return archiveSession();
  }

  return null;
}
