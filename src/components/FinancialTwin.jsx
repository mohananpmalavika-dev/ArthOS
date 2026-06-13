// src/components/FinancialTwin.jsx
// L11 Financial Digital Twin — Full Simulation Environment UI
// Displays probabilistic twin state, Monte Carlo confidence intervals,
// all lifecycle scenarios, home purchase, career change, life events,
// cashflow breakdown, and stress test results.

import React, { useState } from "react";
import {
  Award,
  DollarSign,
  TrendingDown,
  ArrowUp,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  BarChart3,
  PieChart,
  TrendingUp,
  Home,
  Briefcase,
  Baby,
  Activity,
  Info,
  ShieldAlert
} from "lucide-react";

// Import personality archetypes from centralized constants
import { ARCHETYPES, PERSONALITY_NAMES } from "../lib/constants/personality.js";

// PERSONALITY TYPE NAMING STANDARDIZATION
// ────────────────────────────────────────────────────────────────────────────
// Archetype keys match getPersonalityType() output: Title Case (e.g., "Risk Taker")
// Color values map to CSS classes: lowercase with underscores (e.g., "risk_taker")
// This ensures consistent naming across scoring engine → UI component → stylesheet
//
// Naming Convention:
//   getPersonalityType() returns → "Builder", "Survivor", "Optimizer", "Dreamer", "Risk Taker"
//   ARCHETYPES keys             → "Builder", "Survivor", "Optimizer", "Dreamer", "Risk Taker" ✓
//   CSS class color values      → "builder", "survivor", "optimizer", "dreamer", "risk_taker" ✓
// ────────────────────────────────────────────────────────────────────────────

function formatRupees(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "₹0";
  }
  if (Math.abs(value) >= 100000) {
    return "₹" + (value / 100000).toFixed(1) + "L";
  }
  if (Math.abs(value) >= 1000) {
    return "₹" + (value / 1000).toFixed(0) + "K";
  }
  return "₹" + Math.round(value);
}

function formatMonths(m) {
  if (typeof m !== "number" || Number.isNaN(m)) {
    return "0";
  }
  if (m >= 60) {
    return "60+";
  }
  return m.toFixed(1);
}

function severityColor(severity) {
  switch (severity) {
    case "critical":
      return "var(--red)";
    case "high":
      return "var(--orange)";
    case "moderate":
      return "var(--yellow)";
    case "low":
      return "var(--green-500)";
    default:
      return "var(--gray-500)";
  }
}

function impactBadgeClass(severity) {
  switch (severity) {
    case "critical":
      return "risk-alert-risk";
    case "high":
      return "risk-alert-risk";
    case "moderate":
      return "risk-alert-info";
    case "low":
      return "risk-alert-opportunity";
    default:
      return "";
  }
}

// ── Confidence Interval Bar ──
function ConfidenceRange({ p5, p25, p50, p75, p95, label, unit, format }) {
  const fmt = format || (v => (typeof v === "number" ? Math.round(v) : v));
  const p50num = p50 || 0;
  const p5num = p5 || 0;
  const p95num = p95 || 0;
  const range = Math.max(p95num - p5num, 1);
  const p25pos = ((p25 - p5num) / range) * 100;
  const p75pos = ((p75 - p5num) / range) * 100;
  const p50pos = ((p50num - p5num) / range) * 100;

  return (
    <div className="confidence-range" style={{ marginBottom: 8 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 11,
          color: "var(--muted)",
          marginBottom: 4
        }}
      >
        <span>{label}</span>
        <span>{unit ? `${fmt(p50num)} ${unit}` : fmt(p50num)}</span>
      </div>
      <div
        style={{
          position: "relative",
          height: 12,
          background: "var(--white-08)",
          borderRadius: 6,
          overflow: "visible"
        }}
      >
        <div
          style={{
            position: "absolute",
            left: `${Math.max(0, p25pos)}%`,
            width: `${Math.min(100, p75pos) - Math.max(0, p25pos)}%`,
            height: "100%",
            background: "var(--purple-30)",
            borderRadius: 6
          }}
        />
        <div
          style={{
            position: "absolute",
            left: `${p50pos}%`,
            top: -3,
            width: 4,
            height: 18,
            background: "var(--purple-2)",
            borderRadius: 2,
            transform: "translateX(-50%)"
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 10,
          color: "var(--muted)",
          marginTop: 2
        }}
      >
        <span>p5: {fmt(p5num)}</span>
        <span>p25: {fmt(p25)}</span>
        <span>p75: {fmt(p75)}</span>
        <span>p95: {fmt(p95num)}</span>
      </div>
    </div>
  );
}

// ── Scenario Card ──
function ScenarioCard({ scenario, defaultExpanded }) {
  const [expanded, setExpanded] = useState(defaultExpanded || false);
  const isPositive = scenario.delta > 0 || scenario.improvement > 0;
  const isRisk = scenario.survivalMonths < 6 && scenario.survivalMonths !== undefined;
  const cardClass = isRisk ? "negative" : isPositive ? "positive" : "neutral";
  const icon = isRisk ? AlertTriangle : isPositive ? ArrowUp : Info;
  const IconComponent = icon;

  return (
    <div
      className={`scenario-card ${cardClass}`}
      style={{
        cursor: "pointer",
        padding: "12px",
        borderRadius: "12px",
        border: "1px solid var(--white-10)",
        background: isRisk ? "var(--red-08)" : isPositive ? "var(--green-08)" : "var(--white-03)",
        transition: "all 0.2s ease"
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div
        style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
          <IconComponent
            size={16}
            style={{
              flexShrink: 0,
              color: isRisk ? "var(--red)" : isPositive ? "var(--green-500)" : "var(--muted)"
            }}
          />
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-2)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}
          >
            {scenario.name}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <strong
            style={{
              fontSize: 16,
              color: isRisk ? "var(--red)" : isPositive ? "var(--green-500)" : "var(--muted)"
            }}
          >
            {isRisk
              ? `${scenario.survivalMonths || 0}mo`
              : `+${(scenario.improvement || 0).toFixed(1)}mo`}
          </strong>
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </div>

      {expanded && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: "1px solid var(--white-08)",
            fontSize: 12,
            color: "var(--muted)"
          }}
        >
          {scenario.currentRunway !== undefined && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span>Current runway</span>
              <strong style={{ color: "var(--text-2)" }}>{scenario.currentRunway} mo</strong>
            </div>
          )}
          {scenario.projectedRunway !== undefined && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span>Projected runway</span>
              <strong style={{ color: "var(--text-2)" }}>{scenario.projectedRunway} mo</strong>
            </div>
          )}
          {scenario.newMonthlyIncome !== undefined && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span>New income</span>
              <strong style={{ color: "var(--text-2)" }}>
                {formatRupees(scenario.newMonthlyIncome)}/mo
              </strong>
            </div>
          )}
          {scenario.newMonthlyNet !== undefined && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span>New monthly net</span>
              <strong style={{ color: "var(--text-2)" }}>
                {formatRupees(scenario.newMonthlyNet)}/mo
              </strong>
            </div>
          )}
          {scenario.newMonthlyExpenses !== undefined && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span>New expenses</span>
              <strong style={{ color: "var(--text-2)" }}>
                {formatRupees(scenario.newMonthlyExpenses)}/mo
              </strong>
            </div>
          )}
          {scenario.crisisExpenses !== undefined && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span>Crisis expenses</span>
              <strong style={{ color: "var(--text-2)" }}>
                {formatRupees(scenario.crisisExpenses)}/mo
              </strong>
            </div>
          )}
          {scenario.crisisNet !== undefined && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span>Crisis net cashflow</span>
              <strong
                style={{ color: scenario.crisisNet >= 0 ? "var(--green-500)" : "var(--red)" }}
              >
                {formatRupees(scenario.crisisNet)}/mo
              </strong>
            </div>
          )}
          {scenario.survivalMonths !== undefined && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span>Survival time</span>
              <strong style={{ color: "var(--text-2)" }}>
                {scenario.survivalMonths} mo (
                {scenario.survivalDays || Math.round(scenario.survivalMonths * 30)} days)
              </strong>
            </div>
          )}
          {scenario.severity !== undefined && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span>Severity</span>
              <strong style={{ color: severityColor(scenario.severity) }}>
                {scenario.severity}
              </strong>
            </div>
          )}
          {scenario.remainingDebtAfter12Mo !== undefined && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span>Debt after 12mo</span>
              <strong style={{ color: "var(--text-2)" }}>
                {formatRupees(scenario.remainingDebtAfter12Mo)}
              </strong>
            </div>
          )}
          {scenario.debtFreeMonths !== undefined && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span>Debt-free ETA</span>
              <strong style={{ color: "var(--text-2)" }}>{scenario.debtFreeMonths} mo</strong>
            </div>
          )}
          {scenario.interestSaved12Mo !== undefined && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span>Interest saved (12mo)</span>
              <strong style={{ color: "var(--green-500)" }}>
                {formatRupees(scenario.interestSaved12Mo)}
              </strong>
            </div>
          )}
          {scenario.payoff && (
            <div
              style={{
                marginTop: 6,
                padding: 8,
                borderRadius: 8,
                background: "var(--white-05)",
                fontSize: 12,
                color: "var(--muted)"
              }}
            >
              {scenario.payoff}
            </div>
          )}
          {scenario.recommendation && (
            <div
              style={{
                marginTop: 6,
                padding: 8,
                borderRadius: 8,
                background: isRisk ? "var(--red-10)" : "var(--green-10)",
                fontSize: 12,
                color: "var(--text-2)"
              }}
            >
              {scenario.recommendation}
            </div>
          )}
          {scenario.crisisExpenses === undefined &&
            scenario.projectedRunway === undefined &&
            scenario.improvement === undefined && (
              <div style={{ color: "var(--muted)" }}>No additional detail available</div>
            )}
        </div>
      )}
    </div>
  );
}

export default function FinancialTwin({
  personalityType,
  behaviourScore,
  awarenessScore,
  scenarios
}) {
  const [expandedSection, setExpandedSection] = useState("scenarios");
  const archetype = ARCHETYPES[personalityType] || ARCHETYPES.Survivor;
  const Icon = archetype.icon;
  const twinScenarios = scenarios || {};

  const behaviourNorm = Math.min((behaviourScore / 45) * 100, 100);
  const awarenessNorm = Math.min((awarenessScore / 30) * 100, 100);

  const isNewShape = twinScenarios.baseline !== undefined;
  const legacySurvivalNow = twinScenarios.survivalNow;
  const baseRunway = isNewShape
    ? twinScenarios.baseRunway
    : legacySurvivalNow !== undefined
      ? legacySurvivalNow
      : 0;

  // Colour for runway severity
  const runwayColor =
    baseRunway < 3
      ? "var(--red)"
      : baseRunway < 6
        ? "var(--orange)"
        : baseRunway < 12
          ? "var(--yellow)"
          : "var(--green-500)";
  const runwayBorder =
    baseRunway < 3
      ? "var(--red-15)"
      : baseRunway < 6
        ? "var(--orange-15)"
        : baseRunway < 12
          ? "var(--yellow-15)"
          : "var(--green-15)";
  const runwayBgStart =
    baseRunway < 3
      ? "var(--red-08)"
      : baseRunway < 6
        ? "var(--orange-08)"
        : baseRunway < 12
          ? "var(--yellow-08)"
          : "var(--green-08)";

  return (
    <section
      className="result-card financial-twin-card"
      style={{ borderRadius: "20px", padding: "20px" }}
    >
      <div className="result-heading" style={{ marginBottom: 16 }}>
        <Award size={19} />
        <h2>Your Financial Twin</h2>
      </div>

      {/* ── Archetype Display ── */}
      <div
        className="twin-archetype"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: 14,
          borderRadius: 12,
          background: "var(--white-04)",
          border: "1px solid var(--white-10)",
          marginBottom: 16
        }}
      >
        <div className={`twin-icon-wrapper ${archetype.color}`} style={{ width: 56, height: 56 }}>
          <Icon size={36} />
        </div>
        <div className="twin-info" style={{ flex: 1, minWidth: 0 }}>
          <h3
            className="twin-title"
            style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: "var(--text)" }}
          >
            {personalityType?.replace(/_/g, " ")}
          </h3>
          <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.4, margin: 0 }}>
            {archetype.description}
          </p>
        </div>
      </div>

      {/* ── Core Traits ── */}
      <div style={{ marginBottom: 14 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--muted)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            display: "block",
            marginBottom: 8
          }}
        >
          Core Traits
        </span>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {archetype.traits.map(trait => (
            <span key={trait} className="trait-badge" style={{ padding: "4px 10px", fontSize: 11 }}>
              {trait}
            </span>
          ))}
        </div>
      </div>

      {/* ── Dimensions ── */}
      <div
        className="twin-dimensions"
        style={{
          padding: 12,
          borderRadius: 10,
          background: "var(--white-03)",
          border: "1px solid var(--white-10)",
          marginBottom: 14
        }}
      >
        <div className="dimension" style={{ marginBottom: 10 }}>
          <div
            className="dimension-header"
            style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}
          >
            <span className="dimension-name" style={{ fontSize: 11, color: "var(--muted)" }}>
              Behaviour Control
            </span>
            <span
              className="dimension-score"
              style={{ fontSize: 12, color: "var(--cyan)", fontWeight: 700 }}
            >
              {Math.round(behaviourNorm)}%
            </span>
          </div>
          <div
            className="dimension-bar"
            style={{
              height: 5,
              background: "var(--white-10)",
              borderRadius: 999,
              overflow: "hidden"
            }}
          >
            <div
              className="dimension-fill"
              style={{
                height: "100%",
                width: `${behaviourNorm}%`,
                background: "linear-gradient(90deg, var(--cyan), var(--purple-2))",
                borderRadius: 999,
                transition: "width 300ms ease"
              }}
            />
          </div>
        </div>
        <div className="dimension">
          <div
            className="dimension-header"
            style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}
          >
            <span className="dimension-name" style={{ fontSize: 11, color: "var(--muted)" }}>
              Financial Awareness
            </span>
            <span
              className="dimension-score"
              style={{ fontSize: 12, color: "var(--cyan)", fontWeight: 700 }}
            >
              {Math.round(awarenessNorm)}%
            </span>
          </div>
          <div
            className="dimension-bar"
            style={{
              height: 5,
              background: "var(--white-10)",
              borderRadius: 999,
              overflow: "hidden"
            }}
          >
            <div
              className="dimension-fill"
              style={{
                height: "100%",
                width: `${awarenessNorm}%`,
                background: "linear-gradient(90deg, var(--cyan), var(--purple-2))",
                borderRadius: 999,
                transition: "width 300ms ease"
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Archetype Intro ── */}
      <div
        style={{
          padding: "10px 12px",
          borderRadius: 8,
          background: "var(--purple-08)",
          border: "1px solid var(--purple-20)",
          fontSize: 12,
          lineHeight: 1.5,
          color: "var(--muted)",
          marginBottom: 14
        }}
      >
        Based on your behavior patterns, you align most closely with{" "}
        <strong style={{ color: "var(--text-2)" }}>
          The {personalityType?.replace(/_/g, " ")}
        </strong>{" "}
        archetype.
      </div>

      {/* ── Strength / Challenge ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 8,
            borderLeft: "3px solid var(--green-500)",
            background: "var(--green-08)"
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--muted)",
              display: "block",
              marginBottom: 4
            }}
          >
            Strength
          </span>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: 0, lineHeight: 1.4 }}>
            {archetype.strength}
          </p>
        </div>
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 8,
            borderLeft: "3px solid var(--orange)",
            background: "var(--orange-08)"
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--muted)",
              display: "block",
              marginBottom: 4
            }}
          >
            Area to Grow
          </span>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: 0, lineHeight: 1.4 }}>
            {archetype.challenge}
          </p>
        </div>
      </div>

      {/* ── Monte Carlo Scenarios ── */}
      {(isNewShape || legacySurvivalNow !== undefined) && (
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 12px",
              borderRadius: 8,
              background: "var(--purple-08)",
              border: "1px solid var(--purple-20)",
              cursor: "pointer",
              marginBottom: 12
            }}
            onClick={() => setExpandedSection(expandedSection === "scenarios" ? "" : "scenarios")}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <BarChart3 size={16} style={{ color: "var(--purple-2)" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)" }}>
                What-If Scenarios
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>
                {twinScenarios.scenarioCount || 0} scenarios
              </span>
              {expandedSection === "scenarios" ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
            </div>
          </div>

          {expandedSection === "scenarios" && (
            <div style={{ display: "grid", gap: 12 }}>
              {/* ── Baseline Runway ── */}
              <div
                className="scenario-card"
                style={{
                  padding: 14,
                  borderRadius: 12,
                  border: `1px solid ${runwayBorder}`,
                  background: `linear-gradient(135deg, ${runwayBgStart}, transparent)`
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: runwayBgStart,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: runwayColor
                    }}
                  >
                    <DollarSign size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "var(--muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em"
                      }}
                    >
                      Current Runway
                    </div>
                    <strong style={{ fontSize: 22, fontWeight: 700, color: runwayColor }}>
                      {formatMonths(baseRunway)} mo
                    </strong>
                  </div>
                </div>

                {/* Baseline detail */}
                {isNewShape && twinScenarios.baseline && (
                  <div style={{ padding: "8px 0" }}>
                    {twinScenarios.baseline.monthlyNet !== undefined && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 12,
                          color: "var(--muted)",
                          marginBottom: 4
                        }}
                      >
                        <span>Monthly net cashflow</span>
                        <strong style={{ color: "var(--text-2)" }}>
                          {formatRupees(twinScenarios.baseline.monthlyNet)}
                        </strong>
                      </div>
                    )}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 12,
                        color: "var(--muted)",
                        marginBottom: 4
                      }}
                    >
                      <span>Total savings</span>
                      <strong style={{ color: "var(--text-2)" }}>
                        {formatRupees(
                          twinScenarios.totalSavings || twinScenarios.baseline.currentSavings
                        )}
                      </strong>
                    </div>
                    {twinScenarios.baseline.twelveMonth && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 12,
                          color: "var(--muted)",
                          marginBottom: 4
                        }}
                      >
                        <span>Projected (12mo, p50)</span>
                        <strong style={{ color: "var(--text-2)" }}>
                          {formatRupees(twinScenarios.baseline.twelveMonth.p50)}
                        </strong>
                      </div>
                    )}
                  </div>
                )}

                {/* Confidence intervals */}
                {isNewShape && twinScenarios.baseline?.confidence && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: 10,
                      borderRadius: 8,
                      background: "var(--black-20)"
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "var(--muted)",
                        textTransform: "uppercase",
                        marginBottom: 8
                      }}
                    >
                      Monte Carlo Confidence Intervals
                    </div>
                    <ConfidenceRange
                      p5={twinScenarios.baseline.confidence[5]?.p5}
                      p25={twinScenarios.baseline.confidence[5]?.p25}
                      p50={twinScenarios.baseline.confidence[5]?.p50}
                      p75={twinScenarios.baseline.confidence[5]?.p75}
                      p95={twinScenarios.baseline.confidence[5]?.p95}
                      label="6 months"
                      unit="₹"
                      format={v => formatRupees(v)}
                    />
                    <ConfidenceRange
                      p5={twinScenarios.baseline.confidence[11]?.p5}
                      p25={twinScenarios.baseline.confidence[11]?.p25}
                      p50={twinScenarios.baseline.confidence[11]?.p50}
                      p75={twinScenarios.baseline.confidence[11]?.p75}
                      p95={twinScenarios.baseline.confidence[11]?.p95}
                      label="12 months"
                      unit="₹"
                      format={v => formatRupees(v)}
                    />
                    <ConfidenceRange
                      p5={twinScenarios.baseline.confidence[23]?.p5}
                      p25={twinScenarios.baseline.confidence[23]?.p25}
                      p50={twinScenarios.baseline.confidence[23]?.p50}
                      p75={twinScenarios.baseline.confidence[23]?.p75}
                      p95={twinScenarios.baseline.confidence[23]?.p95}
                      label="24 months"
                      unit="₹"
                      format={v => formatRupees(v)}
                    />
                  </div>
                )}

                {isNewShape && twinScenarios.baseline?.recommendation && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: 8,
                      borderRadius: 8,
                      background: "var(--white-04)",
                      fontSize: 12,
                      color: "var(--muted)",
                      lineHeight: 1.4
                    }}
                  >
                    {twinScenarios.baseline.recommendation}
                  </div>
                )}
              </div>

              {/* ── Opportunities Section ── */}
              {twinScenarios.positiveScenarios && twinScenarios.positiveScenarios.length > 0 && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <ArrowUp size={14} style={{ color: "var(--green-500)" }} />
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--green-500)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em"
                      }}
                    >
                      Opportunities ({twinScenarios.positiveScenarios.length})
                    </span>
                  </div>
                  <div style={{ display: "grid", gap: 8 }}>
                    {twinScenarios.positiveScenarios.map((s, i) => (
                      <ScenarioCard key={`pos-${i}`} scenario={s} />
                    ))}
                  </div>
                </div>
              )}

              {/* ── Risk Section ── */}
              {twinScenarios.riskScenarios && twinScenarios.riskScenarios.length > 0 && (
                <div style={{ marginTop: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <AlertTriangle size={14} style={{ color: "var(--red)" }} />
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--red)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em"
                      }}
                    >
                      Risks ({twinScenarios.riskScenarios.length})
                    </span>
                  </div>
                  <div style={{ display: "grid", gap: 8 }}>
                    {twinScenarios.riskScenarios.map((s, i) => (
                      <ScenarioCard key={`risk-${i}`} scenario={s} />
                    ))}
                  </div>
                </div>
              )}

              {/* ── All Scenarios (if more not shown above) ── */}
              {twinScenarios.allScenarios &&
                twinScenarios.allScenarios.length >
                  (twinScenarios.positiveScenarios?.length || 0) +
                    (twinScenarios.riskScenarios?.length || 0) && (
                  <details style={{ marginTop: 4 }}>
                    <summary
                      style={{
                        cursor: "pointer",
                        fontSize: 12,
                        color: "var(--muted)",
                        padding: 8,
                        borderRadius: 8,
                        background: "var(--white-03)"
                      }}
                    >
                      Show all {twinScenarios.allScenarios.length} scenarios
                    </summary>
                    <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                      {twinScenarios.allScenarios.map((s, i) => (
                        <ScenarioCard key={`all-${i}`} scenario={s} />
                      ))}
                    </div>
                  </details>
                )}

              {/* ── Home Purchase Analysis ── */}
              {isNewShape && twinScenarios.homePurchase && (
                <div
                  style={{
                    padding: 14,
                    borderRadius: 12,
                    border: "1px solid var(--purple-30)",
                    background: "var(--purple-08)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <Home size={16} style={{ color: "var(--blue-300)" }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)" }}>
                      Home Purchase Analysis
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    <div
                      style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}
                    >
                      <span>Disposable income post-EMI</span>
                      <strong
                        style={{
                          color:
                            twinScenarios.homePurchase.disposableIncome > 0
                              ? "var(--green-500)"
                              : "var(--red)"
                        }}
                      >
                        {formatRupees(twinScenarios.homePurchase.disposableIncome)}/mo
                      </strong>
                    </div>
                    <div
                      style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}
                    >
                      <span>Debt-to-income ratio</span>
                      <strong style={{ color: "var(--text-2)" }}>
                        {twinScenarios.homePurchase.debtToIncome}%
                      </strong>
                    </div>
                    <div
                      style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}
                    >
                      <span>Affordable</span>
                      <strong
                        style={{
                          color: twinScenarios.homePurchase.affordability
                            ? "var(--green-500)"
                            : "var(--red)"
                        }}
                      >
                        {twinScenarios.homePurchase.affordability ? "Yes" : "No"}
                      </strong>
                    </div>
                    {twinScenarios.homePurchase.recommendation && (
                      <div
                        style={{
                          marginTop: 8,
                          padding: 8,
                          borderRadius: 8,
                          background: "var(--black-20)",
                          lineHeight: 1.4
                        }}
                      >
                        {twinScenarios.homePurchase.recommendation}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Career Change ── */}
              {isNewShape && twinScenarios.careerChange && (
                <div
                  style={{
                    padding: 14,
                    borderRadius: 12,
                    border: "1px solid var(--amber-30)",
                    background: "var(--amber-08)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <Briefcase size={16} style={{ color: "var(--amber)" }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)" }}>
                      Career Change Projection
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    <div
                      style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}
                    >
                      <span>Income delta</span>
                      <strong
                        style={{
                          color:
                            twinScenarios.careerChange.incomeDelta >= 0
                              ? "var(--green-500)"
                              : "var(--red)"
                        }}
                      >
                        {formatRupees(twinScenarios.careerChange.incomeDelta)}/mo
                      </strong>
                    </div>
                    <div
                      style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}
                    >
                      <span>New monthly net</span>
                      <strong style={{ color: "var(--text-2)" }}>
                        {formatRupees(twinScenarios.careerChange.newMonthlyNet)}/mo
                      </strong>
                    </div>
                    <div
                      style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}
                    >
                      <span>Projected runway</span>
                      <strong style={{ color: "var(--text-2)" }}>
                        {twinScenarios.careerChange.projectedRunway} mo
                      </strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Direction</span>
                      <strong
                        style={{
                          color:
                            twinScenarios.careerChange.direction === "improvement"
                              ? "var(--green-500)"
                              : twinScenarios.careerChange.direction === "decline"
                                ? "var(--red)"
                                : "var(--muted)"
                        }}
                      >
                        {twinScenarios.careerChange.direction}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Cashflow Breakdown ── */}
              {isNewShape && twinScenarios.cashflowBreakdown && (
                <div
                  style={{
                    padding: 14,
                    borderRadius: 12,
                    border: "1px solid var(--green-30)",
                    background: "var(--green-06)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <PieChart size={16} style={{ color: "var(--green)" }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)" }}>
                      Cashflow Breakdown
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    <div
                      style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}
                    >
                      <span>Monthly income</span>
                      <strong style={{ color: "var(--text-2)" }}>
                        {formatRupees(twinScenarios.cashflowBreakdown.income)}
                      </strong>
                    </div>
                    <div
                      style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}
                    >
                      <span>Essential expenses</span>
                      <strong style={{ color: "var(--text-2)" }}>
                        {formatRupees(twinScenarios.cashflowBreakdown.essentials)}
                      </strong>
                    </div>
                    <div
                      style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}
                    >
                      <span>Discretionary spending</span>
                      <strong style={{ color: "var(--text-2)" }}>
                        {formatRupees(twinScenarios.cashflowBreakdown.discretionary)}
                      </strong>
                    </div>
                    <div
                      style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}
                    >
                      <span>Debt repayment</span>
                      <strong style={{ color: "var(--text-2)" }}>
                        {formatRupees(twinScenarios.cashflowBreakdown.debtRepayment)}
                      </strong>
                    </div>
                    <div
                      style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}
                    >
                      <span>Savings opportunity</span>
                      <strong style={{ color: "var(--green-500)" }}>
                        {formatRupees(twinScenarios.cashflowBreakdown.savingsOpportunity)}
                      </strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Savings rate</span>
                      <strong style={{ color: "var(--green-500)" }}>
                        {twinScenarios.cashflowBreakdown.savingsPercentage}%
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Probabilistic Twin State ── */}
              {isNewShape && twinScenarios.probabilisticState && (
                <div style={{ marginTop: 4 }}>
                  <details>
                    <summary
                      style={{
                        cursor: "pointer",
                        fontSize: 12,
                        color: "var(--muted)",
                        padding: 8,
                        borderRadius: 8,
                        background: "var(--white-03)",
                        display: "flex",
                        alignItems: "center",
                        gap: 6
                      }}
                    >
                      <Activity size={12} />
                      Probabilistic Twin State
                    </summary>
                    <div
                      style={{
                        marginTop: 8,
                        padding: 10,
                        borderRadius: 8,
                        background: "var(--black-20)",
                        fontSize: 12,
                        color: "var(--muted)"
                      }}
                    >
                      {twinScenarios.probabilisticState.monthlyIncome && (
                        <ConfidenceRange
                          p5={twinScenarios.probabilisticState.monthlyIncome.lower}
                          p25={
                            (twinScenarios.probabilisticState.monthlyIncome.lower +
                              twinScenarios.probabilisticState.monthlyIncome.median) /
                            2
                          }
                          p50={twinScenarios.probabilisticState.monthlyIncome.median}
                          p75={
                            (twinScenarios.probabilisticState.monthlyIncome.median +
                              twinScenarios.probabilisticState.monthlyIncome.upper) /
                            2
                          }
                          p95={twinScenarios.probabilisticState.monthlyIncome.upper}
                          label="Income"
                          unit="₹"
                          format={v => formatRupees(v)}
                        />
                      )}
                      {twinScenarios.probabilisticState.netCashflow && (
                        <ConfidenceRange
                          p5={twinScenarios.probabilisticState.netCashflow.lower}
                          p25={
                            (twinScenarios.probabilisticState.netCashflow.lower +
                              twinScenarios.probabilisticState.netCashflow.median) /
                            2
                          }
                          p50={twinScenarios.probabilisticState.netCashflow.median}
                          p75={
                            (twinScenarios.probabilisticState.netCashflow.median +
                              twinScenarios.probabilisticState.netCashflow.upper) /
                            2
                          }
                          p95={twinScenarios.probabilisticState.netCashflow.upper}
                          label="Net Cashflow"
                          unit="₹"
                          format={v => formatRupees(v)}
                        />
                      )}
                      {twinScenarios.probabilisticState.savings && (
                        <ConfidenceRange
                          p5={twinScenarios.probabilisticState.savings.lower}
                          p25={
                            (twinScenarios.probabilisticState.savings.lower +
                              twinScenarios.probabilisticState.savings.median) /
                            2
                          }
                          p50={twinScenarios.probabilisticState.savings.median}
                          p75={
                            (twinScenarios.probabilisticState.savings.median +
                              twinScenarios.probabilisticState.savings.upper) /
                            2
                          }
                          p95={twinScenarios.probabilisticState.savings.upper}
                          label="Savings"
                          unit="₹"
                          format={v => formatRupees(v)}
                        />
                      )}
                    </div>
                  </details>
                </div>
              )}

              {/* ── Stress Test ── */}
              {isNewShape && twinScenarios.stressTest && (
                <div style={{ marginTop: 4 }}>
                  <details>
                    <summary
                      style={{
                        cursor: "pointer",
                        fontSize: 12,
                        color: "var(--muted)",
                        padding: 8,
                        borderRadius: 8,
                        background: "var(--red-08)",
                        border: "1px solid var(--red-20)",
                        display: "flex",
                        alignItems: "center",
                        gap: 6
                      }}
                    >
                      <ShieldAlert size={12} style={{ color: "var(--red)" }} />
                      <span style={{ color: "var(--red-15)" }}>
                        Stress Test: {twinScenarios.stressTest.severity}
                      </span>
                    </summary>
                    <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                      {/* 50% Income Loss */}
                      {twinScenarios.stressTest.incomeLoss50 && (
                        <div
                          style={{
                            padding: 10,
                            borderRadius: 8,
                            background: "var(--red-06)",
                            border: "1px solid var(--red-15)"
                          }}
                        >
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: "var(--red-15)",
                              marginBottom: 6
                            }}
                          >
                            50% Income Loss
                          </div>
                          <div style={{ fontSize: 12, color: "var(--muted)" }}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: 4
                              }}
                            >
                              <span>Survival time</span>
                              <strong style={{ color: "var(--text-2)" }}>
                                {twinScenarios.stressTest.incomeLoss50.survivalMonths} mo
                              </strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span>Severity</span>
                              <strong
                                style={{
                                  color: severityColor(
                                    twinScenarios.stressTest.incomeLoss50.severity
                                  )
                                }}
                              >
                                {twinScenarios.stressTest.incomeLoss50.severity}
                              </strong>
                            </div>
                          </div>
                        </div>
                      )}
                      {/* Full Job Loss */}
                      {twinScenarios.stressTest.jobLoss && (
                        <div
                          style={{
                            padding: 10,
                            borderRadius: 8,
                            background: "var(--red-06)",
                            border: "1px solid var(--red-15)"
                          }}
                        >
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: "var(--red-15)",
                              marginBottom: 6
                            }}
                          >
                            Full Job Loss
                          </div>
                          <div style={{ fontSize: 12, color: "var(--muted)" }}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: 4
                              }}
                            >
                              <span>Survival time</span>
                              <strong style={{ color: "var(--text-2)" }}>
                                {twinScenarios.stressTest.jobLoss.survivalMonths} mo
                              </strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span>Severity</span>
                              <strong
                                style={{
                                  color: severityColor(twinScenarios.stressTest.jobLoss.severity)
                                }}
                              >
                                {twinScenarios.stressTest.jobLoss.severity}
                              </strong>
                            </div>
                          </div>
                        </div>
                      )}
                      {/* Medical Emergency */}
                      {twinScenarios.stressTest.medicalEmergency && (
                        <div
                          style={{
                            padding: 10,
                            borderRadius: 8,
                            background: "var(--red-06)",
                            border: "1px solid var(--red-15)"
                          }}
                        >
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: "var(--red-15)",
                              marginBottom: 6
                            }}
                          >
                            Medical Emergency (
                            {formatRupees(twinScenarios.stressTest.medicalEmergency.cost)})
                          </div>
                          <div style={{ fontSize: 12, color: "var(--muted)" }}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: 4
                              }}
                            >
                              <span>Survival time</span>
                              <strong style={{ color: "var(--text-2)" }}>
                                {twinScenarios.stressTest.medicalEmergency.survivalMonths} mo
                              </strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span>Severity</span>
                              <strong
                                style={{
                                  color: severityColor(
                                    twinScenarios.stressTest.medicalEmergency.severity
                                  )
                                }}
                              >
                                {twinScenarios.stressTest.medicalEmergency.severity}
                              </strong>
                            </div>
                          </div>
                        </div>
                      )}
                      {/* Recommendation */}
                      <div
                        style={{
                          padding: 10,
                          borderRadius: 8,
                          background:
                            twinScenarios.stressTest.worstCaseSurvival < 6
                              ? "var(--red-10)"
                              : "var(--green-10)",
                          fontSize: 12,
                          color: "var(--text-2)",
                          lineHeight: 1.4
                        }}
                      >
                        <strong>Worst case:</strong> {twinScenarios.stressTest.worstCaseSurvival} mo
                        survival
                        <br />
                        {twinScenarios.stressTest.recommendation}
                      </div>
                    </div>
                  </details>
                </div>
              )}
            </div>
          )}

          {/* ── Monte Carlo Badge ── */}
          {isNewShape &&
            twinScenarios.baseline &&
            twinScenarios.baseline.monthlyNet !== undefined && (
              <div
                style={{
                  marginTop: 12,
                  padding: 10,
                  borderRadius: 8,
                  background: "var(--purple-10)",
                  fontSize: 11,
                  color: "var(--purple-30)",
                  textAlign: "center"
                }}
              >
                <strong>Monte Carlo</strong> — {twinScenarios.scenarioCount || 0} scenarios with
                probabilistic percentiles
              </div>
            )}
        </div>
      )}
    </section>
  );
}
