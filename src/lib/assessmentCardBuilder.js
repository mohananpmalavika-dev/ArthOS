/**
 * Live Assessment Insight Card Builder
 * Constructs dynamic insight cards from assessment results
 */

import {
  Brain,
  BarChart3,
  ShieldCheck,
  Target
} from "lucide-react";

/**
 * Build live insight cards from assessment result and user responses
 * Shows real-time behavioral patterns, spending signals, risk exposure, focus areas
 */
export function buildLiveInsightCards(result = {}, assessment = {}) {
  const safeResult = result || {};
  const safeAssessment = assessment || {};
  const lowestComponent = safeResult.componentRows?.[0];
  const stressPattern = safeAssessment.behaviour?.spendWhenStressed;
  const impulsePattern = safeAssessment.behaviour?.regretImpulseFreq;
  const planState = safeAssessment.awareness?.hasFinancialPlan;
  const focusLabel = lowestComponent?.label ?? "Behaviour";

  return [
    {
      icon: Brain,
      title: "Behavior Pattern",
      copy: `${safeResult.personalityType ?? "Current"} profile detected from your active responses.`,
      time: "Live now",
      tone: "purple"
    },
    {
      icon: BarChart3,
      title: "Spending Signal",
      copy: stressPattern
        ? `Stress-spend response is currently marked ${stressPattern.replaceAll("_", " ")}.`
        : "Answer emotion prompts to reveal stress-spend patterns.",
      time: "Live now",
      tone: "cyan"
    },
    {
      icon: ShieldCheck,
      title: "Risk Exposure",
      copy: `${safeResult.futureRiskLabel ?? "Risk"} based on your current stability inputs.`,
      time: "Live now",
      tone: "purple"
    },
    {
      icon: Target,
      title: "Focus Opportunity",
      copy: `${focusLabel} is the next area to strengthen as your answers update.`,
      time: planState || impulsePattern ? "Live now" : "Needs input",
      tone: "cyan"
    }
  ];
}

/**
 * Map assessment sections to their corresponding icons
 */
export const SECTION_ICONS = {
  behaviour: Brain,
  awareness: BarChart3,
  stability: ShieldCheck
};

/**
 * Options for income stability dropdown
 */
export const INCOME_STABILITY_OPTIONS = [
  { value: "very_consistent", label: "Very consistent" },
  { value: "mostly_consistent", label: "Mostly consistent" },
  { value: "somewhat_variable", label: "Somewhat variable" },
  { value: "highly_variable", label: "Highly variable" }
];

/**
 * Options for dependents count dropdown
 */
export const DEPENDENTS_OPTIONS = [
  { value: "0_1", label: "0-1" },
  { value: "2_3", label: "2-3" },
  { value: "4_5", label: "4-5" },
  { value: "6_plus", label: "6+" }
];
