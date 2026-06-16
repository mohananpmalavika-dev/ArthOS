import React from "react";
import { motion } from "framer-motion";
import { forecastHealth } from "../engines/forecastEngine.js";
import { normalizeScore } from "../lib/scoring-v2";

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

export default function FutureTrajectory({ result, assessment, digitalTwin }) {
  const currentRaw = result?.healthScore ?? 0;
  const current = normalizeScore(currentRaw);

  // horizon months to 2030 (approx 48 months)
  const monthsTo2030 = 48;

  // three scenario monthlyImprovement rates (tuned for visible deltas)
  const scenarios = {
    current: 0,
    recommended: 0.6,
    aggressive: 1.2
  };

  function project(improvement) {
    try {
      const f = forecastHealth(current, improvement, 12, 6, result.behaviourScore, result.awarenessScore, result.stabilityScore, 50);
      // take last percentiles entry as final
      const p = f.percentiles && f.percentiles.length ? f.percentiles[f.percentiles.length - 1] : null;
      const final = p ? Math.round(p.p50) : Math.round(current + improvement * 4);
      return Math.max(0, Math.min(100, final));
    } catch (e) {
      return Math.max(0, Math.min(100, Math.round(current + improvement * 4)));
    }
  }

  const projCurrent = project(scenarios.current);
  const projRecommended = project(scenarios.recommended);
  const projAggressive = project(scenarios.aggressive);

  const [active, setActive] = React.useState("recommended");
  const values = {
    current: projCurrent,
    recommended: projRecommended,
    aggressive: projAggressive
  };

  const final = values[active];

  const mid1 = lerp(current, final, 0.33);
  const mid2 = lerp(current, final, 0.66);

  const age = assessment?.profile?.age || "—";
  const wealthNow = Math.round((digitalTwin?.currentState?.median?.netWorth || 0) / 1000);
  const wealth2030 = Math.round((wealthNow * (1 + (final - current) / 200)) * 1000);

  return (
    <section className="result-card future-trajectory" style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
        <div style={{ minWidth: 260 }}>
          <h3 style={{ margin: 0 }}>YOU TODAY</h3>
          <div style={{ marginTop: 8 }}>
            <div>Age: <strong>{age}</strong></div>
            <div>Health: <strong>{current}</strong></div>
          </div>
          <div style={{ marginTop: 18 }}>
            <h4 style={{ margin: "6px 0" }}>YOU IN 2030</h4>
            <div>Health: <strong>{final}</strong></div>
            <div>Wealth: <strong>₹{wealth2030.toLocaleString()}</strong></div>
            <div>Stress: <strong>{final - current > 40 ? "Low" : final - current > 10 ? "Medium" : "High"}</strong></div>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 700 }}>Visual Timeline</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className={`btn ${active === "current" ? "active" : ""}`} onClick={() => setActive("current")}>Current Behavior</button>
              <button className={`btn ${active === "recommended" ? "active" : ""}`} onClick={() => setActive("recommended")}>Recommended Path</button>
              <button className={`btn ${active === "aggressive" ? "active" : ""}`} onClick={() => setActive("aggressive")}>Aggressive Growth</button>
            </div>
          </div>

          <div style={{ marginTop: 14, padding: 12, background: "var(--card-bg)", borderRadius: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>2026</div>
              <div>2027</div>
              <div>2028</div>
              <div>2029</div>
              <div>2030</div>
            </div>

            <div style={{ height: 92, position: "relative" }}>
              <svg width="100%" height="92" viewBox="0 0 800 92" preserveAspectRatio="none">
                <polyline
                  fill="none"
                  stroke="#7ad3ff"
                  strokeWidth="4"
                  points={`0,${100 - (current / 1.25)} 200,${100 - (mid1 / 1.25)} 400,${100 - (mid2 / 1.25)} 600,${100 - (final / 1.25)} 800,${100 - (final / 1.25)}`}
                />
                {[0,200,400,600,800].map((x,i)=> (
                  <g key={x}>
                    <circle cx={x} cy={100 - ( [current, mid1, mid2, final, final][i] / 1.25) } r={6} fill="#04233a" />
                  </g>
                ))}
              </svg>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
              <div>{current}</div>
              <div>{mid1}</div>
              <div>{mid2}</div>
              <div>{final}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
