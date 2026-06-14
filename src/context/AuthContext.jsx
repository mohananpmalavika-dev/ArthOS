// src/context/AuthContext.jsx
// Authentication context for ARTH.OS — manages JWT token, user state,
// login/register/logout, auto-restore from localStorage, and sync on login.

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { migrateAnonymousData } from "../lib/storageManager.js";
import { migrateAnonymousDataToUser, clearUserData } from "../lib/userDataManager.js";

const AUTH_STORAGE_KEY = "arth-os-auth";
const API_BASE = "/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Define syncLocalDataToServer BEFORE first useEffect that uses it
  const syncLocalDataToServer = useCallback(async (userId, authToken) => {
    if (!userId || !authToken) {
      return;
    }
    const { syncAllToServer, processSyncQueue } =
      await import("../engines/financialMemoryEngine.js");
    // Flush any pending sync queue items first
    await processSyncQueue();
    return await syncAllToServer(userId, authToken);
  }, []);

  // Restore session from localStorage on mount
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.token && parsed.user) {
            // Local dev convenience: accept a 'dev-token' without remote validation
            const isLocalhost = window.location.hostname === "localhost" ||
              window.location.hostname === "127.0.0.1";
            if (isLocalhost && parsed.token === "dev-token") {
              setToken(parsed.token);
              setUser(parsed.user);
              // Do not attempt remote validation in dev shortcut
              if (!cancelled) {
                setLoading(false);
              }
              return;
            }

            setToken(parsed.token);
            setUser(parsed.user);

            // Verify token is still valid
            try {
              const res = await fetch(`${API_BASE}/auth/me`, {
                headers: { Authorization: `Bearer ${parsed.token}` }
              });
              if (res.ok && !cancelled) {
                // Token valid — trigger background sync of unsynced data
                syncLocalDataToServer(parsed.user.id, parsed.token);
              } else if (!res.ok) {
                // Token expired or invalid — clear session
                window.localStorage.removeItem(AUTH_STORAGE_KEY);
                if (!cancelled) {
                  setToken(null);
                  setUser(null);
                }
              }
            } catch {
              // Network error — keep existing session (offline-first)
            }
          }
        }
      } catch {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [syncLocalDataToServer]);

  const persistSession = useCallback((userData, tokenStr) => {
    try {
      window.localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({ user: userData, token: tokenStr })
      );
    } catch {
      // Storage full or unavailable — degrade gracefully
    }
    setUser(userData);
    setToken(tokenStr);
    setError(null);
  }, []);

  const login = useCallback(
    async (email, password) => {
      setError(null);
      setLoading(true);

      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });

        // Check response status before parsing JSON
        if (!res.ok) {
          const contentType = res.headers.get("content-type");
          let errorMsg = "Login failed";
          if (contentType && contentType.includes("application/json")) {
            try {
              const data = await res.json();
              errorMsg = data.error || "Login failed";
            } catch {
              // Ignore JSON parse error, use default message
            }
          }
          setError(errorMsg);
          return false;
        }

        const data = await res.json();

        // Migrate anonymous localStorage data to the new user scope
        migrateAnonymousData(data.user.id);
        migrateAnonymousDataToUser(data.user.id);

        persistSession(data.user, data.token);

        // Fire-and-forget sync: push local data to server
        syncLocalDataToServer(data.user.id, data.token);

        return true;
      } catch (err) {
        setError("Network error. Please try again.");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [persistSession, syncLocalDataToServer]
  );

  const register = useCallback(
    async (name, email, password) => {
      setError(null);
      setLoading(true);

      try {
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password })
        });

        // Check response status before parsing JSON
        if (!res.ok) {
          const contentType = res.headers.get("content-type");
          let errorMsg = "Registration failed";
          if (contentType && contentType.includes("application/json")) {
            try {
              const data = await res.json();
              errorMsg = data.error || "Registration failed";
            } catch {
              // Ignore JSON parse error, use default message
            }
          }
          setError(errorMsg);
          return false;
        }

        const data = await res.json();

        // Migrate anonymous localStorage data to the new user scope
        migrateAnonymousData(data.user.id);
        migrateAnonymousDataToUser(data.user.id);

        persistSession(data.user, data.token);

        // Fire-and-forget sync: push local data to server
        syncLocalDataToServer(data.user.id, data.token);

        return true;
      } catch (err) {
        setError("Network error. Please try again.");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [persistSession, syncLocalDataToServer]
  );

  const logout = useCallback(() => {
    try {
      const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.user && parsed.user.id) {
          // Clear user-scoped data from localStorage
          clearUserData(parsed.user.id);
        }
      }
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // ignore
    }
    setUser(null);
    setToken(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!token && !!user,
    login,
    register,
    logout,
    clearError,
    syncLocalDataToServer
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

export default AuthContext;
