// api_src/user/assessments.js
// Endpoint to retrieve authenticated user's assessments
// GET /api/user/assessments - Returns all assessments for the authenticated user

import { query } from "../dbClient.js";
import { extractUserFromRequest } from "../auth/jwt.js";

const TABLE_NAME = process.env.SUPABASE_ASSESSMENTS_TABLE || "assessments";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Extract authenticated user from JWT token
    const user = await extractUserFromRequest(req);

    if (!user || !user.id) {
      return res.status(401).json({ error: "Unauthorized - No valid token" });
    }

    console.log(`[UserAssessments] Retrieving assessments for user: ${user.id}`);

    // Query assessments for this user, ordered by most recent first
    let rows = [];
    try {
      rows = await query(
        `SELECT 
          id,
          assessment,
          result,
          participant_name,
          participant_age,
          participant_email,
          created_at
         FROM ${TABLE_NAME}
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [user.id]
      );
    } catch (queryError) {
      console.error("[UserAssessments] DB query error:", queryError.message || queryError);
      return res.status(500).json({ status: "error", reason: "db_query_failed" });
    }

    return res.status(200).json({
      status: "success",
      data: rows || []
    });
  } catch (error) {
    console.error("[UserAssessments] handler error:", error?.message || error);
    return res.status(500).json({ status: "error", reason: "internal_error" });
  }
}
