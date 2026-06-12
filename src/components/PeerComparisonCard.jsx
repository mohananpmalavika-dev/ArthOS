import React, { useMemo } from "react";
import { generatePeerDistribution, getPeerSummary, getPercentileEmoji } from "../engines/peerComparisonEngine.js";
import { BarChart, Bar, XAxis, ResponsiveContainer, YAxis, Tooltip, Cell } from "recharts";
import { Users } from "lucide-react";

/**
 * PeerComparisonCard — shows anonymized distribution of peer scores
 * and where the user falls within it.
 */
export default function PeerComparisonCard({ userScore }) {
  const peerData = useMemo(() => {
    if (userScore == null || userScore <= 0) return null;
    return generatePeerDistribution(userScore);
  }, [userScore]);

  if (!peerData) {
    return (
      <div className="peer-comparison-card">
        <div className="peer-card-header">
          <Users size={16} />
          <span>Peer Comparison</span>
        </div>
        <p className="peer-card-empty">Complete an assessment to see how you compare.</p>
      </div>
    );
  }

  const { userPercentile, buckets, stats } = peerData;
  const summary = getPeerSummary(userScore, userPercentile);
  const emoji = getPercentileEmoji(userPercentile);

  return (
    <div className="peer-comparison-card">
      <div className="peer-card-header">
        <Users size={16} />
        <span>Peer Comparison</span>
      </div>

      <div className="peer-percentile-badge">
        <span className="peer-percentile-emoji">{emoji}</span>
        <div className="peer-percentile-info">
          <strong>You're in the top {100 - userPercentile}%</strong>
          <span>Better than {userPercentile}% of peers</span>
        </div>
      </div>

      <p className="peer-summary">{summary}</p>

      <div className="peer-chart">
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={buckets} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--white-60)", fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              interval={1}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value) => [`${value} users`, "Count"]}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {buckets.map((entry, index) => {
                const rangeStart = parseInt(entry.label.split("-")[0]);
                const rangeEnd = parseInt(entry.label.split("-")[1]);
                const isUserBucket = userScore >= rangeStart && userScore <= rangeEnd;
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={isUserBucket ? "var(--purple)" : "var(--white-12)"}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="peer-stats-row">
        <div className="peer-stat">
          <span>Avg</span>
          <strong>{stats.average}</strong>
        </div>
        <div className="peer-stat">
          <span>Median</span>
          <strong>{stats.median}</strong>
        </div>
        <div className="peer-stat">
          <span>You</span>
          <strong style={{ color: "var(--purple)" }}>{userScore}</strong>
        </div>
        <div className="peer-stat">
          <span>Sample</span>
          <strong>{stats.sampleSize}</strong>
        </div>
      </div>
    </div>
  );
}
