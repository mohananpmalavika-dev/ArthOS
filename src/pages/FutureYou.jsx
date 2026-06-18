import React, { useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAssessmentState } from "../hooks/useAssessmentState.js";
import { useHistoricalDataContext } from "../context/HistoricalDataContext.jsx";
import { calculateFinancialHealthV2 } from "../lib/scoring-v2.js";
import FutureScreen from "../components/FutureScreen.jsx";
import FutureYouCard from "../components/FutureYou.jsx";
import WeeklyMissionCard from "../components/WeeklyMissionCard.jsx";
import FinancialDNA from "../components/FinancialDNA.jsx";

export default function FutureYou() {
  const { assessment } = useAssessmentState();
  const { digitalTwin } = useHistoricalDataContext();
  const result = calculateFinancialHealthV2(assessment);
  const navigate = useNavigate();

  useEffect(() => {
    if (result && result.healthScore && assessment) {
      const payload = {
        assessment: assessment,
        result: result
      };
      fetch('/api/saveAssessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(res => res.json())
        .then(data => {
          console.log('[FutureYou Page] Assessment auto-saved:', data);
        })
        .catch(err => {
          console.log('[FutureYou Page] Auto-save failed:', err);
        });
    }
  }, [assessment, result]);

  const futurePersona = useMemo(
    () => ({
      age: result?.projectedAge || 36,
      emergency: result?.emergencyBufferDisplay || "INR 18,500",
      debt: result?.projectedDebtDisplay || "INR 9,200",
      stress: result?.projectedStressLabel || "Lower",
      score: result?.futureRiskScore || Math.round(result?.healthScore || 0),
      name: result?.personalityType ? `Future ${result.personalityType}` : "Future You",
      archetype: result?.personalityType || "Balanced"
    }),
    [result]
  );

  const archetypeIntro = result?.personalityType
    ? `Your ${result.personalityType} profile is being projected into a stronger, more confident version of you.`
    : "This is the future version of you that starts when your money decisions begin to work together.";

  return (
    <div className="premium-route-shell future-you-route">
      <section className="premium-route-hero future-you-hero">
        <div>
          <p className="premium-route-kicker">Future projection</p>
          <h1>Here's The Better Version Of You</h1>
          <p>
            {archetypeIntro} See your projected money situation, what works well, and your next move.
          </p>
        </div>
        <button type="button" className="premium-route-cta" onClick={() => navigate("/action")}>
          Start the mission
          <ArrowRight size={17} aria-hidden="true" />
        </button>
      </section>

      <section className="future-you-layout">
        <div className="future-you-main">
          <FutureScreen result={result} assessment={assessment} digitalTwin={digitalTwin} />
        </div>
        <aside className="future-you-side">
          <FutureYouCard data={futurePersona} />
          <FinancialDNA result={result} />
          <section className="premium-route-card future-you-nudge">
            <h2>Make It Real</h2>
            <p>
              Your current money situation is the starting point. The mission below helps improve your
              money health, savings, and stress together.
            </p>
            <button type="button" onClick={() => navigate("/action")} className="premium-route-cta">
              Start the mission
              <ArrowRight size={17} aria-hidden="true" />
            </button>
          </section>
        </aside>
      </section>

      <section className="premium-route-section">
        <div className="premium-route-section-head">
          <div>
            <p className="premium-route-kicker">Projection summary</p>
            <h2>Your Next Step To Get There</h2>
            <p>
              The weekly mission below is designed to connect your current financial profile with the
              future outcome you just reviewed.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/action")}
            className="premium-route-secondary"
          >
            Explore recommended actions
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>

        <WeeklyMissionCard result={result} assessment={assessment} />
      </section>
    </div>
  );
}
