// api/feedback.js
// Serverless handler for post-assessment validation feedback
// Captures user perception of assessment value and decision drivers

import { insertIntoTable, hasDatabaseConfig } from "./dbClient.js";

const FEEDBACK_TABLE = process.env.SUPABASE_FEEDBACK_TABLE || "tester_feedback";

export default async function handler(req, res) {
  // Enforce POST-only access
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const payload = req.body;

    // Structural validation
    if (!payload.score_context || !payload.primary_value_driver) {
      return res.status(400).json({ error: "Incomplete feedback payload structure" });
    }

    // Build clean feedback row (no PII, no identifying information)
    const cleanFeedback = {
      health_score: Number(payload.score_context.health_score),
      primary_driver: String(payload.primary_value_driver),
      feedback_text: String(payload.user_feedback_notes || "").substring(0, 1000),
      created_at: new Date().toISOString().split("T")[0],
    };

    if (hasDatabaseConfig()) {
      const { error } = await insertIntoTable(FEEDBACK_TABLE, cleanFeedback);
      if (error) {
        console.error("[Feedback] DB insert error:", error.message || error);
        return res.status(500).json({ status: "error", reason: "db_insert_failed" });
      }
    } else {
      console.log("[Feedback] No database configured; fallback logging only.");
    }

    console.log(
      "[Feedback] Recorded assessment validation response:",
      cleanFeedback.primary_driver,
      `(health_score: ${cleanFeedback.health_score})`
    );

    // Respond instantly with non-identifying status
    return res.status(200).json({ status: "success", recorded: true });
  } catch (error) {
    console.error("[Feedback] Collection error:", error?.message);

    // Fail gracefully to never interrupt user experience
    return res.status(500).json({ status: "deferred", reason: "Internal Processing Queue" });
  }
}
