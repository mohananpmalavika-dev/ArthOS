// api_src/user/savePreference.js
// Save user preferences to database

import jwt from "jsonwebtoken";
import { queryTable, insertIntoTable } from "../dbClient.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

function extractUserFromToken(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
    return { id: decoded.userId || decoded.id || decoded.email || null, email: decoded.email || null };
  } catch (error) {
    console.warn("[savePreference] Invalid token:", error.message);
    return null;
  }
}

export default async function handler(req, res) {
  try {
    const user = extractUserFromToken(req);
    if (!user) {
      return res.status(401).json({ status: "error", error: "Unauthorized" });
    }

    const { preference_key, preference_value } = req.body;
    if (!preference_key || preference_value === undefined) {
      return res.status(400).json({ status: "error", error: "preference_key and preference_value are required" });
    }

    // Check if preference exists
    const existing = await queryTable(
      `SELECT id FROM user_preferences WHERE user_id = $1 AND preference_key = $2`,
      [user.id, preference_key]
    );

    let result;
    if (existing && existing.length > 0) {
      // Update existing
      result = await queryTable(
        `UPDATE user_preferences 
         SET preference_value = $1, updated_at = NOW() 
         WHERE user_id = $2 AND preference_key = $3 
         RETURNING *`,
        [JSON.stringify(preference_value), user.id, preference_key]
      );
    } else {
      // Insert new
      result = await insertIntoTable("user_preferences", {
        user_id: user.id,
        preference_key,
        preference_value: JSON.stringify(preference_value),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    console.log(`[savePreference] Saved preference ${preference_key} for user ${user.id}`);
    return res.status(200).json({
      status: "ok",
      data: result[0] || result,
    });
  } catch (error) {
    console.error("[savePreference] Error:", error);
    return res.status(500).json({ status: "error", error: "Failed to save preference" });
  }
}
