import React from "react";
import { AlertTriangle, TrendingDown } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { projectHealthTrajectory, getTrajectoryWarning } from "../engines/consequenceForecastEngine.js";

/**
 * Consequence Forecast Component
 * Shows health score trajectory if current behavior continues
 * KEY FEATURE: Makes future risk visible and motivates intervention
 */
export function ConsequenceForecastCard({ result, assessment }) {
  if (!result) {
    return null;
  }

  const trajectory = projectHealthTrajectory(result);
  const warning = getTrajectoryWarning(result);

  return (
    <section className="summary-card premium-report-block consequence-forecast-card">
      <div className="premium-report-block-header">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <TrendingDown size={20} />
          <div>
            <h2 className="premium-report-block-title">Health Trajectory</h2>
            <p className="premium-report-block-subtitle">If current patterns continue...</p>
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      {warning && (
        <div className={`trajectory-warning warning-${warning.severity}`}>
          <AlertTriangle size={18} />
          <div>
            <strong>{warning.message}</strong>
            <p>{warning.recommendation}</p>
          </div>
        </div>
      )}

      {/* Main Chart */}
      <div className="forecast-chart-container">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={trajectory.trajectoryData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--muted-18)" />
            <XAxis
              dataKey="month"
              stroke="var(--muted)"
              tick={{ fontSize: 12, fill: "var(--muted)" }}
            />
            <YAxis
              domain={[0, 100]}
              stroke="var(--muted)"
              tick={{ fontSize: 12, fill: "var(--muted)" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--surface-3)",
                border: "1px solid var(--gray-700)",
                borderRadius: "6px",
                color: "var(--white)",
              }}
              formatter={(value) => `${value.toFixed(1)}/100`}
            />
            <Line
              type="monotone"
              dataKey="healthScore"
              stroke="var(--purple)"
              strokeWidth={3}
              dot={{ fill: "var(--purple)", r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Key Metrics */}
      <div className="forecast-metrics">
        <div className="forecast-metric">
          <span className="metric-label">Today</span>
          <strong className="metric-value current">{trajectory.today}</strong>
        </div>
        <div className="forecast-metric">
          <span className="metric-label">In 6 Months</span>
          <strong className={`metric-value ${trajectory.sixMonths < trajectory.today ? "decline" : "stable"}`}>
            {trajectory.sixMonths}
          </strong>
        </div>
        <div className="forecast-metric">
          <span className="metric-label">In 1 Year</span>
          <strong className={`metric-value ${trajectory.oneYear < trajectory.today ? "decline" : "stable"}`}>
            {trajectory.oneYear}
          </strong>
        </div>
        <div className="forecast-metric">
          <span className="metric-label">In 2 Years</span>
          <strong className={`metric-value ${trajectory.twoYears < trajectory.today ? "decline" : "stable"}`}>
            {trajectory.twoYears}
          </strong>
        </div>
      </div>

      {/* Narrative */}
      <div className="forecast-narrative">
        <p className="consequence-text">{trajectory.consequence}</p>
        <p className="decay-rate-text">
          Monthly decay rate: <strong>{trajectory.decayRate}%</strong>
          <br />
          <span className="forecast-footnote">
            (Based on your behaviour, awareness, and stability patterns)
          </span>
        </p>
      </div>

      {/* Call to Action */}
      <div className="forecast-cta">
        <p>This trajectory assumes no changes. Below are interventions to reverse the trend.</p>
      </div>
    </section>
  );
}

export default ConsequenceForecastCard;
