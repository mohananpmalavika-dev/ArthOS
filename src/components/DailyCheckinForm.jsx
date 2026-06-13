import React, { useState, useEffect, useContext } from "react";
import { CheckCircle2, Calendar, TrendingUp } from "lucide-react";
import {
  loadWeeklyCheckins,
  appendWeeklyCheckin,
  calculateConsecutiveStreak,
  countRecentCheckins
} from "../engines/financialMemoryEngine.js";
import { scheduleStreakReminder } from "./ReminderPreferences.jsx";
import { loadPrefs } from "../lib/reminderPrefs.js";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * Daily Cognition Loop Component
 * Quick daily check-ins that feed into behavioral tracking
 * Transforms assessment from one-time to continuous monitoring
 *
 * Key insight: Users care about progress, not absolute scores
 */
export default function DailyCheckinForm({ onCheckin }) {
  const { user } = useAuth();
  const [responses, setResponses] = useState({});
  const [checkinComplete, setCheckinComplete] = useState(false);
  const [todayCheckinExists, setTodayCheckinExists] = useState(false);
  const [streak, setStreak] = useState(0);
  const [checkins, setCheckins] = useState([]);
  const [recentCount, setRecentCount] = useState(0);

  // Load weekly check-ins on mount
  useEffect(() => {
    loadDailyCheckinStatus();
  }, []);

  function loadDailyCheckinStatus() {
    try {
      const loaded = loadWeeklyCheckins();
      setCheckins(loaded);

      const today = new Date().toDateString();
      const todayCheckin = loaded.find(c => new Date(c.date).toDateString() === today);
      if (todayCheckin) {
        setTodayCheckinExists(true);
        setResponses(todayCheckin.responses || {});
      }

      setStreak(calculateConsecutiveStreak(loaded));
      setRecentCount(countRecentCheckins(loaded, 7));
    } catch (error) {
      console.warn("Could not load checkin data:", error);
    }
  }

  function handleResponse(question, value) {
    setResponses(prev => ({
      ...prev,
      [question]: value
    }));
  }

  function mapCheckinToBehaviourSignals(responses) {
    return {
      unplannedPurchaseFreq:
        responses.unplannedPurchases === "no"
          ? "never"
          : responses.unplannedPurchases === "small"
            ? "rarely"
            : responses.unplannedPurchases === "medium"
              ? "sometimes"
              : "very_frequently",
      spendWhenStressed:
        responses.stressLevel === "high"
          ? "very_likely"
          : responses.stressLevel === "moderate"
            ? "sometimes"
            : "rarely",
      regretImpulseFreq:
        responses.spentOnDates === "yes_unplanned"
          ? "often"
          : responses.spentOnDates === "yes_planned"
            ? "sometimes"
            : "rarely",
      impulseWaitRule:
        responses.completedIntention === "yes"
          ? "always"
          : responses.completedIntention === "partial"
            ? "sometimes"
            : "never"
    };
  }

  function submitCheckin() {
    try {
      const newCheckin = {
        date: new Date().toISOString(),
        responses: {
          unplannedPurchases: responses.unplannedPurchases,
          stressLevel: responses.stressLevel,
          spentOnDates: responses.spentOnDates,
          completedIntention: responses.completedIntention
        }
      };

      const updated = appendWeeklyCheckin(newCheckin);
      setCheckins(updated);
      setTodayCheckinExists(true);
      setStreak(calculateConsecutiveStreak(updated));
      setRecentCount(countRecentCheckins(updated, 7));

      if (onCheckin) {
        onCheckin({
          checkin: newCheckin,
          behaviourUpdates: mapCheckinToBehaviourSignals(responses)
        });
      }

      const checkinPayload = {
        type: "daily_checkin_completed",
        responses: newCheckin.responses,
        timestamp: new Date().toISOString()
      };

      fetch("/api/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkinPayload)
      }).catch(() => {
        // Offline queueing handled by API
      });

      setCheckinComplete(true);
      setTimeout(() => {
        setCheckinComplete(false);
      }, 3000);

      // Fire streak reminder if user hit a milestone streak
      const newStreak = calculateConsecutiveStreak(updated);
      const prefs = loadPrefs();
      if (prefs.enabled && prefs.streakNudges && [3, 7, 14, 30].includes(newStreak)) {
        const userId = user?.id;
        if (userId) {
          scheduleStreakReminder(userId, newStreak);
        }
      }
    } catch (error) {
      console.warn("Could not save checkin:", error);
    }
  }

  const allAnswered =
    responses.unplannedPurchases !== undefined &&
    responses.stressLevel !== undefined &&
    responses.spentOnDates !== undefined &&
    responses.completedIntention !== undefined;

  const behaviorBoost =
    responses.completedIntention === "yes"
      ? "+2"
      : responses.completedIntention === "partial"
        ? "+1"
        : "0";
  const awarenessBoost = responses.stressLevel === "low" ? "+1" : "+0";

  return (
    <section className="daily-checkin-card summary-card premium-report-block">
      <div className="premium-report-block-header checkin-header">
        <div className="checkin-title-group">
          <Calendar size={20} />
          <div>
            <h3 className="premium-report-block-title">Today's Financial Reflection</h3>
            <p className="premium-report-block-subtitle">
              Quick daily check-in to track behavioral patterns
            </p>
          </div>
        </div>
        <div className="streak-badge-group">
          <div className="streak-badge">
            <TrendingUp size={16} />
            <span>{streak}-day streak</span>
          </div>
          <div className="checkin-count-badge">
            <span>{recentCount} this week</span>
          </div>
        </div>
      </div>

      {todayCheckinExists ? (
        <div className="checkin-already-done">
          <CheckCircle2 size={24} style={{ color: "var(--green-500)" }} />
          <div>
            <p style={{ fontWeight: "600", marginBottom: "4px" }}>
              You've already checked in today
            </p>
            <p style={{ fontSize: "14px", color: "var(--gray-500)" }}>
              Come back tomorrow to continue your streak.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="checkin-questions">
            {/* Question 1: Unplanned Purchases */}
            <div className="checkin-question">
              <label>Did you make any unplanned purchases today?</label>
              <div className="checkin-options">
                <button
                  className={`checkin-option ${
                    responses.unplannedPurchases === "no" ? "selected" : ""
                  }`}
                  onClick={() => handleResponse("unplannedPurchases", "no")}
                >
                  No purchases
                </button>
                <button
                  className={`checkin-option ${
                    responses.unplannedPurchases === "small" ? "selected" : ""
                  }`}
                  onClick={() => handleResponse("unplannedPurchases", "small")}
                >
                  Small ({"<"} 500 INR)
                </button>
                <button
                  className={`checkin-option ${
                    responses.unplannedPurchases === "medium" ? "selected" : ""
                  }`}
                  onClick={() => handleResponse("unplannedPurchases", "medium")}
                >
                  Medium (500-2000 INR)
                </button>
                <button
                  className={`checkin-option ${
                    responses.unplannedPurchases === "large" ? "selected" : ""
                  }`}
                  onClick={() => handleResponse("unplannedPurchases", "large")}
                >
                  Large ({">"} 2000 INR)
                </button>
              </div>
            </div>

            {/* Question 2: Stress Level */}
            <div className="checkin-question">
              <label>How stressed did you feel today?</label>
              <div className="checkin-options">
                <button
                  className={`checkin-option ${responses.stressLevel === "low" ? "selected" : ""}`}
                  onClick={() => handleResponse("stressLevel", "low")}
                >
                  Low
                </button>
                <button
                  className={`checkin-option ${
                    responses.stressLevel === "moderate" ? "selected" : ""
                  }`}
                  onClick={() => handleResponse("stressLevel", "moderate")}
                >
                  Moderate
                </button>
                <button
                  className={`checkin-option ${responses.stressLevel === "high" ? "selected" : ""}`}
                  onClick={() => handleResponse("stressLevel", "high")}
                >
                  High
                </button>
              </div>
            </div>

            {/* Question 3: Spent on dates/social */}
            <div className="checkin-question">
              <label>Did you spend money on social/leisure activities?</label>
              <div className="checkin-options">
                <button
                  className={`checkin-option ${responses.spentOnDates === "no" ? "selected" : ""}`}
                  onClick={() => handleResponse("spentOnDates", "no")}
                >
                  No
                </button>
                <button
                  className={`checkin-option ${
                    responses.spentOnDates === "yes_planned" ? "selected" : ""
                  }`}
                  onClick={() => handleResponse("spentOnDates", "yes_planned")}
                >
                  Yes, planned
                </button>
                <button
                  className={`checkin-option ${
                    responses.spentOnDates === "yes_unplanned" ? "selected" : ""
                  }`}
                  onClick={() => handleResponse("spentOnDates", "yes_unplanned")}
                >
                  Yes, unplanned
                </button>
              </div>
            </div>

            {/* Question 4: Completed intention */}
            <div className="checkin-question">
              <label>Did you stick to a financial intention or goal today?</label>
              <div className="checkin-options">
                <button
                  className={`checkin-option ${
                    responses.completedIntention === "yes" ? "selected" : ""
                  }`}
                  onClick={() => handleResponse("completedIntention", "yes")}
                >
                  Yes
                </button>
                <button
                  className={`checkin-option ${
                    responses.completedIntention === "partial" ? "selected" : ""
                  }`}
                  onClick={() => handleResponse("completedIntention", "partial")}
                >
                  Partially
                </button>
                <button
                  className={`checkin-option ${
                    responses.completedIntention === "no" ? "selected" : ""
                  }`}
                  onClick={() => handleResponse("completedIntention", "no")}
                >
                  No
                </button>
              </div>
            </div>
          </div>

          <div className="checkin-summary-row">
            <div>
              <strong>Projected boost</strong>
              <p>{`Behaviour ${behaviorBoost}, Awareness ${awarenessBoost}`}</p>
            </div>
            <div>
              <strong>Weekly check-ins</strong>
              <p>{recentCount} completed</p>
            </div>
          </div>

          {checkinComplete && (
            <div className="checkin-success-message">
              <CheckCircle2 size={20} style={{ color: "var(--green-500)" }} />
              <span>Check-in saved! Keep up your streak.</span>
            </div>
          )}

          <button
            className={`checkin-submit-button ${!allAnswered ? "disabled" : ""}`}
            onClick={submitCheckin}
            disabled={!allAnswered}
          >
            {allAnswered ? "Save Check-In" : "Answer all questions"}
          </button>

          <p className="checkin-footer-text">
            Daily check-ins help us track your behavior patterns and update your financial profile
            over time.
          </p>
        </>
      )}
    </section>
  );
}
