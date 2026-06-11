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
