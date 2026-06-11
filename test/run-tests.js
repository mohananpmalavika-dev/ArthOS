import assert from 'assert';
import { analyzeMoneyBeliefs, detectBiases } from '../src/engines/cognitionEngine.js';
import { forecast30d, forecastHealth } from '../src/engines/forecastEngine.js';
import decisionHandler from '../api/decision.js';
import riskScoreHandler from '../api/risk-score.js';
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
  assert.strictEqual(health.day30, 47, 'forecast health 30d');
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

async function testRiskApi() {
  const req = { method: 'POST', body: { user: { monthlyIncome: 5000, monthlyExpense: 4000, stressLevel: 70, perceivedRisk: 60 } } };
  const res = mockRes();
  await riskScoreHandler(req, res);
  assert.strictEqual(res.statusCode, 200, 'POST /api/risk-score ok');
  assert.ok(res._body.riskScore !== undefined, 'riskScore returned');
}

(async function run() {
  try {
    await testCognition();
    console.log('Cognition tests passed');
    await testForecast();
    console.log('Forecast tests passed');
    await testDecisionApi();
    console.log('Decision API tests passed');
    await testDecisionIntelligence();
    console.log('Decision intelligence tests passed');
    await testRiskApi();
    console.log('Risk API tests passed');
    console.log('ALL TESTS OK');
    process.exit(0);
  } catch (err) {
    console.error('TEST FAILED', err);
    process.exit(1);
  }
})();
