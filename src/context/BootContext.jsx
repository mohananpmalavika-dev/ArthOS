import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import { FeatureFlagContext } from "../lib/featureFlagEngine.js";
import { initOfflineApiQueue } from "../lib/scoring-v2.js";

const BootContext = createContext(null);

export function useBoot() {
  const context = useContext(BootContext);
  if (!context) {
    throw new Error("useBoot must be used within BootProvider");
  }
  return context;
}

export function BootProvider({ children, subscriptionLoading, subscriptionError }) {
  const { loading: authLoading, isAuthenticated } = useAuth();
  const featureFlagContext = useContext(FeatureFlagContext);
  const featureFlagsReady = featureFlagContext?.isReady || false;

  const [offlineReady, setOfflineReady] = useState(false);
  const [offlineError, setOfflineError] = useState(null);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [bootStage, setBootStage] = useState("auth");
  const [isDegraded, setIsDegraded] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [isOfflineInitializing, setIsOfflineInitializing] = useState(false);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
    }
    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (authLoading) {
      setBootStage("auth");
      return;
    }

    if (!featureFlagsReady) {
      setBootStage("featureFlags");
      return;
    }

    if (subscriptionLoading) {
      setBootStage("subscription");
      return;
    }

    if (!offlineReady && !isOfflineInitializing) {
      setBootStage("offline");
      setIsOfflineInitializing(true);
      try {
        initOfflineApiQueue();
        setOfflineReady(true);
      } catch (err) {
        setOfflineError(err?.message || "Offline initialization failed");
        setIsDegraded(true);
      } finally {
        setIsOfflineInitializing(false);
      }
      return;
    }

    if (!offlineReady && isOfflineInitializing) {
      setBootStage("offline");
      return;
    }

    if (subscriptionError || offlineError || !isOnline) {
      setBootStage("degraded");
      return;
    }

    setBootStage("ready");
  }, [authLoading, featureFlagsReady, subscriptionLoading, offlineReady, isOfflineInitializing, retryKey, subscriptionError, offlineError, isOnline]);

  useEffect(() => {
    const degraded = !!subscriptionError || !!offlineError || !isOnline;
    setIsDegraded(degraded);
  }, [subscriptionError, offlineError, isOnline]);

  const isBootReady =
    !authLoading &&
    featureFlagsReady &&
    !subscriptionLoading &&
    (offlineReady || offlineError || !isOnline);

  const statusItems = useMemo(
    () => [
      {
        id: "auth",
        label: "Session restore",
        status: authLoading ? "pending" : "ready",
        detail: authLoading
          ? "Restoring your session and validating credentials."
          : isAuthenticated
          ? "Session restored."
          : "Guest/demo access or new session."
      },
      {
        id: "featureFlags",
        label: "Feature flags",
        status: featureFlagsReady ? "ready" : "pending",
        detail: featureFlagsReady
          ? "Feature rules are available."
          : "Loading feature and experiment configuration."
      },
      {
        id: "subscription",
        label: "Subscription check",
        status: subscriptionLoading ? "pending" : "ready",
        detail: subscriptionLoading
          ? "Verifying plan and access rights."
          : "Subscription status loaded."
      },
      {
        id: "offline",
        label: "Offline sync",
        status: offlineReady ? "ready" : "pending",
        detail: offlineReady
          ? "Offline sync is initialized."
          : isOfflineInitializing
          ? "Preparing local sync and queue processing."
          : "Waiting to initialize offline support."
      }
    ],
    [authLoading, featureFlagsReady, subscriptionLoading, offlineReady, isOfflineInitializing, isAuthenticated]
  );

  const bootStatus = useMemo(
    () => ({
      stage: bootStage,
      isBootReady,
      isDegraded,
      isOnline,
      statusItems,
      errors: [
        ...(subscriptionError ? ["Subscription service unavailable. Free tier fallback applied."] : []),
        ...(offlineError ? [offlineError] : []),
        ...(!isOnline ? ["Network offline. Some background sync may be delayed."] : [])
      ]
    }),
    [bootStage, isBootReady, isDegraded, isOnline, statusItems, subscriptionError, offlineError]
  );

  const retryBoot = () => {
    setOfflineError(null);
    setOfflineReady(false);
    setRetryKey((current) => current + 1);
  };

  return (
    <BootContext.Provider value={bootStatus}>
      {isBootReady ? (
        children
      ) : (
        <BootStatusScreen status={bootStatus} onRetry={retryBoot} />
      )}
    </BootContext.Provider>
  );
}

function BootStatusScreen({ status, onRetry }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "28px",
        background: "radial-gradient(circle at top, rgba(38, 63, 148, 0.12), transparent 35%), #f8fafc",
        color: "#0f172a"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "680px",
          padding: "28px",
          borderRadius: "24px",
          boxShadow: "0 28px 80px rgba(15, 23, 42, 0.12)",
          background: "rgba(255,255,255,0.96)",
          border: "1px solid rgba(148, 163, 184, 0.16)"
        }}
      >
        <div style={{ marginBottom: "20px" }}>
          <h1 style={{ margin: 0, fontSize: "2rem", lineHeight: 1.1 }}>ARTH.OS booting</h1>
          <p style={{ margin: "12px 0 0", color: "#475569" }}>
            Bringing the operating system online. This screen tracks preflight readiness,
            feature loading, and offline sync.
          </p>
        </div>

        <div style={{ display: "grid", gap: "12px", marginBottom: "24px" }}>
          {status.statusItems.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                padding: "16px",
                borderRadius: "18px",
                background: item.status === "ready" ? "#ecfdf5" : "#f8fafc",
                border: item.status === "ready" ? "1px solid #a7f3d0" : "1px solid #cbd5e1"
              }}
            >
              <div
                style={{
                  width: "14px",
                  height: "14px",
                  borderRadius: "50%",
                  marginTop: "4px",
                  background:
                    item.status === "ready"
                      ? "#16a34a"
                      : item.status === "pending"
                      ? "#0ea5e9"
                      : "#64748b"
                }}
              />
              <div>
                <strong style={{ display: "block", fontSize: "1rem", marginBottom: "4px" }}>
                  {item.label}
                </strong>
                <small style={{ color: "#475569" }}>{item.detail}</small>
              </div>
            </div>
          ))}
        </div>

        {status.errors.length > 0 && (
          <div
            style={{
              marginBottom: "24px",
              padding: "16px 18px",
              borderRadius: "18px",
              background: "#fffbeb",
              border: "1px solid #fde68a",
              color: "#92400e"
            }}
          >
            <strong style={{ display: "block", marginBottom: "6px" }}>
              Degraded mode enabled
            </strong>
            <ul style={{ margin: 0, paddingLeft: "18px" }}>
              {status.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={onRetry}
            style={{
              padding: "0.9rem 1.3rem",
              borderRadius: "14px",
              border: "none",
              background: "#2563eb",
              color: "white",
              cursor: "pointer",
              fontWeight: 600
            }}
          >
            Retry boot checks
          </button>
          <span style={{ color: "#475569" }}>
            When the checks pass, the OS shell will load automatically.
          </span>
        </div>
      </div>
    </div>
  );
}
