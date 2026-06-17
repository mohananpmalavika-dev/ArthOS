// api_src/user/savePreference.js
// Save user preferences to database

import { extractUserFromRequest } from "../auth/jwt.js";
import { queryTable, insertIntoTable } from "../dbClient.js";

export default async function handler(req, res) {
  try {
    const user = await extractUserFromRequest(req);
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

    const payload = Array.isArray(result)
      ? result[0]
      : result?.data?.[0] || result?.data || result?.[0] || result;

    console.log(`[savePreference] Saved preference ${preference_key} for user ${user.id}`);
    return res.status(200).json({
      status: "ok",
      data: payload,
    });
  } catch (error) {
    console.error("[savePreference] Error:", error);
    return res.status(500).json({ status: "error", error: "Failed to save preference" });
  }
}
