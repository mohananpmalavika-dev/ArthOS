import { captureException, captureMessage } from "./errorMonitoring.ts";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

function buildQuery(params = {}) {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null);
  const sp = new URLSearchParams();
  for (const [k, v] of entries) sp.append(k, String(v));
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export function createApiClient({ getAccessToken, getTenantId, debug = false } = {}) {
  async function request(path, { method = "GET", params, body, headers } = {}) {
    const token = typeof getAccessToken === "function" ? getAccessToken() : null;
    const tenantId = typeof getTenantId === "function" ? getTenantId() : undefined;

    const url = `${API_BASE}${path}${params ? buildQuery(params) : ""}`;

    const finalHeaders = {
      "Content-Type": body ? "application/json" : undefined,
      ...headers,
    };

    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`;
    }
    if (tenantId) {
      finalHeaders["X-Tenant-Id"] = tenantId;
    }

    if (!finalHeaders["Content-Type"]) delete finalHeaders["Content-Type"]; 

    const started = Date.now();

    try {
      const res = await fetch(url, {
        method,
        headers: finalHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });

      const durationMs = Date.now() - started;

      if (!res.ok) {
        let errBody;
        try {
          errBody = await res.json();
        } catch {
          errBody = null;
        }

        const err = new Error(errBody?.error || `API ${method} ${path} failed: ${res.status}`);
        err.status = res.status;
        err.body = errBody;

        await captureException(err, {
          context: "apiClient",
          request: { method, path, durationMs },
          tenantId,
          status: res.status,
          errBody,
        });

        throw err;
      }

      // attempt json, else text
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        return await res.json();
      }
      return await res.text();
    } catch (e) {
      if (debug) {
        await captureMessage(`API error: ${String(e?.message || e)}`, "error", { path, tenantId });
      }
      throw e;
    }
  }

  return {
    request,
    get: (path, opts) => request(path, { ...(opts || {}), method: "GET" }),
    post: (path, opts) => request(path, { ...(opts || {}), method: "POST" }),
    put: (path, opts) => request(path, { ...(opts || {}), method: "PUT" }),
    del: (path, opts) => request(path, { ...(opts || {}), method: "DELETE" }),
  };
}

