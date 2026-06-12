// api_src/error-log.js
// Client-side error logging endpoint
// Accepts errors from the browser console and logs them for debugging

import { insertIntoTable, hasDatabaseConfig } from "./dbClient.js";

const ERROR_LOG_TABLE = process.env.SUPABASE_ERROR_LOG_TABLE || "error_logs";

export default async function handler(req, res) {
  // Enforce POST-only access
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { message, stack, url, lineNumber, columnNumber } = req.body;

    // Validate required fields
    if (!message) {
      return res.status(400).json({ error: "Missing error message" });
    }

    // Build error log entry
    const errorLogEntry = {
      error_message: String(message).substring(0, 500), // Truncate to reasonable length
      error_stack: stack ? String(stack).substring(0, 2000) : null,
      error_url: url ? String(url).substring(0, 500) : null,
      error_line: lineNumber ? Number(lineNumber) : null,
      error_column: columnNumber ? Number(columnNumber) : null,
      error_timestamp: new Date().toISOString(),
      user_agent: req.headers["user-agent"] || null,
    };

    // If database is configured, store the error log
    if (hasDatabaseConfig()) {
      try {
        await insertIntoTable(ERROR_LOG_TABLE, errorLogEntry);
      } catch (dbError) {
        console.error("Failed to insert error log:", dbError);
        // Don't fail the response if database insert fails — just log it
      }
    }

    // Always return success to client to avoid cascading errors
    return res.status(200).json({ 
      success: true, 
      message: "Error logged successfully" 
    });
  } catch (error) {
    console.error("Error log handler error:", error);
    // Return success even on error to prevent client-side cascading failures
    return res.status(200).json({ 
      success: true, 
      message: "Error received and logged" 
    });
  }
}
