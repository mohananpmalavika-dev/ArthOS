// src/lib/errorLogger.js
// Client-side error logging utility
// Captures uncaught errors and sends them to /api/error-log

export function initializeErrorLogging() {
  // Handle uncaught errors
  window.addEventListener("error", (event) => {
    logError({
      message: event.message,
      stack: event.error?.stack || event.filename,
      url: event.filename,
      lineNumber: event.lineno,
      columnNumber: event.colno,
    });
  });

  // Handle promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    logError({
      message: `Unhandled Promise: ${event.reason}`,
      stack: event.reason?.stack || String(event.reason),
      url: window.location.href,
    });
  });
}

async function logError(errorData) {
  try {
    await fetch("/api/error-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(errorData),
    });
  } catch (err) {
    // Silently fail if error logging fails to prevent cascading errors
    console.error("Failed to log error:", err);
  }
}
