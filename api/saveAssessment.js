// api/saveAssessment.js
// Serverless handler to persist assessment submissions to Supabase

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TABLE_NAME = process.env.SUPABASE_ASSESSMENTS_TABLE || "assessments";

function createSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Missing Supabase environment variables. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const payload = req.body;
    if (!payload || !payload.assessment || !payload.result) {
      return res.status(400).json({ error: "Incomplete payload" });
    }

    const client = createSupabaseClient();
    const assessmentRecord = {
      assessment: payload.assessment,
      result: payload.result,
      participant_name: payload.assessment.participant?.name || null,
      participant_age: payload.assessment.participant?.age || null,
      participant_email: payload.assessment.participant?.email || null,
      created_at: new Date().toISOString(),
    };

    const { error } = await client.from(TABLE_NAME).insert([assessmentRecord]);
    if (error) {
      console.error("[SaveAssessment] Supabase insert error:", error.message);
      return res.status(500).json({ status: "error", reason: "db_insert_failed" });
    }

    return res.status(200).json({ status: "saved" });
  } catch (error) {
    console.error("[SaveAssessment] handler error:", error?.message || error);
    return res.status(500).json({ status: "error", reason: "internal_error" });
  }
}
