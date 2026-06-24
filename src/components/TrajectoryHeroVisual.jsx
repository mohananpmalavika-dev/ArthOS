import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { AlertTriangle, TrendingUp } from "lucide-react";
import { normalizeScore } from "../lib/scoring-v2";

// Restricted palette (Visual Design System)
// Allowed colors: #050713, #0B1220, cyan, purple, emerald, white


const easeOut = [0.22, 1, 0.36, 1];

export default function TrajectoryHeroVisual({ result, assessment, data }) {
  const [countedCurrent, setCountedCurrent] = useState(0);
  const [countedWorst, setCountedWorst] = useState(0);
  const [countedBest, setCountedBest] = useState(0);

  const currentScore = (typeof result?.healthScore === 'number' && !Number.isNaN(result.healthScore))
    ? normalizeScore(result.healthScore)
    : 72;
  const projectedWorst = Math.max(20, currentScore - 22);
  const projectedBest = Math.min(100, currentScore + 16);

  const trajectoryData = useMemo(() => {
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }

    const baseYear = 2026;
    return [
      { year: `${baseYear}`, current: currentScore, recommended: currentScore + 4 },
      { year: `${baseYear + 2}`, current: Math.max(20, currentScore - 6), recommended: Math.min(100, currentScore + 10) },
      { year: `${baseYear + 5}`, current: projectedWorst, recommended: projectedBest }
    ];
  }, [data, currentScore, projectedBest, projectedWorst]);

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
    <motion.section className="trajectory-hero-card large" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: easeOut }}>
      <div className="trajectory-hero-header">
        <div>
          <p className="trajectory-hero-small">YOU IN 2026</p>
          <h2 className="trajectory-hero-title">YOU IN 2031</h2>
        </div>
        <div className="trajectory-hero-legends">
          <span className="trajectory-path-chip current">Current Behaviour</span>
          <span className="trajectory-path-chip recommended">Recommended Behaviour</span>
        </div>
      </div>

      <div className="trajectory-chart-wrapper">
        <ResponsiveContainer width="100%" height={520}>
          <LineChart data={trajectoryData} margin={{ top: 20, right: 24, left: 0, bottom: 12 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <defs>
              <linearGradient id="glowGradient" x1="0" x2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="1" />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity="1" />
                <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="8" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </linearGradient>
              <linearGradient id="glowGradientPurple" x1="0" x2="1">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity="1" />
                <stop offset="100%" stopColor="#a78bfa" stopOpacity="1" />
              </linearGradient>
            </defs>
            <XAxis dataKey="year" stroke="white" tick={{ fontSize: 13 }} axisLine={false} tickLine={false} />
            <YAxis domain={[Math.max(20, currentScore - 30), Math.min(100, currentScore + 30)]} stroke="white" tick={{ fontSize: 13 }} axisLine={false} tickLine={false} />

            <Tooltip
              contentStyle={{
                background: "#050713",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 14,

                color: "white"
              }}
              labelStyle={{ color: "white" }}
              formatter={(value) => `${Math.round(value)}`}

            />
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ color: "white" }} />

            <Line
              type="monotone"
              dataKey="current"
              name="Current Behaviour"
              stroke="url(#glowGradient)" style={{ filter: 'url(#softGlow)' }}
              strokeWidth={5}
              dot={{ fill: "cyan", r: 6 }}
              activeDot={{ r: 8, fill: "cyan" }}
              animationDuration={0}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="recommended"
              name="Recommended Behaviour"
              stroke="url(#glowGradientPurple)" style={{ filter: 'url(#softGlow)' }}
              strokeWidth={5}
              dot={{ fill: "purple", r: 6 }}
              activeDot={{ r: 8, fill: "purple" }}
              animationDuration={0}
              isAnimationActive={false}
            />

          </LineChart>

        </ResponsiveContainer>
      </div>

      <div className="trajectory-number-row">
        <div className="trajectory-number-card">
          <p>Today</p>
          <strong>{countedCurrent}</strong>
        </div>
        <div className="trajectory-number-card">
          <p>No action</p>
          <strong>{countedWorst}</strong>
        </div>
        <div className="trajectory-number-card">
          <p>Recommended</p>
          <strong>{countedBest}</strong>
        </div>
      </div>
    </motion.section>
  );
}
