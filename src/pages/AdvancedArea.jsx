import React, { Suspense, useState } from "react";
import { useAssessmentState } from "../hooks/useAssessmentState.js";
import { calculateFinancialHealthV2 } from "../lib/scoring-v2.js";
import { useHistoricalDataContext } from "../context/HistoricalDataContext.jsx";
import ErrorBoundary from "../components/ErrorBoundary.jsx";

const AnalyticsDashboard = React.lazy(() => import("../components/AnalyticsDashboard.jsx"));
const DigitalTwinDashboard = React.lazy(() => import("../components/DigitalTwinDashboard.jsx"));

const LazyComponentFallback = () => (
  <div style={{ padding: 32, textAlign: "center", color: "#999" }}>
    <p>Loading analytics...</p>
  </div>
);

export default function AdvancedArea() {
  const { assessment } = useAssessmentState();
  const { digitalTwin } = useHistoricalDataContext();
  const result = calculateFinancialHealthV2(assessment);
  const [activeTab, setActiveTab] = useState("analytics");

  return (
    <div style={{ padding: 24 }}>
      <h1>Advanced Analytics Hub</h1>
      <p>
        Comprehensive view of your financial metrics, digital twin projection, and analytical deep-dives.
      </p>

      {/* Tab Navigation */}
      <div className="advanced-area-tabs">
        <button
          className={`tab-button ${activeTab === "analytics" ? "active" : ""}`}
          onClick={() => setActiveTab("analytics")}
        >
          Analytics Dashboard
        </button>
        <button
          className={`tab-button ${activeTab === "digital-twin" ? "active" : ""}`}
          onClick={() => setActiveTab("digital-twin")}
        >
          Digital Twin
        </button>
      </div>

      {/* Analytics Content */}
      {activeTab === "analytics" && (
        <div style={{ marginTop: 24 }}>
          <Suspense fallback={<LazyComponentFallback />}>
            <ErrorBoundary>
              <AnalyticsDashboard result={result} />
            </ErrorBoundary>
          </Suspense>
        </div>
      )}

      {/* Digital Twin Content */}
      {activeTab === "digital-twin" && (
        <div style={{ marginTop: 24 }}>
          <Suspense fallback={<LazyComponentFallback />}>
            <ErrorBoundary>
              <DigitalTwinDashboard twin={digitalTwin} result={result} assessment={assessment} />
            </ErrorBoundary>
          </Suspense>
        </div>
      )}
    </div>
  );
}
