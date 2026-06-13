// test/scoringEngine.test.js
// Unit tests for ARTH.OS financial health scoring engine
// Run with: npm test or npx vitest

import { describe, it, expect, beforeEach } from "vitest";
import { calculateFinancialHealthV2, componentMaximumsV2 } from "../src/lib/scoring-v2.js";

describe("Financial Health Scoring Engine", () => {
  describe("calculateFinancialHealthV2()", () => {
    let baseAssessment;

    beforeEach(() => {
      baseAssessment = {
        // Participant
        age: 35,
        
        // Behaviour (0-100 each)
        impulseBuyingFrequency: 50,
        impulseBuyingSeverity: 50,
        stressFinancialResponse: 50,
        routineDeviation: 50,
        
        // Awareness (0-100 each)
        financialLiteracy: 60,
        budgetingAwareness: 60,
        investmentKnowledge: 50,
        monitoringFrequency: 60,
        
        // Profile
        monthlyIncome: 100000,
        monthlyExpenses: 60000,
        emergencyFund: 300000,
        debt: 0,
        dependents: 0,
        savingsTendency: 50,
        existingSavings: 500000,
      };
    });

    it("should return valid health score (0-1000)", () => {
      const result = calculateFinancialHealthV2(baseAssessment);
      expect(result.healthScore).toBeGreaterThanOrEqual(0);
      expect(result.healthScore).toBeLessThanOrEqual(1000);
    });

    it("should have component scores for behaviour, awareness, stability", () => {
      const result = calculateFinancialHealthV2(baseAssessment);
      expect(result.componentScores).toBeDefined();
      expect(result.componentScores.behaviour).toBeDefined();
      expect(result.componentScores.awareness).toBeDefined();
      expect(result.componentScores.stability).toBeDefined();
    });

    it("should reflect 40/30/30 BAST weighting", () => {
      // High behaviour, low awareness, high stability
      const result = calculateFinancialHealthV2({
        ...baseAssessment,
        impulseBuyingFrequency: 100,
        financialLiteracy: 10,
        monthlyIncome: 150000,
      });

      const b = result.componentScores.behaviour;
      const a = result.componentScores.awareness;
      const s = result.componentScores.stability;
      
      // Behaviour should be highest at 40% weight
      expect(b).toBeGreaterThan(a);
      expect(b).toBeGreaterThan(s);
    });

    it("should calculate survival window correctly", () => {
      const result = calculateFinancialHealthV2({
        ...baseAssessment,
        monthlyIncome: 100000,
        monthlyExpenses: 60000,
        emergencyFund: 300000, // 5 months of expenses
      });

      expect(result.survivalMonths).toBeGreaterThan(4);
      expect(result.survivalMonths).toBeLessThan(6);
    });

    it("should handle zero monthly expenses edge case", () => {
      const result = calculateFinancialHealthV2({
        ...baseAssessment,
        monthlyExpenses: 0,
      });

      expect(result.healthScore).toBeDefined();
      expect(Number.isFinite(result.healthScore)).toBe(true);
    });

    it("should handle high debt scenario", () => {
      const resultNoDebt = calculateFinancialHealthV2(baseAssessment);
      const resultWithDebt = calculateFinancialHealthV2({
        ...baseAssessment,
        debt: 1000000, // High debt
      });

      // High debt should lower overall score
      expect(resultWithDebt.healthScore).toBeLessThan(resultNoDebt.healthScore);
    });

    it("should calculate blindspot (perceived vs actual runway)", () => {
      const result = calculateFinancialHealthV2({
        ...baseAssessment,
        budgetingAwareness: 20, // Low awareness
        financialLiteracy: 20,
      });

      expect(result.blindSpotData).toBeDefined();
      expect(result.blindSpotData.perceivedMonths).toBeDefined();
      expect(result.blindSpotData.actualMonths).toBeDefined();
      expect(result.blindSpotData.insight).toBeDefined();
    });

    it("should generate recommended actions", () => {
      const result = calculateFinancialHealthV2(baseAssessment);
      
      expect(result.recommendedActions).toBeDefined();
      expect(Array.isArray(result.recommendedActions)).toBe(true);
    });

    it("should normalize component scores to 0-100 range", () => {
      const result = calculateFinancialHealthV2(baseAssessment);
      
      expect(result.componentScores.behaviour).toBeGreaterThanOrEqual(0);
      expect(result.componentScores.behaviour).toBeLessThanOrEqual(100);
      expect(result.componentScores.awareness).toBeGreaterThanOrEqual(0);
      expect(result.componentScores.awareness).toBeLessThanOrEqual(100);
      expect(result.componentScores.stability).toBeGreaterThanOrEqual(0);
      expect(result.componentScores.stability).toBeLessThanOrEqual(100);
    });
  });

  describe("Health Score Bands", () => {
    it("should classify Critical health (0-199/1000)", () => {
      const result = calculateFinancialHealthV2({
        age: 35,
        impulseBuyingFrequency: 100,
        stressFinancialResponse: 100,
        financialLiteracy: 10,
        monthlyIncome: 30000,
        monthlyExpenses: 28000,
        emergencyFund: 0,
        debt: 500000,
        dependents: 3,
        savingsTendency: 10,
        existingSavings: 0,
      });

      expect(result.healthScore).toBeLessThan(200);
    });

    it("should classify Resilient health (600-799/1000)", () => {
      const result = calculateFinancialHealthV2({
        age: 35,
        impulseBuyingFrequency: 30,
        stressFinancialResponse: 40,
        financialLiteracy: 80,
        budgetingAwareness: 80,
        monthlyIncome: 150000,
        monthlyExpenses: 60000,
        emergencyFund: 600000,
        debt: 0,
        dependents: 0,
        savingsTendency: 80,
        existingSavings: 1000000,
      });

      expect(result.healthScore).toBeGreaterThanOrEqual(600);
      expect(result.healthScore).toBeLessThan(800);
    });

    it("should classify Sovereign health (800-1000/1000)", () => {
      const result = calculateFinancialHealthV2({
        age: 45,
        impulseBuyingFrequency: 10,
        stressFinancialResponse: 20,
        financialLiteracy: 95,
        budgetingAwareness: 95,
        monthlyIncome: 300000,
        monthlyExpenses: 80000,
        emergencyFund: 1200000,
        debt: 0,
        dependents: 1,
        savingsTendency: 95,
        existingSavings: 5000000,
      });

      expect(result.healthScore).toBeGreaterThanOrEqual(800);
      expect(result.healthScore).toBeLessThanOrEqual(1000);
    });
  });

  describe("Behaviour Component", () => {
    it("should increase score with lower impulse buying", () => {
      const lowImpulse = calculateFinancialHealthV2({
        age: 35,
        impulseBuyingFrequency: 10,
        impulseBuyingSeverity: 10,
        stressFinancialResponse: 50,
        routineDeviation: 50,
        financialLiteracy: 60,
        budgetingAwareness: 60,
        investmentKnowledge: 50,
        monitoringFrequency: 60,
        monthlyIncome: 100000,
        monthlyExpenses: 60000,
        emergencyFund: 300000,
        debt: 0,
        dependents: 0,
        savingsTendency: 50,
        existingSavings: 500000,
      });

      const highImpulse = calculateFinancialHealthV2({
        age: 35,
        impulseBuyingFrequency: 100,
        impulseBuyingSeverity: 100,
        stressFinancialResponse: 50,
        routineDeviation: 50,
        financialLiteracy: 60,
        budgetingAwareness: 60,
        investmentKnowledge: 50,
        monitoringFrequency: 60,
        monthlyIncome: 100000,
        monthlyExpenses: 60000,
        emergencyFund: 300000,
        debt: 0,
        dependents: 0,
        savingsTendency: 50,
        existingSavings: 500000,
      });

      expect(lowImpulse.componentScores.behaviour).toBeGreaterThan(
        highImpulse.componentScores.behaviour
      );
    });
  });

  describe("Awareness Component", () => {
    it("should increase score with higher financial literacy", () => {
      const lowLiteracy = calculateFinancialHealthV2({
        age: 35,
        impulseBuyingFrequency: 50,
        impulseBuyingSeverity: 50,
        stressFinancialResponse: 50,
        routineDeviation: 50,
        financialLiteracy: 20,
        budgetingAwareness: 20,
        investmentKnowledge: 20,
        monitoringFrequency: 20,
        monthlyIncome: 100000,
        monthlyExpenses: 60000,
        emergencyFund: 300000,
        debt: 0,
        dependents: 0,
        savingsTendency: 50,
        existingSavings: 500000,
      });

      const highLiteracy = calculateFinancialHealthV2({
        age: 35,
        impulseBuyingFrequency: 50,
        impulseBuyingSeverity: 50,
        stressFinancialResponse: 50,
        routineDeviation: 50,
        financialLiteracy: 95,
        budgetingAwareness: 95,
        investmentKnowledge: 95,
        monitoringFrequency: 95,
        monthlyIncome: 100000,
        monthlyExpenses: 60000,
        emergencyFund: 300000,
        debt: 0,
        dependents: 0,
        savingsTendency: 50,
        existingSavings: 500000,
      });

      expect(highLiteracy.componentScores.awareness).toBeGreaterThan(
        lowLiteracy.componentScores.awareness
      );
    });
  });

  describe("Stability Component", () => {
    it("should increase with higher monthly income relative to expenses", () => {
      const lowStability = calculateFinancialHealthV2({
        age: 35,
        impulseBuyingFrequency: 50,
        impulseBuyingSeverity: 50,
        stressFinancialResponse: 50,
        routineDeviation: 50,
        financialLiteracy: 60,
        budgetingAwareness: 60,
        investmentKnowledge: 50,
        monitoringFrequency: 60,
        monthlyIncome: 70000,
        monthlyExpenses: 65000, // Tight margins
        emergencyFund: 100000,
        debt: 0,
        dependents: 2,
        savingsTendency: 50,
        existingSavings: 100000,
      });

      const highStability = calculateFinancialHealthV2({
        age: 35,
        impulseBuyingFrequency: 50,
        impulseBuyingSeverity: 50,
        stressFinancialResponse: 50,
        routineDeviation: 50,
        financialLiteracy: 60,
        budgetingAwareness: 60,
        investmentKnowledge: 50,
        monitoringFrequency: 60,
        monthlyIncome: 200000,
        monthlyExpenses: 60000, // Comfortable margins
        emergencyFund: 600000,
        debt: 0,
        dependents: 0,
        savingsTendency: 50,
        existingSavings: 1000000,
      });

      expect(highStability.componentScores.stability).toBeGreaterThan(
        lowStability.componentScores.stability
      );
    });

    it("should penalize high debt levels", () => {
      const noDebt = calculateFinancialHealthV2({
        age: 35,
        impulseBuyingFrequency: 50,
        impulseBuyingSeverity: 50,
        stressFinancialResponse: 50,
        routineDeviation: 50,
        financialLiteracy: 60,
        budgetingAwareness: 60,
        investmentKnowledge: 50,
        monitoringFrequency: 60,
        monthlyIncome: 100000,
        monthlyExpenses: 60000,
        emergencyFund: 300000,
        debt: 0,
        dependents: 0,
        savingsTendency: 50,
        existingSavings: 500000,
      });

      const highDebt = calculateFinancialHealthV2({
        age: 35,
        impulseBuyingFrequency: 50,
        impulseBuyingSeverity: 50,
        stressFinancialResponse: 50,
        routineDeviation: 50,
        financialLiteracy: 60,
        budgetingAwareness: 60,
        investmentKnowledge: 50,
        monitoringFrequency: 60,
        monthlyIncome: 100000,
        monthlyExpenses: 60000,
        emergencyFund: 300000,
        debt: 1000000, // High debt
        dependents: 0,
        savingsTendency: 50,
        existingSavings: 500000,
      });

      expect(highDebt.componentScores.stability).toBeLessThan(
        noDebt.componentScores.stability
      );
    });
  });

  describe("Recommended Actions", () => {
    it("should recommend action when behaviour score is low", () => {
      const result = calculateFinancialHealthV2({
        age: 35,
        impulseBuyingFrequency: 90,
        impulseBuyingSeverity: 90,
        stressFinancialResponse: 90,
        routineDeviation: 90,
        financialLiteracy: 60,
        budgetingAwareness: 60,
        investmentKnowledge: 50,
        monitoringFrequency: 60,
        monthlyIncome: 100000,
        monthlyExpenses: 60000,
        emergencyFund: 300000,
        debt: 0,
        dependents: 0,
        savingsTendency: 50,
        existingSavings: 500000,
      });

      expect(result.recommendedActions.length).toBeGreaterThan(0);
      const hasBehaviourAction = result.recommendedActions.some(
        (action) => action.toLowerCase().includes("behaviour") || 
                    action.toLowerCase().includes("impulse") ||
                    action.toLowerCase().includes("spending")
      );
      expect(hasBehaviourAction).toBe(true);
    });

    it("should recommend action when survival window is tight", () => {
      const result = calculateFinancialHealthV2({
        age: 35,
        impulseBuyingFrequency: 50,
        impulseBuyingSeverity: 50,
        stressFinancialResponse: 50,
        routineDeviation: 50,
        financialLiteracy: 60,
        budgetingAwareness: 60,
        investmentKnowledge: 50,
        monitoringFrequency: 60,
        monthlyIncome: 80000,
        monthlyExpenses: 75000, // Tight budget
        emergencyFund: 50000, // Only 10 days
        debt: 0,
        dependents: 0,
        savingsTendency: 50,
        existingSavings: 50000,
      });

      expect(result.recommendedActions.length).toBeGreaterThan(0);
      const hasEmergencyAction = result.recommendedActions.some(
        (action) => action.toLowerCase().includes("emergency") || 
                    action.toLowerCase().includes("runway") ||
                    action.toLowerCase().includes("buffer")
      );
      expect(hasEmergencyAction).toBe(true);
    });
  });

  describe("Edge Cases & Boundary Conditions", () => {
    it("should handle very young age", () => {
      const result = calculateFinancialHealthV2({
        age: 18,
        impulseBuyingFrequency: 50,
        impulseBuyingSeverity: 50,
        stressFinancialResponse: 50,
        routineDeviation: 50,
        financialLiteracy: 50,
        budgetingAwareness: 50,
        investmentKnowledge: 50,
        monitoringFrequency: 50,
        monthlyIncome: 30000,
        monthlyExpenses: 25000,
        emergencyFund: 50000,
        debt: 0,
        dependents: 0,
        savingsTendency: 50,
        existingSavings: 50000,
      });

      expect(result.healthScore).toBeDefined();
      expect(Number.isFinite(result.healthScore)).toBe(true);
    });

    it("should handle high number of dependents", () => {
      const result = calculateFinancialHealthV2({
        age: 40,
        impulseBuyingFrequency: 50,
        impulseBuyingSeverity: 50,
        stressFinancialResponse: 50,
        routineDeviation: 50,
        financialLiteracy: 60,
        budgetingAwareness: 60,
        investmentKnowledge: 50,
        monitoringFrequency: 60,
        monthlyIncome: 150000,
        monthlyExpenses: 120000,
        emergencyFund: 600000,
        debt: 0,
        dependents: 5,
        savingsTendency: 50,
        existingSavings: 500000,
      });

      expect(result.healthScore).toBeDefined();
      expect(Number.isFinite(result.healthScore)).toBe(true);
    });

    it("should handle all minimum values", () => {
      const result = calculateFinancialHealthV2({
        age: 18,
        impulseBuyingFrequency: 0,
        impulseBuyingSeverity: 0,
        stressFinancialResponse: 0,
        routineDeviation: 0,
        financialLiteracy: 0,
        budgetingAwareness: 0,
        investmentKnowledge: 0,
        monitoringFrequency: 0,
        monthlyIncome: 10000,
        monthlyExpenses: 9500,
        emergencyFund: 1000,
        debt: 0,
        dependents: 0,
        savingsTendency: 0,
        existingSavings: 0,
      });

      expect(result.healthScore).toBeGreaterThanOrEqual(0);
      expect(result.healthScore).toBeLessThanOrEqual(1000);
    });

    it("should handle all maximum values", () => {
      const result = calculateFinancialHealthV2({
        age: 99,
        impulseBuyingFrequency: 100,
        impulseBuyingSeverity: 100,
        stressFinancialResponse: 100,
        routineDeviation: 100,
        financialLiteracy: 100,
        budgetingAwareness: 100,
        investmentKnowledge: 100,
        monitoringFrequency: 100,
        monthlyIncome: 1000000,
        monthlyExpenses: 100000,
        emergencyFund: 5000000,
        debt: 0,
        dependents: 0,
        savingsTendency: 100,
        existingSavings: 50000000,
      });

      expect(result.healthScore).toBeGreaterThanOrEqual(0);
      expect(result.healthScore).toBeLessThanOrEqual(1000);
    });
  });
});
