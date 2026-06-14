import React, { useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  MessageCircle,
  ChevronDown,
  Zap,
  Heart,
  Wallet,
  Target,
  Brain,
  ArrowRight
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";
import TrajectoryHeroVisual from "./TrajectoryHeroVisual.jsx";

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export default function StoryHome({ result, assessment, onCoachOpen }) {
  const [expandedReason, setExpandedReason] = useState(null);

  const currentScore = useMemo(
    () => clampScore((result?.healthScore ?? 0) / 10),
    [result]
  );

  const scoreChange = useMemo(() => {
    const prev = result?.previousHealthScore || currentScore;
    const change = Math.round((currentScore - prev) / 10);
    return { value: change, direction: change >= 0 ? "up" : "down" };
  }, [result, currentScore]);

  const emotionalNarrative = useMemo(() => {
    if (currentScore >= 80) return "You're in strong shape.";
    if (currentScore >= 60) return "You're recovering well.";
    if (currentScore >= 40) return "You have momentum to improve.";
    return "There's opportunity here.";
  }, [currentScore]);

  const realityCard = useMemo(() => {
    const runway = result?.survivalMonthsDisplay || "0";
    const risks = result?.riskProfile || {};
    const risks_list = risks?.drivers || [];
    const strengths = result?.strengths || [];

    const biggestRisk = risks_list?.[0]?.label || "Spending Pattern";
    const biggestStrength = strengths?.[0]?.label || "Consistent Income";

    return {
      health: currentScore,
      runway: runway,
      risk: biggestRisk,
      strength: biggestStrength
    };
  }, [result, currentScore]);

  const topReasons = useMemo(() => {
    const reasons = [];
    const biases = result?.biases || [];
    const beliefs = result?.moneyBeliefs || [];
    const riskDrivers = result?.riskProfile?.drivers || [];

    biases.slice(0, 1).forEach(bias => {
      reasons.push({
        id: `bias-${bias.name}`,
        label: bias.name || "Cognitive bias",
        detail: bias.description || "This pattern affects your decisions.",
        impact: Math.round((bias.severity || 0.5) * 20),
        icon: "brain"
      });
    });

    riskDrivers.slice(0, 2).forEach(driver => {
      reasons.push({
        id: `risk-${driver.label}`,
        label: driver.label || "Risk Factor",
        detail: driver.description || "This is impacting your score.",
        impact: Math.round((driver.severity || 0.5) * 20),
        icon: "alert"
      });
    });

    return reasons.slice(0, 3);
  }, [result]);

  const timelineData = useMemo(() => {
    const baseYear = new Date().getFullYear();
    const decline = [0, -3, -8, -12].map(delta => clampScore(currentScore + delta));
    const improve = [0, 6, 14, 24].map(delta => clampScore(currentScore + delta));

    return [
      { year: `${baseYear}`, current: decline[0], recommended: improve[0], label: "Now" },
      { year: `${baseYear + 1}`, current: decline[1], recommended: improve[1], label: "1Y" },
      { year: `${baseYear + 2}`, current: decline[2], recommended: improve[2], label: "2Y" },
      { year: `${baseYear + 3}`, current: decline[3], recommended: improve[3], label: "3Y" }
    ];
  }, [currentScore]);

  const actionCard = useMemo(() => {
    const recommendation = result?.topRecommendation || {};
    return {
      action: recommendation?.action || "Save ₹2,000",
      week: "THIS WEEK",
      impacts: [
        { metric: "Health", change: "+7", tone: "positive" },
        { metric: "Runway", change: "+2 mo", tone: "positive" },
        { metric: "Risk", change: "-10", tone: "positive" }
      ]
    };
  }, [result]);

  const futureYouCard = useMemo(() => {
    const age = (assessment?.age || 30) + 5;
    return {
      age: age,
      emergency: "₹4.3L",
      debt: "₹0",
      stress: "Low"
    };
  }, [assessment]);

  return (
    <section className="story-home">
      {/* ════════════════════════════════════════════════
          TITLE + SCORE HERO
          ════════════════════════════════════════════════ */}
      <div className="story-hero">
        <div className="story-header">
          <h1 className="story-title">Your Financial Story</h1>
          <p className="story-subtitle">Everything you need to know in one screen</p>
        </div>

        <div className="score-hero">
          <div className="score-display">
            <div className="score-number">{currentScore}</div>
            <div className="score-label">Financial Health</div>
          </div>

          <div className="score-change">
            {scoreChange.direction === "up" ? (
              <TrendingUp size={20} color="var(--cyan)" />
            ) : (
              <TrendingDown size={20} color="var(--orange)" />
            )}
            <span className="score-change-value">
              {scoreChange.direction === "up" ? "↑" : "↓"} {Math.abs(scoreChange.value)} this month
            </span>
          </div>

          <p className="emotional-narrative">{emotionalNarrative}</p>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          SECTION 1: REALITY (TODAY)
          ════════════════════════════════════════════════ */}
      <div className="story-section">
        <h2 className="section-title">TODAY</h2>

        <div className="reality-card">
          <div className="reality-row">
            <div className="reality-item">
              <span className="reality-label">Financial Health</span>
              <span className="reality-value">{currentScore}</span>
            </div>
            <div className="reality-item">
              <span className="reality-label">Cash Runway</span>
              <span className="reality-value">{realityCard.runway} months</span>
            </div>
          </div>

          <div className="reality-divider" />

          <div className="reality-row">
            <div className="reality-insight">
              <AlertCircle size={18} color="var(--orange)" />
              <div>
                <span className="insight-label">Biggest Risk</span>
                <span className="insight-value">{realityCard.risk}</span>
              </div>
            </div>
            <div className="reality-insight">
              <CheckCircle2 size={18} color="var(--cyan)" />
              <div>
                <span className="insight-label">Biggest Strength</span>
                <span className="insight-value">{realityCard.strength}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          SECTION 2: WHY (Top 3 Reasons)
          ════════════════════════════════════════════════ */}
      <div className="story-section">
        <h2 className="section-title">Why your score isn't higher</h2>

        <div className="reasons-list">
          {topReasons.map((reason, idx) => (
            <div key={reason.id} className="reason-card">
              <div
                className="reason-header"
                onClick={() => setExpandedReason(expandedReason === reason.id ? null : reason.id)}
              >
                <div className="reason-icon">
                  {reason.icon === "brain" ? (
                    <Brain size={18} color="var(--purple)" />
                  ) : (
                    <AlertCircle size={18} color="var(--orange)" />
                  )}
                </div>

                <div className="reason-content">
                  <span className="reason-label">{reason.label}</span>
                  <span className="reason-impact">Impact -{reason.impact}</span>
                </div>

                <ChevronDown
                  size={18}
                  style={{
                    transform: expandedReason === reason.id ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 200ms ease"
                  }}
                />
              </div>

              {expandedReason === reason.id && (
                <div className="reason-detail">
                  <p>{reason.detail}</p>
                  <button
                    className="reason-action"
                    onClick={event => {
                      event.stopPropagation();
                      onCoachOpen(reason.label);
                    }}
                  >
                    Fix it
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          SECTION 3: FUTURE (Trajectory)
          ════════════════════════════════════════════════ */}
      <div className="story-section">
        <h2 className="section-title">Your Future</h2>

        <div className="future-card">
          <div className="future-chart-header">
            <div>
              <span className="path-label">Projected Trajectory</span>
              <p className="future-chart-copy">A visual forecast of current behavior vs recommended choices.</p>
            </div>
            <div className="future-legend">
              <div className="legend-item"><span className="legend-dot current" /> Current</div>
              <div className="legend-item"><span className="legend-dot recommended" /> Recommended</div>
            </div>
          </div>

          <div className="future-chart-wrapper">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={timelineData} margin={{ top: 20, right: 24, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#e6fffb" strokeDasharray="3 3" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "var(--ink-2)", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--ink-2)", fontSize: 12 }} width={36} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)", backgroundColor: "white", color: "var(--ink-0)" }}
                  cursor={{ stroke: "rgba(98,228,209,0.45)", strokeDasharray: "3 3" }}
                />
                <Line type="monotone" dataKey="current" stroke="#f97316" strokeWidth={3} dot={{ r: 4, fill: "#fb923c" }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="recommended" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4, fill: "#22d3ee" }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <p className="future-note">
            Your choices this month compound into +{timelineData[3].recommended - timelineData[0].current} points by year 3.
          </p>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          SECTION 4: FINANCIAL TWIN
          ════════════════════════════════════════════════ */}
      <div className="story-section">
        <h2 className="section-title">Future You</h2>

        <div className="twin-card">
          <span className="twin-label">At age {futureYouCard.age}</span>

          <div className="twin-metrics">
            <div className="twin-metric">
              <Wallet size={20} color="var(--cyan)" />
              <div>
                <span className="twin-metric-label">Emergency Fund</span>
                <span className="twin-metric-value">{futureYouCard.emergency}</span>
              </div>
            </div>
            <div className="twin-metric">
              <Heart size={20} color="var(--green)" />
              <div>
                <span className="twin-metric-label">Debt</span>
                <span className="twin-metric-value">{futureYouCard.debt}</span>
              </div>
            </div>
            <div className="twin-metric">
              <Zap size={20} color="var(--purple)" />
              <div>
                <span className="twin-metric-label">Stress Level</span>
                <span className="twin-metric-value">{futureYouCard.stress}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          SECTION 5: THIS WEEK
          ════════════════════════════════════════════════ */}
      <div className="story-section story-action">
        <h2 className="section-title">This Week</h2>

        <div className="action-card">
          <div className="action-main">
            <Zap size={24} color="var(--cyan)" />
            <span className="action-text">{actionCard.action}</span>
          </div>

          <div className="action-impacts">
            {actionCard.impacts.map((impact, i) => (
              <div key={i} className="impact-item">
                <span className="impact-metric">{impact.metric}</span>
                <span className={`impact-change ${impact.tone}`}>{impact.change}</span>
              </div>
            ))}
          </div>

          <button className="action-cta">
            See the plan
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          FLOATING COACH
          ════════════════════════════════════════════════ */}
      <div className="floating-coach">
        <button className="coach-button" onClick={onCoachOpen} title="Open Coach">
          <MessageCircle size={20} />
        </button>
      </div>
    </section>
  );
}
