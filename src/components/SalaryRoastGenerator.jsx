import React, { useMemo, useState, useRef, useCallback } from "react";
import {
  Copy,
  MessageCircle,
  Share2,
  Camera,
  CheckCircle,
  Loader2,
  Link,
  Globe,
  Smartphone,
  Flame,
  TrendingUp,
  Zap
} from "lucide-react";
import {
  generateComparisonReport,
  generateInstagramCaption,
  generateSalaryRoast
} from "../engines/salaryRoast";
import { normalizeScore } from "../lib/scoring-v2.js";
import { roastAnalytics } from "../lib/roastAnalytics.js";

const FEATURED_STAT_LABELS = new Set(["Financial Health Score", "vs National Average"]);

function dedupeByLabel(items = []) {
  const seen = new Set();
  return items.filter(item => {
    if (!item?.label || seen.has(item.label)) {
      return false;
    }
    seen.add(item.label);
    return true;
  });
}

function dedupeText(items = []) {
  const seen = new Set();
  return items.filter(item => {
    const value = String(item || "").trim();
    if (!value || seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

function getComparisonTone(value) {
  return Number(value) >= 0 ? "positive" : "negative";
}

function getBadgeClassName(color) {
  return `salary-roast-badge salary-roast-badge-${color || "default"}`;
}

/**
 * Check if the native Web Share API is available.
 * Prefers it for mobile — opens system share sheet with image support.
 */
function supportsNativeShare() {
  return typeof navigator !== "undefined" && !!navigator.share;
}

export function SalaryRoastGenerator({ assessmentResult, profile }) {
  const [showShare, setShowShare] = useState(true); // default open for discoverability
  const [copyFeedback, setCopyFeedback] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportBlob, setExportBlob] = useState(null); // cached blob for native share
  const [exportDone, setExportDone] = useState(false);
  const roastRef = useRef(null);

  const normalizedHealthScore = useMemo(
    () => normalizeScore(assessmentResult?.healthScore ?? 0),
    [assessmentResult]
  );

  const normalizedAssessmentResult = useMemo(
    () =>
      assessmentResult ? { ...assessmentResult, healthScore: normalizedHealthScore } : assessmentResult,
    [assessmentResult, normalizedHealthScore]
  );

  const roast = useMemo(
    () => (normalizedAssessmentResult && profile ? generateSalaryRoast(normalizedAssessmentResult, profile) : null),
    [normalizedAssessmentResult, profile]
  );

  const comparison = useMemo(
    () =>
      normalizedAssessmentResult
        ? generateComparisonReport(normalizedAssessmentResult.healthScore, normalizedAssessmentResult.personalityType)
        : null,
    [normalizedAssessmentResult]
  );

  const instagramCaption = useMemo(
    () =>
      normalizedAssessmentResult && profile
        ? generateInstagramCaption(
            normalizedAssessmentResult.healthScore,
            normalizedAssessmentResult.personalityType,
            profile.monthlyIncome,
            normalizedAssessmentResult.survivalMonthsRaw
          )
        : "",
    [normalizedAssessmentResult, profile]
  );

  const uniqueStats = useMemo(
    () => dedupeByLabel(roast?.stats).filter(stat => !FEATURED_STAT_LABELS.has(stat.label)),
    [roast]
  );
  const uniqueBadges = useMemo(() => dedupeByLabel(roast?.badges), [roast]);
  const uniqueRoastLines = useMemo(() => dedupeText(roast?.roastCommentary), [roast]);

  const handleCopyText = useCallback(async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(label);
    } catch {
      setCopyFeedback("Copy failed");
    }
    setTimeout(() => setCopyFeedback(""), 2000);
  }, []);

  /** Render the roast card to a canvas then return it (for both download & native share). */
  const renderRoastCard = useCallback(async () => {
    if (!roastRef.current) {
      return null;
    }
    const html2canvas = (await import("html2canvas")).default;
    return html2canvas(roastRef.current, {
      backgroundColor: "#050713",
      scale: 2,
      useCORS: true,
      logging: false,
      width: roastRef.current.scrollWidth,
      height: roastRef.current.scrollHeight
    });
  }, []);

  const handleDownloadImage = useCallback(async () => {
    if (!roastRef.current) {
      return;
    }
    setExporting(true);
    setExportDone(false);
    try {
      const canvas = await renderRoastCard();
      if (!canvas) {
        throw new Error("Canvas render failed");
      }
      const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
      setExportBlob(blob);
      const link = document.createElement("a");
      link.download = "financial-roast-arthos.png";
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
      setExportDone(true);
      setCopyFeedback("Image downloaded!");
    } catch (err) {
      console.error("Image export failed:", err);
      setCopyFeedback("Export failed – try the text share options below");
    } finally {
      setExporting(false);
      setTimeout(() => {
        setExportDone(false);
        setExportBlob(null);
        setCopyFeedback("");
      }, 5000);
    }
  }, [renderRoastCard]);

  /**
   * Native Web Share — opens the OS share sheet (mobile) or browser share dialog.
   * On mobile this is THE best UX: one tap → user's messaging app of choice.
   * Falls back to copying share text if native not available.
   */
  const handleNativeShare = useCallback(async () => {
    try {
      // Try to share as image + text via Web Share API
      let blob = exportBlob;
      if (!blob && roastRef.current) {
        const canvas = await renderRoastCard();
        if (canvas) {
          blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
          setExportBlob(blob);
        }
      }
      const files = blob
        ? [new File([blob], "financial-roast-arthos.png", { type: "image/png" })]
        : [];
      const shareData = {
        text: roast?.shareText || "Check out my Financial Roast! #ArthOS",
        files
      };
      await navigator.share(shareData);
      setCopyFeedback("Shared!");
    } catch (err) {
      if (err.name === "AbortError") {
        return;
      } // user cancelled
      // Fallback: copy share text
      console.warn("Native share failed, falling back to clipboard:", err);
      await handleCopyText(roast?.shareText || "", "Share text copied!");
    }
  }, [exportBlob, roast, renderRoastCard, handleCopyText]);

  const handleCopyLink = useCallback(async () => {
    await handleCopyText(roast?.shareLink || "https://arth-os.dev/roast", "Link copied!");
  }, [roast, handleCopyText]);

  if (!assessmentResult || !profile) {
    return (
      <div className="salary-roast-empty">
        <p>Complete your assessment first to unlock your Financial Roast.</p>
      </div>
    );
  }

  if (!roast || !comparison) {
    return null;
  }

  const comparisonTone = getComparisonTone(roast.comparisonVsAverage);
  const shareTextEncoded = encodeURIComponent(roast.shareText + " #ArthOS #FinancialHealth");
  const shareUrlEncoded = encodeURIComponent(roast.shareLink);

  return (
    <>
      {/* Hidden download trigger – keeps the export reliable */}
      <div
        ref={roastRef}
        className="salary-roast salary-roast-export-target"
        data-export="salary-roast"
      >
        <section className="salary-roast-hero">
          <div className="salary-roast-hero-copy">
            <span className="salary-roast-eyebrow">Personalized money snapshot</span>
            <h3>{roast.headline}</h3>
            <p>
              Your Financial Personality: <strong>{roast.personalityType}</strong>
            </p>
          </div>

          <div className="salary-roast-score-panel">
            <span>Financial Health Score</span>
            <strong>{Math.round(normalizedHealthScore)}</strong>
            <small>/100</small>
            <div className="salary-roast-score-meta">
              <div>
                <span>Percentile</span>
                <strong>{comparison.percentile}th</strong>
              </div>
              <div className={`salary-roast-tone-${comparisonTone}`}>
                <span>vs National Average</span>
                <strong>
                  {roast.comparisonVsAverage >= 0 ? "+" : ""}
                  {roast.comparisonVsAverage}
                </strong>
              </div>
            </div>
          </div>
        </section>

        <div className="salary-roast-detail-grid">
          <section className="salary-roast-panel">
            <div className="salary-roast-panel-heading">
              <span>Your Badges</span>
              <small>{uniqueBadges.length} earned</small>
            </div>
            <div className="salary-roast-badges">
              {uniqueBadges.map(badge => (
                <span key={badge.label} className={getBadgeClassName(badge.color)}>
                  <span aria-hidden="true">{badge.icon}</span>
                  {badge.label}
                </span>
              ))}
            </div>
          </section>

          <section className="salary-roast-panel salary-roast-panel-featured">
            <div className="salary-roast-panel-heading">
              <span>The Roast</span>
              <small>{uniqueRoastLines.length} signals</small>
            </div>
            <div className="salary-roast-notes">
              {uniqueRoastLines.map((line, idx) => (
                <p key={line}>
                  <span>{idx + 1}</span>
                  {line}
                </p>
              ))}
            </div>
          </section>
        </div>

        <div className="salary-roast-stat-grid">
          {uniqueStats.map(stat => (
            <div key={stat.label} className="salary-roast-stat">
              <span>{stat.label}</span>
              <strong>
                {stat.value}
                <small>{stat.unit}</small>
              </strong>
            </div>
          ))}
        </div>

        <section className="salary-roast-comparison">
          <span>Relative benchmark</span>
          <p>{comparison.message}</p>
        </section>

        <section className="salary-roast-compare-panel">
          <h3>How You Compare</h3>
          <div className="salary-roast-compare-grid">
            <div>
              <span>National Average</span>
              <strong>{comparison.nationalAverage}</strong>
            </div>
            <div>
              <span>{assessmentResult.personalityType}s Average</span>
              <strong>{Math.round(comparison.personalityAverage)}</strong>
            </div>
          </div>
        </section>
      </div>

      {/* Action buttons */}
      <div
        style={{
          display: "flex",
          gap: "var(--space-2)",
          padding: "var(--space-3)",
          backgroundColor: "var(--blue-50)",
          borderRadius: "var(--radius-1)",
          marginBottom: "var(--space-3)",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={() => setShowShare(current => !current)}
          aria-expanded={showShare}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            padding: "var(--space-2) var(--space-3)",
            borderRadius: "var(--radius-1)",
            border: "none",
            backgroundColor: "var(--cyan)",
            color: "white",
            fontWeight: "600",
            cursor: "pointer",
            fontSize: "var(--type-sm)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = "var(--teal-700)")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "var(--cyan)")}
        >
          <Share2 size={18} />
          {showShare ? "Hide" : "Show"} viral tools
        </button>

        <button
          type="button"
          onClick={handleDownloadImage}
          disabled={exporting}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            padding: "var(--space-2) var(--space-3)",
            borderRadius: "var(--radius-1)",
            border: "none",
            backgroundColor: exporting ? "var(--blue-50)" : "var(--orange-707)",
            color: exporting ? "var(--ink-2)" : "white",
            fontWeight: "600",
            cursor: exporting ? "not-allowed" : "pointer",
            fontSize: "var(--type-sm)",
            transition: "all 0.2s ease",
            opacity: exporting ? 0.6 : 1,
          }}
          onMouseEnter={(e) =>
            !exporting && (e.target.style.backgroundColor = "#b45309")
          }
          onMouseLeave={(e) =>
            !exporting && (e.target.style.backgroundColor = "var(--orange-707)")
          }
        >
          {exporting ? (
            <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
          ) : exportDone ? (
            <CheckCircle size={18} />
          ) : (
            <Camera size={18} />
          )}
          {exporting ? "Exporting…" : exportDone ? "Downloaded!" : "Export card"}
        </button>

        {copyFeedback && (
          <span
            style={{
              fontSize: "var(--type-xs)",
              color: "var(--green-700)",
              fontWeight: "500",
              animation: "fadeIn 0.2s ease-in",
            }}
          >
            ✓ {copyFeedback}
          </span>
        )}
      </div>

      {showShare && (
        <section
          style={{
            padding: "var(--space-4)",
            backgroundColor: "var(--blue-50)",
            borderRadius: "var(--radius-2)",
            border: "1px solid var(--cyan)",
          }}
        >
          {/* 🌐 NATIVE SHARE — Mobile-first, opens OS share sheet */}
          {supportsNativeShare() && (
            <button
              type="button"
              onClick={handleNativeShare}
              style={{
                width: "100%",
                padding: "var(--space-3)",
                borderRadius: "var(--radius-1)",
                border: "2px solid var(--cyan)",
                backgroundColor: "var(--cyan)",
                color: "white",
                fontWeight: "700",
                cursor: "pointer",
                fontSize: "var(--type-sm)",
                marginBottom: "var(--space-3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "var(--space-2)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "var(--teal-700)";
                e.target.style.borderColor = "var(--teal-700)";
                e.target.style.transform = "scale(1.02)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "var(--cyan)";
                e.target.style.borderColor = "var(--cyan)";
                e.target.style.transform = "scale(1)";
              }}
            >
              <Smartphone size={18} />
              <span>💡 Share with One Tap</span>
              <Flame size={16} style={{ color: "var(--orange-707)" }} />
            </button>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
              marginBottom: "var(--space-3)",
              paddingBottom: "var(--space-3)",
              borderBottom: "1px solid var(--blue-50)",
            }}
          >
            <Globe size={14} style={{ color: "var(--cyan)" }} />
            <span style={{ fontWeight: "600", fontSize: "var(--type-sm)", color: "var(--ink-0)" }}>
              Instant Viral Channels
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "var(--space-2)",
              marginBottom: "var(--space-4)",
            }}
          >
            {/* WhatsApp */}
            <button
              type="button"
              onClick={() => {
                roastAnalytics.trackShare("whatsapp", { assessmentResult });
                window.open(`https://wa.me/?text=${shareTextEncoded}`, "_blank");
              }}
              style={{
                padding: "var(--space-2) var(--space-3)",
                borderRadius: "var(--radius-1)",
                border: "1px solid #25D366",
                backgroundColor: "white",
                color: "#25D366",
                fontWeight: "600",
                cursor: "pointer",
                fontSize: "var(--type-xs)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "var(--space-1)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#25D366";
                e.target.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "white";
                e.target.style.color = "#25D366";
              }}
            >
              <MessageCircle size={16} /> WhatsApp
            </button>

            {/* Telegram */}
            <button
              type="button"
              onClick={() => {
                roastAnalytics.trackShare("telegram", { assessmentResult });
                window.open(
                  `https://t.me/share/url?url=${shareUrlEncoded}&text=${shareTextEncoded}`,
                  "_blank"
                );
              }}
              style={{
                padding: "var(--space-2) var(--space-3)",
                borderRadius: "var(--radius-1)",
                border: "1px solid #0088cc",
                backgroundColor: "white",
                color: "#0088cc",
                fontWeight: "600",
                cursor: "pointer",
                fontSize: "var(--type-xs)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "var(--space-1)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#0088cc";
                e.target.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "white";
                e.target.style.color = "#0088cc";
              }}
            >
              <MessageCircle size={16} /> Telegram
            </button>

            {/* Twitter */}
            <button
              type="button"
              onClick={() => {
                roastAnalytics.trackShare("twitter", { assessmentResult });
                window.open(`https://twitter.com/intent/tweet?text=${shareTextEncoded}`, "_blank");
              }}
              style={{
                padding: "var(--space-2) var(--space-3)",
                borderRadius: "var(--radius-1)",
                border: "1px solid #000000",
                backgroundColor: "white",
                color: "#000000",
                fontWeight: "600",
                cursor: "pointer",
                fontSize: "var(--type-xs)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "var(--space-1)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#000000";
                e.target.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "white";
                e.target.style.color = "#000000";
              }}
            >
              <Zap size={16} /> Twitter
            </button>

            {/* Facebook */}
            <button
              type="button"
              onClick={() => {
                roastAnalytics.trackShare("facebook", { assessmentResult });
                window.open(
                  `https://www.facebook.com/sharer/sharer.php?u=${shareUrlEncoded}&quote=${shareTextEncoded}`,
                  "_blank"
                );
              }}
              style={{
                padding: "var(--space-2) var(--space-3)",
                borderRadius: "var(--radius-1)",
                border: "1px solid #1877F2",
                backgroundColor: "white",
                color: "#1877F2",
                fontWeight: "600",
                cursor: "pointer",
                fontSize: "var(--type-xs)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "var(--space-1)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#1877F2";
                e.target.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "white";
                e.target.style.color = "#1877F2";
              }}
            >
              <Globe size={16} /> Facebook
            </button>

            {/* LinkedIn */}
            <button
              type="button"
              onClick={() => {
                roastAnalytics.trackShare("linkedin", { assessmentResult });
                window.open(
                  `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrlEncoded}`,
                  "_blank"
                );
              }}
              style={{
                padding: "var(--space-2) var(--space-3)",
                borderRadius: "var(--radius-1)",
                border: "1px solid #0A66C2",
                backgroundColor: "white",
                color: "#0A66C2",
                fontWeight: "600",
                cursor: "pointer",
                fontSize: "var(--type-xs)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "var(--space-1)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#0A66C2";
                e.target.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "white";
                e.target.style.color = "#0A66C2";
              }}
            >
              <Share2 size={16} /> LinkedIn
            </button>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
              marginBottom: "var(--space-3)",
              paddingBottom: "var(--space-3)",
              borderBottom: "1px solid var(--blue-50)",
            }}
          >
            <Copy size={14} style={{ color: "var(--cyan)" }} />
            <span style={{ fontWeight: "600", fontSize: "var(--type-sm)", color: "var(--ink-0)" }}>
              Copy Smart Text
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "var(--space-2)",
              marginBottom: "var(--space-3)",
            }}
          >
            {/* Copy share link */}
            <button
              type="button"
              onClick={handleCopyLink}
              style={{
                padding: "var(--space-2) var(--space-3)",
                borderRadius: "var(--radius-1)",
                border: "1px solid var(--cyan)",
                backgroundColor: copyFeedback === "Link copied!" ? "var(--green-50)" : "white",
                color: copyFeedback === "Link copied!" ? "var(--green-700)" : "var(--cyan)",
                fontWeight: "600",
                cursor: "pointer",
                fontSize: "var(--type-xs)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "var(--space-1)",
                transition: "all 0.2s ease",
              }}
            >
              <Link size={16} />
              {copyFeedback === "Link copied!" ? "✓ Copied!" : "Copy Link"}
            </button>

            {/* Copy share text */}
            <button
              type="button"
              onClick={() => handleCopyText(roast.shareText, "Share text copied!")}
              style={{
                padding: "var(--space-2) var(--space-3)",
                borderRadius: "var(--radius-1)",
                border: "1px solid var(--orange-707)",
                backgroundColor: copyFeedback === "Share text copied!" ? "var(--orange-50)" : "white",
                color: copyFeedback === "Share text copied!" ? "var(--orange-707)" : "var(--orange-707)",
                fontWeight: "600",
                cursor: "pointer",
                fontSize: "var(--type-xs)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "var(--space-1)",
                transition: "all 0.2s ease",
              }}
            >
              <Copy size={16} />
              {copyFeedback === "Share text copied!" ? "✓ Copied!" : "Copy Text"}
            </button>

            {/* Copy Instagram caption */}
            <button
              type="button"
              onClick={() => handleCopyText(instagramCaption, "Instagram caption copied!")}
              style={{
                padding: "var(--space-2) var(--space-3)",
                borderRadius: "var(--radius-1)",
                border: "1px solid #E4405F",
                backgroundColor: copyFeedback === "Instagram caption copied!" ? "#FFE5EC" : "white",
                color: copyFeedback === "Instagram caption copied!" ? "#E4405F" : "#E4405F",
                fontWeight: "600",
                cursor: "pointer",
                fontSize: "var(--type-xs)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "var(--space-1)",
                transition: "all 0.2s ease",
              }}
            >
              <Flame size={16} />
              {copyFeedback === "Instagram caption copied!" ? "✓ Copied!" : "Copy Insta"}
            </button>
          </div>

          {/* Share Text Preview */}
          <label
            style={{
              display: "block",
              marginBottom: "var(--space-3)",
            }}
          >
            <span style={{ fontWeight: "600", fontSize: "var(--type-xs)", color: "var(--ink-0)", display: "block", marginBottom: "var(--space-2)" }}>
              Share Text Preview
            </span>
            <textarea
              readOnly
              value={roast.shareText}
              style={{
                width: "100%",
                padding: "var(--space-2)",
                borderRadius: "var(--radius-1)",
                border: "1px solid var(--blue-50)",
                backgroundColor: "white",
                fontSize: "var(--type-xs)",
                fontFamily: "inherit",
                resize: "none",
              }}
              rows="2"
            />
          </label>

          {/* Instagram Caption Preview */}
          <label
            style={{
              display: "block",
            }}
          >
            <span style={{ fontWeight: "600", fontSize: "var(--type-xs)", color: "var(--ink-0)", display: "block", marginBottom: "var(--space-2)" }}>
              Instagram Caption Preview
            </span>
            <textarea
              readOnly
              value={instagramCaption}
              style={{
                width: "100%",
                padding: "var(--space-2)",
                borderRadius: "var(--radius-1)",
                border: "1px solid var(--blue-50)",
                backgroundColor: "white",
                fontSize: "var(--type-xs)",
                fontFamily: "inherit",
                resize: "none",
              }}
              rows="2"
            />
          </label>
        </section>
      )}
    </>
  );
}
