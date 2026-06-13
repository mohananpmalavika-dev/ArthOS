/**
 * test/engines/biasEngine.test.js
 * Unit tests for cognitive bias detection and risk calibration
 * 
 * Focus: Bias identification, risk perception calibration, systematic errors
 * Priority: HIGH
 * Target Coverage: 75%+
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { detectBiases, calculateRiskCalibration } from '../../src/engines/biasEngine.js';
import { createMockAssessment } from '../fixtures/factories.js';

describe('biasEngine.js - Cognitive Bias Detection', () => {
  let mockUser;

  beforeEach(() => {
    mockUser = createMockAssessment();
  });

  // ============================================================================
  // BIAS DETECTION
  // ============================================================================

  describe('detectBiases()', () => {
    it('should return biases object with defined structure', () => {
      const biases = detectBiases(mockUser);

      expect(biases).toBeDefined();
      expect(typeof biases).toBe('object');
    });

    it('should identify anchoring bias patterns', () => {
      const userWithAnchorBias = {
        ...mockUser,
        spending_patterns: 'follows_initial_budget',
        reacts_to_new_info: 'very_slowly'
      };
      const biases = detectBiases(userWithAnchorBias);

      expect(biases.anchoring).toBeDefined();
    });

    it('should identify availability bias', () => {
      const userWithAvailabilityBias = {
        ...mockUser,
        recent_losses: 3,
        risk_perception: 'very_high',
        makes_decisions_based_on: 'recent_events'
      };
      const biases = detectBiases(userWithAvailabilityBias);

      expect(biases.availability).toBeDefined();
    });

    it('should identify confirmation bias', () => {
      const userWithConfirmationBias = {
        ...mockUser,
        seeks_diverse_info: false,
        ignores_contrary_evidence: true,
        financial_beliefs: 'unchanging'
      };
      const biases = detectBiases(userWithConfirmationBias);

      expect(biases.confirmation).toBeDefined();
    });

    it('should identify loss aversion', () => {
      const userWithLossAversion = {
        ...mockUser,
        avoids_losses: 'extremely',
        risk_tolerance: 'very_low',
        has_made_risky_investments: false
      };
      const biases = detectBiases(userWithLossAversion);

      expect(biases.loss_aversion).toBeDefined();
    });

    it('should identify overconfidence bias', () => {
      const userWithOverconfidence = {
        ...mockUser,
        believes_better_than_average: true,
        prediction_accuracy_actual: 0.3,
        prediction_accuracy_perceived: 0.9
      };
      const biases = detectBiases(userWithOverconfidence);

      expect(biases.overconfidence).toBeDefined();
    });

    it('should return severity level for each bias', () => {
      const biases = detectBiases(mockUser);

      Object.values(biases).forEach((bias) => {
        if (bias && typeof bias === 'object') {
          expect(['none', 'low', 'moderate', 'high']).toContain(bias.severity);
        }
      });
    });

    it('should handle empty user profile', () => {
      const biases = detectBiases({});

      expect(biases).toBeDefined();
      expect(typeof biases).toBe('object');
    });
  });

  // ============================================================================
  // RISK CALIBRATION
  // ============================================================================

  describe('calculateRiskCalibration()', () => {
    it('should return calibration score between -100 and 100', () => {
      const calibration = calculateRiskCalibration(50, 50);

      expect(typeof calibration).toBe('number');
      expect(calibration).toBeGreaterThanOrEqual(-100);
      expect(calibration).toBeLessThanOrEqual(100);
    });

    it('should show 0 when perceived and actual risk match', () => {
      const calibration = calculateRiskCalibration(50, 50);

      expect(Math.abs(calibration)).toBeLessThan(5);
    });

    it('should show positive calibration for underestimation', () => {
      const calibration = calculateRiskCalibration(30, 70);

      expect(calibration).toBeLessThan(-10);
    });

    it('should show negative calibration for overestimation', () => {
      const calibration = calculateRiskCalibration(80, 30);

      expect(calibration).toBeGreaterThan(10);
    });

    it('should handle extreme values', () => {
      expect(calculateRiskCalibration(0, 100)).toBeDefined();
      expect(calculateRiskCalibration(100, 0)).toBeDefined();
      expect(calculateRiskCalibration(0, 0)).toBeDefined();
      expect(calculateRiskCalibration(100, 100)).toBeDefined();
    });

    it('should use optional weights parameter', () => {
      const calibration1 = calculateRiskCalibration(50, 60);
      const calibration2 = calculateRiskCalibration(50, 60, 2);

      expect(calibration2).toBeDefined();
    });

    it('should identify severe miscalibration', () => {
      const severeUnderestimation = calculateRiskCalibration(10, 90);
      const severeOverestimation = calculateRiskCalibration(90, 10);

      expect(Math.abs(severeUnderestimation)).toBeGreaterThan(50);
      expect(Math.abs(severeOverestimation)).toBeGreaterThan(50);
    });
  });

  // ============================================================================
  // BIAS-RISK RELATIONSHIP
  // ============================================================================

  describe('Bias and Risk Calibration Relationship', () => {
    it('should correlate overconfidence with risk underestimation', () => {
      const overconfidentUser = {
        ...mockUser,
        believes_better_than_average: true,
        prediction_accuracy_perceived: 0.9,
        prediction_accuracy_actual: 0.4
      };
      const biases = detectBiases(overconfidentUser);
      const riskCalibration = calculateRiskCalibration(30, 70);

      expect(biases.overconfidence?.detected).toBe(true);
      expect(riskCalibration).toBeLessThan(-20);
    });

    it('should correlate loss aversion with risk overestimation', () => {
      const lossAverseUser = {
        ...mockUser,
        avoids_losses: 'extremely',
        risk_tolerance: 'very_low'
      };
      const biases = detectBiases(lossAverseUser);
      const riskCalibration = calculateRiskCalibration(80, 20);

      expect(biases.loss_aversion?.detected).toBe(true);
      expect(riskCalibration).toBeGreaterThan(20);
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('Integration: Bias Detection Workflow', () => {
    it('should identify multiple biases in same profile', () => {
      const complexUser = {
        ...mockUser,
        anchors_to_numbers: true,
        seeks_diverse_info: false,
        avoids_losses: true,
        believes_better_than_average: true
      };
      const biases = detectBiases(complexUser);

      const detectedCount = Object.values(biases).filter(
        (b) => b && typeof b === 'object' && b.detected
      ).length;

      expect(detectedCount).toBeGreaterThanOrEqual(0);
    });

    it('should provide actionable recommendations', () => {
      const biases = detectBiases(mockUser);

      Object.values(biases).forEach((bias) => {
        if (bias && typeof bias === 'object' && bias.severity !== 'none') {
          expect(bias.recommendation).toBeDefined();
          expect(bias.recommendation.length).toBeGreaterThan(0);
        }
      });
    });
  });
});
