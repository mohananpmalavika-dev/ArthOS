// api/feedback.js
// Serverless handler for post-assessment validation feedback
// Captures user perception of assessment value and decision drivers

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FEEDBACK_TABLE = process.env.SUPABASE_FEEDBACK_TABLE || "tester_feedback";

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

    const supabase = createSupabaseClient();
    if (supabase) {
      const { error } = await supabase.from(FEEDBACK_TABLE).insert([cleanFeedback]);
      if (error) {
        console.error("[Feedback] Supabase insert error:", error.message);
        return res.status(500).json({ status: "error", reason: "db_insert_failed" });
      }
    } else {
      console.log("[Feedback] Supabase not configured; fallback logging only.");
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
