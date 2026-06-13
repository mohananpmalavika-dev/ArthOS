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

/**
 * Get icon component for personality type
 */
export function getPersonalityIcon(personalityType) {
  const archetype = ARCHETYPES[personalityType];
  return archetype ? archetype.icon : ARCHETYPES[DEFAULT_PERSONALITY].icon;
}
