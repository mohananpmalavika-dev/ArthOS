-- V14 Event-Driven Architecture
-- Domain-event outbox and workflow tables for banking/risk/CRM/collections flows.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS domain_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  source TEXT NOT NULL,
  user_id TEXT,
  aggregate_id TEXT,
  correlation_id TEXT NOT NULL,
  causation_id TEXT,
  idempotency_key TEXT UNIQUE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_domain_events_type_time
  ON domain_events(event_type, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_domain_events_user_time
  ON domain_events(user_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_domain_events_correlation
  ON domain_events(correlation_id);

CREATE TABLE IF NOT EXISTS event_deliveries (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  subscriber_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued', 'delivered', 'failed')),
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_deliveries_event
  ON event_deliveries(event_id);

CREATE INDEX IF NOT EXISTS idx_event_deliveries_status
  ON event_deliveries(status, delivered_at DESC);

CREATE TABLE IF NOT EXISTS early_warning_signals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  source_event_id TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('medium', 'high', 'critical')),
  reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  risk_score NUMERIC(5,4) NOT NULL DEFAULT 0,
  recommended_action TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_early_warning_user_status
  ON early_warning_signals(user_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS crm_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  source_event_id TEXT,
  activity_type TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  summary TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_events_user_time
  ON crm_events(user_id, created_at DESC);
