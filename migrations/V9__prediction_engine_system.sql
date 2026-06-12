-- V9 Prediction Engine System Database Schema
-- Stores forecasts, scenarios, and prediction confidence data
-- Created: 2026-06-12

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============= FINANCIAL STATE FORECASTS TABLE =============
-- Stores predicted health scores, BAS dimensions, and survival windows
CREATE TABLE IF NOT EXISTS financial_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Forecast metadata
  forecast_generated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  forecast_base_date DATE NOT NULL, -- What date is this forecast from?
  
  -- Forecast periods
  forecast_period_days INT NOT NULL, -- 30, 90, or 180
  forecast_end_date DATE NOT NULL,
  
  -- Method & confidence
  forecast_method VARCHAR(50) NOT NULL, -- 'arima', 'exponential_smoothing', 'linear_trend', 'seasonal'
  confidence_level DECIMAL(5,2) NOT NULL, -- 0-100: how confident in this forecast?
  rmse DECIMAL(10,4), -- Root mean squared error from training
  mape DECIMAL(10,4), -- Mean absolute percentage error
  
  -- Health Score Forecast
  predicted_health_score DECIMAL(5,2),
  predicted_health_score_min DECIMAL(5,2), -- 25th percentile (conservative)
  predicted_health_score_max DECIMAL(5,2), -- 75th percentile (optimistic)
  health_score_trend VARCHAR(20), -- 'improving', 'declining', 'stable'
  
  -- BAS Dimensions Forecast
  predicted_behaviour_score DECIMAL(5,2),
  predicted_behaviour_min DECIMAL(5,2),
  predicted_behaviour_max DECIMAL(5,2),
  behaviour_trend VARCHAR(20),
  
  predicted_awareness_score DECIMAL(5,2),
  predicted_awareness_min DECIMAL(5,2),
  predicted_awareness_max DECIMAL(5,2),
  awareness_trend VARCHAR(20),
  
  predicted_stability_score DECIMAL(5,2),
  predicted_stability_min DECIMAL(5,2),
  predicted_stability_max DECIMAL(5,2),
  stability_trend VARCHAR(20),
  
  -- Survival Window Forecast
  predicted_survival_days INT,
  predicted_survival_days_min INT, -- Conservative estimate
  predicted_survival_days_max INT, -- Optimistic estimate
  survival_trend VARCHAR(20), -- 'extending', 'shortening', 'stable'
  
  -- Key metrics that drive forecast
  input_monthly_spending DECIMAL(15,2), -- Average monthly spending used
  input_monthly_income DECIMAL(15,2), -- Average monthly income used
  input_emergency_savings DECIMAL(15,2), -- Emergency fund amount used
  input_debt_amount DECIMAL(15,2), -- Total debt used
  
  -- Supporting data points (for visualization)
  forecast_data_points JSONB, -- Array of {date, health_score, survival_days, confidence}
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

ALTER TABLE financial_forecasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own forecasts"
  ON financial_forecasts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX idx_financial_forecasts_user_period 
  ON financial_forecasts(user_id, forecast_period_days DESC, forecast_base_date DESC);
CREATE INDEX idx_financial_forecasts_confidence 
  ON financial_forecasts(user_id, confidence_level DESC);

---

-- ============= SCENARIO SIMULATION TABLE =============
-- Stores user-tested scenarios with "what if" parameters
CREATE TABLE IF NOT EXISTS scenario_simulations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Scenario metadata
  scenario_name VARCHAR(255) NOT NULL, -- e.g., "Save ₹5,000 extra per month"
  scenario_description TEXT,
  scenario_created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Scenario parameters (the "what if")
  modified_parameter VARCHAR(100) NOT NULL, -- 'monthly_spending', 'monthly_savings', 'debt_payoff_rate', 'emergency_fund', 'income'
  parameter_change_type VARCHAR(20) NOT NULL, -- 'absolute', 'percentage'
  parameter_change_value DECIMAL(15,2) NOT NULL, -- How much change (positive or negative)
  
  -- Scenario comparison periods
  comparison_period_days INT NOT NULL, -- 30, 90, or 180
  comparison_end_date DATE NOT NULL,
  
  -- Baseline vs Scenario (comparing current path vs modified path)
  baseline_health_score_at_end DECIMAL(5,2), -- Current path
  scenario_health_score_at_end DECIMAL(5,2), -- With changes
  health_score_delta DECIMAL(5,2), -- Difference
  
  baseline_survival_days_at_end INT, -- Current path
  scenario_survival_days_at_end INT, -- With changes
  survival_days_delta INT, -- How many extra/fewer days
  
  baseline_behaviour_at_end DECIMAL(5,2),
  scenario_behaviour_at_end DECIMAL(5,2),
  
  baseline_awareness_at_end DECIMAL(5,2),
  scenario_awareness_at_end DECIMAL(5,2),
  
  baseline_stability_at_end DECIMAL(5,2),
  scenario_stability_at_end DECIMAL(5,2),
  
  -- Financial impact
  total_amount_saved_in_period DECIMAL(15,2), -- Extra savings accumulated
  total_additional_debt_paid DECIMAL(15,2), -- Extra debt payment
  emergency_fund_growth DECIMAL(15,2), -- Additional emergency savings
  
  -- Feasibility & impact assessment
  feasibility_score DECIMAL(5,2), -- 0-100: how realistic is this scenario?
  impact_magnitude VARCHAR(20), -- 'low', 'medium', 'high'
  time_to_see_benefit_days INT, -- How long before user sees improvement?
  
  -- User action tracking
  scenario_status VARCHAR(20) DEFAULT 'simulated', -- 'simulated', 'adopted', 'completed', 'abandoned'
  adoption_date TIMESTAMP, -- When did user start this scenario?
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

ALTER TABLE scenario_simulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own scenarios"
  ON scenario_simulations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own scenarios"
  ON scenario_simulations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their scenarios"
  ON scenario_simulations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX idx_scenario_simulations_user_status 
  ON scenario_simulations(user_id, scenario_status);
CREATE INDEX idx_scenario_simulations_impact 
  ON scenario_simulations(user_id, impact_magnitude);
CREATE INDEX idx_scenario_simulations_created 
  ON scenario_simulations(user_id, created_at DESC);

---

-- ============= RISK FORECASTS TABLE =============
-- Stores identified risks with timeframes and alerts
CREATE TABLE IF NOT EXISTS risk_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Risk identification
  risk_type VARCHAR(100) NOT NULL, -- 'emergency_fund_depletion', 'income_decline', 'spending_spike', 'debt_increase', 'savings_drop', 'survival_window_critical'
  risk_category VARCHAR(50) NOT NULL, -- 'critical', 'high', 'medium', 'low'
  risk_description TEXT NOT NULL,
  
  -- Risk timing
  risk_identified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  predicted_onset_date DATE NOT NULL, -- When will this risk manifest?
  days_until_risk INT, -- How many days until risk occurs?
  
  -- Quantification
  impact_area VARCHAR(50), -- 'health_score', 'survival_window', 'spending', 'debt', 'savings'
  projected_impact DECIMAL(15,4), -- Numeric impact (score points, days, currency amount)
  
  -- Root cause analysis
  contributing_factors TEXT[], -- Array of factors driving this risk
  primary_driver VARCHAR(100), -- Main cause
  
  -- Recommendation
  suggested_mitigation TEXT, -- What to do about it
  effort_required VARCHAR(20), -- 'low', 'medium', 'high'
  
  -- Tracking
  user_acknowledged BOOLEAN DEFAULT FALSE,
  acknowledgment_date TIMESTAMP,
  action_taken BOOLEAN DEFAULT FALSE,
  action_taken_date TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

ALTER TABLE risk_forecasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own risks"
  ON risk_forecasts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX idx_risk_forecasts_user_category 
  ON risk_forecasts(user_id, risk_category, predicted_onset_date);
CREATE INDEX idx_risk_forecasts_timeline 
  ON risk_forecasts(user_id, days_until_risk) 
  WHERE user_acknowledged = FALSE;

---

-- ============= OPPORTUNITY FORECASTS TABLE =============
-- Stores identified opportunities with timeframes
CREATE TABLE IF NOT EXISTS opportunity_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Opportunity identification
  opportunity_type VARCHAR(100) NOT NULL, -- 'increase_savings_capacity', 'debt_elimination', 'goal_achievement', 'emergency_fund_build', 'behaviour_improvement'
  opportunity_category VARCHAR(50) NOT NULL, -- 'critical', 'high', 'medium', 'low'
  opportunity_description TEXT NOT NULL,
  
  -- Opportunity timing
  opportunity_identified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  predicted_available_date DATE NOT NULL, -- When can user start this?
  days_until_opportunity INT, -- How many days until opportunity is available?
  
  -- Quantification
  benefit_area VARCHAR(50), -- 'health_score', 'survival_window', 'savings', 'debt_reduction', 'goal_progress'
  projected_benefit DECIMAL(15,4), -- Numeric benefit (score points, days, currency amount)
  
  -- Root cause analysis
  contributing_factors TEXT[], -- What makes this opportunity available?
  primary_enabler VARCHAR(100), -- Main reason opportunity exists
  
  -- Action required
  suggested_action TEXT, -- What to do to capture opportunity
  effort_required VARCHAR(20), -- 'low', 'medium', 'high'
  
  -- Tracking
  user_interested BOOLEAN DEFAULT FALSE,
  interest_recorded_date TIMESTAMP,
  action_taken BOOLEAN DEFAULT FALSE,
  action_taken_date TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

ALTER TABLE opportunity_forecasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own opportunities"
  ON opportunity_forecasts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX idx_opportunity_forecasts_user_category 
  ON opportunity_forecasts(user_id, opportunity_category, predicted_available_date);
CREATE INDEX idx_opportunity_forecasts_timeline 
  ON opportunity_forecasts(user_id, days_until_opportunity) 
  WHERE user_interested = FALSE;

---

-- ============= FORECAST ACCURACY TRACKING TABLE =============
-- Tracks how accurate our forecasts were over time (for model improvement)
CREATE TABLE IF NOT EXISTS forecast_accuracy_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  forecast_id UUID REFERENCES financial_forecasts(id) ON DELETE SET NULL,
  
  -- Original forecast
  forecast_date DATE NOT NULL,
  original_forecast_value DECIMAL(10,4), -- Health score, survival days, etc.
  original_confidence DECIMAL(5,2),
  
  -- Actual outcome (measured later)
  measurement_date DATE,
  actual_value DECIMAL(10,4),
  metric_type VARCHAR(50), -- 'health_score', 'survival_days', 'behaviour_score', etc.
  
  -- Accuracy metrics
  absolute_error DECIMAL(10,4), -- |predicted - actual|
  percentage_error DECIMAL(8,4), -- ((actual - predicted) / actual) * 100
  
  -- Analysis
  was_accurate BOOLEAN, -- Within acceptable margin?
  forecast_method VARCHAR(50), -- Which model made this prediction?
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

ALTER TABLE forecast_accuracy_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own accuracy log"
  ON forecast_accuracy_log
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX idx_forecast_accuracy_user_date 
  ON forecast_accuracy_log(user_id, measurement_date DESC);
CREATE INDEX idx_forecast_accuracy_method 
  ON forecast_accuracy_log(user_id, forecast_method, percentage_error);

---

-- ============= SYSTEM FUNCTIONS =============

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER financial_forecasts_update_timestamp
  BEFORE UPDATE ON financial_forecasts
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER scenario_simulations_update_timestamp
  BEFORE UPDATE ON scenario_simulations
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER risk_forecasts_update_timestamp
  BEFORE UPDATE ON risk_forecasts
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER opportunity_forecasts_update_timestamp
  BEFORE UPDATE ON opportunity_forecasts
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

---

-- ============= TABLE DOCUMENTATION =============

COMMENT ON TABLE financial_forecasts IS 'Predicted financial states for 30/90/180 days using time series models';
COMMENT ON TABLE scenario_simulations IS 'User-tested scenarios with parameter modifications and impact projections';
COMMENT ON TABLE risk_forecasts IS 'Identified risks with timing, impact, and mitigation strategies';
COMMENT ON TABLE opportunity_forecasts IS 'Identified opportunities with timing and action steps';
COMMENT ON TABLE forecast_accuracy_log IS 'Tracking of forecast accuracy for model improvement';
