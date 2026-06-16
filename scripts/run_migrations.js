#!/usr/bin/env node
/**
 * Run SQL migrations found in db/migrations using DATABASE_URL (Postgres)
 *
 * Usage:
 *   DATABASE_URL="postgres://..." node scripts/run_migrations.js
 */
import fs from 'fs';
import path from 'path';
import pg from 'pg';

const MIGRATIONS_DIR = path.resolve(process.cwd(), 'db', 'migrations');
const DATABASE_URL = process.env.DATABASE_URL;

async function run() {
  if (!DATABASE_URL) {
    console.error('DATABASE_URL is not set. Cannot run migrations.');
    process.exit(2);
  }

  const files = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort();
  if (!files.length) {
    console.log('No migration files found in', MIGRATIONS_DIR);
    return;
  }

  const pool = new pg.Pool({ connectionString: DATABASE_URL });

  try {
    for (const file of files) {
      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      console.log(`Applying migration: ${file}`);
      try {
        await pool.query(sql);
        console.log(`✓ Applied ${file}`);
      } catch (err) {
        console.error(`Failed to apply ${file}:`, err.message || err);
        throw err;
      }
    }
    console.log('All migrations applied successfully');
  } finally {
    await pool.end();
  }
}

run().catch(err => {
  console.error('Migration runner failed:', err.message || err);
  process.exit(1);
});
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

async function run() {
  if (!DATABASE_URL) {
    console.log('No DATABASE_URL provided. Fill .env with DATABASE_URL to run migrations.');
    process.exit(0);
  }

  const pool = new pg.Pool({ connectionString: DATABASE_URL, ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : false });
  const migrationsDir = path.resolve(process.cwd(), 'migrations');
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log('Running', file);
    try {
      await pool.query(sql);
      console.log('Applied', file);
    } catch (err) {
      console.error('Failed', file, err.message || err);
      await pool.end();
      process.exit(1);
    }
  }

  await pool.end();
  console.log('Migrations complete');
}

run();
