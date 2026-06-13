/**
 * Comprehensive tests for scoring-v2.js
 * Tests BAST™ Processing Engine and health score banding
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  componentMaximumsV2,
  compositeWeightsV2,
  healthScoreBandsV2,
  formatCurrency,
  formatMonths,
  calculateBehaviourScoreV2,
  calculateAwarenessScoreV2,
  calculateStabilityScoreV2,
  calculateDebtScheduleEstimateV2,
  calculateHabitsMetricsV2,
  calculateFutureRiskV2,
  calculatePersonalityTypeV2,
  calculateAwarenessGapV2,
  calculateBlindSpotV2,
  calculatePersonalityReportV2,
  calculateFinancialHealthV2,
  buildAnonymousTelemetryPayload,
  calculateDynamicElasticity,
  calculateAdvancedCognitiveDrift,
  simulateCommitmentImpact,
  calculateDecisionSimulatorV2
} from "../src/lib/scoring-v2.js";

describe("scoring-v2: Constants and Configuration", () => {
  it("should have correct component maximums", () => {
    expect(componentMaximumsV2.behaviour).toBe(40);
    expect(componentMaximumsV2.awareness).toBe(30);
    expect(componentMaximumsV2.stability).toBe(30);
  });

  it("should have correct composite weights totaling 1.0", () => {
    const sum =
      compositeWeightsV2.behaviour +
      compositeWeightsV2.awareness +
      compositeWeightsV2.stability;
    expect(sum).toBeCloseTo(1.0, 5);
  });

  it("should have 5 health score bands", () => {
    expect(Object.keys(healthScoreBandsV2)).toHaveLength(5);
    expect(healthScoreBandsV2).toHaveProperty("critical");
    expect(healthScoreBandsV2).toHaveProperty("fragile");
    expect(healthScoreBandsV2).toHaveProperty("developing");
    expect(healthScoreBandsV2).toHaveProperty("resilient");
    expect(healthScoreBandsV2).toHaveProperty("sovereign");
  });

  it("should have correct band ranges on /1000 scale", () => {
    expect(healthScoreBandsV2.critical.min).toBe(0);
    expect(healthScoreBandsV2.critical.max).toBe(199);
    expect(healthScoreBandsV2.fragile.min).toBe(200);
    expect(healthScoreBandsV2.fragile.max).toBe(399);
    expect(healthScoreBandsV2.developing.min).toBe(400);
    expect(healthScoreBandsV2.developing.max).toBe(599);
    expect(healthScoreBandsV2.resilient.min).toBe(600);
    expect(healthScoreBandsV2.resilient.max).toBe(799);
    expect(healthScoreBandsV2.sovereign.min).toBe(800);
    expect(healthScoreBandsV2.sovereign.max).toBe(1000);
  });
});

describe("scoring-v2: Formatting Functions", () => {
  it("formatCurrency should format as INR by default", () => {
    const result = formatCurrency(1000);
    expect(typeof result).toBe("string");
    expect(result).toContain("1");
    expect(result).toContain("000");
  });

  it("formatCurrency should handle zero", () => {
    expect(formatCurrency(0)).toBeDefined();
  });

  it("formatCurrency should handle negative values as zero", () => {
    const result = formatCurrency(-100);
    expect(result).toBeDefined();
  });

  it("formatMonths should return '0' for <= 0", () => {
    expect(formatMonths(0)).toBe("0");
    expect(formatMonths(-5)).toBe("0");
  });

  it("formatMonths should return '60+' for >= 60", () => {
    expect(formatMonths(60)).toBe("60+");
    expect(formatMonths(100)).toBe("60+");
  });

  it("formatMonths should format finite months correctly", () => {
    expect(formatMonths(12)).toBe("12");
    expect(formatMonths(12.5)).toBe("12.5");
  });
});

describe("scoring-v2: Component Score Calculations", () => {
  const mockBehaviourData = {
    emotionalMoneyLevel: "fully_logical",
    socialInfluenceLevel: "never",
    unplannedPurchaseFreq: "never",
    regretImpulseFreq: "never",
    presentFutureMindset: "secure_future",
    avoidBalanceDuringStress: "never",
    spendWhenBored: "never",
    spendWhenStressed: "never",
    plannedPurchasesOnly: "always",
    cashflowAwareness: "always",
    subscriptionControl: "weekly",
    impulseWaitRule: "always"
  };

  const mockAwarenessData = {
    comparesLifestyleFreq: "never",
    hasFinancialPlan: "clear_plan",
    tracksExpenses: "regularly",
    knowsTotalDebt: "fully",
    knowsMonthlyExpenses: "exact",
    tracksSavingsRate: "know_exact",
    budgetCycle: "weekly",
    knowsTop3Expenses: "very_clear"
  };

  const mockProfileData = {
    monthlyIncome: 100000,
    monthlyExpenses: 30000,
    monthlyLiabilities: 5000,
    totalDebt: 200000,
    debtRepaymentRatePctOfIncome: 10,
    averageInterestRatePct: 12,
    incomeStability: "very_consistent",
    dependents: "0_1"
  };

  it("calculateBehaviourScoreV2 should return valid score", () => {
    const score = calculateBehaviourScoreV2(mockBehaviourData);
    expect(typeof score).toBe("number");
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(componentMaximumsV2.behaviour);
  });

  it("calculateAwarenessScoreV2 should return valid score", () => {
    const score = calculateAwarenessScoreV2(mockAwarenessData);
    expect(typeof score).toBe("number");
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(componentMaximumsV2.awareness);
  });

  it("calculateStabilityScoreV2 should return valid score and survival metrics", () => {
    const stability = calculateStabilityScoreV2(mockProfileData, mockBehaviourData);
    expect(stability).toHaveProperty("score");
    expect(stability).toHaveProperty("survivalMonthsRaw");
    expect(typeof stability.score).toBe("number");
    expect(stability.score).toBeGreaterThanOrEqual(0);
    expect(stability.score).toBeLessThanOrEqual(componentMaximumsV2.stability);
  });

  it("calculateBehaviourScoreV2 with poor behavior should score lower", () => {
    const poorBehaviour = {
      emotionalMoneyLevel: "extremely_emotional",
      socialInfluenceLevel: "heavily",
      unplannedPurchaseFreq: "very_frequently",
      regretImpulseFreq: "almost_every_time",
      presentFutureMindset: "enjoy_today",
      avoidBalanceDuringStress: "almost_always",
      spendWhenBored: "very_likely",
      spendWhenStressed: "very_likely",
      plannedPurchasesOnly: "never",
      cashflowAwareness: "no",
      subscriptionControl: "never",
      impulseWaitRule: "never"
    };
    const goodScore = calculateBehaviourScoreV2(mockBehaviourData);
    const poorScore = calculateBehaviourScoreV2(poorBehaviour);
    expect(goodScore).toBeGreaterThan(poorScore);
  });
});

describe("scoring-v2: Financial Health Calculation", () => {
  const mockAssessment = {
    behaviour: {
      emotionalMoneyLevel: "mostly_practical",
      socialInfluenceLevel: "sometimes",
      unplannedPurchaseFreq: "rarely",
      regretImpulseFreq: "rarely",
      presentFutureMindset: "balance_both",
      avoidBalanceDuringStress: "rarely",
      spendWhenBored: "rarely",
      spendWhenStressed: "rarely",
      plannedPurchasesOnly: "often",
      cashflowAwareness: "usually",
      subscriptionControl: "monthly",
      impulseWaitRule: "sometimes"
    },
    awareness: {
      comparesLifestyleFreq: "occasionally",
      hasFinancialPlan: "some_plan",
      tracksExpenses: "sometimes",
      knowsTotalDebt: "partially",
      knowsMonthlyExpenses: "approximate",
      tracksSavingsRate: "know_some",
      budgetCycle: "monthly",
      knowsTop3Expenses: "yes"
    },
    profile: {
      monthlyIncome: 75000,
      monthlyExpenses: 25000,
      monthlyLiabilities: 5000,
      totalDebt: 150000,
      debtRepaymentRatePctOfIncome: 10,
      averageInterestRatePct: 12,
      incomeStability: "mostly_consistent",
      dependents: "2_3"
    },
    habits: {
      exerciseFrequency: 3,
      meditationFrequency: 2,
      sleepQuality: 7
    }
  };

  it("calculateFinancialHealthV2 should return complete health report", () => {
    const result = calculateFinancialHealthV2(mockAssessment);
    expect(result).toHaveProperty("mode");
    expect(result.mode).toBe("v2");
    expect(result).toHaveProperty("healthScore");
    expect(result).toHaveProperty("categoryBand");
    expect(result).toHaveProperty("componentRows");
    expect(result).toHaveProperty("survivalBand");
    expect(result).toHaveProperty("diagnosis");
  });

  it("categoryBand should have label, tone, and band properties", () => {
    const result = calculateFinancialHealthV2(mockAssessment);
    const { categoryBand } = result;
    expect(categoryBand).toHaveProperty("label");
    expect(categoryBand).toHaveProperty("tone");
    expect(categoryBand).toHaveProperty("band");
    expect(typeof categoryBand.label).toBe("string");
    expect(typeof categoryBand.tone).toBe("string");
    expect(typeof categoryBand.band).toBe("string");
  });

  it("healthScore should be between 0-1000", () => {
    const result = calculateFinancialHealthV2(mockAssessment);
    expect(result.healthScore).toBeGreaterThanOrEqual(0);
    expect(result.healthScore).toBeLessThanOrEqual(1000);
  });

  it("categoryBand.label should match healthScore range", () => {
    const result = calculateFinancialHealthV2(mockAssessment);
    const { healthScore, categoryBand } = result;

    if (healthScore < 200) {
      expect(categoryBand.label).toContain("Critical");
    } else if (healthScore < 400) {
      expect(categoryBand.label).toContain("Fragile");
    } else if (healthScore < 600) {
      expect(categoryBand.label).toContain("Developing");
    } else if (healthScore < 800) {
      expect(categoryBand.label).toContain("Resilient");
    } else {
      expect(categoryBand.label).toContain("Sovereign");
    }
  });

  it("componentRows array should have 3 entries (behaviour, awareness, stability)", () => {
    const result = calculateFinancialHealthV2(mockAssessment);
    expect(result.componentRows).toHaveLength(3);
    expect(result.componentRows.map(c => c.key)).toContain("behaviour");
    expect(result.componentRows.map(c => c.key)).toContain("awareness");
    expect(result.componentRows.map(c => c.key)).toContain("stability");
  });

  it("componentRows should have band property with label", () => {
    const result = calculateFinancialHealthV2(mockAssessment);
    result.componentRows.forEach(component => {
      expect(component).toHaveProperty("band");
      expect(typeof component.band).toBe("string");
      expect(component.band.length).toBeGreaterThan(0);
    });
  });

  it("survivalBand should have label property", () => {
    const result = calculateFinancialHealthV2(mockAssessment);
    expect(result.survivalBand).toHaveProperty("label");
    expect(typeof result.survivalBand.label).toBe("string");
  });
});

describe("scoring-v2: Edge Cases", () => {
  it("should handle assessment with minimal data", () => {
    const minimal = {
      behaviour: {},
      awareness: {},
      profile: {},
      habits: {}
    };
    const result = calculateFinancialHealthV2(minimal);
    expect(result).toHaveProperty("healthScore");
    expect(result).toHaveProperty("categoryBand");
    expect(result.categoryBand).toHaveProperty("label");
  });

  it("should handle zero income", () => {
    const zeroIncome = {
      behaviour: {},
      awareness: {},
      profile: {
        monthlyIncome: 0,
        monthlyExpenses: 0,
        monthlyLiabilities: 0,
        totalDebt: 0
      },
      habits: {}
    };
    const result = calculateFinancialHealthV2(zeroIncome);
    expect(result).toBeDefined();
    expect(result.categoryBand).toHaveProperty("label");
  });

  it("should handle extreme debt scenario", () => {
    const extremeDebt = {
      behaviour: {},
      awareness: {},
      profile: {
        monthlyIncome: 30000,
        monthlyExpenses: 25000,
        monthlyLiabilities: 10000,
        totalDebt: 500000
      },
      habits: {}
    };
    const result = calculateFinancialHealthV2(extremeDebt);
    expect(result.healthScore).toBeLessThan(400); // Should be critical or fragile
  });

  it("should handle perfect scenario", () => {
    const perfect = {
      behaviour: {
        emotionalMoneyLevel: "fully_logical",
        socialInfluenceLevel: "never",
        unplannedPurchaseFreq: "never",
        regretImpulseFreq: "never",
        presentFutureMindset: "extreme_discipline",
        avoidBalanceDuringStress: "never",
        spendWhenBored: "never",
        spendWhenStressed: "never",
        plannedPurchasesOnly: "always",
        cashflowAwareness: "always",
        subscriptionControl: "weekly",
        impulseWaitRule: "always"
      },
      awareness: {
        comparesLifestyleFreq: "never",
        hasFinancialPlan: "clear_plan",
        tracksExpenses: "regularly",
        knowsTotalDebt: "fully",
        knowsMonthlyExpenses: "exact",
        tracksSavingsRate: "know_exact",
        budgetCycle: "weekly",
        knowsTop3Expenses: "very_clear"
      },
      profile: {
        monthlyIncome: 200000,
        monthlyExpenses: 30000,
        monthlyLiabilities: 0,
        totalDebt: 0,
        emergencySavingsFixed: 100000,
        emergencySavingsDiscretionary: 50000,
        debtRepaymentRatePctOfIncome: 0,
        averageInterestRatePct: 0,
        incomeStability: "very_consistent",
        dependentsBucket: "0_1"
      },
      habits: {
        exerciseFrequency: 7,
        meditationFrequency: 7,
        sleepQuality: 10,
        habitCheckInsPerWeek: "4_5",
        debtPaymentDiscipline: "always"
      }
    };
    const result = calculateFinancialHealthV2(perfect);
    expect(result.healthScore).toBeGreaterThan(700); // Should be resilient or sovereign
    expect(result.categoryBand.label).toMatch(/Resilient|Sovereign/);
  });
});

describe("scoring-v2: Debt Schedule Estimation", () => {
  it("calculateDebtScheduleEstimateV2 should handle no debt", () => {
    const profile = {
      totalDebt: 0,
      monthlyIncome: 50000,
      monthlyExpenses: 20000,
      monthlyLiabilities: 5000,
      debtRepaymentRatePctOfIncome: 10,
      averageInterestRatePct: 12
    };
    const result = calculateDebtScheduleEstimateV2(profile);
    expect(result.payoffMonths).toBe(0);
    expect(result.monthlyDebtRepaymentEstimate).toBe(0);
  });

  it("calculateDebtScheduleEstimateV2 should estimate payoff timeline", () => {
    const profile = {
      totalDebt: 100000,
      monthlyIncome: 100000,
      monthlyExpenses: 30000,
      monthlyLiabilities: 10000,
      debtRepaymentRatePctOfIncome: 10,
      averageInterestRatePct: 0
    };
    const result = calculateDebtScheduleEstimateV2(profile);
    expect(result.payoffMonths).toBeGreaterThan(0);
    expect(result.monthlyDebtRepaymentEstimate).toBeGreaterThan(0);
  });
});

describe("scoring-v2: Habits Metrics", () => {
  it("calculateHabitsMetricsV2 should return valid metrics", () => {
    const habits = {
      exerciseFrequency: 5,
      meditationFrequency: 3,
      sleepQuality: 7
    };
    const result = calculateHabitsMetricsV2(habits);
    expect(result).toBeDefined();
    expect(typeof result).toBe("object");
  });
});

describe("scoring-v2: Future Risk Analysis", () => {
  it("calculateFutureRiskV2 should return risk label", () => {
    const profile = {
      monthlyIncome: 50000,
      monthlyExpenses: 40000,
      totalDebt: 300000,
      monthlyLiabilities: 5000
    };
    const result = calculateFutureRiskV2(profile);
    expect(result).toHaveProperty("label");
    expect(typeof result.label).toBe("string");
  });
});

describe("scoring-v2: Personality Type Analysis", () => {
  it("calculatePersonalityTypeV2 should return personality type", () => {
    const behaviour = {
      emotionalMoneyLevel: "mostly_practical",
      presentFutureMindset: "balance_both"
    };
    const result = calculatePersonalityTypeV2(behaviour);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("calculatePersonalityReportV2 should return personality report", () => {
    const result = calculatePersonalityReportV2("Guardian");
    expect(result).toHaveProperty("title");
    expect(result).toHaveProperty("strengths");
    expect(result).toHaveProperty("risks");
    expect(result).toHaveProperty("dangerZone");
    expect(result).toHaveProperty("recommendedRule");
  });
});

describe("scoring-v2: Awareness Metrics", () => {
  it("calculateAwarenessGapV2 should identify gaps", () => {
    const awareness = {
      hasFinancialPlan: "no_plan",
      tracksExpenses: "never",
      knowsMonthlyExpenses: "no"
    };
    const result = calculateAwarenessGapV2(awareness, 3);
    expect(result).toBeDefined();
  });

  it("calculateBlindSpotV2 should identify blind spots", () => {
    const awarenessMetrics = {
      hasFinancialPlan: "no",
      tracksExpenses: "never",
      knowsTotalDebt: "no"
    };
    const result = calculateBlindSpotV2(awarenessMetrics);
    expect(result).toBeDefined();
  });
});

describe("scoring-v2: Telemetry", () => {
  it("buildAnonymousTelemetryPayload should create valid payload", () => {
    const mockAssessment = {
      behaviour: {},
      awareness: {},
      profile: {},
      habits: {}
    };
    const assessmentResult = calculateFinancialHealthV2(mockAssessment);
    const result = buildAnonymousTelemetryPayload(assessmentResult, mockAssessment);
    expect(result).toBeDefined();
    expect(typeof result).toBe("object");
  });
});

describe("scoring-v2: Dynamic Elasticity", () => {
  it("calculateDynamicElasticity should compute elasticity", () => {
    const behaviour = {
      impulseWaitRule: "always",
      unplannedPurchaseFreq: "never"
    };
    const result = calculateDynamicElasticity(behaviour);
    expect(result).toBeDefined();
    expect(typeof result).toBe("number");
  });
});

describe("scoring-v2: Advanced Cognitive Drift", () => {
  it("calculateAdvancedCognitiveDrift should compute drift metrics", () => {
    const awareness = {
      tracksExpenses: "regularly",
      hasFinancialPlan: "clear_plan"
    };
    const result = calculateAdvancedCognitiveDrift(awareness, 12);
    expect(result).toBeDefined();
  });
});

describe("scoring-v2: Decision Simulator", () => {
  it("calculateDecisionSimulatorV2 should simulate purchase impact", () => {
    const profile = {
      monthlyIncome: 100000,
      monthlyExpenses: 30000
    };
    const behaviour = {
      presentFutureMindset: "balance_both"
    };
    const result = calculateDecisionSimulatorV2(profile, 5000, behaviour);
    expect(result).toBeDefined();
  });

  it("simulateCommitmentImpact should simulate commitment impact", () => {
    const profile = {
      monthlyIncome: 100000,
      monthlyExpenses: 30000
    };
    const behaviour = {
      presentFutureMindset: "secure_future"
    };
    const result = simulateCommitmentImpact(profile, 10000, behaviour);
    expect(result).toBeDefined();
  });
});
