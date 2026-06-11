import React, { useState, useEffect } from "react";
import { CheckCircle2, Calendar, TrendingUp } from "lucide-react";
import {
  loadWeeklyCheckins,
  appendWeeklyCheckin,
  calculateConsecutiveStreak,
  countRecentCheckins,
} from "../engines/financialMemoryEngine.js";

/**
 * Daily Cognition Loop Component
 * Quick daily check-ins that feed into behavioral tracking
 * Transforms assessment from one-time to continuous monitoring
 * 
 * Key insight: Users care about progress, not absolute scores
 */
export default function DailyCheckinForm({ onCheckin }) {
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
      const todayCheckin = loaded.find((c) => new Date(c.date).toDateString() === today);
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
    setResponses((prev) => ({
      ...prev,
      [question]: value,
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
          : "never",
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
          completedIntention: responses.completedIntention,
        },
      };

      const updated = appendWeeklyCheckin(newCheckin);
      setCheckins(updated);
      setTodayCheckinExists(true);
      setStreak(calculateConsecutiveStreak(updated));
      setRecentCount(countRecentCheckins(updated, 7));

      if (onCheckin) {
        onCheckin({
          checkin: newCheckin,
          behaviourUpdates: mapCheckinToBehaviourSignals(responses),
        });
      }

      const checkinPayload = {
        type: "daily_checkin_completed",
        responses: newCheckin.responses,
        timestamp: new Date().toISOString(),
      };

      fetch("/api/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkinPayload),
      }).catch(() => {
        // Offline queueing handled by API
      });

      setCheckinComplete(true);
      setTimeout(() => {
        setCheckinComplete(false);
      }, 3000);
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
    responses.completedIntention === "yes" ? "+2" : responses.completedIntention === "partial" ? "+1" : "0";
  const awarenessBoost = responses.stressLevel === "low" ? "+1" : "+0";

  return (
    <section className="daily-checkin-card">
      <div className="checkin-header">
        <div className="checkin-title-group">
          <Calendar size={20} />
          <div>
            <h3>Today's Financial Reflection</h3>
            <span className="checkin-subtitle">
              Quick daily check-in to track behavioral patterns
            </span>
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
          <CheckCircle2 size={24} style={{ color: "#10b981" }} />
          <div>
            <p style={{ fontWeight: "600", marginBottom: "4px" }}>
              You've already checked in today
            </p>
            <p style={{ fontSize: "14px", color: "#64748b" }}>
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
                  className={`checkin-option ${
                    responses.stressLevel === "low" ? "selected" : ""
                  }`}
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
                  className={`checkin-option ${
                    responses.stressLevel === "high" ? "selected" : ""
                  }`}
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
                  className={`checkin-option ${
                    responses.spentOnDates === "no" ? "selected" : ""
                  }`}
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
              <CheckCircle2 size={20} style={{ color: "#10b981" }} />
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
            Daily check-ins help us track your behavior patterns and update your financial profile over time.
          </p>
        </>
      )}

      <style>{`
        .daily-checkin-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          padding: 24px;
          color: white;
          margin: 20px 0;
        }

        .checkin-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }

        .checkin-title-group {
          display: flex;
          gap: 12px;
        }

        .checkin-title-group h3 {
          font-size: 18px;
          font-weight: 700;
          margin: 0;
        }

        .checkin-subtitle {
          font-size: 13px;
          opacity: 0.9;
        }

        .streak-badge-group {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 10px;
        }

        .streak-badge,
        .checkin-count-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.2);
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
        }

        .checkin-already-done {
          display: flex;
          align-items: center;
          gap: 16px;
          background: rgba(255, 255, 255, 0.1);
          padding: 16px;
          border-radius: 8px;
        }

        .checkin-already-done p {
          margin: 0;
        }

        .checkin-questions {
          margin-bottom: 20px;
        }

        .checkin-question {
          margin-bottom: 20px;
        }

        .checkin-question label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 10px;
        }

        .checkin-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .checkin-option {
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.15);
          border: 2px solid transparent;
          border-radius: 6px;
          color: white;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
        }

        .checkin-option:hover {
          background: rgba(255, 255, 255, 0.25);
        }

        .checkin-option.selected {
          background: rgba(255, 255, 255, 0.3);
          border-color: white;
        }

        .checkin-summary-row {
          display: flex;
          gap: 16px;
          justify-content: space-between;
          margin-bottom: 16px;
          padding: 14px;
          background: rgba(255, 255, 255, 0.12);
          border-radius: 10px;
        }

        .checkin-summary-row strong {
          display: block;
          margin-bottom: 4px;
          font-size: 13px;
        }

        .checkin-success-message {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(16, 185, 129, 0.2);
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 16px;
          font-size: 14px;
        }

        .checkin-submit-button {
          width: 100%;
          padding: 12px;
          background: white;
          color: #667eea;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .checkin-submit-button:hover:not(.disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .checkin-submit-button.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .checkin-footer-text {
          font-size: 12px;
          opacity: 0.85;
          text-align: center;
          margin-top: 12px;
          margin-bottom: 0;
        }

        @media (max-width: 768px) {
          .checkin-options {
            grid-template-columns: 1fr;
          }

          .checkin-summary-row {
            flex-direction: column;
          }
        }
      `}</style>
    </section>
  );
}
