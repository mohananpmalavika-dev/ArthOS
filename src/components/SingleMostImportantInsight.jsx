import React, { useMemo, useState } from "react";
import {
  Target,
  AlertCircle,
  Lightbulb,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  CheckCircle2,
  Eye
} from "lucide-react";
import { generatePersonalizedInsights } from "../engines/insightGenerator";
import {
  getSingleMostImportantInsight,
  getSecondaryInsights,
  getImpactLabel,
  getCategoryMeta
} from "../engines/singleInsightEngine";

export default function SingleMostImportantInsight({ assessmentResult, assessment }) {
  const [showAll, setShowAll] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [actionCommitted, setActionCommitted] = useState(false);

  // Compute insights once
  const { primaryInsight, secondaryInsights, totalCount } = useMemo(() => {
    if (!assessmentResult || !assessment) {
      return { primaryInsight: null, secondaryInsights: [], totalCount: 0 };
    }
    const all = generatePersonalizedInsights(assessmentResult, assessment);
    const primary = getSingleMostImportantInsight(all);
    const secondary = getSecondaryInsights(all);
    return {
      primaryInsight: primary,
      secondaryInsights: secondary,
      totalCount: all.length
    };
  }, [assessmentResult, assessment]);

  // Track acknowledgement in localStorage (per session)
  const handleAcknowledge = () => {
    setAcknowledged(true);
    if (primaryInsight) {
      try {
        const key = `arth-os-insight-ack-${primaryInsight.id}`;
        window.localStorage.setItem(
          key,
          JSON.stringify({
            id: primaryInsight.id,
            acknowledgedAt: new Date().toISOString()
          })
        );
      } catch {
        // ignore storage errors
      }
    }
  };

  const handleCommit = async () => {
    setActionCommitted(true);
    if (primaryInsight) {
      try {
        const key = `arth-os-insight-action-${primaryInsight.id}`;
        window.localStorage.setItem(
          key,
          JSON.stringify({
            action: primaryInsight.actionable,
            committedAt: new Date().toISOString()
          })
        );

        // Schedule follow-up for Day 7 and Day 30
        const userId = window.localStorage.getItem("arth-os-user-id");
        if (userId) {
          try {
            const res = await fetch("/api/follow-up/schedule", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-user-id": userId
              },
              body: JSON.stringify({
                insight: primaryInsight,
                action: primaryInsight.actionable,
                assessment: assessment
              })
            });

            if (res.ok) {
              const data = await res.json();
              console.log("Follow-up scheduled:", data);
            }
          } catch (e) {
            console.error("Error scheduling follow-up:", e);
          }
        }
      } catch {
        // ignore storage errors
      }
    }
  };

  if (!primaryInsight) {
    return null;
  }

  const impact = getImpactLabel(primaryInsight.priority);
  const category = getCategoryMeta(primaryInsight.category);

  return (
    <section className="single-insight-section summary-card">
      {/* Header */}
      <div className="single-insight-header">
        <div className="single-insight-title-group">
          <Target size={20} className="single-insight-icon" />
          <div>
            <h2 className="single-insight-title">Your Most Important Insight</h2>
            <p className="single-insight-subtitle">
              One insight. Not ten. This is the one that matters most for you right now.
            </p>
          </div>
        </div>
        <span className="single-insight-badge">
          {impact.emoji} {impact.label}
        </span>
      </div>

      {/* Primary Insight Card — Hero Treatment */}
      <div className={`single-insight-hero insight-card-${primaryInsight.priority}`}>
        {/* Category & Priority Row */}
        <div className="single-insight-meta-row">
          <span className="single-insight-category" style={{ "--category-color": category.color }}>
            {category.icon} {primaryInsight.category}
          </span>
          <span className={`single-insight-priority insight-tag-${primaryInsight.priority}`}>
            {impact.emoji} {primaryInsight.priority} priority
          </span>
        </div>

        {/* Headline — Large, Bold, Single Line */}
        <h3 className="single-insight-headline">{primaryInsight.headline}</h3>

        {/* Explanation */}
        <p className="single-insight-explanation">{primaryInsight.insight}</p>

        {/* Signal Data */}
        {primaryInsight.signal && (
          <div className="single-insight-signal">
            <Eye size={14} />
            <span>{primaryInsight.signal}</span>
          </div>
        )}

        {/* Actionable Step — The CTA */}
        {primaryInsight.actionable && (
          <div className="single-insight-action-card">
            <div className="single-insight-action-header">
              <Target size={16} />
              <span>Your one action this week</span>
            </div>
            <p className="single-insight-action-text">{primaryInsight.actionable}</p>
            <div className="single-insight-action-buttons">
              <button
                className={`single-insight-commit-btn ${actionCommitted ? "committed" : ""}`}
                onClick={handleCommit}
                disabled={actionCommitted}
              >
                {actionCommitted ? (
                  <>
                    <CheckCircle2 size={16} />
                    Committed to this action
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />I will do this this week
                  </>
                )}
              </button>
              <button
                className={`single-insight-ack-btn ${acknowledged ? "acknowledged" : ""}`}
                onClick={handleAcknowledge}
                disabled={acknowledged}
              >
                {acknowledged ? "Acknowledged ✓" : "Mark as seen"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Remaining Insights — Collapsible */}
      {secondaryInsights.length > 0 && (
        <div className="single-insight-secondary">
          <button className="single-insight-toggle" onClick={() => setShowAll(!showAll)}>
            <span>
              {showAll ? "Hide" : "View"} all {totalCount} insights
            </span>
            {showAll ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showAll && (
            <div className="single-insight-list">
              {secondaryInsights.map(insight => {
                const cat = getCategoryMeta(insight.category);
                const imp = getImpactLabel(insight.priority);
                return (
                  <div
                    key={insight.id}
                    className={`single-insight-item insight-card-${insight.priority}`}
                  >
                    <div className="single-insight-item-top">
                      <span className="single-insight-item-badge">
                        {imp.emoji} {insight.priority}
                      </span>
                      <span className="single-insight-item-category">
                        {cat.icon} {insight.category}
                      </span>
                    </div>
                    <p className="single-insight-item-headline">{insight.headline}</p>
                    <p className="single-insight-item-text">{insight.insight}</p>
                    {insight.actionable && (
                      <p className="single-insight-item-action">
                        <ArrowRight size={12} />
                        {insight.actionable}
                      </p>
                    )}
                    {insight.signal && (
                      <span className="single-insight-item-signal">{insight.signal}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Acknowledgment confirmation banner */}
      {acknowledged && !actionCommitted && (
        <div className="single-insight-footer-note">
          <Lightbulb size={14} />
          <span>
            You've acknowledged this insight. Come back to commit to an action when you're ready.
          </span>
        </div>
      )}
    </section>
  );
}
