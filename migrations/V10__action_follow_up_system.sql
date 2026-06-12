-- V10: Action Follow-Up System
-- Day 7 and Day 30 re-engagement tracking to measure behavior change

-- Create action_follow_ups table
CREATE TABLE IF NOT EXISTS public.action_follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Initial action commitment
  insight_id TEXT NOT NULL,
  insight_category VARCHAR(50),
  insight_headline TEXT,
  action_committed TEXT NOT NULL,
  initial_assessment JSONB,
  
  -- Baseline scores at time of action commitment
  baseline_behaviour_score NUMERIC DEFAULT 0,
  baseline_awareness_score NUMERIC DEFAULT 0,
  baseline_stability_score NUMERIC DEFAULT 0,
  baseline_overall_health NUMERIC DEFAULT 0,
  
  -- Day 7 tracking
  day_7_reminder_date TIMESTAMP NOT NULL,
  day_7_status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, sent, responded, skipped
  day_7_response_date TIMESTAMP,
  day_7_action_completed BOOLEAN,
  day_7_response_text TEXT,
  day_7_progress_score NUMERIC, -- 0-100 scale
  day_7_obstacles TEXT,
  day_7_updated_at TIMESTAMP,
  
  -- Day 30 tracking
  day_30_reminder_date TIMESTAMP NOT NULL,
  day_30_status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, sent, responded, skipped
  day_30_response_date TIMESTAMP,
  day_30_action_sustained BOOLEAN,
  day_30_response_text TEXT,
  day_30_progress_score NUMERIC, -- 0-100 scale
  day_30_habit_formed BOOLEAN,
  day_30_obstacles TEXT,
  day_30_complete BOOLEAN DEFAULT FALSE,
  day_30_updated_at TIMESTAMP,
  
  -- Metadata
  scheduled_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- RLS
  CONSTRAINT user_id_not_null CHECK (user_id IS NOT NULL)
);

-- Create follow_up_delta_reports table
CREATE TABLE IF NOT EXISTS public.follow_up_delta_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  follow_up_id UUID NOT NULL REFERENCES public.action_follow_ups(id) ON DELETE CASCADE,
  
  -- Score deltas (Day 30 vs Baseline)
  behavior_delta NUMERIC DEFAULT 0,
  awareness_delta NUMERIC DEFAULT 0,
  stability_delta NUMERIC DEFAULT 0,
  health_delta NUMERIC DEFAULT 0,
  
  -- Improvement indicators
  improved BOOLEAN DEFAULT FALSE,
  improvement_percentage NUMERIC DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT user_id_not_null CHECK (user_id IS NOT NULL)
);

-- Create behavior_signals table (if not exists) for signal recording
CREATE TABLE IF NOT EXISTS public.behavior_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  signal_type VARCHAR(100) NOT NULL, -- 'day_7_action_follow_up', 'day_30_follow_up', etc.
  signal_source VARCHAR(50) DEFAULT 'action_follow_up',
  signal_value NUMERIC, -- 0-100 or other scale
  signal_data JSONB,
  
  recorded_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT user_id_not_null CHECK (user_id IS NOT NULL)
);

-- Create indexes for performance
CREATE INDEX idx_action_follow_ups_user_id ON public.action_follow_ups(user_id);
CREATE INDEX idx_action_follow_ups_day_7_reminder ON public.action_follow_ups(day_7_reminder_date);
CREATE INDEX idx_action_follow_ups_day_30_reminder ON public.action_follow_ups(day_30_reminder_date);
CREATE INDEX idx_action_follow_ups_day_7_status ON public.action_follow_ups(day_7_status);
CREATE INDEX idx_action_follow_ups_day_30_status ON public.action_follow_ups(day_30_status);
CREATE INDEX idx_follow_up_delta_reports_user_id ON public.follow_up_delta_reports(user_id);
CREATE INDEX idx_behavior_signals_user_id ON public.behavior_signals(user_id);
CREATE INDEX idx_behavior_signals_recorded_at ON public.behavior_signals(recorded_at);

-- Enable RLS
ALTER TABLE public.action_follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_delta_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavior_signals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own action follow-ups"
  ON public.action_follow_ups
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own action follow-ups"
  ON public.action_follow_ups
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own action follow-ups"
  ON public.action_follow_ups
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own delta reports"
  ON public.follow_up_delta_reports
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own delta reports"
  ON public.follow_up_delta_reports
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own behavior signals"
  ON public.behavior_signals
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own behavior signals"
  ON public.behavior_signals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Update trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to action_follow_ups
CREATE TRIGGER action_follow_ups_update_timestamp
BEFORE UPDATE ON public.action_follow_ups
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();
