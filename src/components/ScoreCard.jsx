import React from "react";
import PropTypes from "prop-types";

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function ScoreCard({ score = 742, size = 160 }) {
  const s = clamp(score, 0, 1000);
  const pct = (s / 1000) * 100;
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  // determine band color
  let bandColor = "#ef4444"; // red
  if (s >= 200 && s < 400) bandColor = "#f97316"; // orange
  if (s >= 400 && s < 600) bandColor = "#f59e0b"; // amber
  if (s >= 600 && s < 800) bandColor = "#06b6d4"; // teal
  if (s >= 800) bandColor = "#10b981"; // green

  return (
    <div
      className="score-card"
      style={{ width: size, height: size, display: "inline-block", position: "relative" }}
      aria-label={`Financial Health Score ${s} out of 1000`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="scoreGradient" x1="0%" x2="100%">
            <stop offset="0%" stopColor={bandColor} stopOpacity="0.9" />
            <stop offset="100%" stopColor={bandColor} stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <g transform={`translate(${size / 2}, ${size / 2})`}>
          <circle r={radius} fill="none" stroke="#e6eef2" strokeWidth="12" />
          <circle
            r={radius}
            fill="none"
            stroke="url(#scoreGradient)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={offset}
            transform={`rotate(-90)`}
          />
        </g>
      </svg>

      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          textAlign: "center",
          pointerEvents: "none"
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ink-0)" }}>{s}</div>
        <div style={{ fontSize: 11, color: "var(--ink-2)", marginTop: 2 }}>Health Score</div>
      </div>
    </div>
  );
}

ScoreCard.propTypes = {
  score: PropTypes.number,
  size: PropTypes.number
};

export default ScoreCard;
