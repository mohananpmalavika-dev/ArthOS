import React from "react";
import PropTypes from "prop-types";
import { normalizeScore } from "../lib/scoring-v2";

const WEATHER_TIERS = [
  {
    threshold: 80,
    label: "Sovereign",
    detail: "Calm markets and strong financial footing.",
    color: "var(--green-700)"
  },
  {
    threshold: 65,
    label: "Clear",
    detail: "Healthy momentum with room to grow.",
    color: "var(--blue-700)"
  },
  {
    threshold: 50,
    label: "Watchful",
    detail: "Stable, but worth keeping an eye on risk.",
    color: "var(--amber-700)"
  },
  {
    threshold: 35,
    label: "Recovery",
    detail: "Recovering momentum after recent stress.",
    color: "var(--orange-700)"
  },
  {
    threshold: 0,
    label: "Storm",
    detail: "Financial weather is rough. Prioritize safety.",
    color: "var(--red-700)"
  }
];

export default function FinancialWeatherCard({ weatherIndex, healthScore = 0 }) {
  const rawScore = typeof weatherIndex === "number"
    ? Math.max(0, Math.min(100, weatherIndex))
    : normalizeScore(healthScore);
  const tier =
    WEATHER_TIERS.find(item => rawScore >= item.threshold) ||
    WEATHER_TIERS[WEATHER_TIERS.length - 1];

  return (
    <section className="result-card weather-card" style={{ padding: "24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px"
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: "13px",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--ink-2)"
            }}
          >
            Financial Weather
          </p>
          <h2
            style={{
              margin: "8px 0 0",
              fontSize: "1.2rem",
              fontWeight: 700,
              color: "var(--ink-0)"
            }}
          >
            {tier.label}
          </h2>
        </div>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 18,
            backgroundColor: tier.color,
            display: "grid",
            placeItems: "center",
            color: "white",
            fontWeight: 700,
            fontSize: "1rem"
          }}
        >
          {Math.round(rawScore)}
        </div>
      </div>
      <p style={{ margin: 0, color: "var(--ink-3)", lineHeight: 1.6 }}>{tier.detail}</p>
    </section>
  );
}

FinancialWeatherCard.propTypes = {
  weatherIndex: PropTypes.number,
  healthScore: PropTypes.number
};
