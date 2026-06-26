function clamp(value, min = 0, max = 100) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return min;
  return Math.max(min, Math.min(max, parsed));
}

function formatPercent(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return `${Math.round(parsed)}%`;
}

function normalizeContribution(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.round(parsed * 100) / 100;
}

export function createExplanation({
  predictionType,
  score,
  label,
  reasons = [],
  evidence = {},
  model = {},
  limitations = []
}) {
  const normalizedReasons = reasons
    .filter(Boolean)
    .map(reason => ({
      code: reason.code,
      label: reason.label,
      detail: reason.detail,
      direction: reason.direction || 'increases_risk',
      contribution: normalizeContribution(reason.contribution || 0),
      value: reason.value ?? null,
      evidence: reason.evidence || {},
      recommendedAction: reason.recommendedAction || null
    }))
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  const topReasons = normalizedReasons.filter(reason => reason.contribution > 0).slice(0, 5);
  const reasonChain = topReasons.map(reason => reason.label);
  const scoreText = Number.isFinite(Number(score)) ? Math.round(Number(score)) : 'unknown';

  return {
    version: 'xai.v1',
    predictionType,
    summary: topReasons.length
      ? `${label || 'Risk'} score ${scoreText} is driven by ${reasonChain.join(', ')}.`
      : `${label || 'Risk'} score ${scoreText} has no material risk driver in the submitted data.`,
    decision: {
      score: Number.isFinite(Number(score)) ? Math.round(Number(score)) : null,
      label: label || null
    },
    reasonChain,
    topReasons,
    factorContributions: normalizedReasons,
    evidence,
    model: {
      name: model.name || predictionType,
      type: model.type || 'rules_plus_model',
      confidence: model.confidence ?? null,
      generatedAt: new Date().toISOString()
    },
    limitations: limitations.length
      ? limitations
      : ['Explanation is based on submitted fields and available history only. Missing bank-feed or bureau data can change the assessment.']
  };
}

export function buildDefaultRiskExplanation({
  customer = {},
  history = {},
  paymentTrend = {},
  dpdVelocity = {},
  financialStress = {},
  riskScore,
  riskCategory,
  contributions = []
}) {
  const emi = Number(customer.emi ?? customer.emiAmount ?? customer.monthlyEmi ?? 0);
  const income = Number(customer.monthlyIncome ?? customer.salary ?? customer.income ?? 0);
  const emiRatio = income > 0 && emi > 0 ? (emi / income) * 100 : null;

  const evidence = {
    dpd: customer.dpd ?? 0,
    creditScore: customer.creditScore ?? null,
    loanBalance: customer.loanBalance ?? 0,
    emiRatio: emiRatio === null ? null : Math.round(emiRatio),
    salaryDelayDays: customer.salaryDelay ?? history.salaryDelayDays ?? null,
    upiCashFlow: history.upiCashFlow || customer.upiCashFlow || null,
    behaviourChange: history.behaviourChange || customer.behaviourChange || null,
    stressScore: customer.stressLevel ?? financialStress.stressLevel ?? null,
    paymentTrend,
    dpdVelocity
  };

  const reasons = contributions.map(item => ({
    ...item,
    value:
      item.code === 'emi_ratio' && emiRatio !== null
        ? formatPercent(emiRatio)
        : item.value
  }));

  return createExplanation({
    predictionType: 'loan_default_risk',
    score: riskScore,
    label: riskCategory,
    reasons,
    evidence,
    model: {
      name: 'loan-default-risk-v1',
      type: 'explainable_rules_model',
      confidence: history.paymentHistory?.length || history.customerHistory?.length ? 'medium' : 'low'
    }
  });
}

export function buildLoanHealthExplanation({ score, risk, riskFactors = [], customer = {} }) {
  const reasons = riskFactors.map(factor => ({
    code: factor.factor,
    label: factor.label || factor.description,
    detail: factor.description,
    contribution: factor.impact,
    value: factor.value ?? customer[factor.factor],
    recommendedAction: factor.recommendedAction
  }));

  return createExplanation({
    predictionType: 'loan_health',
    score,
    label: risk,
    reasons,
    evidence: {
      salaryDelayDays: customer.salaryDelay,
      emergencySavings: customer.emergencySavings,
      emi: customer.emi,
      stressScore: customer.stressLevel,
      loanShopping: customer.loanShopping,
      gamblingExpense: customer.gamblingExpense
    },
    model: {
      name: 'loan-health-rules-v1',
      type: 'explainable_rules_model',
      confidence: 'medium'
    }
  });
}

export function buildForecastExplanation({ forecast, profile = {}, history = [], predictionType = 'financial_forecast' }) {
  const confidence = forecast?.confidence ?? forecast?.result?.confidence ?? null;
  const day180 = forecast?.day180 || forecast?.forecast?.day180 || forecast?.horizons?.day180 || null;
  const point = day180?.p50 ?? day180?.point ?? forecast?.result?.point ?? null;
  const currentScore = Number(profile.currentScore ?? profile.healthScore ?? history.at?.(-1) ?? 50);
  const delta = Number.isFinite(Number(point)) ? Number(point) - currentScore : 0;

  const reasons = [];
  if (history.length < 3) {
    reasons.push({
      code: 'limited_history',
      label: 'Limited history',
      detail: 'Prediction confidence is reduced because fewer than three historical observations were supplied.',
      contribution: 20,
      direction: 'reduces_confidence',
      value: history.length
    });
  }
  if (delta < -5) {
    reasons.push({
      code: 'declining_score_projection',
      label: 'Declining score trajectory',
      detail: 'Projected health score is materially below the current score.',
      contribution: Math.min(30, Math.abs(delta)),
      value: Math.round(delta)
    });
  }
  if (Number(profile.monthlyExpense || profile.monthlySpending || 0) > Number(profile.monthlyIncome || 0)) {
    reasons.push({
      code: 'negative_cash_flow',
      label: 'Negative cash flow',
      detail: 'Monthly expenses exceed reported income.',
      contribution: 25,
      value: `${profile.monthlyExpense || profile.monthlySpending}/${profile.monthlyIncome}`
    });
  }
  if (Number(profile.totalDebt || 0) > 0) {
    reasons.push({
      code: 'debt_load',
      label: 'Outstanding debt load',
      detail: 'Reported debt increases downside risk in future-state forecasts.',
      contribution: Math.min(20, Number(profile.totalDebt) / 100000),
      value: profile.totalDebt
    });
  }

  return createExplanation({
    predictionType,
    score: point ?? currentScore,
    label: delta < -5 ? 'Deteriorating' : delta > 5 ? 'Improving' : 'Stable',
    reasons,
    evidence: {
      currentScore,
      projectedScore: point,
      historyLength: history.length,
      confidence
    },
    model: {
      name: forecast?.model || forecast?.modelType || 'prediction-engine',
      type: forecast?.modelType || 'forecast_model',
      confidence
    }
  });
}

export { clamp };
