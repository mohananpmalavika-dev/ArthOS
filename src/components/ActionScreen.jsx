import React from "react";
import WeeklyMissionCard from "./WeeklyMissionCard.jsx";
import { InterventionsPrescriptionCard } from "./InterventionsPrescriptionCard.jsx";
import DecisionSimulator from "./DecisionSimulator.jsx";

export default function ActionScreen({ result, assessment, onAssessmentUpdate }) {
  return (
    <section className="page-section action-screen" style={{ padding: "24px 16px" }}>
      <div className="page-heading" style={{ marginBottom: "24px" }}>
        <p style={{ margin: 0, color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.14em", fontSize: "0.85rem" }}>
          Action Screen
        </p>
        <h1 style={{ margin: "12px 0 0", fontSize: "2rem", fontWeight: 800, color: "var(--ink-0)" }}>
          Action Center
        </h1>
        <p style={{ margin: "12px 0 0", color: "var(--ink-3)", maxWidth: "760px", lineHeight: 1.7 }}>
          One weekly mission and a clear set of interventions to move your financial health forward.
        </p>
      </div>

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
    </section>
  );
}
