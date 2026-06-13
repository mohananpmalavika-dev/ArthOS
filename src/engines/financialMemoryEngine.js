/**
 * L10: Financial Memory — v3 Production Upgrade
 *
 * Event-sourced financial memory with offline-first architecture, retry queues,
 * server-side persistence, and CQRS-style read/write separation.
 *
 * Blueprint spec: "Longitudinal behaviour history and goal evolution tracking"
 * v2: localStorage + fire-and-forget server sync
 * v3: Event sourcing + offline queue + retry with backoff + conflict resolution
 */

import { buildTrajectoryNarrative } from "./trajectoryNarrativeEngine.js";
export { buildTrajectoryNarrative as generateTrajectoryNarrative };

// ============================================================
// STORAGE KEYS
// ============================================================

const SCORE_HISTORY_KEY = "arth-os-score-history";
const WEEKLY_CHECKIN_KEY = "arth-os-weekly-checkins";
const ASSESSMENT_HISTORY_KEY = "arth-os-assessment-history";
const FINANCIAL_MEMORY_KEY = "arth-os-financial-memory";
const GOAL_HISTORY_KEY = "arth-os-goal-history";
const TWIN_SNAPSHOT_KEY = "arth-os-twin-snapshots";
const EVENT_LOG_KEY = "arth-os-event-log";
const PENDING_SYNC_KEY = "arth-os-pending-sync";
const SYNC_META_KEY = "arth-os-sync-metadata";

// ============================================================
// HELPERS
// ============================================================

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function safeRead(key) {
  if (!isBrowser()) {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error("[financialMemoryEngine] Failed to parse localStorage data:", {
      key,
      error: error?.message
    });
    return null;
  }
}

function safeWrite(key, value) {
  if (!isBrowser()) {
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("[financialMemoryEngine] Failed to persist financial memory:", {
      key,
      error: error?.message,
      code: error?.code
    });
  }
}

function safeRemove(key) {
  if (!isBrowser()) {
    return;
  }
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error("[financialMemoryEngine] Failed to remove financial memory:", {
      key,
      error: error?.message
    });
  }
}

function safeAppend(key, entry) {
  const data = safeRead(key) || [];
  data.push(entry);
  safeWrite(key, data);
  return data;
}

const API_BASE = "/api";

async function apiPost(endpoint, payload, retries = 2) {
  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const resp = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (resp.ok) {
        return true;
      }
      if (resp.status >= 400 && resp.status < 500) {
        return false;
      } // Client errors don't retry
    } catch (error) {
      lastError = error;
      if (attempt === retries) {
        // Final attempt exhausted
        console.warn("[financialMemoryEngine] apiPost retries exhausted:", {
          endpoint,
          attempts: attempt + 1,
          error: error?.message
        });
      }
    }
    if (attempt < retries) {
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
  }
  return false;
}

async function apiGet(endpoint) {
  try {
    const resp = await fetch(`${API_BASE}${endpoint}`);
    if (!resp.ok) {
      return null;
    }
    return await resp.json();
  } catch (error) {
    console.error("[financialMemoryEngine] Failed to fetch from API:", {
      endpoint,
      error: error?.message
    });
    return null;
  }
}

// ============================================================
// EVENT SOURCING — Append-only event log
// ============================================================

/**
 * Append an event to the append-only event log.
 * Every data mutation goes through this to enable full audit trail.
 */
export function appendEvent(eventType, payload) {
  const entry = {
    eventType,
    payload,
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    version: 1
  };
  safeAppend(EVENT_LOG_KEY, entry);
  return entry;
}

/**
 * Query events by type with optional time range.
 */
export function queryEvents(eventType, opts = {}) {
  const log = safeRead(EVENT_LOG_KEY) || [];
  let filtered = eventType ? log.filter(e => e.eventType === eventType) : log;

  if (opts.from) {
    const from = new Date(opts.from);
    filtered = filtered.filter(e => new Date(e.timestamp) >= from);
  }
  if (opts.to) {
    const to = new Date(opts.to);
    filtered = filtered.filter(e => new Date(e.timestamp) <= to);
  }
  if (opts.limit) {
    filtered = filtered.slice(-opts.limit);
  }

  return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

/**
 * Rebuild a read model from the event log (CQRS replay).
 */
export function replayEvents(modelBuilder, eventTypes = null) {
  const log = safeRead(EVENT_LOG_KEY) || [];
  const relevant = eventTypes ? log.filter(e => eventTypes.includes(e.eventType)) : log;
  return modelBuilder(relevant);
}

// ============================================================
// PENDING SYNC QUEUE — Offline-first retry
// ============================================================

/**
 * Enqueue an API call for later retry if it fails.
 */
export function enqueueSync(endpoint, payload) {
  const queue = safeRead(PENDING_SYNC_KEY) || [];
  queue.push({ endpoint, payload, enqueuedAt: new Date().toISOString() });
  safeWrite(PENDING_SYNC_KEY, queue);
}

/**
 * Process the pending sync queue with exponential backoff.
 * Returns results for each attempt.
 */
export async function processSyncQueue() {
  const queue = safeRead(PENDING_SYNC_KEY) || [];
  if (queue.length === 0) {
    return { processed: 0, failed: 0 };
  }

  const results = [];
  const remaining = [];

  for (const item of queue) {
    const ok = await apiPost(item.endpoint, item.payload, 2);
    if (ok) {
      results.push({ ...item, status: "synced" });
    } else {
      remaining.push(item);
      results.push({ ...item, status: "failed" });
    }
  }

  safeWrite(PENDING_SYNC_KEY, remaining);
  return {
    processed: results.filter(r => r.status === "synced").length,
    failed: results.filter(r => r.status === "failed").length,
    remaining: remaining.length,
    results
  };
}

/**
 * Get count of pending sync items.
 */
export function pendingSyncCount() {
  const queue = safeRead(PENDING_SYNC_KEY) || [];
  return queue.length;
}

// ============================================================
// SYNC METADATA — Track what's been synced
// ============================================================

function getSyncMeta() {
  return safeRead(SYNC_META_KEY) || { lastSync: null, version: 0 };
}

function setSyncMeta(meta) {
  safeWrite(SYNC_META_KEY, meta);
}

export function lastSyncTime() {
  return getSyncMeta().lastSync;
}

/**
 * Returns true if data has changed since last sync.
 */
export function hasUnsyncedChanges() {
  const meta = getSyncMeta();
  const log = safeRead(EVENT_LOG_KEY) || [];
  if (log.length === 0) {
    return false;
  }
  const lastEvent = log[log.length - 1];
  return !meta.lastSync || new Date(lastEvent.timestamp) > new Date(meta.lastSync);
}

// ============================================================
// SCORE HISTORY
// ============================================================

export function loadScoreHistory() {
  const local = safeRead(SCORE_HISTORY_KEY);
  return Array.isArray(local) ? local.sort((a, b) => new Date(a.date) - new Date(b.date)) : [];
}

export function persistScoreHistory(history) {
  safeWrite(SCORE_HISTORY_KEY, history);
  appendEvent("score_history_saved", { count: history.length });
}

export async function appendScoreHistory(healthScore, userId = null) {
  if (healthScore === undefined || healthScore === null) {
    return loadScoreHistory();
  }

  const history = loadScoreHistory();
  const today = new Date().toISOString().split("T")[0];
  const roundedScore = Math.round(Number(healthScore) || 0);

  const existing = history.find(entry => entry.date === today);
  const updated = existing
    ? history.map(entry => (entry.date === today ? { ...entry, score: roundedScore } : entry))
    : [...history, { date: today, score: roundedScore }];

  persistScoreHistory(updated);
  appendEvent("score_appended", { date: today, score: roundedScore, userId });

  if (userId) {
    const ok = await apiPost("/memory/score", { userId, score: roundedScore, date: today });
    if (!ok) {
      enqueueSync("/memory/score", { userId, score: roundedScore, date: today });
    }
  }

  return updated;
}

export function getScoreProgression(history, timespan = "all") {
  if (!Array.isArray(history)) {
    return [];
  }
  if (timespan === "all") {
    return history;
  }

  const now = new Date();
  const cutoff = new Date(now);

  if (timespan === "week") {
    cutoff.setDate(now.getDate() - 7);
  } else if (timespan === "month") {
    cutoff.setMonth(now.getMonth() - 1);
  } else if (timespan === "quarter") {
    cutoff.setMonth(now.getMonth() - 3);
  }

  return history.filter(item => new Date(item.date) >= cutoff);
}

export function getProgressSummary(history) {
  if (!Array.isArray(history) || history.length === 0) {
    return { improvement: 0, startDate: null, endDate: null, periodLabel: "No history yet" };
  }

  const sorted = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const improvement = last.score - first.score;

  return {
    improvement,
    startDate: first.date,
    endDate: last.date,
    periodLabel:
      sorted.length === 1
        ? `1 assessment, ${improvement >= 0 ? "+" : ""}${improvement} points`
        : `${sorted.length} assessments, ${improvement >= 0 ? "+" : ""}${improvement} points`
  };
}

// ============================================================
// ASSESSMENT HISTORY
// ============================================================

export function loadAssessmentHistory() {
  const local = safeRead(ASSESSMENT_HISTORY_KEY);
  return Array.isArray(local) ? local.sort((a, b) => new Date(a.date) - new Date(b.date)) : [];
}

export function persistAssessmentHistory(history) {
  safeWrite(ASSESSMENT_HISTORY_KEY, history);
}

export async function appendAssessmentHistory(entry, userId = null) {
  if (!isBrowser()) {
    return loadAssessmentHistory();
  }

  const history = loadAssessmentHistory();
  const today = new Date().toISOString().split("T")[0];
  const created = {
    date: today,
    score: Math.round(Number(entry.healthScore) || 0),
    personalityType: entry.personalityType || "Unknown",
    stabilityMonths: entry.survivalMonthsRaw || 0,
    awarenessScore: entry.awarenessScore || 0,
    behaviourSummary: entry.behaviourSummary || {}
  };

  const existing = history.find(item => item.date === today);
  const updated = existing
    ? history.map(item => (item.date === today ? { ...item, ...created } : item))
    : [...history, created];

  persistAssessmentHistory(updated);
  appendEvent("assessment_appended", { ...created, userId });

  if (userId) {
    const ok = await apiPost("/memory/assessment", { userId, ...created });
    if (!ok) {
      enqueueSync("/memory/assessment", { userId, ...created });
    }
  }

  return updated;
}

// ============================================================
// WEEKLY CHECKINS
// ============================================================

export function loadWeeklyCheckins() {
  const local = safeRead(WEEKLY_CHECKIN_KEY);
  return Array.isArray(local) ? local : [];
}

export function persistWeeklyCheckins(checkins) {
  safeWrite(WEEKLY_CHECKIN_KEY, checkins);
}

export async function appendWeeklyCheckin(checkin, userId = null) {
  if (!isBrowser()) {
    return loadWeeklyCheckins();
  }

  const checkins = loadWeeklyCheckins();
  const today = new Date().toISOString().split("T")[0];
  const entry = { date: today, ...checkin };

  const existing = checkins.find(item => item.date === today);
  const updated = existing
    ? checkins.map(item => (item.date === today ? { ...item, ...entry } : item))
    : [...checkins, entry];

  persistWeeklyCheckins(updated);
  appendEvent("checkin_appended", { ...entry, userId });

  if (userId) {
    const ok = await apiPost("/memory/checkin", { userId, ...entry });
    if (!ok) {
      enqueueSync("/memory/checkin", { userId, ...entry });
    }
  }

  return updated;
}

export function countRecentCheckins(checkins, days = 7) {
  if (!Array.isArray(checkins)) {
    return 0;
  }
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return checkins.filter(item => new Date(item.date) >= cutoff).length;
}

export function calculateConsecutiveStreak(checkins) {
  if (!Array.isArray(checkins) || checkins.length === 0) {
    return 0;
  }

  const sorted = [...checkins].sort((a, b) => new Date(b.date) - new Date(a.date));
  let streak = 0;
  const expectedDate = new Date();

  for (const checkin of sorted) {
    const checkinDate = new Date(checkin.date);
    if (checkinDate.toDateString() === expectedDate.toDateString()) {
      streak += 1;
      expectedDate.setDate(expectedDate.getDate() - 1);
      continue;
    }
    if (checkinDate < expectedDate) {
      break;
    }
  }

  return streak;
}

// ============================================================
// FINANCIAL MEMORY — Event timeline
// ============================================================

export function loadFinancialMemory(userId = null) {
  const local = safeRead(FINANCIAL_MEMORY_KEY);
  return Array.isArray(local)
    ? local.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    : [];
}

export function persistFinancialMemory(memory) {
  safeWrite(FINANCIAL_MEMORY_KEY, memory);
}

export async function addFinancialMemoryEvent(event, userId = null) {
  if (!isBrowser()) {
    return [];
  }

  const memory = loadFinancialMemory();
  const entry = {
    ...event,
    id: event.id || `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: event.timestamp || new Date().toISOString()
  };

  memory.push(entry);
  persistFinancialMemory(memory);
  appendEvent("memory_event_added", { event: entry, userId });

  if (userId) {
    const ok = await apiPost("/memory/event", { userId, event: entry });
    if (!ok) {
      enqueueSync("/memory/event", { userId, event: entry });
    }
  }

  return memory;
}

export function getFinancialMemoryTimeline(userId = null, limit = 50) {
  const memory = loadFinancialMemory();
  if (userId) {
    apiGet(`/memory/events?userId=${userId}`)
      .then(remote => {
        if (remote && Array.isArray(remote.events) && remote.events.length > memory.length) {
          persistFinancialMemory(remote.events);
        }
      })
      .catch(error => {
        console.warn("[financialMemoryEngine] Failed to sync financial memory from server:", {
          userId,
          error: error?.message
        });
      });
  }
  return memory.slice(0, limit);
}

// ============================================================
// GOAL HISTORY
// ============================================================

export function loadGoalHistory() {
  const local = safeRead(GOAL_HISTORY_KEY);
  return Array.isArray(local)
    ? local.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    : [];
}

export function persistGoalHistory(goals) {
  safeWrite(GOAL_HISTORY_KEY, goals);
}

export async function trackGoalEvolution(previousGoal, currentGoal, userId = null) {
  const change = {
    changed: previousGoal !== currentGoal,
    previousGoal,
    currentGoal,
    timestamp: new Date().toISOString()
  };

  const history = loadGoalHistory();
  history.push(change);
  persistGoalHistory(history);
  appendEvent("goal_evolved", { ...change, userId });

  if (userId && change.changed) {
    try {
      const ok = await apiPost("/memory/goal", { userId, ...change });
      if (!ok) {
        enqueueSync("/memory/goal", { userId, ...change });
      }
    } catch (error) {
      console.error("[financialMemoryEngine] Failed to sync goal change:", {
        userId,
        changeId: change?.id,
        error: error?.message
      });
      enqueueSync("/memory/goal", { userId, ...change });
    }
  }

  return change;
}

// ============================================================
// TWIN SNAPSHOTS
// ============================================================

export function loadTwinSnapshots() {
  const local = safeRead(TWIN_SNAPSHOT_KEY);
  return Array.isArray(local)
    ? local.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    : [];
}

export function persistTwinSnapshots(snapshots) {
  safeWrite(TWIN_SNAPSHOT_KEY, snapshots);
}

export async function saveTwinSnapshot(snapshot, userId = null) {
  if (!isBrowser()) {
    return [];
  }

  const snapshots = loadTwinSnapshots();
  const entry = {
    ...snapshot,
    id: `twin_${Date.now()}`,
    timestamp: new Date().toISOString()
  };

  snapshots.push(entry);
  persistTwinSnapshots(snapshots);
  appendEvent("twin_snapshot_saved", { snapshotId: entry.id, userId });

  if (userId) {
    try {
      const ok = await apiPost("/memory/twin", { userId, snapshot: entry });
      if (!ok) {
        enqueueSync("/memory/twin", { userId, snapshot: entry });
      }
    } catch (error) {
      console.error("[financialMemoryEngine] Failed to sync digital twin:", {
        userId,
        snapshotId: entry?.id,
        error: error?.message
      });
      enqueueSync("/memory/twin", { userId, snapshot: entry });
    }
  }

  return snapshots;
}

// ============================================================
// SYNC — Bulk sync with sync metadata tracking
// ============================================================

/**
 * POST with optional Authorization header. If authToken is provided,
 * it's included as a Bearer token so the server can authenticate the request.
 */
async function apiPostAuthorized(endpoint, payload, authToken, retries = 2) {
  const headers = { "Content-Type": "application/json" };
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const resp = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });
      if (resp.ok) {
        return true;
      }
      if (resp.status >= 400 && resp.status < 500) {
        return false;
      }
    } catch (error) {
      lastError = error;
      if (attempt === retries) {
        // Final attempt exhausted
        console.warn("[financialMemoryEngine] apiPostAuthorized retries exhausted:", {
          endpoint,
          attempts: attempt + 1,
          error: error?.message
        });
      }
    }
    if (attempt < retries) {
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
  }
  return false;
}

/**
 * Trigger a full data sync of all local stores to the server.
 * Optionally accepts an authToken for authenticated API calls.
 * Also flushes the pending sync queue.
 */
export async function syncAllToServer(userId, authToken) {
  if (!userId || !isBrowser()) {
    return { success: false, reason: "no_user" };
  }

  const post = (endpoint, payload) => apiPostAuthorized(endpoint, payload, authToken);

  const results = {
    scoreHistory: false,
    assessmentHistory: false,
    checkins: false,
    memory: false,
    goals: false,
    twins: false,
    pendingQueue: false
  };

  // Flush pending sync queue first
  const queueResult = await processSyncQueue();
  results.pendingQueue = queueResult.processed > 0 || queueResult.failed === 0;

  const scoreHistory = loadScoreHistory();
  if (scoreHistory.length) {
    results.scoreHistory = await post("/memory/sync/scores", { userId, data: scoreHistory });
  }

  const assessmentHistory = loadAssessmentHistory();
  if (assessmentHistory.length) {
    results.assessmentHistory = await post("/memory/sync/assessments", {
      userId,
      data: assessmentHistory
    });
  }

  const checkins = loadWeeklyCheckins();
  if (checkins.length) {
    results.checkins = await post("/memory/sync/checkins", { userId, data: checkins });
  }

  const memory = loadFinancialMemory();
  if (memory.length) {
    results.memory = await post("/memory/sync/events", { userId, data: memory });
  }

  const goals = loadGoalHistory();
  if (goals.length) {
    results.goals = await post("/memory/sync/goals", { userId, data: goals });
  }

  const twins = loadTwinSnapshots();
  if (twins.length) {
    results.twins = await post("/memory/sync/twins", { userId, data: twins });
  }

  // Update sync metadata
  setSyncMeta({ lastSync: new Date().toISOString(), version: (getSyncMeta().version || 0) + 1 });

  return results;
}

// ============================================================
// CLEAR
// ============================================================

export function clearAllMemory() {
  safeRemove(SCORE_HISTORY_KEY);
  safeRemove(WEEKLY_CHECKIN_KEY);
  safeRemove(ASSESSMENT_HISTORY_KEY);
  safeRemove(FINANCIAL_MEMORY_KEY);
  safeRemove(GOAL_HISTORY_KEY);
  safeRemove(TWIN_SNAPSHOT_KEY);
  safeRemove(EVENT_LOG_KEY);
  safeRemove(PENDING_SYNC_KEY);
  safeRemove(SYNC_META_KEY);
}

// ============================================================
// GET ALL MEMORY STATUS
// ============================================================

export function getMemoryStatus() {
  return {
    scoreHistoryCount: (safeRead(SCORE_HISTORY_KEY) || []).length,
    assessmentCount: (safeRead(ASSESSMENT_HISTORY_KEY) || []).length,
    checkinCount: (safeRead(WEEKLY_CHECKIN_KEY) || []).length,
    memoryEventCount: (safeRead(FINANCIAL_MEMORY_KEY) || []).length,
    goalChangeCount: (safeRead(GOAL_HISTORY_KEY) || []).length,
    twinSnapshotCount: (safeRead(TWIN_SNAPSHOT_KEY) || []).length,
    eventLogCount: (safeRead(EVENT_LOG_KEY) || []).length,
    pendingSyncCount: pendingSyncCount(),
    lastSync: lastSyncTime(),
    hasUnsynced: hasUnsyncedChanges()
  };
}
