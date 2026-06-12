import React, { useState } from "react";
import { Zap, Target, CheckCircle2, Clock, Flame } from "lucide-react";
import { generateInterventions, markInterventionComplete } from "../engines/interventionEngine.js";

/**
 * Interventions Prescription Component
 * Shows actionable prescriptions based on assessment gaps
 * This is Layer 3 of BAS Framework: Prescription
 */
export function InterventionsPrescriptionCard({ result, assessment, onAssessmentUpdate }) {
  const [completedInterventions, setCompletedInterventions] = useState([]);
  const [expandedIntervention, setExpandedIntervention] = useState(null);

  const interventions = generateInterventions(result, assessment);

  function handleCompleteIntervention(interventionId) {
    setCompletedInterventions([...completedInterventions, interventionId]);

    // Optional: update assessment with intervention history
    if (onAssessmentUpdate) {
      const updated = markInterventionComplete(interventionId, assessment);
      onAssessmentUpdate(updated);
    }
  }

  function toggleExpanded(id) {
    setExpandedIntervention(expandedIntervention === id ? null : id);
  }

  const allInterventions = [...(interventions.primary || []), ...(interventions.secondary || [])];

  return (
    <section className="summary-card premium-report-block interventions-prescription-card">
      <div className="premium-report-block-header">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Zap size={20} />
          <div>
            <h2 className="premium-report-block-title">Financial Prescriptions</h2>
            <p className="premium-report-block-subtitle">
              {interventions.primaryComponent}: {interventions.primaryGap}% gap
            </p>
          </div>
        </div>
      </div>

      {/* Reasoning */}
      <div className="interventions-reasoning">
        <p>{interventions.reasoning}</p>
      </div>

      {/* Interventions List */}
      <div className="interventions-list">
        {/* Primary Interventions */}
        <div className="intervention-group">
          <h3 className="intervention-group-title">Priority Interventions</h3>
          {interventions.primary && interventions.primary.length > 0 ? (
            <div className="interventions-grid">
              {interventions.primary.map((intervention, idx) => (
                <InterventionCard
                  key={intervention.id}
                  intervention={intervention}
                  isPrimary={true}
                  isCompleted={completedInterventions.includes(intervention.id)}
                  isExpanded={expandedIntervention === intervention.id}
                  onToggleExpand={() => toggleExpanded(intervention.id)}
                  onComplete={() => handleCompleteIntervention(intervention.id)}
                />
              ))}
            </div>
          ) : (
            <p className="no-interventions">No primary interventions needed.</p>
          )}
        </div>

        {/* Secondary Interventions */}
        {interventions.secondary && interventions.secondary.length > 0 && (
          <div className="intervention-group">
            <h3 className="intervention-group-title">Secondary Focus</h3>
            <div className="interventions-grid">
              {interventions.secondary.map((intervention) => (
                <InterventionCard
                  key={intervention.id}
                  intervention={intervention}
                  isPrimary={false}
                  isCompleted={completedInterventions.includes(intervention.id)}
                  isExpanded={expandedIntervention === intervention.id}
                  onToggleExpand={() => toggleExpanded(intervention.id)}
                  onComplete={() => handleCompleteIntervention(intervention.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Progress Summary */}
      <div className="interventions-progress">
        <span>
          {completedInterventions.length} of {allInterventions.length} interventions started
        </span>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${Math.round((completedInterventions.length / Math.max(1, allInterventions.length)) * 100)}%`,
            }}
          />
        </div>
      </div>
    </section>
  );
}

/**
 * Individual Intervention Card Component
 */
function InterventionCard({
  intervention,
  isPrimary,
  isCompleted,
  isExpanded,
  onToggleExpand,
  onComplete,
}) {
  return (
    <div
      className={`intervention-card ${isPrimary ? "primary" : ""} ${isCompleted ? "completed" : ""} ${
        isExpanded ? "expanded" : ""
      }`}
      onClick={onToggleExpand}
    >
      <div className="intervention-header">
        <h4 className="intervention-title">
          {isCompleted && <CheckCircle2 size={16} style={{ display: "inline-block", marginRight: "6px", color: "var(--green-500)" }} />}
          {intervention.title}
        </h4>
        <span className="intervention-impact">{intervention.impact}</span>
      </div>

      <p className="intervention-meta">
        <span className="intervention-meta-item">
          <Clock size={12} />
          {intervention.duration}
        </span>
        <span className="intervention-meta-item">
          <Flame size={12} />
          {intervention.difficulty}
        </span>
      </p>

      {isExpanded && (
        <>
          <p className="intervention-description">{intervention.description}</p>
          <div className="intervention-actions" onClick={(e) => e.stopPropagation()}>
            {!isCompleted && (
              <button className="intervention-button start-intervention-btn" onClick={onComplete}>
                Start This
              </button>
            )}
            {isCompleted && (
              <div style={{ fontSize: "13px", color: "var(--green-500)", fontWeight: "600" }}>
                ✓ Started
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default InterventionsPrescriptionCard;
