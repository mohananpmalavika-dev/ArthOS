import React, { Suspense, useState } from "react";
import { BarChart3, BrainCircuit } from "lucide-react";
import { useAssessmentState } from "../hooks/useAssessmentState.js";
import { calculateFinancialHealthV2 } from "../lib/scoring-v2.js";
import { useHistoricalDataContext } from "../context/HistoricalDataContext.jsx";
import ErrorBoundary from "../components/ErrorBoundary.jsx";

const AnalyticsDashboard = React.lazy(() => import("../components/AnalyticsDashboard.jsx"));
const DigitalTwinDashboard = React.lazy(() => import("../components/DigitalTwinDashboard.jsx"));

const advancedTabs = [
  {
    id: "analytics",
    label: "Analytics Dashboard",
    description: "Signals, trends, and behavioral analytics",
    icon: BarChart3
  },
  {
    id: "digital-twin",
    label: "Digital Twin",
    description: "Projection model and scenario intelligence",
    icon: BrainCircuit
  }
];

const LazyComponentFallback = () => (
  <div className="premium-route-loading">
    <p>Loading analytics...</p>
  </div>
);

export default function AdvancedArea() {
  const { assessment } = useAssessmentState();
  const { digitalTwin } = useHistoricalDataContext();
  const result = calculateFinancialHealthV2(assessment);
  const [activeTab, setActiveTab] = useState("analytics");

  return (
    <div className="premium-route-shell advanced-route">
      <section className="premium-route-hero">
        <div>
          <p className="premium-route-kicker">Advanced analytics</p>
          <h1>Deep analysis for your financial plan.</h1>
          <p>
            Move between detailed analytics and your financial projection without leaving the main
            dashboard.
          </p>
        </div>
      </section>

      <div className="advanced-area-tabs" role="tablist" aria-label="Advanced analytics views">
        {advancedTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`tab-button ${isActive ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={18} aria-hidden="true" />
              <span>
                <strong>{tab.label}</strong>
                <small>{tab.description}</small>
              </span>
            </button>
          );
        })}
      </div>

      <section className="premium-route-card advanced-route-panel">
        <Suspense fallback={<LazyComponentFallback />}>
          <ErrorBoundary>
            {activeTab === "analytics" ? (
              <AnalyticsDashboard result={result} />
            ) : (
              <DigitalTwinDashboard twin={digitalTwin} result={result} assessment={assessment} />
            )}
          </ErrorBoundary>
        </Suspense>
      </section>
    </div>
  );
}
