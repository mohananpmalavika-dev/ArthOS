import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/**
 * EnterpriseAuthContext
 * Production-ready enterprise session management (JWT in memory + refresh flow).
 *
 * Assumptions:
 * - Access token is returned by refresh endpoint and stored in memory only.
 * - Refresh token is stored server-side (recommended: httpOnly secure cookie).
 * - Backend endpoints:
 *   - POST /api/enterprise/auth/refresh  -> { accessToken, user }
 *   - POST /api/enterprise/auth/logout  -> clears refresh token cookie
 *   - GET  /api/enterprise/auth/me      -> optional validation if refresh not used
 *   Adjust endpoint paths to match your backend.
 */

const EnterpriseAuthContext = createContext(null);

const API_BASE = "/api";
const ENTERPRISE_SESSION_KEY = "arth-os-enterprise-auth";

export function EnterpriseAuthProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [institution, setInstitution] = useState(null);

  const [error, setError] = useState(null);

  // Prevent concurrent refresh calls
  const refreshInFlightRef = useRef(false);

  const isAuthenticated = !!accessToken && !!user;

  const hasPermission = useCallback(
    (permission) => {
      if (!user) return false;
      const perms = user.permissions || user.roles || [];
      if (Array.isArray(perms)) {
        return perms.includes(permission);
      }
      // If permissions come as object/map
      if (typeof perms === "object" && perms) {
        return !!perms[permission];
      }
      return false;
    },
    [user]
  );

  const decodeEnterpriseClaims = useCallback((enterpriseUser) => {
    // Normalize common claim shapes into { user, institution, roles/permissions }
    // Your backend might already return institution and permissions; this simply normalizes.
    const nextInstitution = enterpriseUser?.institution || enterpriseUser?.tenant || null;
    const nextUser = {
      ...enterpriseUser,
      roles: enterpriseUser?.roles || enterpriseUser?.role || enterpriseUser?.claims?.roles || [],
      permissions:
        enterpriseUser?.permissions ||
        enterpriseUser?.claims?.permissions ||
        enterpriseUser?.scopes ||
        [],
    };

    return { institution: nextInstitution, user: nextUser };
  }, []);

  const persistEnterpriseSession = useCallback((data) => {
    const nextAccessToken = data?.accessToken || data?.token || null;
    const nextRefreshToken = data?.refreshToken || null;
    const enterpriseUser = data?.user || data?.account || null;

    if (!nextAccessToken || !enterpriseUser) {
      return false;
    }

    const { institution: nextInstitution, user: normalizedUser } =
      decodeEnterpriseClaims(enterpriseUser);

    setAccessToken(nextAccessToken);
    setUser(normalizedUser);
    setInstitution(nextInstitution);
    setError(null);

    try {
      window.localStorage.setItem(
        ENTERPRISE_SESSION_KEY,
        JSON.stringify({
          accessToken: nextAccessToken,
          refreshToken: nextRefreshToken,
          user: normalizedUser,
          institution: nextInstitution,
        })
      );
    } catch {
      // Storage unavailable; keep in-memory session.
    }

    return true;
  }, [decodeEnterpriseClaims]);

  const refreshAccessToken = useCallback(async () => {
    if (refreshInFlightRef.current) return false;
    refreshInFlightRef.current = true;
    setError(null);

    try {
      let refreshToken = null;
      try {
        const stored = window.localStorage.getItem(ENTERPRISE_SESSION_KEY);
        refreshToken = stored ? JSON.parse(stored)?.refreshToken || null : null;
      } catch {
        refreshToken = null;
      }

      const res = await fetch(`${API_BASE}/enterprise/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: refreshToken ? JSON.stringify({ refreshToken }) : undefined,
      });

      if (!res.ok) {
        return false;
      }

      const data = await res.json();
      return persistEnterpriseSession(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return false;
    } finally {
      refreshInFlightRef.current = false;
    }
  }, [persistEnterpriseSession]);

  const login = useCallback(async (email, password) => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/enterprise/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || data?.message || "Enterprise login failed");
        return false;
      }

      return persistEnterpriseSession(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enterprise login failed");
      return false;
    } finally {
      setLoading(false);
    }
  }, [persistEnterpriseSession]);

  const register = useCallback(async ({ name, email, password, institutionName }) => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/enterprise/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, institutionName }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || data?.message || "Enterprise registration failed");
        return false;
      }

      return persistEnterpriseSession(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enterprise registration failed");
      return false;
    } finally {
      setLoading(false);
    }
  }, [persistEnterpriseSession]);

  const logout = useCallback(async () => {
    setError(null);
    try {
      await fetch(`${API_BASE}/enterprise/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      // ignore
    } finally {
      setAccessToken(null);
      setUser(null);
      setInstitution(null);
      try {
        window.localStorage.removeItem(ENTERPRISE_SESSION_KEY);
      } catch {
        // ignore
      }
      setLoading(false);
    }
  }, []);

  // On mount: attempt refresh
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);

      const ok = await refreshAccessToken();
      if (!cancelled) {
        setLoading(false);
        if (!ok) {
          setAccessToken(null);
          setUser(null);
          setInstitution(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [refreshAccessToken]);

  const value = useMemo(
    () => ({
      loading,
      error,
      isAuthenticated,
      accessToken,
      user,
      institution,
      hasPermission,
      refreshAccessToken,
      login,
      register,
      logout,
    }),
    [
      loading,
      error,
      isAuthenticated,
      accessToken,
      user,
      institution,
      hasPermission,
      refreshAccessToken,
      login,
      register,
      logout,
    ]
  );

  return (
    <EnterpriseAuthContext.Provider value={value}>
      {children}
    </EnterpriseAuthContext.Provider>
  );
}

export function useEnterpriseAuth() {
  const ctx = useContext(EnterpriseAuthContext);
  if (!ctx) throw new Error("useEnterpriseAuth must be used within EnterpriseAuthProvider");
  return ctx;
}

