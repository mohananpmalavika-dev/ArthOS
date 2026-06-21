import React, { memo, useState } from "react";
import {
  FileText,
  Download,
  Calendar,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Printer,
  Mail
} from "lucide-react";

const ComplianceReports = memo(() => {
  const [reportType, setReportType] = useState("monthly");

  const reports = [
    {
      id: 1,
      name: "Monthly Compliance Report - June 2024",
      type: "monthly",
      date: "2024-06-30",
      status: "completed",
      size: "2.4 MB",
      regulations: ["GDPR", "PCI-DSS", "SOX"]
    },
    {
      id: 2,
      name: "Quarterly Risk Assessment - Q2 2024",
      type: "quarterly",
      date: "2024-06-30",
      status: "completed",
      size: "5.8 MB",
      regulations: ["Basel III", "BCBS", "AML/KYC"]
    },
    {
      id: 3,
      name: "Anti-Money Laundering Report",
      type: "compliance",
      date: "2024-06-15",
      status: "pending",
      size: "—",
      regulations: ["AML/KYC", "CTF"]
    },
    {
      id: 4,
      name: "Data Protection Impact Assessment",
      type: "compliance",
      date: "2024-06-20",
      status: "completed",
      size: "3.1 MB",
      regulations: ["GDPR"]
    }
  ];

  const auditTrail = [
    {
      id: 1,
      action: "Portfolio risk assessment completed",
      user: "Admin User",
      timestamp: "2024-06-19 14:32:00",
      status: "success"
    },
    {
      id: 2,
      action: "Compliance threshold alert triggered",
      user: "System",
      timestamp: "2024-06-19 12:15:00",
      status: "warning"
    },
    {
      id: 3,
      action: "Customer data sync completed",
      user: "Admin User",
      timestamp: "2024-06-18 23:45:00",
      status: "success"
    }
  ];

  const complianceMetrics = [
    {
      regulation: "GDPR Compliance",
      score: 98,
      lastAudit: "2024-06-15",
      status: "compliant"
    },
    {
      regulation: "PCI-DSS",
      score: 100,
      lastAudit: "2024-06-10",
      status: "compliant"
    },
    {
      regulation: "Basel III",
      score: 95,
      lastAudit: "2024-06-12",
      status: "compliant"
    },
    {
      regulation: "AML/KYC",
      score: 92,
      lastAudit: "2024-06-18",
      status: "compliant"
    }
  ];

  const filteredReports = reports.filter((r) =>
    reportType === "all" ? true : r.type === reportType
  );

  return (
    <div className="enterprise-compliance-reports">
      {/* Header */}
      <div className="enterprise-section-header">
        <div>
          <h2 className="enterprise-section-title">Compliance Management</h2>
          <p className="enterprise-section-subtitle">
            Regulatory reports and audit trails
          </p>
        </div>
        <button className="enterprise-btn-secondary">
          <Download size={16} />
          Generate Report
        </button>
      </div>

      {/* Compliance Metrics */}
      <div className="compliance-metrics-grid">
        {complianceMetrics.map((metric) => (
          <div key={metric.regulation} className="compliance-metric-card">
            <div className="metric-header">
              <div className="metric-name">{metric.regulation}</div>
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

      {/* Reports */}
      <div className="enterprise-card">
        <div className="card-header">
          <h3>
            <FileText size={16} />
            Generated Reports
          </h3>
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
        </div>
        <div className="reports-list">
          {filteredReports.map((report) => (
            <div key={report.id} className="report-item">
              <div className="report-icon">
                <FileText size={20} />
              </div>
              <div className="report-info">
                <div className="report-name">{report.name}</div>
                <div className="report-meta">
                  <span>{report.date}</span>
                  <span>•</span>
                  <span>{report.size}</span>
                </div>
                <div className="report-regulations">
                  {report.regulations.map((reg) => (
                    <span key={reg} className="regulation-tag">
                      {reg}
                    </span>
                  ))}
                </div>
              </div>
              <div className="report-status">
                {report.status === "completed" ? (
                  <span className="status-badge completed">✓ Ready</span>
                ) : (
                  <span className="status-badge pending">⏳ Pending</span>
                )}
              </div>
              <div className="report-actions">
                <button className="enterprise-btn-icon" title="Download">
                  <Download size={14} />
                </button>
                <button className="enterprise-btn-icon" title="Print">
                  <Printer size={14} />
                </button>
                <button className="enterprise-btn-icon" title="Email">
                  <Mail size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Trail */}
      <div className="enterprise-card">
        <div className="card-header">
          <h3>Audit Trail</h3>
          <button className="enterprise-btn-link">View Full History →</button>
        </div>
        <div className="audit-trail">
          {auditTrail.map((entry) => (
            <div key={entry.id} className="audit-entry">
              <div className={`audit-icon ${entry.status}`}>
                {entry.status === "success" ? "✓" : "⚠"}
              </div>
              <div className="audit-info">
                <div className="audit-action">{entry.action}</div>
                <div className="audit-details">
                  <span>{entry.user}</span>
                  <span>•</span>
                  <span>{entry.timestamp}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

ComplianceReports.displayName = "ComplianceReports";

export default ComplianceReports;
