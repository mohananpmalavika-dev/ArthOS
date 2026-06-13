// src/lib/errorMonitoring.js
// Error monitoring and Sentry integration for production error tracking

let SentryInitialized = false;

export function initializeErrorMonitoring() {
  if (typeof window === "undefined" || SentryInitialized) {
    return;
  }

  const sentryDSN = import.meta.env.VITE_SENTRY_DSN;

  if (sentryDSN) {
    // Lazy-load Sentry only if DSN is configured
    import("@sentry/react")
      .then(Sentry => {
        Sentry.init({
          dsn: sentryDSN,
          environment: import.meta.env.MODE,
          tracesSampleRate: import.meta.env.MODE === "production" ? 0.1 : 1.0,
          integrations: [
            new Sentry.Replay({
              maskAllText: true,
              blockAllMedia: true
            })
          ],
          replaysSessionSampleRate: 0.1,
          replaysOnErrorSampleRate: 1.0
        });
        SentryInitialized = true;
        console.log("[Monitoring] Sentry initialized");
      })
      .catch(err => {
        console.warn("[Monitoring] Sentry import failed (optional):", err.message);
      });
  } else {
    console.log("[Monitoring] No VITE_SENTRY_DSN configured — using local logging only");
  }
}

export function captureException(error, context = {}) {
  if (typeof window === "undefined") {
    return;
  }

  const errorData = {
    message: error?.message || String(error),
    stack: error?.stack,
    context,
    timestamp: new Date().toISOString()
  };

  // Log to console in development
  if (import.meta.env.MODE === "development") {
    console.error("[Error Captured]", errorData);
  }

  // Send to Sentry if available
  try {
    import("@sentry/react")
      .then(Sentry => {
        if (error instanceof Error) {
          Sentry.captureException(error, { extra: context });
        } else {
          Sentry.captureMessage(String(error), "error", { extra: context });
        }
      })
      .catch(() => {
        // Sentry not available — continue silently
      });
  } catch {
    // Error capture failed — log to localStorage as fallback
    try {
      const errors = JSON.parse(window.localStorage.getItem("arth-os-errors") || "[]");
      errors.push(errorData);
      window.localStorage.setItem("arth-os-errors", JSON.stringify(errors.slice(-50))); // Keep last 50
    } catch {
      // Storage failed — give up gracefully
    }
  }
}

export function captureMessage(message, level = "info", context = {}) {
  if (typeof window === "undefined") {
    return;
  }

  const logData = {
    message,
    level,
    context,
    timestamp: new Date().toISOString()
  };

  if (import.meta.env.MODE === "development") {
    console.log(`[${level.toUpperCase()}]`, logData);
  }

  try {
    import("@sentry/react")
      .then(Sentry => {
        if (level === "error") {
          Sentry.captureMessage(message, "error", { extra: context });
        } else if (level === "warning") {
          Sentry.captureMessage(message, "warning", { extra: context });
        } else {
          Sentry.captureMessage(message, "info", { extra: context });
        }
      })
      .catch(() => {
        // Continue silently
      });
  } catch {
    // Continue silently
  }
}

// Attach to window for global error handling
if (typeof window !== "undefined") {
  window.addEventListener("error", event => {
    captureException(event.error, {
      type: "uncaught_error",
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });

  window.addEventListener("unhandledrejection", event => {
    captureException(event.reason, {
      type: "unhandled_rejection"
    });
  });
}
