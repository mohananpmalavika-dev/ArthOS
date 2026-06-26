import { describe, expect, it } from "vitest";

import { calculateDefaultProbability } from "./mlDefaultPredictionEngine.js";

describe("loan default explainability", () => {
  it("returns an ordered explanation path with score, reasons, evidence, and actions", () => {
    const result = calculateDefaultProbability(
      {
        dpd: 45,
        creditScore: 620,
        loanBalance: 900000,
        emi: 52000,
        monthlyIncome: 80000,
        salaryDelay: 4,
        salaryStability: "unstable",
        upiCashFlow: {
          netMonthlyCashFlow: -12000,
          volatilityScore: 74,
          negativeWeeks: 4
        },
        behaviourChange: "deteriorating",
        behaviourChangeScore: -18,
        stressLevel: 86
      },
      {
        paymentHistory: [
          { date: "2026-01-05", status: "paid" },
          { date: "2026-02-05", status: "late" },
          { date: "2026-03-05", status: "missed" }
        ],
        customerHistory: [
          { date: "2026-01-01", dpd: 0 },
          { date: "2026-03-01", dpd: 45 }
        ]
      }
    );

    expect(result.riskScore).toBeGreaterThan(80);
    expect(result.explanation).toMatchObject({
      predictionType: "loan_default_risk",
      decision: {
        score: result.riskScore,
        label: result.riskCategory
      }
    });
    expect(result.explanation.reasonChain.slice(0, 5)).toEqual([
      "Salary unstable",
      "EMI ratio",
      "UPI cash flow",
      "Behaviour change",
      "Stress score"
    ]);
    expect(result.explanation.explanationPath[0]).toMatchObject({
      code: "salary_instability",
      value: "4 days"
    });
    expect(result.explanation.explanationPath[1]).toMatchObject({
      code: "emi_ratio",
      value: "65%"
    });
    expect(result.explanation.explanationPath[2].evidence).toMatchObject({
      netMonthlyCashFlow: -12000,
      negativeWeeks: 4
    });
    expect(result.explanation.explanationPath.every(reason => reason.recommendedAction)).toBe(true);
  });
});
