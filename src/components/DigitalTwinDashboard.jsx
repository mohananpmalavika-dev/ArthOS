import React, { useMemo } from "react";
import "./DigitalTwinDashboard.css";
import { normalizeScore } from "../lib/scoring-v2";
import ScoreRing from "./ScoreRing.jsx";
import { EnhancedInsightNarrative } from "./EnhancedInsightNarrative.jsx";
import TraitMatrixVisualizer from "./TraitMatrixVisualizer.jsx";
import WeeklyMissionCard from "./WeeklyMissionCard.jsx";
import BadgeDisplay from "./BadgeDisplay.jsx";
import EmotionalTriggersCard from "./EmotionalTriggersCard.jsx";
import DecisionSimulator from "./DecisionSimulator.jsx";

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export default function DigitalTwinDashboard({ twin, result, twinData, assessment }) {
  const twinSource = twin || result || twinData;

  if (!twinSource) {
    return (
      <main className="digital-twin-dashboard empty" role="main">
        <div className="empty-state">
          <h3>🌍 Digital Twin Not Yet Generated</h3>
          <p>Complete an assessment to generate your financial digital twin.</p>
          <p>
            Once created, you can simulate decisions, explore futures, and stress-test your
            financial life.
          </p>
        </div>
      </main>
    );
  }

  const stats = twinSource.futureStatistics || {};
  const currentState = twinSource.currentState || {};
  const future = twinSource.methods?.getFutureScenarios?.() || {
    median: stats.percentiles?.finalRunway?.p50,
    pessimistic: stats.percentiles?.finalRunway?.p5,
    optimistic: stats.percentiles?.finalRunway?.p95,
    survivalRate: stats.survivalRate
  };

  const medianHealthScore = currentState.median?.healthScore;
  const score =
    medianHealthScore != null
      ? clampScore(medianHealthScore)
      : clampScore(normalizeScore(twinSource.financial?.score ?? 0));
  const runway = Number(
    currentState.median?.runway ?? twinSource.financial?.runway ?? future?.median ?? 0
  ).toFixed(1);
  const income = Math.round(currentState.median?.income ?? twinSource.financial?.income ?? 0);
  const expenses = Math.round(
    currentState.median?.expenses ?? twinSource.financial?.expenses ?? 0
  );
  const savings = Math.round(currentState.median?.savings ?? twinSource.financial?.savings ?? 0);
  const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0;
  const discipline = Math.round((currentState.behavior?.savingsDiscipline || 0) * 100);
  const impulseControl = Math.round(
    (1 - (currentState.behavior?.impulseProbability || 0)) * 100
  );
  const survivalRate = Number(
    future.survivalRate ?? twinSource.predictive?.confidence ?? 0
  ).toFixed(1);

  const scenarioSummary = useMemo(() => {
    const rate = Number(future.survivalRate || 0);
    if (rate >= 85) {
      return {
        headline: "Resilient path",
        description:
          "Your twin is stable across most scenarios. Keep building buffer and behavior discipline to stay ahead.",
        tone: "positive"
      };
    }
    if (rate >= 60) {
      return {
        headline: "Watchful path",
        description:
          "This model is moderately stable. A few targeted changes can reduce downside risk and improve runway.",
        tone: "warning"
      };
    }
    return {
      headline: "Critical path",
      description:
        "Your twin is vulnerable to shocks. Focus on runway, emergency savings, and spending discipline to change the trajectory.",
      tone: "danger"
    };
  }, [future.survivalRate]);

  const safeAssessment = assessment || {};
  const userName = twinSource.identity?.name || twinSource.user?.name || "Financial Explorer";
  const identityBand = twinSource.financial?.band || twinSource.metadata?.band || "Balanced";
  const trend = twinSource.financial?.trend || twinSource.predictive?.trajectory || "steady";

  return (
    <main className="digital-twin-dashboard digital-twin-landing" role="main">
      <header className="dashboard-hero">
        <div className="hero-copy">
          <span className="eyebrow">Digital twin landing</span>
          <p className="hero-identity">
            {userName} • <strong>{identityBand}</strong> • {trend}
          </p>
          <h1>See your financial life as a living model.</h1>
          <p>
            This landing page turns your digital twin into a simulator, a narrative flow, and a high-impact plan in one place.
          </p>
          <div className="hero-quick-summary">
            <div>
              <span>Model confidence</span>
              <strong>{Math.round((twinSource.metadata?.confidence || 0) * 100)}%</strong>
            </div>
            <div>
              <span>Data points</span>
              <strong>{twinSource.metadata?.dataPoints || 0}</strong>
            </div>
            <div>
              <span>Runway</span>
              <strong>{runway} mo</strong>
            </div>
            <div>
              <span>Survival</span>
              <strong>{survivalRate}%</strong>
            </div>
          </div>
        </div>

        <div className="hero-panel">
          <div className="hero-score-card">
            <div className="hero-score-copy">
              <span>Financial health score</span>
              <strong>{score}/100</strong>
            </div>
            <ScoreRing score={score} />
            <div className="hero-score-meta">
              <div>
                <span>Runway</span>
                <strong>{runway} months</strong>
              </div>
              <div>
                <span>Savings discipline</span>
                <strong>{discipline}%</strong>
              </div>
              <div>
                <span>Impulse control</span>
                <strong>{impulseControl}%</strong>
              </div>
            </div>
          </div>

          <div className={`hero-scenario-summary hero-scenario-summary--${scenarioSummary.tone}`}>
            <div className="scenario-summary-copy">
              <span>Scenario range</span>
              <h2>{scenarioSummary.headline}</h2>
              <p>{scenarioSummary.description}</p>
            </div>
            <div className="scenario-metrics">
              <div>
                <strong>{future.pessimistic?.toFixed(1) ?? "-"} mo</strong>
                <span>Downside</span>
              </div>
              <div>
                <strong>{future.median?.toFixed(1) ?? "-"} mo</strong>
                <span>Median</span>
              </div>
              <div>
                <strong>{future.optimistic?.toFixed(1) ?? "-"} mo</strong>
                <span>Upside</span>
              </div>
            </div>
          </div>

          <div className="legacy-summary-card">
            <div>
              <span>BAST summary</span>
              <strong>{identityBand}</strong>
            </div>
            <div>
              <span>Trend</span>
              <strong>{trend}</strong>
            </div>
            <div>
              <span>Confidence intervals</span>
              <strong>{Math.round((twinSource.metadata?.confidence || 0) * 100)}%</strong>
            </div>
          </div>
        </div>
      </header>

      <div className="dashboard-grid">
        <div className="dashboard-main">
          <section className="dashboard-section summary-panel">
            <div className="section-heading">
              <h2>From simulation to action</h2>
              <p>
                The digital twin now becomes a landing page that surfaces the most important metrics, risks, and behavior levers together.
              </p>
            </div>
            <div className="summary-metrics-grid">
              <div className="metric-card">
                <span>Income</span>
                <strong>₹{income.toLocaleString()}</strong>
              </div>
              <div className="metric-card">
                <span>Expenses</span>
                <strong>₹{expenses.toLocaleString()}</strong>
              </div>
              <div className="metric-card">
                <span>Savings</span>
                <strong>₹{savings.toLocaleString()}</strong>
              </div>
              <div className="metric-card">
                <span>Savings rate</span>
                <strong>{savingsRate}%</strong>
              </div>
            </div>
          </section>

          <section className="dashboard-section narrative-panel">
            <EnhancedInsightNarrative assessmentResult={assessment} assessment={assessment} />
          </section>

          <section className="dashboard-section simulator-panel">
            <div className="section-heading">
              <h2>Interactive decision simulator</h2>
              <p>Test today’s choices and see how they affect your runway, risk, and future stability.</p>
            </div>
            <DecisionSimulator
              id="twin-decision-simulator"
              profile={assessment?.profile}
              behaviour={assessment?.behaviour}
              assessment={assessment}
            />
          </section>
        </div>

        <aside className="dashboard-sidebar">
          <div className="dashboard-card">
            <TraitMatrixVisualizer result={assessment} assessment={assessment} />
          </div>
          <div className="dashboard-card">
            <EmotionalTriggersCard triggers={assessment?.emotionalTriggers || {}} />
          </div>
          <div className="dashboard-card">
            <WeeklyMissionCard
              result={assessment}
              assessment={assessment}
              onAssessmentUpdate={() => undefined}
            />
          </div>
          <div className="dashboard-card badge-panel">
            <BadgeDisplay compact />
          </div>
        </aside>
      </div>

      <section className="dashboard-cta-panel">
        <div>
          <h2>Launch the plan</h2>
          <p>
            Keep your digital twin current by updating your assessment and using this page as the single launchpad for your next move.
          </p>
        </div>
        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.location.href = "/assessment";
            }
          }}
        >
          Update assessment
        </button>
      </section>
    </main>
  );
}
