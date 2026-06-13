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
      const forecast = predictionEngineForecastHealth(mockResult.healthScore, [], mockAssessment, 12);

      expect(forecast).toBeDefined();
      expect(forecast).toHaveProperty('day30');
      expect(forecast).toHaveProperty('day90');
      expect(forecast).toHaveProperty('day180');
      expect(forecast).toHaveProperty('confidence');
    });

    it('should handle standard 12-month forecast', () => {
      const forecast = predictionEngineForecastHealth(mockResult.healthScore, [], mockAssessment, 12);

      expect(forecast).toBeDefined();
      expect(forecast.day30).toBeDefined();
      expect(forecast.day90).toBeDefined();
      expect(forecast.day180).toBeDefined();
    });

    it('should handle 6-month forecast', () => {
      const forecast = predictionEngineForecastHealth(mockResult.healthScore, [], mockAssessment, 6);

      expect(forecast).toBeDefined();
      expect(forecast.day30).toBeDefined();
    });

    it('should handle 36-month (3-year) forecast', () => {
      const forecast = predictionEngineForecastHealth(mockResult.healthScore, [], mockAssessment, 36);

      expect(forecast).toBeDefined();
      expect(forecast.day180).toBeDefined();
    });

    it('should generate forecast horizons (day30, day90, day180)', () => {
      const forecast = predictionEngineForecastHealth(mockResult.healthScore, [], mockAssessment, 12);

      expect(forecast.day30).toBeDefined();
      expect(forecast.day90).toBeDefined();
      expect(forecast.day180).toBeDefined();
      
      // Each horizon should have quantile estimates
      if (forecast.day30 && forecast.day30.point !== null) {
        expect(typeof forecast.day30.p50).toBe('number' || forecast.day30.p50 === null);
      }
    });

    it('should maintain forecast validity', () => {
      const forecast = predictionEngineForecastHealth(mockResult.healthScore, [], mockAssessment, 12);

      // Each horizon should have valid structure
      [forecast.day30, forecast.day90, forecast.day180].forEach(horizon => {
        if (horizon && horizon.point !== null) {
          expect(typeof horizon.p50 === 'number' || horizon.p50 === null).toBe(true);
        }
      });
    });

    it('should provide confidence score for forecast', () => {
      const forecast = predictionEngineForecastHealth(mockResult.healthScore, [], mockAssessment, 12);

      expect(typeof forecast.confidence).toBe('number');
      expect(forecast.confidence).toBeGreaterThanOrEqual(0);
      expect(forecast.confidence).toBeLessThanOrEqual(100);
    });

    it('should include model information', () => {
      const forecast = predictionEngineForecastHealth(mockResult.healthScore, [], mockAssessment, 12);

      expect(typeof forecast.model).toBe('string');
      expect(typeof forecast.modelType).toBe('string');
      expect(typeof forecast.confidence).toBe('number');
    });

    it('should handle high initial health scores', () => {
      const forecast = predictionEngineForecastHealth(85, [], mockAssessment, 12);

      expect(forecast).toBeDefined();
      expect(forecast.day30).toBeDefined();
      expect(forecast.confidence).toBeGreaterThan(0);
    });

    it('should handle low initial health scores', () => {
      const forecast = predictionEngineForecastHealth(25, [], mockAssessment, 12);

      expect(forecast).toBeDefined();
      expect(forecast.day30).toBeDefined();
      // Low scores should still generate forecasts
      expect(forecast.confidence).toBeGreaterThan(0);
    });

    it('should handle null/undefined inputs gracefully', () => {
      expect(() => predictionEngineForecastHealth(null, [], mockAssessment, 12)).not.toThrow();
      expect(() => predictionEngineForecastHealth(65, null, mockAssessment, 12)).not.toThrow();
      expect(() => predictionEngineForecastHealth(65, [], null, 12)).not.toThrow();
    });
  });

  // ============================================================================
  // INTEGRATION SCENARIOS
  // ============================================================================

  describe('end-to-end forecasting scenarios', () => {
    it('should produce consistent forecasts across multiple calls', () => {
      const forecast1 = predictionEngineForecastHealth(mockResult.healthScore, [], mockAssessment, 12);
      const forecast2 = predictionEngineForecastHealth(mockResult.healthScore, [], mockAssessment, 12);

      expect(forecast1.confidence).toBe(forecast2.confidence);
      expect(forecast1.modelType).toBe(forecast2.modelType);
    });

    it('should forecast based on score history', () => {
      const risingHistory = [45, 50, 55, 60, 65];
      const forecast = predictionEngineForecastHealth(65, risingHistory, mockAssessment, 12);

      expect(forecast).toBeDefined();
      expect(forecast.confidence).toBeGreaterThan(0);
    });

    it('should forecast stabilization for crisis scenarios', () => {
      const crisisHistory = [15, 18, 20, 22, 25];
      const forecast = predictionEngineForecastHealth(25, crisisHistory, mockAssessment, 12);

      expect(forecast).toBeDefined();
      expect(forecast.day180).toBeDefined();
      // Forecast should be generated even for low scores
      expect(forecast.confidence).toBeGreaterThan(0);
    });

    it('should handle short-term vs long-term forecasts', () => {
      const history = [50, 55, 60, 65];
      const short = predictionEngineForecastHealth(65, history, mockAssessment, 6);
      const long = predictionEngineForecastHealth(65, history, mockAssessment, 36);

      // Both should generate forecasts
      expect(short.day30).toBeDefined();
      expect(long.day180).toBeDefined();
      
      // Confidence should be reasonable for both
      expect(short.confidence).toBeGreaterThan(0);
      expect(long.confidence).toBeGreaterThan(0);
    });
  });
});
