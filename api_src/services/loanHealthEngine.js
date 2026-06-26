import { buildLoanHealthExplanation } from './explainableAi.js';

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeCustomer(customer = {}) {
  return {
    salaryDelay: toNumber(customer.salaryDelay),
    gamblingExpense: Boolean(customer.gamblingExpense),
    emergencySavings: toNumber(customer.emergencySavings),
    emi: toNumber(customer.emi ?? customer.emiAmount),
    stressLevel: toNumber(customer.stressLevel),
    loanShopping: Boolean(customer.loanShopping)
  };
}

function riskForScore(score) {
  if (score > 80) {
    return 'Low';
  }
  if (score > 60) {
    return 'Medium';
  }
  return 'High';
}

export function calculateLoanHealth(customer = {}) {
  const normalized = normalizeCustomer(customer);
  let score = 100;
  const riskFactors = [];

  if (normalized.salaryDelay > 2) {
    score -= 20;
    riskFactors.push({
      factor: 'salaryDelay',
      label: 'Salary unstable',
      impact: 20,
      description: 'Salary delay exceeds two days',
      value: normalized.salaryDelay,
      recommendedAction: 'Verify salary credit pattern and repayment date alignment'
    });
  }

  if (normalized.gamblingExpense) {
    score -= 30;
    riskFactors.push({
      factor: 'gamblingExpense',
      label: 'High-risk discretionary spend',
      impact: 30,
      description: 'Gambling-related expense detected',
      value: true,
      recommendedAction: 'Route for cash-flow counselling or manual review'
    });
  }

  if (normalized.emergencySavings > 0 && normalized.emi > 0 && normalized.emergencySavings < normalized.emi) {
    score -= 15;
    riskFactors.push({
      factor: 'emergencySavings',
      label: 'EMI coverage gap',
      impact: 15,
      description: 'Emergency savings are below one EMI',
      value: normalized.emergencySavings,
      recommendedAction: 'Discuss emergency buffer before additional credit'
    });
  }

  if (normalized.stressLevel > 80) {
    score -= 10;
    riskFactors.push({
      factor: 'stressLevel',
      label: 'Stress score',
      impact: 10,
      description: 'Stress level is above the high-risk threshold',
      value: normalized.stressLevel,
      recommendedAction: 'Prioritize proactive outreach'
    });
  }

  if (normalized.loanShopping) {
    score -= 10;
    riskFactors.push({
      factor: 'loanShopping',
      label: 'Behaviour change',
      impact: 10,
      description: 'Recent loan-shopping behaviour detected',
      value: true,
      recommendedAction: 'Check debt stacking risk before approval'
    });
  }

  const boundedScore = Math.max(0, Math.min(100, Math.round(score)));

  const risk = riskForScore(boundedScore);
  const explanation = buildLoanHealthExplanation({
    score: boundedScore,
    risk,
    riskFactors,
    customer: normalized
  });

  return {
    contractVersion: 'loan-health.calculate.v1',
    score: boundedScore,
    risk,
    riskFactors,
    explanation,
    evaluatedAt: new Date().toISOString()
  };
}

export default {
  calculateLoanHealth
};
