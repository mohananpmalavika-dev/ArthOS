/**
 * ReminderPreferences — UI for users to configure email/SMS reminder settings.
 * Persists to localStorage and optionally saves to the reminders API.
 *
 * Phase 6: Email/SMS Reminder Trigger System
 */
import React, { useState, useEffect, useCallback } from "react";
import { Bell, Clock, Mail, MessageSquare, Save, Loader } from "lucide-react";

import { loadPrefs, savePrefs } from "../lib/reminderPrefs.js";

/**
 * Schedule a reminder via the API (fire-and-forget).
 * Falls back silently if the API is unreachable.
 */
async function scheduleReminderOnServer(userId, prefs) {
  if (!userId) {
    return;
  }
  // Schedule daily reminder at the user's preferred time
  const now = new Date();
  const [hours, minutes] = (prefs.time || "09:00").split(":").map(Number);
  const remindAt = new Date(now);
  remindAt.setHours(hours, minutes, 0, 0);
  // If today's time has passed, schedule for tomorrow
  if (remindAt <= now) {
    remindAt.setDate(remindAt.getDate() + 1);
  }

  try {
    await fetch("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        channel: prefs.channel === "both" ? "email" : prefs.channel,
        remindAt: remindAt.toISOString(),
        title: "ARTH.OS Daily Check-in Reminder",
        message: `This is your daily reminder to complete your financial check-in on ARTH.OS. Don't break your streak!`,
        metadata: { type: "daily_checkin", prefs }
      })
    });

    // If both channels selected, also schedule SMS
    if (prefs.channel === "both") {
      await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          channel: "sms",
          remindAt: remindAt.toISOString(),
          title: "ARTH.OS Check-in Reminder",
          message: `Daily check-in reminder from ARTH.OS. Take 30 seconds to reflect on your finances.`,
          metadata: { type: "daily_checkin", prefs }
        })
      });
    }
  } catch {
    // Offline — prefs are still saved locally
  }
}

/**
 * Schedule a streak nudge reminder when user hits a streak milestone.
 */
export async function scheduleStreakReminder(userId, streakDays) {
  if (!userId) {
    return;
  }
  const prefs = loadPrefs();
  if (!prefs.enabled || !prefs.streakNudges) {
    return;
  }

  const channel = prefs.channel === "both" ? "email" : prefs.channel;
  const now = new Date();
  const remindAt = new Date(now);
  remindAt.setHours(remindAt.getHours() + 1); // nudge in 1 hour

  try {
    await fetch("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        channel,
        remindAt: remindAt.toISOString(),
        title: `🔥 ${streakDays}-Day Streak!`,
        message: `Amazing — you've hit a ${streakDays}-day check-in streak on ARTH.OS! Keep your momentum going.`,
        metadata: { type: "streak_nudge", streakDays }
      })
    });
  } catch {
    // Offline — skip
  }
}

export default function ReminderPreferences({ userId, onSaved }) {
  const [prefs, setPrefs] = useState(() => loadPrefs());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (saved) {
      const timer = setTimeout(() => setSaved(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [saved]);

  const update = useCallback((key, value) => {
    setPrefs(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    savePrefs(prefs);
    if (userId) {
      await scheduleReminderOnServer(userId, prefs);
    }
    setSaving(false);
    setSaved(true);
    onSaved?.(prefs);
  }, [prefs, userId, onSaved]);

  return (
    <div className="reminder-preferences-card">
      <h3>
        <Bell size={16} style={{ marginRight: "8px", verticalAlign: "middle" }} />
        Reminder Preferences
      </h3>
      <p className="subtitle">Get timely nudges to stay on track with your financial goals.</p>

      <div className="reminder-toggle-row">
        <div>
          <span>Enable reminders</span>
          <small>Receive scheduled financial check-in reminders</small>
        </div>
        <button
          type="button"
          className={`reminder-toggle ${prefs.enabled ? "active" : ""}`}
          onClick={() => update("enabled", !prefs.enabled)}
          aria-label="Toggle reminders"
        />
      </div>

      {prefs.enabled && (
        <>
          <div className="reminder-field">
            <label>
              <Mail size={14} style={{ marginRight: "6px", verticalAlign: "middle" }} />{" "}
              Notification Channel
            </label>
            <select value={prefs.channel} onChange={e => update("channel", e.target.value)}>
              <option value="email">Email only</option>
              <option value="sms">SMS only</option>
              <option value="both">Email + SMS</option>
            </select>
          </div>

          <div className="reminder-field">
            <label>
              <Clock size={14} style={{ marginRight: "6px", verticalAlign: "middle" }} /> Preferred
              Reminder Time
            </label>
            <input type="time" value={prefs.time} onChange={e => update("time", e.target.value)} />
          </div>

          <div className="reminder-field">
            <label>
              <Bell size={14} style={{ marginRight: "6px", verticalAlign: "middle" }} /> Frequency
            </label>
            <select value={prefs.frequency} onChange={e => update("frequency", e.target.value)}>
              <option value="daily">Daily</option>
              <option value="weekdays">Weekdays only</option>
              <option value="weekly">Weekly (Monday)</option>
              <option value="never">Only on score changes</option>
            </select>
          </div>

          <div className="reminder-toggle-row">
            <div>
              <span>Check-in reminders</span>
              <small>Nudge to complete your daily financial reflection</small>
            </div>
            <button
              type="button"
              className={`reminder-toggle ${prefs.checkinReminders ? "active" : ""}`}
              onClick={() => update("checkinReminders", !prefs.checkinReminders)}
              aria-label="Toggle check-in reminders"
            />
          </div>

          <div className="reminder-toggle-row">
            <div>
              <span>Streak nudges</span>
              <small>Celebrate and encourage streak milestones</small>
            </div>
            <button
              type="button"
              className={`reminder-toggle ${prefs.streakNudges ? "active" : ""}`}
              onClick={() => update("streakNudges", !prefs.streakNudges)}
              aria-label="Toggle streak nudges"
            />
          </div>

          <div className="reminder-toggle-row">
            <div>
              <span>Score change alerts</span>
              <small>Get notified when your financial health score changes</small>
            </div>
            <button
              type="button"
              className={`reminder-toggle ${prefs.scoreAlerts ? "active" : ""}`}
              onClick={() => update("scoreAlerts", !prefs.scoreAlerts)}
              aria-label="Toggle score alerts"
            />
          </div>

          <div className="reminder-toggle-row">
            <div>
              <span>Milestone alerts</span>
              <small>Get notified when you unlock achievements</small>
            </div>
            <button
              type="button"
              className={`reminder-toggle ${prefs.milestoneAlerts ? "active" : ""}`}
              onClick={() => update("milestoneAlerts", !prefs.milestoneAlerts)}
              aria-label="Toggle milestone alerts"
            />
          </div>
        </>
      )}

      <button type="button" className="reminder-save-btn" onClick={handleSave} disabled={saving}>
        {saving ? (
          <Loader size={16} style={{ animation: "spin 1s linear infinite" }} />
        ) : saved ? (
          "✓ Preferences Saved"
        ) : (
          <>
            <Save size={16} />
            Save Preferences
          </>
        )}
      </button>
    </div>
  );
}

/**
 * Check if any checkin reminder should fire after a checkin submission.
 * Export for wiring into DailyCheckinForm and App.jsx milestone/streak logic.
 */
export function useCheckinReminderScheduler(userId, prefs) {
  const scheduleNextReminder = useCallback(
    async streakDays => {
      if (!prefs?.enabled) {
        return;
      }
      if (!prefs?.checkinReminders && !prefs?.streakNudges) {
        return;
      }

      // Schedule next checkin reminder
      if (prefs.checkinReminders) {
        await scheduleReminderOnServer(userId, prefs);
      }

      // Schedule streak nudge if applicable
      if (prefs.streakNudges && [3, 7, 14, 30].includes(streakDays)) {
        await scheduleStreakReminder(userId, streakDays);
      }
    },
    [userId, prefs]
  );

  return scheduleNextReminder;
}
