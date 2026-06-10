// api/saveAssessment.js
// Serverless handler to persist assessment submissions to Supabase or local PostgreSQL

import { insertIntoTable } from "./dbClient.js";

const TABLE_NAME = process.env.SUPABASE_ASSESSMENTS_TABLE || "assessments";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const payload = req.body;
    if (!payload || !payload.assessment || !payload.result) {
      return res.status(400).json({ error: "Incomplete payload" });
    }

    const assessmentRecord = {
      assessment: payload.assessment,
      result: payload.result,
      participant_name: payload.assessment.participant?.name || null,
      participant_age: payload.assessment.participant?.age || null,
      participant_email: payload.assessment.participant?.email || null,
      created_at: new Date().toISOString(),
    };

    const { error } = await insertIntoTable(TABLE_NAME, assessmentRecord);
    if (error) {
      console.error("[SaveAssessment] DB insert error:", error.message || error);
      return res.status(500).json({ status: "error", reason: "db_insert_failed" });
    }

    return res.status(200).json({ status: "saved" });
  } catch (error) {
    console.error("[SaveAssessment] handler error:", error?.message || error);
    return res.status(500).json({ status: "error", reason: "internal_error" });
  }
}
