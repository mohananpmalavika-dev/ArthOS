import React, { useMemo } from "react";
import { Zap, Brain, Users } from "lucide-react";

/**
 * TraitMatrixVisualizer — displays core personality traits and dimensions
 * with visual progress meters anchored to behavioral answers.
 *
 * This component directly maps answers from the assessment to three core dimensions:
 * - Impulse Delay Index: ability to wait/defer gratification (plannedPurchasesOnly, impulseWaitRule)
 * - Stress Avoidance Factor: tendency to spend when stressed (spendWhenStressed, emotionalMoneyLevel)
 * - Social Friction Elasticity: influence from social/peer pressure (socialInfluenceLevel, spendWhenBored)
 */
export default function TraitMatrixVisualizer({ result, assessment }) {
  if (!result || !assessment) {
    return null;
  }
  if (!result || !assessment) {
    return null;
  }

  const traitDimensions = useMemo(() => {
    // Extract behavioral answers
    const behaviour = assessment.behaviour || {};

    // === IMPULSE DELAY INDEX ===
    // Higher = better ability to defer (planned purchases, impulse wait rules)
    const plannedScore =
      (behaviour.plannedPurchasesOnly === "always"
        ? 10
        : behaviour.plannedPurchasesOnly === "often"
          ? 7.5
          : behaviour.plannedPurchasesOnly === "occasionally"
            ? 4.5
            : 0) || 0;
    const impulseWaitScore =
      (behaviour.impulseWaitRule === "always"
        ? 10
        : behaviour.impulseWaitRule === "sometimes"
          ? 7
          : behaviour.impulseWaitRule === "rarely"
            ? 4
            : 0) || 0;
    const impulseDelayIndex = Math.round(((plannedScore + impulseWaitScore) / 20) * 100);

    // === STRESS AVOIDANCE FACTOR ===
    // Lower = better (lower stress spend triggers)
    const spendStressScore =
      (behaviour.spendWhenStressed === "very_likely"
        ? 0
        : behaviour.spendWhenStressed === "sometimes"
          ? 5
          : behaviour.spendWhenStressed === "rarely"
            ? 7.5
            : 10) || 0;
    const emotionalScore =
      (behaviour.emotionalMoneyLevel === "extremely_emotional"
        ? 0
        : behaviour.emotionalMoneyLevel === "somewhat_emotional"
          ? 4
          : behaviour.emotionalMoneyLevel === "mostly_practical"
            ? 7.5
            : 10) || 0;
    const stressAvoidanceFactor = Math.round(((spendStressScore + emotionalScore) / 20) * 100);

    // === SOCIAL FRICTION ELASTICITY ===
    // Lower = better (less influenced by social/peer pressure)
    const socialInfluenceScore =
      (behaviour.socialInfluenceLevel === "heavily"
        ? 0
        : behaviour.socialInfluenceLevel === "sometimes"
          ? 4
          : behaviour.socialInfluenceLevel === "rarely"
            ? 7.5
            : 10) || 0;
    const spendBoredScore =
      (behaviour.spendWhenBored === "very_likely"
        ? 0
        : behaviour.spendWhenBored === "sometimes"
          ? 5
          : behaviour.spendWhenBored === "rarely"
            ? 7.5
            : 10) || 0;
    const socialFrictionElasticity = Math.round(
      ((socialInfluenceScore + spendBoredScore) / 20) * 100
    );

    return [
      {
        name: "Impulse Delay Index",
        score: impulseDelayIndex,
        description: "Ability to defer gratification and stick to plans",
        icon: Zap,
        color: "var(--purple)",
        bg: "var(--purple-10)"
      },
      {
        name: "Stress Avoidance Factor",
        score: stressAvoidanceFactor,
        description: "Resilience when stressed (higher is better)",
        icon: Brain,
        color: "var(--yellow)",
        bg: "var(--yellow-15)"
      },
      {
        name: "Social Friction Elasticity",
        score: socialFrictionElasticity,
        description: "Resistance to peer/social spending pressure",
        icon: Users,
        color: "var(--cyan)",
        bg: "var(--blue-08)"
      }
    ];
  }, [assessment.behaviour]);

  const avgTraitScore = Math.round(
    traitDimensions.reduce((sum, t) => sum + t.score, 0) / traitDimensions.length
  );

  return (
    <section className="trait-matrix-card">
      <div className="result-heading">
        <Brain size={19} />
        <div>
          <h2>Core Trait Profile</h2>
          <span>Your {result.personalityType || "Profile"} archetype dimensions</span>
        </div>
      </div>

      <div className="archetype-banner">
        <div className="archetype-name">
          <strong>{result.personalityType || "Unknown"}</strong>
          <span>{result.personalityReport?.strengths?.[0] || "Building financial resilience"}</span>
        </div>
        <div className="archetype-score">
          <span className="score-label">Trait Strength</span>
          <span className="score-value">{avgTraitScore}%</span>
        </div>
      </div>

      <div className="traits-grid">
        {traitDimensions.map(trait => {
          const Icon = trait.icon;
          return (
            <div key={trait.name} className="trait-item">
              <div className="trait-header">
                <div className="trait-icon-wrapper" style={{ backgroundColor: trait.bg }}>
                  <Icon size={18} color={trait.color} />
                </div>
                <div>
                  <h4>{trait.name}</h4>
                  <p>{trait.description}</p>
                </div>
              </div>

              <div className="trait-meter">
                <div className="meter-bar">
                  <div
                    className="meter-fill"
                    style={{
                      width: `${trait.score}%`,
                      backgroundColor: trait.color
                    }}
                  />
                </div>
                <span className="meter-label">{trait.score}%</span>
              </div>

              <div className="trait-interpretation">
                {trait.score >= 75
                  ? "✓ Strong position"
                  : trait.score >= 50
                    ? "○ Moderate position"
                    : "⚠ Needs attention"}
              </div>
            </div>
          );
        })}
      </div>

      <div className="trait-insights">
        <h4>What This Means</h4>
        <ul>
          {traitDimensions.map((trait, idx) => (
            <li key={idx}>
              <strong>{trait.name}:</strong> Currently at {trait.score}%. This reflects your ability
              to{" "}
              {trait.name.includes("Impulse") &&
                "make planned decisions without impulsive detours."}
              {trait.name.includes("Stress") && "manage spending when under pressure."}
              {trait.name.includes("Social") && "resist social spending triggers."}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
