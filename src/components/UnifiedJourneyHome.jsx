import React, { useMemo } from "react";
import { Home, Brain, Target, Sparkles, ArrowRight } from "lucide-react";
import TrajectoryHeroVisual from "./TrajectoryHeroVisual.jsx";
import NextBestActionCard from "./NextBestActionCard.jsx";

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export default function UnifiedJourneyHome({ result, assessment }) {
  const currentScore = useMemo(
    () => clampScore((result?.healthScore ?? 0) / 10),
    [result]
  );

  const realitySummary = result?.blindSpotHeadline || result?.blindSpotSummary || "Your score, runway and risk outlook form the clearest picture of your money life today.";
  const futureRisk = result?.futureRiskLabel || "Future risk";
  const runway = result?.survivalMonthsDisplay || "0";
  const scoreLabel = result?.categoryBand?.label || "Live profile";

  const topFactors = useMemo(() => {
    const factors = [];
    const biases = result?.biases || [];
    const beliefs = result?.moneyBeliefs || [];
    const triggers = result?.emotionalTriggers || [];

    biases.forEach(bias => {
      factors.push({
        label: bias.name || bias.label || "Cognitive bias",
        detail: bias.description || "This cognitive pattern shapes your decisions.",
        impact: Math.round((bias.severity || bias.strength || 0.5) * 100),
        tone: "risk"
      });
    });

    beliefs.forEach(belief => {
      factors.push({
        label: belief.name || belief.belief || "Money belief",
        detail: belief.description || "This belief is influencing your financial mindset.",
        impact: Math.round((belief.strength || 0.5) * 100),
        tone: "signal"
      });
    });

    triggers.forEach(trigger => {
      factors.push({
        label: trigger.name || trigger.trigger || "Emotional trigger",
        detail: trigger.description || "This emotional pattern affects your spending.",
        impact: Math.round((trigger.severity || trigger.impact || 0.5) * 100),
        tone: "warning"
      });
    });

    return factors.sort((a, b) => (b.impact || 0) - (a.impact || 0)).slice(0, 5);
  }, [result]);

  const timelineData = useMemo(() => {
    const baseYear = new Date().getFullYear();
    const decline = [0, -4, -11, -14].map(delta => clampScore(currentScore + delta));
    const improve = [0, 8, 16, 20].map(delta => clampScore(currentScore + delta));

    return [
      { year: `${baseYear}`, current: decline[0], recommended: improve[0] },
      { year: `${baseYear + 1}`, current: decline[1], recommended: improve[1] },
      { year: `${baseYear + 2}`, current: decline[2], recommended: improve[2] },
      { year: `${baseYear + 3}`, current: decline[3], recommended: improve[3] }
    ];
  }, [currentScore]);

  const actionImpact = useMemo(
    () => {
      return [
        { label: "Readiness", value: "+9 pts", description: "Stronger financial stability", tone: "positive" },
        { label: "Risk", value: "-12 pts", description: "Lower downside exposure", tone: "positive" },
        { label: "Stress", value: "-15 pts", description: "Less emotional pressure", tone: "positive" },
        { label: "Survival", value: "+4 mo", description: "More runway for unexpected expenses", tone: "positive" }
      ];
    }, []);

  return (
    <section className="page-section unified-journey-home" style={{ padding: "24px 16px" }}>
      <div className="unified-header" style={{ marginBottom: "28px" }}>
        <p style={{ margin: 0, color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.14em", fontSize: "0.85rem" }}>
          Your One-Screen Financial Story
        </p>
        <h1 style={{ margin: "14px 0 12px", fontSize: "2.6rem", lineHeight: 1.03, fontWeight: 800, color: "var(--ink-0)" }}>
          Reality, Why, Future, Action — all on a single page.
        </h1>
        <p style={{ margin: 0, color: "var(--ink-3)", maxWidth: "760px", lineHeight: 1.7 }}>
          Investors and users need one narrative flow, not five separate screens. This page brings your score, your behavior drivers, the future timeline and the highest-impact action into one coherent launchpad.
        </p>
      </div>

      <div className="unified-journey-links" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "12px", marginBottom: "32px" }}>
        {[
          { id: "reality", label: "Reality", icon: Home },
          { id: "why", label: "Why", icon: Brain },
          { id: "future", label: "Future", icon: Target },
          { id: "action", label: "Action", icon: Sparkles }
        ].map(item => {
          const Icon = item.icon;
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="unified-journey-link"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "18px 20px",
                borderRadius: "18px",
                background: "var(--white)",
                border: "1px solid var(--gray-200)",
                color: "var(--ink-0)",
                textDecoration: "none",
                fontWeight: 600
              }}
            >
              <Icon size={18} />
              {item.label}
            </a>
          );
        })}
      </div>

      <section id="reality" style={{ marginBottom: "36px" }}>
        <div style={{ display: "grid", gap: "24px", gridTemplateColumns: "1.7fr 1fr", alignItems: "start" }}>
          <div style={{ padding: "32px", borderRadius: "28px", background: "var(--slate-950)", color: "var(--white)" }}>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.72)", textTransform: "uppercase", letterSpacing: "0.16em", fontSize: "0.8rem" }}>
              Reality
            </p>
            <h2 style={{ margin: "18px 0 0", fontSize: "2.4rem", lineHeight: 1.05, fontWeight: 800 }}>
              The true state of your money life today
            </h2>
            <p style={{ margin: "24px 0 0", color: "rgba(255,255,255,0.78)", maxWidth: "720px", lineHeight: 1.75 }}>
              {realitySummary}
            </p>

            <div style={{ display: "grid", gap: "18px", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", marginTop: "32px" }}>
              <div style={{ padding: "20px", borderRadius: "20px", background: "rgba(255,255,255,0.08)" }}>
                <span style={{ display: "block", marginBottom: "10px", color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.76rem" }}>
                  Score
                </span>
                <strong style={{ fontSize: "2.8rem", lineHeight: 1, color: "var(--white)" }}>{currentScore}/100</strong>
              </div>
              <div style={{ padding: "20px", borderRadius: "20px", background: "rgba(255,255,255,0.08)" }}>
                <span style={{ display: "block", marginBottom: "10px", color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.76rem" }}>
                  Runway
                </span>
                <strong style={{ fontSize: "2.8rem", lineHeight: 1, color: "var(--white)" }}>{runway} mo</strong>
              </div>
              <div style={{ padding: "20px", borderRadius: "20px", background: "rgba(255,255,255,0.08)" }}>
                <span style={{ display: "block", marginBottom: "10px", color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.76rem" }}>
                  Outlook
                </span>
                <strong style={{ fontSize: "2.2rem", lineHeight: 1, color: "var(--white)" }}>{futureRisk}</strong>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gap: "20px" }}>
            <div style={{ padding: "24px", borderRadius: "24px", background: "var(--white)", border: "1px solid var(--gray-200)" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "var(--ink-0)" }}>
                Reality snapshot
              </h3>
              <p style={{ margin: "16px 0 0", color: "var(--ink-3)", lineHeight: 1.7 }}>
                Your score is not just a number — it is the summary of how your behavior, awareness and stability are interacting right now.
              </p>
            </div>
            <div style={{ padding: "24px", borderRadius: "24px", background: "var(--white)", border: "1px solid var(--gray-200)" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "var(--ink-0)" }}>
                What investors want to see
              </h3>
              <ul style={{ margin: "16px 0 0", paddingLeft: "18px", color: "var(--ink-3)", lineHeight: 1.8 }}>
                <li>Current financial health score and trend</li>
                <li>Runway clarity and risk posture</li>
                <li>Reality-based insight, not just optimistic projections</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="why" style={{ marginBottom: "36px" }}>
        <div style={{ display: "grid", gap: "24px", gridTemplateColumns: "1fr 0.9fr" }}>
          <div>
            <p style={{ margin: 0, color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.14em", fontSize: "0.85rem" }}>
              Why
            </p>
            <h2 style={{ margin: "12px 0 0", fontSize: "2.2rem", fontWeight: 800, color: "var(--ink-0)" }}>
              The patterns that explain your score
            </h2>
            <p style={{ margin: "16px 0 0", color: "var(--ink-3)", maxWidth: "720px", lineHeight: 1.7 }}>
              This section surfaces the top biases, beliefs and emotional triggers that are shaping your financial behavior right now.
            </p>
          </div>

          <div style={{ padding: "24px", borderRadius: "24px", background: "var(--white)", border: "1px solid var(--gray-200)" }}>
            <p style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "var(--ink-0)" }}>
              Why this matters
            </p>
            <p style={{ margin: "14px 0 0", color: "var(--ink-3)", lineHeight: 1.7 }}>
              When you know why the score is where it is, you can choose the right action instead of guessing. The top drivers here are your biggest levers for improvement.
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gap: "18px", marginTop: "24px" }}>
          {topFactors.length > 0 ? (
            topFactors.map((factor, index) => (
              <div
                key={index}
                style={{
                  padding: "22px 24px",
                  borderRadius: "18px",
                  background: "var(--white)",
                  border: "1px solid var(--gray-200)",
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: "16px"
                }}
              >
                <div>
                  <p style={{ margin: 0, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-3)", marginBottom: "8px" }}>
                    {factor.tone === "risk" ? "Bias" : factor.tone === "signal" ? "Belief" : "Trigger"}
                  </p>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "var(--ink-0)" }}>
                    {factor.label}
                  </h3>
                  <p style={{ margin: "10px 0 0", color: "var(--ink-3)", lineHeight: 1.7 }}>
                    {factor.detail}
                  </p>
                </div>
                <div style={{ alignSelf: "center", minWidth: "80px", textAlign: "right" }}>
                  <span style={{ display: "block", fontSize: "0.75rem", color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
                    Impact
                  </span>
                  <strong style={{ fontSize: "1.6rem", lineHeight: 1, color: "var(--ink-0)" }}>
                    {factor.impact}%
                  </strong>
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: "24px", borderRadius: "18px", background: "var(--white)", border: "1px solid var(--gray-200)" }}>
              <p style={{ margin: 0, color: "var(--ink-3)", lineHeight: 1.7 }}>
                Complete your assessment to reveal the top behavioral drivers behind your financial score.
              </p>
            </div>
          )}
        </div>
      </section>

      <section id="future" style={{ marginBottom: "36px" }}>
        <div style={{ display: "grid", gap: "24px" }}>
          <div style={{ display: "grid", gap: "10px" }}>
            <p style={{ margin: 0, color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.14em", fontSize: "0.85rem" }}>
              Future
            </p>
            <h2 style={{ margin: 0, fontSize: "2.2rem", fontWeight: 800, color: "var(--ink-0)" }}>
              The biggest missing feature: a future timeline hero
            </h2>
            <p style={{ margin: "12px 0 0", color: "var(--ink-3)", lineHeight: 1.7, maxWidth: "760px" }}>
              This is the hero visual investors need: if nothing changes versus if you follow the recommendation.
            </p>
          </div>

          <TrajectoryHeroVisual result={result} data={timelineData} />

          <div style={{ display: "grid", gap: "18px", gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
            <div style={{ padding: "24px", borderRadius: "20px", background: "var(--red-50)", border: "1px solid var(--red-200)" }}>
              <p style={{ margin: 0, color: "var(--red-700)", fontWeight: 700, fontSize: "0.95rem" }}>
                If nothing changes
              </p>
              <ul style={{ margin: "18px 0 0", paddingLeft: "18px", color: "var(--ink-3)", lineHeight: 1.8 }}>
                {timelineData.map(item => (
                  <li key={item.year}>
                    {item.year} → {item.current}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ padding: "24px", borderRadius: "20px", background: "var(--green-50)", border: "1px solid var(--green-200)" }}>
              <p style={{ margin: 0, color: "var(--green-700)", fontWeight: 700, fontSize: "0.95rem" }}>
                If recommendations followed
              </p>
              <ul style={{ margin: "18px 0 0", paddingLeft: "18px", color: "var(--ink-3)", lineHeight: 1.8 }}>
                {timelineData.map(item => (
                  <li key={item.year}>
                    {item.year} → {item.recommended}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="action" style={{ marginBottom: "36px" }}>
        <div style={{ display: "grid", gap: "24px" }}>
          <div>
            <p style={{ margin: 0, color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.14em", fontSize: "0.85rem" }}>
              Action
            </p>
            <h2 style={{ margin: "12px 0 0", fontSize: "2.2rem", fontWeight: 800, color: "var(--ink-0)" }}>
              The recommendation and its impact, instantly
            </h2>
            <p style={{ margin: "16px 0 0", color: "var(--ink-3)", maxWidth: "760px", lineHeight: 1.7 }}>
              See the one action that matters, plus the outcome it moves across readiness, risk, stress and survival.
            </p>
          </div>

          <div style={{ display: "grid", gap: "24px", gridTemplateColumns: "1.2fr 0.8fr" }}>
            <NextBestActionCard result={result} assessment={assessment} />

            <div style={{ display: "grid", gap: "16px" }}>
              <div style={{ padding: "24px", borderRadius: "20px", background: "var(--white)", border: "1px solid var(--gray-200)" }}>
                <p style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "var(--ink-0)" }}>
                  Action impact summary
                </p>
                <p style={{ margin: "14px 0 0", color: "var(--ink-3)", lineHeight: 1.7 }}>
                  This is how the recommended move changes your financial readiness and resilience in the next cycle.
                </p>
              </div>

              <div style={{ display: "grid", gap: "12px" }}>
                {actionImpact.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      padding: "18px 20px",
                      borderRadius: "18px",
                      background: "var(--gray-50)",
                      border: "1px solid var(--gray-200)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div>
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        {item.label}
                      </p>
                      <p style={{ margin: "8px 0 0", color: "var(--ink-0)", fontWeight: 700, fontSize: "1rem" }}>
                        {item.description}
                      </p>
                    </div>
                    <strong style={{ fontSize: "1.6rem", color: "var(--green-700)" }}>
                      {item.value}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div style={{ textAlign: "center", marginTop: "16px" }}>
        <a
          href="#assessment"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            padding: "14px 22px",
            borderRadius: "14px",
            background: "var(--blue-600)",
            color: "white",
            fontWeight: 700,
            textDecoration: "none"
          }}
        >
          Start the Assessment and activate the plan <ArrowRight size={16} />
        </a>
      </div>
    </section>
  );
}
