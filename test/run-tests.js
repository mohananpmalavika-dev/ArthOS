import assert from 'assert';
import { analyzeMoneyBeliefs, detectBiases } from '../src/engines/cognitionEngine.js';
import { forecast30d, forecastHealth } from '../src/engines/forecastEngine.js';
import { detectBiases as detectCognitiveBiases, calculateRiskCalibration } from '../src/engines/biasEngine.js';
import { stressTestTwin } from '../src/engines/financialTwinEngine.js';
import { generateMemoryInsight } from '../src/engines/contextualMemoryEngine.js';
import { opportunityForecast } from '../src/engines/opportunityForecastEngine.js';
import { CognitionGraph, FinancialCognitionGraph } from '../src/engines/cognitionGraph.js';
import { deriveMoneyBeliefs } from '../src/engines/moneyBeliefEngine.js';
import { generateTrajectoryNarrative } from '../src/engines/financialMemoryEngine.js';
import { confidenceScore } from '../src/engines/forecastEngine.js';
import { calculateConfidence } from '../src/engines/confidenceEngine.js';
import { generateAlerts } from '../src/engines/riskOpportunityEngine.js';
import { createDefaultProviderMarketplace } from '../src/lib/providerMarketplace.js';
import { ArthMarketplace } from '../src/lib/integrations.js';
import { UnifiedMemoryEngine } from '../src/engines/unifiedMemoryEngine.js';
import { detectTriggers, identifyTriggerPatterns } from '../src/engines/emotionalTriggerEngine.js';
import { compareAlternatives, simulateCounterfactual } from '../src/engines/counterfactualEngine.js';
import { FinancialMindProfile } from '../src/lib/FinancialMindProfile.js';
import { integrations, registerProvider, ProviderRegistry } from '../src/lib/integrations.js';
import { decision as decisionHandler, riskScore as riskScoreHandler, riskOpportunity as riskOpportunityHandler } from '../api/index.js';
import { scoreDecision, decisionTrend } from '../src/engines/decisionIntelligence.js';

function mockRes() {
  const res = {};
  res.statusCode = 200;
  res.headers = {};
  res._body = null;
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => { res._body = obj; return res; };
  res.setHeader = (k, v) => { res.headers[k] = v; };
  res.end = () => res;
  return res;
}

async function testCognition() {
  const out = analyzeMoneyBeliefs({ riskAversion: 42, savingAnxiety: 10, investmentInterest: 7 });
  assert.ok(out.conservatism !== undefined, 'conservatism present');
  const biases = detectBiases({ holdingLosses: 8, avoidFuturePlanning: 2, overconfidence: 9 }, [{ type: 'impulse_purchase' }]);
  assert.ok(biases.lossAversion > 0, 'loss aversion detected');
}

async function testForecast() {
  const history = Array.from({ length: 30 }, (_, i) => ({ balance: 1000 + i * 10 }));
  const p = forecast30d({}, history);
  assert.ok(Array.isArray(p.projection) && p.projection.length === 30, '30d projection');
  const health = forecastHealth(42, 5);
  assert.ok(health.day30 && typeof health.day30.p50 === 'number', 'forecast health 30d object');
  assert.ok(health.day30.p25 <= health.day30.p50 && health.day30.p50 <= health.day30.p75, 'forecast percentiles ordered');
}

async function testDecisionApi() {
  const postReq = { method: 'POST', body: { userId: 'test-user', decision: { category: 'test', notes: 'This feels urgent but also aligned with savings goals' } } };
  const postRes = mockRes();
  await decisionHandler(postReq, postRes);
  assert.strictEqual(postRes.statusCode, 200, 'POST /api/decision ok');

  const getReq = { method: 'GET', query: { userId: 'test-user' } };
  const getRes = mockRes();
  await decisionHandler(getReq, getRes);
  assert.strictEqual(getRes.statusCode, 200, 'GET /api/decision ok');
  assert.ok(Array.isArray(getRes._body.decisions), 'decisions array returned');
  assert.ok(getRes._body.trend, 'trend returned');
}

async function testDecisionIntelligence() {
  const scored = scoreDecision({ category: 'investment', notes: 'I want to build savings for a long-term goal', goalAlignment: true, valueConsistency: 85 });
  assert.ok(scored.overallDecisionQuality >= 0 && scored.overallDecisionQuality <= 100, 'overallDecisionQuality computed');
  const trend = decisionTrend([scored]);
  assert.strictEqual(trend.trend, 'Improving', 'decision trend calculated');
}

async function testBiasEngine() {
  const biases = detectCognitiveBiases({ presentFutureMindset: 8, lossAversion: 7, optimismBias: 3, anchoring: 2, sunkCost: 1 });
  assert.strictEqual(typeof biases.presentBias, 'number', 'presentBias exists');
  const calibration = calculateRiskCalibration(70, 50);
  assert.ok(calibration.calibrated === false, 'risk calibration returns false when gap is large');
}

async function testTwinStress() {
  const output = stressTestTwin({ monthlyIncome: 10000, expenses: 4000, savings: 20000, healthScore: 70 });
  assert.ok(output.scenario.includes('Stress'), 'stress scenario label set');
  assert.ok(typeof output.runway === 'number', 'stress runway computed');
  assert.ok(typeof output.worstCaseSurvival === 'number', 'worst case survival computed');
  assert.ok(output.incomeLoss50.survivalMonths > 0, 'income loss sub-scenario computed');
  assert.ok(output.jobLoss.survivalMonths > 0, 'job loss sub-scenario computed');
}

async function testMemoryInsight() {
  const insight = generateMemoryInsight([{ event: 'salary_hike', amount: 10000 }]);
  assert.ok(insight && insight.insight.includes('salary increase'), 'memory insight generated');
}

async function testUnifiedMemoryEngine() {
  const engine = new UnifiedMemoryEngine();
  const beforeCount = engine.getHistory().length;
  engine.addEvent({ type: 'test_event', name: 'Sample event' });
  const after = engine.getHistory();
  assert.strictEqual(after.length, beforeCount + 1, 'memory event added');
  assert.strictEqual(after.at(-1).type, 'test_event', 'type preserved');
}

async function testTrajectoryNarrative() {
  const narrative = generateTrajectoryNarrative([{ score: 400 }, { score: 530 }]);
  assert.ok(narrative.toLowerCase().includes('upward') || narrative.toLowerCase().includes('improvement'), 'trajectory narrative generated');
}

async function testConfidenceScore() {
  assert.strictEqual(confidenceScore(0), 40, 'confidence floor');
  assert.strictEqual(confidenceScore(8), 80, 'confidence grows with data points');
  assert.strictEqual(confidenceScore(20), 100, 'confidence capped at 100');
}

async function testCalculateConfidence() {
  assert.strictEqual(calculateConfidence(0, 0), 0, 'no history yields zero confidence');
  assert.strictEqual(calculateConfidence(5, 3), 26, 'confidence calculated from history and decisions');
  assert.strictEqual(calculateConfidence(30, 30), 100, 'confidence capped at 100');
}

async function testArthMarketplace() {
  const market = new ArthMarketplace();
  market.register({ id: 'p1', name: 'Demo Provider', criteria: () => true });
  const recommended = market.recommend({});
  assert.strictEqual(recommended.length, 1, 'marketplace provider recommended');
}

async function testOpportunityForecast() {
  const forecast = opportunityForecast({ monthlyExpense: 15000 });
  assert.ok(forecast.action.includes('Save ₹'), 'opportunity action generated');
  assert.ok(forecast.benefit.includes('extra months runway'), 'benefit text generated');
}

async function testCognitionGraph() {
  const graph = new CognitionGraph();
  graph.addNode({ id: 'beliefs' });
  graph.connect('beliefs', 'biases', 0.7);
  assert.strictEqual(graph.edges.length, 1, 'graph edge created');
}

async function testFinancialCognitionGraph() {
  const graph = new FinancialCognitionGraph();
  graph.beliefs.push({ id: 'belief1' });
  graph.biases.push({ id: 'bias1' });
  graph.connect('belief1', 'bias1');
  assert.strictEqual(graph.connections.length, 1, 'financial cognition connection created');
}

async function testIntegrationRegistry() {
  registerProvider('banks', { name: 'Test Bank', id: 'test-bank' });
  assert.ok(Array.isArray(integrations.banks) && integrations.banks.length > 0, 'bank provider registered');
}

async function testRiskApi() {
  const req = { method: 'POST', body: { user: { monthlyIncome: 5000, monthlyExpense: 4000, stressLevel: 70, perceivedRisk: 60 } } };
  const res = mockRes();
  await riskScoreHandler(req, res);
  assert.strictEqual(res.statusCode, 200, 'POST /api/risk-score ok');
  assert.ok(res._body.riskScore !== undefined, 'riskScore returned');
}

async function testRiskOpportunityApi() {
  const req = {
    method: 'POST',
    body: {
      user: { monthlyIncome: 8000, monthlyExpense: 3000, savings: 15000, survivalMonths: 12 },
      profile: { monthlyIncome: 8000, monthlyExpense: 3000, emergencySavingsFixed: 10000 },
    },
  };
  const res = mockRes();
  await riskOpportunityHandler(req, res);
  assert.strictEqual(res.statusCode, 200, 'POST /api/risk-opportunity ok');
  assert.ok(Array.isArray(res._body.alerts), 'alerts returned');
  assert.ok(Array.isArray(res._body.recommendations), 'recommendations returned');
}

async function testRiskOpportunityEngine() {
  const alerts = generateAlerts({ monthlyIncome: 15000, monthlyExpense: 8000, savings: 30000, survivalMonths: 24 });
  assert.ok(alerts.some((item) => item.type === 'opportunity'), 'opportunity alert emitted');
  const marketplace = createDefaultProviderMarketplace();
  const recommended = marketplace.recommend({ monthlyIncome: 15000, monthlyExpense: 8000, emergencySavings: 5000, homeLoanEmi: 15000 });
  assert.ok(Array.isArray(recommended), 'recommendations array returned');
}

async function testMoneyBeliefs() {
  const beliefs = deriveMoneyBeliefs({ savingAnxiety: 8, moneyIdentity: 3, moneySecurity: 7, futureConfidence: 4, spendWhenStressed: true });
  assert.ok(Array.isArray(beliefs.beliefs) && beliefs.beliefs.length > 0, 'beliefs derived');
  assert.ok(beliefs.beliefScores.scarcityVsAbundance !== undefined, 'scarcity score computed');
}

async function testEmotionalTriggers() {
  const triggers = detectTriggers({ spendWhenStressed: 8, spendWhenBored: 5, socialInfluenceLevel: 7, avoidBalanceDuringStress: 6 });
  assert.ok(triggers.stressSpending > 0, 'stress spending detected');
  const patterns = identifyTriggerPatterns(triggers, [{ trigger: 'stress' }, { trigger: 'stress' }, { trigger: 'boredom' }]);
  assert.ok(Array.isArray(patterns.patterns), 'patterns identified');
}

async function testCounterfactual() {
  const actual = { overallDecisionQuality: 60 };
  const alternative = { overallDecisionQuality: 75 };
  const comparison = compareAlternatives(actual, alternative);
  assert.strictEqual(comparison.better, 'alternative', 'alternative identified as better');
  assert.ok(comparison.recommendation.includes('Alternative'), 'recommendation generated');
}

async function testFinancialMindProfile() {
  const profile = new FinancialMindProfile({ userId: 'test-user' });
  profile.addBelief('Money as security');
  profile.updateBiases({ presentBias: 70, lossAversion: 65 });
  profile.updateEmotionalTriggers({ stressSpending: 80 });
  profile.recordDecisionPattern({ category: 'savings' });
  
  assert.strictEqual(profile.beliefs.length, 1, 'belief added');
  assert.strictEqual(profile.biases.presentBias, 70, 'bias updated');
  assert.strictEqual(profile.decisionPatterns.length, 1, 'pattern recorded');
  
  const summary = profile.getSummary();
  assert.ok(summary.dominantBeliefs, 'summary includes dominant beliefs');
}

async function testProviderRegistry() {
  const registry = new ProviderRegistry();
  registry.register({ type: 'banks', id: 'bank1', name: 'Bank 1' });
  registry.register({ type: 'lenders', id: 'lender1', name: 'Lender 1' });
  
  assert.strictEqual(registry.find('banks').length, 1, 'bank provider found');
  assert.strictEqual(registry.findById('lender1').type, 'lenders', 'provider found by id');
  
  const stats = registry.getStats();
  assert.strictEqual(stats.totalProviders, 2, 'registry stats correct');
}

(async function run() {
  try {
    await testCognition();
    console.log('Cognition tests passed');
    await testForecast();
    console.log('Forecast tests passed');
    await testCalculateConfidence();
    console.log('Calculate confidence tests passed');
    await testDecisionApi();
    console.log('Decision API tests passed');
    await testDecisionIntelligence();
    console.log('Decision intelligence tests passed');
    await testBiasEngine();
    console.log('Bias engine tests passed');
    await testTwinStress();
    console.log('Twin stress tests passed');
    await testMemoryInsight();
    console.log('Contextual memory tests passed');
    await testOpportunityForecast();
    console.log('Opportunity forecast tests passed');
    await testCognitionGraph();
    console.log('Cognition graph tests passed');
    await testIntegrationRegistry();
    console.log('Integration registry tests passed');
    await testRiskApi();
    console.log('Risk API tests passed');
    await testRiskOpportunityApi();
    console.log('Risk opportunity API tests passed');
    await testRiskOpportunityEngine();
    console.log('Risk opportunity engine tests passed');
    await testMoneyBeliefs();
    console.log('Money beliefs tests passed');
    await testEmotionalTriggers();
    console.log('Emotional triggers tests passed');
    await testCounterfactual();
    console.log('Counterfactual engine tests passed');
    await testFinancialMindProfile();
    console.log('Financial mind profile tests passed');
    await testProviderRegistry();
    console.log('Provider registry tests passed');
    console.log('ALL TESTS OK');
    process.exit(0);
  } catch (err) {
    console.error('TEST FAILED', err);
    process.exit(1);
  }
})();
