/**
 * Assessment Save Queue Management
 * Handles offline-first persistence with retry logic
 */

import { ASSESSMENT_SAVE_QUEUE_KEY, isBrowser } from "./app-utils.jsx";

/**
 * Load all queued assessment saves from localStorage
 */
export function loadQueuedAssessmentSaves() {
  if (!isBrowser()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(ASSESSMENT_SAVE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error("Failed to load queued assessment saves:", error);
    return [];
  }
}

/**
 * Persist queued saves to localStorage
 */
export function persistQueuedAssessmentSaves(queue) {
  if (!isBrowser()) {
    return;
  }

  try {
    if (queue.length) {
      window.localStorage.setItem(ASSESSMENT_SAVE_QUEUE_KEY, JSON.stringify(queue));
    } else {
      window.localStorage.removeItem(ASSESSMENT_SAVE_QUEUE_KEY);
    }
  } catch (error) {
    console.error("Failed to persist queued assessment saves:", error);
  }
}

/**
 * Add a new assessment save to the queue
 */
export function enqueueAssessmentSave(payload) {
  if (!isBrowser()) {
    return;
  }
  try {
    const queue = loadQueuedAssessmentSaves();
    queue.push({ payload, queuedAt: new Date().toISOString() });
    persistQueuedAssessmentSaves(queue);
  } catch (error) {
    console.error("Failed to enqueue assessment save:", error);
  }
}

/**
 * Flush queued saves to server when online
 */
export async function flushQueuedAssessmentSaves() {
  if (!isBrowser()) {
    return;
  }
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    console.warn("Offline - skipping queued save flush");
    return;
  }

  const queue = loadQueuedAssessmentSaves();
  if (!queue.length) {
    return;
  }

  const remaining = [];
  for (const queued of queue) {
    try {
      const response = await fetch("/api/saveAssessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(queued.payload)
      });
      if (!response.ok) {
        console.warn(`Failed to flush queued save (status ${response.status}), retaining in queue`);
        remaining.push(queued);
      } else {
        console.info("Successfully flushed queued assessment save");
      }
    } catch (error) {
      console.error("Failed to flush queued assessment save, retaining in queue:", error);
      remaining.push(queued);
    }
  }

  persistQueuedAssessmentSaves(remaining);
}
