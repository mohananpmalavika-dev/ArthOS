/**
 * Intervention Engine
 * Generates prescriptions based on assessment gaps
 * This is Layer 3 of the BAS Framework: Prescription
 *
 * Different interventions for different lowest components
 */

import {
  isComponentKey,
  normalizeComponentKey,
  getComponentMaxScore,
  getComponentLabel,
  extractComponentKey
} from "../lib/scoringHelpers.js";

/**
 * All available interventions (categorized by target)
 */
const interventionCatalog = {
  behaviour: [
    {
      id: "no-spend-weekend",
      title: "No-Spend Weekend Challenge",
      description:
        "Commit to 48 hours with zero non-essential purchases. Log every impulse you resist.",
      impact: "+4 Behaviour",
      difficulty: "Easy",
      duration: "2 days",
      frequency: "Weekly"
    },
    {
      id: "impulse-wait-rule",
      title: "24-Hour Waiting Rule",
      description:
        "Delay every non-essential purchase by 24 hours. Track what you still want after waiting.",
      impact: "+6 Behaviour",
      difficulty: "Medium",
      duration: "Daily habit",
      frequency: "Every purchase"
    },
    {
      id: "trigger-elimination",
      title: "Remove One Spending Trigger",
      description:
        "Delete one shopping app, unsubscribe from one retailer, or avoid one shopping location.",
      impact: "+5 Behaviour",
      difficulty: "Easy",
      duration: "1 week",
      frequency: "One-time"
    },
    {
      id: "cash-envelope",
      title: "Cash Envelope for Discretionary Spending",
      description: "Withdraw your weekly discretionary budget in cash. Spend only from envelope.",
      impact: "+7 Behaviour",
      difficulty: "Hard",
      duration: "4 weeks",
      frequency: "Weekly reset"
    },
    {
      id: "stress-spend-alternative",
      title: "Find Non-Financial Stress Relief",
      description:
        "Replace spending with 3 zero-cost stress management activities (walk, music, meditation).",
      impact: "+5 Behaviour",
      difficulty: "Medium",
      duration: "2 weeks",
      frequency: "When stressed"
    }
  ],

  awareness: [
    {
      id: "expense-audit",
      title: "14-Day Expense Audit",
      description: "Log every single transaction for 2 weeks. Identify top 5 spending categories.",
      impact: "+6 Awareness",
      difficulty: "Medium",
      duration: "14 days",
      frequency: "One-time"
    },
    {
      id: "bank-statement-review",
      title: "Monthly Bank Statement Deep Dive",
      description:
        "Review last 3 months of statements. Find spending patterns you didn't know about.",
      impact: "+5 Awareness",
      difficulty: "Easy",
      duration: "1 hour",
      frequency: "Monthly"
    },
    {
      id: "debt-clarity",
      title: "Debt Inventory Mapping",
      description:
        "List every debt: amount, rate, minimum payment, payoff date. Compare to your stated knowledge.",
      impact: "+7 Awareness",
      difficulty: "Medium",
      duration: "30 minutes",
      frequency: "Quarterly"
    },
    {
      id: "subscription-audit",
      title: "Subscription & Recurring Charge Audit",
      description: "Find all recurring charges. Cancel those you don't actively use.",
      impact: "+4 Awareness",
      difficulty: "Easy",
      duration: "20 minutes",
      frequency: "Monthly"
    },
    {
      id: "savings-tracking",
      title: "Set Up Automated Savings Tracking",
      description:
        "Link to a savings tracker app or spreadsheet. Automate weekly savings rate calculation.",
      impact: "+6 Awareness",
      difficulty: "Easy",
      duration: "30 minutes",
      frequency: "Set once"
    }
  ],

  stability: [
    {
      id: "emergency-fund-start",
      title: "Start Emergency Fund (1000 INR Goal)",
      description: "Save 1000 INR this month. This is your first financial shock buffer.",
      impact: "+4 Stability",
      difficulty: "Medium",
      duration: "1 month",
      frequency: "Monthly"
    },
    {
      id: "debt-paydown",
      title: "Accelerated Debt Paydown Sprint",
      description:
        "Put 10% of this month's income toward highest-rate debt. Track paydown trajectory.",
      impact: "+6 Stability",
      difficulty: "Hard",
      duration: "Ongoing",
      frequency: "Monthly"
    },
    {
      id: "income-stability-plan",
      title: "Map Income Stability & Risks",
      description:
        "Document your income sources. Identify which could fail and develop 3-month contingency.",
      impact: "+5 Stability",
      difficulty: "Medium",
      duration: "1 hour",
      frequency: "Quarterly"
    },
    {
      id: "side-income-exploration",
      title: "Explore 1 New Income Stream",
      description:
        "Research one way to add 2000-5000 INR/month. Reduce dependence on primary income.",
      impact: "+7 Stability",
      difficulty: "Hard",
      duration: "2 weeks",
      frequency: "As needed"
    },
    {
      id: "liability-review",
      title: "Review & Reduce Fixed Liabilities",
      description:
        "Renegotiate insurance, subscriptions, or contracts. Target 5-10% reduction in fixed costs.",
      impact: "+5 Stability",
      difficulty: "Medium",
      duration: "2 weeks",
      frequency: "Quarterly"
    }
  ]
};

/**
 * Generate personalized interventions based on assessment results
 * Prioritizes the lowest-scoring component
 */
export function generateInterventions(result, assessment) {
  if (!result || !result.componentRows) {
    return {
      primary: [],
      secondary: [],
      reasoning: "Unable to assess intervention needs."
    };
  }

  // Find lowest component
  const lowestComponent = result.componentRows[0];
  const secondLowestComponent = result.componentRows[1];

  if (!lowestComponent) {
    return { primary: [], secondary: [], reasoning: "No components to analyze." };
  }

  // Get 3 interventions for primary (lowest) component
  const primary = getTopInterventions(lowestComponent.key, assessment, 3);

  // Get 1-2 interventions for secondary component
  const secondary = getTopInterventions(secondLowestComponent?.key || "behaviour", assessment, 2);

  return {
    primary,
    secondary,
    primaryComponent: lowestComponent.label,
    primaryGap: 100 - lowestComponent.percent,
    reasoning: buildReasoningNarrative(lowestComponent, result)
  };
}

/**
 * Select best interventions for a given component
 * Filters by difficulty and assessment context
 */
function getTopInterventions(componentKey, assessment, count) {
  const normalizedKey = normalizeComponentKey(componentKey);
  const interventions = interventionCatalog[normalizedKey] || [];

  // Score interventions based on assessment fit
  const scored = interventions.map(intervention => {
    let relevanceScore = 1;

    // Adjust difficulty based on user's impulse control
    if (
      isComponentKey(normalizedKey, "behaviour") &&
      assessment?.behaviour?.impulseWaitRule === "never"
    ) {
      if (intervention.difficulty === "Easy") {
        relevanceScore += 0.5;
      }
    }

    // Prefer quick wins if awareness is very low
    if (
      isComponentKey(normalizedKey, "awareness") &&
      assessment?.awareness?.tracksExpenses === "never"
    ) {
      if (intervention.duration === "1 hour" || intervention.duration === "20 minutes") {
        relevanceScore += 0.5;
      }
    }

    return { ...intervention, relevanceScore };
  });

  // Sort by relevance and return top N
  return scored
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, count)
    .map(({ relevanceScore, ...intervention }) => intervention);
}

/**
 * Build natural language explanation of why these interventions
 */
function buildReasoningNarrative(lowestComponent, result) {
  const componentKey = normalizeComponentKey(
    lowestComponent.key || lowestComponent.label
  );
  const maxScore = getComponentMaxScore(componentKey);
  const gap = 100 - lowestComponent.percent;

  if (isComponentKey(componentKey, "behaviour")) {
    return `Your behaviour score is the lowest at ${lowestComponent.score}/${maxScore}. This suggests impulse control and spending discipline are where you can create the fastest improvement. Start with one small behaviour intervention.`;
  }

  if (isComponentKey(componentKey, "awareness")) {
    return `Your awareness score is the lowest at ${lowestComponent.score}/${maxScore}. You likely have spending blindspots or lack clarity on your financial position. These interventions focus on visibility first.`;
  }

  if (isComponentKey(componentKey, "stability")) {
    return `Your stability score is the lowest at ${lowestComponent.score}/${maxScore}. Emergency reserves and income resilience need strengthening. Stability interventions build your financial shock buffer.`;
  }

  return `Your ${lowestComponent.label || componentKey} score needs the most attention. These interventions are tailored to address that specific gap.`;
}

/**
 * Get estimated impact of completing an intervention
 * Used for progress visualization
 */
export function estimateInterventionImpact(intervention, currentComponentScore, maxComponentScore) {
  const impactText = intervention.impact;
  const match = impactText.match(/([+-]?)(\d+)/);

  if (!match) {
    return currentComponentScore;
  }

  const delta = parseInt(match[2]) * (match[1] === "-" ? -1 : 1);
  const newScore = Math.max(0, Math.min(maxComponentScore, currentComponentScore + delta));

  return {
    currentScore: currentComponentScore,
    projectedScore: newScore,
    delta
  };
}

/**
 * Track completed interventions and update assessment
 * This is the beginning of the transformation loop
 */
export function markInterventionComplete(interventionId, assessment) {
  if (!assessment.interventionHistory) {
    assessment.interventionHistory = [];
  }

  assessment.interventionHistory.push({
    id: interventionId,
    completedAt: new Date().toISOString()
  });

  return assessment;
}
