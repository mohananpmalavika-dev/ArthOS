import React, { useMemo } from "react";
import { TrendingUp, Clock, Zap, ChevronRight, Phone, MessageSquare, DollarSign } from "lucide-react";

const generateLendingActions = (customer, defaultRisk) => {
  if (!customer || !defaultRisk) return null;

  const risk = defaultRisk.riskCategory;

  if (risk === 'Very High' || risk === 'High') {
    return {
      title: "Initiate High-Priority Collections Process",
      impact: 9,
      difficulty: "High",
      timeframe: "Immediate",
      description: `Customer ${customer.name} is at a high risk of default. Immediate action is required to mitigate loss.`,
      story: "Prioritizing collections for high-risk accounts is crucial for portfolio health. This action focuses on recovering the outstanding balance.",
      why: "The default prediction model has flagged this customer as high-risk. The sooner we engage, the higher the probability of successful recovery.",
      icon: Phone,
    };
  }

  if (risk === 'Medium') {
    return {
      title: "Schedule a Payment Reminder Call",
      impact: 6,
      difficulty: "Low",
      timeframe: "1-2 days",
      description: `Proactively engage with ${customer.name} to ensure they are aware of their upcoming payment.`,
      story: "A simple reminder can often prevent a payment from becoming late. This is a low-cost way to keep customers on track.",
      why: "The customer is showing early signs of potential risk. A proactive reminder can help them stay current.",
      icon: MessageSquare,
    };
  }

  if (risk === 'Low') {
    return {
      title: "Offer a Pre-Approved Top-Up Loan",
      impact: 7,
      difficulty: "Medium",
      timeframe: "5-7 days",
      description: `Offer ${customer.name} a pre-approved top-up loan of ₹50,000.`,
      story: "This customer has an excellent payment history. Offering them additional credit is a great way to increase revenue from a reliable client.",
      why: "The customer's low-risk profile and excellent payment history make them a prime candidate for cross-selling.",
      icon: DollarSign,
    };
  }

  return null;
};

export default function NextBestActionCard({ customer, defaultRisk, onExpand }) {
  const action = useMemo(() => {
    return generateLendingActions(customer, defaultRisk);
  }, [customer, defaultRisk]);

  if (!action) {
    return (
      <section className="result-card next-best-action-card" style={{ padding: "40px 24px", textAlign: "center" }}>
        <p style={{ margin: 0, color: "var(--ink-3)", lineHeight: 1.6 }}>
          Complete your financial assessment to receive your personalized next best move.
        </p>
      </section>
    );
  }

  return (
    <section
      className="result-card next-best-action-card"
      style={{
        padding: "32px",
        borderRadius: "16px",
        background: "linear-gradient(135deg, var(--blue-50) 0%, var(--teal-50) 100%)",
        border: "2px solid var(--blue-300)",
        cursor: onExpand ? "pointer" : "default"
      }}
      onClick={onExpand}
    >
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <p style={{ margin: 0, fontSize: "13px", color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Next Best Move
        </p>
        <h2 style={{ margin: "12px 0 0", fontSize: "1.6rem", fontWeight: 700, color: "var(--ink-0)", lineHeight: 1.3 }}>
          {action.title}
        </h2>
      </div>

      {/* Story */}
      <p style={{ margin: "0 0 24px", fontSize: "1rem", color: "var(--ink-1)", lineHeight: 1.6, fontWeight: 500 }}>
        {action.story}
      </p>

      {/* Impact Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {/* Impact */}
        <div
          style={{
            padding: "16px",
            borderRadius: "12px",
            background: "var(--surface-2)",
            border: "1px solid var(--border)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <TrendingUp size={18} style={{ color: "var(--emerald)" }} />
            <span style={{ fontSize: "13px", color: "var(--ink-2)", textTransform: "uppercase", fontWeight: 600 }}>
              Impact
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "1.8rem", fontWeight: 700, color: "var(--emerald)" }}>
            +{action.impact}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--muted)" }}>
            readiness pts
          </p>
        </div>

        {/* Difficulty */}
        <div
          style={{
            padding: "16px",
            borderRadius: "12px",
            background: "var(--surface-2)",
            border: "1px solid var(--border)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <Zap size={18} style={{ color: "#f59e0b" }} />
            <span style={{ fontSize: "13px", color: "var(--ink-2)", textTransform: "uppercase", fontWeight: 600 }}>
              Difficulty
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#f59e0b" }}>
            {action.difficulty}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--muted)" }}>
            achievable level
          </p>
        </div>

        {/* Timeframe */}
        <div
          style={{
            padding: "16px",
            borderRadius: "12px",
            background: "var(--surface-2)",
            border: "1px solid var(--border)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <Clock size={18} style={{ color: "var(--cyan)" }} />
            <span style={{ fontSize: "13px", color: "var(--ink-2)", textTransform: "uppercase", fontWeight: 600 }}>
              Timeline
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "var(--cyan)" }}>
            {action.timeframe}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--muted)" }}>
            to completion
          </p>
        </div>
      </div>

      {/* Why Section */}
      <div
        style={{
          padding: "16px",
          borderRadius: "12px",
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          marginBottom: "24px"
        }}
      >
        <p style={{ margin: 0, fontSize: "13px", color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
          Why This Move?
        </p>
        <p style={{ margin: 0, fontSize: "0.95rem", color: "var(--text)", lineHeight: 1.6 }}>
          {action.why}
        </p>
      </div>

      {/* CTA */}
      <button
        style={{
          width: "100%",
          padding: "14px 20px",
          borderRadius: "12px",
          background: "var(--grad-accent)",
          color: "var(--white)",
          border: "none",
          fontSize: "1rem",
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          transition: "all 170ms ease",
          boxShadow: "0 12px 32px rgba(109, 76, 255, 0.25)"
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = "translateY(-1px)";
          e.target.style.boxShadow = "0 18px 40px rgba(109, 76, 255, 0.32)";
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = "translateY(0)";
          e.target.style.boxShadow = "0 12px 32px rgba(109, 76, 255, 0.25)";
        }}
        onClick={onExpand}
      >
        Learn Implementation Steps <ChevronRight size={18} />
      </button>
    </section>
  );
}