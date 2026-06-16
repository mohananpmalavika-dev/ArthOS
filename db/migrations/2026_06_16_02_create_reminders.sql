-- Create reminders table
CREATE TABLE IF NOT EXISTS reminders (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  type text,
  deliver_at timestamptz NOT NULL,
  timezone text,
  title text,
  body text,
  action_url text,
  channels jsonb,
  channel_preferences jsonb,
  idempotency_key text,
  metadata jsonb,
  status text DEFAULT 'pending',
  attempts integer DEFAULT 0,
  last_attempt_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_deliver_at ON reminders(deliver_at);
