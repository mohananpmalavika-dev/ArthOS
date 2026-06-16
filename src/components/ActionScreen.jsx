import React, { useState } from "react";
import NextBestActionCard from "./NextBestActionCard.jsx";
import ContextualCoachPrompt from "./ContextualCoachPrompt.jsx";
import WeeklyMissionCard from "./WeeklyMissionCard.jsx";
import { InterventionsPrescriptionCard } from "./InterventionsPrescriptionCard.jsx";
import DecisionSimulator from "./DecisionSimulator.jsx";

export default function ActionScreen({ result, assessment, onAssessmentUpdate }) {
  const [expandedDetails, setExpandedDetails] = useState(false);

  return (
    <section className="page-section action-screen" style={{ padding: "24px 16px" }}>
      <div className="page-heading" style={{ marginBottom: "24px" }}>
        <p style={{ margin: 0, color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.14em", fontSize: "0.85rem" }}>
          Action Screen
        </p>
        <h1 style={{ margin: "12px 0 0", fontSize: "2rem", fontWeight: 800, color: "var(--ink-0)" }}>
          What Should I Do Now?
        </h1>
        <p style={{ margin: "12px 0 0", color: "var(--ink-3)", maxWidth: "760px", lineHeight: 1.7 }}>
          One clear next move. Focus on impact over complexity. The rest follows.
        </p>
      </div>

      <div style={{ display: "grid", gap: "20px" }}>
        {/* Hero: Next Best Action */}
        <NextBestActionCard result={result} assessment={assessment} onExpand={() => setExpandedDetails(!expandedDetails)} />

        {/* Secondary Actions (collapsed by default) */}
        {expandedDetails && (
          <div style={{ display: "grid", gap: "20px", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)" }}>
            <WeeklyMissionCard result={result} assessment={assessment} onAssessmentUpdate={onAssessmentUpdate} />
            <div style={{ display: "grid", gap: "20px" }}>
              <InterventionsPrescriptionCard result={result} assessment={assessment} onAssessmentUpdate={onAssessmentUpdate} />
              {assessment && assessment.profile ? (
                <DecisionSimulator result={result} assessment={assessment} />
              ) : (
                <div className="summary-card">
                  <p style={{ margin: 0, color: "var(--ink-3)" }}>
                    Decision simulator unavailable — incomplete profile data in dev mode.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Always show assistant context */}
        <section
          className="result-card action-context-section"
          style={{
            padding: "20px",
            borderRadius: "16px",
            background: "var(--gray-50)",
            border: "1px solid var(--gray-200)"
          }}
        >
          <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--ink-3)", lineHeight: 1.6 }}>
            <strong style={{ color: "var(--ink-0)" }}>💡 Tip:</strong> Your AI Coach is available 24/7. Ask any questions about your recommended actions or explore your financial patterns deeper.
          </p>
        </section>

        {/* Contextual Coach */}
        <ContextualCoachPrompt
          context="action"
          headline="Need Help Getting Started?"
          prompt="Your next move is clear. But breaking it down into concrete steps can feel overwhelming. Ask your coach how to start, what to do first, or whether this action aligns with your goals."
        />
      </div>
    </section>
  );
}
