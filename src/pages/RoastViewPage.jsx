import React, { useMemo, useState, useEffect } from "react";
import {
  Share2,
  Smartphone,
  MessageCircle,
  Globe,
  Copy,
  Link,
  ArrowRight,
  AlertCircle
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { SalaryRoastGenerator } from "../components/SalaryRoastGenerator.jsx";
import { roastAnalytics } from "../lib/roastAnalytics.js";
import { injectOGTags } from "../lib/ogTagsGenerator.js";
import "./roast-view.css";

/**
 * RoastViewPage
 *
 * Displays a shared roast from a URL (e.g., /roast/abc123).
 * This is the viral loop endpoint:
 * 1. User A shares their roast via WhatsApp/Twitter
 * 2. User B clicks the link
 * 3. User B lands on this page
 * 4. User B sees the roast
 * 5. User B clicks "Generate Your Own" → starts assessment flow
 *
 * The :id is base64-encoded JSON containing score & personality
 */
export function RoastViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [decodedPayload, setDecodedPayload] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState("");

  // Decode the payload from URL parameter
  useEffect(() => {
    if (!id) {
      setError("Invalid roast link");
      return;
    }

    try {
      // Track the roast view for analytics
      roastAnalytics.trackRoastView(
        id,
        new URLSearchParams(window.location.search).get("utm_source") || "direct"
      );

      // Decode base64 payload (it's truncated to 8 chars for short URLs)
      // The original full payload is stored in memory/localStorage on client
      // If not available, show limited preview
      function base64DecodeUnicode(str) {
        try {
          return decodeURIComponent(
            atob(str)
              .split("")
              .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join("")
          );
        } catch (e) {
          // Fallback: try direct atob if Unicode decode fails
          return atob(str);
        }
      }

      const decoded = base64DecodeUnicode(id);
      const payload = JSON.parse(decoded);

      // Validate payload structure
      if (!payload.score || !payload.personality) {
        setError("Invalid roast data");
        return;
      }

      setDecodedPayload(payload);
    } catch (err) {
      console.error("Failed to decode roast:", err);
      setError("Could not decode roast link. It may be expired or invalid.");
    }
  }, [id]);

  // Inject OG tags when payload is decoded (for social preview optimization)
  useEffect(() => {
    if (decodedPayload) {
      injectOGTags(decodedPayload);
    }
  }, [decodedPayload]);

  const handleGenerateYourOwn = () => {
    // Track the CTA click for viral funnel analysis
    roastAnalytics.trackGenerateYourOwnCTA("roast_view");

    // Navigate to assessment with referral tracking
    navigate("/?ref=roast-share&utm_source=viral&utm_medium=shared_roast");

    // Track viral activation via analytics service
    roastAnalytics.trackRoastGenerated("unknown", 0); // Will be updated after assessment
  };

  const handleCopyLink = async () => {
    try {
      const link = window.location.href;
      await navigator.clipboard.writeText(link);
      setCopied("link");
      setTimeout(() => setCopied(""), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleCopyShareText = async () => {
    try {
      const text = generateShareTextFromPayload(decodedPayload);
      await navigator.clipboard.writeText(text);
      setCopied("text");
      setTimeout(() => setCopied(""), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  if (error) {
    return (
      <div className="roast-view-error-container">
        <div className="roast-view-error-card">
          <AlertCircle size={48} className="roast-view-error-icon" />
          <h2>Oops! Invalid Roast Link</h2>
          <p>{error}</p>
          <button onClick={handleGenerateYourOwn} className="roast-view-cta-button">
            Generate Your Own Roast
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  if (!decodedPayload) {
    return (
      <div className="roast-view-loading-container">
        <div className="roast-view-loading-spinner" />
        <p>Loading your roast...</p>
      </div>
    );
  }

  const { score, personality } = decodedPayload;

  // Generate a fake assessment result for display
  // In production, this could be enhanced with more data from the payload
  const mockAssessment = generateMockAssessmentFromPayload(decodedPayload);
  const mockProfile = {
    monthlyIncome: 75000, // Estimated from score
    monthlyExpenses: 55000
  };

  return (
    <div className="roast-view-page">
      {/* Header with social proof */}
      <section className="roast-view-header">
        <div className="roast-view-header-content">
          <div className="roast-view-header-badge">🔥 FINANCIAL ROAST</div>
          <h1>Your friend got roasted!</h1>
          <p className="roast-view-subheading">
            They're a <strong>{personality}</strong> with a <strong>{score}/100</strong> financial
            health score.
            <br />
            Curious about yours? It's quick, honest, and brutally accurate.
          </p>
        </div>
      </section>

      {/* The Roast Card itself */}
      <section className="roast-view-card-container">
        <SalaryRoastGenerator assessmentResult={mockAssessment} profile={mockProfile} />
      </section>

      {/* Social Proof / Share Stats */}
      <section className="roast-view-social-proof">
        <div className="roast-view-stat">
          <span className="roast-view-stat-label">Shares</span>
          <strong className="roast-view-stat-value">Loading...</strong>
        </div>
        <div className="roast-view-stat">
          <span className="roast-view-stat-label">People Roasted</span>
          <strong className="roast-view-stat-value">Loading...</strong>
        </div>
        <div className="roast-view-stat">
          <span className="roast-view-stat-label">Avg. Time to Improve</span>
          <strong className="roast-view-stat-value">14 days</strong>
        </div>
      </section>

      {/* Share this roast */}
      <section className="roast-view-share-section">
        <h3>Share This Roast</h3>
        <div className="roast-view-share-buttons">
          <button
            onClick={() => {
              const text = encodeURIComponent(
                generateShareTextFromPayload(decodedPayload) + " " + window.location.href
              );
              window.open(`https://wa.me/?text=${text}`, "_blank");
              roastAnalytics.trackShare("whatsapp", {
                score: decodedPayload.score,
                personality: decodedPayload.personality
              });
            }}
            className="roast-view-share-btn roast-view-share-btn-whatsapp"
          >
            <MessageCircle size={20} />
            WhatsApp
          </button>

          <button
            onClick={() => {
              const text = encodeURIComponent(
                generateShareTextFromPayload(decodedPayload) + " " + window.location.href
              );
              window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
              roastAnalytics.trackShare("twitter", {
                score: decodedPayload.score,
                personality: decodedPayload.personality
              });
            }}
            className="roast-view-share-btn roast-view-share-btn-twitter"
          >
            <MessageCircle size={20} />
            Twitter
          </button>

          <button
            onClick={handleCopyLink}
            className="roast-view-share-btn roast-view-share-btn-link"
          >
            <Link size={20} />
            {copied === "link" ? "Copied!" : "Copy Link"}
          </button>
        </div>
      </section>

      {/* Big CTA to generate your own */}
      <section className="roast-view-cta-section">
        <div className="roast-view-cta-card">
          <h2>Ready for Your Financial Roast? 🔥</h2>
          <p>
            Get a personalized financial health assessment, survival window, and tailored action
            plan. Takes just 5 minutes.
          </p>
          <button
            onClick={handleGenerateYourOwn}
            className="roast-view-cta-button roast-view-cta-primary"
          >
            Generate Your Roast Now
            <ArrowRight size={20} />
          </button>
          <p className="roast-view-cta-subtext">Free. No sign-up required. Honest feedback.</p>
        </div>
      </section>

      {/* Trust indicators */}
      <section className="roast-view-trust">
        <div className="roast-view-trust-item">
          <div className="roast-view-trust-icon">✓</div>
          <div>
            <strong>Private & Secure</strong>
            <p>Your data is never shared. SMS-only data collection.</p>
          </div>
        </div>
        <div className="roast-view-trust-item">
          <div className="roast-view-trust-icon">✓</div>
          <div>
            <strong>Science-Backed</strong>
            <p>Based on the BAS™ framework (Behaviour, Awareness, Stability).</p>
          </div>
        </div>
        <div className="roast-view-trust-item">
          <div className="roast-view-trust-icon">✓</div>
          <div>
            <strong>Instant Results</strong>
            <p>Get your score, insights, and action plan instantly.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * Helper: Generate mock assessment from minimal payload
 * In production, could retrieve full data from backend
 */
function generateMockAssessmentFromPayload(payload) {
  const { score, personality } = payload;

  // Estimate other scores based on health score
  const behaviourScore = Math.max(5, Math.min(40, score * 0.4));
  const awarenessScore = Math.max(5, Math.min(30, score * 0.3));
  const stabilityScore = Math.max(5, Math.min(30, score * 0.3));

  const survivalMonthsRaw = (score / 100) * 12; // Rough estimate

  return {
    healthScore: score,
    behaviourScore,
    awarenessScore,
    stabilityScore,
    personalityType: personality,
    survivalMonthsRaw,
    futureRiskLabel: score >= 70 ? "Low" : score >= 50 ? "Medium" : "High",
    categoryBand: score >= 75 ? "Resilient" : score >= 50 ? "Developing" : "Fragile"
  };
}

/**
 * Generate share text from minimal payload
 */
function generateShareTextFromPayload(payload) {
  const { score, personality } = payload;

  const templates = [
    `I just got my Financial Roast 🔥 I'm a ${personality} with a ${score}/100 score! What about you?`,
    `My financial health score: ${score}/100. I'm a ${personality}. Check out yours! 👇`,
    `Just got brutally honest feedback about my finances. I'm a ${personality}. This is eye-opening! 🔥`,
    `Financial Roast reveals I'm a ${personality} (${score}/100). Curious about your score?`
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Track viral shares for analytics
 */
function trackViralShare(platform) {
  console.log(`[Analytics] Viral share: ${platform}`);
  if (window.gtag) {
    window.gtag("event", "roast_viral_share", {
      platform,
      platform_type: "social"
    });
  }
}
