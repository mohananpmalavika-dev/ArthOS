// api_src/user/saveDecision.js
// Save user decision data to database

import jwt from "jsonwebtoken";
import { insertIntoTable } from "../dbClient.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

function extractUserFromToken(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
    return { id: decoded.userId || decoded.id || decoded.email || null, email: decoded.email || null };
  } catch (error) {
    console.warn("[saveDecision] Invalid token:", error.message);
    return null;
  }
}

export default async function handler(req, res) {
  try {
    const user = extractUserFromToken(req);
    if (!user) {
      return res.status(401).json({ status: "error", error: "Unauthorized" });
    }

    const { decision_id, decision_data, decision_type, outcome_data } = req.body;
    if (!decision_data) {
      return res.status(400).json({ status: "error", error: "decision_data is required" });
    }

    const result = await insertIntoTable("user_decisions", {
      user_id: user.id,
      decision_id: decision_id || null,
      decision_type: decision_type || "assessment",
      decision_data: JSON.stringify(decision_data),
      outcome_data: outcome_data ? JSON.stringify(outcome_data) : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    console.log(`[saveDecision] Saved decision for user ${user.id}`);
    return res.status(201).json({
      status: "ok",
      data: result,
    });
  } catch (error) {
    console.error("[saveDecision] Error:", error);
    return res.status(500).json({ status: "error", error: "Failed to save decision" });
  }
}
