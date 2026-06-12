-- V11: Subscription Management Schema
-- Adds tables for subscription tier management and billing

-- Add subscription columns to users table if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50) DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'inactive';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Note: the users table in this project uses BIGINT primary keys (id).
-- All user_id foreign keys must match this type.

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE,


  stripe_subscription_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),

  tier VARCHAR(50) NOT NULL DEFAULT 'free',
  status VARCHAR(50) NOT NULL,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  trial_end TIMESTAMP,
  cancel_at TIMESTAMP,
  canceled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tier ON subscriptions(tier);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Create subscription invoices table for payment tracking
CREATE TABLE IF NOT EXISTS subscription_invoices (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  stripe_invoice_id VARCHAR(255) NOT NULL UNIQUE,

  stripe_subscription_id VARCHAR(255),
  amount_paid INT,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50),
  paid_at TIMESTAMP,
  due_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_subscription_invoices_user_id ON subscription_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_paid_at ON subscription_invoices(paid_at);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_status ON subscription_invoices(status);

-- Create assessment usage table for free tier limiting
CREATE TABLE IF NOT EXISTS assessment_usage (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  month VARCHAR(7) NOT NULL,
  count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, month),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_assessment_usage_user_id ON assessment_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_usage_month ON assessment_usage(month);

-- Create feature access log for analytics
CREATE TABLE IF NOT EXISTS feature_access_log (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  feature_key VARCHAR(100) NOT NULL,
  tier_at_time VARCHAR(50),
  allowed BOOLEAN,
  accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_feature_access_log_user_id ON feature_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_access_log_feature_key ON feature_access_log(feature_key);
CREATE INDEX IF NOT EXISTS idx_feature_access_log_accessed_at ON feature_access_log(accessed_at);

-- updated_at triggers (PostgreSQL)
CREATE OR REPLACE FUNCTION update_timestamp_v11()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS subscriptions_update_timestamp ON subscriptions;
CREATE TRIGGER subscriptions_update_timestamp
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_v11();

DROP TRIGGER IF EXISTS subscription_invoices_update_timestamp ON subscription_invoices;
CREATE TRIGGER subscription_invoices_update_timestamp
BEFORE UPDATE ON subscription_invoices
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_v11();

DROP TRIGGER IF EXISTS assessment_usage_update_timestamp ON assessment_usage;
CREATE TRIGGER assessment_usage_update_timestamp
BEFORE UPDATE ON assessment_usage
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_v11();

DROP TRIGGER IF EXISTS feature_access_log_update_timestamp ON feature_access_log;
CREATE TRIGGER feature_access_log_update_timestamp
BEFORE UPDATE ON feature_access_log
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_v11();

