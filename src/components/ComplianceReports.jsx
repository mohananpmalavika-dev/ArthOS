import React, { memo, useEffect, useMemo, useState } from "react";
import {
  Download,
  CheckCircle,
  AlertCircle,
  FileText,
  Printer,
  Mail,
  RotateCcw
} from "lucide-react";
import { useEnterpriseAuth } from "../context/EnterpriseAuthContext.jsx";
import { createEnterpriseComplianceApi } from "../lib/enterpriseComplianceApi.js";
import { captureException } from "../lib/errorMonitoring.ts";

const ComplianceReports = memo(() => {
  const { loading: authLoading, accessToken, institution } = useEnterpriseAuth();

  const [reportType, setReportType] = useState("monthly");
  const [reports, setReports] = useState([]);
  const [complianceMetrics, setComplianceMetrics] = useState([]);
  const [auditTrail, setAuditTrail] = useState([]);

  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState(null);

  const api = useMemo(() => {
    if (!accessToken) return null;
    return createEnterpriseComplianceApi({
      getAccessToken: () => accessToken,
      getTenantId: () => institution?.id,
      debug: false,
    });
  }, [accessToken, institution?.id]);

  async function loadAll({ type } = {}) {
    if (!api) return;
    setPageError(null);

    const nextType = type || reportType;

    setPageLoading(true);
    try {
      const [metrics, list, audit] = await Promise.all([
        api.getComplianceMetrics(),
        api.getReports({ type: nextType === "all" ? "all" : nextType }),
        api.getAuditTrail({ limit: 20 }),
      ]);

      setComplianceMetrics(Array.isArray(metrics) ? metrics : metrics?.items || []);
      setReports(Array.isArray(list) ? list : list?.items || []);
      setAuditTrail(Array.isArray(audit) ? audit : audit?.items || []);
    } catch (e) {
      setPageError(e instanceof Error ? e.message : String(e));
      await captureException(e, { context: "ComplianceReports.loadAll" });
    } finally {
      setPageLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading) return;
    if (!api) {
      setPageLoading(false);
      return;
    }
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, api]);

  useEffect(() => {
    if (authLoading || !api) return;
    void loadAll({ type: reportType });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType]);

  const filteredReports = useMemo(() => {
    if (!Array.isArray(reports)) return [];
    if (reportType === "all") return reports;
    return reports.filter((r) => r.type === reportType);
  }, [reports, reportType]);

  const handleGenerate = async () => {
    if (!api) return;
    setGenerationError(null);
    setIsGenerating(true);

    try {
      const genType = reportType === "all" ? "monthly" : reportType;
      await api.generateReport({ type: genType, format: "pdf" });

      // Reload list; backend may create a new item.
      await loadAll({ type: reportType });
    } catch (e) {
      setGenerationError(e instanceof Error ? e.message : String(e));
      await captureException(e, { context: "ComplianceReports.handleGenerate" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (reportId) => {
    if (!api) return;
    try {
      const url = await api.downloadReport({ reportId });
      if (!url) return;
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      await captureException(e, { context: "ComplianceReports.handleDownload" });
    }
  };

  const handlePrint = async (reportId) => {
    if (!api) return;
    try {
      const url = await api.downloadReport({ reportId });
      if (!url) return;
      const w = window.open(url, "_blank", "noopener,noreferrer");
      // Allow browser to load before printing. Some browsers may block; fallback is opening in tab.
      w?.focus?.();
    } catch (e) {
      await captureException(e, { context: "ComplianceReports.handlePrint" });
    }
  };

  const handleEmail = async (reportId) => {
    if (!api) return;
    // In production you likely show a modal. For now, prompt for email.
    const email = window.prompt("Enter email to send report:");
    if (!email) return;

    try {
      await api.emailReport({ reportId, email });
      await loadAll({ type: reportType });
    } catch (e) {
      await captureException(e, { context: "ComplianceReports.handleEmail" });
    }
  };

  return (
    <div className="enterprise-compliance-reports">
      <div className="enterprise-section-header">
        <div>
          <h2 className="enterprise-section-title">Compliance Management</h2>
          <p className="enterprise-section-subtitle">Regulatory reports and audit trails</p>
        </div>
        <button
          className="enterprise-btn-secondary"
          disabled={isGenerating || pageLoading || authLoading}
          onClick={handleGenerate}
          title={isGenerating ? "Generating..." : "Generate report via API"}
        >
          <Download size={16} />
          {isGenerating ? "Generating..." : "Generate Report (API)"}
        </button>
      </div>

      {generationError ? (
        <div className="enterprise-error-banner" role="alert">
          <AlertCircle size={16} /> {generationError}
        </div>
      ) : null}

      {pageLoading ? (
        <div className="enterprise-loading">Loading compliance dashboard...</div>
      ) : pageError ? (
        <div className="enterprise-error-banner" role="alert">
          <AlertCircle size={16} /> {pageError}
          <button className="enterprise-btn-link" onClick={() => void loadAll()}>
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="compliance-metrics-grid">
            {complianceMetrics.map((metric) => (
              <div key={metric.regulation || metric.name} className="compliance-metric-card">
                <div className="metric-header">
                  <div className="metric-name">{metric.regulation || metric.name}</div>
                  {metric.status === "compliant" ? (
                    <CheckCircle size={18} color="#22c55e" />
                  ) : (
                    <AlertCircle size={18} color="#ef4444" />
                  )}
                </div>
                <div className="metric-score">{metric.score}%</div>
                <div className="metric-audit">Last audit: {metric.lastAudit}</div>
              </div>
            ))}
          </div>

          <div className="enterprise-card">
            <div className="card-header">
              <h3>
                <FileText size={16} />
                Generated Reports
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="enterprise-select-compact"
                >
                  <option value="all">All Reports</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="compliance">Compliance</option>
                </select>
                <button
                  className="enterprise-btn-icon"
                  title="Refresh"
                  onClick={() => void loadAll({ type: reportType })}
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>

            <div className="reports-list">
              {filteredReports.length === 0 ? (
                <div className="enterprise-empty-state">No reports found.</div>
              ) : (
                filteredReports.map((report) => (
                  <div key={report.id || report.reportId} className="report-item">
                    <div className="report-icon">
                      <FileText size={20} />
                    </div>
                    <div className="report-info">
                      <div className="report-name">{report.name || report.title}</div>
                      <div className="report-meta">
                        <span>{report.date || report.createdAt}</span>
                        <span>•</span>
                        <span>{report.size || report.sizeLabel || "-"}</span>
                      </div>
                      <div className="report-regulations">
                        {(report.regulations || []).map((reg) => (
                          <span key={reg} className="regulation-tag">
                            {reg}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="report-status">
                      {report.status === "completed" || report.status === "ready" ? (
                        <span className="status-badge completed">Ready</span>
                      ) : report.status === "failed" ? (
                        <span className="status-badge pending">Failed</span>
                      ) : (
                        <span className="status-badge pending">Pending</span>
                      )}
                    </div>
                    <div className="report-actions">
                      <button
                        className="enterprise-btn-icon"
                        title="Download"
                        disabled={!(report.id || report.reportId) || report.status !== "completed"}
                        onClick={() => handleDownload(report.id || report.reportId)}
                      >
                        <Download size={14} />
                      </button>
                      <button
                        className="enterprise-btn-icon"
                        title="Print"
                        disabled={!(report.id || report.reportId) || report.status !== "completed"}
                        onClick={() => handlePrint(report.id || report.reportId)}
                      >
                        <Printer size={14} />
                      </button>
                      <button
                        className="enterprise-btn-icon"
                        title="Email"
                        disabled={!(report.id || report.reportId) || report.status !== "completed"}
                        onClick={() => handleEmail(report.id || report.reportId)}
                      >
                        <Mail size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="enterprise-card">
            <div className="card-header">
              <h3>Audit Trail</h3>
              <button
                className="enterprise-btn-link"
                onClick={() => {
                  // Production likely needs a paginated modal/page.
                  // For now, it refreshes the list.
                  void loadAll({ type: reportType });
                }}
              >
                View Full History
              </button>
            </div>
            <div className="audit-trail">
              {auditTrail.length === 0 ? (
                <div className="enterprise-empty-state">No audit events found.</div>
              ) : (
                auditTrail.map((entry) => (
                  <div key={entry.id || entry.eventId} className="audit-entry">
                    <div className={`audit-icon ${entry.status || entry.level || "info"}`}>
                      {(entry.status || entry.level) === "success" || entry.status === "ok" ? "OK" : "!"}
                    </div>
                    <div className="audit-info">
                      <div className="audit-action">{entry.action || entry.event}</div>
                      <div className="audit-details">
                        <span>{entry.user || entry.actor || "-"}</span>
                        <span>•</span>
                        <span>{entry.timestamp || entry.time}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
});

ComplianceReports.displayName = "ComplianceReports";

export default ComplianceReports;
