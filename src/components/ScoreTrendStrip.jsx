import React, { useEffect, useState } from "react";

export default function ScoreTrendStrip({ currentScore = 0 }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("arth-os-score-history");
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.warn("Unable to load score history for trend strip:", error);
    }
  }, []);

  const points = history.slice(-12);
  const maxScore = Math.max(...points.map(point => point.score), 100);

  return (
    <section className="result-card score-trend-strip" style={{ padding: "24px" }}>
      <div style={{ marginBottom: "18px" }}>
        <p style={{ margin: 0, fontSize: "13px", color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Trend strip
        </p>
        <h2 style={{ margin: "10px 0 0", fontSize: "1.2rem", fontWeight: 700, color: "var(--ink-0)" }}>
          Score history
        </h2>
      </div>

      {points.length === 0 ? (
        <p style={{ margin: 0, color: "var(--ink-3)" }}>
          No historical scores yet. Complete another assessment to build your trend.
        </p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))`, gap: "8px", alignItems: "end", minHeight: "120px" }}>
          {points.map(point => {
            const height = Math.max(16, (point.score / maxScore) * 100);
            return (
              <div key={point.date} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: "100%", minHeight: 0, height: `${height}%`, background: "var(--blue-700)", borderRadius: "999px" }} />
                <span style={{ marginTop: "8px", fontSize: "10px", color: "var(--ink-3)" }}>
                  {new Date(point.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
