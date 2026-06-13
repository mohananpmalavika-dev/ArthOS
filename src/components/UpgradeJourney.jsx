import React from "react";
import { TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, ResponsiveContainer } from "recharts";

export default function UpgradeJourney({ result, currentScore }) {
  const journeyData = [
    { month: "Week 1", healthScore: Math.max(0, currentScore - 28) },
    { month: "Week 2", healthScore: Math.max(0, currentScore - 21) },
    { month: "Week 3", healthScore: Math.max(0, currentScore - 14) },
    { month: "Week 4", healthScore: Math.max(0, currentScore - 7) },
    { month: "Today", healthScore: currentScore },
  ];

  return (
    <section className="journey-card">
      <div className="result-heading">
        <TrendingUp size={19} />
        <div>
          <h2>Progress Journey</h2>
          <span>How your financial strength is trending</span>
        </div>
      </div>
      <div className="journey-chart-wrapper">
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={journeyData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="journeyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--purple)" stopOpacity={0.7} />
                <stop offset="100%" stopColor="var(--purple)" stopOpacity={0.08} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--white-76)", fontSize: 12 }} />
            <Area
              type="monotone"
              dataKey="healthScore"
              stroke="var(--purple)"
              strokeWidth={3}
              fill="url(#journeyGrad)"
              fillOpacity={1}
              activeDot={{ r: 5, fill: "var(--white)", stroke: "var(--purple)", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
