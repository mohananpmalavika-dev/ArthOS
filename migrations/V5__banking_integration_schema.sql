-- Migration V5: Real Banking Integration
-- Comprehensive banking data model for Account Aggregator, UPI, Bank Feeds, and Insurance
-- Run this in your Supabase SQL Editor after previous migrations

-- ────────────────────────────────────────────────────────────────
-- 1. BANK ACCOUNTS & AGGREGATION
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bank_connections (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  
  -- Connection metadata
  connection_type VARCHAR(32) NOT NULL, -- 'aa' (Account Aggregator), 'direct', 'api'
  bank_code VARCHAR(32), -- IFSC-like identifier
  bank_name VARCHAR(128),
  account_type VARCHAR(32), -- 'savings', 'current', 'loan', 'investment'
  masked_account_number VARCHAR(20),
  
  -- Consent & encryption
  consent_id VARCHAR(256) UNIQUE, -- Account Aggregator consent token
  consent_expiry TIMESTAMPTZ,
  encryption_key_id VARCHAR(64),
  
  -- Status tracking
  status VARCHAR(32) NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'consent_expired', 'revoked'
  
  -- Timestamps
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_bank_connections_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT valid_connection_type CHECK (connection_type IN ('aa', 'direct', 'api')),
  CONSTRAINT valid_account_type CHECK (account_type IN ('savings', 'current', 'loan', 'investment', 'credit_card')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'consent_expired', 'revoked'))
);

CREATE INDEX idx_bank_connections_user_id ON bank_connections(user_id);
CREATE INDEX idx_bank_connections_status ON bank_connections(status);
CREATE INDEX idx_bank_connections_consent_id ON bank_connections(consent_id);

-- ────────────────────────────────────────────────────────────────
-- 2. ACCOUNT AGGREGATOR CONSENT & CREDENTIALS
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS aa_consent_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  bank_connection_id BIGINT,
  
  -- Consent lifecycle
  consent_id VARCHAR(256) NOT NULL UNIQUE,
  consent_status VARCHAR(32) NOT NULL, -- 'pending', 'approved', 'rejected', 'expired', 'revoked'
  
  -- AA Provider info
  aa_provider VARCHAR(64), -- 'RBI-AA-001', 'ReportingEntityId', etc.
  financial_entity_id VARCHAR(64),
  
  -- Requested data
  data_requested JSONB, -- { "accounts": true, "transactions": true, "profile": true }
  data_frequency VARCHAR(32), -- 'one_time', 'monthly', 'real_time'
  
  -- Timestamps
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  CONSTRAINT fk_aa_consent_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_aa_consent_connection FOREIGN KEY (bank_connection_id) REFERENCES bank_connections(id) ON DELETE SET NULL,
  CONSTRAINT valid_consent_status CHECK (consent_status IN ('pending', 'approved', 'rejected', 'expired', 'revoked'))
);

CREATE INDEX idx_aa_consent_user_id ON aa_consent_logs(user_id);
CREATE INDEX idx_aa_consent_status ON aa_consent_logs(consent_status);
CREATE INDEX idx_aa_consent_provider ON aa_consent_logs(aa_provider);

-- ────────────────────────────────────────────────────────────────
-- 3. BANK ACCOUNTS SNAPSHOT
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bank_accounts (
  id BIGSERIAL PRIMARY KEY,
  bank_connection_id BIGINT NOT NULL,
  
  -- Account details
  account_number VARCHAR(32) NOT NULL,
  account_type VARCHAR(32) NOT NULL,
  account_holder_name VARCHAR(128),
  
  -- Balance & limits
  current_balance NUMERIC(16, 2),
  available_balance NUMERIC(16, 2),
  credit_limit NUMERIC(16, 2), -- For credit cards/overdraft
  
  -- Account metadata
  currency VARCHAR(3) DEFAULT 'INR',
  account_status VARCHAR(32), -- 'active', 'dormant', 'closed', 'suspended'
  ifsc_code VARCHAR(16),
  branch_code VARCHAR(16),
  
  -- Sync metadata
  last_balance_update TIMESTAMPTZ,
  data_freshness VARCHAR(32), -- 'real_time', 'end_of_day', 'delayed'
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_bank_accounts_connection FOREIGN KEY (bank_connection_id) REFERENCES bank_connections(id) ON DELETE CASCADE,
  CONSTRAINT valid_account_status CHECK (account_status IN ('active', 'dormant', 'closed', 'suspended'))
);

CREATE INDEX idx_bank_accounts_connection_id ON bank_accounts(bank_connection_id);
CREATE INDEX idx_bank_accounts_balance ON bank_accounts(current_balance);

-- ────────────────────────────────────────────────────────────────
-- 4. TRANSACTIONS (Bank Feeds + UPI)
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS financial_transactions (
  id BIGSERIAL PRIMARY KEY,
  bank_account_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  
  -- Transaction identifier
  transaction_id VARCHAR(128) UNIQUE,
  reference_number VARCHAR(128),
  
  -- Transaction type
  transaction_type VARCHAR(32) NOT NULL, -- 'debit', 'credit', 'transfer', 'upi', 'check', 'neft', 'rtgs', 'imps'
  payment_method VARCHAR(32), -- 'upi', 'card', 'bank_transfer', 'check', 'cash'
  upi_id VARCHAR(128), -- For UPI transactions
  
  -- Amount and parties
  amount NUMERIC(16, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  counterparty_name VARCHAR(128),
  counterparty_account VARCHAR(32),
  counterparty_upi_id VARCHAR(128),
  
  -- Transaction details
  description TEXT,
  narration VARCHAR(256),
  tags JSONB, -- Auto-categorized tags
  
  -- Timestamps & dates
  transaction_date DATE NOT NULL,
  value_date DATE,
  posting_date DATE,
  transaction_time TIMESTAMPTZ,
  
  -- Balance tracking
  balance_before NUMERIC(16, 2),
  balance_after NUMERIC(16, 2),
  
  -- Status
  status VARCHAR(32) DEFAULT 'completed', -- 'pending', 'completed', 'failed', 'reversed'
  
  -- Categorization
  category VARCHAR(64), -- 'salary', 'utilities', 'shopping', 'transfer', 'investment', etc.
  subcategory VARCHAR(64),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_transactions_account FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_transactions_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT valid_transaction_type CHECK (transaction_type IN ('debit', 'credit', 'transfer', 'upi', 'check', 'neft', 'rtgs', 'imps')),
  CONSTRAINT valid_transaction_status CHECK (status IN ('pending', 'completed', 'failed', 'reversed'))
);

CREATE INDEX idx_transactions_account_id ON financial_transactions(bank_account_id);
CREATE INDEX idx_transactions_user_id ON financial_transactions(user_id);
CREATE INDEX idx_transactions_date ON financial_transactions(transaction_date);
CREATE INDEX idx_transactions_category ON financial_transactions(category);
CREATE INDEX idx_transactions_type ON financial_transactions(transaction_type);
CREATE INDEX idx_transactions_upi_id ON financial_transactions(counterparty_upi_id);

-- ────────────────────────────────────────────────────────────────
-- 5. UPI TRANSACTION DETAILS
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS upi_transactions (
  id BIGSERIAL PRIMARY KEY,
  financial_transaction_id BIGINT UNIQUE,
  
  -- UPI specifics
  upi_transaction_id VARCHAR(128) UNIQUE,
  sender_upi VARCHAR(128),
  receiver_upi VARCHAR(128),
  
  -- Payment details
  rrnid VARCHAR(64), -- RRN - Retrieval Reference Number
  rrn_timestamp TIMESTAMPTZ,
  
  -- NPCI reference
  npci_reference_id VARCHAR(64),
  
  -- Merchant info (if applicable)
  is_merchant_transaction BOOLEAN DEFAULT FALSE,
  merchant_category_code VARCHAR(16),
  merchant_name VARCHAR(128),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_upi_transactions FOREIGN KEY (financial_transaction_id) REFERENCES financial_transactions(id) ON DELETE CASCADE
);

CREATE INDEX idx_upi_transactions_sender ON upi_transactions(sender_upi);
CREATE INDEX idx_upi_transactions_receiver ON upi_transactions(receiver_upi);
CREATE INDEX idx_upi_transactions_rrn ON upi_transactions(rrnid);

-- ────────────────────────────────────────────────────────────────
-- 6. INSURANCE INTEGRATION
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS insurance_policies (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  
  -- Policy identifiers
  policy_number VARCHAR(64) UNIQUE NOT NULL,
  provider_name VARCHAR(128),
  
  -- Policy type
  policy_type VARCHAR(32) NOT NULL, -- 'health', 'life', 'auto', 'property', 'travel', 'investment'
  sub_type VARCHAR(64),
  
  -- Policy details
  coverage_amount NUMERIC(16, 2),
  premium_amount NUMERIC(12, 2),
  premium_frequency VARCHAR(32), -- 'annual', 'half_yearly', 'quarterly', 'monthly'
  
  -- Important dates
  policy_start_date DATE NOT NULL,
  policy_end_date DATE NOT NULL,
  renewal_date DATE,
  last_premium_paid_date DATE,
  next_premium_due_date DATE,
  
  -- Coverage details
  coverage_details JSONB, -- { "base_cover": 5000000, "add_ons": [...] }
  exclusions JSONB,
  
  -- Status
  status VARCHAR(32) NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'lapsed', 'cancelled', 'expired'
  
  -- Claims
  total_claims_filed INT DEFAULT 0,
  total_claims_amount NUMERIC(16, 2) DEFAULT 0,
  last_claim_date DATE,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_insurance_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT valid_policy_type CHECK (policy_type IN ('health', 'life', 'auto', 'property', 'travel', 'investment')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'lapsed', 'cancelled', 'expired'))
);

CREATE INDEX idx_insurance_user_id ON insurance_policies(user_id);
CREATE INDEX idx_insurance_status ON insurance_policies(status);
CREATE INDEX idx_insurance_renewal_date ON insurance_policies(renewal_date);

-- ────────────────────────────────────────────────────────────────
-- 7. INSURANCE CLAIMS
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS insurance_claims (
  id BIGSERIAL PRIMARY KEY,
  policy_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  
  -- Claim identifiers
  claim_number VARCHAR(64) UNIQUE NOT NULL,
  
  -- Claim details
  claim_date DATE NOT NULL,
  claim_amount NUMERIC(16, 2) NOT NULL,
  claim_reason VARCHAR(256),
  
  -- Claim status
  status VARCHAR(32) NOT NULL DEFAULT 'filed', -- 'filed', 'under_review', 'approved', 'rejected', 'partially_approved', 'settled'
  
  -- Settlement
  approved_amount NUMERIC(16, 2),
  settlement_date DATE,
  settlement_amount NUMERIC(16, 2),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_claims_policy FOREIGN KEY (policy_id) REFERENCES insurance_policies(id) ON DELETE CASCADE,
  CONSTRAINT fk_claims_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT valid_claim_status CHECK (status IN ('filed', 'under_review', 'approved', 'rejected', 'partially_approved', 'settled'))
);

CREATE INDEX idx_insurance_claims_policy ON insurance_claims(policy_id);
CREATE INDEX idx_insurance_claims_user ON insurance_claims(user_id);
CREATE INDEX idx_insurance_claims_status ON insurance_claims(status);

-- ────────────────────────────────────────────────────────────────
-- 8. CREDIT PROFILE & SCORE INTEGRATION
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS credit_profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE,
  
  -- Credit score
  cibil_score INT,
  experian_score INT,
  equifax_score INT,
  latest_score INT,
  
  -- Credit score history
  score_last_updated TIMESTAMPTZ,
  score_trend VARCHAR(32), -- 'improving', 'stable', 'declining'
  
  -- Credit utilization
  total_credit_limit NUMERIC(16, 2),
  total_credit_used NUMERIC(16, 2),
  credit_utilization_ratio NUMERIC(5, 2),
  
  -- Repayment history
  on_time_payments INT DEFAULT 0,
  missed_payments INT DEFAULT 0,
  default_accounts INT DEFAULT 0,
  
  -- Active accounts
  active_credit_accounts INT DEFAULT 0,
  active_loan_accounts INT DEFAULT 0,
  
  -- Risk indicators
  has_written_off BOOLEAN DEFAULT FALSE,
  has_settled BOOLEAN DEFAULT FALSE,
  has_suit_filed BOOLEAN DEFAULT FALSE,
  
  -- Last update
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_credit_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_credit_profiles_user ON credit_profiles(user_id);
CREATE INDEX idx_credit_profiles_score ON credit_profiles(latest_score);

-- ────────────────────────────────────────────────────────────────
-- 9. LENDING OPPORTUNITIES
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lending_opportunities (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  
  -- Lender info
  lender_name VARCHAR(128),
  lender_id VARCHAR(64),
  
  -- Loan details
  loan_type VARCHAR(32) NOT NULL, -- 'personal', 'auto', 'home', 'business', 'gold'
  eligibility_amount NUMERIC(16, 2),
  eligibility_tenure INT, -- months
  interest_rate NUMERIC(5, 2),
  processing_fee NUMERIC(5, 2),
  
  -- Status
  status VARCHAR(32) DEFAULT 'eligible', -- 'eligible', 'offered', 'applied', 'approved', 'disbursed', 'expired'
  
  -- Tracking
  days_since_offer INT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  CONSTRAINT fk_lending_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT valid_loan_type CHECK (loan_type IN ('personal', 'auto', 'home', 'business', 'gold'))
);

CREATE INDEX idx_lending_user_id ON lending_opportunities(user_id);
CREATE INDEX idx_lending_status ON lending_opportunities(status);

-- ────────────────────────────────────────────────────────────────
-- 10. BANKING SYNC STATUS
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS banking_sync_status (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  
  -- Sync tracking
  last_full_sync TIMESTAMPTZ,
  last_incremental_sync TIMESTAMPTZ,
  
  -- Data freshness
  accounts_last_synced TIMESTAMPTZ,
  transactions_last_synced TIMESTAMPTZ,
  insurance_last_synced TIMESTAMPTZ,
  credit_score_last_synced TIMESTAMPTZ,
  
  -- Sync statistics
  total_transactions_synced BIGINT DEFAULT 0,
  total_accounts_synced INT DEFAULT 0,
  total_insurance_policies BIGINT DEFAULT 0,
  
  -- Status
  sync_status VARCHAR(32) DEFAULT 'idle', -- 'idle', 'syncing', 'error', 'paused'
  last_error_message TEXT,
  
  -- Configuration
  auto_sync_enabled BOOLEAN DEFAULT TRUE,
  sync_frequency VARCHAR(32) DEFAULT 'daily', -- 'hourly', 'daily', 'weekly'
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_banking_sync_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT valid_sync_status CHECK (sync_status IN ('idle', 'syncing', 'error', 'paused'))
);

CREATE INDEX idx_banking_sync_user ON banking_sync_status(user_id);

-- ────────────────────────────────────────────────────────────────
-- Grant RLS policies
-- ────────────────────────────────────────────────────────────────

ALTER TABLE bank_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE aa_consent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE upi_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lending_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE banking_sync_status ENABLE ROW LEVEL SECURITY;

-- User can only see their own data
CREATE POLICY user_sees_own_bank_connections ON bank_connections FOR SELECT USING (user_id = auth.uid());
CREATE POLICY user_sees_own_aa_consents ON aa_consent_logs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY user_sees_own_accounts ON bank_accounts FOR SELECT USING (
  EXISTS (SELECT 1 FROM bank_connections WHERE id = bank_connection_id AND user_id = auth.uid())
);
CREATE POLICY user_sees_own_transactions ON financial_transactions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY user_sees_own_insurance ON insurance_policies FOR SELECT USING (user_id = auth.uid());
CREATE POLICY user_sees_own_insurance_claims ON insurance_claims FOR SELECT USING (user_id = auth.uid());
CREATE POLICY user_sees_own_credit ON credit_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY user_sees_own_lending ON lending_opportunities FOR SELECT USING (user_id = auth.uid());
CREATE POLICY user_sees_own_sync_status ON banking_sync_status FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own data
CREATE POLICY user_insert_bank_connections ON bank_connections FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY user_insert_aa_consents ON aa_consent_logs FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY user_insert_insurance ON insurance_policies FOR INSERT WITH CHECK (user_id = auth.uid());
