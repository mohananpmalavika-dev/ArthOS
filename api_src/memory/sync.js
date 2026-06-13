/**
 * Memory Sync API Endpoints
 * Handles bulk sync operations for:
 * - Score history
 * - Assessment history
 * - Weekly checkins
 * - Financial memory events
 * - Goal history
 * - Twin snapshots
 */

import { hasDatabaseConfig, insertIntoTable } from "../dbClient.js";

const MEMORY_TABLES = {
  scores: "user_scores_history",
  assessments: "assessments",
  checkins: "weekly_checkins",
  events: "financial_memory",
  goals: "goal_history",
  twins: "twin_snapshots",
};

export default async function syncHandler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const { userId, data } = body;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    if (!Array.isArray(data)) {
      return res.status(400).json({ error: "Missing data array" });
    }

    // Parse which sync type from the URL path
    const pathname = new URL(req.url || "", "http://localhost").pathname;
    let syncType = null;

    if (pathname.includes("/scores")) syncType = "scores";
    else if (pathname.includes("/assessments")) syncType = "assessments";
    else if (pathname.includes("/checkins")) syncType = "checkins";
    else if (pathname.includes("/events")) syncType = "events";
    else if (pathname.includes("/goals")) syncType = "goals";
    else if (pathname.includes("/twins")) syncType = "twins";

    if (!syncType) {
      return res.status(400).json({ error: "Unknown sync type from URL" });
    }

    console.log(`[Memory Sync] ${syncType.toUpperCase()} - userId: ${userId}, records: ${data.length}`);

    // If no database is configured, just log and return success
    if (!hasDatabaseConfig()) {
      return res.status(200).json({
        status: "logged",
        type: syncType,
        count: data.length,
        message: "Data logged locally (no database configured)"
      });
    }

    // Sync to database
    let insertedCount = 0;

    for (const entry of data) {
      let row = null;

      switch (syncType) {
        case "scores":
          row = {
            user_id: userId,
            score: entry.score,
            recorded_at: entry.date || entry.recorded_at || new Date().toISOString()
          };
          break;

        case "assessments":
          row = {
            user_id: userId,
            result: entry,
            created_at: entry.date || entry.created_at || new Date().toISOString()
          };
          break;

        case "checkins":
          row = {
            user_id: userId,
            checkin_data: entry,
            week_of: entry.weekOf || entry.week_of || new Date().toISOString()
          };
          break;

        case "events":
          row = {
            user_id: userId,
            event_data: entry,
            event_timestamp: entry.timestamp || entry.event_timestamp || new Date().toISOString()
          };
          break;

        case "goals":
          row = {
            user_id: userId,
            goal_data: entry,
            recorded_at: entry.date || entry.recorded_at || new Date().toISOString()
          };
          break;

        case "twins":
          row = {
            user_id: userId,
            snapshot: entry,
            simulated_at: entry.timestamp || entry.simulated_at || new Date().toISOString()
          };
          break;
      }

      if (row) {
        const { error } = await insertIntoTable(MEMORY_TABLES[syncType], row);
        if (!error) {
          insertedCount++;
        } else {
          console.warn(`[Memory Sync] Failed to insert ${syncType} record:`, error);
        }
      }
    }

    return res.status(200).json({
      status: "synced",
      type: syncType,
      count: insertedCount,
      total: data.length
    });
  } catch (err) {
    console.error("[Memory Sync] Error:", err.message);
    return res.status(500).json({
      error: "Sync failed",
      message: err.message
    });
  }
}
