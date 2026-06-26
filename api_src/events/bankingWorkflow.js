import { insertIntoTable } from '../dbClient.js';
import { createLogger } from '../logger.js';
import { hasUsableEventStoreConfig, publishEvent, subscribe } from './eventBus.js';
import { createExplanation } from '../services/explainableAi.js';

const log = createLogger('[bankingWorkflow]');
let registered = false;

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function isSalaryCredit(transaction = {}) {
  const text = [
    transaction.category,
    transaction.description,
    transaction.narration,
    transaction.counterpartyName,
    transaction.counterparty_name
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const amount = toNumber(transaction.amount);
  const transactionType = String(transaction.transactionType || transaction.transaction_type || '').toLowerCase();
  const isCredit = transactionType === 'credit' || amount > 0;

  return isCredit && /\b(salary|payroll|wages|employer|compensation)\b/.test(text);
}

function evaluateEarlyWarning(event) {
  const payload = event.payload || {};
  const transaction = payload.transaction || payload;
  const analysis = payload.analysis || {};
  const amount = Math.abs(toNumber(transaction.amount));
  const riskScore = toNumber(analysis.riskScore);
  const reasons = [];

  if (riskScore >= 0.7) {
    reasons.push(analysis.reason || 'High transaction anomaly risk');
  }

  if (payload.salaryExpectedAmount && amount < toNumber(payload.salaryExpectedAmount) * 0.75) {
    reasons.push('Salary credit materially below expected amount');
  }

  if (payload.salaryDelayDays && toNumber(payload.salaryDelayDays) > 2) {
    reasons.push('Salary credit arrived after expected window');
  }

  if (payload.availableBalance !== undefined && payload.upcomingEmiAmount !== undefined) {
    if (toNumber(payload.availableBalance) < toNumber(payload.upcomingEmiAmount)) {
      reasons.push('Available balance is below upcoming EMI');
    }
  }

  if (!reasons.length) {
    return null;
  }

  const severity = reasons.length >= 2 || riskScore >= 0.85 ? 'critical' : 'high';

  return {
    userId: event.userId,
    sourceEventId: event.id,
    severity,
    reasons,
    riskScore,
    explanation: createExplanation({
      predictionType: 'early_warning_signal',
      score: Math.round(riskScore * 100),
      label: severity,
      reasons: reasons.map((reason, index) => ({
        code: `early_warning_${index + 1}`,
        label: reason,
        detail: reason,
        contribution: Math.max(10, Math.round((riskScore * 100) / reasons.length))
      })),
      evidence: payload,
      model: {
        name: 'early-warning-event-rules-v1',
        type: 'event_driven_rules',
        confidence: riskScore >= 0.7 ? 'medium' : 'low'
      }
    }),
    recommendedAction: severity === 'critical' ? 'COLLECTIONS_REVIEW' : 'CRM_OUTREACH',
    generatedAt: new Date().toISOString()
  };
}

async function maybePersist(tableName, row) {
  if (!hasUsableEventStoreConfig()) {
    return { persisted: false, reason: 'database_not_configured' };
  }

  try {
    await insertIntoTable(tableName, row);
    return { persisted: true };
  } catch (error) {
    log.warn(`Failed to persist ${tableName}`, { error: error?.message });
    return { persisted: false, reason: error?.message || 'persist_failed' };
  }
}

async function onTransactionCreated(event) {
  const transaction = event.payload?.transaction || event.payload || {};
  const childEvents = [];

  if (isSalaryCredit(transaction)) {
    const salaryEvent = await publishEvent({
      type: 'banking.salary.credited',
      source: 'banking.transaction-classifier',
      userId: event.userId,
      aggregateId: event.aggregateId,
      correlationId: event.correlationId,
      causationId: event.id,
      payload: {
        transaction,
        amount: toNumber(transaction.amount),
        creditedAt: transaction.transactionTime || transaction.transaction_time || event.occurredAt
      },
      metadata: { classifier: 'keyword.salary.v1' }
    });
    childEvents.push(salaryEvent.event.id);
  }

  const warning = evaluateEarlyWarning(event);
  if (warning) {
    const warningEvent = await publishEvent({
      type: 'risk.early_warning.created',
      source: 'risk-engine.transaction-monitor',
      userId: event.userId,
      aggregateId: event.aggregateId,
      correlationId: event.correlationId,
      causationId: event.id,
      payload: warning
    });
    childEvents.push(warningEvent.event.id);
  }

  return { childEvents };
}

async function onSalaryCredited(event) {
  const warning = evaluateEarlyWarning(event);
  const riskAssessment = {
    userId: event.userId,
    sourceEventId: event.id,
    salaryAmount: toNumber(event.payload?.amount),
    riskLevel: warning ? warning.severity : 'low',
    checkedAt: new Date().toISOString()
  };

  await publishEvent({
    type: 'risk.salary_assessed',
    source: 'risk-engine.salary-monitor',
    userId: event.userId,
    aggregateId: event.aggregateId,
    correlationId: event.correlationId,
    causationId: event.id,
    payload: riskAssessment
  });

  if (!warning) {
    return { riskLevel: 'low' };
  }

  const warningEvent = await publishEvent({
    type: 'risk.early_warning.created',
    source: 'risk-engine.salary-monitor',
    userId: event.userId,
    aggregateId: event.aggregateId,
    correlationId: event.correlationId,
    causationId: event.id,
    payload: warning
  });

  return { riskLevel: warning.severity, warningEventId: warningEvent.event.id };
}

async function onEarlyWarningCreated(event) {
  const warning = event.payload || {};
  await maybePersist('early_warning_signals', {
    id: `ews_${event.id}`,
    user_id: event.userId,
    source_event_id: warning.sourceEventId || event.causationId,
    severity: warning.severity || 'high',
    reasons: warning.reasons || [],
    risk_score: warning.riskScore || 0,
    recommended_action: warning.recommendedAction || 'CRM_OUTREACH',
    status: 'open',
    created_at: event.occurredAt
  });

  await publishEvent({
    type: 'notification.requested',
    source: 'early-warning-service',
    userId: event.userId,
    aggregateId: event.aggregateId,
    correlationId: event.correlationId,
    causationId: event.id,
    payload: {
      channel: 'in_app',
      title: warning.severity === 'critical' ? 'Critical repayment risk detected' : 'Repayment risk detected',
      body: (warning.reasons || []).join('; ') || 'Early warning signal created',
      priority: warning.severity || 'high',
      userId: event.userId
    }
  });

  await publishEvent({
    type: 'crm.activity.recorded',
    source: 'early-warning-service',
    userId: event.userId,
    aggregateId: event.aggregateId,
    correlationId: event.correlationId,
    causationId: event.id,
    payload: {
      activityType: 'early_warning',
      priority: warning.severity || 'high',
      summary: (warning.reasons || []).join('; ') || 'Early warning signal created',
      recommendedAction: warning.recommendedAction || 'CRM_OUTREACH'
    }
  });

  if (warning.recommendedAction === 'COLLECTIONS_REVIEW') {
    await publishEvent({
      type: 'collections.case.opened',
      source: 'early-warning-service',
      userId: event.userId,
      aggregateId: event.aggregateId,
      correlationId: event.correlationId,
      causationId: event.id,
      payload: {
        priority: warning.severity || 'critical',
        reason: (warning.reasons || []).join('; '),
        status: 'open'
      }
    });
  }

  return { status: 'early_warning_routed' };
}

async function onNotificationRequested(event) {
  return maybePersist('event_deliveries', {
    id: `notif_${event.id}`,
    event_id: event.id,
    event_type: event.type,
    subscriber_name: 'notification-service',
    status: 'queued',
    result: event.payload || {},
    error_message: null,
    delivered_at: new Date().toISOString()
  });
}

async function onCrmActivityRecorded(event) {
  return maybePersist('crm_events', {
    id: `crm_${event.id}`,
    user_id: event.userId,
    source_event_id: event.causationId,
    activity_type: event.payload?.activityType || 'event',
    priority: event.payload?.priority || 'normal',
    summary: event.payload?.summary || '',
    payload: event.payload || {},
    created_at: event.occurredAt
  });
}

export function registerBankingEventWorkflow() {
  if (registered) {
    return;
  }

  subscribe('banking.transaction.created', 'banking-transaction-router', onTransactionCreated);
  subscribe('banking.salary.credited', 'salary-risk-engine', onSalaryCredited);
  subscribe('risk.early_warning.created', 'early-warning-orchestrator', onEarlyWarningCreated);
  subscribe('notification.requested', 'notification-service', onNotificationRequested);
  subscribe('crm.activity.recorded', 'crm-adapter', onCrmActivityRecorded);

  registered = true;
}

registerBankingEventWorkflow();

export default {
  registerBankingEventWorkflow
};
