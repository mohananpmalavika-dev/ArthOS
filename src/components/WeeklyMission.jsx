import React from "react";
import { motion } from "framer-motion";
import { generateMission, formatCurrencyINR } from "../lib/missionGenerator";

export default function WeeklyMission({ user = {}, result = {} }) {
  const mission = generateMission(user, result);

  const percent = Math.round((mission.progress || 0) * 100);

  return (
    <section className="result-card weekly-mission-card" style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <p style={{ margin: 0, color: "var(--ink-2)", textTransform: "uppercase", fontSize: "0.85rem" }}>THIS WEEK'S MISSION</p>
          <h3 style={{ margin: "8px 0 0", fontSize: "1.4rem" }}>{mission.title}</h3>
          <p style={{ margin: "8px 0 0", color: "var(--ink-3)" }}>{mission.subtitle}</p>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.95rem", color: "var(--ink-2)" }}>Reward</div>
          <div style={{ fontWeight: 800, marginTop: 6 }}>{mission.reward?.health} Health • +{mission.reward?.runwayMonths} months</div>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <div className="mission-progress" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ color: "var(--ink-3)" }}>{formatCurrencyINR(mission.saved)} saved</div>
              <div style={{ color: "var(--ink-3)" }}>{percent}%</div>
            </div>
            <div className="mission-bar" style={{ height: 12, background: "rgba(255,255,255,0.06)", borderRadius: 999, overflow: "hidden" }}>
              <motion.div className="mission-bar-fill" style={{ height: "100%", background: "linear-gradient(90deg,#7ad3ff,#72ffe2)" }} initial={{ width: 0 }} animate={{ width: `${percent}%` }} transition={{ duration: 0.9 }} />
            </div>
          </div>

          <div style={{ minWidth: 120, textAlign: "center" }}>
            <div style={{ fontSize: "0.9rem", color: "var(--ink-2)" }}>{mission.daysRemaining} Days Remaining</div>
            <div style={{ marginTop: 6, fontWeight: 700 }}>{percent >= 100 ? "Completed" : "In progress"}</div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18 }}>
        <div style={{ color: "var(--ink-3)" }}>
          <div style={{ fontSize: "0.85rem" }}>Progress</div>
          <div style={{ fontWeight: 800, marginTop: 6 }}>{Math.round((mission.progress || 0) * 100)}%</div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.85rem", color: "var(--ink-2)" }}>Level</div>
          <div style={{ fontWeight: 800, marginTop: 6 }}>{mission.gamify?.level} • {mission.gamify?.title}</div>
          <div style={{ fontSize: "0.85rem", color: "var(--ink-3)", marginTop: 6 }}>{mission.gamify?.xp} XP • Next: {mission.gamify?.nextXP}</div>
        </div>
      </div>
    </section>
  );
}
