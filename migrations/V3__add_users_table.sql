-- V3: Add Users Table for Authentication
-- Run this in your Supabase SQL Editor or apply via migrations runner

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL DEFAULT '',
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  avatar_url VARCHAR(500)
);

-- Index for fast email lookups on login
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Add user_id foreign key to existing tables for multi-user support
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id);
ALTER TABLE decision_history ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id);
ALTER TABLE user_scores_history ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id);
ALTER TABLE weekly_checkins ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id);
ALTER TABLE financial_memory ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id);
ALTER TABLE goal_history ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id);
ALTER TABLE twin_snapshots ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id);

-- Indexes for user-scoped queries
CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_decision_history_user_id ON decision_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_scores_history_user_id ON user_scores_history(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_checkins_user_id ON weekly_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_memory_user_id ON financial_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_history_user_id ON goal_history(user_id);
CREATE INDEX IF NOT EXISTS idx_twin_snapshots_user_id ON twin_snapshots(user_id);

-- RLS policies for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "users_read_own" ON users
  FOR SELECT
  USING (id = current_setting('app.current_user_id')::BIGINT);

-- Service role can do everything
CREATE POLICY "users_service_role_all" ON users
  FOR ALL
  USING (true)
  WITH CHECK (true);
