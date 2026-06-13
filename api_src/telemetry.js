// api/telemetry.js
// Serverless handler for anonymous financial telemetry data
// Deploy to Vercel or similar serverless platform
// Now optionally associates telemetry with authenticated users via JWT

import { insertIntoTable, hasDatabaseConfig } from "./dbClient.js";
import { extractUserFromRequest } from "./auth/jwt.js";

const TELEMETRY_TABLE = process.env.SUPABASE_TELEMETRY_TABLE || "anonymous_telemetry";

export default async function handler(req, res) {
  // Enforce POST-only access
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const payload = req.body;

    // Extract authenticated user from JWT token (optional)
    const user = await extractUserFromRequest(req);
    if (user) {
      console.log("[Telemetry] Authenticated user:", user.id);
    }

    // Structural validation
    if (!payload.scores || !payload.telemetry_metadata) {
      return res.status(400).json({ error: "Incomplete payload telemetry data structure" });
    }

    // Build clean telemetry row (privacy-first: no PII, no precise timestamps)
    const cleanTelemetryRow = {
      schema_version: String(payload.telemetry_metadata.schema_version),
      mode_executed: String(payload.telemetry_metadata.mode_executed),
      user_id: user?.id || null,  // Associate with user if authenticated
      is_authenticated: !!user,

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

    if (hasDatabaseConfig()) {
      const { error } = await insertIntoTable(TELEMETRY_TABLE, cleanTelemetryRow);
      if (error) {
        console.error("[Telemetry] DB insert error:", error.message || error);
        return res.status(500).json({ status: "error", reason: "db_insert_failed" });
      }
    } else {
      console.log("[Telemetry] No database configured; fallback logging only.");
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
