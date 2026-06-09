// api/telemetry.js
// Serverless handler for anonymous financial telemetry data
// Deploy to Vercel or similar serverless platform

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TELEMETRY_TABLE = process.env.SUPABASE_TELEMETRY_TABLE || "anonymous_telemetry";

function createSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

export default async function handler(req, res) {
  // Enforce POST-only access
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const payload = req.body;

    // Structural validation
    if (!payload.scores || !payload.telemetry_metadata) {
      return res.status(400).json({ error: "Incomplete payload telemetry data structure" });
    }

    // Build clean telemetry row (privacy-first: no PII, no precise timestamps)
    const cleanTelemetryRow = {
      schema_version: String(payload.telemetry_metadata.schema_version),
      mode_executed: String(payload.telemetry_metadata.mode_executed),

      // Normalized Framework Component Scores
      health_score: Number(payload.scores.financial_health_score),
      behaviour_score: Number(payload.scores.behaviour_score),
      awareness_score: Number(payload.scores.awareness_score),
      stability_score: Number(payload.scores.stability_score),
      habits_score: Number(payload.scores.habits_score),

      // Diagnostic Behavioral Categorizations
      personality_type: String(payload.predictive_analytics.personality_type),
      future_risk_label: String(payload.predictive_analytics.future_risk_label),
      future_risk_score: Number(payload.predictive_analytics.future_risk_score),
      awareness_gap_months: Number(payload.predictive_analytics.awareness_gap_months),

      // Survival Buffer Calculations
      nominal_survival_months: Number(payload.runway_metrics.nominal_survival_months),
      crisis_survival_months: Number(payload.runway_metrics.crisis_optimized_survival_months),
      perceived_survival_months: Number(payload.runway_metrics.perceived_survival_months),

      // Financial Operational Ratios
      savings_rate_proxied: Number(payload.financial_ratios.savings_rate_proxied),
      debt_to_income_months: Number(payload.financial_ratios.debt_to_income_months),
      fixed_liability_pressure: Number(payload.financial_ratios.fixed_liability_pressure),

      lowest_driver: String(payload.lowest_performing_driver),

      // Truncate timestamp to date-only format (no individual activity signatures)
      created_at: new Date().toISOString().split("T")[0],
    };

    const supabase = createSupabaseClient();
    if (supabase) {
      const { error } = await supabase.from(TELEMETRY_TABLE).insert([cleanTelemetryRow]);
      if (error) {
        console.error("[Telemetry] Supabase insert error:", error.message);
        return res.status(500).json({ status: "error", reason: "db_insert_failed" });
      }
    } else {
      console.log("[Telemetry] Supabase not configured; fallback logging only.");
    }

    console.log("[Telemetry] Received anonymous financial health snapshot:", cleanTelemetryRow);

    // Respond instantly with non-identifying status
    return res.status(200).json({ status: "success", recorded: true });
  } catch (error) {
    console.error("[Telemetry] Storage ingestion error:", error?.message);

    // Fail gracefully to never interrupt user experience
    return res.status(500).json({ status: "deferred", reason: "Internal Processing Queue" });
  }
}
