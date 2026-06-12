-- Add user_id support to assessments table for user-specific data persistence
-- This enables tracking assessments per authenticated user

-- Step 1: Add user_id column to assessments table (if not exists)
-- Also migrate from BIGINT to UUID if it was created with wrong type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assessments' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE assessments ADD COLUMN user_id UUID;
  ELSE
    -- If column exists as BIGINT, convert it to UUID
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'assessments' AND column_name = 'user_id' AND data_type = 'bigint'
    ) THEN
      -- Drop dependent objects first
      BEGIN
        DROP POLICY IF EXISTS "users_manage_own_assessments" ON assessments;
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
      
      -- Drop all foreign key constraints on user_id
      BEGIN
        ALTER TABLE assessments DROP CONSTRAINT fk_assessments_users;
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
      
      BEGIN
        ALTER TABLE assessments DROP CONSTRAINT assessments_user_id_fkey;
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
      
      -- Convert the column
      ALTER TABLE assessments ALTER COLUMN user_id TYPE UUID USING NULL;
    END IF;
  END IF;
END $$;

-- Step 2: Create index on user_id for fast lookups
-- (Foreign key constraint removed - auth.uid() returns UUID, users table may have different ID type)

-- Step 3: Create index for fast user lookups (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'assessments' AND indexname = 'idx_assessments_user_id'
  ) THEN
    CREATE INDEX idx_assessments_user_id ON assessments(user_id);
  END IF;
END $$;

-- Step 4: Add user_id to anonymous_telemetry (if not exists)
-- Also migrate from BIGINT to UUID if it was created with wrong type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'anonymous_telemetry' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE anonymous_telemetry ADD COLUMN user_id UUID;
  ELSE
    -- If column exists as BIGINT, convert it to UUID
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'anonymous_telemetry' AND column_name = 'user_id' AND data_type = 'bigint'
    ) THEN
      ALTER TABLE anonymous_telemetry ALTER COLUMN user_id TYPE UUID USING NULL;
    END IF;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'anonymous_telemetry' AND column_name = 'is_authenticated'
  ) THEN
    ALTER TABLE anonymous_telemetry ADD COLUMN is_authenticated BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Step 5: Create composite index for user telemetry lookups (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'anonymous_telemetry' AND indexname = 'idx_telemetry_user_id_created_at'
  ) THEN
    CREATE INDEX idx_telemetry_user_id_created_at ON anonymous_telemetry(user_id, created_at)
    WHERE user_id IS NOT NULL;
  END IF;
END $$;

-- Step 6: Add user_id to tester_feedback (if not exists)
-- Also migrate from BIGINT to UUID if it was created with wrong type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tester_feedback' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE tester_feedback ADD COLUMN user_id UUID;
  ELSE
    -- If column exists as BIGINT, convert it to UUID
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'tester_feedback' AND column_name = 'user_id' AND data_type = 'bigint'
    ) THEN
      ALTER TABLE tester_feedback ALTER COLUMN user_id TYPE UUID USING NULL;
    END IF;
  END IF;
END $$;

-- Step 7: Create index for user feedback lookups (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'tester_feedback' AND indexname = 'idx_tester_feedback_user_id'
  ) THEN
    CREATE INDEX idx_tester_feedback_user_id ON tester_feedback(user_id);
  END IF;
END $$;

-- Step 8: Enable RLS and create policies (idempotent)
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

-- Create or replace RLS policies
DO $$
BEGIN
  -- Drop existing policy if it exists to avoid conflicts
  BEGIN
    DROP POLICY IF EXISTS "users_manage_own_assessments" ON assessments;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  -- Create the updated policy - allow if user_id matches current user or is NULL (anonymous)
  CREATE POLICY "users_manage_own_assessments" ON assessments
  FOR ALL
  USING (user_id IS NULL OR user_id = auth.uid());
END $$;
