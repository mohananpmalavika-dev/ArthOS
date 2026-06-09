// src/components/FinancialTwin.jsx
// Display personality archetype generated from behavior patterns

import { Sparkles, Award, Heart, Target, Zap } from "lucide-react";

const ARCHETYPES = {
  Builder: {
    icon: Target,
    color: "builder",
    description: "Strategic planner who builds wealth systematically",
    traits: ["Goal-oriented", "Disciplined", "Long-term focused"],
    strength: "Consistent progress toward financial goals",
    challenge: "Can be rigid when markets shift"
  },
  Survivor: {
    icon: Heart,
    color: "survivor",
    description: "Pragmatic protector focused on stability",
    traits: ["Risk-aware", "Security-first", "Adaptive"],
    strength: "Strong crisis management and resilience",
    challenge: "May miss growth opportunities"
  },
  Optimizer: {
    icon: Award,
    color: "optimizer",
    description: "Efficiency expert maximizing every rupee",
    traits: ["Detail-oriented", "Resourceful", "Analytical"],
    strength: "Exceptional cost optimization",
    challenge: "Can over-analyze minor decisions"
  },
  Dreamer: {
    icon: Sparkles,
    color: "dreamer",
    description: "Visionary pursuing ambitious financial dreams",
    traits: ["Creative", "Optimistic", "Forward-thinking"],
    strength: "Inspires action and innovation",
    challenge: "Needs better risk management"
  },
  Risk_Taker: {
    icon: Zap,
    color: "risk_taker",
    description: "Bold investor embracing calculated chances",
    traits: ["Confident", "Opportunistic", "Dynamic"],
    strength: "Quick decision-making in changing markets",
    challenge: "May overextend without safety nets"
  }
};

export default function FinancialTwin({ personalityType, behaviourScore, awarenessScore }) {
  const archetype = ARCHETYPES[personalityType] || ARCHETYPES.Survivor;
  const Icon = archetype.icon;

  // Normalize scores for visualization
  const behaviourNorm = Math.min((behaviourScore / 45) * 100, 100);
  const awarenessNorm = Math.min((awarenessScore / 30) * 100, 100);

  return (
    <section className="result-card financial-twin-card">
      <div className="result-heading">
        <Award size={19} />
        <h2>Your Financial Twin</h2>
      </div>

      {/* Main archetype display */}
      <div className="twin-archetype">
        <div className={`twin-icon-wrapper ${archetype.color}`}>
          <Icon size={48} />
        </div>
        
        <div className="twin-info">
          <h3 className="twin-title">{personalityType.replace(/_/g, " ")}</h3>
          <p className="twin-description">{archetype.description}</p>
        </div>
      </div>

      {/* Traits grid */}
      <div className="twin-traits">
        <span className="traits-label">Core Traits</span>
        <div className="traits-list">
          {archetype.traits.map((trait) => (
            <span key={trait} className="trait-badge">
              {trait}
            </span>
          ))}
        </div>
      </div>

      {/* Strength & Challenge */}
      <div className="twin-guidance">
        <div className="guidance-item strength">
          <span className="guidance-label">Your Strength</span>
          <p>{archetype.strength}</p>
        </div>
        <div className="guidance-item challenge">
          <span className="guidance-label">Area to Grow</span>
          <p>{archetype.challenge}</p>
        </div>
      </div>

      {/* Dimension scores */}
      <div className="twin-dimensions">
        <div className="dimension">
          <div className="dimension-header">
            <span className="dimension-name">Behaviour Control</span>
            <span className="dimension-score">{Math.round(behaviourNorm)}%</span>
          </div>
          <div className="dimension-bar">
            <div className="dimension-fill" style={{ width: `${behaviourNorm}%` }} />
          </div>
        </div>
        
        <div className="dimension">
          <div className="dimension-header">
            <span className="dimension-name">Financial Awareness</span>
            <span className="dimension-score">{Math.round(awarenessNorm)}%</span>
          </div>
          <div className="dimension-bar">
            <div className="dimension-fill" style={{ width: `${awarenessNorm}%` }} />
          </div>
        </div>
      </div>

      {/* Archetype intro */}
      <div className="twin-intro">
        <p>
          Based on your behavior patterns across {personalityType === "Builder" ? "goal-setting" : personalityType === "Survivor" ? "risk management" : personalityType === "Optimizer" ? "cost optimization" : personalityType === "Dreamer" ? "vision and ambition" : "decision speed"}, 
          you align most closely with <strong>The {personalityType.replace(/_/g, " ")}</strong> archetype.
        </p>
      </div>
    </section>
  );
}
