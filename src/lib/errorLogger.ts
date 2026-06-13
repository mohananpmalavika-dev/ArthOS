// src/lib/errorLogger.ts
// Client-side error logging utility
// Captures uncaught errors and sends them to /api/error-log

interface ErrorLogData {
  message: string;
  stack?: string;
  url?: string;
  lineNumber?: number;
  columnNumber?: number;
  timestamp?: string;
}

export function initializeErrorLogging(): void {
  if (typeof window === "undefined") return;

  // Handle uncaught errors
  window.addEventListener("error", (event: ErrorEvent) => {
    logError({
      message: event.message,
      stack: event.error?.stack || event.filename,
      url: event.filename,
      lineNumber: event.lineno,
      columnNumber: event.colno,
    });
  });

  // Handle promise rejections
  window.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
    logError({
      message: `Unhandled Promise: ${String(event.reason)}`,
      stack: event.reason instanceof Error ? event.reason.stack : String(event.reason),
      url: window.location.href,
    });
  });
}

async function logError(errorData: ErrorLogData): Promise<void> {
  try {
    const payload: ErrorLogData = {
      ...errorData,
      timestamp: new Date().toISOString(),
    };

    const response = await fetch("/api/error-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error("Error log endpoint returned:", response.status);
    }
  } catch (err) {
    // Silently fail if error logging fails to prevent cascading errors
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("Failed to log error:", error.message);
  }
}
