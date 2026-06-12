/**
 * G3 Assessment Auto-Save & Resume Engine
 *
 * Persists partial assessment state so users can resume after navigating away
 * or closing the browser. Designed to reduce drop-off from progress loss.
 *
 * FEATURES
 * ────────
 * - Auto-saves assessment state + wizard step every 30s
 * - Saves on every question answer (debounced)
 * - Saves on `beforeunload` for browser close / tab switch
 * - On mount: detects incomplete session and returns saved state
 * - Detects stale sessions (> 30 min idle → treat as fresh)
 *
 * STORAGE KEY PREFIX: arth-os-assessment-draft
 *
 * USAGE
 * ─────
 *   import { saveDraft, loadDraft, clearDraft, setupAutoSave, setupBeforeUnload } from './assessmentAutoSave.js'
 *
 *   // On each answer change:
 *   saveDraft(assessment, currentStep, expressMode)
 *
 *   // On mount:
 *   const draft = loadDraft()
 *   if (draft) { /* show resume prompt *\/ }
 *
 *   // On explicit reset:
 *   clearDraft()
 */

const DRAFT_KEY = 'arth-os-assessment-draft';
const STALE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

function isBrowser() {
  return typeof window !== 'undefined';
}

/**
 * Save assessment draft to localStorage.
 * Includes wizard step, express mode state, and a timestamp.
 *
 * @param {object} assessment - full assessment state
 * @param {number} currentStep - current wizard step index
 * @param {boolean} expressMode - whether express mode is active
 */
export function saveDraft(assessment, currentStep, expressMode) {
  if (!isBrowser()) return;

  try {
    const draft = {
      assessment,
      currentStep,
      expressMode,
      savedAt: Date.now(),
    };
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch (e) {
    // Storage full or unavailable — silently fail
  }
}

/**
 * Load assessment draft from localStorage.
 * Returns null if no draft exists, or if the draft is stale (> 30 min).
 *
 * @returns {{ assessment: object, currentStep: number, expressMode: boolean, savedAt: number } | null}
 */
export function loadDraft() {
  if (!isBrowser()) return null;

  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;

    const draft = JSON.parse(raw);

    // Check staleness
    if (Date.now() - draft.savedAt > STALE_THRESHOLD_MS) {
      clearDraft();
      return null;
    }

    return draft;
  } catch {
    return null;
  }
}

/**
 * Check if a resume-able draft exists.
 * @returns {boolean}
 */
export function hasDraft() {
  return loadDraft() !== null;
}

/**
 * Clear the saved draft (e.g., on completion or explicit reset).
 */
export function clearDraft() {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}

/**
 * Setup periodic auto-save (every 30 seconds).
 * Call once on component mount.
 * Returns a cleanup function.
 *
 * @param {() => { assessment: object, currentStep: number, expressMode: boolean }} getState
 * @returns {() => void} cleanup
 */
export function setupAutoSave(getState) {
  if (!isBrowser()) return () => {};

  const interval = setInterval(() => {
    const state = getState();
    if (state) {
      saveDraft(state.assessment, state.currentStep, state.expressMode);
    }
  }, 30000); // every 30 seconds

  return () => clearInterval(interval);
}

/**
 * Setup `beforeunload` handler to save draft on browser close/tab switch.
 * Also handles visibility change (mobile app switch).
 * Call once on component mount.
 * Returns a cleanup function.
 *
 * @param {() => { assessment: object, currentStep: number, expressMode: boolean }} getState
 * @returns {() => void} cleanup
 */
export function setupBeforeUnload(getState) {
  if (!isBrowser()) return () => {};

  const handleBeforeUnload = () => {
    const state = getState();
    if (state) {
      saveDraft(state.assessment, state.currentStep, state.expressMode);
    }
  };

  const handleVisibilityChange = () => {
    if (document.hidden) {
      handleBeforeUnload();
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}

/**
 * Debounced save — fires immediately on first call, then at most once per `delay` ms.
 * @param {Function} fn
 * @param {number} delay
 * @returns {Function}
 */
export function createDebouncedSave(fn, delay = 2000) {
  let timer = null;
  let lastCall = 0;

  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      // Enough time passed — save immediately
      lastCall = now;
      fn.apply(this, args);
    } else {
      // Debounce
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        lastCall = Date.now();
        fn.apply(this, args);
      }, delay);
    }
  };
}
