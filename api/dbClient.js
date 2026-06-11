import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DATABASE_URL = process.env.DATABASE_URL;
const PG_SSL = process.env.PG_SSL === "true";

const ALLOWED_TABLES = [
  "assessments",
  "anonymous_telemetry",
  "tester_feedback",
  // Blueprint longitudinal tables
  "decision_history",
  "user_scores_history",
  "weekly_checkins",
  "goal_history",
  "financial_memory",
  "twin_snapshots",
];

let pgPool;

function normalizeValue(value) {
  if (value === undefined) return null;
  if (value === null) return null;
  if (Array.isArray(value)) return JSON.stringify(value);
  if (typeof value === "object") return JSON.stringify(value);
  return value;
}

function createSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

function getPgPool() {
  if (!DATABASE_URL) return null;
  if (!pgPool) {
    pgPool = new pg.Pool({
      connectionString: DATABASE_URL,
      ssl: PG_SSL ? { rejectUnauthorized: false } : false,
    });
  }
  return pgPool;
}

export function hasDatabaseConfig() {
  return Boolean(DATABASE_URL || (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY));
}

export async function fetchDecisionsForUser(userId) {
  if (!userId) return [];

  if (DATABASE_URL) {
    const pool = getPgPool();
    if (!pool) {
      throw new Error("PostgreSQL pool could not be initialized.");
    }

    const sql = `SELECT decision FROM "decision_history" WHERE user_id = $1 ORDER BY recorded_at ASC`;
    const { rows } = await pool.query(sql, [userId]);
    return rows.map((row) => row.decision || {});
  }

  const supabase = createSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("decision_history")
      .select("decision")
      .eq("user_id", userId)
      .order("recorded_at", { ascending: true });

    if (error) {
      throw error;
    }

    return (data || []).map((entry) => entry.decision || {});
  }

  throw new Error("No database configuration found. Set DATABASE_URL or SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY.");
}

export async function insertIntoTable(tableName, row) {
  if (!ALLOWED_TABLES.includes(tableName)) {
    throw new Error(`Invalid table name: ${tableName}`);
  }

  if (DATABASE_URL) {
    const pool = getPgPool();
    if (!pool) {
      throw new Error("PostgreSQL pool could not be initialized.");
    }

    const keys = Object.keys(row);
    const columns = keys.map((key) => `"${key}"`).join(", ");
    const placeholders = keys.map((_, index) => `$${index + 1}`).join(", ");
    const values = keys.map((key) => normalizeValue(row[key]));

    const sql = `INSERT INTO "${tableName}" (${columns}) VALUES (${placeholders}) RETURNING *`;
    const { rows } = await pool.query(sql, values);
    return { data: rows, error: null };
  }

  const supabase = createSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase.from(tableName).insert([row]);
    return { data, error };
  }

  throw new Error("No database configuration found. Set DATABASE_URL or SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY.");
}
