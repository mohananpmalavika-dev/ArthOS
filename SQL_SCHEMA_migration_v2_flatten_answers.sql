-- Migration v2: Flatten survey Q&A into separate columns for easier querying
-- Run this in your Supabase SQL Editor after running SQL_SCHEMA.sql
-- This adds columns for all behaviour, awareness, habits, and profile answers

-- Add behaviour question columns
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS behaviour_emotionalMoneyLevel VARCHAR(32);
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS behaviour_socialInfluenceLevel VARCHAR(32);
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS behaviour_unplannedPurchaseFreq VARCHAR(32);
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS behaviour_regretImpulseFreq VARCHAR(32);
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS behaviour_presentFutureMindset VARCHAR(32);
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS behaviour_avoidBalanceDuringStress VARCHAR(32);
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS behaviour_spendWhenBored VARCHAR(32);
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS behaviour_spendWhenStressed VARCHAR(32);
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS behaviour_plannedPurchasesOnly VARCHAR(32);
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS behaviour_cashflowAwareness VARCHAR(32);
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS behaviour_subscriptionControl VARCHAR(32);
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS behaviour_impulseWaitRule VARCHAR(32);

-- Add awareness question columns
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS awareness_comparesLifestyleFreq VARCHAR(32);
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS awareness_hasFinancialPlan VARCHAR(32);
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS awareness_tracksExpenses VARCHAR(32);
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS awareness_knowsTotalDebt VARCHAR(32);
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS awareness_knowsMonthlyExpenses VARCHAR(32);
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS awareness_tracksSavingsRate VARCHAR(32);
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS awareness_budgetCycle VARCHAR(32);
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS awareness_knowsTop3Expenses VARCHAR(32);

-- Add habits question columns
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS habits_habitCheckInsPerWeek VARCHAR(32);
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS habits_debtPaymentDiscipline VARCHAR(32);

-- Add profile/financial input columns
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS profile_monthlyExpenses NUMERIC(12, 2);
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS profile_monthlyIncome NUMERIC(12, 2);
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS profile_totalDebt NUMERIC(12, 2);
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS profile_emergencySavingsFixed NUMERIC(12, 2);
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS profile_emergencySavingsDiscretionary NUMERIC(12, 2);
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS profile_monthlyLiabilities NUMERIC(12, 2);
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS profile_incomeStability VARCHAR(32);
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS profile_dependentsBucket VARCHAR(32);
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS profile_debtRepaymentRatePctOfIncome NUMERIC(5, 2);
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS profile_averageInterestRatePct NUMERIC(5, 2);

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_assessments_participant_name ON assessments(participant_name);
CREATE INDEX IF NOT EXISTS idx_assessments_behaviour_emotionalMoneyLevel ON assessments(behaviour_emotionalMoneyLevel);
CREATE INDEX IF NOT EXISTS idx_assessments_awareness_tracksExpenses ON assessments(awareness_tracksExpenses);
CREATE INDEX IF NOT EXISTS idx_assessments_profile_monthlyIncome ON assessments(profile_monthlyIncome);
