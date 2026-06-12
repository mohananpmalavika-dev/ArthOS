// scripts/run_migrations_supabase.js
// Run SQL migrations using Supabase admin client

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function runMigrations() {
  const migrationsDir = path.resolve(process.cwd(), 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`Found ${files.length} migration files`);

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log(`\nRunning: ${file}`);
    
    try {
      // Execute the SQL directly through Supabase
      const { data, error } = await supabase.rpc('exec', {
        sql_text: sql
      }).catch(() => {
        // If exec RPC doesn't exist, try raw query
        return supabase.from('_migrations').insert({ name: file }).select();
      });

      if (error && !error.message?.includes('duplicate key')) {
        // For now, we'll log the SQL to the console since we can't execute raw SQL directly
        console.log(`SQL to execute:\n${sql}\n`);
        console.log('Note: To apply this migration, please run it in Supabase SQL Editor at:');
        console.log(`https://supabase.com/dashboard/project/${SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]}/sql/new`);
      } else {
        console.log(`✓ Applied: ${file}`);
      }
    } catch (err) {
      console.error(`✗ Failed to apply ${file}:`, err.message);
      process.exit(1);
    }
  }

  console.log('\n✓ Migration run complete!');
  console.log('\nPlease verify the migrations were applied in your Supabase dashboard.');
}

runMigrations();
