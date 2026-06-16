import React from "react";
import { AlertTriangle, TrendingDown } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import {
  projectHealthTrajectory,
  getTrajectoryWarning
} from "../engines/consequenceForecastEngine.js";

/**
 * Consequence Forecast Component
 * Shows health score trajectory if current behavior continues
 * KEY FEATURE: Makes future risk visible and motivates intervention
 */
export function ConsequenceForecastCard({ result, assessment, forecast }) {
  const effectiveResult = result || forecast;
  const warningData = Array.isArray(forecast?.warnings) && forecast.warnings.length > 0
    ? forecast.warnings[0]
    : getTrajectoryWarning(effectiveResult);
  const trajectory = projectHealthTrajectory(effectiveResult);
  const forecastTimeline = forecast?.trajectory || trajectory.trajectoryData || [];
  const forecastGap = forecast?.gap || effectiveResult?.gap || {};
  const gapLabel = forecastGap.gap_size !== undefined
    ? `${forecastGap.gap_size} ${forecastGap.direction || ''}`.trim()
    : 'No gap data';

  if (!effectiveResult) {
    return (
      <section
        role="region"
        aria-labelledby="consequence-forecast-title"
        className="summary-card premium-report-block consequence-forecast-card"
      >
        <div className="premium-report-block-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <TrendingDown size={20} />
            <div>
              <h2 id="consequence-forecast-title" className="premium-report-block-title">
                Consequence Forecast
              </h2>
              <p className="premium-report-block-subtitle">No data available for forecast.</p>
            </div>
          </div>
        </div>

        <div className="forecast-empty-state">
          <p>No data available</p>
        </div>
      </section>
    );
  }

  return (
    <section
      role="region"
      aria-labelledby="consequence-forecast-title"
      className="summary-card premium-report-block consequence-forecast-card"
    >
      <div className="premium-report-block-header">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <TrendingDown size={20} />
          <div>
            <h2 id="consequence-forecast-title" className="premium-report-block-title">
              Consequence Forecast
            </h2>
            <p className="premium-report-block-subtitle">If current patterns continue...</p>
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      {warningData && (
        <div className={`trajectory-warning warning-${warningData.severity}`}>
          <AlertTriangle size={18} />
          <div>
            <strong>{warningData.message}</strong>
            <p>{warningData.recommendation || warningData.recommended_actions?.[0]}</p>
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
                color: "var(--white)"
              }}
              formatter={value => `${value.toFixed(1)}/100`}
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
          <span className="metric-label">6-month projection</span>
          <strong
            className={`metric-value ${trajectory.sixMonths < trajectory.today ? "decline" : "stable"}`}
            aria-label="In 6 Months"
          >
            {trajectory.sixMonths}
          </strong>
        </div>
        <div className="forecast-metric">
          <span className="metric-label">1-year projection</span>
          <strong
            className={`metric-value ${trajectory.oneYear < trajectory.today ? "decline" : "stable"}`}
            aria-label="In 1 Year"
          >
            {trajectory.oneYear}
          </strong>
        </div>
        <div className="forecast-metric">
          <span className="metric-label">2-year projection</span>
          <strong
            className={`metric-value ${trajectory.twoYears < trajectory.today ? "decline" : "stable"}`}
            aria-label="In 2 Years"
          >
            {trajectory.twoYears}
          </strong>
        </div>
      </div>

      <div className="forecast-summary">
        <div className="forecast-summary-title">Projection Timeline</div>
        <ul className="forecast-summary-list">
          {forecastTimeline.map((item, idx) => {
            const monthNumber = item.month ?? item.months ?? item.monthNumber;
            const monthsText = typeof monthNumber === 'number'
              ? `${monthNumber} months`
              : `${monthNumber || 'Unknown period'}`;
            const confidenceValue = typeof item.confidence === 'number'
              ? item.confidence > 1
                ? Math.round(item.confidence)
                : Math.round(item.confidence * 100)
              : item.confidence;
            const confidenceText = idx === 0 && item.confidence !== undefined
              ? ` • Confidence ${confidenceValue}%`
              : '';

            return (
              <li key={idx}>
                <strong>{monthsText}</strong>: {item.healthScore ?? item.projected_score} points
                {item.health_band ? ` (${item.health_band})` : ''}
                {confidenceText}
              </li>
            );
          })}
        </ul>
        <p className="forecast-gap-summary">Gap: {gapLabel}</p>
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
