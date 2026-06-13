-- V1: Initial Schema — Core ARTH.OS tables
-- Run this first, then apply V2–V13 in order.
-- All CREATE statements use IF NOT EXISTS for idempotency.

-- ============================================================
-- Table 1: Anonymous Financial Telemetry
-- Stores aggregated assessment results without individual identifiers
-- ============================================================
CREATE TABLE IF NOT EXISTS anonymous_telemetry (
  id BIGSERIAL PRIMARY KEY,

  -- Schema & Execution Context
  schema_version VARCHAR(12) NOT NULL,
  mode_executed VARCHAR(6) NOT NULL, -- "v1" or "v2"

  -- Core Financial Health Scores
  health_score NUMERIC(5, 2) NOT NULL,
  behaviour_score NUMERIC(5, 2),
  awareness_score NUMERIC(5, 2),
  stability_score NUMERIC(5, 2),
  habits_score NUMERIC(5, 2),

  -- Psychological Profiling
  personality_type VARCHAR(32),
  future_risk_label VARCHAR(32),
  future_risk_score NUMERIC(5, 2),
  awareness_gap_months NUMERIC(5, 2),

  -- Financial Runway Calculations
  nominal_survival_months NUMERIC(8, 1),
  crisis_survival_months NUMERIC(8, 1),
  perceived_survival_months NUMERIC(8, 1),

  -- Financial Operational Ratios
  savings_rate_proxied NUMERIC(5, 2),
  debt_to_income_months NUMERIC(8, 1),
  fixed_liability_pressure NUMERIC(5, 2),

  -- Diagnostic Driver
  lowest_driver VARCHAR(16),

  -- Date-only timestamp for privacy (no exact timestamp)
  created_at DATE NOT NULL DEFAULT CURRENT_DATE,

  CONSTRAINT valid_health_score CHECK (health_score >= 0 AND health_score <= 100),
  CONSTRAINT valid_survival_months CHECK (nominal_survival_months >= 0),
  CONSTRAINT valid_mode CHECK (mode_executed IN ('v1', 'v2'))
);

CREATE INDEX IF NOT EXISTS idx_anonymous_telemetry_health_score ON anonymous_telemetry(health_score);
CREATE INDEX IF NOT EXISTS idx_anonymous_telemetry_lowest_driver ON anonymous_telemetry(lowest_driver);
CREATE INDEX IF NOT EXISTS idx_anonymous_telemetry_created_at ON anonymous_telemetry(created_at);
CREATE INDEX IF NOT EXISTS idx_anonymous_telemetry_personality_type ON anonymous_telemetry(personality_type);

-- ============================================================
-- Table 2: Persisted Full Assessments
-- Stores assessment inputs plus computed results for later analysis
-- ============================================================
CREATE TABLE IF NOT EXISTS assessments (
  id BIGSERIAL PRIMARY KEY,
  assessment JSONB NOT NULL,
  result JSONB NOT NULL,
  participant_name VARCHAR(255),
  participant_age VARCHAR(32),
  participant_email VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assessments_created_at ON assessments(created_at);
CREATE INDEX IF NOT EXISTS idx_assessments_participant_email ON assessments(participant_email);

-- ============================================================
-- Table 3: Post-Assessment Tester Feedback
-- Captures user perception of assessment value
-- ============================================================
CREATE TABLE IF NOT EXISTS tester_feedback (
  id BIGSERIAL PRIMARY KEY,

  -- Score context (allows correlation with aggregated telemetry trends)
  health_score NUMERIC(5, 2) NOT NULL,

  -- Primary value driver (what metric mattered most to this user)
  primary_driver VARCHAR(32) NOT NULL,

  -- Optional qualitative feedback (truncated to 1000 chars)
  feedback_text TEXT,

  -- Date-only timestamp for privacy
  created_at DATE NOT NULL DEFAULT CURRENT_DATE,

  CONSTRAINT valid_feedback_health_score CHECK (health_score >= 0 AND health_score <= 100),
  CONSTRAINT valid_primary_driver CHECK (
    primary_driver IN (
      'survival_months',
      'recommended_action',
      'awareness_gap',
      'personality_archetype'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_tester_feedback_primary_driver ON tester_feedback(primary_driver);
CREATE INDEX IF NOT EXISTS idx_tester_feedback_created_at ON tester_feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_tester_feedback_health_score ON tester_feedback(health_score);

-- ============================================================
-- Row-level security (Supabase RLS)
-- ============================================================
ALTER TABLE anonymous_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE tester_feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public inserts to anonymous_telemetry (telemetry collection endpoint)
CREATE POLICY IF NOT EXISTS "allow_telemetry_collection" ON anonymous_telemetry
  FOR INSERT
  WITH CHECK (true);

-- Policy: Deny public selects on anonymous_telemetry (analytics team only)
CREATE POLICY IF NOT EXISTS "deny_telemetry_read" ON anonymous_telemetry
  FOR SELECT
  USING (false);

-- Policy: Allow public inserts to tester_feedback (feedback collection endpoint)
CREATE POLICY IF NOT EXISTS "allow_feedback_collection" ON tester_feedback
  FOR INSERT
  WITH CHECK (true);

-- Policy: Deny public selects on tester_feedback (analytics team only)
CREATE POLICY IF NOT EXISTS "deny_feedback_read" ON tester_feedback
  FOR SELECT
  USING (false);

-- ============================================================
-- Service role permissions
-- ============================================================
GRANT INSERT ON anonymous_telemetry TO service_role;
GRANT INSERT ON tester_feedback TO service_role;

-- ============================================================
-- Analytics view (aggregated trends)
-- ============================================================
CREATE OR REPLACE VIEW telemetry_summary AS
SELECT
  created_at,
  personality_type,
  ROUND(AVG(health_score)::numeric, 2) as avg_health_score,
  ROUND(AVG(awareness_gap_months)::numeric, 2) as avg_awareness_gap,
  ROUND(AVG(savings_rate_proxied)::numeric, 2) as avg_savings_rate,
  COUNT(*) as sample_size
FROM anonymous_telemetry
GROUP BY created_at, personality_type
ORDER BY created_at DESC;
