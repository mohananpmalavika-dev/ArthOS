import React from "react";
import PropTypes from "prop-types";
import ScoreCard from "./ScoreCard.jsx";

function SurvivalHero({ survivalMonths = 0, score }) {
  const days = Math.max(0, Math.round(survivalMonths * 30));
  const computedScore = typeof score === "number" ? score : Math.min(1000, Math.round((survivalMonths / 12) * 1000));

  return (
    <section className="survival-hero result-card" style={{ display: "flex", gap: 20, alignItems: "center" }}>
      <div>
        <ScoreCard score={computedScore} size={160} />
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 6 }}>If income stops today</div>
        <div style={{ fontSize: 36, fontWeight: 800, color: "var(--ink-0)" }}>{days}</div>
        <div style={{ fontSize: 14, color: "var(--ink-2)", marginBottom: 8 }}>Days</div>
        <div style={{ fontSize: 13, color: "var(--ink-3)", fontWeight: 700 }}>Financial Survival Window</div>
      </div>
    </section>
  );
}

SurvivalHero.propTypes = {
  survivalMonths: PropTypes.number,
  score: PropTypes.number
};

export default SurvivalHero;
