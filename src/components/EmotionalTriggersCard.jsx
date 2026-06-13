import React from "react";
import { Zap, AlertCircle } from "lucide-react";

export function EmotionalTriggersCard({ triggers, patterns }) {
  if (!triggers) {
    return null;
  }

  const getTriggerColor = value => {
    if (value >= 80) {
      return "var(--red)";
    }
    if (value >= 60) {
      return "var(--orange)";
    }
    if (value >= 40) {
      return "var(--yellow)";
    }
    if (value >= 20) {
      return "var(--green-500)";
    }
    return "var(--green-500)";
  };

  const getTriggerLabel = value => {
    if (value >= 80) {
      return "Critical";
    }
    if (value >= 60) {
      return "High";
    }
    if (value >= 40) {
      return "Moderate";
    }
    if (value >= 20) {
      return "Low";
    }
    return "Minimal";
  };

  const triggerList = [
    { key: "stressSpending", label: "Stress-Triggered Spending", icon: "😰" },
    { key: "boredomSpending", label: "Boredom Impulse Buying", icon: "😐" },
    { key: "socialPressure", label: "Social Pressure Spending", icon: "👥" },
    { key: "anxietyAvoidance", label: "Anxiety-Avoidance Behavior", icon: "🛡️" },
    { key: "celebratorySpending", label: "Celebration Overspending", icon: "🎉" }
  ];

  return (
    <div className="cognition-card" style={{ marginBottom: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
        <Zap size={20} style={{ marginRight: "8px", color: "var(--orange)" }} />
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600" }}>
          Emotional Trigger Heatmap
        </h3>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {triggerList.map(({ key, label, icon }) => {
          const value = triggers[key] || 0;
          const color = getTriggerColor(value);
          const level = getTriggerLabel(value);

          return (
            <div
              key={key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px",
                backgroundColor: "var(--ui-100)",
                borderRadius: "6px"
              }}
            >
              <span style={{ fontSize: "16px" }}>{icon}</span>
              <span style={{ flex: 1, fontSize: "13px", color: "var(--text-dark)" }}>{label}</span>

              <div
                style={{
                  width: "120px",
                  height: "6px",
                  backgroundColor: "var(--track-bg)",
                  borderRadius: "3px",
                  overflow: "hidden"
                }}
              >
                <div
                  style={{
                    width: `${value}%`,
                    height: "100%",
                    backgroundColor: color,
                    transition: "width 0.3s ease"
                  }}
                />
              </div>

              <span
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: color,
                  minWidth: "50px",
                  textAlign: "right"
                }}
              >
                {level} ({value})
              </span>
            </div>
          );
        })}
      </div>

      {patterns?.patterns && patterns.patterns.length > 0 && (
        <div
          style={{
            marginTop: "12px",
            padding: "10px",
            backgroundColor: "var(--yellow-50)",
            borderRadius: "6px",
            borderLeft: "3px solid var(--amber-700)"
          }}
        >
          <div style={{ display: "flex", gap: "8px", fontSize: "13px" }}>
            <AlertCircle
              size={16}
              style={{ color: "var(--amber-700)", flexShrink: 0, marginTop: "2px" }}
            />
            <div>
              <strong>Identified Patterns:</strong>
              <ul style={{ margin: "4px 0", paddingLeft: "20px", fontSize: "12px" }}>
                {patterns.patterns.map((p, i) => (
                  <li key={i} style={{ marginBottom: "2px" }}>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmotionalTriggersCard;
