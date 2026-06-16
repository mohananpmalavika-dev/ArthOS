import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ShieldCheck, HeartHandshake } from "lucide-react";

export default function FutureYou({ data = {} }) {
  const {
    age = 36,
    emergency = "₹18,500",
    debt = "₹9,200",
    stress = "Lower",
    score = 86,
    name = "Future You",
    archetype = "Balanced"
  } = data;

  return (
    <motion.section
      className="future-you-card hologram"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div style={{ display: "grid", gap: 20 }}>
        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap"
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                textTransform: "uppercase",
                letterSpacing: "0.16em",
                color: "rgba(15,23,42,0.65)",
                fontSize: "0.8rem"
              }}
            >
              Future You
            </p>
            <h3
              style={{ margin: "10px 0 0", fontSize: "1.45rem", lineHeight: 1.1, fontWeight: 800 }}
            >
              {name} at age {age}.
            </h3>
          </div>

          <div className="future-avatar-holo">
            <div className="holo-silhouette" />
            <div className="holo-details">
              <div className="holo-name">{name}</div>
              <div style={{ color: "rgba(255,255,255,0.72)", fontSize: "0.9rem", marginTop: 4 }}>{archetype} profile</div>
              <div className="holo-stats">
                <div>Financial Health <strong>{score}</strong></div>
                <div>Stress <strong>{stress}</strong></div>
                <div>Debt <strong>{debt}</strong></div>
                <div>Emergency <strong>{emergency}</strong></div>
              </div>
            </div>
          </div>
        </div>

        <p style={{ margin: 0, color: "rgba(15,23,42,0.72)", lineHeight: 1.8 }}>
          Projected stability, a stronger emergency buffer and a lower stress profile. This view
          shows the person you become when the plan is active.
        </p>

        <div style={{ display: "grid", gap: 14 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: 16,
              borderRadius: 18,
              background: "rgba(59,130,246,0.08)",
              border: "1px solid rgba(59,130,246,0.12)"
            }}
          >
            <Sparkles size={20} color="#0ea5e9" />
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: "rgba(15,23,42,0.72)",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em"
                }}
              >
                Emergency fund
              </p>
              <strong
                style={{ display: "block", marginTop: 6, fontSize: "1rem", color: "#0f172a" }}
              >
                {emergency}
              </strong>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: 16,
              borderRadius: 18,
              background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.12)"
            }}
          >
            <ShieldCheck size={20} color="#10b981" />
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: "rgba(15,23,42,0.72)",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em"
                }}
              >
                Debt outlook
              </p>
              <strong
                style={{ display: "block", marginTop: 6, fontSize: "1rem", color: "#0f172a" }}
              >
                {debt}
              </strong>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: 16,
              borderRadius: 18,
              background: "rgba(236,72,153,0.08)",
              border: "1px solid rgba(236,72,153,0.12)"
            }}
          >
            <HeartHandshake size={20} color="#db2777" />
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: "rgba(15,23,42,0.72)",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em"
                }}
              >
                Stress
              </p>
              <strong
                style={{ display: "block", marginTop: 6, fontSize: "1rem", color: "#0f172a" }}
              >
                {stress}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
