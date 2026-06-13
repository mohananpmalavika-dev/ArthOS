/**
 * reminderPrefs.js — Shared reminder preferences utilities.
 * Used by ReminderPreferences component and DailyCheckinForm.
 */
const REMINDER_PREFS_KEY = "arth-os-reminder-preferences";

const DEFAULT_PREFS = {
  enabled: true,
  channel: "email",
  time: "09:00",
  frequency: "daily",
  checkinReminders: true,
  streakNudges: true,
  scoreAlerts: true,
  milestoneAlerts: true,
};

export function loadPrefs() {
  if (typeof window === "undefined") return { ...DEFAULT_PREFS };
  try {
    const raw = localStorage.getItem(REMINDER_PREFS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_PREFS, ...parsed };
    }
  } catch (err) {
    console.warn('[reminderPrefs] Failed to load preferences:', err.message);
  }
  return { ...DEFAULT_PREFS };
}

export function savePrefs(prefs) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(REMINDER_PREFS_KEY, JSON.stringify(prefs));
  } catch (err) {
    console.warn('[reminderPrefs] Failed to save preferences:', err.message);
  }
}
