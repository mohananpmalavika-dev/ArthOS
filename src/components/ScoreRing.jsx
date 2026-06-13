import React from "react";
import PropTypes from "prop-types";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

function ScoreRing({ score }) {
  const normalizedScore = Math.max(0, Math.min(100, Number(score) || 0));
  const ringData = [
    { value: normalizedScore },
    { value: 100 - normalizedScore },
  ];

  return (
    <div className="score-ring-chart" style={{ "--score": normalizedScore }}>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={ringData}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
            innerRadius={72}
            outerRadius={96}
            paddingAngle={3}
          >
            <Cell fill="var(--purple-96)" />
            <Cell fill="var(--white-08)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="score-ring-label">
        <strong>{normalizedScore}</strong>
        <small>/100</small>
      </div>
    </div>
  );
}

ScoreRing.propTypes = {
  score: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

ScoreRing.defaultProps = {
  score: 0,
};

export default ScoreRing;
