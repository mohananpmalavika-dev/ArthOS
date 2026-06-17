import React, { useMemo, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useHistoricalDataContext } from "../context/HistoricalDataContext.jsx";
const AiCoachInterface = React.lazy(() => import("./AiCoachInterface.jsx"));
const RealityScreen = React.lazy(() => import("./RealityScreen.jsx"));
const FutureScreen = React.lazy(() => import("./FutureScreen.jsx"));
import PropTypes from "prop-types";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import BigReveal from "./BigReveal";
import { normalizeScore } from "../lib/scoring-v2";
import { buildLiveInsightCards } from "../lib/assessmentCardBuilder.js";
import SingleRecommendedAction from "./SingleRecommendedAction.jsx";
import SingleMostImportantInsight from "./SingleMostImportantInsight.jsx";
import FutureYou from "./FutureYou.jsx";
import FinancialWeatherCard from "./FinancialWeatherCard.jsx";
import WeeklyMissionCard from "./WeeklyMissionCard.jsx";
import { ScenarioForecast } from "./ScenarioForecast.jsx";
import TrajectoryHeroVisual from "./TrajectoryHeroVisual.jsx";

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export default function UnifiedJourneyHome({ result, assessment, onCoachOpen }) {
  const navigate = useNavigate();
  const [coachMenuOpen, setCoachMenuOpen] = useState(false);

  const { digitalTwin } = useHistoricalDataContext();

  const currentScore = useMemo(
    () => clampScore(normalizeScore(result?.healthScore ?? 0)),
    [result]
  );

  const futureRisk = result?.futureRiskLabel || "Future risk";
  const runway = result?.survivalMonthsDisplay || "0";
  const scoreLabel = result?.categoryBand?.label || "Live profile";

  const basBreakdown = useMemo(() => {
    if (!result?.componentRows?.length) {
      return [];
    }
    return result.componentRows.map(row => ({
      key: row.key,
      label: row.label,
      score: row.percent,
      band: row.band?.label || ""
    }));
  }, [result]);

  const timelineData = useMemo(() => {
    const baseYear = new Date().getFullYear();
    // derive drivers
    const profile = assessment?.profile || {};
    const monthlyIncome = Number(profile.monthlyIncome) || 0;
    const monthlyExpenses = Number(profile.monthlyExpenses) || 1; // avoid div by zero
    const totalSavings =
      (Number(profile.emergencySavingsFixed) || 0) +
      (Number(profile.emergencySavingsDiscretionary) || 0);
    const totalDebt = Number(profile.totalDebt) || 0;

    const monthlySurplus = Math.max(0, monthlyIncome - monthlyExpenses);
    const emergencyFundMonths = monthlyExpenses > 0 ? totalSavings / monthlyExpenses : 0;
    const debtRatio = monthlyIncome > 0 ? totalDebt / (monthlyIncome * 12) : 1;

    // heuristic growth per year (points per year)
    const yearlyGainFromSurplus = (monthlySurplus / Math.max(1, monthlyExpenses)) * 10; // proportional
    const yearlyGainFromEmergency = emergencyFundMonths * 2; // months -> points
    const yearlyPenaltyFromDebt = debtRatio * 25; // scaled penalty

    const netYearlyDelta = yearlyGainFromSurplus + yearlyGainFromEmergency - yearlyPenaltyFromDebt;

    const years = [0, 1, 2, 3];
    const data = years.map(offset => {
      const projected = clampScore(currentScore + Math.round(netYearlyDelta * offset));
      // pessimistic path reduces by half the net delta
      const pess = clampScore(
        currentScore + Math.round(netYearlyDelta * 0.5 * offset) - 6 * offset
      );
      return { year: `${baseYear + offset}`, current: pess, recommended: projected };
    });

    return data;
  }, [currentScore, assessment]);

  const futureYouData = {
    age: result?.projectedAge || 36,
    emergency: result?.emergencyBufferDisplay || "₹18,500",
    debt: result?.projectedDebtDisplay || "₹9,200",
    stress: result?.projectedStressLabel || "Lower"
  };

  const coachQuickActions = [
    { label: "Improve cashflow", concern: "cashflow" },
    { label: "Extend runway", concern: "runway" },
    { label: "Reduce risk", concern: "reduce-risk" }
  ];

  const heroRef = useRef(null);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) {
      return;
    }

    const onMove = e => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // -1 to 1
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      el.style.setProperty("--mx", x.toFixed(4));
      el.style.setProperty("--my", y.toFixed(4));
    };

    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, []);

  // Landing redirect: if there's no meaningful score yet, guide users into onboarding.
  useEffect(() => {
    try {
      // If no numeric health score yet, it's likely a first-time user — send to onboarding
      if (typeof result?.healthScore !== "number" || Number.isNaN(result.healthScore)) {
        navigate("/onboarding", { replace: true });
      }
    } catch (err) {
      // ignore navigation errors
    }
  }, [result, navigate]);

  const [particles] = useState(() =>
    Array.from({ length: 22 }).map(() => ({
      left: Math.round(Math.random() * 100) + "%",
      top: Math.round(Math.random() * 100) + "%",
      size: 4 + Math.round(Math.random() * 10),
      delay: (Math.random() * 3).toFixed(2) + "s"
    }))
  );

  UnifiedJourneyHome.propTypes = {
    result: PropTypes.shape({
      componentRows: PropTypes.arrayOf(
        PropTypes.shape({
          key: PropTypes.string,
          label: PropTypes.string,
          percent: PropTypes.number,
          band: PropTypes.shape({ label: PropTypes.string })
        })
      ),
      healthScore: PropTypes.number,
      futureRiskLabel: PropTypes.string,
      survivalMonthsDisplay: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      cashflowDisplay: PropTypes.string,
      categoryBand: PropTypes.shape({ label: PropTypes.string })
    }),
    assessment: PropTypes.object,
    onCoachOpen: PropTypes.func
  };

  const insightCards = useMemo(
    () => buildLiveInsightCards(result, assessment),
    [result, assessment]
  );
  const scorePhrase = useMemo(() => {
    if (currentScore >= 85) {
      return "Commanding financial momentum";
    }
    if (currentScore >= 70) {
      return "Strong stability with room to grow";
    }
    if (currentScore >= 50) {
      return "A solid foundation and clear next steps";
    }
    return "Stabilize first, then accelerate from here";
  }, [currentScore]);

  const mriMetrics = [
    {
      title: "Awareness gap",
      value: result?.awarenessGap ? `${result.awarenessGap} mo` : "—",
      detail: "How clearly your runway matches your expectations"
    },
    {
      title: "Emergency strength",
      value: result?.emergencyBufferDisplay || "₹0",
      detail: "Buffer available for unexpected expenses"
    },
    {
      title: "Behavior signal",
      value: result?.futureRiskLabel || "Moderate",
      detail: "Emotional and spending signals in your profile"
    }
  ];

  const liveInsights = useMemo(() => insightCards, [insightCards]);

  return (
    <main className="home-hero" ref={heroRef}>
      <BigReveal score={currentScore} />

      <div className="home-block">
        <div className="section-header">
          <span className="section-eyebrow">Command Center</span>
          <h2 className="section-title">Financial command center</h2>
          <p className="section-copy">
            One place for score, runway, risk, and the right decisions your AI coach is already
            tracking.
          </p>
        </div>

        <div className="command-center-grid">
          <div className="glass-panel">
            <p className="glass-panel-label">Financial health</p>
            <p className="glass-panel-value">{currentScore}/100</p>
            <p className="section-copy">Core score normalized for simple decision-making.</p>
          </div>
          <div className="glass-panel">
            <p className="glass-panel-label">Runway</p>
            <p className="glass-panel-value">{runway} mo</p>
            <p className="section-copy">
              How long your reserves and cashflow support your current lifestyle.
            </p>
          </div>
          <div className="glass-panel">
            <p className="glass-panel-label">Cashflow</p>
            <p className="glass-panel-value">{result?.cashflowDisplay || "₹0"}</p>
            <p className="section-copy">The live margin between money in and money out.</p>
          </div>
          <div className="glass-panel">
            <p className="glass-panel-label">Outlook</p>
            <p className="glass-panel-value">{futureRisk}</p>
            <p className="section-copy">
              The projected risk profile based on behavior, runway and awareness.
            </p>
          </div>
        </div>
      </div>

      <div className="home-block bas-breakdown-block">
        <div className="section-header">
          <span className="section-eyebrow">BAS™ Breakdown</span>
          <h2 className="section-title">Why your score is what it is</h2>
          <p className="section-copy">
            See behaviour, awareness, and stability in one place so you can understand the score and
            the first place to improve.
          </p>
        </div>

        <div className="bas-breakdown-grid">
          {basBreakdown.map(item => (
            <div key={item.key} className="bas-card">
              <div className="bas-card-header">
                <span>{item.label}</span>
                <strong>{item.score}%</strong>
              </div>
              <p className="bas-card-band">{item.band}</p>
              <div className="bas-card-bar">
                <div className="bas-card-fill" style={{ width: `${item.score}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="home-block">
        <div className="section-header">
          <span className="section-eyebrow">The one thing</span>
          <h2 className="section-title">Your most important insight</h2>
          <p className="section-copy">
            This is the single insight the app has chosen as the most impactful next step for you.
          </p>
        </div>

        <SingleMostImportantInsight assessmentResult={result} assessment={assessment} />
      </div>

      <div className="home-block">
        <div className="section-header">
          <span className="section-eyebrow">Digital Twin</span>
          <h2 className="section-title">Your future self preview</h2>
          <p className="section-copy">
            A holographic glimpse of your future financial profile if you stay on the current plan.
          </p>
        </div>

        <div className="digital-twin-grid">
          <FutureYou data={futureYouData} />
          <FinancialWeatherCard weatherIndex={result?.weatherIndex} healthScore={result?.healthScore ?? 0} />
        </div>
      </div>

      <div className="home-block preview-block">
        <div className="section-header">
          <span className="section-eyebrow">Quick previews</span>
          <h2 className="section-title">Reality, Future & Coach</h2>
          <p className="section-copy">Small previews so you can jump straight to the cinematic experiences.</p>
        </div>

        <div className="preview-grid">
          <React.Suspense fallback={<div>Loading preview...</div>}>
            <RealityScreen result={result} assessment={assessment} />
          </React.Suspense>

          <React.Suspense fallback={<div>Loading preview...</div>}>
            <FutureScreen result={result} assessment={assessment} digitalTwin={digitalTwin} />
          </React.Suspense>

          <React.Suspense fallback={<div>Loading coach...</div>}>
            <AiCoachInterface result={result} assessment={assessment} compact />
          </React.Suspense>
        </div>
      </div>

      <div className="home-block">
        <div className="section-header">
          <span className="section-eyebrow">Financial MRI</span>
          <h2 className="section-title">What the score is really made of</h2>
          <p className="section-copy">
            A deeper scan of awareness, reserve strength, and behavior signals that shape your
            score.
          </p>
        </div>

        <div className="mri-grid">
          {mriMetrics.map(metric => (
            <div key={metric.title} className="glass-panel">
              <p className="glass-panel-label">{metric.title}</p>
              <p className="glass-panel-value">{metric.value}</p>
              <p className="section-copy" style={{ margin: 0 }}>
                {metric.detail}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="home-block">
        <div className="section-header">
          <span className="section-eyebrow">Scenario Lab</span>
          <h2 className="section-title">Test plan outcomes with the AI lab</h2>
          <p className="section-copy">
            Compare your baseline with recommended actions and see which choices move your score
            forward.
          </p>
        </div>

        <ScenarioForecast profile={assessment?.profile} assessmentResult={result} />
      </div>

      <div className="home-block">
        <div className="section-header">
          <span className="section-eyebrow">AI command center</span>
          <h2 className="section-title">Conversation-ready signals</h2>
          <p className="section-copy">
            Talk to the coach about the exact levers that matter most right now.
          </p>
        </div>

        <div className="hero-actions">
          <button className="hero-cta" onClick={() => onCoachOpen?.("cashflow")}>
            Improve cashflow
          </button>
          <button className="hero-secondary" onClick={() => onCoachOpen?.("runway")}>
            Extend runway
          </button>
          <button className="hero-secondary" onClick={() => onCoachOpen?.("reduce-risk")}>
            Reduce risk
          </button>
        </div>
      </div>

      <div className="home-block">
        <div className="section-header">
          <span className="section-eyebrow">Live insights</span>
          <h2 className="section-title">Netflix-style insight stream</h2>
          <p className="section-copy">
            High-value takeaways surfaced in a quick, swipeable format.
          </p>
        </div>

        <div className="insight-rail">
          {liveInsights.map((item, index) => (
            <article key={index} className="insight-card">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  marginBottom: 14
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.72)"
                  }}
                >
                  {item.time}
                </p>
                <span style={{ fontSize: 12, color: "var(--accent-cyan)", fontWeight: 700 }}>
                  {item.tone}
                </span>
              </div>
              <h3 style={{ margin: 0, fontSize: "1.15rem", lineHeight: 1.4, color: "white" }}>
                {item.title}
              </h3>
              <p style={{ margin: "14px 0 0", color: "rgba(255,255,255,0.77)", lineHeight: 1.7 }}>
                {item.copy}
              </p>
            </article>
          ))}
        </div>
      </div>

      <div className="home-block mission-block">
        <div className="section-header">
          <span className="section-eyebrow">Mission system</span>
          <h2 className="section-title">Your weekly mission and next best move</h2>
          <p className="section-copy">
            A single focus area plus the step-by-step move that matters most this week.
          </p>
        </div>

        <div className="mission-grid">
          <WeeklyMissionCard result={result} assessment={assessment} />
          <SingleRecommendedAction result={result} assessment={assessment} />
        </div>
      </div>

      <div id="journey" className="home-block">
        <div className="section-header">
          <span className="section-eyebrow">Journey map</span>
          <h2 className="section-title">Your long-term trajectory</h2>
          <p className="section-copy">
            See the current path, the recommended path, and how one decision changes the whole
            story.
          </p>
        </div>

        <TrajectoryHeroVisual result={result} data={timelineData} />
      </div>

      <motion.div
        className="floating-coach"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.66, ease: [0.22, 1, 0.36, 1] }}
      >
        <div style={{ position: "relative" }}>
          <div className="coach-quick-actions">
            <button type="button" onClick={() => onCoachOpen?.("why")}>
              💬 Ask me why your score fell
            </button>
            <button type="button" onClick={() => onCoachOpen?.("how-to-90")}>
              💬 Ask me how to reach 90
            </button>
            <button type="button" onClick={() => onCoachOpen?.("buying-advice")}>
              💬 Ask if buying a car is safe
            </button>
          </div>
          <button
            type="button"
            className="coach-button"
            onMouseEnter={() => setCoachMenuOpen(true)}
            onMouseLeave={() => setCoachMenuOpen(false)}
            onClick={() => onCoachOpen?.("start")}
            title="Open AI Coach"
          >
            <MessageCircle size={20} />
          </button>

          <AnimatePresence>
            {coachMenuOpen && (
              <motion.div
                className="coach-suggestions"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              >
                {coachQuickActions.map(item => (
                  <button
                    key={item.concern}
                    type="button"
                    className="coach-suggestion-button"
                    onClick={() => onCoachOpen?.(item.concern)}
                  >
                    {item.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </main>
  );
}

UnifiedJourneyHome.propTypes = {
  result: PropTypes.shape({
    healthScore: PropTypes.number,
    futureRiskLabel: PropTypes.string,
    survivalMonthsDisplay: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    categoryBand: PropTypes.shape({
      label: PropTypes.string
    }),
    projectedAge: PropTypes.number,
    emergencyBufferDisplay: PropTypes.string,
    projectedDebtDisplay: PropTypes.string,
    projectedStressLabel: PropTypes.string,
    awarenessGap: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    cashflowDisplay: PropTypes.string,
    componentRows: PropTypes.arrayOf(
      PropTypes.shape({
        key: PropTypes.string,
        label: PropTypes.string,
        percent: PropTypes.number,
        band: PropTypes.shape({
          label: PropTypes.string
        })
      })
    )
  }),
  assessment: PropTypes.shape({
    profile: PropTypes.object
  }),
  onCoachOpen: PropTypes.func
};