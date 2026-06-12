-- V6 Migration: Longitudinal Learning System
-- Adds tables for tracking behavior evolution, pattern learning, and lifecycle scoring
-- Created: 2026-06-12

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Behavior Snapshots - Monthly/quarterly snapshots of user financial behavior
CREATE TABLE IF NOT EXISTS behavior_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('monthly', 'quarterly', 'annual')),
  
  -- Income & Spending
  total_income DECIMAL(15, 2) NOT NULL DEFAULT 0,
  total_expense DECIMAL(15, 2) NOT NULL DEFAULT 0,
  avg_income_per_transaction DECIMAL(15, 2),
  avg_expense_per_transaction DECIMAL(15, 2),
  income_variance DECIMAL(10, 2),
  expense_variance DECIMAL(10, 2),
  
  -- Savings & Investments
  amount_saved DECIMAL(15, 2) NOT NULL DEFAULT 0,
  savings_rate DECIMAL(5, 2) NOT NULL DEFAULT 0, -- percentage
  investment_amount DECIMAL(15, 2),
  investment_allocation_stocks DECIMAL(5, 2),
  investment_allocation_bonds DECIMAL(5, 2),
  investment_allocation_mf DECIMAL(5, 2),
  investment_allocation_crypto DECIMAL(5, 2),
  investment_allocation_other DECIMAL(5, 2),
  
  -- Spending Patterns
  top_expense_category VARCHAR(100),
  top_expense_percentage DECIMAL(5, 2),
  discretionary_vs_essential_ratio DECIMAL(5, 2),
  
  -- Behavior Indicators
  payment_discipline_score DECIMAL(5, 2), -- 0-100
  on_time_payment_percentage DECIMAL(5, 2),
  impulse_spending_tendency DECIMAL(5, 2), -- 0-100 (higher = more impulse)
  financial_planning_score DECIMAL(5, 2), -- 0-100
  
  -- Risk Profile Evolution
  risk_tolerance_level VARCHAR(50), -- conservative, moderate, aggressive
  risk_comfort_score DECIMAL(5, 2), -- 0-100
  
  -- Digital Twin Integration
  behavioral_stability_index DECIMAL(5, 2), -- 0-100 (consistency)
  financial_health_trajectory VARCHAR(20), -- improving, declining, stable
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT snapshot_date_period_unique UNIQUE(user_id, snapshot_date, period_type)
);

CREATE INDEX idx_behavior_snapshots_user_date ON behavior_snapshots(user_id, snapshot_date DESC);
CREATE INDEX idx_behavior_snapshots_period ON behavior_snapshots(user_id, period_type, snapshot_date DESC);

-- Enable RLS for behavior_snapshots
ALTER TABLE behavior_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own behavior snapshots"
  ON behavior_snapshots FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own behavior snapshots"
  ON behavior_snapshots FOR INSERT WITH CHECK (user_id = auth.uid());

-- 2. Pattern Detection - Identified recurring patterns in user behavior
CREATE TABLE IF NOT EXISTS behavior_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern_type VARCHAR(100) NOT NULL, -- "seasonal_expense", "bi-weekly_income", "monthly_investment", etc.
  pattern_name VARCHAR(255) NOT NULL,
  pattern_description TEXT,
  
  -- Pattern Characteristics
  frequency VARCHAR(50) NOT NULL, -- "daily", "weekly", "bi-weekly", "monthly", "seasonal"
  confidence_score DECIMAL(5, 2) NOT NULL, -- 0-100 (how sure we are)
  occurrences_detected INT NOT NULL DEFAULT 0,
  
  -- Temporal Information
  cycle_days INT, -- for recurring patterns (e.g., 14 for bi-weekly)
  month_of_year INT, -- for seasonal patterns
  day_of_week INT, -- for weekly patterns (0-6)
  time_of_day VARCHAR(50), -- "morning", "afternoon", "evening"
  
  -- Financial Impact
  avg_amount DECIMAL(15, 2),
  amount_variance DECIMAL(15, 2),
  total_impact_last_12m DECIMAL(15, 2),
  
  -- Pattern Metadata
  discovered_date DATE NOT NULL,
  last_occurrence DATE,
  predicted_next_occurrence DATE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  pattern_strength VARCHAR(50) NOT NULL, -- "strong", "moderate", "weak"
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_behavior_patterns_user_type ON behavior_patterns(user_id, pattern_type, active DESC);
CREATE INDEX idx_behavior_patterns_confidence ON behavior_patterns(user_id, confidence_score DESC);
CREATE INDEX idx_behavior_patterns_next_occurrence ON behavior_patterns(user_id, predicted_next_occurrence);

ALTER TABLE behavior_patterns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own patterns"
  ON behavior_patterns FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own patterns"
  ON behavior_patterns FOR INSERT WITH CHECK (user_id = auth.uid());

-- 3. Lifecycle Stages - User's position in financial journey
CREATE TABLE IF NOT EXISTS user_lifecycle_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Current Stage
  current_stage VARCHAR(100) NOT NULL CHECK (current_stage IN (
    'discovery', 'onboarding', 'establishment', 'optimization', 'acceleration', 'maturity', 'planning'
  )),
  stage_confidence_score DECIMAL(5, 2) NOT NULL DEFAULT 0, -- 0-100
  
  -- Stage Progression
  discovery_date DATE,
  establishment_date DATE,
  optimization_date DATE,
  acceleration_date DATE,
  maturity_date DATE,
  
  -- Lifecycle Indicators
  months_on_platform INT NOT NULL DEFAULT 0,
  account_age_category VARCHAR(50), -- "new", "established", "mature", "veteran"
  
  -- Financial Maturity Score (0-100)
  financial_maturity_score DECIMAL(5, 2) NOT NULL DEFAULT 0,
  -- Components of maturity score:
  savings_discipline_component DECIMAL(5, 2) DEFAULT 0,
  investment_sophistication_component DECIMAL(5, 2) DEFAULT 0,
  debt_management_component DECIMAL(5, 2) DEFAULT 0,
  risk_awareness_component DECIMAL(5, 2) DEFAULT 0,
  planning_component DECIMAL(5, 2) DEFAULT 0,
  
  -- Lifecycle Velocity (how fast they're progressing)
  progression_velocity VARCHAR(20) NOT NULL DEFAULT 'steady', -- "fast", "steady", "slow"
  
  -- Recommendations for next stage
  recommended_next_goals TEXT,
  recommended_financial_products TEXT,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lifecycle_stages_user ON user_lifecycle_stages(user_id);
CREATE INDEX idx_lifecycle_stages_stage ON user_lifecycle_stages(current_stage);

ALTER TABLE user_lifecycle_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own lifecycle"
  ON user_lifecycle_stages FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own lifecycle"
  ON user_lifecycle_stages FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage their own lifecycle"
  ON user_lifecycle_stages FOR UPDATE WITH CHECK (user_id = auth.uid());

-- 4. Behavioral Scores - Multi-dimensional behavioral assessment
CREATE TABLE IF NOT EXISTS behavioral_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_date DATE NOT NULL,
  
  -- Core Behavioral Scores (0-100)
  financial_discipline_score DECIMAL(5, 2) NOT NULL,
  spending_control_score DECIMAL(5, 2) NOT NULL,
  saving_tendency_score DECIMAL(5, 2) NOT NULL,
  investment_readiness_score DECIMAL(5, 2) NOT NULL,
  risk_tolerance_score DECIMAL(5, 2) NOT NULL,
  impulse_control_score DECIMAL(5, 2) NOT NULL,
  planning_capability_score DECIMAL(5, 2) NOT NULL,
  
  -- Personality-Based Scores
  financial_personality_type VARCHAR(100), -- "saver", "spender", "investor", "balanced", "cautious"
  personality_confidence_score DECIMAL(5, 2),
  
  -- Composite Scores
  overall_financial_behavioral_score DECIMAL(5, 2) NOT NULL, -- Weighted average of all above
  behavioral_trend VARCHAR(20) NOT NULL, -- "improving", "declining", "stable"
  
  -- Supporting Data
  assessment_method VARCHAR(100), -- "transaction_analysis", "self_report", "hybrid"
  sample_size INT, -- number of transactions analyzed
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT behavioral_scores_date_unique UNIQUE(user_id, assessment_date)
);

CREATE INDEX idx_behavioral_scores_user_date ON behavioral_scores(user_id, assessment_date DESC);
CREATE INDEX idx_behavioral_scores_personality ON behavioral_scores(user_id, financial_personality_type);

ALTER TABLE behavioral_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own behavioral scores"
  ON behavioral_scores FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own behavioral scores"
  ON behavioral_scores FOR INSERT WITH CHECK (user_id = auth.uid());

-- 5. Trend Analysis - Tracked metrics over time with trend detection
CREATE TABLE IF NOT EXISTS financial_trends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  metric_name VARCHAR(100) NOT NULL, -- "monthly_savings", "investment_rate", "debt_ratio", etc.
  metric_category VARCHAR(50) NOT NULL CHECK (metric_category IN ('income', 'expense', 'savings', 'investment', 'debt', 'health')),
  
  -- Trend Direction
  trend_direction VARCHAR(20) NOT NULL CHECK (trend_direction IN ('improving', 'declining', 'stable', 'volatile')),
  trend_strength VARCHAR(20) NOT NULL, -- "strong", "moderate", "weak"
  trend_confidence_score DECIMAL(5, 2) NOT NULL, -- 0-100
  
  -- Trend Metrics
  current_value DECIMAL(15, 2) NOT NULL,
  previous_value DECIMAL(15, 2),
  change_percentage DECIMAL(8, 2),
  percent_change_3m DECIMAL(8, 2), -- 3-month change
  percent_change_6m DECIMAL(8, 2), -- 6-month change
  percent_change_12m DECIMAL(8, 2), -- 12-month change
  
  -- Volatility & Consistency
  average_value_12m DECIMAL(15, 2),
  volatility_score DECIMAL(5, 2), -- Standard deviation
  consistency_score DECIMAL(5, 2), -- 0-100 (consistency)
  
  -- Projection
  projected_value_3m DECIMAL(15, 2),
  projected_value_12m DECIMAL(15, 2),
  
  -- Metadata
  analysis_period_days INT NOT NULL DEFAULT 365,
  data_points_used INT NOT NULL DEFAULT 0,
  last_update_date DATE NOT NULL,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT trends_user_metric_unique UNIQUE(user_id, metric_name)
);

CREATE INDEX idx_financial_trends_user_metric ON financial_trends(user_id, metric_name);
CREATE INDEX idx_financial_trends_direction ON financial_trends(user_id, trend_direction);
CREATE INDEX idx_financial_trends_category ON financial_trends(user_id, metric_category, trend_direction);

ALTER TABLE financial_trends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own trends"
  ON financial_trends FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own trends"
  ON financial_trends FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage their own trends"
  ON financial_trends FOR  UPDATE WITH CHECK (user_id = auth.uid());
-- 6. Anomalies Detected - Unusual behaviors and deviations from patterns
CREATE TABLE IF NOT EXISTS behavior_anomalies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  anomaly_type VARCHAR(100) NOT NULL, -- "unusual_spending", "income_spike", "missed_payment", "investment_change"
  anomaly_description TEXT NOT NULL,
  severity_level VARCHAR(20) NOT NULL CHECK (severity_level IN ('low', 'medium', 'high', 'critical')),
  
  -- Detection Details
  detected_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  anomaly_date DATE NOT NULL,
  detection_method VARCHAR(100), -- "statistical_outlier", "pattern_deviation", "behavioral_shift", "manual_flag"
  confidence_score DECIMAL(5, 2) NOT NULL, -- 0-100
  
  -- Contextual Data
  related_metric VARCHAR(100),
  expected_value DECIMAL(15, 2),
  actual_value DECIMAL(15, 2),
  deviation_percentage DECIMAL(8, 2),
  
  -- Classification
  is_positive_anomaly BOOLEAN, -- TRUE if good (income spike), FALSE if concerning (unusual spending)
  is_explained BOOLEAN NOT NULL DEFAULT FALSE,
  explanation TEXT,
  
  -- Resolution
  user_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  acknowledged_date TIMESTAMP,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_anomalies_user_date ON behavior_anomalies(user_id, anomaly_date DESC);
CREATE INDEX idx_anomalies_severity ON behavior_anomalies(user_id, severity_level, user_acknowledged);
CREATE INDEX idx_anomalies_type ON behavior_anomalies(user_id, anomaly_type, detected_date DESC);

ALTER TABLE behavior_anomalies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own anomalies"
  ON behavior_anomalies FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own anomalies"
  ON behavior_anomalies FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage their own anomalies"
  ON behavior_anomalies FOR  UPDATE WITH CHECK (user_id = auth.uid());
-- 7. Predictive Insights - AI-generated insights about future behavior
CREATE TABLE IF NOT EXISTS predictive_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  insight_type VARCHAR(100) NOT NULL, -- "spending_forecast", "savings_opportunity", "risk_warning", "optimization_suggestion"
  insight_title VARCHAR(255) NOT NULL,
  insight_description TEXT NOT NULL,
  
  -- Confidence & Impact
  confidence_score DECIMAL(5, 2) NOT NULL, -- 0-100
  potential_impact VARCHAR(50) NOT NULL, -- "high", "medium", "low"
  estimated_financial_impact DECIMAL(15, 2),
  
  -- Timing
  prediction_horizon_days INT NOT NULL, -- days into the future
  time_relevance VARCHAR(50), -- "immediate", "soon", "medium-term", "long-term"
  
  -- Recommendation
  recommended_action TEXT,
  action_priority INT, -- 1-10 (higher = more important)
  
  -- Engagement
  shown_to_user BOOLEAN NOT NULL DEFAULT FALSE,
  user_feedback VARCHAR(50), -- "helpful", "not_helpful", "already_aware"
  user_action_taken BOOLEAN NOT NULL DEFAULT FALSE,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_predictive_insights_user_type ON predictive_insights(user_id, insight_type, created_at DESC);
CREATE INDEX idx_predictive_insights_impact ON predictive_insights(user_id, potential_impact, action_priority DESC);
CREATE INDEX idx_predictive_insights_engagement ON predictive_insights(user_id, shown_to_user, user_feedback);

ALTER TABLE predictive_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own insights"
  ON predictive_insights FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own insights"
  ON predictive_insights FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage their own insights"
  ON predictive_insights FOR  UPDATE WITH CHECK (user_id = auth.uid());
-- 8. User Evolution Journal - Narrative of user's financial journey
CREATE TABLE IF NOT EXISTS user_evolution_journal (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  journal_date DATE NOT NULL,
  entry_type VARCHAR(50) NOT NULL, -- "milestone", "achievement", "challenge", "learning", "decision"
  
  -- Entry Content
  title VARCHAR(255) NOT NULL,
  narrative TEXT NOT NULL,
  
  -- Linked Data
  related_behavior_snapshot_id UUID REFERENCES behavior_snapshots(id),
  related_pattern_id UUID REFERENCES behavior_patterns(id),
  related_anomaly_id UUID REFERENCES behavior_anomalies(id),
  
  -- Context
  context_data JSONB,
  tags TEXT[], -- JSON array of tags for categorization
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_evolution_journal_user_date ON user_evolution_journal(user_id, journal_date DESC);
CREATE INDEX idx_evolution_journal_type ON user_evolution_journal(user_id, entry_type);
CREATE INDEX idx_evolution_journal_tags ON user_evolution_journal USING GIN(tags);

ALTER TABLE user_evolution_journal ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own journal"
  ON user_evolution_journal FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own journal"
  ON user_evolution_journal FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage their own journal"
  ON user_evolution_journal FOR  UPDATE  WITH CHECK (user_id = auth.uid());
  CREATE POLICY "Users can manage their own journal"
  ON user_evolution_journal FOR  DELETE WITH CHECK (user_id = auth.uid());
-- Create function to auto-update behavior snapshots
CREATE OR REPLACE FUNCTION update_behavior_snapshots_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER behavior_snapshots_update_timestamp
  BEFORE UPDATE ON behavior_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION update_behavior_snapshots_timestamp();

-- Create similar triggers for other tables
CREATE TRIGGER behavior_patterns_update_timestamp
  BEFORE UPDATE ON behavior_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_behavior_snapshots_timestamp();

CREATE TRIGGER user_lifecycle_stages_update_timestamp
  BEFORE UPDATE ON user_lifecycle_stages
  FOR EACH ROW
  EXECUTE FUNCTION update_behavior_snapshots_timestamp();

CREATE TRIGGER behavioral_scores_update_timestamp
  BEFORE UPDATE ON behavioral_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_behavior_snapshots_timestamp();

CREATE TRIGGER financial_trends_update_timestamp
  BEFORE UPDATE ON financial_trends
  FOR EACH ROW
  EXECUTE FUNCTION update_behavior_snapshots_timestamp();

CREATE TRIGGER behavior_anomalies_update_timestamp
  BEFORE UPDATE ON behavior_anomalies
  FOR EACH ROW
  EXECUTE FUNCTION update_behavior_snapshots_timestamp();

CREATE TRIGGER predictive_insights_update_timestamp
  BEFORE UPDATE ON predictive_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_behavior_snapshots_timestamp();

CREATE TRIGGER user_evolution_journal_update_timestamp
  BEFORE UPDATE ON user_evolution_journal
  FOR EACH ROW
  EXECUTE FUNCTION update_behavior_snapshots_timestamp();

-- Add comments for documentation
COMMENT ON TABLE behavior_snapshots IS 'Monthly/quarterly snapshots of user financial behavior for longitudinal analysis';
COMMENT ON TABLE behavior_patterns IS 'Detected recurring patterns in user spending, income, and investment behavior';
COMMENT ON TABLE user_lifecycle_stages IS 'Tracks user progression through financial maturity stages';
COMMENT ON TABLE behavioral_scores IS 'Multi-dimensional behavioral assessment scores and personality classification';
COMMENT ON TABLE financial_trends IS 'Time-series trends for key financial metrics with projections';
COMMENT ON TABLE behavior_anomalies IS 'Unusual behaviors and deviations from established patterns';
COMMENT ON TABLE predictive_insights IS 'AI-generated predictions and recommendations based on user history';
COMMENT ON TABLE user_evolution_journal IS 'Narrative journal of user''s financial journey and milestones';
