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
      impact: 20,
      description: 'Salary delay exceeds two days'
    });
  }

  if (normalized.gamblingExpense) {
    score -= 30;
    riskFactors.push({
      factor: 'gamblingExpense',
      impact: 30,
      description: 'Gambling-related expense detected'
    });
  }

  if (normalized.emergencySavings > 0 && normalized.emi > 0 && normalized.emergencySavings < normalized.emi) {
    score -= 15;
    riskFactors.push({
      factor: 'emergencySavings',
      impact: 15,
      description: 'Emergency savings are below one EMI'
    });
  }

  if (normalized.stressLevel > 80) {
    score -= 10;
    riskFactors.push({
      factor: 'stressLevel',
      impact: 10,
      description: 'Stress level is above the high-risk threshold'
    });
  }

  if (normalized.loanShopping) {
    score -= 10;
    riskFactors.push({
      factor: 'loanShopping',
      impact: 10,
      description: 'Recent loan-shopping behaviour detected'
    });
  }

  const boundedScore = Math.max(0, Math.min(100, Math.round(score)));

  return {
    contractVersion: 'loan-health.calculate.v1',
    score: boundedScore,
    risk: riskForScore(boundedScore),
    riskFactors,
    evaluatedAt: new Date().toISOString()
  };
}

export default {
  calculateLoanHealth
};
