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

  const refreshAccessToken = useCallback(async () => {
    if (refreshInFlightRef.current) return false;
    refreshInFlightRef.current = true;
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/enterprise/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // No body needed for cookie-based refresh
      });

      if (!res.ok) {
        return false;
      }

      const data = await res.json();

      const nextAccessToken = data?.accessToken || data?.token || null;
      const enterpriseUser = data?.user || data?.account || null;

      if (!nextAccessToken || !enterpriseUser) {
        return false;
      }

      const { institution: nextInstitution, user: normalizedUser } =
        decodeEnterpriseClaims(enterpriseUser);

      setAccessToken(nextAccessToken);
      setUser(normalizedUser);
      setInstitution(nextInstitution);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return false;
    } finally {
      refreshInFlightRef.current = false;
    }
  }, [decodeEnterpriseClaims]);

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

