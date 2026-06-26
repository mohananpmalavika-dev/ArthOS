import { createApiClient } from "./apiClient.js";
import { captureException } from "./errorMonitoring.ts";

export function createEnterpriseComplianceApi({
  getAccessToken,
  getTenantId,
  debug = false,
} = {}) {
  const api = createApiClient({ getAccessToken, getTenantId, debug });

  // Endpoint assumptions (adjust to match backend)
  // - GET  /api/enterprise/compliance/metrics
  // - GET  /api/enterprise/compliance/reports?type=monthly|quarterly|compliance|all
  // - GET  /api/enterprise/compliance/audit-trail?limit=..&cursor=..
  // - POST /api/enterprise/compliance/reports/generate
  //      body: { type: 'monthly'|'quarterly'|'compliance'|'all', format:'pdf' }
  //   Response: { reportId, status: 'processing'|'completed'|'failed' }
  // - GET  /api/enterprise/compliance/reports/:reportId/status
  //   Response: { status, downloadUrl }
  // - POST /api/enterprise/compliance/reports/:reportId/email
  //   body: { email }

  async function getComplianceMetrics() {
    return api.get("/enterprise/compliance/metrics");
  }

  async function getReports({ type = "all" } = {}) {
    return api.get("/enterprise/compliance/reports", { params: { type } });
  }

  async function getAuditTrail({ limit = 20, cursor } = {}) {
    return api.get("/enterprise/compliance/audit-trail", {
      params: { limit, cursor },
    });
  }

  async function generateReport({ type = "monthly", format = "pdf" } = {}) {
    return api.post("/enterprise/compliance/reports/generate", {
      body: { type, format },
    });
  }

  async function getReportStatus({ reportId } = {}) {
    return api.get(`/enterprise/compliance/reports/${encodeURIComponent(reportId)}/status`);
  }

  async function downloadReport({ reportId } = {}) {
    const status = await getReportStatus({ reportId });
    return status?.downloadUrl || null;
  }

  async function emailReport({ reportId, email } = {}) {
    return api.post(`/enterprise/compliance/reports/${encodeURIComponent(reportId)}/email`, {
      body: { email },
    });
  }

  return {
    getComplianceMetrics,
    getReports,
    getAuditTrail,
    generateReport,
    getReportStatus,
    downloadReport,
    emailReport,
    api,
  };
}

export async function safeCaptureEnterpriseComplianceError(
  err,
  context = {}
) {
  try {
    await captureException(err, {
      context: "enterpriseCompliance",
      ...context,
    });
  } catch {
    // no-op
  }
}

