-- Migration: Add longitudinal tables for Blueprint features

CREATE TABLE IF NOT EXISTS user_scores_history (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS weekly_checkins (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  payload JSONB,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS goal_history (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  goal_id TEXT NOT NULL,
  payload JSONB,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS decision_history (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  decision JSONB,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS financial_memory (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  memory JSONB,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS twin_snapshots (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  snapshot JSONB,
  simulated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
