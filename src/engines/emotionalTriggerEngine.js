/**
 * L07: Emotional Trigger Engine — Consolidated into cognitionEngine
 *
 * This module is now a thin re-export of the production-grade implementation
 * in cognitionEngine.js. The weighted multi-factor model, trigger graph construction,
 * and temporal pattern tracking live in cognitionEngine.
 *
 * Blueprint spec: "Models money beliefs, cognitive biases, behavioural patterns"
 * Full implementation: ./cognitionEngine.js
 */
import { getEmotionalTriggers, buildCognitionProfile } from "./cognitionEngine.js";
export { getEmotionalTriggers, buildCognitionProfile };
export const detectTriggers = (user = {}) => {
  const raw = getEmotionalTriggers(user, []).triggers;
  // Normalize to legacy key names so EmotionalTriggersCard works without changes
  return {
    stressSpending: raw.stress || 0,
    boredomSpending: raw.boredom || 0,
    socialPressure: raw.socialPressure || 0,
    anxietyAvoidance: raw.anxietyAvoidance || 0,
    celebratorySpending: raw.celebration || 0
  };
};
export const identifyTriggerPatterns = (triggers = {}, history = []) => {
  const patterns = [];
  if (triggers.stressSpending > 70) {
    patterns.push("High stress-triggered spending");
  }
  if (triggers.boredomSpending > 70) {
    patterns.push("Boredom impulse buying");
  }
  if (triggers.socialPressure > 70) {
    patterns.push("Social comparison spending");
  }
  if (triggers.anxietyAvoidance > 70) {
    patterns.push("Anxiety-avoidance behavior");
  }
  if (triggers.celebratorySpending > 70) {
    patterns.push("Celebration overspending");
  }

  const recentTriggers = history
    .slice(-7)
    .map(h => h.trigger || null)
    .filter(Boolean);
  const triggerFrequency = {};
  recentTriggers.forEach(t => {
    triggerFrequency[t] = (triggerFrequency[t] || 0) + 1;
  });

  return {
    patterns,
    triggerFrequency,
    dominantTrigger: Object.entries(triggerFrequency).sort((a, b) => b[1] - a[1])[0]?.[0] || null,
    generatedAt: new Date().toISOString()
  };
};
