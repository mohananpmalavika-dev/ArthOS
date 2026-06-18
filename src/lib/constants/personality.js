/**
 * Money Style Constants & Archetypes
 * Centralized definitions for money style archetypes
 *
 * Naming Convention:
 * - getPersonalityType() returns Title Case: "Planner", "Protector", "Smart Saver", "Dreamer", "Bold Investor"
 * - ARCHETYPES keys: Title Case matching scoring output
 * - CSS color classes: lowercase with underscores (e.g., "bold_investor")
 *
 * This ensures consistent naming across:
 * - Scoring engine (scoring-v2.js calculatePersonalityTypeV2)
 * - Component archetypes (FinancialTwin.jsx, SingleRecommendedAction.jsx)
 * - UI stylesheets (CSS classes: .twin-icon-wrapper.planner, etc.)
 */

import {
  Target,
  Heart,
  Award,
  Sparkles,
  Zap
} from "lucide-react";

/**
 * Money style archetypes with icon, traits, strength/challenge, and guidance
 */
export const ARCHETYPES = {
  Planner: {
    icon: Target,
    color: "planner",
    description: "You plan ahead and build wealth step by step",
    traits: ["Goal-oriented", "Disciplined", "Long-term focused"],
    strength: "You reach your money goals consistently",
    challenge: "You might be too strict when things change",
    hiddenAdvantage: "Your systems turn small steps into big wins.",
    dangerZone: "Burnout from being too rigid",
    recommendedRule: "Keep some money flexible and check your plan every 3 months."
  },
  Protector: {
    icon: Heart,
    color: "protector",
    description: "You focus on safety and staying stable with money",
    traits: ["Risk-aware", "Security-first", "Adaptive"],
    strength: "You handle money problems well and bounce back",
    challenge: "You might miss chances to grow your money",
    hiddenAdvantage: "You stop problems before they get big.",
    dangerZone: "Money stops growing after not improving for a long time",
    recommendedRule:
      "Build a safety cushion first, then put a small part into something that grows."
  },
  "Smart Saver": {
    icon: Award,
    color: "smart_saver",
    description: "You get the most out of every rupee",
    traits: ["Detail-oriented", "Resourceful", "Analytical"],
    strength: "You find ways to spend less",
    challenge: "You might overthink small spending decisions",
    hiddenAdvantage: "You spot money leaks before they drain your savings.",
    dangerZone: "Missing good opportunities because you wait too long",
    recommendedRule: "Check your progress regularly and don’t react to small daily changes."
  },
  Dreamer: {
    icon: Sparkles,
    color: "dreamer",
    description: "You dream big about your money future",
    traits: ["Creative", "Optimistic", "Forward-thinking"],
    strength: "You inspire yourself and others to try new things",
    challenge: "You need to plan better for risks",
    hiddenAdvantage: "You imagine a clear and exciting money future.",
    dangerZone: "Reality check when your plans meet real money",
    recommendedRule: "Turn your dreams into a real plan you can follow this month."
  },
  "Bold Investor": {
    icon: Zap,
    color: "bold_investor",
    description: "You take smart chances with your money",
    traits: ["Confident", "Opportunistic", "Dynamic"],
    strength: "You make fast decisions when money opportunities come up",
    challenge: "You might risk too much without a backup plan",
    hiddenAdvantage: "You jump on chances that careful people miss.",
    dangerZone: "Money stress when things happen suddenly",
    recommendedRule: "Build a safety fund for 2 months before making big money moves."
  }
};

/**
 * Standardized money style display names
 * Matches getPersonalityType() output from scoring-v2.js
 */
export const PERSONALITY_NAMES = {
  Planner: "Planner",
  Protector: "Protector",
  "Smart Saver": "Smart Saver",
  Dreamer: "Dreamer",
  "Bold Investor": "Bold Investor"
};

/**
 * List of all money style keys
 */
export const PERSONALITY_TYPES = Object.keys(PERSONALITY_NAMES);

/**
 * Default money style (fallback)
 */
export const DEFAULT_PERSONALITY = "Smart Saver";

/**
 * Get archetype by money style name
 */
export function getArchetype(personalityType) {
  return ARCHETYPES[personalityType] || ARCHETYPES[DEFAULT_PERSONALITY];
}

/**
 * Get display name for money style
 */
export function getPersonalityDisplayName(personalityType) {
  return PERSONALITY_NAMES[personalityType] || DEFAULT_PERSONALITY;
}

/**
 * Get CSS color class for money style
 */
export function getPersonalityColorClass(personalityType) {
  const archetype = ARCHETYPES[personalityType];
  return archetype ? archetype.color : ARCHETYPES[DEFAULT_PERSONALITY].color;
}

export const ARCHETYPE_VARIANTS = {
  strategic_survivor: {
    label: "Stable & Smart",
    description: "You’re grounded and steady with a plan to protect and grow.",
    signal: "Your safety instincts give you an edge.",
    basedOn: ["Protector", "Bold Investor", "Dreamer"]
  },
  optimistic_builder: {
    label: "Planner & Flexible",
    description: "You plan step-by-step and stay open to growth chances.",
    signal: "Your habits are ready for bigger money goals.",
    basedOn: ["Planner", "Smart Saver"]
  },
  cautious_guardian: {
    label: "Careful & Steady",
    description: "You watch your money closely and avoid big risks.",
    signal: "You balance planning with careful watching.",
    basedOn: ["Smart Saver", "Protector"]
  },
  future_architect: {
    label: "Visionary & Prepared",
    description: "You dream big with careful decisions backing it up.",
    signal: "You’re building your future with both imagination and a backup plan.",
    basedOn: ["Dreamer", "Bold Investor", "Planner"]
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

  if (personality === "Protector" || stability > awareness) {
    return confidence > 55 ? ARCHETYPE_VARIANTS.strategic_survivor : ARCHETYPE_VARIANTS.cautious_guardian;
  }

  if (personality === "Planner" || personality === "Smart Saver") {
    return confidence > 60 ? ARCHETYPE_VARIANTS.optimistic_builder : ARCHETYPE_VARIANTS.cautious_guardian;
  }

  if (personality === "Dreamer" || personality === "Bold Investor") {
    return futureRisk >= 50 ? ARCHETYPE_VARIANTS.future_architect : ARCHETYPE_VARIANTS.optimistic_builder;
  }

  return ARCHETYPE_VARIANTS.optimistic_builder;
}

/**
 * Get icon component for money style
 */
export function getPersonalityIcon(personalityType) {
  const archetype = ARCHETYPES[personalityType];
  return archetype ? archetype.icon : ARCHETYPES[DEFAULT_PERSONALITY].icon;
}
