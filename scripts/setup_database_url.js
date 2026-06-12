// scripts/setup_database_url.js
// Helper script to construct DATABASE_URL from Supabase credentials

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');

const SUPABASE_URL = process.env.SUPABASE_URL;

if (!SUPABASE_URL) {
  console.error('SUPABASE_URL not found in .env');
  process.exit(1);
}

// Supabase PostgreSQL connection URL format:
// DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require

// Extract project info from Supabase URL
// URL format: https://[project-ref].supabase.co
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('Could not extract project reference from SUPABASE_URL');
  process.exit(1);
}

// For Supabase, the DATABASE_URL should be:
// postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres?sslmode=require
// But we can also use the Supabase-provided connection string

// Default Supabase connection (requires finding the password)
// For now, let's provide instructions:

console.log(`
To set up DATABASE_URL for migrations, add this to your .env file:

DATABASE_URL=postgresql://postgres:[your-password]@db.${projectRef}.supabase.co:5432/postgres?sslmode=require

You can find the password in your Supabase dashboard:
1. Go to https://supabase.com/dashboard/project/${projectRef}
2. Click "Settings" → "Database"
3. Look for "Connection string" or the postgres password
4. Replace [your-password] with the actual password

Alternatively, if you have the connection string from Supabase, paste it directly as DATABASE_URL.
`);
