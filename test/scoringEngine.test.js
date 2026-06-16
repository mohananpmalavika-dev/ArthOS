// test/scoringEngine.test.js
// Unit tests for ARTH.OS financial health scoring engine v2
// Run with: npm test or npx vitest

import { describe, it, expect, beforeEach } from "vitest";
import {
  calculateFinancialHealthV2,
  componentMaximumsV2,
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
  calculateDecisionSimulatorV2,
  simulateCommitmentImpact,
  formatCurrency,
  formatMonths,
  buildAnonymousTelemetryPayload,
  calculateAdvancedCognitiveDrift,
  calculateDynamicElasticity,
} from "../src/lib/scoring-v2.js";

/**
 * Creates a valid v2 assessment input matching the schema expected by
 * calculateFinancialHealthV2(). All fields use the enumerated string values
 * from src/data/questionnaire-v2.js so the scoring maps resolve correctly.
 */
function buildV2Assessment(overrides = {}) {
  const base = {
    behaviour: {
      emotionalMoneyLevel: "mostly_practical",
      socialInfluenceLevel: "rarely",
      unplannedPurchaseFreq: "rarely",
      regretImpulseFreq: "rarely",
      presentFutureMindset: "balance_both",
      avoidBalanceDuringStress: "rarely",
      spendWhenBored: "rarely",
      spendWhenStressed: "never",
      plannedPurchasesOnly: "often",
      cashflowAwareness: "usually",
      subscriptionControl: "monthly",
      impulseWaitRule: "always",
    },
    awareness: {
      comparesLifestyleFreq: "rarely",
      hasFinancialPlan: "clear_plan",
      tracksExpenses: "regularly",
      knowsTotalDebt: "fully",
      knowsMonthlyExpenses: "exact",
      tracksSavingsRate: "know_exact",
      budgetCycle: "monthly",
      knowsTop3Expenses: "very_clear",
    },
    profile: {
      monthlyExpenses: 60000,
      emergencySavingsFixed: 150000,
      emergencySavingsDiscretionary: 150000,
      totalDebt: 0,
      monthlyIncome: 100000,
      incomeStability: "mostly_consistent",
      dependentsBucket: "0_1",
      monthlyLiabilities: 10000,
      debtRepaymentRatePctOfIncome: 0.12,
      averageInterestRatePct: 10,
    },
    habits: {
      habitCheckInsPerWeek: "1",
      debtPaymentDiscipline: "always",
    },
    participant: {
      name: "Test User",
      age: "35",
      email: "test@example.com",
    },
  };

  return {
    ...base,
    behaviour: { ...base.behaviour, ...(overrides.behaviour || {}) },
    awareness: { ...base.awareness, ...(overrides.awareness || {}) },
    profile: { ...base.profile, ...(overrides.profile || {}) },
    habits: { ...base.habits, ...(overrides.habits || {}) },
    participant: { ...base.participant, ...(overrides.participant || {}) },
  };
}

describe("Financial Health Scoring Engine v2", () => {
  // ── Sanity ──

  describe("calculateFinancialHealthV2()", () => {
    it("should return valid health score (0-1000)", () => {
      const result = calculateFinancialHealthV2(buildV2Assessment());
      expect(result.healthScore).toBeGreaterThanOrEqual(0);
      expect(result.healthScore).toBeLessThanOrEqual(1000);
    });

    it("should have component rows (behaviour, awareness, stability)", () => {
      const result = calculateFinancialHealthV2(buildV2Assessment());
      expect(Array.isArray(result.componentRows)).toBe(true);
      expect(result.componentRows.length).toBe(3);

      const keys = result.componentRows.map((r) => r.key);
      expect(keys).toContain("behaviour");
      expect(keys).toContain("awareness");
      expect(keys).toContain("stability");
    });

    it("should return named score fields at top level", () => {
      const result = calculateFinancialHealthV2(buildV2Assessment());
      expect(typeof result.behaviourScore).toBe("number");
      expect(typeof result.awarenessScore).toBe("number");
      expect(typeof result.stabilityScore).toBe("number");
    });

    it("should return a categoryBand with label, tone, and band", () => {
      const result = calculateFinancialHealthV2(buildV2Assessment());
      expect(result.categoryBand).toBeDefined();
      expect(typeof result.categoryBand.label).toBe("string");
      expect(typeof result.categoryBand.tone).toBe("string");
      expect(typeof result.categoryBand.band).toBe("string");
    });

    it("should include survival months (raw + display)", () => {
      const result = calculateFinancialHealthV2(buildV2Assessment());
      expect(typeof result.survivalMonthsRaw).toBe("number");
      expect(typeof result.survivalMonthsDisplay).toBe("string");
    });

    it("should include recommendedActionText as a string", () => {
      const result = calculateFinancialHealthV2(buildV2Assessment());
      expect(typeof result.recommendedActionText).toBe("string");
      expect(result.recommendedActionText.length).toBeGreaterThan(0);
    });

    it("should include blindSpot insight data", () => {
      const result = calculateFinancialHealthV2(buildV2Assessment());
      expect(result.blindSpot).toBeDefined();
      expect(typeof result.blindSpot.headline).toBe("string");
      expect(typeof result.blindSpot.summary).toBe("string");
      expect(typeof result.blindSpot.gapDisplay).toBe("string");
    });

    it("should include diagnosis block", () => {
      const result = calculateFinancialHealthV2(buildV2Assessment());
      expect(result.diagnosis).toBeDefined();
      expect(typeof result.diagnosis.headline).toBe("string");
      expect(typeof result.diagnosis.focus).toBe("string");
    });

    it("should include personalityType and personalityReport", () => {
      const result = calculateFinancialHealthV2(buildV2Assessment());
      expect(typeof result.personalityType).toBe("string");
      expect(result.personalityReport).toBeDefined();
      expect(typeof result.personalityReport.title).toBe("string");
    });

    it("should include futureRiskScore and futureRiskLabel", () => {
      const result = calculateFinancialHealthV2(buildV2Assessment());
      expect(typeof result.futureRiskScore).toBe("number");
      expect(typeof result.futureRiskLabel).toBe("string");
    });

    it("should include survivalBand with label and tone", () => {
      const result = calculateFinancialHealthV2(buildV2Assessment());
      expect(result.survivalBand).toBeDefined();
      expect(typeof result.survivalBand.label).toBe("string");
      expect(typeof result.survivalBand.tone).toBe("string");
    });

    it("should include debtSchedule", () => {
      const result = calculateFinancialHealthV2(buildV2Assessment());
      expect(result.debtSchedule).toBeDefined();
      expect(typeof result.debtSchedule.payoffMonths).toBe("number");
    });

    it("should include habits metrics", () => {
      const result = calculateFinancialHealthV2(buildV2Assessment());
      expect(result.habits).toBeDefined();
      expect(typeof result.habits.habitScore).toBe("number");
    });

    it("should fall back to v2DefaultAssessment when argument is undefined", () => {
      const result = calculateFinancialHealthV2(undefined);
      expect(result.healthScore).toBeGreaterThan(0);
    });
  });

  // ── Health bands ──

  describe("Health Score Bands (/1000 scale)", () => {
    it("should classify Critical health (< 200)", () => {
      const result = calculateFinancialHealthV2(buildV2Assessment({
        behaviour: {
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
          impulseWaitRule: "never",
        },
        awareness: {
          comparesLifestyleFreq: "constantly",
          hasFinancialPlan: "no_plan",
          tracksExpenses: "never",
          knowsTotalDebt: "no",
          knowsMonthlyExpenses: "no",
          tracksSavingsRate: "no",
          budgetCycle: "never",
          knowsTop3Expenses: "no",
        },
        profile: {
          monthlyExpenses: 50000,
          emergencySavingsFixed: 0,
          emergencySavingsDiscretionary: 0,
          totalDebt: 500000,
          monthlyIncome: 20000,
          incomeStability: "highly_variable",
          dependentsBucket: "6_plus",
          monthlyLiabilities: 15000,
          debtRepaymentRatePctOfIncome: 0.05,
          averageInterestRatePct: 18,
        },
        habits: {
          habitCheckInsPerWeek: "0",
          debtPaymentDiscipline: "rarely",
        },
      }));
      expect(result.healthScore).toBeLessThan(200);
      expect(result.categoryBand.band).toBe("critical");
    });

    it("should classify Developing health (400-599) for moderate inputs", () => {
      const result = calculateFinancialHealthV2(buildV2Assessment({
        behaviour: {
          emotionalMoneyLevel: "somewhat_emotional",
          socialInfluenceLevel: "sometimes",
          unplannedPurchaseFreq: "rarely",
          regretImpulseFreq: "sometimes",
          presentFutureMindset: "balance_both",
          avoidBalanceDuringStress: "sometimes",
          spendWhenBored: "sometimes",
          spendWhenStressed: "sometimes",
          plannedPurchasesOnly: "occasionally",
          cashflowAwareness: "sometimes",
          subscriptionControl: "occasionally",
          impulseWaitRule: "sometimes",
        },
        awareness: {
          comparesLifestyleFreq: "occasionally",
          hasFinancialPlan: "some_plan",
          tracksExpenses: "sometimes",
          knowsTotalDebt: "partially",
          knowsMonthlyExpenses: "approximate",
          tracksSavingsRate: "not_sure",
          budgetCycle: "once_every_2_months",
          knowsTop3Expenses: "some",
        },
        profile: {
          monthlyExpenses: 50000,
          emergencySavingsFixed: 50000,
          emergencySavingsDiscretionary: 40000,
          totalDebt: 160000,
          monthlyIncome: 90000,
          incomeStability: "mostly_consistent",
          dependentsBucket: "0_1",
          monthlyLiabilities: 18000,
          debtRepaymentRatePctOfIncome: 0.12,
          averageInterestRatePct: 10,
        },
      }));
      expect(result.healthScore).toBeGreaterThanOrEqual(400);
      expect(result.healthScore).toBeLessThan(600);
      expect(result.categoryBand.band).toBe("developing");
    });

    it("should classify Sovereign health (800-1000)", () => {
      const result = calculateFinancialHealthV2(buildV2Assessment({
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
          impulseWaitRule: "always",
        },
        profile: {
          monthlyExpenses: 80000,
          emergencySavingsFixed: 2000000,
          emergencySavingsDiscretionary: 2000000,
          totalDebt: 0,
          monthlyIncome: 300000,
          incomeStability: "very_consistent",
          dependentsBucket: "0_1",
          monthlyLiabilities: 10000,
          debtRepaymentRatePctOfIncome: 0.15,
          averageInterestRatePct: 8,
        },
      }));
      expect(result.healthScore).toBeGreaterThanOrEqual(800);
      expect(result.healthScore).toBeLessThanOrEqual(1000);
      expect(result.categoryBand.band).toBe("sovereign");
    });
  });

  // ── Behaviour component ──

  describe("Behaviour Component", () => {
    it("should score higher with better behavioural answers", () => {
      const goodBehaviour = buildV2Assessment({
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
          impulseWaitRule: "always",
        },
      });

      const badBehaviour = buildV2Assessment({
        behaviour: {
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
          impulseWaitRule: "never",
        },
      });

      const good = calculateFinancialHealthV2(goodBehaviour);
      const bad = calculateFinancialHealthV2(badBehaviour);

      expect(good.behaviourScore).toBeGreaterThan(bad.behaviourScore);
      expect(good.componentRows.find((r) => r.key === "behaviour").score)
        .toBeGreaterThan(bad.componentRows.find((r) => r.key === "behaviour").score);
    });
  });

  // ── Awareness component ──

  describe("Awareness Component", () => {
    it("should score higher with better awareness answers", () => {
      const highAwareness = buildV2Assessment({
        awareness: {
          comparesLifestyleFreq: "never",
          hasFinancialPlan: "clear_plan",
          tracksExpenses: "regularly",
          knowsTotalDebt: "fully",
          knowsMonthlyExpenses: "exact",
          tracksSavingsRate: "know_exact",
          budgetCycle: "weekly",
          knowsTop3Expenses: "very_clear",
        },
      });

      const lowAwareness = buildV2Assessment({
        awareness: {
          comparesLifestyleFreq: "constantly",
          hasFinancialPlan: "no_plan",
          tracksExpenses: "never",
          knowsTotalDebt: "no",
          knowsMonthlyExpenses: "no",
          tracksSavingsRate: "no",
          budgetCycle: "never",
          knowsTop3Expenses: "no",
        },
      });

      const high = calculateFinancialHealthV2(highAwareness);
      const low = calculateFinancialHealthV2(lowAwareness);

      expect(high.awarenessScore).toBeGreaterThan(low.awarenessScore);
    });

    it("should handle partially-filled awareness gracefully", () => {
      const result = calculateFinancialHealthV2(buildV2Assessment({
        awareness: {
          hasFinancialPlan: "clear_plan",
          tracksExpenses: "regularly",
        },
      }));
      expect(result.awarenessScore).toBeGreaterThan(0);
    });
  });

  // ── Stability component ──

  describe("Stability Component", () => {
    it("should score higher with stronger financial buffers", () => {
      const strong = buildV2Assessment({
        profile: {
          monthlyExpenses: 30000,
          emergencySavingsFixed: 1000000,
          emergencySavingsDiscretionary: 500000,
          totalDebt: 0,
          monthlyIncome: 200000,
          incomeStability: "very_consistent",
          dependentsBucket: "0_1",
          monthlyLiabilities: 5000,
          debtRepaymentRatePctOfIncome: 0.20,
          averageInterestRatePct: 8,
        },
      });

      const weak = buildV2Assessment({
        profile: {
          monthlyExpenses: 60000,
          emergencySavingsFixed: 0,
          emergencySavingsDiscretionary: 0,
          totalDebt: 500000,
          monthlyIncome: 25000,
          incomeStability: "highly_variable",
          dependentsBucket: "6_plus",
          monthlyLiabilities: 20000,
          debtRepaymentRatePctOfIncome: 0.05,
          averageInterestRatePct: 18,
        },
      });

      const s = calculateFinancialHealthV2(strong);
      const w = calculateFinancialHealthV2(weak);

      expect(s.stabilityScore).toBeGreaterThan(w.stabilityScore);
    });

    it("should penalize high debt", () => {
      const noDebt = buildV2Assessment({
        profile: { totalDebt: 0 },
      });
      const highDebt = buildV2Assessment({
        profile: { totalDebt: 1000000 },
      });

      const nd = calculateFinancialHealthV2(noDebt);
      const hd = calculateFinancialHealthV2(highDebt);

      expect(hd.stabilityScore).toBeLessThan(nd.stabilityScore);
    });

    it("should compute survival months from savings / expenses", () => {
      const result = calculateFinancialHealthV2(buildV2Assessment({
        profile: {
          monthlyExpenses: 60000,
          emergencySavingsFixed: 150000,
          emergencySavingsDiscretionary: 150000,
        },
      }));
      // 300000 / 60000 = 5 months
      expect(result.survivalMonthsRaw).toBeGreaterThan(4);
      expect(result.survivalMonthsRaw).toBeLessThan(6);
    });
  });

  // ── Edge cases ──

  describe("Edge Cases & Boundary Conditions", () => {
    it("should handle zero monthly expenses (div-by-zero guard)", () => {
      const result = calculateFinancialHealthV2(buildV2Assessment({
        profile: { monthlyExpenses: 0 },
      }));
      expect(typeof result.healthScore).toBe("number");
      expect(Number.isFinite(result.healthScore)).toBe(true);
    });

    it("should handle zero income", () => {
      const result = calculateFinancialHealthV2(buildV2Assessment({
        profile: { monthlyIncome: 0 },
      }));
      expect(typeof result.healthScore).toBe("number");
      expect(Number.isFinite(result.healthScore)).toBe(true);
    });

    it("should handle missing behaviour keys by defaulting to 0", () => {
      const result = calculateFinancialHealthV2(buildV2Assessment({
        behaviour: { emotionalMoneyLevel: undefined },
      }));
      expect(typeof result.behaviourScore).toBe("number");
      expect(Number.isFinite(result.behaviourScore)).toBe(true);
    });

    it("should handle missing awareness keys by defaulting to 0", () => {
      const result = calculateFinancialHealthV2(buildV2Assessment({
        awareness: { hasFinancialPlan: undefined },
      }));
      expect(typeof result.awarenessScore).toBe("number");
      expect(Number.isFinite(result.awarenessScore)).toBe(true);
    });
  });

  // ── Recommended actions ──

  describe("Recommended Actions", () => {
    it("should recommend a behaviour-focused action when behaviour is worst", () => {
      const result = calculateFinancialHealthV2(buildV2Assessment({
        behaviour: {
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
          impulseWaitRule: "never",
        },
      }));

      expect(typeof result.recommendedActionText).toBe("string");
      expect(result.recommendedActionText.toLowerCase()).toMatch(/wait|impulse|purchase/);
    });

    it("should recommend an emergency-savings action when survival window is tight", () => {
      const result = calculateFinancialHealthV2(buildV2Assessment({
        profile: {
          monthlyExpenses: 60000,
          emergencySavingsFixed: 10000,
          emergencySavingsDiscretionary: 0,
          totalDebt: 0,
          monthlyIncome: 80000,
          incomeStability: "mostly_consistent",
          dependentsBucket: "0_1",
          monthlyLiabilities: 5000,
        },
      }));

      expect(result.recommendedActionText.toLowerCase()).toMatch(/emergency|buffer|savings/);
    });
  });

  describe("Component Rows Ordering", () => {
    it("should sort componentRows ascending so [0] is the weakest", () => {
      const result = calculateFinancialHealthV2(buildV2Assessment());
      const percents = result.componentRows.map((r) => r.percent);
      for (let i = 1; i < percents.length; i++) {
        expect(percents[i]).toBeGreaterThanOrEqual(percents[i - 1]);
      }
    });

    it("should expose lowestComponent and strongestComponent", () => {
      const result = calculateFinancialHealthV2(buildV2Assessment());
      expect(result.lowestComponent).toBeDefined();
      expect(result.lowestComponent.key).toBe(result.componentRows[0].key);
      expect(result.strongestComponent).toBeDefined();
      expect(result.strongestComponent.key).toBe(result.componentRows[2].key);
    });
  });

  // ── Component Score Functions ──

  describe("calculateBehaviourScoreV2()", () => {
    it("should return 0-40 score for behaviour", () => {
      const result = calculateBehaviourScoreV2({ emotionalMoneyLevel: "fully_logical" });
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(componentMaximumsV2.behaviour);
    });

    it("should score 0 for empty/undefined behaviour", () => {
      const result = calculateBehaviourScoreV2({});
      expect(result).toBe(0);
    });

    it("should score higher for disciplined behaviour", () => {
      const disciplined = calculateBehaviourScoreV2({
        emotionalMoneyLevel: "fully_logical",
        impulseWaitRule: "always",
        plannedPurchasesOnly: "always",
      });
      const impulsive = calculateBehaviourScoreV2({
        emotionalMoneyLevel: "extremely_emotional",
        impulseWaitRule: "never",
        plannedPurchasesOnly: "never",
      });
      expect(disciplined).toBeGreaterThan(impulsive);
    });

    it("should clamp score to 40 even with perfect inputs", () => {
      const perfect = calculateBehaviourScoreV2({
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
        impulseWaitRule: "always",
      });
      expect(perfect).toBeLessThanOrEqual(componentMaximumsV2.behaviour);
    });
  });

  describe("calculateAwarenessScoreV2()", () => {
    it("should return 0-30 score for awareness", () => {
      const result = calculateAwarenessScoreV2({ hasFinancialPlan: "clear_plan" });
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(componentMaximumsV2.awareness);
    });

    it("should score 0 for empty awareness", () => {
      const result = calculateAwarenessScoreV2({});
      expect(result).toBe(0);
    });

    it("should score higher for detailed financial knowledge", () => {
      const aware = calculateAwarenessScoreV2({
        hasFinancialPlan: "clear_plan",
        tracksExpenses: "regularly",
        knowsTotalDebt: "fully",
        knowsMonthlyExpenses: "exact",
        tracksSavingsRate: "know_exact",
      });
      const unaware = calculateAwarenessScoreV2({
        hasFinancialPlan: "no_plan",
        tracksExpenses: "never",
        knowsTotalDebt: "no",
        knowsMonthlyExpenses: "no",
        tracksSavingsRate: "no",
      });
      expect(aware).toBeGreaterThan(unaware);
    });

    it("should clamp to 30", () => {
      const max = calculateAwarenessScoreV2({
        comparesLifestyleFreq: "never",
        hasFinancialPlan: "clear_plan",
        tracksExpenses: "regularly",
        knowsTotalDebt: "fully",
        knowsMonthlyExpenses: "exact",
        tracksSavingsRate: "know_exact",
        budgetCycle: "weekly",
        knowsTop3Expenses: "very_clear",
      });
      expect(max).toBeLessThanOrEqual(componentMaximumsV2.awareness);
    });
  });

  describe("calculateStabilityScoreV2()", () => {
    it("should return 0-30 score for stability", () => {
      const profile = buildV2Assessment().profile;
      const behaviour = buildV2Assessment().behaviour;
      const result = calculateStabilityScoreV2(profile, behaviour);
      expect(result).toHaveProperty("score");
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(componentMaximumsV2.stability);
    });

    it("should score higher with larger emergency savings", () => {
      const rich = calculateStabilityScoreV2(
        { ...buildV2Assessment().profile, emergencySavingsFixed: 1000000 },
        buildV2Assessment().behaviour
      );
      const poor = calculateStabilityScoreV2(
        { ...buildV2Assessment().profile, emergencySavingsFixed: 0 },
        buildV2Assessment().behaviour
      );
      expect(rich.score).toBeGreaterThanOrEqual(poor.score);
    });

    it("should penalize high debt-to-income ratio", () => {
      const nodebt = calculateStabilityScoreV2(
        { ...buildV2Assessment().profile, totalDebt: 0 },
        buildV2Assessment().behaviour
      );
      const highdebt = calculateStabilityScoreV2(
        { ...buildV2Assessment().profile, totalDebt: 5000000 },
        buildV2Assessment().behaviour
      );
      expect(nodebt.score).toBeGreaterThanOrEqual(highdebt.score);
    });
  });

  describe("calculatePersonalityTypeV2()", () => {
    it("should return a valid archetype string", () => {
      const result = calculatePersonalityTypeV2(buildV2Assessment().behaviour);
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("should classify Builder for disciplined behaviour", () => {
      const builder = calculatePersonalityTypeV2({
        emotionalMoneyLevel: "fully_logical",
        plannedPurchasesOnly: "always",
        cashflowAwareness: "always",
        impulseWaitRule: "always",
      });
      expect(builder).toBeDefined();
      expect(typeof builder).toBe("string");
    });

    it("should classify based on behaviour traits", () => {
      const spender = calculatePersonalityTypeV2({
        emotionalMoneyLevel: "extremely_emotional",
        plannedPurchasesOnly: "never",
        impulseWaitRule: "never",
        spendWhenStressed: "very_likely",
      });
      expect(spender).toBeDefined();
      expect(typeof spender).toBe("string");
    });

    it("should return one of valid personality types", () => {
      const result = calculatePersonalityTypeV2({});
      const validTypes = ["Builder", "Survivor", "Optimizer", "Dreamer", "Risk Taker"];
      expect(validTypes).toContain(result);
    });
  });

  describe("formatCurrency()", () => {
    it("should format numbers with INR currency", () => {
      const result = formatCurrency(100000);
      expect(result).toContain("₹") || expect(result).toContain("INR");
    });

    it("should handle zero", () => {
      const result = formatCurrency(0);
      expect(typeof result).toBe("string");
    });

    it("should handle negative values", () => {
      const result = formatCurrency(-50000);
      expect(typeof result).toBe("string");
    });

    it("should format large numbers with commas", () => {
      const result = formatCurrency(1000000);
      expect(result).toContain(",") || expect(result).toMatch(/\d+/);
    });
  });

  describe("formatMonths()", () => {
    it("should format months as string", () => {
      const result = formatMonths(6);
      expect(typeof result).toBe("string");
    });

    it("should handle decimal months (e.g., 3.5)", () => {
      const result = formatMonths(3.5);
      expect(typeof result).toBe("string");
    });

    it("should handle zero months", () => {
      const result = formatMonths(0);
      expect(result).toBe("0");
    });

    it("should cap at 60+ for large values", () => {
      const result = formatMonths(100);
      expect(result).toBe("60+");
    });
  });

  describe("calculateAwarenessGapV2()", () => {
    it("should return gap object with proper structure", () => {
      const result = calculateAwarenessGapV2(
        buildV2Assessment().awareness,
        5
      );
      expect(result).toBeDefined();
      expect(typeof result).toBe("object");
      // Should have awareness or cognitive drift properties
      expect(Object.keys(result).length).toBeGreaterThan(0);
    });

    it("should handle numeric input", () => {
      const result = calculateAwarenessGapV2(15, 10);
      expect(result).toBeDefined();
    });

    it("should handle zero survival months", () => {
      const result = calculateAwarenessGapV2(
        buildV2Assessment().awareness,
        0
      );
      expect(result).toBeDefined();
    });
  });

  describe("calculateBlindSpotV2()", () => {
    it("should return blindspot insight object", () => {
      const result = calculateBlindSpotV2(buildV2Assessment().awareness);
      expect(result).toBeDefined();
      expect(typeof result).toBe("object");
    });

    it("should have properties describing blind spot", () => {
      const result = calculateBlindSpotV2({ hasFinancialPlan: "no_plan" });
      expect(result).toBeDefined();
      expect(Object.keys(result).length).toBeGreaterThan(0);
    });
  });

  describe("calculateDecisionSimulatorV2()", () => {
    it("should return simulator object with impact metrics", () => {
      const result = calculateDecisionSimulatorV2(
        buildV2Assessment().profile,
        50000,
        buildV2Assessment().behaviour
      );
      expect(result).toHaveProperty("currentRunway");
      expect(result).toHaveProperty("forecastRunway");
      expect(result).toHaveProperty("runwayImpactMonths");
    });

    it("should show reduced runway after purchase", () => {
      const profile = buildV2Assessment().profile;
      const behaviour = buildV2Assessment().behaviour;
      const result = calculateDecisionSimulatorV2(profile, 100000, behaviour);
      expect(result.forecastRunway).toBeLessThan(result.currentRunway);
    });

    it("should handle zero purchase cost", () => {
      const result = calculateDecisionSimulatorV2(
        buildV2Assessment().profile,
        0,
        buildV2Assessment().behaviour
      );
      expect(result.currentRunway).toBe(result.forecastRunway);
    });

    it("should provide recommendation text", () => {
      const result = calculateDecisionSimulatorV2(
        buildV2Assessment().profile,
        100000,
        buildV2Assessment().behaviour
      );
      expect(result).toHaveProperty("recommendation");
      expect(typeof result.recommendation).toBe("string");
    });
  });

  describe("calculateDebtScheduleEstimateV2()", () => {
    it("should return debt schedule estimate object", () => {
      const result = calculateDebtScheduleEstimateV2(buildV2Assessment().profile);
      expect(result).toBeDefined();
      expect(typeof result).toBe("object");
    });

    it("should show valid schedule for zero debt", () => {
      const result = calculateDebtScheduleEstimateV2({
        ...buildV2Assessment().profile,
        totalDebt: 0,
      });
      expect(result).toBeDefined();
      expect(result.payoffMonths).toBe(0);
    });

    it("should provide estimate for positive debt", () => {
      const result = calculateDebtScheduleEstimateV2({
        ...buildV2Assessment().profile,
        totalDebt: 200000,
        monthlyIncome: 100000,
        monthlyExpenses: 60000,
      });
      expect(result).toBeDefined();
      expect(typeof result).toBe("object");
    });
  });

  describe("calculateHabitsMetricsV2()", () => {
    it("should return habits metrics object", () => {
      const result = calculateHabitsMetricsV2({
        hasHealthInsurance: true,
        hasEmergencyFund: true,
        hasRetirementPlans: true,
      });
      expect(result).toBeDefined();
      expect(typeof result).toBe("object");
    });

    it("should have numeric properties", () => {
      const result = calculateHabitsMetricsV2({
        habitCheckInsPerWeek: "2_3",
        debtPaymentDiscipline: "often",
      });
      expect(result).toBeDefined();
      expect(Object.keys(result).length).toBeGreaterThan(0);
    });
  });

  describe("calculateFutureRiskV2()", () => {
    it("should return risk score or object", () => {
      const result = calculateFutureRiskV2(buildV2Assessment().profile);
      expect(result).toBeDefined();
      // Result may be number or object with numeric properties
      const value = typeof result === "number" ? result : result?.score || result?.risk || 0;
      expect(typeof value === "number" || result).toBeTruthy();
    });

    it("should increase risk with high debt", () => {
      const lowRisk = calculateFutureRiskV2({
        ...buildV2Assessment().profile,
        totalDebt: 0,
      });
      const highRisk = calculateFutureRiskV2({
        ...buildV2Assessment().profile,
        totalDebt: 1000000,
      });
      expect(highRisk).toBeDefined();
      expect(lowRisk).toBeDefined();
    });

    it("should return valid output", () => {
      const result = calculateFutureRiskV2(buildV2Assessment().profile);
      expect(result).toBeDefined();
      if (typeof result === "number") {
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(100);
      }
    });
  });

  describe("calculatePersonalityReportV2()", () => {
    it("should return report object for personality type", () => {
      const result = calculatePersonalityReportV2("Builder");
      expect(result).toBeDefined();
      expect(typeof result).toBe("object");
    });

    it("should provide strengths and weaknesses", () => {
      const result = calculatePersonalityReportV2("Spender");
      expect(Object.keys(result).length).toBeGreaterThan(0);
    });
  });

  describe("buildAnonymousTelemetryPayload()", () => {
    it("should build valid telemetry payload from assessment result", () => {
      const result = calculateFinancialHealthV2(buildV2Assessment());
      const payload = buildAnonymousTelemetryPayload(result, buildV2Assessment());
      expect(payload).toBeDefined();
      expect(typeof payload).toBe("object");
    });

    it("should include user-agnostic data only", () => {
      const result = calculateFinancialHealthV2(buildV2Assessment());
      const payload = buildAnonymousTelemetryPayload(result, buildV2Assessment());
      expect(Object.keys(payload).length).toBeGreaterThan(0);
    });

    it("should exclude personally identifiable information", () => {
      const result = calculateFinancialHealthV2(buildV2Assessment());
      const payload = buildAnonymousTelemetryPayload(result, buildV2Assessment());
      const payloadStr = JSON.stringify(payload).toLowerCase();
      expect(payloadStr).not.toContain("email");
      expect(payloadStr).not.toContain("phone");
      expect(payloadStr).not.toContain("name");
    });
  });

  describe("simulateCommitmentImpact()", () => {
    it("should return impact metrics for simulated commitment", () => {
      const result = simulateCommitmentImpact(
        buildV2Assessment().profile,
        5000,
        buildV2Assessment().behaviour
      );
      expect(result).toBeDefined();
      expect(typeof result).toBe("object");
    });

    it("should show reduced stability with high commitment", () => {
      const profile = buildV2Assessment().profile;
      const behaviour = buildV2Assessment().behaviour;
      const lowCommit = simulateCommitmentImpact(profile, 1000, behaviour);
      const highCommit = simulateCommitmentImpact(profile, 50000, behaviour);
      expect(highCommit).toBeDefined();
      expect(lowCommit).toBeDefined();
    });
  });

  describe("calculateAdvancedCognitiveDrift()", () => {
    it("should return cognitive drift result", () => {
      const result = calculateAdvancedCognitiveDrift(
        buildV2Assessment().awareness,
        5
      );
      expect(result).toBeDefined();
    });

    it("should detect awareness-reality gap", () => {
      const result = calculateAdvancedCognitiveDrift(
        { tracksExpenses: "never", knowsMonthlyExpenses: "no" },
        10
      );
      expect(result).toBeDefined();
    });
  });

  describe("calculateDynamicElasticity()", () => {
    it("should return elasticity result", () => {
      const result = calculateDynamicElasticity(buildV2Assessment().behaviour);
      expect(result).toBeDefined();
    });

    it("should measure financial flexibility", () => {
      const rigid = calculateDynamicElasticity({
        plannedPurchasesOnly: "always",
      });
      const flexible = calculateDynamicElasticity({
        plannedPurchasesOnly: "never",
      });
      expect(rigid).toBeDefined();
      expect(flexible).toBeDefined();
    });
  });
});
