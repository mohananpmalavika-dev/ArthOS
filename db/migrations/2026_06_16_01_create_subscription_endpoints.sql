-- Create subscription_endpoints table
CREATE TABLE IF NOT EXISTS subscription_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint text NOT NULL,
  auth text,
  p256dh text,
  user_agent text,
  user_id text,
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscription_endpoints_user_id ON subscription_endpoints(user_id);
