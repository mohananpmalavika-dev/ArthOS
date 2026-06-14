import React, { useState } from "react";
import { Target, Check, AlertCircle, Flame } from "lucide-react";
import { generateInterventions, markInterventionComplete } from "../engines/interventionEngine.js";

/**
 * Weekly Mission Card
 *
 * Part of ARTH.OS V4 ACTION phase: Presents the single most impactful action
 * the user should take this week, derived from their assessment gaps.
 * Simplifies the broader intervention system into one focused mission.
 */
export default function WeeklyMissionCard({ result, assessment, onAssessmentUpdate }) {
  const [completed, setCompleted] = useState(false);

  const interventions = generateInterventions(result, assessment);
  const primaryMission = interventions.primary?.[0];

  if (!primaryMission) {
    return null;
  }

  const handleComplete = () => {
    setCompleted(true);
    if (onAssessmentUpdate) {
      const updated = markInterventionComplete(primaryMission.id, assessment);
      onAssessmentUpdate(updated);
    }
  };

  return (
    <section
      className="result-card mission-card"
      style={{
        background: "linear-gradient(135deg, var(--orange-700) 0%, var(--orange-700) 100%)",
        color: "white",
        borderRadius: "var(--radius-2)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Accent Bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: "rgba(255,255,255,0.3)",
        }}
      />

      <div style={{ padding: "var(--space-4)" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "var(--space-3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Flame size={20} style={{ color: "white" }} />
            </div>
            <div>
              <h3 style={{ fontSize: "var(--type-xs)", margin: 0, opacity: 0.9, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                This Week's Mission
              </h3>
            </div>
          </div>
          {completed && (
            <div style={{ padding: "4px 8px", background: "rgba(255,255,255,0.2)", borderRadius: "3px" }}>
              <Check size={16} />
            </div>
          )}
        </div>

        {/* Mission Title */}
        <h2 style={{ fontSize: "var(--type-lg)", fontWeight: "600", margin: "0 0 var(--space-2) 0", color: "white" }}>
          {primaryMission.title}
        </h2>

        {/* Mission Description */}
        <p style={{ fontSize: "var(--type-sm)", margin: "0 0 var(--space-3) 0", opacity: 0.95, lineHeight: 1.5 }}>
          {primaryMission.description}
        </p>

        {/* Impact Badge */}
        {primaryMission.impact && (
          <div
            style={{
              display: "inline-block",
              padding: "var(--space-1) var(--space-2)",
              background: "rgba(255,255,255,0.15)",
              borderRadius: "var(--radius-1)",
              fontSize: "var(--type-xs)",
              marginBottom: "var(--space-3)",
              color: "white",
              border: "1px solid rgba(255,255,255,0.3)",
            }}
          >
            💡 {primaryMission.impact}
          </div>
        )}

        {/* Context from Assessment */}
        {interventions.reasoning && (
          <div
            style={{
              padding: "var(--space-2)",
              backgroundColor: "rgba(255,255,255,0.1)",
              borderLeft: "2px solid rgba(255,255,255,0.3)",
              marginBottom: "var(--space-3)",
              fontSize: "var(--type-xs)",
              opacity: 0.9,
              borderRadius: "2px",
            }}
          >
            <strong>Why this matters:</strong>
            <p style={{ margin: "var(--space-1) 0 0 0" }}>{interventions.reasoning}</p>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleComplete}
          disabled={completed}
          style={{
            width: "100%",
            padding: "var(--space-2) var(--space-3)",
            background: completed ? "rgba(255,255,255,0.2)" : "white",
            color: completed ? "rgba(255,255,255,0.6)" : "var(--orange-700)",
            border: "none",
            borderRadius: "var(--radius-1)",
            fontSize: "var(--type-sm)",
            fontWeight: "600",
            cursor: completed ? "default" : "pointer",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "var(--space-1)",
          }}
          onMouseEnter={(e) => {
            if (!completed) {
              e.target.style.background = "rgba(255,255,255,0.9)";
            }
          }}
          onMouseLeave={(e) => {
            if (!completed) {
              e.target.style.background = "white";
            }
          }}
        >
          {completed ? (
            <>
              <Check size={16} />
              Mission Completed
            </>
          ) : (
            <>
              <Target size={16} />
              Mark as Complete
            </>
          )}
        </button>

        {/* Secondary Actions Hint */}
        <p style={{ fontSize: "var(--type-xs)", margin: "var(--space-2) 0 0 0", opacity: 0.7, textAlign: "center" }}>
          {interventions.secondary && interventions.secondary.length > 0
            ? `+ ${interventions.secondary.length} secondary focus area${interventions.secondary.length > 1 ? "s" : ""}`
            : "Your primary focus this week"}
        </p>
      </div>
    </section>
  );
}
