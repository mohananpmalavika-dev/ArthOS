import crypto from 'crypto';
import { insertIntoTable } from '../dbClient.js';
import { createLogger } from '../logger.js';

const log = createLogger('[eventBus]');

const subscribers = new Map();
const memoryEvents = [];
const MAX_MEMORY_EVENTS = 500;

export function hasUsableEventStoreConfig() {
  if (process.env.DATABASE_URL) {
    return true;
  }

  const supabaseUrl = process.env.SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  return Boolean(
    supabaseUrl.startsWith('http') &&
      serviceRoleKey &&
      !supabaseUrl.includes('your-project-ref') &&
      !serviceRoleKey.includes('your-service-role-key')
  );
}

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix = 'evt') {
  return `${prefix}_${crypto.randomUUID()}`;
}

function normalizeEvent(input = {}) {
  if (!input.type) {
    throw new Error('Event type is required');
  }

  const eventId = input.eventId || input.id || createId();
  const occurredAt = input.occurredAt || nowIso();

  return {
    id: eventId,
    type: String(input.type),
    source: input.source || 'arthos.api',
    userId: input.userId || input.payload?.userId || null,
    aggregateId: input.aggregateId || input.payload?.transactionId || input.userId || null,
    correlationId: input.correlationId || createId('corr'),
    causationId: input.causationId || null,
    idempotencyKey: input.idempotencyKey || eventId,
    payload: input.payload || {},
    metadata: input.metadata || {},
    occurredAt,
    publishedAt: nowIso()
  };
}

function getMatchingHandlers(eventType) {
  const exact = subscribers.get(eventType) || new Set();
  const wildcard = subscribers.get('*') || new Set();
  const namespaceHandlers = [];

  for (const [pattern, handlers] of subscribers.entries()) {
    if (!pattern.endsWith('.*')) continue;
    const prefix = pattern.slice(0, -1);
    if (eventType.startsWith(prefix)) {
      namespaceHandlers.push(...handlers);
    }
  }

  return [...exact, ...namespaceHandlers, ...wildcard];
}

async function persistDomainEvent(event) {
  if (!hasUsableEventStoreConfig()) {
    return { persisted: false, reason: 'database_not_configured' };
  }

  try {
    await insertIntoTable('domain_events', {
      id: event.id,
      event_type: event.type,
      source: event.source,
      user_id: event.userId,
      aggregate_id: event.aggregateId,
      correlation_id: event.correlationId,
      causation_id: event.causationId,
      idempotency_key: event.idempotencyKey,
      payload: event.payload,
      metadata: event.metadata,
      occurred_at: event.occurredAt,
      published_at: event.publishedAt
    });
    return { persisted: true };
  } catch (error) {
    log.warn('Failed to persist domain event', {
      eventId: event.id,
      type: event.type,
      error: error?.message
    });
    return { persisted: false, reason: error?.message || 'persist_failed' };
  }
}

async function persistDelivery(event, subscriberName, status, result = null, error = null) {
  if (!hasUsableEventStoreConfig()) return;

  try {
    await insertIntoTable('event_deliveries', {
      id: createId('delivery'),
      event_id: event.id,
      event_type: event.type,
      subscriber_name: subscriberName,
      status,
      result: result || {},
      error_message: error,
      delivered_at: nowIso()
    });
  } catch (deliveryError) {
    log.warn('Failed to persist event delivery', {
      eventId: event.id,
      subscriberName,
      error: deliveryError?.message
    });
  }
}

export function subscribe(eventType, subscriberName, handler) {
  if (!eventType || typeof handler !== 'function') {
    throw new Error('subscribe requires eventType and handler');
  }

  if (!subscribers.has(eventType)) {
    subscribers.set(eventType, new Set());
  }

  const wrapped = {
    name: subscriberName || handler.name || 'anonymous_subscriber',
    handler
  };

  subscribers.get(eventType).add(wrapped);

  return () => {
    const set = subscribers.get(eventType);
    if (!set) return;
    set.delete(wrapped);
    if (set.size === 0) {
      subscribers.delete(eventType);
    }
  };
}

export async function publishEvent(input) {
  const event = normalizeEvent(input);

  memoryEvents.push(event);
  if (memoryEvents.length > MAX_MEMORY_EVENTS) {
    memoryEvents.shift();
  }

  const persistence = await persistDomainEvent(event);
  const handlers = getMatchingHandlers(event.type);
  const deliveries = [];

  for (const subscriber of handlers) {
    try {
      const result = await subscriber.handler(event);
      deliveries.push({
        subscriber: subscriber.name,
        status: 'delivered',
        result: result || null
      });
      await persistDelivery(event, subscriber.name, 'delivered', result || {});
    } catch (error) {
      const errorMessage = error?.message || String(error);
      deliveries.push({
        subscriber: subscriber.name,
        status: 'failed',
        error: errorMessage
      });
      await persistDelivery(event, subscriber.name, 'failed', null, errorMessage);
      log.error('Subscriber failed', {
        eventId: event.id,
        type: event.type,
        subscriber: subscriber.name,
        error: errorMessage
      });
    }
  }

  return {
    event,
    persistence,
    deliveries
  };
}

export function getRecentEvents({ type, userId, limit = 50 } = {}) {
  return memoryEvents
    .filter(event => !type || event.type === type)
    .filter(event => !userId || event.userId === userId)
    .slice(-limit)
    .reverse();
}

export function getSubscriberSummary() {
  return Array.from(subscribers.entries()).map(([eventType, handlers]) => ({
    eventType,
    subscribers: Array.from(handlers).map(handler => handler.name)
  }));
}

export default {
  publishEvent,
  subscribe,
  getRecentEvents,
  getSubscriberSummary
};
