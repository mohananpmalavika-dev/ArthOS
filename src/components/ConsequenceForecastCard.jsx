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
    <section className="result-card consequence-forecast-card">
      <div className="result-heading">
        <TrendingDown size={20} />
        <div>
          <h2>Health Trajectory</h2>
          <span className="forecast-subtitle">If current patterns continue...</span>
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
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="month"
              stroke="#94a3b8"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              domain={[0, 100]}
              stroke="#94a3b8"
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "6px",
                color: "#fff",
              }}
              formatter={(value) => `${value.toFixed(1)}/100`}
            />
            <Line
              type="monotone"
              dataKey="healthScore"
              stroke="#8b5cf6"
              strokeWidth={3}
              dot={{ fill: "#8b5cf6", r: 5 }}
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
          <span style={{ fontSize: "12px", color: "#64748b" }}>
            (Based on your behaviour, awareness, and stability patterns)
          </span>
        </p>
      </div>

      {/* Call to Action */}
      <div className="forecast-cta">
        <p>This trajectory assumes no changes. Below are interventions to reverse the trend.</p>
      </div>

      <style>{`
        .consequence-forecast-card {
          border-left: 4px solid #f97316;
        }

        .forecast-subtitle {
          font-size: 13px;
          color: #64748b;
        }

        .trajectory-warning {
          display: flex;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 13px;
        }

        .trajectory-warning strong {
          display: block;
          margin-bottom: 4px;
        }

        .trajectory-warning p {
          margin: 0;
          opacity: 0.9;
        }

        .warning-critical {
          background: #fee2e2;
          border: 1px solid #fca5a5;
          color: #7f1d1d;
        }

        .warning-high {
          background: #fef08a;
          border: 1px solid #fde047;
          color: #78350f;
        }

        .warning-moderate {
          background: #dbeafe;
          border: 1px solid #93c5fd;
          color: #0c2d6b;
        }

        .forecast-chart-container {
          margin: 16px 0;
          background: #f9fafb;
          border-radius: 8px;
          padding: 12px;
        }

        .forecast-metrics {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin: 16px 0;
        }

        .forecast-metric {
          background: #f3f4f6;
          padding: 12px;
          border-radius: 8px;
          text-align: center;
        }

        .metric-label {
          font-size: 11px;
          color: #64748b;
          text-transform: uppercase;
          font-weight: 600;
          display: block;
          margin-bottom: 6px;
        }

        .metric-value {
          font-size: 20px;
          display: block;
        }

        .metric-value.current {
          color: #7c3aed;
        }

        .metric-value.decline {
          color: #ef4444;
        }

        .metric-value.stable {
          color: #10b981;
        }

        .forecast-narrative {
          background: #f0f9ff;
          padding: 14px;
          border-radius: 6px;
          margin: 14px 0;
          border-left: 3px solid #06b6d4;
        }

        .consequence-text {
          font-size: 14px;
          margin: 0 0 10px 0;
          color: #0c4a6e;
          line-height: 1.5;
        }

        .decay-rate-text {
          font-size: 12px;
          color: #64748b;
          margin: 0;
        }

        .forecast-cta {
          background: #f5f3ff;
          padding: 12px;
          border-radius: 6px;
          font-size: 13px;
          color: #6b21a8;
          margin-top: 12px;
        }
      `}</style>
    </section>
  );
}

export default ConsequenceForecastCard;
