import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { AlertTriangle, TrendingUp } from "lucide-react";

const easeOut = [0.22, 1, 0.36, 1];

export default function TrajectoryHeroVisual({ result, assessment, data }) {
  const [countedCurrent, setCountedCurrent] = useState(0);
  const [countedWorst, setCountedWorst] = useState(0);
  const [countedBest, setCountedBest] = useState(0);

  const trajectoryData = useMemo(() => {
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }

    // Simulate two paths: current (if no action) and recommended (if action taken)
    const currentTrajectory = [
      { year: "Now", current: 72, recommended: 72 },
      { year: "1Y", current: 70, recommended: 78 },
      { year: "3Y", current: 62, recommended: 85 },
      { year: "5Y", current: 48, recommended: 88 }
    ];

    return currentTrajectory;
  }, [data, result]);

  const currentScore = result?.healthScore ? Math.round(result.healthScore / 10) : 72;
  const projectedWorst = 48; // 5-year projection without action
  const projectedBest = 88; // 5-year projection with action

  useEffect(() => {
    const duration = 1200;
    const steps = 36;
    const interval = duration / steps;
    let frame = 0;
    const currentTarget = currentScore;
    const worstTarget = projectedWorst;
    const bestTarget = projectedBest;

    const timer = window.setInterval(() => {
      frame += 1;
      const progress = Math.min(1, frame / steps);
      const eased = 1 - Math.pow(1 - progress, 3);

      setCountedCurrent(Math.round(currentTarget * eased));
      setCountedWorst(Math.round(worstTarget * eased));
      setCountedBest(Math.round(bestTarget * eased));

      if (progress >= 1) {
        window.clearInterval(timer);
      }
    }, interval);

    return () => window.clearInterval(timer);
  }, [currentScore, projectedBest, projectedWorst]);

  return (
    <motion.section className="result-card trajectory-hero-card" style={{ padding: "32px" }} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: easeOut }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <p style={{ margin: 0, fontSize: "13px", color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          5-Year Financial Trajectory
        </p>
        <h2 style={{ margin: "12px 0 0", fontSize: "1.5rem", fontWeight: 700, color: "var(--ink-0)" }}>
          Your Future at a Glance
        </h2>
      </div>

      {/* Chart Container */}
      <div style={{ marginBottom: "32px", background: "var(--white)", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--gray-200)" }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: easeOut }}>
          <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trajectoryData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" vertical={false} />
            <XAxis
              dataKey="year"
              stroke="var(--ink-3)"
              style={{ fontSize: "0.85rem" }}
            />
            <YAxis
              domain={[40, 100]}
              label={{ value: "Readiness Score", angle: -90, position: "insideLeft" }}
              stroke="var(--ink-3)"
              style={{ fontSize: "0.85rem" }}
            />
            <Tooltip
              contentStyle={{
                background: "var(--white)",
                border: "1px solid var(--gray-300)",
                borderRadius: "8px",
                fontSize: "0.9rem"
              }}
              formatter={(value) => `${Math.round(value)}`}
            />
            <Legend
              wrapperStyle={{ paddingTop: "20px", fontSize: "0.9rem" }}
              iconType="line"
            />
            
            {/* Current path (declining) */}
            <Line
              type="monotone"
              dataKey="current"
              name="If No Action Taken"
              stroke="var(--red-500)"
              strokeWidth={3}
              dot={{ fill: "var(--red-500)", r: 5 }}
              activeDot={{ r: 7 }}
              isAnimationActive={true}
              animationDuration={1200}
              animationEasing="ease-out"
            />
            
            {/* Recommended path (improving) */}
            <Line
              type="monotone"
              dataKey="recommended"
              name="If You Take Action"
              stroke="var(--green-500)"
              strokeWidth={3}
              dot={{ fill: "var(--green-500)", r: 5 }}
              activeDot={{ r: 7 }}
              isAnimationActive={true}
              animationDuration={1300}
              animationEasing="ease-out"
            />
          </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "16px", marginBottom: "24px" }}>
        {/* Current State */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easeOut, delay: 0.1 }}
          style={{
            padding: "20px",
            borderRadius: "12px",
            background: "var(--blue-50)",
            border: "1px solid var(--blue-200)"
          }}
        >
          <p style={{ margin: 0, fontSize: "12px", color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
            Today
          </p>
          <h3 style={{ margin: "0 0 8px", fontSize: "2rem", fontWeight: 700, color: "var(--blue-600)" }}>
            {countedCurrent}
          </h3>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--ink-3)", lineHeight: 1.4 }}>
            Your current readiness score
          </p>
        </motion.div>

        {/* Without Action */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easeOut, delay: 0.18 }}
          style={{
            padding: "20px",
            borderRadius: "12px",
            background: "var(--red-50)",
            border: "1px solid var(--red-200)"
          }}
        >
          <p style={{ margin: 0, fontSize: "12px", color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
            In 5 Years (No Action)
          </p>
          <h3 style={{ margin: "0 0 8px", fontSize: "2rem", fontWeight: 700, color: "var(--red-600)" }}>
            {countedWorst}
          </h3>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--ink-3)", lineHeight: 1.4 }}>
            <strong style={{ color: "var(--red-600)" }}>-{currentScore - countedWorst}</strong> if patterns continue
          </p>
        </motion.div>

        {/* With Action */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easeOut, delay: 0.24 }}
          style={{
            padding: "20px",
            borderRadius: "12px",
            background: "var(--green-50)",
            border: "1px solid var(--green-200)"
          }}
        >
          <p style={{ margin: 0, fontSize: "12px", color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
            In 5 Years (With Action)
          </p>
          <h3 style={{ margin: "0 0 8px", fontSize: "2rem", fontWeight: 700, color: "var(--green-600)" }}>
            {countedBest}
          </h3>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--ink-3)", lineHeight: 1.4 }}>
            <strong style={{ color: "var(--green-600)" }}>+{countedBest - currentScore}</strong> with focused effort
          </p>
        </motion.div>
      </div>

      {/* Insight Cards */}
      <div style={{ display: "grid", gap: "12px" }}>
        {/* Risk */}
        <div
          style={{
            padding: "16px",
            borderRadius: "12px",
            background: "var(--orange-50)",
            border: "1px solid var(--orange-200)",
            display: "flex",
            gap: "12px"
          }}
        >
          <AlertTriangle size={20} style={{ color: "var(--orange-600)", flexShrink: 0, marginTop: "2px" }} />
          <div>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--ink-0)", fontWeight: 600 }}>
              Biggest Risk: Emergency Fund Failure
            </p>
            <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--ink-3)", lineHeight: 1.5 }}>
              Without a buffer, one unexpected expense becomes a financial crisis. This is your most critical leverage point.
            </p>
          </div>
        </div>

        {/* Opportunity */}
        <div
          style={{
            padding: "16px",
            borderRadius: "12px",
            background: "var(--green-50)",
            border: "1px solid var(--green-200)",
            display: "flex",
            gap: "12px"
          }}
        >
          <TrendingUp size={20} style={{ color: "var(--green-600)", flexShrink: 0, marginTop: "2px" }} />
          <div>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--ink-0)", fontWeight: 600 }}>
              Biggest Opportunity: Behavior Shift
            </p>
            <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--ink-3)", lineHeight: 1.5 }}>
              Your spending behavior can be redirected. Even ₹500/week redirected creates compounding resilience over 5 years.
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
