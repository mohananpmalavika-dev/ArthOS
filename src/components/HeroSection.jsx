import React from "react";
import { ArrowRight, Brain, BarChart3, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { componentMaximumsV2 } from "../lib/scoring-v2.js";
import { normalizeScore } from "../lib/scoring-v2";
import { HERO_STATS, HERO_ACTIONS } from "../lib/copy.ts";
import ScoreRing from "./ScoreRing.jsx";

function buildLiveInsightCards(result = {}, assessment = {}) {
  const safeResult = result || {};
  const safeAssessment = assessment || {};
  const lowestComponent = safeResult.componentRows?.[0];
  const stressPattern = safeAssessment.behaviour?.spendWhenStressed;
  const impulsePattern = safeAssessment.behaviour?.regretImpulseFreq;
  const planState = safeAssessment.awareness?.hasFinancialPlan;
  const focusLabel = lowestComponent?.label ?? "Behaviour";

  return [
    {
      icon: Brain,
      title: "Behavior Pattern",
      copy: `${safeResult.personalityType ?? "Current"} profile detected from your active responses.`,
      time: "Live now",
      tone: "purple"
    },
    {
      icon: BarChart3,
      title: "Spending Signal",
      copy: stressPattern
        ? `Stress-spend response is currently marked ${stressPattern.replaceAll("_", " ")}.`
        : "Answer emotion prompts to reveal stress-spend patterns.",
      time: "Live now",
      tone: "cyan"
    },
    {
      icon: ShieldCheck,
      title: "Risk Exposure",
      copy: `${safeResult.futureRiskLabel ?? "Risk"} based on your current stability inputs.`,
      time: "Live now",
      tone: "purple"
    },
    {
      icon: Target,
      title: "Focus Opportunity",
      copy: `${focusLabel} is the next area to strengthen as your answers update.`,
      time: planState || impulsePattern ? "Live now" : "Needs input",
      tone: "cyan"
    }
  ];
}

export default function HeroSection({ assessment, result }) {
  const navigate = useNavigate();
  if (!result || !result.healthScore) {
    return null;
  }

  const scorePreview = Math.max(0, Math.min(100, normalizeScore(result.healthScore ?? 0)));
  const scoreLabel = result.categoryBand?.label;
  const liveInsights = buildLiveInsightCards(result, assessment);
  const metricRows = [
    {
      label: "Financial Health Behavior Score",
      value: scorePreview,
      width: `${scorePreview}%`
    },
    {
      label: "Behavior Control",
      value: Math.round(result.behaviourScore ?? 0),
      width: `${Math.min(100, ((result.behaviourScore ?? 0) / componentMaximumsV2.behaviour) * 100)}%`
    },
    {
      label: "Awareness Signal",
      value: Math.round(result.awarenessScore ?? 0),
      width: `${Math.min(100, ((result.awarenessScore ?? 0) / componentMaximumsV2.awareness) * 100)}%`
    }
  ];
  const perceivedRunway = Number(result.blindSpotPerceived);
  const actualRunway = Number(result.blindSpotActual);
  const blindSpot = Number(result.blindSpotGap);
  const hasBlindSpotData = !isNaN(perceivedRunway) && !isNaN(actualRunway) && !isNaN(blindSpot);

  return (
    <section className="model-screen" id="home">
      <div className="model-hero-grid">
        <div className="model-hero-copy">
          <h1>
            <span>Decode the financial blindspots</span>
            your money leaves behind.
          </h1>
          <p>
            ARTH.OS turns behavior, awareness and stability into a private intelligence layer for
            clearer financial decisions.
          </p>
          <div className="hero-stat-card">
            {HERO_STATS.map(item => (
              <div className="metric" key={item.label}>
                <span>{item.value}</span>
                <label>{item.label}</label>
              </div>
            ))}
          </div>
          <div className="model-hero-actions">
            {HERO_ACTIONS.map(action => (
              <button
                key={action.label}
                type="button"
                className={
                  action.href === "/assessment" ? "model-primary-cta" : "model-secondary-cta"
                }
                onClick={() => {
                  if (action.href) {
                    navigate(action.href);
                  }
                }}
              >
                {action.label}
                <ArrowRight size={18} />
              </button>
            ))}
          </div>
        </div>

        <article className="model-engine-panel" id="intelligence">
          <div className="model-panel-title">
            <span className="model-orb" />
            <h2>ARTH.OS Intelligence Engine</h2>
          </div>
          <div className="model-engine-content">
            <div className="model-score-block">
              <span>Live Score</span>
              <ScoreRing score={scorePreview} />
              <p>{scoreLabel}</p>
              <small>Updated just now</small>
            </div>

            {hasBlindSpotData && (
              <section className="awareness-card">
                <h3>The Visibility Blindspot</h3>
                <div className="gap-grid">
                  <div>
                    <h1>{perceivedRunway}</h1>
                    <label>You Believe</label>
                  </div>
                  <div>
                    <h1>{actualRunway}</h1>
                    <label>Reality</label>
                  </div>
                  <div>
                    <h1>{blindSpot}</h1>
                    <label>Gap</label>
                  </div>
                </div>
                <p className="awareness-copy">
                  You overestimate your financial runway by {blindSpot} months.
                </p>
              </section>
            )}

            <div className="model-metric-stack">
              {metricRows.map(row => (
                <div className="model-metric-row" key={row.label}>
                  <div>
                    <span>{row.label}</span>
                    <strong>{row.value}</strong>
                  </div>
                  <div className="model-metric-track" aria-hidden="true">
                    <span style={{ width: row.width }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="model-engine-footer">
            <span>Scoring based on 12 behavioral dimensions</span>
            <button
              type="button"
              onClick={() => {
                navigate("/assessment");
              }}
            >
              View full breakdown
              <ArrowRight size={17} />
            </button>
          </div>
        </article>

        <aside className="model-insights-rail">
          <div className="model-insights-header">
            <h2>Live Insights</h2>
            <div>
              <button
                type="button"
                className="model-view-insights"
                onClick={() => {
                  navigate("/reports");
                }}
              >
                View all
              </button>
            </div>
          </div>

          <div className="model-insight-list">
            {liveInsights.map((it, idx) => {
              const Icon = it.icon;
              return (
                <div className={`model-insight-card tone-${it.tone}`} key={idx}>
                  <div className="insight-icon">
                    <Icon size={18} />
                  </div>
                  <div className="insight-content">
                    <strong>{it.title}</strong>
                    <p>{it.copy}</p>
                    <small>{it.time}</small>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </section>
  );
}
