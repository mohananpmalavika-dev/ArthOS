/**
 * test/engines/predictionEngine.test.js
 * Unit tests for financial prediction/forecasting engine
 * 
 * Focus: Scenario forecasting, probability calculations, trend analysis
 * Priority: HIGH
 * Target Coverage: 75%+
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  predictionEngineForecastHealth,
  generatePrediction,
  simulateScenario,
  compareScenarios
} from '../../src/engines/predictionEngine.js';
import { createMockAssessment } from '../fixtures/factories.js';

describe('predictionEngine.js - Financial Health Forecasting', () => {
  let mockAssessment;
  let mockResult;

  beforeEach(() => {
    mockAssessment = createMockAssessment();
    mockResult = {
      healthScore: 65,
      personalityType: 'Optimizer',
      survivalMonthsRaw: 8,
      components: {
        behaviour: 28,
        awareness: 18,
        stability: 15
      }
    };
  });

  // ============================================================================
  // CORE PREDICTION FUNCTIONALITY
  // ============================================================================

  describe('predictionEngineForecastHealth()', () => {
    it('should return forecast object with required structure', () => {
      const forecast = predictionEngineForecastHealth(mockResult, mockAssessment, 12);

      expect(forecast).toBeDefined();
      expect(forecast).toHaveProperty('timeframe');
      expect(forecast).toHaveProperty('scenarios');
      expect(forecast).toHaveProperty('confidence');
      expect(forecast).toHaveProperty('trends');
    });

    it('should handle standard 12-month forecast', () => {
      const forecast = predictionEngineForecastHealth(mockResult, mockAssessment, 12);

      expect(forecast.timeframe).toBe(12);
      expect(Array.isArray(forecast.scenarios)).toBe(true);
      expect(forecast.scenarios.length).toBeGreaterThan(0);
    });

    it('should handle 6-month forecast', () => {
      const forecast = predictionEngineForecastHealth(mockResult, mockAssessment, 6);

      expect(forecast.timeframe).toBe(6);
      expect(forecast.scenarios.length).toBeGreaterThan(0);
    });

    it('should handle 36-month (3-year) forecast', () => {
      const forecast = predictionEngineForecastHealth(mockResult, mockAssessment, 36);

      expect(forecast.timeframe).toBe(36);
      expect(forecast.scenarios.length).toBeGreaterThan(0);
    });

    it('should generate multiple scenarios (optimistic, realistic, pessimistic)', () => {
      const forecast = predictionEngineForecastHealth(mockResult, mockAssessment, 12);

      expect(forecast.scenarios.length).toBeGreaterThanOrEqual(3);
      const scenarioTypes = forecast.scenarios.map(s => s.type);
      expect(scenarioTypes).toContain('optimistic');
      expect(scenarioTypes).toContain('realistic');
      expect(scenarioTypes).toContain('pessimistic');
    });

    it('should maintain score range validity in all scenarios', () => {
      const forecast = predictionEngineForecastHealth(mockResult, mockAssessment, 12);

      forecast.scenarios.forEach(scenario => {
        expect(scenario.projectedScore).toBeGreaterThanOrEqual(0);
        expect(scenario.projectedScore).toBeLessThanOrEqual(100);
        expect(typeof scenario.projectedScore).toBe('number');
      });
    });

    it('should provide higher projections for optimistic scenario', () => {
      const forecast = predictionEngineForecastHealth(mockResult, mockAssessment, 12);

      const optimistic = forecast.scenarios.find(s => s.type === 'optimistic');
      const realistic = forecast.scenarios.find(s => s.type === 'realistic');
      const pessimistic = forecast.scenarios.find(s => s.type === 'pessimistic');

      expect(optimistic.projectedScore).toBeGreaterThanOrEqual(realistic.projectedScore);
      expect(realistic.projectedScore).toBeGreaterThanOrEqual(pessimistic.projectedScore);
    });

    it('should calculate confidence score between 0 and 1', () => {
      const forecast = predictionEngineForecastHealth(mockResult, mockAssessment, 12);

      expect(forecast.confidence).toBeGreaterThanOrEqual(0);
      expect(forecast.confidence).toBeLessThanOrEqual(1);
      expect(typeof forecast.confidence).toBe('number');
    });

    it('should provide lower confidence for longer timeframes', () => {
      const forecast6m = predictionEngineForecastHealth(mockResult, mockAssessment, 6);
      const forecast24m = predictionEngineForecastHealth(mockResult, mockAssessment, 24);

      // Longer forecasts should have lower confidence
      expect(forecast24m.confidence).toBeLessThanOrEqual(forecast6m.confidence);
    });

    it('should include trend analysis in predictions', () => {
      const forecast = predictionEngineForecastHealth(mockResult, mockAssessment, 12);

      expect(forecast.trends).toBeDefined();
      expect(Array.isArray(forecast.trends)).toBe(true);
      forecast.trends.forEach(trend => {
        expect(trend).toHaveProperty('component');
        expect(trend).toHaveProperty('direction');
        expect(['up', 'down', 'stable']).toContain(trend.direction);
      });
    });

    it('should handle high initial health scores', () => {
      const highHealthResult = {
        ...mockResult,
        healthScore: 85,
        components: {
          behaviour: 38,
          awareness: 28,
          stability: 22
        }
      };

      const forecast = predictionEngineForecastHealth(highHealthResult, mockAssessment, 12);
      expect(forecast.scenarios.length).toBeGreaterThan(0);
      expect(forecast.scenarios.some(s => s.projectedScore >= 80)).toBe(true);
    });

    it('should handle low initial health scores', () => {
      const lowHealthResult = {
        ...mockResult,
        healthScore: 25,
        components: {
          behaviour: 8,
          awareness: 8,
          stability: 5
        }
      };

      const forecast = predictionEngineForecastHealth(lowHealthResult, mockAssessment, 12);
      expect(forecast.scenarios.length).toBeGreaterThan(0);
      // Realistic scenario should show improvement or stability
      const realistic = forecast.scenarios.find(s => s.type === 'realistic');
      expect(realistic.projectedScore).toBeGreaterThanOrEqual(0);
    });

    it('should handle null/undefined inputs gracefully', () => {
      expect(() => predictionEngineForecastHealth(null, mockAssessment, 12)).not.toThrow();
      expect(() => predictionEngineForecastHealth(mockResult, null, 12)).not.toThrow();
      expect(() => predictionEngineForecastHealth(mockResult, mockAssessment, null)).not.toThrow();
    });
  });

  // ============================================================================
  // INTEGRATION SCENARIOS
  // ============================================================================

  describe('end-to-end forecasting scenarios', () => {
    it('should produce consistent forecasts across multiple calls', () => {
      const forecast1 = predictionEngineForecastHealth(mockResult, mockAssessment, 12);
      const forecast2 = predictionEngineForecastHealth(mockResult, mockAssessment, 12);

      expect(forecast1.confidence).toBe(forecast2.confidence);
      expect(forecast1.scenarios.length).toBe(forecast2.scenarios.length);
    });

    it('should forecast improvement for rising scores', () => {
      const risingResult = {
        ...mockResult,
        healthScore: 75,
        components: {
          behaviour: 33,
          awareness: 22,
          stability: 18
        }
      };

      const forecast = predictionEngineForecastHealth(risingResult, mockAssessment, 12);
      const realistic = forecast.scenarios.find(s => s.type === 'realistic');

      expect(realistic.projectedScore).toBeGreaterThanOrEqual(mockResult.healthScore);
    });

    it('should forecast stabilization for crisis scenarios', () => {
      const crisisResult = {
        ...mockResult,
        healthScore: 15,
        components: {
          behaviour: 5,
          awareness: 5,
          stability: 3
        }
      };

      const forecast = predictionEngineForecastHealth(crisisResult, mockAssessment, 12);
      const pessimistic = forecast.scenarios.find(s => s.type === 'pessimistic');

      // Even pessimistic shouldn't drop below 0
      expect(pessimistic.projectedScore).toBeGreaterThanOrEqual(0);
    });

    it('should handle short-term vs long-term forecasts', () => {
      const short = predictionEngineForecastHealth(mockResult, mockAssessment, 1);
      const long = predictionEngineForecastHealth(mockResult, mockAssessment, 36);

      // Short-term should have higher confidence
      expect(short.confidence).toBeGreaterThanOrEqual(long.confidence);

      // Long-term projections might differ more
      const shortOptimistic = short.scenarios.find(s => s.type === 'optimistic');
      const longOptimistic = long.scenarios.find(s => s.type === 'optimistic');

      expect(longOptimistic.projectedScore).toBeGreaterThanOrEqual(shortOptimistic.projectedScore);
    });
  });
});
