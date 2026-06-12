// api_src/user/saveDraft.js
// Save assessment draft to database for authenticated user

import jwt from "jsonwebtoken";
import { insertIntoTable, queryTable } from "../dbClient.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

function extractUserFromToken(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
    return { id: decoded.userId || decoded.id || decoded.email || null, email: decoded.email || null };
  } catch (error) {
    console.warn("[saveDraft] Invalid token:", error.message);
    return null;
  }
}

export default async function handler(req, res) {
  try {
    const user = extractUserFromToken(req);
    if (!user) {
      return res.status(401).json({ status: "error", error: "Unauthorized" });
    }

    const { draft_data, assessment_type } = req.body;
    if (!draft_data) {
      return res.status(400).json({ status: "error", error: "draft_data is required" });
    }

    // Check if draft exists for this user
    const existing = await queryTable(
      `SELECT id FROM user_drafts WHERE user_id = $1 AND assessment_type = $2`,
      [user.id, assessment_type || "v2"]
    );

    let result;
    if (existing && existing.length > 0) {
      // Update existing draft
      result = await queryTable(
        `UPDATE user_drafts 
         SET draft_data = $1, updated_at = NOW() 
         WHERE user_id = $2 AND assessment_type = $3 
         RETURNING *`,
        [JSON.stringify(draft_data), user.id, assessment_type || "v2"]
      );
    } else {
      // Insert new draft
      result = await insertIntoTable("user_drafts", {
        user_id: user.id,
        assessment_type: assessment_type || "v2",
        draft_data: JSON.stringify(draft_data),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    console.log(`[saveDraft] Saved draft for user ${user.id}`);
    return res.status(200).json({
      status: "ok",
      data: result[0] || result,
    });
  } catch (error) {
    console.error("[saveDraft] Error:", error);
    return res.status(500).json({ status: "error", error: "Failed to save draft" });
  }
}
