import React, { lazy, Suspense, useState } from "react";
import { ChevronDown, Zap, Brain, TrendingUp, Network, Database, BarChart3 } from "lucide-react";

// Lazy load all dashboard components
const MindDashboard = lazy(() => import("./MindDashboard.jsx"));
const CognitionGraphDashboard = lazy(() => import("./CognitionGraphDashboard.jsx"));
const PredictionEngineDashboard = lazy(() => import("./PredictionEngineDashboard.jsx"));
const LongitudinalLearningDashboard = lazy(() => import("./LongitudinalLearningDashboard.jsx"));
const DigitalTwinDashboard = lazy(() => import("./DigitalTwinDashboard.jsx"));
const AnalyticsDashboard = lazy(() => import("./AnalyticsDashboard.jsx"));
const RetentionDashboard = lazy(() => import("./RetentionDashboard.jsx"));
const BehaviourDrivers = lazy(() => import("./BehaviourDrivers.jsx"));

const LazyComponentFallback = () => (
  <div style={{ padding: "40px 24px", textAlign: "center" }}>
    <p style={{ color: "var(--ink-3)" }}>Loading intelligence layer...</p>
  </div>
);

export default function DeveloperIntelligenceSection({ result, assessment, userId = "demo" }) {
  const [expandedSection, setExpandedSection] = useState(null);

  const dashboards = [
    {
      id: "mind",
      name: "Financial Mind Profile",
      description: "Deep dive: Biases, beliefs, and emotional triggers",
      icon: Brain,
      color: "var(--purple-600)"
    },
    {
      id: "cognition-graph",
      name: "Cognition Graph",
      description: "Knowledge graph of financial patterns and relationships",
      icon: Network,
      color: "var(--blue-600)"
    },
    {
      id: "predictions",
      name: "Prediction Engine",
      description: "Longitudinal forecasting and trajectory predictions",
      icon: TrendingUp,
      color: "var(--green-600)"
    },
    {
      id: "longitudinal",
      name: "Longitudinal Learning",
      description: "Historical patterns and behavior evolution",
      icon: Database,
      color: "var(--indigo-600)"
    },
    {
      id: "twin",
      name: "Digital Twin",
      description: "Simulated scenarios and counterfactual analysis",
      icon: Zap,
      color: "var(--orange-600)"
    },
    {
      id: "analytics",
      name: "Analytics Dashboard",
      description: "Advanced metrics and system-wide insights",
      icon: BarChart3,
      color: "var(--red-600)"
    }
  ];

  return (
    <section className="page-section developer-intelligence-section" style={{ padding: "24px 16px" }}>
      <div className="page-heading" style={{ marginBottom: "24px" }}>
        <p style={{ margin: 0, color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.14em", fontSize: "0.85rem" }}>
          Developer Console
        </p>
        <h1 style={{ margin: "12px 0 0", fontSize: "2rem", fontWeight: 800, color: "var(--ink-0)" }}>
          Intelligence Layers
        </h1>
        <p style={{ margin: "12px 0 0", color: "var(--ink-3)", maxWidth: "760px", lineHeight: 1.7 }}>
          Access all prediction engines, dashboards, and analytical tools. These are the internal systems that power the narrative.
        </p>
      </div>

      {/* Dashboard Menu */}
      <div style={{ display: "grid", gap: "12px", marginBottom: "32px" }}>
        {dashboards.map(dashboard => {
          const Icon = dashboard.icon;
          const isExpanded = expandedSection === dashboard.id;

          return (
            <div key={dashboard.id}>
              {/* Dashboard Header Button */}
              <button
                onClick={() => setExpandedSection(isExpanded ? null : dashboard.id)}
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: "12px",
                  background: "var(--white)",
                  border: `1px solid var(--gray-200)`,
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--gray-50)";
                  e.currentTarget.style.borderColor = dashboard.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--white)";
                  e.currentTarget.style.borderColor = "var(--gray-200)";
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: dashboard.color + "22",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: dashboard.color,
                    flexShrink: 0
                  }}
                >
                  <Icon size={20} />
                </div>

                <div style={{ flex: 1, textAlign: "left" }}>
                  <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "var(--ink-0)" }}>
                    {dashboard.name}
                  </h3>
                  <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--ink-3)" }}>
                    {dashboard.description}
                  </p>
                </div>

                <ChevronDown
                  size={20}
                  style={{
                    color: "var(--ink-3)",
                    transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s"
                  }}
                />
              </button>

              {/* Dashboard Content */}
              {isExpanded && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "20px",
                    borderRadius: "12px",
                    background: "var(--gray-50)",
                    border: `1px solid ${dashboard.color}33`,
                    minHeight: "300px"
                  }}
                >
                  <Suspense fallback={<LazyComponentFallback />}>
                    {dashboard.id === "mind" && (
                      <MindDashboard result={result} assessment={assessment} />
                    )}
                    {dashboard.id === "cognition-graph" && (
                      <CognitionGraphDashboard result={result} assessment={assessment} />
                    )}
                    {dashboard.id === "predictions" && (
                      <PredictionEngineDashboard userId={userId} />
                    )}
                    {dashboard.id === "longitudinal" && (
                      <LongitudinalLearningDashboard userId={userId} />
                    )}
                    {dashboard.id === "twin" && (
                      <DigitalTwinDashboard result={result} assessment={assessment} />
                    )}
                    {dashboard.id === "analytics" && (
                      <AnalyticsDashboard result={result} assessment={assessment} />
                    )}
                  </Suspense>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Note */}
      <section className="result-card developer-notice-card" style={{ padding: "20px", background: "var(--blue-50)", border: "1px solid var(--blue-200)" }}>
        <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--ink-3)", lineHeight: 1.6 }}>
          <strong style={{ color: "var(--ink-0)" }}>Developer Note:</strong> These intelligence layers are the internal systems that power ARTH.OS. 
          They are organized by function and can be queried independently. In production, these would be accessed via API endpoints or scheduled batch processes.
        </p>
      </section>
    </section>
  );
}
