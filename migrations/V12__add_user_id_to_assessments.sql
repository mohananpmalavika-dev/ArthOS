-- Add user_id support to assessments table for user-specific data persistence
-- This enables tracking assessments per authenticated user

-- Step 1: Add user_id column to assessments table
ALTER TABLE assessments
ADD COLUMN user_id VARCHAR(255);

-- Step 2: Create foreign key relationship to users table
ALTER TABLE assessments
ADD CONSTRAINT fk_assessments_users
FOREIGN KEY (user_id) REFERENCES users(id)
ON DELETE CASCADE;

-- Step 3: Create index for fast user lookups
CREATE INDEX idx_assessments_user_id ON assessments(user_id);

-- Step 4: Add user_id to anonymous_telemetry for optional tracking
-- (NULL by default for anonymous submissions, optional for authenticated users)
ALTER TABLE anonymous_telemetry
ADD COLUMN user_id VARCHAR(255),
ADD COLUMN is_authenticated BOOLEAN DEFAULT FALSE;

-- Step 5: Create composite index for user telemetry lookups
CREATE INDEX idx_telemetry_user_id_created_at ON anonymous_telemetry(user_id, created_at)
WHERE user_id IS NOT NULL;

-- Step 6: Add user_id to tester_feedback
ALTER TABLE tester_feedback
ADD COLUMN user_id VARCHAR(255);

-- Step 7: Create index for user feedback lookups
CREATE INDEX idx_tester_feedback_user_id ON tester_feedback(user_id);

-- Step 8: Update RLS policies to support user-specific queries
ALTER POLICY "allow_telemetry_collection" ON anonymous_telemetry
USING (true);

-- New policy for authenticated users to read their own telemetry (if needed later)
CREATE POLICY "users_read_own_telemetry" ON anonymous_telemetry
FOR SELECT
USING (auth.uid()::text = user_id OR user_id IS NULL);

-- Update assessments table RLS if it needs it
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_assessments" ON assessments
FOR ALL
USING (auth.uid()::text = user_id OR user_id IS NULL);
