/**
 * ML Loan Default Prediction Engine
 * Identifies borrowers at risk of defaulting on their loans.
 *
 * Key Default Indicators:
 * - Increasing Days Past Due (DPD)
 * - Poor payment history (missed or late payments)
 * - Low credit score
 * - High loan balance relative to income (if available)
 */

/**
 * Analyzes payment history to detect negative trends.
 */
export function analyzePaymentHistory(paymentHistory) {
  if (!paymentHistory || paymentHistory.length < 3) {
    return { trend: 'insufficient_data', latePayments: 0, missedPayments: 0 };
  }

  const recentPayments = paymentHistory.slice(-6); // Look at last 6 months
  const latePayments = recentPayments.filter(p => p.status === 'late').length;
  const missedPayments = recentPayments.filter(p => p.status === 'missed').length;

  let trend = 'stable';
  if (missedPayments > 0) {
    trend = 'negative';
  } else if (latePayments > 1) {
    trend = 'worsening';
  }

  return { trend, latePayments, missedPayments };
}

/**
 * Calculates the velocity of Days Past Due (DPD).
 * A positive velocity indicates the borrower is falling further behind.
 */
export function calculateDPDVelocity(customerHistory) {
  if (!customerHistory || customerHistory.length < 2) {
    return { velocity: 0, trend: 'stable' };
  }

  const sorted = [...customerHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const daysElapsed = Math.max(1, (new Date(last.date) - new Date(first.date)) / (1000 * 60 * 60 * 24));
  const dpdChange = last.dpd - first.dpd;

  const velocity = (dpdChange / daysElapsed) * 30; // DPD change per month

  let trend = 'stable';
  if (velocity > 10) {
    trend = 'accelerating';
  } else if (velocity > 0) {
    trend = 'increasing';
  } else if (velocity < -10) {
    trend = 'improving';
  }

  return { velocity, trend };
}

/**
 * Calculates financial stress indicators for a borrower.
 */
export function calculateFinancialStress(customer) {
  let stressScore = 0;

  // DPD is a major stress factor
  if (customer.dpd > 90) stressScore += 50;
  else if (customer.dpd > 60) stressScore += 30;
  else if (customer.dpd > 30) stressScore += 20;

  // Credit score is another key indicator
  if (customer.creditScore < 600) stressScore += 30;
  else if (customer.creditScore < 650) stressScore += 15;

  // High loan balance can also be a stressor
  if (customer.loanBalance > 1000000) stressScore += 10; // Example threshold

  const stressLevel = Math.min(100, stressScore);
  let stressCategory = 'Low';
  if (stressLevel > 70) stressCategory = 'Critical';
  else if (stressLevel > 50) stressCategory = 'High';
  else if (stressLevel > 30) stressCategory = 'Moderate';

  return { stressLevel, stressCategory };
}

/**
 * Calculates the probability of loan default (0-1).
 */
export function calculateDefaultProbability(customer, history) {
  const paymentTrend = analyzePaymentHistory(history.paymentHistory);
  const dpdVelocity = calculateDPDVelocity(history.customerHistory);
  const financialStress = calculateFinancialStress(customer);

  let defaultScore = 0;

  // Financial stress is a primary driver
  defaultScore += financialStress.stressLevel * 0.005; // Scale to 0-0.5

  // DPD velocity is also critical
  if (dpdVelocity.trend === 'accelerating') defaultScore += 0.3;
  else if (dpdVelocity.trend === 'increasing') defaultScore += 0.15;

  // Payment history trends add to the risk
  if (paymentTrend.trend === 'negative') defaultScore += 0.2;
  else if (paymentTrend.trend === 'worsening') defaultScore += 0.1;

  const probability = Math.min(1, defaultScore);

  let riskCategory = 'Low';
  if (probability > 0.6) riskCategory = 'Very High';
  else if (probability > 0.4) riskCategory = 'High';
  else if (probability > 0.2) riskCategory = 'Medium';

  return {
    probability,
    riskCategory,
    riskScore: Math.round(probability * 100),
  };
}