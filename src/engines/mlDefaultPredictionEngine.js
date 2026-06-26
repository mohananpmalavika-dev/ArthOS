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

import { buildModelLineage } from "./modelRegistry.js";
import { buildDefaultRiskExplanation } from "../../api_src/services/explainableAi.js";

function defaultRiskGovernance(history = {}) {
  const paymentPoints = Array.isArray(history.paymentHistory) ? history.paymentHistory.length : 0;
  const customerPoints = Array.isArray(history.customerHistory) ? history.customerHistory.length : 0;

  return buildModelLineage({
    modelType: "loan-default",
    dataPoints: paymentPoints + customerPoints
  });
}

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
export function calculateDefaultProbability(customer = {}, history = {}) {
  const paymentTrend = analyzePaymentHistory(history.paymentHistory);
  const dpdVelocity = calculateDPDVelocity(history.customerHistory || history.dpdHistory);
  const financialStress = calculateFinancialStress(customer);

  let defaultScore = 0;
  const contributions = [];

  // Financial stress is a primary driver
  const financialStressContribution = financialStress.stressLevel * 0.005; // Scale to 0-0.5
  defaultScore += financialStressContribution;
  if (financialStressContribution > 0) {
    contributions.push({
      code: "stress_score",
      label: "Stress score",
      detail: `Financial stress is ${financialStress.stressCategory.toLowerCase()} based on DPD, credit score, and balance pressure.`,
      contribution: financialStressContribution * 100,
      value: financialStress.stressLevel,
      evidence: financialStress,
      recommendedAction: "Review payment ageing, bureau score movement, and outstanding balance pressure before approving new exposure."
    });
  }

  // DPD velocity is also critical
  if (dpdVelocity.trend === 'accelerating') {
    defaultScore += 0.3;
    contributions.push({
      code: "dpd_velocity",
      label: "Days past due accelerating",
      detail: "Days past due are increasing rapidly across the borrower history.",
      contribution: 30,
      value: Number(dpdVelocity.velocity.toFixed(2)),
      evidence: dpdVelocity,
      recommendedAction: "Escalate to collections or restructure review before delinquency compounds."
    });
  } else if (dpdVelocity.trend === 'increasing') {
    defaultScore += 0.15;
    contributions.push({
      code: "dpd_velocity",
      label: "Days past due increasing",
      detail: "Days past due are rising across the borrower history.",
      contribution: 15,
      value: Number(dpdVelocity.velocity.toFixed(2)),
      evidence: dpdVelocity,
      recommendedAction: "Contact borrower early and verify whether the next EMI can be covered."
    });
  }

  // Payment history trends add to the risk
  if (paymentTrend.trend === 'negative') {
    defaultScore += 0.2;
    contributions.push({
      code: "payment_history",
      label: "Missed payment history",
      detail: "Recent payment history includes missed payments.",
      contribution: 20,
      value: paymentTrend.missedPayments,
      evidence: paymentTrend,
      recommendedAction: "Require repayment regularization before increasing limit or approving a top-up."
    });
  } else if (paymentTrend.trend === 'worsening') {
    defaultScore += 0.1;
    contributions.push({
      code: "payment_history",
      label: "Late payment pattern",
      detail: "Recent payment history shows repeated late payments.",
      contribution: 10,
      value: paymentTrend.latePayments,
      evidence: paymentTrend,
      recommendedAction: "Verify salary date alignment and consider EMI date adjustment."
    });
  }

  const emi = Number(customer.emi ?? customer.emiAmount ?? customer.monthlyEmi ?? 0);
  const income = Number(customer.monthlyIncome ?? customer.salary ?? customer.income ?? 0);
  const emiRatio = income > 0 && emi > 0 ? emi / income : 0;
  if (emiRatio > 0.5) {
    defaultScore += 0.15;
    contributions.push({
      code: "emi_ratio",
      label: "EMI ratio",
      detail: "EMI obligation is above 50% of reported monthly income.",
      contribution: 15,
      value: `${Math.round(emiRatio * 100)}%`,
      evidence: { emi, income },
      recommendedAction: "Keep total EMI burden below 45% or request additional income proof."
    });
  } else if (emiRatio > 0.35) {
    defaultScore += 0.08;
    contributions.push({
      code: "emi_ratio",
      label: "EMI ratio",
      detail: "EMI obligation is elevated relative to reported monthly income.",
      contribution: 8,
      value: `${Math.round(emiRatio * 100)}%`,
      evidence: { emi, income },
      recommendedAction: "Check borrower surplus after all recurring obligations."
    });
  }

  const salaryDelay = Number(customer.salaryDelay ?? history.salaryDelayDays ?? 0);
  if (salaryDelay > 2 || customer.salaryStability === "unstable" || history.salaryStability === "unstable") {
    defaultScore += 0.12;
    contributions.push({
      code: "salary_instability",
      label: "Salary unstable",
      detail: "Salary timing is delayed or marked unstable.",
      contribution: 12,
      value: salaryDelay > 0 ? `${salaryDelay} days` : "unstable",
      evidence: { salaryDelay, salaryStability: customer.salaryStability || history.salaryStability },
      recommendedAction: "Verify the latest salary credits and require two to three stable cycles."
    });
  }

  const upiCashFlow = history.upiCashFlow || customer.upiCashFlow || {};
  const netCashFlow = Number(upiCashFlow.netMonthlyCashFlow ?? upiCashFlow.netCashFlow ?? customer.netCashFlow ?? 0);
  const cashFlowVolatility = Number(upiCashFlow.volatilityScore ?? customer.cashFlowVolatility ?? 0);
  if (netCashFlow < 0 || cashFlowVolatility > 70) {
    defaultScore += 0.1;
    contributions.push({
      code: "upi_cash_flow",
      label: "UPI cash flow",
      detail: netCashFlow < 0
        ? "UPI cash flow is negative for the observed period."
        : "UPI cash flow volatility is high.",
      contribution: 10,
      value: netCashFlow < 0 ? netCashFlow : cashFlowVolatility,
      evidence: upiCashFlow,
      recommendedAction: "Review recent UPI inflows and outflows for recurring cash gaps."
    });
  }

  const behaviourChange = Number(history.behaviourChangeScore ?? customer.behaviourChangeScore ?? 0);
  if (behaviourChange < -10 || history.behaviourChange === "deteriorating" || customer.behaviourChange === "deteriorating") {
    defaultScore += 0.08;
    contributions.push({
      code: "behaviour_change",
      label: "Behaviour change",
      detail: "Recent borrower behaviour has deteriorated versus baseline.",
      contribution: 8,
      value: behaviourChange || "deteriorating",
      evidence: { behaviourChangeScore: behaviourChange, behaviourChange: history.behaviourChange || customer.behaviourChange },
      recommendedAction: "Check whether spending, loan-shopping, or repayment behaviour changed after the last credit event."
    });
  }

  const stressLevel = Number(customer.stressLevel ?? history.stressLevel ?? 0);
  if (stressLevel > 80) {
    defaultScore += 0.08;
    contributions.push({
      code: "stress_score_reported",
      label: "Stress score",
      detail: "Reported stress score is above the high-risk threshold.",
      contribution: 8,
      value: stressLevel,
      evidence: { stressLevel },
      recommendedAction: "Route to manual review and consider counselling or hardship options before adverse action."
    });
  }

  const probability = Math.min(1, defaultScore);

  let riskCategory = 'Low';
  if (probability > 0.6) riskCategory = 'Very High';
  else if (probability > 0.4) riskCategory = 'High';
  else if (probability > 0.2) riskCategory = 'Medium';

  const riskScore = Math.round(probability * 100);
  const explanation = buildDefaultRiskExplanation({
    customer,
    history,
    paymentTrend,
    dpdVelocity,
    financialStress,
    riskScore,
    riskCategory,
    contributions
  });

  return {
    probability,
    riskCategory,
    riskScore,
    explanation,
    modelGovernance: defaultRiskGovernance(history)
  };
}
