-- Create assessments table for storing financial assessments
CREATE TABLE IF NOT EXISTS assessments (
  id BIGSERIAL PRIMARY KEY,
  assessment JSONB NOT NULL,
  result JSONB NOT NULL,
  schema_version VARCHAR(20),
  result_schema_version VARCHAR(20),
  user_id VARCHAR(255),
  participant_name VARCHAR(255),
  participant_age VARCHAR(10),
  participant_email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Flattened behaviour columns
  behaviour_emotionalMoneyLevel VARCHAR(50),
  behaviour_socialInfluenceLevel VARCHAR(50),
  behaviour_unplannedPurchaseFreq VARCHAR(50),
  behaviour_regretImpulseFreq VARCHAR(50),
  behaviour_presentFutureMindset VARCHAR(50),
  behaviour_avoidBalanceDuringStress VARCHAR(50),
  behaviour_spendWhenBored VARCHAR(50),
  behaviour_spendWhenStressed VARCHAR(50),
  behaviour_plannedPurchasesOnly VARCHAR(50),
  behaviour_cashflowAwareness VARCHAR(50),
  behaviour_subscriptionControl VARCHAR(50),
  behaviour_impulseWaitRule VARCHAR(50),

  -- Flattened awareness columns
  awareness_comparesLifestyleFreq VARCHAR(50),
  awareness_hasFinancialPlan VARCHAR(50),
  awareness_tracksExpenses VARCHAR(50),
  awareness_knowsTotalDebt VARCHAR(50),
  awareness_knowsMonthlyExpenses VARCHAR(50),
  awareness_tracksSavingsRate VARCHAR(50),
  awareness_budgetCycle VARCHAR(50),
  awareness_knowsTop3Expenses VARCHAR(50),

  -- Flattened habits columns
  habits_habitCheckInsPerWeek VARCHAR(10),
  habits_debtPaymentDiscipline VARCHAR(50),

  -- Flattened profile columns
  profile_monthlyExpenses NUMERIC,
  profile_monthlyIncome NUMERIC,
  profile_totalDebt NUMERIC,
  profile_emergencySavingsFixed NUMERIC,
  profile_emergencySavingsDiscretionary NUMERIC,
  profile_monthlyLiabilities NUMERIC,
  profile_incomeStability VARCHAR(50),
  profile_dependentsBucket VARCHAR(20),
  profile_debtRepaymentRatePctOfIncome NUMERIC,
  profile_averageInterestRatePct NUMERIC,

  CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_created_at ON assessments(created_at);
CREATE INDEX IF NOT EXISTS idx_assessments_participant_email ON assessments(participant_email);
