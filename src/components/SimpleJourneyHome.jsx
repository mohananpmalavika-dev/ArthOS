import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { ArrowRight, MessageCircle, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { normalizeScore } from "../lib/scoring-v2";
import SingleMostImportantInsight from "./SingleMostImportantInsight.jsx";
import SingleRecommendedAction from "./SingleRecommendedAction.jsx";
import WeeklyMissionCard from "./WeeklyMissionCard.jsx";

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function plainBandLabel(score) {
  if (score >= 80) return "Excellent — you are in great shape";
  if (score >= 60) return "Good — a few tweaks can help";
  if (score >= 40) return "Fair — focus on the basics first";
  return "Needs attention — start with one small step";
}

export default function SimpleJourneyHome({ result, assessment, onCoachOpen }) {
  const navigate = useNavigate();

  const currentScore = useMemo(
    () => clampScore(normalizeScore(result?.healthScore ?? 0)),
    [result]
  );

  const runway = result?.survivalMonthsDisplay || "0";
  const cashflow = result?.cashflowDisplay || "₹0";
  const bandText = plainBandLabel(currentScore);

  return (
    <main className="simple-journey-home" role="main">
      <section className="simple-hero">
        <p className="simple-hero-eyebrow">Your money health</p>
        <h1>Here is where you stand today</h1>
        <p className="simple-hero-copy">
          No jargon — just your score, how long your savings will last, and what to do next.
        </p>

        <div className="simple-score-card">
          <div className="simple-score-ring" style={{ "--score": currentScore }}>
            <span className="simple-score-number">{currentScore}</span>
            <span className="simple-score-max">out of 100</span>
          </div>
          <div className="simple-score-meta">
            <p className="simple-score-band">{bandText}</p>
            <p className="simple-score-hint">
              <TrendingUp size={16} aria-hidden="true" />
              {result?.categoryBand?.label || "Your current level"}
            </p>
          </div>
        </div>
      </section>

      <section className="simple-metrics">
        <div className="simple-metric-card">
          <span>Money left each month</span>
          <strong>{cashflow}</strong>
          <p>What remains after your regular expenses.</p>
        </div>
        <div className="simple-metric-card">
          <span>Savings will last</span>
          <strong>{runway} months</strong>
          <p>How long you can cover bills if income stopped today.</p>
        </div>
        <div className="simple-metric-card">
          <span>Health score</span>
          <strong>{currentScore}/100</strong>
          <p>A single number for spending habits, awareness, and stability.</p>
        </div>
      </section>

      <section className="simple-block">
        <div className="simple-block-header">
          <h2>What this means for you</h2>
          <p>The one insight that matters most right now.</p>
        </div>
        <SingleMostImportantInsight assessmentResult={result} assessment={assessment} />
      </section>

      <section className="simple-block simple-action-block">
        <div className="simple-block-header">
          <h2>Do this next</h2>
          <p>One practical step — not a long list.</p>
        </div>
        <SingleRecommendedAction result={result} assessment={assessment} />
      </section>

      <section className="simple-block">
        <div className="simple-block-header">
          <h2>This week&apos;s focus</h2>
          <p>A small mission to keep you moving.</p>
        </div>
        <WeeklyMissionCard
          result={assessment}
          assessment={assessment}
          onAssessmentUpdate={() => undefined}
        />
      </section>

      <section className="simple-cta-row">
        <button
          type="button"
          className="simple-primary-btn"
          onClick={() => onCoachOpen?.("start")}
        >
          <MessageCircle size={18} aria-hidden="true" />
          Ask the money coach
        </button>
        <button
          type="button"
          className="simple-secondary-btn"
          onClick={() => navigate("/dashboard/plan")}
        >
          See my full plan
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </section>

      <p className="simple-footnote">
        Want all dashboards and advanced tools? Switch to Full Experience in Settings.
      </p>
    </main>
  );
}

SimpleJourneyHome.propTypes = {
  result: PropTypes.object,
  assessment: PropTypes.object,
  onCoachOpen: PropTypes.func
};
