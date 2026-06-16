/**
 * Personality Type Constants & Archetypes
 * Centralized definitions for money personality archetypes
 * 
 * Naming Convention:
 * - getPersonalityType() returns Title Case: "Builder", "Survivor", "Optimizer", "Dreamer", "Risk Taker"
 * - ARCHETYPES keys: Title Case matching scoring output
 * - CSS color classes: lowercase with underscores (e.g., "risk_taker")
 * 
 * This ensures consistent naming across:
 * - Scoring engine (scoring-v2.js calculatePersonalityTypeV2)
 * - Component archetypes (FinancialTwin.jsx, SingleRecommendedAction.jsx)
 * - UI stylesheets (CSS classes: .twin-icon-wrapper.builder, etc.)
 */

import {
  Target,
  Heart,
  Award,
  Sparkles,
  Zap
} from "lucide-react";

/**
 * Personality archetypes with icon, traits, strength/challenge, and guidance
 */
export const ARCHETYPES = {
  Builder: {
    icon: Target,
    color: "builder",
    description: "Strategic planner who builds wealth systematically",
    traits: ["Goal-oriented", "Disciplined", "Long-term focused"],
    strength: "Consistent progress toward financial goals",
    challenge: "Can be rigid when markets shift",
    hiddenAdvantage: "Your systems turn slow progress into lasting momentum.",
    dangerZone: "Burnout from too much structure",
    recommendedRule: "Keep a flexible emergency bucket and review commitments quarterly."
  },
  Survivor: {
    icon: Heart,
    color: "survivor",
    description: "Pragmatic protector focused on stability",
    traits: ["Risk-aware", "Security-first", "Adaptive"],
    strength: "Strong crisis management and resilience",
    challenge: "May miss growth opportunities",
    hiddenAdvantage: "You stabilize turbulence before it becomes a crisis.",
    dangerZone: "Income shock after long-term stagnation",
    recommendedRule:
      "Build a basic buffer, then allocate a small growth bucket for higher confidence choices."
  },
  Optimizer: {
    icon: Award,
    color: "optimizer",
    description: "Efficiency expert maximizing every rupee",
    traits: ["Detail-oriented", "Resourceful", "Analytical"],
    strength: "Exceptional cost optimization",
    challenge: "Can over-analyze minor decisions",
    hiddenAdvantage: "Your attention to detail catches leaks before they drain your runway.",
    dangerZone: "Missing quick timing windows",
    recommendedRule: "Set clear review rituals and avoid overreacting to short-term spending noise."
  },
  Dreamer: {
    icon: Sparkles,
    color: "dreamer",
    description: "Visionary pursuing ambitious financial dreams",
    traits: ["Creative", "Optimistic", "Forward-thinking"],
    strength: "Inspires action and innovation",
    challenge: "Needs better risk management",
    hiddenAdvantage: "Your imagination helps you design a compelling future with clarity.",
    dangerZone: "Reality shock when plans meet cash flow",
    recommendedRule: "Translate aspirations into a concrete 30-day spending plan."
  },
  "Risk Taker": {
    icon: Zap,
    color: "risk_taker",
    description: "Bold investor embracing calculated chances",
    traits: ["Confident", "Opportunistic", "Dynamic"],
    strength: "Quick decision-making in changing markets",
    challenge: "May overextend without safety nets",
    hiddenAdvantage: "Your courage can capture opportunities others hesitate on.",
    dangerZone: "High-stress market or income swings",
    recommendedRule: "Pause major commitments and build a 2-month safety runway first."
  }
};

/**
 * Standardized personality type display names
 * Matches getPersonalityType() output from scoring-v2.js
 */
export const PERSONALITY_NAMES = {
  Builder: "Builder",
  Survivor: "Survivor",
  Optimizer: "Optimizer",
  Dreamer: "Dreamer",
  "Risk Taker": "Risk Taker"
};

/**
 * List of all personality type keys
 */
export const PERSONALITY_TYPES = Object.keys(PERSONALITY_NAMES);

/**
 * Default personality type (fallback)
 */
export const DEFAULT_PERSONALITY = "Optimizer";

/**
 * Get archetype by personality type name
 */
export function getArchetype(personalityType) {
  return ARCHETYPES[personalityType] || ARCHETYPES[DEFAULT_PERSONALITY];
}

/**
 * Get display name for personality type
 */
export function getPersonalityDisplayName(personalityType) {
  return PERSONALITY_NAMES[personalityType] || DEFAULT_PERSONALITY;
}

/**
 * Get CSS color class for personality type
 */
export function getPersonalityColorClass(personalityType) {
  const archetype = ARCHETYPES[personalityType];
  return archetype ? archetype.color : ARCHETYPES[DEFAULT_PERSONALITY].color;
}

export const ARCHETYPE_VARIANTS = {
  strategic_survivor: {
    label: "Strategic Survivor",
    description: "Grounded resilience combined with a plan to protect and grow in uncertainty.",
    signal: "Your stability and safety-first instincts create a protective edge.",
    basedOn: ["Survivor", "Risk Taker", "Dreamer"]
  },
  optimistic_builder: {
    label: "Optimistic Builder",
    description: "Systematic planning with enough flexibility to seize growth opportunities.",
    signal: "Your disciplined habits are ready for a more ambitious next chapter.",
    basedOn: ["Builder", "Optimizer"]
  },
  cautious_guardian: {
    label: "Cautious Guardian",
    description: "A practical watcher who values runway and avoids unnecessary risk.",
    signal: "You balance discipline with vigilance across your cash flow and decisions.",
    basedOn: ["Optimizer", "Survivor"]
  },
  future_architect: {
    label: "Future Architect",
    description: "Visionary momentum shaped by careful decisions and future-focused design.",
    signal: "You’re building a future self with both imagination and a backup plan.",
    basedOn: ["Dreamer", "Risk Taker", "Builder"]
  }
};

export function mapPersonalityToVariant(result = {}) {
  const personality = result.personalityType;
  if (!personality) {
    return ARCHETYPE_VARIANTS.optimistic_builder;
  }

  // Use score signals to choose a variant that fits current momentum.
  const stability = result.stabilityScore || 0;
  const awareness = result.awarenessIntegrityScore || 0;
  const confidence = result.futureConfidenceScore || 0;
  const futureRisk = result.futureRiskScore || 0;

  if (personality === "Survivor" || stability > awareness) {
    return confidence > 55 ? ARCHETYPE_VARIANTS.strategic_survivor : ARCHETYPE_VARIANTS.cautious_guardian;
  }

  if (personality === "Builder" || personality === "Optimizer") {
    return confidence > 60 ? ARCHETYPE_VARIANTS.optimistic_builder : ARCHETYPE_VARIANTS.cautious_guardian;
  }

  if (personality === "Dreamer" || personality === "Risk Taker") {
    return futureRisk >= 50 ? ARCHETYPE_VARIANTS.future_architect : ARCHETYPE_VARIANTS.optimistic_builder;
  }

  return ARCHETYPE_VARIANTS.optimistic_builder;
}

/**
 * Get icon component for personality type
 */
export function getPersonalityIcon(personalityType) {
  const archetype = ARCHETYPES[personalityType];
  return archetype ? archetype.icon : ARCHETYPES[DEFAULT_PERSONALITY].icon;
}
