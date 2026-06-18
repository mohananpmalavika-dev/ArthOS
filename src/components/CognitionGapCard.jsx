import React from "react";

export function CognitionGapCard({ perceived = 0, actual = 0 }) {
  const gap = Math.abs(perceived - actual);

  return (
    <section className="cognition-gap-card result-card">
      <div className="result-heading">
        <h2>Your Money Awareness Check</h2>
      </div>

      <div className="cognition-grid">
        <div className="cog-item">
          <div className="cog-label">What You Think</div>
          <div className="cog-value">{perceived} months</div>
        </div>

        <div className="cog-item">
          <div className="cog-label">What's Actually True</div>
          <div className="cog-value">{actual} months</div>
        </div>

        <div className="cog-item gap">
          <div className="cog-label">The Gap</div>
          <div className="cog-value">{gap} months</div>
        </div>
      </div>
    </section>
  );
}

export default CognitionGapCard;
