/**
 * useAssessmentState Hook
 * Centralizes all assessment-related state and functions
 * - Assessment data
 * - Save state and queued saves
 * - Online/offline status
 * - Reset triggers
 */

import { useState, useCallback } from "react";
import {
  makeEmptyAssessment,
  isBrowser,
  STORAGE_KEY
} from "../lib/app-utils.jsx";
import {
  loadQueuedAssessmentSaves,
  enqueueAssessmentSave,
  flushQueuedAssessmentSaves
} from "../lib/appAssessmentQueue.js";

export function useAssessmentState() {
  const [assessment, setAssessment] = useState(() => {
    if (!isBrowser()) {
      return makeEmptyAssessment();
    }
    // Try to load assessment from localStorage
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log("[useAssessmentState] Loaded assessment from localStorage");
        return parsed;
      }
    } catch (e) {
      console.warn("[useAssessmentState] Failed to load from localStorage:", e);
    }
    return makeEmptyAssessment();
  });
  const [saveState, setSaveState] = useState("Ready");
  const [queuedSaveCount, setQueuedSaveCount] = useState(() =>
    isBrowser() ? loadQueuedAssessmentSaves().length : 0
  );
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [resetTrigger, setResetTrigger] = useState(0);

  // Derived state
  const saveStatusLabel =
    queuedSaveCount > 0
      ? isOnline
        ? `Upload pending (${queuedSaveCount})`
        : `Saved offline (${queuedSaveCount})`
      : saveState === "Unsaved"
        ? "Unsaved changes"
        : saveState;

  const saveStatusClass =
    queuedSaveCount > 0
      ? isOnline
        ? "upload-pending"
        : "saved-offline"
      : saveState.toLowerCase().replace(/\s+/g, "-");

  // Callbacks
  const refreshQueuedSaveCount = useCallback(() => {
    if (!isBrowser()) {
      return;
    }
    setQueuedSaveCount(loadQueuedAssessmentSaves().length);
  }, []);

  const enqueueAssessmentSaveAndRefresh = useCallback(
    payload => {
      enqueueAssessmentSave(payload);
      refreshQueuedSaveCount();
    },
    [refreshQueuedSaveCount]
  );

  const flushQueuedAssessmentSavesAndRefresh = useCallback(async () => {
    await flushQueuedAssessmentSaves();
    refreshQueuedSaveCount();
  }, [refreshQueuedSaveCount]);

  const resetAssessment = useCallback(() => {
    setAssessment(makeEmptyAssessment());
    setSaveState("Ready");
    setResetTrigger(prev => prev + 1);
  }, []);

  return {
    // State
    assessment,
    setAssessment,
    saveState,
    setSaveState,
    queuedSaveCount,
    setQueuedSaveCount,
    isOnline,
    setIsOnline,
    resetTrigger,
    // Derived
    saveStatusLabel,
    saveStatusClass,
    // Methods
    refreshQueuedSaveCount,
    enqueueAssessmentSaveAndRefresh,
    flushQueuedAssessmentSavesAndRefresh,
    resetAssessment
  };
}
