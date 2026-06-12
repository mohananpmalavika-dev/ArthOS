-- V7 Migration: Cognition Graph System
-- Implements knowledge graph for financial beliefs, decisions, biases, and outcomes
-- Creates the infrastructure for Belief → Decision → Outcome mapping
-- Created: 2026-06-12

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "jsonb_utils" CASCADE;

-- 1. Money Beliefs - Core financial beliefs extracted from user behavior and assessments
CREATE TABLE IF NOT EXISTS money_beliefs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Belief Definition
  belief_statement TEXT NOT NULL, -- e.g., "Money is scarce and hard to earn"
  belief_category VARCHAR(100) NOT NULL, -- "scarcity", "abundance", "security", "growth", "identity", "control"
  belief_type VARCHAR(100) NOT NULL, -- "core_belief", "money_script", "value", "fear"
  
  -- Belief Strength & Confidence
  belief_strength DECIMAL(5, 2) NOT NULL, -- 0-100 (how strongly held)
  confidence_score DECIMAL(5, 2) NOT NULL, -- 0-100 (our confidence in detecting this belief)
  belief_origin VARCHAR(100), -- "family_history", "life_event", "assessment_response", "behavioral_signal"
  
  -- Supporting Evidence
  supporting_evidence JSONB, -- Array of evidence items (transactions, responses, behaviors)
  contradicting_evidence JSONB, -- Evidence against this belief
  
  -- Psychological Context
  emotional_valence VARCHAR(20), -- "positive", "negative", "neutral"
  activation_frequency INT DEFAULT 0, -- How often this belief is activated in decisions
  
  -- Evolution Tracking
  first_detected_date DATE NOT NULL,
  last_reinforced_date DATE,
  belief_evolution_trend VARCHAR(20), -- "strengthening", "weakening", "stable"
  
  -- Metadata
  is_limiting_belief BOOLEAN NOT NULL DEFAULT FALSE, -- Limiting vs empowering
  is_core_belief BOOLEAN NOT NULL DEFAULT FALSE, -- Core vs secondary
  associated_biases TEXT[], -- Array of bias IDs that stem from this belief
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT belief_user_unique UNIQUE(user_id, belief_statement, belief_category)
);

CREATE INDEX idx_money_beliefs_user_category ON money_beliefs(user_id, belief_category, belief_strength DESC);
CREATE INDEX idx_money_beliefs_strength ON money_beliefs(user_id, belief_strength DESC, confidence_score DESC);
CREATE INDEX idx_money_beliefs_limiting ON money_beliefs(user_id, is_limiting_belief, belief_strength DESC);

ALTER TABLE money_beliefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own beliefs"
  ON money_beliefs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own beliefs"
  ON money_beliefs FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage their own beliefs"
  ON money_beliefs FOR UPDATE WITH CHECK (user_id = auth.uid());

-- 2. Cognitive Biases - Detected cognitive biases affecting financial decisions
CREATE TABLE IF NOT EXISTS cognitive_biases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Bias Classification
  bias_type VARCHAR(100) NOT NULL, -- "loss_aversion", "present_bias", "optimism_bias", "anchoring", "confirmation", "status_quo", "availability", "sunk_cost"
  bias_name VARCHAR(255) NOT NULL,
  bias_description TEXT NOT NULL,
  
  -- Bias Intensity
  bias_intensity_score DECIMAL(5, 2) NOT NULL, -- 0-100 (how strongly this bias manifests)
  confidence_score DECIMAL(5, 2) NOT NULL, -- 0-100 (our confidence in detection)
  
  -- Supporting Evidence
  detected_instances INT NOT NULL DEFAULT 0, -- Number of times we've seen this bias in action
  example_incidents JSONB, -- Array of specific examples
  most_recent_incident DATE,
  
  -- Financial Impact
  estimated_annual_impact DECIMAL(15, 2), -- Estimated cost of this bias
  impact_areas TEXT[], -- Which financial areas affected: "spending", "savings", "investing", "borrowing"
  
  -- Related Beliefs
  parent_belief_id UUID REFERENCES money_beliefs(id),
  reinforcing_beliefs TEXT[], -- Array of belief IDs that reinforce this bias
  
  -- Intervention & Awareness
  intervention_suggested TEXT, -- Recommended intervention
  user_aware_of_bias BOOLEAN NOT NULL DEFAULT FALSE,
  awareness_date DATE,
  
  -- Evolution
  first_detected_date DATE NOT NULL,
  trend VARCHAR(20), -- "increasing", "decreasing", "stable"
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT bias_user_type_unique UNIQUE(user_id, bias_type)
);

CREATE INDEX idx_cognitive_biases_user_type ON cognitive_biases(user_id, bias_type, bias_intensity_score DESC);
CREATE INDEX idx_cognitive_biases_impact ON cognitive_biases(user_id, estimated_annual_impact DESC);
CREATE INDEX idx_cognitive_biases_belief ON cognitive_biases(parent_belief_id, user_id);

ALTER TABLE cognitive_biases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own biases"
  ON cognitive_biases FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own biases"
  ON cognitive_biases FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage their own biases"
  ON cognitive_biases FOR UPDATE WITH CHECK (user_id = auth.uid());

-- 3. Risk Perception Profiles - Calibration of user's risk perception vs actual risk
CREATE TABLE IF NOT EXISTS risk_perception_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Risk Assessment Date
  assessment_date DATE NOT NULL,
  
  -- Perceived vs Actual Risk
  perceived_risk_score DECIMAL(5, 2) NOT NULL, -- 0-100 (what user thinks is risky)
  actual_risk_score DECIMAL(5, 2) NOT NULL, -- 0-100 (objective/statistical risk)
  calibration_error DECIMAL(5, 2), -- Difference (+ = over-perceiving, - = under-perceiving)
  
  -- Risk Dimensions
  financial_loss_perception DECIMAL(5, 2), -- How scary is loss?
  investment_risk_perception DECIMAL(5, 2), -- How scary are market fluctuations?
  income_uncertainty_perception DECIMAL(5, 2), -- How scary is income variability?
  emergency_preparedness_perception DECIMAL(5, 2), -- How prepared do they feel?
  
  -- Calibration Factor
  calibration_factor DECIMAL(8, 4), -- Multiplier to recalibrate perceived to actual
  
  -- Risk Aversion Indicators
  risk_aversion_level VARCHAR(20), -- "very_conservative", "conservative", "moderate", "aggressive", "very_aggressive"
  loss_aversion_score DECIMAL(5, 2), -- How much more do losses hurt than gains?
  
  -- Time Orientation
  time_discount_factor DECIMAL(8, 4), -- How much less do they value future outcomes?
  present_bias_score DECIMAL(5, 2),
  
  -- Evolution Tracking
  previous_assessment_id UUID REFERENCES risk_perception_profiles(id),
  calibration_improvement DECIMAL(5, 2), -- Change from previous (+ = improving)
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT risk_profile_user_date_unique UNIQUE(user_id, assessment_date)
);

CREATE INDEX idx_risk_perception_user_date ON risk_perception_profiles(user_id, assessment_date DESC);
CREATE INDEX idx_risk_perception_calibration ON risk_perception_profiles(user_id, calibration_error);

ALTER TABLE risk_perception_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own risk profiles"
  ON risk_perception_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own risk profiles"
  ON risk_perception_profiles FOR INSERT WITH CHECK (user_id = auth.uid());

-- 4. Financial Emotional Triggers - Events/emotions that drive financial behaviors
CREATE TABLE IF NOT EXISTS financial_emotional_triggers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Trigger Definition
  trigger_event TEXT NOT NULL, -- e.g., "Salary received", "Unexpected expense", "Market volatility"
  trigger_category VARCHAR(100) NOT NULL, -- "income", "expense", "market", "social", "emotional", "temporal"
  trigger_emotion VARCHAR(100) NOT NULL, -- "anxiety", "excitement", "shame", "relief", "confidence", "fear"
  
  -- Trigger Strength & Frequency
  trigger_intensity DECIMAL(5, 2) NOT NULL, -- 0-100 (how strongly this trigger activates emotion)
  frequency_per_month DECIMAL(8, 2), -- How often does this occur?
  
  -- Associated Behaviors
  common_behaviors TEXT[] NOT NULL, -- Array of behaviors triggered: "impulsive_spending", "overdraft", "investment", etc.
  probability_behavior_occurs DECIMAL(5, 2)[], -- For each behavior, probability it occurs when triggered
  
  -- Financial Impact
  average_transaction_amount DECIMAL(15, 2),
  estimated_monthly_impact DECIMAL(15, 2),
  estimated_annual_impact DECIMAL(15, 2),
  
  -- Related Beliefs
  underlying_belief_id UUID REFERENCES money_beliefs(id),
  contributing_biases TEXT[], -- Array of bias IDs involved
  
  -- Contextual Data
  time_of_day_pattern VARCHAR(100), -- Morning, afternoon, evening, night
  day_of_week_pattern INT[], -- Days of week (0-6) when trigger most activates
  
  -- Intervention & Awareness
  user_aware_of_trigger BOOLEAN NOT NULL DEFAULT FALSE,
  suggested_intervention TEXT,
  
  -- Trend Analysis
  first_detected_date DATE NOT NULL,
  last_triggered_date DATE,
  trend VARCHAR(20), -- "increasing_frequency", "decreasing_frequency", "stable"
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT trigger_user_unique UNIQUE(user_id, trigger_event, trigger_emotion)
);

CREATE INDEX idx_emotional_triggers_user_impact ON financial_emotional_triggers(user_id, estimated_annual_impact DESC);
CREATE INDEX idx_emotional_triggers_frequency ON financial_emotional_triggers(user_id, frequency_per_month DESC);
CREATE INDEX idx_emotional_triggers_belief ON financial_emotional_triggers(underlying_belief_id);

ALTER TABLE financial_emotional_triggers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own triggers"
  ON financial_emotional_triggers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own triggers"
  ON financial_emotional_triggers FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage their own triggers"
  ON financial_emotional_triggers FOR UPDATE WITH CHECK (user_id = auth.uid());

-- 5. Financial Decisions - Every significant financial decision captured and tracked
CREATE TABLE IF NOT EXISTS financial_decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Decision Details
  decision_title VARCHAR(255) NOT NULL, -- e.g., "Invest ₹50,000 in mutual fund"
  decision_description TEXT,
  decision_type VARCHAR(100) NOT NULL, -- "purchase", "investment", "savings", "borrowing", "spending", "allocation"
  decision_category VARCHAR(100) NOT NULL, -- "housing", "auto", "education", "health", "entertainment", "finance"
  
  -- Decision Metrics
  decision_amount DECIMAL(15, 2),
  decision_date DATE NOT NULL,
  decision_time TIME,
  
  -- Decision Context
  decision_confidence DECIMAL(5, 2), -- 0-100 (how confident in decision)
  time_pressure_level DECIMAL(5, 2), -- 0-100 (how rushed was this decision?)
  emotional_state VARCHAR(100), -- "calm", "anxious", "excited", "frustrated"
  
  -- Options & Selection
  options_considered INT, -- How many alternatives did they consider?
  selected_option INT, -- Which option did they choose (1-based)?
  decision_reasoning TEXT, -- Why did they choose this?
  
  -- Cognitive Factors
  influencing_beliefs TEXT[], -- Array of belief IDs that influenced this
  relevant_biases TEXT[], -- Array of bias IDs that affected this
  triggered_by_emotion_id UUID REFERENCES financial_emotional_triggers(id),
  
  -- Decision Quality Assessment
  decision_quality_score DECIMAL(5, 2), -- 0-100 (how good was this decision in hindsight?)
  alignment_with_goals DECIMAL(5, 2), -- 0-100
  value_consistency DECIMAL(5, 2), -- 0-100 (consistent with stated values?)
  bias_evidence DECIMAL(5, 2), -- 0-100 (how much bias evidence?)
  
  -- Time Orientation
  time_horizon VARCHAR(100), -- "immediate", "short_term", "medium_term", "long_term"
  
  -- Decision Status
  decision_status VARCHAR(20) NOT NULL, -- "pending", "executed", "partially_executed", "abandoned", "reversed"
  execution_start_date DATE,
  execution_completion_date DATE,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_financial_decisions_user_date ON financial_decisions(user_id, decision_date DESC);
CREATE INDEX idx_financial_decisions_quality ON financial_decisions(user_id, decision_quality_score DESC);
CREATE INDEX idx_financial_decisions_status ON financial_decisions(user_id, decision_status);

ALTER TABLE financial_decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own decisions"
  ON financial_decisions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own decisions"
  ON financial_decisions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage their own decisions"
  ON financial_decisions FOR UPDATE WITH CHECK (user_id = auth.uid());

-- 6. Decision Outcomes - Actual outcomes of financial decisions
CREATE TABLE IF NOT EXISTS decision_outcomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  decision_id UUID NOT NULL REFERENCES financial_decisions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Outcome Tracking
  outcome_date DATE NOT NULL,
  actual_amount DECIMAL(15, 2),
  outcome_status VARCHAR(100) NOT NULL, -- "successful", "partially_successful", "unsuccessful", "unexpected_positive", "unexpected_negative"
  
  -- Outcome Analysis
  intended_outcome TEXT,
  actual_outcome TEXT,
  outcome_matches_intention BOOLEAN,
  
  -- Financial Impact
  financial_impact DECIMAL(15, 2), -- $ gained or lost
  impact_direction VARCHAR(20), -- "positive", "negative", "neutral"
  
  -- Decision Quality Evaluation
  decision_was_optimal BOOLEAN, -- Was this the best choice in hindsight?
  counterfactual_outcome DECIMAL(15, 2), -- What would have happened with another option?
  opportunity_cost DECIMAL(15, 2), -- What was missed by this choice?
  
  -- Emotional Impact
  emotional_outcome VARCHAR(100), -- "satisfied", "regretful", "neutral", "relieved", "disappointed"
  satisfaction_score DECIMAL(5, 2), -- 0-100
  
  -- Learning Extracted
  lessons_learned TEXT,
  pattern_identified VARCHAR(255),
  
  -- Comparison to Prediction
  actual_vs_expected DECIMAL(5, 2), -- How close was outcome to expectation? (%)
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT outcome_decision_unique UNIQUE(decision_id)
);

CREATE INDEX idx_decision_outcomes_user_date ON decision_outcomes(user_id, outcome_date DESC);
CREATE INDEX idx_decision_outcomes_impact ON decision_outcomes(user_id, financial_impact DESC);
CREATE INDEX idx_decision_outcomes_satisfaction ON decision_outcomes(user_id, satisfaction_score DESC);

ALTER TABLE decision_outcomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own outcomes"
  ON decision_outcomes FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own outcomes"
  ON decision_outcomes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage their own outcomes"
  ON decision_outcomes FOR UPDATE WITH CHECK (user_id = auth.uid());

-- 7. Belief Evolution Timeline - How beliefs change over time
CREATE TABLE IF NOT EXISTS belief_evolution_timeline (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  belief_id UUID NOT NULL REFERENCES money_beliefs(id) ON DELETE CASCADE,
  
  -- Evolution Event
  event_date DATE NOT NULL,
  event_type VARCHAR(100) NOT NULL, -- "belief_introduced", "belief_reinforced", "belief_challenged", "belief_modified", "belief_abandoned"
  
  -- Event Description
  event_description TEXT,
  triggering_event TEXT, -- What caused this evolution?
  
  -- Belief Change
  belief_strength_before DECIMAL(5, 2),
  belief_strength_after DECIMAL(5, 2),
  strength_change DECIMAL(5, 2),
  
  -- Evidence & Impact
  supporting_evidence TEXT,
  contradicting_evidence TEXT,
  
  -- Related Decision/Outcome
  related_decision_id UUID REFERENCES financial_decisions(id),
  related_outcome_id UUID REFERENCES decision_outcomes(id),
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_belief_evolution_user_date ON belief_evolution_timeline(user_id, event_date DESC);
CREATE INDEX idx_belief_evolution_belief ON belief_evolution_timeline(belief_id, event_date DESC);

ALTER TABLE belief_evolution_timeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own evolution"
  ON belief_evolution_timeline FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own evolution"
  ON belief_evolution_timeline FOR INSERT WITH CHECK (user_id = auth.uid());

-- 8. Cognition Graph Cache - Optimized representation for graph visualization
CREATE TABLE IF NOT EXISTS cognition_graph_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Graph Representation
  nodes JSONB NOT NULL, -- Array of graph nodes: {id, type, label, data}
  edges JSONB NOT NULL, -- Array of edges: {source, target, type, weight}
  
  -- Graph Metadata
  node_count INT,
  edge_count INT,
  
  -- Core Beliefs (top 3)
  top_beliefs TEXT[],
  
  -- Major Biases (top 3)
  major_biases TEXT[],
  
  -- Strongest Triggers (top 3)
  strongest_triggers TEXT[],
  
  -- Graph Statistics
  belief_network_density DECIMAL(8, 4), -- 0-1 (how interconnected)
  centrality_scores JSONB, -- Map of node IDs to centrality scores
  
  -- Cache Validity
  last_updated DATE NOT NULL,
  cache_valid_until TIMESTAMP NOT NULL,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT cognition_cache_user_unique UNIQUE(user_id)
);

CREATE INDEX idx_cognition_cache_validity ON cognition_graph_cache(user_id, cache_valid_until DESC);

ALTER TABLE cognition_graph_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own cache"
  ON cognition_graph_cache FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own cache"
  ON cognition_graph_cache FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage their own cache"
  ON cognition_graph_cache FOR UPDATE WITH CHECK (user_id = auth.uid());

-- Relationship tracking - Foreign key constraints establish basic relationships
-- Additional relationship metadata stored in JSONB columns for flexibility

-- Create function to auto-update timestamps
CREATE OR REPLACE FUNCTION update_cognition_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables
CREATE TRIGGER money_beliefs_update_timestamp
  BEFORE UPDATE ON money_beliefs
  FOR EACH ROW
  EXECUTE FUNCTION update_cognition_timestamps();

CREATE TRIGGER cognitive_biases_update_timestamp
  BEFORE UPDATE ON cognitive_biases
  FOR EACH ROW
  EXECUTE FUNCTION update_cognition_timestamps();

CREATE TRIGGER risk_perception_update_timestamp
  BEFORE UPDATE ON risk_perception_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_cognition_timestamps();

CREATE TRIGGER emotional_triggers_update_timestamp
  BEFORE UPDATE ON financial_emotional_triggers
  FOR EACH ROW
  EXECUTE FUNCTION update_cognition_timestamps();

CREATE TRIGGER financial_decisions_update_timestamp
  BEFORE UPDATE ON financial_decisions
  FOR EACH ROW
  EXECUTE FUNCTION update_cognition_timestamps();

CREATE TRIGGER decision_outcomes_update_timestamp
  BEFORE UPDATE ON decision_outcomes
  FOR EACH ROW
  EXECUTE FUNCTION update_cognition_timestamps();

CREATE TRIGGER belief_evolution_update_timestamp
  BEFORE UPDATE ON belief_evolution_timeline
  FOR EACH ROW
  EXECUTE FUNCTION update_cognition_timestamps();

CREATE TRIGGER cognition_cache_update_timestamp
  BEFORE UPDATE ON cognition_graph_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_cognition_timestamps();

-- Add table documentation
COMMENT ON TABLE money_beliefs IS 'Core financial beliefs extracted from behavior and assessment responses';
COMMENT ON TABLE cognitive_biases IS 'Detected cognitive biases affecting financial decision-making';
COMMENT ON TABLE risk_perception_profiles IS 'Calibration of perceived vs actual financial risk';
COMMENT ON TABLE financial_emotional_triggers IS 'Emotional triggers that drive financial behaviors and decisions';
COMMENT ON TABLE financial_decisions IS 'Every significant financial decision captured with context and quality assessment';
COMMENT ON TABLE decision_outcomes IS 'Actual outcomes of financial decisions compared to intent and predictions';
COMMENT ON TABLE belief_evolution_timeline IS 'Historical record of how user beliefs change over time';
COMMENT ON TABLE cognition_graph_cache IS 'Optimized graph representation for visualization and analysis';
