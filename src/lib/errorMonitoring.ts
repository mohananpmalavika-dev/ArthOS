// src/lib/errorMonitoring.ts
// Error monitoring and Sentry integration for production error tracking

let SentryInitialized = false;

interface ErrorContext {
  [key: string]: unknown;
}

interface ErrorData {
  message: string;
  stack?: string;
  context: ErrorContext;
  timestamp: string;
}

interface LogData {
  message: string;
  level: string;
  context: ErrorContext;
  timestamp: string;
}

type LogLevel = "info" | "warning" | "error";

// Dynamically construct Sentry module name to avoid static analysis by Vite
// This allows @sentry/react to remain truly optional
async function loadSentry(): Promise<any> {
  try {
    // Construct module name dynamically so Vite doesn't statically resolve it
    const moduleName = ["@sentry", "react"].join("/");
    return await import(moduleName);
  } catch (err) {
    return null;
  }
}

export async function initializeErrorMonitoring(): Promise<void> {
  if (typeof window === "undefined" || SentryInitialized) return;

  const sentryDSN = (import.meta as any).env?.VITE_SENTRY_DSN as string | undefined;

  if (sentryDSN) {
    // Lazy-load Sentry only if DSN is configured
    try {
      // @ts-ignore - @sentry/react is optional
      const Sentry = await loadSentry();
      Sentry.init({
        dsn: sentryDSN,
        environment: (import.meta as any).env?.MODE || "development",
        tracesSampleRate: ((import.meta as any).env?.MODE || "development") === "production" ? 0.1 : 1.0,
        integrations: [
          new Sentry.Replay({
            maskAllText: true,
            blockAllMedia: true,
          }),
        ],
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
      });
      SentryInitialized = true;
      console.log("[Monitoring] Sentry initialized");
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.warn("[Monitoring] Sentry import failed (optional):", error.message);
    }
  } else {
    console.log("[Monitoring] No VITE_SENTRY_DSN configured — using local logging only");
  }
}

export async function captureException(
  error: Error | unknown,
  context: ErrorContext = {}
): Promise<void> {
  if (typeof window === "undefined") return;

  const errorData: ErrorData = {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context,
    timestamp: new Date().toISOString(),
  };

  // Log to console in development
  if (((import.meta as any).env?.MODE || "development") === "development") {
    console.error("[Error Captured]", errorData);
  }

  // Send to Sentry if available
  try {
    // @ts-ignore - @sentry/react is optional
    const Sentry = await loadSentry();
    if (!Sentry) return; // Sentry not available
    if (error instanceof Error) {
      Sentry.captureException(error, { extra: context } as any);
    } else {
      Sentry.captureMessage(String(error), {
        level: "error",
        extra: context,
      } as any);
    }
  } catch {
    // Sentry not available — continue silently
  }

  // Error capture failed — log to localStorage as fallback
  try {
    const errors = JSON.parse(
      window.localStorage.getItem("arth-os-errors") || "[]"
    ) as ErrorData[];
    errors.push(errorData);
    window.localStorage.setItem("arth-os-errors", JSON.stringify(errors.slice(-50))); // Keep last 50
  } catch {
    // Storage failed — give up gracefully
  }
}

export async function captureMessage(
  message: string,
  level: LogLevel = "info",
  context: ErrorContext = {}
): Promise<void> {
  if (typeof window === "undefined") return;

  const logData: LogData = {
    message,
    level,
    context,
    timestamp: new Date().toISOString(),
  };

  if (((import.meta as any).env?.MODE || "development") === "development") {
    console.log(`[${level.toUpperCase()}]`, logData);
  }

  try {
    // @ts-ignore - @sentry/react is optional
    const Sentry = await loadSentry();
    if (!Sentry) return; // Sentry not available
    const sentryLevel = level === "error" ? "error" : level === "warning" ? "warning" : "info";
    Sentry.captureMessage(message, {
      level: sentryLevel,
      extra: context,
    } as any);
  } catch {
    // Continue silently
  }
}

// Attach to window for global error handling
if (typeof window !== "undefined") {
  window.addEventListener("error", (event: ErrorEvent) => {
    void captureException(event.error, {
      type: "uncaught_error",
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
    void captureException(event.reason, {
      type: "unhandled_rejection",
    });
  });
}
