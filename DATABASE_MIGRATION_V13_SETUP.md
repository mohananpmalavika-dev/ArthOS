# Database Migration Setup Instructions

## Quick Start

The following SQL migration needs to be applied to your Supabase database to enable full database persistence for user input data:

### Option 1: Use Supabase SQL Editor (Easiest)

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project (gqjlfejmhrmdbmtvnais)
3. Click "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy-paste the contents of `migrations/V13__user_input_data_persistence.sql`
6. Click "Run" (or Ctrl+Enter)
7. Verify: You should see 4 new tables in the Schema Editor:
   - user_drafts
   - user_decisions
   - user_telemetry
   - user_preferences

### Option 2: Use Command Line

If you have psql installed and a DATABASE_URL:

```bash
# Set DATABASE_URL environment variable
export DATABASE_URL="postgresql://[username]:[password]@db.[project-ref].supabase.co:5432/postgres"

# Run migrations
npm run migrate
```

You can find your PostgreSQL connection string in:
Supabase Dashboard → Settings → Database → Connection string → Postgres

### Option 3: Use Node.js Script (with psql)

If you have the DATABASE_URL set in .env:

```bash
npm run db:migrate
```

## Migration Contents (V13)

The migration creates 4 tables for user input data persistence:

### user_drafts
- Stores assessment draft data (auto-save)
- Columns: id, user_id, assessment_type, draft_data (JSONB), created_at, updated_at
- Indexes: on user_id, (user_id, assessment_type)

### user_decisions
- Stores user decisions and outcomes
- Columns: id, user_id, decision_id, decision_type, decision_data (JSONB), outcome_data (JSONB), created_at
- Indexes: on user_id, (user_id, created_at DESC)

### user_telemetry
- Stores user engagement events
- Columns: id, user_id, session_id, event_type, event_data (JSONB), timestamp
- Indexes: on user_id, event_type, (user_id, timestamp DESC)

### user_preferences
- Stores user preferences and settings
- Columns: id, user_id, preference_key, preference_value (JSONB), created_at, updated_at
- Unique constraint: (user_id, preference_key)
- Indexes: on user_id, (user_id, preference_key)

## After Migration

Once the tables are created:

1. ✅ All 4 API endpoints are ready to use:
   - POST /api/user/saveDraft
   - GET /api/user/loadDraft
   - POST /api/user/saveDecision
   - POST /api/user/saveTelemetry
   - POST /api/user/savePreference

2. ✅ React hooks are ready:
   - useAssessmentDraft()
   - useUserDecisions()
   - useTelemetry()
   - useUserPreferences()

3. 📝 Next step: Update components to use database instead of localStorage
   - See LOCALSTORAGE_TO_DATABASE_MIGRATION_GUIDE.md for detailed instructions

## Troubleshooting

### Tables not appearing after migration

1. Check if migration script errors:
   - Look at browser console or terminal output
   - Check for SQL syntax errors

2. Verify tables in Supabase:
   - Go to Schema Editor
   - Check "public" schema
   - Look for user_drafts, user_decisions, etc.

3. If tables don't exist:
   - Copy SQL from V13__user_input_data_persistence.sql
   - Paste directly into Supabase SQL Editor
   - Run manually

### RLS (Row Level Security) not working

If you see errors like "new row violates row-level security policy":

1. Go to Supabase Dashboard → Authentication → Users
2. Select a user and note their UUID
3. In SQL Editor, verify the user exists:
   ```sql
   SELECT id, email FROM users WHERE id = '[user-uuid]';
   ```

4. If user doesn't exist, they need to register first via the app

### Foreign key constraint errors

If you see "relation 'users' does not exist":

1. Make sure V3__add_users_table.sql has been applied first
2. Check that users table has the id column as VARCHAR(255)

## SQL to Verify Migration

After running the migration, check that tables exist:

```sql
-- List all new tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'user_%'
ORDER BY table_name;

-- Expected output:
-- user_decisions
-- user_drafts
-- user_preferences
-- user_telemetry

-- Check user_drafts structure
\d user_drafts;

-- Insert test data
INSERT INTO user_drafts (user_id, assessment_type, draft_data)
VALUES ('test-user-123', 'v2', '{"step": 1, "answers": {}}');

-- Query test data
SELECT * FROM user_drafts WHERE user_id = 'test-user-123';
```

## Environment Variables

Make sure .env has:

```env
SUPABASE_URL=https://gqjlfejmhrmdbmtvnais.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=[your-jwt-secret-from-auth-config]
```

## Next Steps

1. ✅ Apply migration (this page)
2. 📝 Update components to use database hooks
3. 🧪 Test data persistence across sessions
4. 🚀 Deploy to production
