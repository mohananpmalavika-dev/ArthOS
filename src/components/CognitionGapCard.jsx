import React from "react";

export function CognitionGapCard({ perceived = 0, actual = 0 }) {
  const gap = Math.abs(perceived - actual);

  return (
    <section className="cognition-gap-card result-card">
      <div className="result-heading">
        <h2>Financial Cognition Gap</h2>
      </div>

      <div className="cognition-grid">
        <div className="cog-item">
          <div className="cog-label">You Believe</div>
          <div className="cog-value">{perceived} months</div>
        </div>

        <div className="cog-item">
          <div className="cog-label">Reality</div>
          <div className="cog-value">{actual} months</div>
        </div>

        <div className="cog-item gap">
          <div className="cog-label">Gap</div>
          <div className="cog-value">{gap} months</div>
        </div>
      </div>
    </section>
  );
}

export default CognitionGapCard;
