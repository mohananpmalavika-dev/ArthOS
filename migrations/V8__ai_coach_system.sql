-- V8 AI Coach System Database Schema
-- Stores conversations, context, and coaching recommendations

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============= SYSTEM FUNCTIONS (MUST BE DEFINED FIRST) =============

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

---

-- ============= COACH CONVERSATIONS TABLE =============
-- Stores individual messages in coach conversations
CREATE TABLE IF NOT EXISTS coach_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL DEFAULT uuid_generate_v4(),
  message_type VARCHAR(20) NOT NULL, -- 'user_message', 'coach_response'
  content TEXT NOT NULL,
  message_order INT NOT NULL, -- Conversation sequence
  
  -- Context for this message
  user_emotional_state VARCHAR(100), -- happy, anxious, frustrated, etc.
  relevant_belief_ids TEXT[], -- Beliefs this message relates to
  relevant_bias_ids TEXT[], -- Biases being discussed
  relevant_decision_ids TEXT[], -- Decisions being analyzed
  
  -- AI metadata
  tokens_used INT, -- For cost tracking
  model_used VARCHAR(50) DEFAULT 'gpt-4-turbo',
  confidence_score DECIMAL(5,2), -- 0-100: how confident is coach in this response?
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Enable RLS on coach_conversations
ALTER TABLE coach_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations"
  ON coach_conversations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages"
  ON coach_conversations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Indexes for fast queries
CREATE INDEX idx_coach_conversations_user_session 
  ON coach_conversations(user_id, session_id DESC, message_order);
CREATE INDEX idx_coach_conversations_created_at 
  ON coach_conversations(user_id, created_at DESC);
CREATE INDEX idx_coach_conversations_emotional_state 
  ON coach_conversations(user_id, user_emotional_state);

-- Audit trigger
CREATE TRIGGER update_coach_conversations_timestamp
  BEFORE UPDATE ON coach_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

---

-- ============= COACH SESSION CONTEXT TABLE =============
-- Stores high-level context for each coaching session
CREATE TABLE IF NOT EXISTS coach_session_context (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  
  -- Session metadata
  session_start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  session_end_date TIMESTAMP,
  message_count INT DEFAULT 0,
  total_tokens_used INT DEFAULT 0,
  
  -- User state snapshot at session start
  health_score_at_start DECIMAL(5,2),
  survival_window_at_start INT,
  primary_concern VARCHAR(255), -- Why did user start this session?
  
  -- Session focus areas
  focus_belief_id UUID, -- Main belief being discussed
  focus_bias_id UUID, -- Main bias being addressed
  focus_decision_id UUID, -- Decision being analyzed
  session_theme VARCHAR(100), -- 'spending_control', 'savings_building', 'debt_reduction', etc.
  
  -- Session outcomes
  key_insights TEXT[], -- Array of insights generated
  recommended_actions TEXT[], -- Specific actions recommended
  session_summary TEXT, -- AI-generated summary
  user_satisfaction_score DECIMAL(5,2), -- 0-100, rated by user
  
  -- Coaching signals
  user_receptiveness DECIMAL(5,2), -- 0-100: how open was user to guidance?
  behavior_change_likely BOOLEAN, -- Did coach assess likelihood of behavior change?
  follow_up_needed BOOLEAN, -- Should coach check in with user?
  follow_up_date TIMESTAMP, -- When should follow-up happen?
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT fk_belief FOREIGN KEY (focus_belief_id) REFERENCES money_beliefs(id),
  CONSTRAINT fk_bias FOREIGN KEY (focus_bias_id) REFERENCES cognitive_biases(id),
  CONSTRAINT fk_decision FOREIGN KEY (focus_decision_id) REFERENCES financial_decisions(id)
);

-- Enable RLS
ALTER TABLE coach_session_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
  ON coach_session_context
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
  ON coach_session_context
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_coach_sessions_user_date 
  ON coach_session_context(user_id, session_start_date DESC);
CREATE INDEX idx_coach_sessions_theme 
  ON coach_session_context(user_id, session_theme);
CREATE INDEX idx_coach_sessions_followup 
  ON coach_session_context(user_id, follow_up_date) 
  WHERE follow_up_needed = TRUE;

-- Audit trigger
CREATE TRIGGER update_coach_session_context_timestamp
  BEFORE UPDATE ON coach_session_context
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

---

-- ============= COACH RECOMMENDATIONS TABLE =============
-- Stores specific recommendations given by coach
CREATE TABLE IF NOT EXISTS coach_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  
  -- Recommendation details
  recommendation_text TEXT NOT NULL,
  recommendation_type VARCHAR(50) NOT NULL, -- 'action', 'insight', 'reframe', 'challenge'
  priority_level VARCHAR(20) NOT NULL, -- 'critical', 'high', 'medium', 'low'
  
  -- Context
  related_belief_id UUID,
  related_bias_id UUID, -- Which bias is this addressing?
  related_decision_id UUID,
  
  -- Recommendation specificity
  time_frame VARCHAR(50), -- 'this_week', 'this_month', 'before_next_paycheck'
  success_metric TEXT, -- How to measure if recommendation succeeded
  expected_impact TEXT, -- What should change if user follows this?
  
  -- User engagement
  recommendation_status VARCHAR(30) DEFAULT 'offered', -- 'offered', 'accepted', 'in_progress', 'completed', 'abandoned'
  status_updated_at TIMESTAMP,
  
  -- Effectiveness
  effectiveness_rating DECIMAL(5,2), -- 0-100: user's rating of how effective it was
  behavioral_change_observed BOOLEAN, -- Did user's behavior change?
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT fk_belief FOREIGN KEY (related_belief_id) REFERENCES money_beliefs(id),
  CONSTRAINT fk_bias FOREIGN KEY (related_bias_id) REFERENCES cognitive_biases(id),
  CONSTRAINT fk_decision FOREIGN KEY (related_decision_id) REFERENCES financial_decisions(id)
);

-- Enable RLS
ALTER TABLE coach_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recommendations"
  ON coach_recommendations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their recommendations"
  ON coach_recommendations
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_coach_recommendations_user_status 
  ON coach_recommendations(user_id, recommendation_status);
CREATE INDEX idx_coach_recommendations_priority 
  ON coach_recommendations(user_id, priority_level DESC);
CREATE INDEX idx_coach_recommendations_created 
  ON coach_recommendations(user_id, created_at DESC);

-- Audit trigger
CREATE TRIGGER update_coach_recommendations_timestamp
  BEFORE UPDATE ON coach_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

---

-- ============= COACH CONVERSATION MEMORY TABLE =============
-- Compressed memory of user preferences, patterns, and coaching history
CREATE TABLE IF NOT EXISTS coach_memory_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Communication preferences
  preferred_coaching_style VARCHAR(100), -- 'motivational', 'analytical', 'compassionate', 'direct'
  response_length_preference VARCHAR(30), -- 'concise', 'detailed', 'conversational'
  preferred_language VARCHAR(20) DEFAULT 'en',
  
  -- User patterns learned by coach
  common_financial_concerns TEXT[], -- Recurring topics
  known_spending_triggers TEXT[],
  known_motivations TEXT[], -- What drives this user?
  
  -- Coach's assessment of user
  risk_tolerance_level VARCHAR(30), -- 'very_conservative', 'conservative', 'moderate', 'aggressive'
  financial_literacy_level VARCHAR(30), -- 'novice', 'developing', 'intermediate', 'advanced'
  receptiveness_to_change DECIMAL(5,2), -- 0-100
  
  -- Coaching effectiveness data
  total_conversations INT DEFAULT 0,
  total_recommendations_given INT DEFAULT 0,
  recommendations_accepted INT DEFAULT 0,
  acceptance_rate DECIMAL(5,2), -- recommendations_accepted / total_recommendations * 100
  recommendations_with_behavior_change INT DEFAULT 0,
  
  -- Conversation history summary
  last_conversation_date TIMESTAMP,
  last_conversation_topic VARCHAR(255),
  days_since_last_interaction INT,
  
  -- Memory of previous decisions
  previous_decision_patterns JSONB, -- {pattern: count}
  previous_recommendation_patterns JSONB,
  previous_belief_focuses JSONB, -- {belief_id: count}
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE coach_memory_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON coach_memory_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Audit trigger
CREATE TRIGGER update_coach_memory_profiles_timestamp
  BEFORE UPDATE ON coach_memory_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

---

-- ============= COACH PERFORMANCE ANALYTICS TABLE =============
-- Tracks coaching effectiveness across user cohorts
CREATE TABLE IF NOT EXISTS coach_performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_date DATE DEFAULT CURRENT_DATE,
  
  -- Aggregate metrics
  total_conversations INT,
  total_users_coached INT,
  average_conversation_length DECIMAL(8,2), -- messages per session
  average_session_duration_minutes INT,
  
  -- Recommendation metrics
  total_recommendations_given INT,
  total_accepted INT,
  acceptance_rate DECIMAL(5,2), -- 0-100
  recommendations_with_behavior_change INT,
  behavior_change_rate DECIMAL(5,2),
  
  -- Quality metrics
  average_user_satisfaction DECIMAL(5,2), -- 0-100
  average_receptiveness DECIMAL(5,2), -- 0-100
  average_confidence_score DECIMAL(5,2), -- 0-100
  
  -- Topic analysis
  top_discussion_topics JSONB, -- [{topic, count}, ...]
  most_effective_recommendations JSONB,
  
  -- Cost metrics
  total_tokens_used INT,
  average_tokens_per_conversation INT,
  estimated_api_cost DECIMAL(10,4),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- No RLS needed - this is aggregate data

-- Indexes
CREATE INDEX idx_coach_performance_date 
  ON coach_performance_metrics(metric_date DESC);

---

-- ============= INITIAL DATA =============

-- Sample coaching memory profile structure (documented, not inserted)
-- Will be auto-created on first user interaction with coach

COMMENT ON TABLE coach_conversations IS 'Individual messages in coaching conversations. Stores both user messages and coach responses with metadata.';
COMMENT ON TABLE coach_session_context IS 'High-level context and outcomes for each coaching session.';
COMMENT ON TABLE coach_recommendations IS 'Specific recommendations given by the coach, tracked for effectiveness.';
COMMENT ON TABLE coach_memory_profiles IS 'Compressed memory of user preferences, patterns, and coaching effectiveness.';
COMMENT ON TABLE coach_performance_metrics IS 'Aggregate metrics for coach performance analysis and optimization.';
