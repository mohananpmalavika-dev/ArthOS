import React from "react";
import { ShieldCheck } from "lucide-react";
import { componentMaximumsV2 } from "../lib/scoring-v2.js";

export default function FinancialDNA({ result }) {
  if (!result) return null;

  const behaviourPct = Math.min(100, Math.round((result.behaviourScore / componentMaximumsV2.behaviour) * 100));
  const awarenessPct = Math.min(100, Math.round((result.awarenessScore / componentMaximumsV2.awareness) * 100));
  const stabilityPct = Math.min(100, Math.round((result.stabilityScore / componentMaximumsV2.stability) * 100));

  const dnaMetrics = [
    { label: "Behavioral Control", value: behaviourPct },
    { label: "Awareness Clarity", value: awarenessPct },
    { label: "Financial Stability", value: stabilityPct },
  ];

  return (
    <section className="financial-dna-card">
      <div className="result-heading">
        <ShieldCheck size={19} />
        <div>
          <h2>Financial DNA</h2>
          <span>Why your money profile behaves this way</span>
        </div>
      </div>
      <div className="dna-grid">
        {dnaMetrics.map((item) => (
          <div className="dna-item" key={item.label}>
            <div>
              <span>{item.label}</span>
              <strong>{item.value}%</strong>
            </div>
            <div className="dna-track" aria-hidden="true">
              <span style={{ width: `${item.value}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
