import { b2bPartnerEngine } from '../../src/lib/b2bPartnerEngine.js';
import { calculateFinancialHealthV2 } from '../../src/lib/scoring-v2.js';
import { generateRiskScore } from '../../src/engines/cognitionEngine.js';
import { detectBiases } from '../../src/engines/biasEngine.js';
import AAConnector from '../banking/aa-connector.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Validate NBFC/Bank Partner API Key
  const apiKey = (req.headers.authorization || '').replace('Bearer ', '');
  const partner = b2bPartnerEngine.validateApiKey(apiKey);
  if (!partner) return res.status(401).json({ error: 'Invalid partner API key' });

  try {
    const { userId, requestedLoanAmount, emiAmount, aaConsentId, financialEntityId } = req.body;

    // 1. Fetch raw transaction data via your existing RBI Account Aggregator flow
    const aaData = await AAConnector.fetchAAData(userId, aaConsentId, financialEntityId);
    
    // 2. Map AA data to your engine's expected assessment shape
    const assessment = {
      profile: { 
        monthlyIncome: aaData.income, 
        monthlyExpense: aaData.expenses, 
        totalDebt: aaData.existingDebt 
      },
      behaviour: aaData.inferredBehaviour, 
      awareness: aaData.inferredAwareness
    };

    // 3. Process through ARTH.OS Intelligence Layers
    const healthScore = calculateFinancialHealthV2(assessment);
    const riskProfile = generateRiskScore(assessment);
    const biases = detectBiases(assessment);

    // 4. Calculate Loan-Specific Serviceability
    const postLoanSurvivalMonths = healthScore.survivalMonthsRaw - (emiAmount / aaData.expenses);
    const hasDangerousBiases = biases.presentBias > 70 || biases.optimismBias > 80;

    // 5. Generate NBFC Decision Matrix
    return res.status(200).json({
      decision: {
        recommendation: postLoanSurvivalMonths > 3 && !hasDangerousBiases ? 'APPROVE' : 'MANUAL_REVIEW',
        confidenceScore: 85,
      },
      arthosMetrics: {
        behavioralHealthScore: healthScore.healthScore,
        projectedSurvivalMonths: postLoanSurvivalMonths.toFixed(1),
        riskLevel: riskProfile.riskLevel,
        redFlags: [
          biases.presentBias > 70 ? 'High impulse spending detected' : null,
          healthScore.components.stabilityScore < 40 ? 'Erratic cash flow' : null
        ].filter(Boolean)
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Underwriting engine failed', detail: error.message });
  }
}