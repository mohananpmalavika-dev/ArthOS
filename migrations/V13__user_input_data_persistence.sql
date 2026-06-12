-- migrations/V13__user_input_data_persistence.sql
-- Database schema for storing all user input data (drafts, decisions, telemetry, preferences)

-- User Drafts Table (for assessment drafts)
CREATE TABLE IF NOT EXISTS user_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  assessment_type VARCHAR(50) DEFAULT 'v2',
  draft_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_drafts_user_id ON user_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_drafts_user_type ON user_drafts(user_id, assessment_type);

-- User Decisions Table (for decision data)
CREATE TABLE IF NOT EXISTS user_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  decision_id VARCHAR(255),
  decision_type VARCHAR(100) DEFAULT 'assessment',
  decision_data JSONB NOT NULL,
  outcome_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_decisions_user_id ON user_decisions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_decisions_created ON user_decisions(user_id, created_at DESC);

-- User Telemetry Table (for engagement events)
CREATE TABLE IF NOT EXISTS user_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id VARCHAR(255),
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_telemetry_user_id ON user_telemetry(user_id);
CREATE INDEX IF NOT EXISTS idx_user_telemetry_event_type ON user_telemetry(event_type);
CREATE INDEX IF NOT EXISTS idx_user_telemetry_timestamp ON user_telemetry(user_id, timestamp DESC);

-- User Preferences Table (for user settings)
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  preference_key VARCHAR(255) NOT NULL,
  preference_value JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, preference_key)
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_key ON user_preferences(user_id, preference_key);

-- Enable RLS on all tables
ALTER TABLE user_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_drafts
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_drafts' AND policyname = 'user_drafts_policy') THEN
    CREATE POLICY user_drafts_policy ON user_drafts
      FOR SELECT
      USING (user_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_drafts' AND policyname = 'user_drafts_insert_policy') THEN
    CREATE POLICY user_drafts_insert_policy ON user_drafts
      FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_drafts' AND policyname = 'user_drafts_update_policy') THEN
    CREATE POLICY user_drafts_update_policy ON user_drafts
      FOR UPDATE
      USING (user_id = auth.uid());
  END IF;
END $$;

-- Create RLS policies for user_decisions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_decisions' AND policyname = 'user_decisions_policy') THEN
    CREATE POLICY user_decisions_policy ON user_decisions
      FOR SELECT
      USING (user_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_decisions' AND policyname = 'user_decisions_insert_policy') THEN
    CREATE POLICY user_decisions_insert_policy ON user_decisions
      FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- Create RLS policies for user_telemetry
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_telemetry' AND policyname = 'user_telemetry_policy') THEN
    CREATE POLICY user_telemetry_policy ON user_telemetry
      FOR SELECT
      USING (user_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_telemetry' AND policyname = 'user_telemetry_insert_policy') THEN
    CREATE POLICY user_telemetry_insert_policy ON user_telemetry
      FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- Create RLS policies for user_preferences
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_preferences' AND policyname = 'user_preferences_policy') THEN
    CREATE POLICY user_preferences_policy ON user_preferences
      FOR SELECT
      USING (user_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_preferences' AND policyname = 'user_preferences_insert_policy') THEN
    CREATE POLICY user_preferences_insert_policy ON user_preferences
      FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_preferences' AND policyname = 'user_preferences_update_policy') THEN
    CREATE POLICY user_preferences_update_policy ON user_preferences
      FOR UPDATE
      USING (user_id = auth.uid());
  END IF;
END $$;
