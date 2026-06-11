# Cognition Layer - Spec v0.1

Purpose
- Capture explicit and implicit money beliefs, cognitive biases, risk perception and emotional triggers.
- Provide APIs for other engines (Insight Generator, Intervention Engine, Forecasting) to query cognitive state.

Core models & data
1. moneyBeliefsProfile
   - structure: { userId, conservatism, growthOrientation, scarcityBias, securityPreference, timestamp }
   - derived from questionnaire + passive signals
2. biasDetectionEngine
   - signature: detectBiases(responses, behaviourEvents) -> { biasScores }
   - target biases: lossAversion, presentBias, optimismBias, anchoring, confirmation, statusQuo
3. riskPerceptionCalibration
   - signature: calibrateRisk(userResponses, behaviourHistory) -> { perceivedRisk, calibrationFactor }
   - stores calibration over time
4. emotionalTriggerGraph
   - directed graph of triggers -> behaviours
   - nodes: trigger (text, category), edge weights: probability of behaviour

APIs (JS)
- analyzeMoneyBeliefs(responses) -> moneyBeliefsProfile
- detectBiases(responses, events) -> { bias: score }
- calibrateRiskPerception(userId, events) -> { perceivedRisk, calibrated }
- getEmotionalTriggers(userId) -> graph

Data persistence
- New tables: user_scores_history, weekly_checkins, goal_history, decision_history, financial_memory, twin_snapshots
- Cognition snapshots stored with timestamp and link to memoryGraph nodes

Privacy & Ethics
- All cognition artifacts flagged for sensitive handling
- Never export raw open-text triggers without review

Roadmap
- v0.1: API scaffolding + questionnaire mapping (this check-in)
- v0.2: behavioral signal mapping + simple calibration algorithm
- v1.0: ML-backed inference and continuous calibration

References
- Blueprint V3 Chapter 14: Financial Cognition
