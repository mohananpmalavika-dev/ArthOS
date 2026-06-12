// api_src/user/loadDraft.js
// Load assessment draft from database for authenticated user

import jwt from "jsonwebtoken";
import { queryTable } from "../dbClient.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

function extractUserFromToken(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
    return { id: decoded.userId || decoded.id || decoded.email || null, email: decoded.email || null };
  } catch (error) {
    console.warn("[loadDraft] Invalid token:", error.message);
    return null;
  }
}

export default async function handler(req, res) {
  try {
    const user = extractUserFromToken(req);
    if (!user) {
      return res.status(401).json({ status: "error", error: "Unauthorized" });
    }

    const { assessment_type } = req.query;
    const type = assessment_type || "v2";

    const result = await queryTable(
      `SELECT * FROM user_drafts 
       WHERE user_id = $1 AND assessment_type = $2 
       ORDER BY updated_at DESC LIMIT 1`,
      [user.id, type]
    );

    if (!result || result.length === 0) {
      return res.status(200).json({
        status: "ok",
        data: null,
        message: "No draft found",
      });
    }

    const draft = result[0];
    return res.status(200).json({
      status: "ok",
      data: {
        ...draft,
        draft_data: typeof draft.draft_data === "string" ? JSON.parse(draft.draft_data) : draft.draft_data,
      },
    });
  } catch (error) {
    console.error("[loadDraft] Error:", error);
    return res.status(500).json({ status: "error", error: "Failed to load draft" });
  }
}
