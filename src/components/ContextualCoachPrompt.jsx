import React, { useState } from "react";
import { MessageCircle, ChevronRight, X } from "lucide-react";

export default function ContextualCoachPrompt({
  context = "general",
  headline = "Ask Your Coach",
  prompt = "I'm here to help. What would you like to know?",
  onOpenCoach,
  minimal = false
}) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  // Minimal inline version (appears without button)
  if (minimal) {
    return (
      <div
        style={{
          padding: "12px 16px",
          borderRadius: "8px",
          background: "var(--purple-50)",
          border: "1px solid var(--purple-200)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          fontSize: "0.9rem",
          color: "var(--ink-1)"
        }}
      >
        <MessageCircle size={16} style={{ color: "var(--purple-600)", flexShrink: 0 }} />
        <span>
          <strong>{headline}</strong> {prompt}
        </span>
      </div>
    );
  }

  // Full card version
  return (
    <div
      style={{
        padding: "20px",
        borderRadius: "12px",
        background: "linear-gradient(135deg, var(--purple-50) 0%, var(--blue-50) 100%)",
        border: "1px solid var(--purple-200)",
        position: "relative",
        display: "flex",
        alignItems: "flex-start",
        gap: "16px"
      }}
    >
      {/* Close button */}
      <button
        onClick={() => setDismissed(true)}
        style={{
          position: "absolute",
          top: "12px",
          right: "12px",
          background: "none",
          border: "none",
          color: "var(--ink-3)",
          cursor: "pointer",
          padding: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
        aria-label="Dismiss coach prompt"
      >
        <X size={16} />
      </button>

      {/* Icon */}
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "12px",
          background: "var(--white)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--purple-600)",
          flexShrink: 0
        }}
      >
        <MessageCircle size={20} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, paddingRight: "24px" }}>
        <h4 style={{ margin: "0 0 8px", fontSize: "1rem", fontWeight: 600, color: "var(--ink-0)" }}>
          {headline}
        </h4>
        <p style={{ margin: "0 0 16px", fontSize: "0.9rem", color: "var(--ink-3)", lineHeight: 1.5 }}>
          {prompt}
        </p>

        {/* CTA */}
        <button
          onClick={onOpenCoach}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "8px",
            background: "var(--purple-600)",
            color: "var(--white)",
            border: "none",
            fontSize: "0.9rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "background 0.2s"
          }}
          onMouseEnter={(e) => (e.target.style.background = "var(--purple-700)")}
          onMouseLeave={(e) => (e.target.style.background = "var(--purple-600)")}
        >
          Start Conversation <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
