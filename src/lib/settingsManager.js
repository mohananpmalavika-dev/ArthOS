import { scopedRead, scopedWrite } from "./storageManager.js";

export const SETTINGS_STORAGE_KEY = "settings";

const LEGACY_KEYS = {
  privacy: "arthos:privacy",
  consent: "arth-os-data-consent",
  onboarding: "arth-os-onboarding-complete",
  ui: "arth-os-dev-mode",
  reminders: "arth-os-reminder-preferences"
};

const DEFAULT_SETTINGS = {
  consent: null,
  privacy: {
    telemetry: true,
    personalized: true,
    sharedAnonymized: false
  },
  onboarding: {
    complete: false
  },
  ui: {
    devMode: false,
    viewMode: null
  },
  reminders: {
    enabled: true,
    channel: "email",
    time: "09:00",
    frequency: "daily",
    checkinReminders: true,
    streakNudges: true,
    scoreAlerts: true,
    milestoneAlerts: true
  },
  accessibility: {
    reduceMotion: false,
    highContrast: false,
    largeText: false
  },
  offline: {
    degradedMode: false,
    queueEnabled: true
  }
};

export function mergeDeep(target, source) {
  if (source === null || source === undefined) {
    return target;
  }

  if (typeof target !== "object" || typeof source !== "object" || Array.isArray(target) || Array.isArray(source)) {
    return source;
  }

  const merged = { ...target };
  for (const key of Object.keys(source)) {
    merged[key] = mergeDeep(target[key], source[key]);
  }
  return merged;
}

function buildLegacySettings() {
  if (typeof window === "undefined") {
    return {};
  }

  const legacy = {};

  try {
    const rawPrivacy = window.localStorage.getItem(LEGACY_KEYS.privacy);
    if (rawPrivacy) {
      legacy.privacy = JSON.parse(rawPrivacy);
    }
  } catch (err) {
    console.warn("[settingsManager] Failed to read legacy privacy settings:", err.message);
  }

  const consentValue = window.localStorage.getItem(LEGACY_KEYS.consent);
  if (consentValue === "true") {
    legacy.consent = true;
  } else if (consentValue === "false") {
    legacy.consent = false;
  }

  const onboardingValue = window.localStorage.getItem(LEGACY_KEYS.onboarding);
  if (onboardingValue === "true") {
    legacy.onboarding = { complete: true };
  }

  const devModeValue = window.localStorage.getItem(LEGACY_KEYS.ui);
  if (devModeValue !== null) {
    legacy.ui = { devMode: devModeValue === "true" };
  }

  try {
    const rawReminders = window.localStorage.getItem(LEGACY_KEYS.reminders);
    if (rawReminders) {
      legacy.reminders = JSON.parse(rawReminders);
    }
  } catch (err) {
    console.warn("[settingsManager] Failed to read legacy reminder settings:", err.message);
  }

  return legacy;
}

export function loadUnifiedSettings(userId) {
  const storedSettings = scopedRead(SETTINGS_STORAGE_KEY, userId) || {};
  const legacySettings = buildLegacySettings();
  return mergeDeep(DEFAULT_SETTINGS, mergeDeep(legacySettings, storedSettings));
}

export function saveUnifiedSettings(settings, userId) {
  if (!settings || typeof settings !== "object") {
    return;
  }
  scopedWrite(SETTINGS_STORAGE_KEY, settings, userId);
}

export function migrateLegacySettingsToUser(userId) {
  if (!userId) {
    return;
  }

  const existing = scopedRead(SETTINGS_STORAGE_KEY, userId) || {};
  const legacy = buildLegacySettings();

  if (Object.keys(legacy).length === 0) {
    return;
  }

  const merged = mergeDeep(existing, legacy);
  saveUnifiedSettings(merged, userId);
}

export function getUnifiedSetting(path, userId) {
  const settings = loadUnifiedSettings(userId);
  if (!path) {
    return settings;
  }

  const segments = String(path).split(".");
  let current = settings;
  for (const segment of segments) {
    if (!current || typeof current !== "object") {
      return undefined;
    }
    current = current[segment];
  }
  return current;
}

export function setUnifiedSetting(path, value, userId) {
  const settings = loadUnifiedSettings(userId);
  if (!path) {
    saveUnifiedSettings(value, userId);
    return value;
  }

  const segments = String(path).split(".");
  let next = { ...settings };
  let pointer = next;
  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i];
    if (i === segments.length - 1) {
      pointer[segment] = value;
    } else {
      pointer[segment] = pointer[segment] && typeof pointer[segment] === "object" ? { ...pointer[segment] } : {};
      pointer = pointer[segment];
    }
  }

  saveUnifiedSettings(next, userId);
  return next;
}

export function flattenSettings(settings, prefix = "") {
  const entries = [];
  if (settings === null || settings === undefined) {
    return entries;
  }

  if (typeof settings !== "object" || Array.isArray(settings)) {
    entries.push([prefix, settings]);
    return entries;
  }

  for (const key of Object.keys(settings)) {
    const value = settings[key];
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      entries.push(...flattenSettings(value, nextPrefix));
    } else {
      entries.push([nextPrefix, value]);
    }
  }
  return entries;
}
