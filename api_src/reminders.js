/**
 * reminders.js — Email/SMS Reminder Trigger System
 *
 * Serverless API for scheduling, listing, cancelling, and triggering
 * email/SMS reminders for users. Integrates with the existing dbClient
 * pattern for persistence and supports notification-engine-style
 * reminder types (checkin reminders, score follow-ups, streak nudges).
 *
 * Endpoints:
 *   POST   /api/reminders           — Schedule a new reminder
 *   GET    /api/reminders?userId=X  — List all reminders for a user
 *   GET    /api/reminders/:id       — Get a single reminder
 *   PATCH  /api/reminders/:id       — Update (cancel) a reminder
 *   DELETE /api/reminders/:id       — Delete a reminder
 *   POST   /api/reminders/trigger   — Trigger engine: send due reminders
 */

import { hasDatabaseConfig, insertIntoTable } from "./dbClient.js";

const REMINDERS_TABLE = process.env.SUPABASE_REMINDERS_TABLE || "reminders";

// ============================================================
// Validation helpers
// ============================================================

function isValidChannel(channel) {
  return channel === "email" || channel === "sms";
}

function isValidReminderTime(remindAt) {
  const ts = new Date(remindAt);
  return !isNaN(ts.getTime()) && ts.getTime() > Date.now() - 60000;
}

// ============================================================
// Shared: parse reminder ID from path
// ============================================================

function getReminderId(req) {
  // Supports: /api/reminders/42 or ?id=42
  return req.params?.id || req.query?.id || null;
}

// ============================================================
// POST /api/reminders — Schedule a new reminder
// ============================================================

async function handleCreate(req, res) {
  const { userId, channel, remindAt, title, message, metadata } = req.body || {};

  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }
  if (!channel || !isValidChannel(channel)) {
    return res.status(400).json({ error: "Invalid channel. Must be 'email' or 'sms'." });
  }
  if (!remindAt || !isValidReminderTime(remindAt)) {
    return res.status(400).json({ error: "Invalid or past remindAt timestamp." });
  }
  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return res.status(400).json({ error: "Missing or empty title." });
  }
  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return res.status(400).json({ error: "Missing or empty message." });
  }

  const reminderRow = {
    user_id: userId,
    channel,
    remind_at: new Date(remindAt).toISOString(),
    title: title.trim(),
    message: message.trim().substring(0, 1000),
    status: "pending",
    metadata: metadata || {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  let dbResult = null;
  if (hasDatabaseConfig()) {
    const { data, error } = await insertIntoTable(REMINDERS_TABLE, reminderRow);
    if (error) {
      console.error("[Reminders] DB insert error:", error);
      return res.status(500).json({ error: "db_insert_failed", detail: error.message });
    }
    dbResult = data;
  }

  console.log("[Reminders] Scheduled:", { userId, channel, remindAt, title });

  return res.status(201).json({
    status: "scheduled",
    reminder: dbResult?.[0] || {
      ...reminderRow,
      id: `local_${Date.now()}`,
    },
  });
}

// ============================================================
// GET /api/reminders — List reminders for a user
// ============================================================

async function handleList(req, res) {
  const { userId, status } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "Missing userId query parameter." });
  }

  // When no database, return empty — in production all reminders are server-side
  if (!hasDatabaseConfig()) {
    return res.status(200).json({ reminders: [] });
  }

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(200).json({ reminders: [], source: "no_db" });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

    let query = supabase
      .from(REMINDERS_TABLE)
      .select("*")
      .eq("user_id", userId)
      .order("remind_at", { ascending: false });

    if (status && ["pending", "sent", "failed", "cancelled"].includes(status)) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[Reminders] List query error:", error);
      return res.status(500).json({ error: "db_query_failed", detail: error.message });
    }

    return res.status(200).json({ reminders: data || [] });
  } catch (err) {
    console.error("[Reminders] List error:", err);
    return res.status(500).json({ error: "internal_error", detail: err.message });
  }
}

// ============================================================
// GET /api/reminders/:id — Get a single reminder
// ============================================================

async function handleGetById(req, res) {
  const id = getReminderId(req);
  if (!id) {
    return res.status(400).json({ error: "Missing reminder id." });
  }

  if (!hasDatabaseConfig()) {
    return res.status(200).json({ reminder: null, source: "local" });
  }

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(200).json({ reminder: null, source: "no_db" });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

    const { data, error } = await supabase
      .from(REMINDERS_TABLE)
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: "Reminder not found." });
      }
      console.error("[Reminders] GetById error:", error);
      return res.status(500).json({ error: "db_query_failed", detail: error.message });
    }

    return res.status(200).json({ reminder: data });
  } catch (err) {
    console.error("[Reminders] GetById error:", err);
    return res.status(500).json({ error: "internal_error", detail: err.message });
  }
}

// ============================================================
// PATCH /api/reminders/:id — Update (cancel) a reminder
// ============================================================

async function handleUpdate(req, res) {
  const id = getReminderId(req);
  if (!id) {
    return res.status(400).json({ error: "Missing reminder id." });
  }

  const { status, title, message } = req.body || {};

  // Only allow specific update fields
  const updates = {};
  if (status && ["pending", "cancelled"].includes(status)) {
    updates.status = status;
  }
  if (title && typeof title === "string") {
    updates.title = title.trim();
  }
  if (message && typeof message === "string") {
    updates.message = message.trim().substring(0, 1000);
  }
  updates.updated_at = new Date().toISOString();

  if (Object.keys(updates).length <= 1) {
    // Only updated_at was set — nothing meaningful to update
    return res.status(400).json({ error: "No valid fields to update. Status must be 'pending' or 'cancelled'." });
  }

  if (!hasDatabaseConfig()) {
    return res.status(200).json({ status: "logged", id, updates });
  }

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(200).json({ status: "logged", id, updates, source: "no_db" });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

    const { data, error } = await supabase
      .from(REMINDERS_TABLE)
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[Reminders] Update error:", error);
      return res.status(500).json({ error: "db_update_failed", detail: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: "Reminder not found." });
    }

    return res.status(200).json({ status: "updated", reminder: data });
  } catch (err) {
    console.error("[Reminders] Update error:", err);
    return res.status(500).json({ error: "internal_error", detail: err.message });
  }
}

// ============================================================
// DELETE /api/reminders/:id — Delete a reminder
// ============================================================

async function handleDelete(req, res) {
  const id = getReminderId(req);
  if (!id) {
    return res.status(400).json({ error: "Missing reminder id." });
  }

  if (!hasDatabaseConfig()) {
    return res.status(200).json({ status: "logged", action: "delete", id });
  }

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(200).json({ status: "logged", action: "delete", id, source: "no_db" });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

    // First fetch to confirm existence
    const { data: existing, error: fetchError } = await supabase
      .from(REMINDERS_TABLE)
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return res.status(404).json({ error: "Reminder not found." });
      }
      console.error("[Reminders] Delete fetch error:", fetchError);
      return res.status(500).json({ error: "db_query_failed", detail: fetchError.message });
    }

    const { error: deleteError } = await supabase
      .from(REMINDERS_TABLE)
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("[Reminders] Delete error:", deleteError);
      return res.status(500).json({ error: "db_delete_failed", detail: deleteError.message });
    }

    return res.status(200).json({ status: "deleted", id });
  } catch (err) {
    console.error("[Reminders] Delete error:", err);
    return res.status(500).json({ error: "internal_error", detail: err.message });
  }
}

// ============================================================
// POST /api/reminders/trigger — Process due reminders
// ============================================================

async function handleTrigger(req, res) {
  // This endpoint is called by a cron job or manually to process pending
  // reminders that are due. It simulates sending via a delivery provider.
  // In production, this would call an SMS/Email provider (Twilio, SendGrid, etc.)

  try {
    const reminders = await fetchDueReminders();
    const results = [];

    for (const reminder of (reminders || [])) {
      const result = await deliverReminder(reminder);
      results.push(result);
    }

    return res.status(200).json({
      status: "completed",
      processed: results.length,
      results,
    });
  } catch (err) {
    console.error("[Reminders] Trigger error:", err);
    return res.status(500).json({ error: "trigger_failed", detail: err.message });
  }
}

/**
 * Fetch all pending reminders that are due for delivery.
 */
async function fetchDueReminders() {
  if (!hasDatabaseConfig()) return [];

  const { createClient } = await import("@supabase/supabase-js");
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) return [];

  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from(REMINDERS_TABLE)
    .select("*")
    .eq("status", "pending")
    .lte("remind_at", now)
    .order("remind_at", { ascending: true })
    .limit(50);

  if (error) {
    console.error("[Reminders] fetchDueReminders error:", error);
    return [];
  }

  return data || [];
}

/**
 * Deliver a single reminder via the specified channel.
 * In production, this integrates with Twilio (SMS), SendGrid/Resend (Email), etc.
 */
async function deliverReminder(reminder) {
  const startTime = Date.now();
  let deliveryStatus = "sent";
  let errorMsg = null;

  try {
    // --- Channel-specific delivery logic ---
    if (reminder.channel === "sms") {
      // Placeholder: Integrate with Twilio SMS API
      // const twilioClient = require('twilio')(TWILIO_SID, TWILIO_AUTH_TOKEN);
      // await twilioClient.messages.create({
      //   body: reminder.message,
      //   from: TWILIO_PHONE,
      //   to: userPhone,
      // });
      console.log("[Reminders] SMS delivery (simulated):", {
        to: reminder.user_id,
        body: reminder.message.substring(0, 80),
      });
    } else if (reminder.channel === "email") {
      // Placeholder: Integrate with SendGrid / Resend
      // await sendEmail({
      //   to: userEmail,
      //   subject: reminder.title,
      //   text: reminder.message,
      // });
      console.log("[Reminders] Email delivery (simulated):", {
        to: reminder.user_id,
        subject: reminder.title,
        body: reminder.message.substring(0, 80),
      });
    }

    // --- Update status to 'sent' ---
    await updateReminderStatus(reminder.id, "sent", null);

    deliveryStatus = "sent";
  } catch (err) {
    console.error("[Reminders] Delivery failed for", reminder.id, ":", err.message);
    await updateReminderStatus(reminder.id, "failed", err.message);
    deliveryStatus = "failed";
    errorMsg = err.message;
  }

  const elapsed = Date.now() - startTime;
  console.log("[Reminders] Delivery completed:", {
    id: reminder.id,
    channel: reminder.channel,
    status: deliveryStatus,
    elapsedMs: elapsed,
  });

  return {
    id: reminder.id,
    channel: reminder.channel,
    status: deliveryStatus,
    error: errorMsg,
    elapsedMs: elapsed,
  };
}

/**
 * Update a reminder's status after delivery attempt.
 */
async function updateReminderStatus(id, status, errorMessage) {
  if (!hasDatabaseConfig()) return;

  const { createClient } = await import("@supabase/supabase-js");
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) return;

  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

  const updates = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "sent") {
    updates.sent_at = new Date().toISOString();
  }
  if (status === "failed" && errorMessage) {
    updates.error_message = errorMessage.substring(0, 500);
  }

  const { error } = await supabase
    .from(REMINDERS_TABLE)
    .update(updates)
    .eq("id", id);

  if (error) {
    console.error("[Reminders] Status update failed for", id, ":", error);
  }
}

// ============================================================
// Main handler — Route dispatch
// ============================================================

export default async function handler(req, res) {
  const method = req.method;
  const pathname = req.url || "";
  const hasIdParam = !!getReminderId(req);
  const isTriggerRoute = pathname.includes("/reminders/trigger");

  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // POST /api/reminders/trigger — Process due reminders
    if (method === "POST" && isTriggerRoute) {
      return await handleTrigger(req, res);
    }

    // POST /api/reminders — Schedule a new reminder
    if (method === "POST" && !hasIdParam) {
      return await handleCreate(req, res);
    }

    // GET /api/reminders/:id — Get single reminder
    if (method === "GET" && hasIdParam) {
      return await handleGetById(req, res);
    }

    // GET /api/reminders — List reminders for user
    if (method === "GET" && !hasIdParam) {
      return await handleList(req, res);
    }

    // PATCH /api/reminders/:id — Update a reminder
    if (method === "PATCH" && hasIdParam) {
      return await handleUpdate(req, res);
    }

    // DELETE /api/reminders/:id — Delete a reminder
    if (method === "DELETE" && hasIdParam) {
      return await handleDelete(req, res);
    }

    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (err) {
    console.error("[Reminders] Unhandled error:", err);
    return res.status(500).json({ error: "Internal Server Error", detail: err.message });
  }
}
