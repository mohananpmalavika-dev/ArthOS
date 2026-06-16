/**
 * L10: Financial Memory API — Server-side persistence
 *
 * Provides serverless endpoints for all financial memory operations:
 * - Score history (append, query)
 * - Assessment history
 * - Weekly checkins
 * - Financial memory events
 * - Goal evolution tracking
 * - Twin snapshots
 * - Bulk sync
 *
 * Deployed as a single catch-all route: /api/memory
 * or as individual routes: /api/memory/score, /api/memory/events, etc.
 *
 * All payloads are validated at runtime against versioned schemas.
 */

import { hasDatabaseConfig, insertIntoTable } from "./dbClient.js";
import {
  validateScoreEntry,
  validateMemoryEventPayload,
  validateTwinSnapshotPayload,
  logValidationFailure,
  logValidationSuccess
} from "./payloadValidator.js";

// ============================================================
// Route parsing
// ============================================================

const MEMORY_TABLES = {
  scores: "user_scores_history",
  assessments: "assessments",
  checkins: "weekly_checkins",
  events: "financial_memory",
  goals: "goal_history",
  twins: "twin_snapshots",
};

async function handlePost(subroute, body, res) {
  if (!body || !body.userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  const { userId, ...data } = body;

  switch (subroute) {
    // --- Single record endpoints ---

    case "score": {
      // Append a single score entry
      if (typeof data.score !== "number") {
        return res.status(400).json({ error: "Missing score" });
      }

      // Validate score payload
      const scoreValidation = validateScoreEntry(data);
      if (!scoreValidation.valid) {
        logValidationFailure('memory/score', data, scoreValidation);
        return res.status(400).json({
          error: "Invalid score payload",
          details: scoreValidation.errors
        });
      }

      const scoreRow = {
        user_id: userId,
        score: Math.round(data.score),
        recorded_at: data.date || new Date().toISOString(),
        schema_version: "1.0.0"
      };

      if (hasDatabaseConfig()) {
        const { error } = await insertIntoTable(MEMORY_TABLES.scores, scoreRow);
        if (error) {
          console.error("[Memory] Score insert error:", error);
          return res.status(500).json({ error: "db_insert_failed" });
        }
      }
      logValidationSuccess('memory/score', '1.0.0');
      return res.status(200).json({ status: "saved", type: "score" });
    }

    case "assessment": {
      // Append a single assessment record
      const assessmentRow = {
        user_id: userId,
        result: data,
        created_at: data.date || new Date().toISOString(),
      };

      if (hasDatabaseConfig()) {
        const { error } = await insertIntoTable("assessments", assessmentRow);
        if (error) {
          console.error("[Memory] Assessment insert error:", error);
          return res.status(500).json({ error: "db_insert_failed" });
        }
      }
      return res.status(200).json({ status: "saved", type: "assessment" });
    }

    case "checkin": {
      // Append a single weekly checkin
      const checkinRow = {
        user_id: userId,
        payload: data,
        recorded_at: data.date || new Date().toISOString(),
      };

      if (hasDatabaseConfig()) {
        const { error } = await insertIntoTable(MEMORY_TABLES.checkins, checkinRow);
        if (error) {
          console.error("[Memory] Checkin insert error:", error);
          return res.status(500).json({ error: "db_insert_failed" });
        }
      }
      return res.status(200).json({ status: "saved", type: "checkin" });
    }

    case "event": {
      // Append a single financial memory event
      if (!data.event) {
        return res.status(400).json({ error: "Missing event data" });
      }

      // Validate memory event payload
      const eventValidation = validateMemoryEventPayload(data.event);
      if (!eventValidation.valid) {
        logValidationFailure('memory/event', data.event, eventValidation);
        return res.status(400).json({
          error: "Invalid event payload",
          details: eventValidation.errors
        });
      }

      const eventRow = {
        user_id: userId,
        memory: data.event,
        recorded_at: data.event.timestamp || new Date().toISOString(),
        schema_version: eventValidation.schema_version
      };

      if (hasDatabaseConfig()) {
        const { error } = await insertIntoTable(MEMORY_TABLES.events, eventRow);
        if (error) {
          console.error("[Memory] Event insert error:", error);
          return res.status(500).json({ error: "db_insert_failed" });
        }
      }
      logValidationSuccess('memory/event', eventValidation.schema_version);
      return res.status(200).json({ status: "saved", type: "event" });
    }

    case "goal": {
      // Track a goal change event
      const goalRow = {
        user_id: userId,
        goal_id: data.currentGoal || `goal_${Date.now()}`,
        payload: data,
        recorded_at: new Date().toISOString(),
      };

      if (hasDatabaseConfig()) {
        const { error } = await insertIntoTable(MEMORY_TABLES.goals, goalRow);
        if (error) {
          console.error("[Memory] Goal insert error:", error);
          return res.status(500).json({ error: "db_insert_failed" });
        }
      }
      return res.status(200).json({ status: "saved", type: "goal" });
    }

    case "twin": {
      // Save a twin snapshot
      if (!data.snapshot) {
        return res.status(400).json({ error: "Missing snapshot data" });
      }

      // Validate twin snapshot payload
      const twinValidation = validateTwinSnapshotPayload(data.snapshot);
      if (!twinValidation.valid) {
        logValidationFailure('memory/twin', data.snapshot, twinValidation);
        return res.status(400).json({
          error: "Invalid twin snapshot payload",
          details: twinValidation.errors
        });
      }

      const twinRow = {
        user_id: userId,
        snapshot: data.snapshot,
        recorded_at: data.snapshot.timestamp || new Date().toISOString(),
        schema_version: twinValidation.schema_version
      };

      if (hasDatabaseConfig()) {
        const { error } = await insertIntoTable(MEMORY_TABLES.twins, twinRow);
        if (error) {
          console.error("[Memory] Twin insert error:", error);
          return res.status(500).json({ error: "db_insert_failed" });
        }
      }
      logValidationSuccess('memory/twin', twinValidation.schema_version);
      return res.status(200).json({ status: "saved", type: "twin" });
    }

    // --- Bulk sync endpoints ---

    case "sync/scores": {
      if (!Array.isArray(data.data)) {
        return res.status(400).json({ error: "Missing data array" });
      }
      if (!hasDatabaseConfig()) {
        return res.status(200).json({ status: "logged", count: data.data.length });
      }
      let insertedCount = 0;
      for (const entry of data.data) {
        const row = { user_id: userId, score: entry.score, recorded_at: entry.date || new Date().toISOString() };
        const { error } = await insertIntoTable(MEMORY_TABLES.scores, row);
        if (!error) insertedCount++;
      }
      return res.status(200).json({ status: "synced", type: "scores", count: insertedCount });
    }

    case "sync/assessments": {
      if (!Array.isArray(data.data)) {
        return res.status(400).json({ error: "Missing data array" });
      }
      if (!hasDatabaseConfig()) {
        return res.status(200).json({ status: "logged", count: data.data.length });
      }
      let insertedCount = 0;
      for (const entry of data.data) {
        const row = { user_id: userId, result: entry, created_at: entry.date || new Date().toISOString() };
        const { error } = await insertIntoTable("assessments", row);
        if (!error) insertedCount++;
      }
      return res.status(200).json({ status: "synced", type: "assessments", count: insertedCount });
    }

    case "sync/checkins": {
      if (!Array.isArray(data.data)) {
        return res.status(400).json({ error: "Missing data array" });
      }
      if (!hasDatabaseConfig()) {
        return res.status(200).json({ status: "logged", count: data.data.length });
      }
      let insertedCount = 0;
      for (const entry of data.data) {
        const row = { user_id: userId, payload: entry, recorded_at: entry.date || new Date().toISOString() };
        const { error } = await insertIntoTable(MEMORY_TABLES.checkins, row);
        if (!error) insertedCount++;
      }
      return res.status(200).json({ status: "synced", type: "checkins", count: insertedCount });
    }

    case "sync/events": {
      if (!Array.isArray(data.data)) {
        return res.status(400).json({ error: "Missing data array" });
      }
      if (!hasDatabaseConfig()) {
        return res.status(200).json({ status: "logged", count: data.data.length });
      }
      let insertedCount = 0;
      for (const entry of data.data) {
        const row = { user_id: userId, memory: entry, recorded_at: entry.timestamp || new Date().toISOString() };
        const { error } = await insertIntoTable(MEMORY_TABLES.events, row);
        if (!error) insertedCount++;
      }
      return res.status(200).json({ status: "synced", type: "events", count: insertedCount });
    }

    case "sync/goals": {
      if (!Array.isArray(data.data)) {
        return res.status(400).json({ error: "Missing data array" });
      }
      if (!hasDatabaseConfig()) {
        return res.status(200).json({ status: "logged", count: data.data.length });
      }
      let insertedCount = 0;
      for (const entry of data.data) {
        const row = {
          user_id: userId,
          goal_id: entry.currentGoal || `goal_${Date.now()}`,
          payload: entry,
          recorded_at: entry.timestamp || new Date().toISOString(),
        };
        const { error } = await insertIntoTable(MEMORY_TABLES.goals, row);
        if (!error) insertedCount++;
      }
      return res.status(200).json({ status: "synced", type: "goals", count: insertedCount });
    }

    case "sync/twins": {
      if (!Array.isArray(data.data)) {
        return res.status(400).json({ error: "Missing data array" });
      }
      if (!hasDatabaseConfig()) {
        return res.status(200).json({ status: "logged", count: data.data.length });
      }
      let insertedCount = 0;
      for (const entry of data.data) {
        const row = { user_id: userId, snapshot: entry, simulated_at: entry.timestamp || new Date().toISOString() };
        const { error } = await insertIntoTable(MEMORY_TABLES.twins, row);
        if (!error) insertedCount++;
      }
      return res.status(200).json({ status: "synced", type: "twins", count: insertedCount });
    }

    default:
      return res.status(404).json({ error: `Unknown subroute: ${subroute}` });
  }
}

async function handleGet(subroute, query, res) {
  if (!query.userId) {
    return res.status(400).json({ error: "Missing userId query parameter" });
  }

  switch (subroute) {
    case "events": {
      // Return financial memory events for a user
      if (!hasDatabaseConfig()) {
        return res.status(200).json({ events: [], source: "local" });
      }

      try {
        const { fetchMemoryEventsForUser } = await import("./dbClient.js");
        const rows = await fetchMemoryEventsForUser(query.userId);
        const events = (rows || []).map((r) => ({ event: r.memory || null, timestamp: r.recorded_at || null }));
        return res.status(200).json({ events, source: "database" });
      } catch (err) {
        console.error("[Memory] fetch events error", err);
        return res.status(500).json({ events: [], source: "error", error: err.message });
      }
    }

    default:
      return res.status(404).json({ error: `Unknown GET subroute: ${subroute}` });
  }
}

export default async function handler(req, res) {
  // Parse the subroute from the URL path or query param
  // On Vercel: rewrites /api/memory/* to /api/memory?route=*, so subroute comes from query
  // On Vite dev server: path is /api/memory/sync/scores, so parse from pathname
  let subroute = (req.query.route || "").replace(/\/+$/, "").replace(/^\//, "");

  if (!subroute) {
    // Parse from URL pathname (Vite dev server mode)
    const url = new URL(req.url || "", "http://localhost");
    const pathname = url.pathname;
    // Strip /api/memory prefix
    const prefix = "/api/memory";
    if (pathname.startsWith(prefix + "/")) {
      subroute = pathname.slice(prefix.length + 1).replace(/\/+$/, "").replace(/^\//, "");
    }
  }

  // Debug logging
  if (subroute && subroute.startsWith("sync/")) {
    console.log(`[Memory API] ${req.method} ${subroute} - userId: ${req.body?.userId || req.query?.userId}`);
  }

  const method = req.method || "GET";

  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    if (method === "POST") {
      return await handlePost(subroute, req.body || {}, res);
    }
    if (method === "GET") {
      return await handleGet(subroute, req.query || {}, res);
    }
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (err) {
    console.error("[Memory] Unhandled error:", err);
    return res.status(500).json({ error: "Internal Server Error", detail: err.message });
  }
}
