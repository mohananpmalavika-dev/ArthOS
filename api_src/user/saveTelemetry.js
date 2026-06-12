// api_src/user/saveTelemetry.js
// Save user engagement telemetry to database

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
    console.warn("[saveTelemetry] Invalid token:", error.message);
    return null;
  }
}

export default async function handler(req, res) {
  try {
    const user = extractUserFromToken(req);
    if (!user) {
      return res.status(401).json({ status: "error", error: "Unauthorized" });
    }

    const { event_type, event_data, session_id } = req.body;
    if (!event_type || !event_data) {
      return res.status(400).json({ status: "error", error: "event_type and event_data are required" });
    }

    const result = await insertIntoTable("user_telemetry", {
      user_id: user.id,
      session_id: session_id || null,
      event_type,
      event_data: JSON.stringify(event_data),
      timestamp: new Date().toISOString(),
    });

    console.log(`[saveTelemetry] Saved telemetry for user ${user.id}, event: ${event_type}`);
    return res.status(201).json({
      status: "ok",
      data: result,
    });
  } catch (error) {
    console.error("[saveTelemetry] Error:", error);
    return res.status(500).json({ status: "error", error: "Failed to save telemetry" });
  }
}
