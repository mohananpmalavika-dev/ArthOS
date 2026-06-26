import { describe, expect, it } from "vitest";

import {
  buildModelLineage,
  getModelRegistryRecord,
  getRegistrySummary,
  listModelRegistryRecords
} from "./modelRegistry.js";
import { predictionEngineForecastHealth } from "./predictionEngine.js";
import { generateBehaviorPredictionReport } from "./mlBehaviourPredictionEngine.js";
import { calculateDefaultProbability } from "./mlDefaultPredictionEngine.js";

describe("model registry governance", () => {
  it("normalizes ARIMA variants to the ARIMA registry record", () => {
    const record = getModelRegistryRecord("ARIMA(1,0,1)", "ARIMA(1,0,1)");

    expect(record.key).toBe("arima");
    expect(record.version).toBe("v3.8.0");
    expect(record.rollbackTarget).toContain("arthos.health_forecast.arima");
  });

  it("derives runtime accuracy from model metrics", () => {
    const lineage = buildModelLineage({
      modelType: "holt-winters",
      modelName: "Holt's Linear Trend",
      metrics: { mape: 6.2, rmse: 4.1 },
      dataPoints: 12
    });

    expect(lineage.runtimeAccuracy).toBe(94);
    expect(lineage.validationAccuracy).toBe(94);
    expect(lineage.rollbackAvailable).toBe(true);
    expect(lineage.lineageId).toBe("arthos.health_forecast.holt_winters:v4.2.0");
  });

  it("attaches model governance to health score forecasts", () => {
    const forecast = predictionEngineForecastHealth(72, [61, 64, 66, 69, 71, 72], {});

    expect(forecast.modelGovernance.selected).toMatchObject({
      selected: true,
      owner: "Risk Intelligence",
      inputSchema: "financial-health-score-history@v2"
    });
    expect(forecast.modelGovernance.selected.version).toMatch(/^v|n\/a$/);
    expect(forecast.modelGovernance.selected.rollbackAvailable).toEqual(expect.any(Boolean));
    expect(forecast.modelGovernance.candidates.length).toBeGreaterThan(0);
    expect(forecast.allModels[0]).toHaveProperty("modelType");
    expect(forecast.ensembleModel).toBeTruthy();
  });

  it("publishes an enterprise model inventory with rollback metadata", () => {
    const records = listModelRegistryRecords();
    const summary = getRegistrySummary();

    expect(records.length).toBeGreaterThanOrEqual(12);
    expect(summary.productionModels).toBeGreaterThan(8);
    expect(summary.rollbackEnabledModels).toBeGreaterThan(8);
    expect(records.find(record => record.key === "loan-default")).toMatchObject({
      stage: "Production",
      rollbackAvailable: true,
      owner: "Banking Risk Intelligence"
    });
  });

  it("attaches governance to non-forecast ML engine outputs", () => {
    const assessment = { behaviour: { spendWhenStressed: true, regretImpulseFreq: "often" } };
    const result = {
      awarenessScore: 12,
      behaviourScore: 16,
      stabilityScore: 8,
      runwayMonths: 2,
      healthScore: 42
    };
    const report = generateBehaviorPredictionReport(assessment, result, []);
    const defaultRisk = calculateDefaultProbability(
      { dpd: 45, creditScore: 620, loanBalance: 1200000 },
      { paymentHistory: [{ status: "late" }, { status: "paid" }, { status: "late" }], customerHistory: [] }
    );

    expect(report.modelGovernance.impulseSpendingRisk.lineageId).toContain(
      "arthos.behavior.impulse_spending_risk"
    );
    expect(report.impulseSpendingRisk.modelGovernance.version).toMatch(/^v/);
    expect(defaultRisk.modelGovernance.lineageId).toContain("arthos.banking.loan_default_risk");
    expect(defaultRisk.modelGovernance.rollbackAvailable).toBe(true);
  });
});
