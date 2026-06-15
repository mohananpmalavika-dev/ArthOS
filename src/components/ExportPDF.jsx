import React, { useState } from "react";
import { Download, Loader } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { normalizeScore } from "../lib/scoring-v2";

export default function ExportPDF({ result, assessmentData }) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState("");

  const handleExportPDF = async () => {
    if (!result) {
      setError("No assessment data to export");
      return;
    }

    setIsExporting(true);
    setError("");

    try {
      // Create a temporary div with the content to export
      const exportContent = document.createElement("div");
      exportContent.style.cssText = `
        width: 800px;
        padding: 40px;
        background: white;
        color: #000;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
      `;

      const healthScorePercentage = normalizeScore(result.healthScore ?? 0);
      const timestamp = new Date().toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });

      exportContent.innerHTML = `
        <div style="margin-bottom: 40px; border-bottom: 2px solid #8b5cf6; padding-bottom: 20px;">
          <h1 style="margin: 0; font-size: 32px; font-weight: 900; color: #050713;">
            ARTH.OS Financial Health Report
          </h1>
          <p style="margin: 8px 0 0; color: #666; font-size: 14px;">
            Generated on ${timestamp}
          </p>
        </div>

        <div style="margin-bottom: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div>
              <p style="margin: 0; color: #666; font-size: 12px; font-weight: 700; text-transform: uppercase;">Health Score</p>
              <h2 style="margin: 6px 0 0; font-size: 48px; font-weight: 900; color: #050713;">
                ${healthScorePercentage}<span style="font-size: 24px;">/100</span>
              </h2>
            </div>
            <div>
              <p style="margin: 0; color: #666; font-size: 12px; font-weight: 700; text-transform: uppercase;">Health Status</p>
              <h3 style="margin: 6px 0 0; font-size: 24px; font-weight: 800; color: ${getHealthStatusColor(healthScorePercentage)};">
                ${getHealthStatus(healthScorePercentage)}
              </h3>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
            <div style="padding: 12px; background: white; border-radius: 6px; border: 1px solid #ddd;">
              <p style="margin: 0; color: #666; font-size: 11px; font-weight: 700;">BEHAVIOUR</p>
              <p style="margin: 6px 0 0; font-size: 18px; font-weight: 900; color: #050713;">${Math.round(result.componentScores?.behaviour ?? 0)}</p>
            </div>
            <div style="padding: 12px; background: white; border-radius: 6px; border: 1px solid #ddd;">
              <p style="margin: 0; color: #666; font-size: 11px; font-weight: 700;">AWARENESS</p>
              <p style="margin: 6px 0 0; font-size: 18px; font-weight: 900; color: #050713;">${Math.round(result.componentScores?.awareness ?? 0)}</p>
            </div>
            <div style="padding: 12px; background: white; border-radius: 6px; border: 1px solid #ddd;">
              <p style="margin: 0; color: #666; font-size: 11px; font-weight: 700;">STABILITY</p>
              <p style="margin: 6px 0 0; font-size: 18px; font-weight: 900; color: #050713;">${Math.round(result.componentScores?.stability ?? 0)}</p>
            </div>
          </div>
        </div>

        ${
          result.blindSpotData
            ? `
          <div style="margin-bottom: 30px; padding: 20px; background: #f0f9ff; border-radius: 8px; border-left: 4px solid #62e4d1;">
            <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 800; color: #050713;">Visibility Blindspot</h3>
            <p style="margin: 0 0 12px; color: #333; font-size: 13px; line-height: 1.6;">
              Perceived Runway: <strong>${result.blindSpotData.perceivedMonths} months</strong> vs 
              Actual: <strong>${result.blindSpotData.actualMonths} months</strong>
            </p>
            <p style="margin: 0; color: #666; font-size: 12px; line-height: 1.5;">
              ${result.blindSpotData.insight}
            </p>
          </div>
        `
            : ""
        }

        ${
          result.recommendedActions && result.recommendedActions.length > 0
            ? `
          <div style="margin-bottom: 30px;">
            <h3 style="margin: 0 0 16px; font-size: 16px; font-weight: 800; color: #050713;">Recommended Actions</h3>
            ${result.recommendedActions
              .map(
                (action, idx) => `
              <div style="margin-bottom: 12px; padding: 14px; background: #faf3ff; border-radius: 6px; border-left: 3px solid #8b5cf6;">
                <p style="margin: 0 0 4px; font-weight: 700; color: #050713; font-size: 13px;">
                  ${idx + 1}. ${action.title || "Action"}
                </p>
                <p style="margin: 0; color: #555; font-size: 12px; line-height: 1.4;">
                  ${action.description || action}
                </p>
              </div>
            `
              )
              .join("")}
          </div>
        `
            : ""
        }

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 11px; text-align: center;">
          <p style="margin: 0;">This report was generated by ARTH.OS — your personal financial intelligence system.</p>
          <p style="margin: 6px 0 0;">Keep this secure and do not share with untrusted parties.</p>
        </div>
      `;

      document.body.appendChild(exportContent);

      // Convert to canvas
      const canvas = await html2canvas(exportContent, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: true
      });

      // Create PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const imgData = canvas.toDataURL("image/png");
      const imgWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }

      // Download
      const filename = `ARTH-OS-Report-${new Date().toISOString().split("T")[0]}.pdf`;
      pdf.save(filename);

      // Cleanup
      document.body.removeChild(exportContent);
      setIsExporting(false);
    } catch (err) {
      console.error("PDF export failed:", err);
      setError("Failed to export PDF. Please try again.");
      setIsExporting(false);
    }
  };

  if (!result) {
    return null;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <button
        onClick={handleExportPDF}
        disabled={isExporting}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          minHeight: "40px",
          padding: "0 16px",
          borderRadius: "8px",
          border: "1px solid rgba(98, 228, 209, 0.3)",
          backgroundColor: "rgba(98, 228, 209, 0.06)",
          color: isExporting ? "rgba(98, 228, 209, 0.5)" : "#62e4d1",
          fontSize: "12px",
          fontWeight: "800",
          cursor: isExporting ? "not-allowed" : "pointer",
          opacity: isExporting ? 0.6 : 1,
          transition: "all 160ms ease"
        }}
      >
        {isExporting ? (
          <>
            <Loader size={16} style={{ animation: "spin 1s linear infinite" }} />
            Exporting...
          </>
        ) : (
          <>
            <Download size={16} />
            Export as PDF
          </>
        )}
      </button>
      {error && (
        <span style={{ color: "#ff6f91", fontSize: "11px", fontWeight: "700" }}>{error}</span>
      )}
    </div>
  );
}

function getHealthStatus(score) {
  if (score < 20) {
    return "Critical";
  }
  if (score < 40) {
    return "Fragile";
  }
  if (score < 60) {
    return "Developing";
  }
  if (score < 80) {
    return "Resilient";
  }
  return "Sovereign";
}

function getHealthStatusColor(score) {
  if (score < 20) {
    return "#ff6f91";
  }
  if (score < 40) {
    return "#f4b255";
  }
  if (score < 60) {
    return "#8b5cf6";
  }
  if (score < 80) {
    return "#62e4d1";
  }
  return "#73f0bf";
}
