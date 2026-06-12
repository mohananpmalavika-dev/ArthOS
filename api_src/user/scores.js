// api_src/user/scores.js
// Endpoint to retrieve authenticated user's score history
// GET /api/user/scores - Returns score progression for the user

import { queryDatabase } from "../dbClient.js";
import jwt from "jsonwebtoken";

const TELEMETRY_TABLE = process.env.SUPABASE_TELEMETRY_TABLE || "anonymous_telemetry";
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
    console.warn("[UserScores] Invalid or missing token:", error.message);
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

    // Parse pagination params
    const limit = Math.min(parseInt(req.query.limit || "50", 10), 100);
    const offset = parseInt(req.query.offset || "0", 10);

    console.log(`[UserScores] Retrieving score history for user: ${user.id}`);

    // Query user's telemetry scores, ordered by most recent first
    const { rows, error } = await queryDatabase(
      `SELECT 
        id,
        health_score,
        behaviour_score,
        awareness_score,
        stability_score,
        habits_score,
        personality_type,
        future_risk_label,
        future_risk_score,
        awareness_gap_months,
        nominal_survival_months,
        crisis_survival_months,
        created_at
       FROM ${TELEMETRY_TABLE}
       WHERE user_id = $1 AND is_authenticated = true
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [user.id, limit, offset]
    );

    if (error) {
      console.error("[UserScores] DB query error:", error.message || error);
      return res.status(500).json({ status: "error", reason: "db_query_failed" });
    }

    // Get total count for pagination
    const countResult = await queryDatabase(
      `SELECT COUNT(*) as total FROM ${TELEMETRY_TABLE} 
       WHERE user_id = $1 AND is_authenticated = true`,
      [user.id]
    );

    const total = countResult.rows?.[0]?.total || 0;

    // Calculate trends if enough data
    let trends = null;
    if (rows && rows.length >= 2) {
      const latest = rows[0];
      const previous = rows[1];
      trends = {
        healthScore: {
          current: latest.health_score,
          previous: previous.health_score,
          change: latest.health_score - previous.health_score,
        },
        behaviourScore: {
          current: latest.behaviour_score,
          previous: previous.behaviour_score,
          change: latest.behaviour_score - previous.behaviour_score,
        },
        awarenessScore: {
          current: latest.awareness_score,
          previous: previous.awareness_score,
          change: latest.awareness_score - previous.awareness_score,
        },
      };
    }

    return res.status(200).json({
      status: "success",
      data: rows || [],
      trends,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("[UserScores] handler error:", error?.message || error);
    return res.status(500).json({ status: "error", reason: "internal_error" });
  }
}
