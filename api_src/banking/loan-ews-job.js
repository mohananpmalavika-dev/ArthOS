import { createClient } from '@supabase/supabase-js';
import PatternLearningEngine from '../longitudinal/pattern-learning-engine.js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function detectDefaultRisk(userId, upcomingEmiAmount) {
  // 1. Get the borrower's latest longitudinal pattern snapshot (e.g., last 3 months)
  const patternData = await PatternLearningEngine.detectAllPatterns(userId, 3);
  
  // 2. Fetch current real-time liquidity via Bank Feeds
  const { data: accounts } = await supabase
    .from('bank_accounts')
    .select('available_balance, account_status')
    .eq('user_id', userId)
    .eq('account_status', 'active');

  const totalLiquidity = accounts.reduce((sum, acc) => sum + acc.available_balance, 0);

  const riskFactors = [];
  
  // Rule 1: Immediate Cash Crunch
  if (totalLiquidity < upcomingEmiAmount) {
    riskFactors.push(`Severe liquidity gap: Available ₹${totalLiquidity} vs EMI ₹${upcomingEmiAmount}`);
  }

  // Rule 2: Behavioral Degradation (using your anomaly detection)
  if (patternData.breakdown && patternData.breakdown.anomaly > 0) {
    riskFactors.push('Unusual spending spikes detected this cycle');
  }

  // Rule 3: Income Disruption (using your recurring pattern detector)
  const salaryPattern = patternData.patterns.find(p => p.pattern_type === 'salary');
  if (salaryPattern && salaryPattern.confidence_score < 50) {
    riskFactors.push('Expected recurring income not detected');
  }

  return {
    userId,
    isHighRisk: riskFactors.length > 0,
    riskFactors,
    suggestedIntervention: riskFactors.length > 0 ? 'TRIGGER_AI_COACH' : 'NONE'
  };
}