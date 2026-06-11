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
    <section className="result-card interventions-prescription-card">
      <div className="result-heading">
        <Zap size={20} />
        <div>
          <h2>Financial Prescriptions</h2>
          <span className="interventions-subtitle">
            {interventions.primaryComponent}: {interventions.primaryGap}% gap
          </span>
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

      <style>{`
        .interventions-prescription-card {
          border-left: 4px solid #f59e0b;
        }

        .interventions-subtitle {
          font-size: 13px;
          color: #64748b;
        }

        .interventions-reasoning {
          background: #fef3c7;
          border-left: 3px solid #f59e0b;
          padding: 12px 14px;
          border-radius: 4px;
          margin-bottom: 16px;
          font-size: 13px;
          color: #78350f;
        }

        .interventions-reasoning p {
          margin: 0;
          line-height: 1.5;
        }

        .interventions-list {
          margin: 16px 0;
        }

        .intervention-group {
          margin-bottom: 20px;
        }

        .intervention-group-title {
          font-size: 13px;
          font-weight: 700;
          color: #1f2937;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 12px 0;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e7eb;
        }

        .interventions-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }

        .no-interventions {
          font-size: 13px;
          color: #64748b;
          font-style: italic;
          margin: 0;
        }

        .intervention-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 12px 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .intervention-card:hover {
          border-color: #d1d5db;
          background: #f3f4f6;
        }

        .intervention-card.primary {
          border-left: 3px solid #f59e0b;
          background: #fffbeb;
        }

        .intervention-card.completed {
          opacity: 0.6;
          background: #ecfdf5;
          border-color: #86efac;
        }

        .intervention-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 8px;
        }

        .intervention-title {
          font-weight: 600;
          font-size: 14px;
          color: #1f2937;
          margin: 0;
          flex: 1;
        }

        .intervention-impact {
          font-size: 12px;
          font-weight: 700;
          color: #10b981;
          white-space: nowrap;
        }

        .intervention-meta {
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: #64748b;
          margin-bottom: 0;
        }

        .intervention-meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .intervention-description {
          font-size: 13px;
          color: #475569;
          line-height: 1.4;
          margin: 10px 0 12px 0;
          display: none;
        }

        .intervention-card.expanded .intervention-description {
          display: block;
        }

        .intervention-actions {
          display: flex;
          gap: 8px;
          margin-top: 10px;
          display: none;
        }

        .intervention-card.expanded .intervention-actions {
          display: flex;
        }

        .intervention-button {
          padding: 8px 12px;
          font-size: 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }

        .start-intervention-btn {
          background: #f59e0b;
          color: white;
          flex: 1;
        }

        .start-intervention-btn:hover {
          background: #d97706;
        }

        .mark-complete-btn {
          background: #10b981;
          color: white;
          flex: 1;
        }

        .mark-complete-btn:hover {
          background: #059669;
        }

        .interventions-progress {
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
        }

        .interventions-progress span {
          font-size: 12px;
          color: #64748b;
          display: block;
          margin-bottom: 8px;
        }

        .progress-bar {
          height: 6px;
          background: #e5e7eb;
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
          border-radius: 3px;
          transition: width 0.3s ease;
        }
      `}</style>
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
          {isCompleted && <CheckCircle2 size={16} style={{ display: "inline-block", marginRight: "6px", color: "#10b981" }} />}
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
              <div style={{ fontSize: "13px", color: "#10b981", fontWeight: "600" }}>
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
