// api_src/user/assessment-[id].js
// Endpoint to retrieve a specific assessment by ID (user-owned only)
// GET /api/user/assessment/:id - Returns assessment if user is owner

import { query } from "../dbClient.js";
import jwt from "jsonwebtoken";

const TABLE_NAME = process.env.SUPABASE_ASSESSMENTS_TABLE || "assessments";
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

function extractUserFromToken(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
    return {
      id: decoded.userId || decoded.id || decoded.email || null,
      email: decoded.email || null,
    };
  } catch (error) {
    console.warn("[UserAssessmentDetail] Invalid or missing token:", error.message);
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Extract authenticated user from JWT token
    const user = extractUserFromToken(req);

    if (!user || !user.id) {
      return res.status(401).json({ error: "Unauthorized - No valid token" });
    }

    // Get assessment ID from URL (format: /api/user/assessment-[id])
    const assessmentId = req.query.id || req.path?.split('/').pop();

    if (!assessmentId) {
      return res.status(400).json({ error: "Assessment ID is required" });
    }

    console.log(`[UserAssessmentDetail] Retrieving assessment ${assessmentId} for user: ${user.id}`);

    // Query assessment, ensuring it belongs to the current user
    try {
      const rows = await query(
        `SELECT 
          id,
          assessment,
          result,
          participant_name,
          participant_age,
          participant_email,
          created_at,
          user_id
         FROM ${TABLE_NAME}
         WHERE id = $1 AND user_id = $2`,
        [assessmentId, user.id]
      );

      if (!rows || rows.length === 0) {
        return res.status(404).json({ error: "Assessment not found or access denied" });
      }

      return res.status(200).json({
        status: "success",
        data: rows[0],
      });
    } catch (queryError) {
      console.error("[UserAssessmentDetail] DB query error:", queryError.message || queryError);
      return res.status(500).json({ status: "error", reason: "db_query_failed" });
    }
  } catch (error) {
    console.error("[UserAssessmentDetail] handler error:", error?.message || error);
    return res.status(500).json({ status: "error", reason: "internal_error" });
  }
}
