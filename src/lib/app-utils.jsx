/**
 * App.jsx Utility Functions - Extracted for modularity
 * Contains bootstrap, normalization, and browser detection utilities
 * Reduces App.jsx from 2318 lines to ~1500 lines
 */

import { v2DefaultAssessment } from "../data/questionnaire-v2.js";

// Storage constants
export const ASSESSMENT_SAVE_QUEUE_KEY = "arth-os-assessment-save-queue";
export const STORAGE_KEY = "arth-os-assessment";

/**
 * Create an empty assessment matching v2 structure
 * All fields initialized to empty strings/undefined
 */
export function makeEmptyAssessment() {
  const emptyBehaviour = Object.keys(v2DefaultAssessment.behaviour || {}).reduce((acc, k) => {
    acc[k] = "";
    return acc;
  }, {});

  const emptyAwareness = Object.keys(v2DefaultAssessment.awareness || {}).reduce((acc, k) => {
    acc[k] = "";
    return acc;
  }, {});

  const emptyHabits = Object.keys(v2DefaultAssessment.habits || {}).reduce((acc, k) => {
    acc[k] = "";
    return acc;
  }, {});

  const emptyProfile = Object.keys(v2DefaultAssessment.profile || {}).reduce((acc, k) => {
    acc[k] = undefined;
    return acc;
  }, {});

  return {
    mode: "v2",
    behaviour: emptyBehaviour,
    awareness: emptyAwareness,
    profile: emptyProfile,
    participant: {
      name: "",
      age: "",
      email: ""
    },
    habits: emptyHabits
  };
}

/**
 * Check if code is running in browser environment
 */
export function isBrowser() {
  return typeof window !== "undefined";
}

/**
 * Check if running on localhost/127.x dev host
 */
export function isLocalDevHost() {
  if (!isBrowser()) {
    return false;
  }
  const host = window.location.hostname || "";
  return host === "localhost" || host.startsWith("127.");
}

/**
 * Normalize v2 assessment - split single emergencySavings into fixed/discretionary
 */
export function normalizeV2Assessment(assessment) {
  const profile = assessment?.profile ?? {};
  if (
    profile.emergencySavingsFixed !== undefined ||
    profile.emergencySavingsDiscretionary !== undefined
  ) {
    return {
      ...assessment,
      participant: {
        ...v2DefaultAssessment.participant,
        ...assessment?.participant
      },
      profile: {
        ...v2DefaultAssessment.profile,
        ...profile
      }
    };
  }

  const emergencySavings = Number.parseFloat(profile.emergencySavings) || 0;
  const fixed = Math.min(emergencySavings, 50000);
  const discretionary = Math.max(0, emergencySavings - fixed);

  return {
    ...assessment,
    participant: {
      ...v2DefaultAssessment.participant,
      ...assessment?.participant
    },
    profile: {
      ...v2DefaultAssessment.profile,
      ...profile,
      emergencySavingsFixed: fixed,
      emergencySavingsDiscretionary: discretionary
    }
  };
}

/**
 * Normalize v1 (legacy) assessment to v2 format
 */
export function normalizeV1Assessment(assessment) {
  const profile = assessment?.profile ?? {};
  const legacySavings = Number.parseFloat(profile.emergencySavings) || 0;
  const fixed = Number.parseFloat(profile.emergencySavingsFixed) || 0;
  const discretionary = Number.parseFloat(profile.emergencySavingsDiscretionary) || 0;

  return {
    ...v2DefaultAssessment,
    ...assessment,
    participant: {
      ...v2DefaultAssessment.participant,
      ...assessment?.participant
    },
    behaviour: {
      ...v2DefaultAssessment.behaviour,
      ...assessment?.behaviour
    },
    awareness: {
      ...v2DefaultAssessment.awareness,
      ...assessment?.awareness
    },
    profile: {
      ...v2DefaultAssessment.profile,
      ...profile,
      emergencySavings: legacySavings || fixed + discretionary
    }
  };
}

/**
 * Load initial assessment from localStorage
 * Checks: unified storage → v2 legacy → v1 legacy → defaults
 */
export function loadInitialAssessment() {
  try {
    const unified = window.localStorage.getItem(STORAGE_KEY);
    if (unified) {
      return normalizeV2Assessment(JSON.parse(unified));
    }

    const legacyV2 = window.localStorage.getItem("arth-os-assessment-v2");
    if (legacyV2) {
      return normalizeV2Assessment(JSON.parse(legacyV2));
    }

    const legacyV1 = window.localStorage.getItem("arth-os-assessment-v1");
    if (legacyV1) {
      return normalizeV2Assessment(normalizeV1Assessment(JSON.parse(legacyV1)));
    }

    return typeof v2DefaultAssessment !== "undefined" ? v2DefaultAssessment : {};
  } catch (error) {
    console.warn("Could not load initial assessment from localStorage:", error);
    return typeof v2DefaultAssessment !== "undefined" ? v2DefaultAssessment : {};
  }
}

/**
 * Derive behavioral drivers that negatively impact financial health
 * Used to explain score gaps to users
 */
export function deriveDrivers(result, assessment) {
  if (!result) {
    return [];
  }
  const drivers = [];
  const spendWhenStressed = assessment.behaviour?.spendWhenStressed;
  if (spendWhenStressed && spendWhenStressed !== "never") {
    drivers.push({ title: "Stress Spending", impact: -18 });
  }
  const impulse = assessment.behaviour?.regretImpulseFreq;
  if (impulse && impulse !== "never") {
    drivers.push({ title: "Impulse Purchases", impact: -12 });
  }
  if ((result.awarenessGapDisplay || 0) > 2) {
    drivers.push({ title: "Poor Expense Tracking", impact: -9 });
  }

  if (drivers.length === 0) {
    drivers.push({ title: "Low savings rate", impact: -8 });
    drivers.push({ title: "Irregular income", impact: -6 });
  }

  return drivers;
}

/**
 * Lazy component fallback for Suspense boundaries
 */
export const LazyComponentFallback = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "400px",
      fontSize: "14px",
      color: "#666"
    }}
  >
    <div style={{ textAlign: "center" }}>
      <div style={{ marginBottom: "12px" }}>Loading component...</div>
      <div style={{ fontSize: "12px", color: "#999" }}>Please wait</div>
    </div>
  </div>
);
