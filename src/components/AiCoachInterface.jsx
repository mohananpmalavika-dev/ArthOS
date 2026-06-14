/**
 * AI Coach Chat Interface
 *
 * ARTH.OS V4 Context-First Coach Architecture
 * - Context panel shows user's financial situation, health score, and weekly mission
 * - Chat interface for personalized coaching below
 * - Integrated with assessment results for personalized guidance
 */

import React, { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  Send,
  Settings,
  ChevronDown,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  BarChart3,
  X,
  Plus,
  Clock,
  Loader,
  Star,
  Brain,
  TrendingDown,
  Target,
  Zap
} from "lucide-react";

const AiCoachInterface = ({ userId, result, assessment }) => {
  // Session state
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);

  // Memory and preferences
  const [coachMemory, setCoachMemory] = useState(null);
  const [preferences, setPreferences] = useState({
    coachingStyle: "compassionate",
    responseLength: "detailed"
  });

  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [coachGreeting, setCoachGreeting] = useState("");

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load coaching memory on mount
  useEffect(() => {
    loadCoachingMemory();
    loadAnalytics();
  }, [userId]);

  // Load coaching memory and preferences
  const loadCoachingMemory = async () => {
    try {
      const res = await fetch(`/api/coach/memory?userId=${userId}`);
      const data = await res.json();

      if (data.success) {
        setCoachMemory(data.memory);
        if (data.memory) {
          setPreferences({
            coachingStyle: data.memory.preferred_coaching_style || "compassionate",
            responseLength: data.memory.response_length_preference || "detailed"
          });
        }
      }
    } catch (error) {
      console.error("Error loading coaching memory:", error);
    }
  };

  // Load analytics
  const loadAnalytics = async () => {
    try {
      const res = await fetch(`/api/coach/analytics?userId=${userId}`);
      const data = await res.json();

      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error("Error loading analytics:", error);
    }
  };

  // Start new session
  const startSession = async (primaryConcern = null) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/coach/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, primaryConcern })
      });

      const data = await res.json();

      if (data.success) {
        setSessionId(data.sessionId);
        setSessionActive(true);
        setMessages([]);
        setCoachGreeting(data.coachGreeting);

        // Add coach greeting as first message
        if (data.coachGreeting) {
          setMessages([
            {
              id: "greeting",
              type: "coach",
              content: data.coachGreeting,
              timestamp: new Date().toISOString()
            }
          ]);
        }
      }
    } catch (error) {
      console.error("Error starting session:", error);
      alert("Failed to start coaching session");
    } finally {
      setIsLoading(false);
    }
  };

  // Send message
  const sendMessage = async e => {
    e.preventDefault();
    if (!inputMessage.trim() || !sessionId) {
      return;
    }

    const userMessage = inputMessage;
    setInputMessage("");
    setIsLoading(true);

    // Add user message to UI
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        type: "user",
        content: userMessage,
        timestamp: new Date().toISOString()
      }
    ]);

    try {
      const res = await fetch(`/api/coach/sessions/${sessionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, message: userMessage })
      });

      const data = await res.json();

      if (data.success) {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString() + "coach",
            type: "coach",
            content: data.coachResponse,
            confidence: data.tokensUsed,
            timestamp: new Date().toISOString()
          }
        ]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString() + "error",
          type: "error",
          content: "Sorry, I encountered an error. Please try again.",
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  // Generate recommendation
  const generateRecommendation = async () => {
    if (!sessionId) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/coach/sessions/${sessionId}/recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });

      const data = await res.json();

      if (data.success) {
        setRecommendations(prev => [data.recommendation, ...prev]);
        setShowRecommendations(true);
      }
    } catch (error) {
      console.error("Error generating recommendation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // End session
  const endSession = async (satisfactionScore = null) => {
    if (!sessionId) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/coach/sessions/${sessionId}/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, userSatisfactionScore: satisfactionScore })
      });

      const data = await res.json();

      if (data.success) {
        setSessionActive(false);
        setSessionId(null);
        setMessages([]);

        // Reload analytics
        loadAnalytics();

        // Show summary
        alert(`Session Summary:\n\n${data.summary}`);
      }
    } catch (error) {
      console.error("Error ending session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update preferences
  const updatePreferences = async () => {
    try {
      await fetch("/api/coach/memory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          preferredCoachingStyle: preferences.coachingStyle,
          responseLengthPreference: preferences.responseLength
        })
      });

      setShowSettings(false);
      loadCoachingMemory();
    } catch (error) {
      console.error("Error updating preferences:", error);
    }
  };

  // Not in session
  if (!sessionActive) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--blue-50)", padding: "var(--space-4)" }}>
        <div style={{ maxWidth: "1024px", margin: "0 auto" }}>
          {/* Header */}
          <div style={{ marginBottom: "var(--space-6)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-3)" }}>
              <div style={{ backgroundColor: "var(--cyan)", color: "white", padding: "var(--space-3)", borderRadius: "var(--radius-2)" }}>
                <Brain size={28} />
              </div>
              <div>
                <h1 style={{ fontSize: "var(--type-xxl)", fontWeight: "700", color: "var(--ink-0)", margin: 0 }}>
                  ARTH.OS Financial Coach
                </h1>
                <p style={{ color: "var(--ink-2)", marginTop: "var(--space-1)", margin: 0, fontSize: "var(--type-sm)" }}>
                  Your AI-powered financial advisor powered by your cognition data
                </p>
              </div>
            </div>
          </div>

          {/* Start Session Options */}
          <div style={{ backgroundColor: "white", borderRadius: "var(--radius-2)", padding: "var(--space-4)", marginBottom: "var(--space-4)", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <h2 style={{ fontSize: "var(--type-lg)", fontWeight: "700", color: "var(--ink-0)", marginBottom: "var(--space-3)" }}>
              Start a Coaching Session
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
              {[
                { concern: "Spending Control", emoji: "💰", desc: "Control your spending habits" },
                { concern: "Savings Building", emoji: "🏦", desc: "Build sustainable savings" },
                { concern: "Debt Reduction", emoji: "📉", desc: "Create a debt repayment plan" },
                { concern: "Investment Strategy", emoji: "📈", desc: "Invest wisely for growth" },
                { concern: "Belief Reframing", emoji: "🧠", desc: "Challenge limiting beliefs" },
                { concern: "General Guidance", emoji: "🎯", desc: "General financial advice" }
              ].map(option => (
                <button
                  key={option.concern}
                  onClick={() => startSession(option.concern)}
                  disabled={isLoading}
                  style={{
                    textAlign: "left",
                    padding: "var(--space-3)",
                    border: "1px solid var(--blue-50)",
                    borderRadius: "var(--radius-1)",
                    backgroundColor: "white",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    opacity: isLoading ? 0.5 : 1,
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = "var(--cyan)";
                    e.target.style.backgroundColor = "var(--blue-50)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = "var(--blue-50)";
                    e.target.style.backgroundColor = "white";
                  }}
                >
                  <div style={{ fontSize: "var(--type-xl)", marginBottom: "var(--space-2)" }}>{option.emoji}</div>
                  <p style={{ fontWeight: "600", color: "var(--ink-0)", margin: 0, fontSize: "var(--type-sm)" }}>
                    {option.concern}
                  </p>
                  <p style={{ fontSize: "var(--type-xs)", color: "var(--ink-2)", margin: "var(--space-1) 0 0 0" }}>
                    {option.desc}
                  </p>
                </button>
              ))}
            </div>

            <button
              onClick={() => startSession()}
              disabled={isLoading}
              style={{
                width: "100%",
                backgroundColor: "var(--cyan)",
                color: "white",
                border: "none",
                padding: "var(--space-3)",
                borderRadius: "var(--radius-1)",
                fontWeight: "600",
                fontSize: "var(--type-sm)",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.5 : 1,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => !isLoading && (e.target.style.backgroundColor = "var(--teal-700)")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "var(--cyan)")}
            >
              {isLoading ? "Starting..." : "Start Free-Form Session"}
            </button>
          </div>

          {/* Statistics */}
          {analytics && (
            <div style={{ backgroundColor: "white", borderRadius: "var(--radius-2)", padding: "var(--space-4)", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
              <h2 style={{ fontSize: "var(--type-lg)", fontWeight: "700", color: "var(--ink-0)", marginBottom: "var(--space-3)" }}>
                Your Coaching Journey
              </h2>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-2)" }}>
                <div style={{ textAlign: "center", padding: "var(--space-3)", backgroundColor: "var(--blue-50)", borderRadius: "var(--radius-1)" }}>
                  <div style={{ fontSize: "var(--type-xxl)", fontWeight: "700", color: "var(--cyan)" }}>
                    {analytics.totalSessions}
                  </div>
                  <p style={{ fontSize: "var(--type-xs)", color: "var(--ink-2)", marginTop: "var(--space-1)" }}>
                    Sessions
                  </p>
                </div>

                <div style={{ textAlign: "center", padding: "var(--space-3)", backgroundColor: "var(--green-50)", borderRadius: "var(--radius-1)" }}>
                  <div style={{ fontSize: "var(--type-xxl)", fontWeight: "700", color: "var(--green-700)" }}>
                    {analytics.totalRecommendations}
                  </div>
                  <p style={{ fontSize: "var(--type-xs)", color: "var(--ink-2)", marginTop: "var(--space-1)" }}>
                    Recommendations
                  </p>
                </div>

                <div style={{ textAlign: "center", padding: "var(--space-3)", backgroundColor: "#f3e8ff", borderRadius: "var(--radius-1)" }}>
                  <div style={{ fontSize: "var(--type-xxl)", fontWeight: "700", color: "#9333ea" }}>
                    {analytics.acceptanceRate}%
                  </div>
                  <p style={{ fontSize: "var(--type-xs)", color: "var(--ink-2)", marginTop: "var(--space-1)" }}>
                    Acceptance Rate
                  </p>
                </div>

                <div style={{ textAlign: "center", padding: "var(--space-3)", backgroundColor: "var(--orange-50)", borderRadius: "var(--radius-1)" }}>
                  <div style={{ fontSize: "var(--type-xxl)", fontWeight: "700", color: "var(--orange-707)" }}>
                    {analytics.averageUserSatisfaction || "N/A"}
                  </div>
                  <p style={{ fontSize: "var(--type-xs)", color: "var(--ink-2)", marginTop: "var(--space-1)" }}>
                    Avg Satisfaction
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // In active session
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "var(--blue-50)" }}>
      {/* Context Panel - User's Current Situation */}
      <div
        style={{
          background: "linear-gradient(135deg, var(--cyan) 0%, var(--teal-700) 100%)",
          color: "white",
          padding: "var(--space-4)",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div style={{ maxWidth: "100%", margin: "0 auto" }}>
          {/* Context Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-3)" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Brain size={22} style={{ color: "white" }} />
            </div>
            <div>
              <h1 style={{ fontSize: "var(--type-lg)", fontWeight: "600", margin: 0, color: "white" }}>
                Your Financial Coach
              </h1>
              <p style={{ fontSize: "var(--type-xs)", opacity: 0.9, margin: "var(--space-1) 0 0 0", color: "white" }}>
                {messages.length} messages in this session
              </p>
            </div>
          </div>

          {/* Situation Context Grid */}
          {(result || assessment) && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--space-2)" }}>
              {/* Health Score Card */}
              {result?.healthScore !== undefined && (
                <div
                  style={{
                    padding: "var(--space-2)",
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: "var(--radius-1)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <div style={{ fontSize: "var(--type-xs)", opacity: 0.9 }}>Health Score</div>
                  <div style={{ fontSize: "var(--type-xl)", fontWeight: "700", marginTop: "var(--space-1)" }}>
                    {Math.round(result.healthScore)}/100
                  </div>
                  <div style={{ fontSize: "var(--type-xs)", opacity: 0.8, marginTop: "var(--space-1)" }}>
                    {result.categoryBand?.label}
                  </div>
                </div>
              )}

              {/* Survival Window Card */}
              {result?.survivalMonthsRaw !== undefined && (
                <div
                  style={{
                    padding: "var(--space-2)",
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: "var(--radius-1)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <div style={{ fontSize: "var(--type-xs)", opacity: 0.9 }}>Runway</div>
                  <div style={{ fontSize: "var(--type-xl)", fontWeight: "700", marginTop: "var(--space-1)" }}>
                    {Math.round(result.survivalMonthsRaw)} mo
                  </div>
                  <div style={{ fontSize: "var(--type-xs)", opacity: 0.8, marginTop: "var(--space-1)" }}>
                    Financial cushion
                  </div>
                </div>
              )}

              {/* Awareness Gap Card */}
              {result?.awarenessGapDisplay && (
                <div
                  style={{
                    padding: "var(--space-2)",
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: "var(--radius-1)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <div style={{ fontSize: "var(--type-xs)", opacity: 0.9 }}>Awareness Gap</div>
                  <div style={{ fontSize: "var(--type-xl)", fontWeight: "700", marginTop: "var(--space-1)" }}>
                    {result.awarenessGapDisplay}
                  </div>
                  <div style={{ fontSize: "var(--type-xs)", opacity: 0.8, marginTop: "var(--space-1)" }}>
                    Hidden blind spot
                  </div>
                </div>
              )}

              {/* Primary Focus Card */}
              {assessment?.profile?.monthlyExpenses && (
                <div
                  style={{
                    padding: "var(--space-2)",
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: "var(--radius-1)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <div style={{ fontSize: "var(--type-xs)", opacity: 0.9 }}>Monthly Spend</div>
                  <div style={{ fontSize: "var(--type-xl)", fontWeight: "700", marginTop: "var(--space-1)" }}>
                    ₹{(assessment.profile.monthlyExpenses / 1000).toFixed(0)}k
                  </div>
                  <div style={{ fontSize: "var(--type-xs)", opacity: 0.8, marginTop: "var(--space-1)" }}>
                    Core expenses
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Situation Summary Line */}
          {result && (
            <div
              style={{
                marginTop: "var(--space-3)",
                padding: "var(--space-2)",
                background: "rgba(255,255,255,0.08)",
                borderRadius: "var(--radius-1)",
                fontSize: "var(--type-sm)",
                fontStyle: "italic",
              }}
            >
              <strong>Coach Context:</strong> {
                result.healthScore >= 80
                  ? `You're in good shape with ${result.categoryBand?.label}. Let's work on optimizing your growth.`
                  : result.healthScore >= 60
                    ? `Your situation is ${result.categoryBand?.label?.toLowerCase()}. Focus on strengthening your runway and reducing blind spots.`
                    : `You're under pressure. Let's create an action plan to improve your financial stability.`
              }
            </div>
          )}
        </div>
      </div>

      {/* Header with Controls */}
      <div style={{ backgroundColor: "white", borderBottom: "1px solid var(--blue-50)", padding: "var(--space-3)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <MessageCircle size={20} style={{ color: "var(--cyan)" }} />
          <div>
            <h2 style={{ fontSize: "var(--type-sm)", fontWeight: "600", color: "var(--ink-0)", margin: 0 }}>Financial Coach Chat</h2>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              padding: "var(--space-2)",
              background: "none",
              border: "none",
              cursor: "pointer",
              borderRadius: "var(--radius-1)",
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "var(--blue-50)")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent")}
          >
            <Settings size={18} style={{ color: "var(--ink-2)" }} />
          </button>
          <button
            onClick={() => endSession()}
            style={{
              padding: "var(--space-2)",
              background: "none",
              border: "none",
              cursor: "pointer",
              borderRadius: "var(--radius-1)",
              color: "var(--red-600)",
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#fee2e2")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent")}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div style={{ backgroundColor: "var(--blue-50)", borderBottom: "1px solid var(--blue-50)", padding: "var(--space-4)" }}>
          <div style={{ maxWidth: "100%" }}>
            <h3 style={{ fontSize: "var(--type-sm)", fontWeight: "600", color: "var(--ink-0)", marginBottom: "var(--space-3)" }}>
              Coaching Preferences
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)", marginBottom: "var(--space-3)" }}>
              <div>
                <label style={{ display: "block", fontSize: "var(--type-xs)", fontWeight: "500", color: "var(--ink-0)", marginBottom: "var(--space-2)" }}>
                  Coaching Style
                </label>
                <select
                  value={preferences.coachingStyle}
                  onChange={e => setPreferences({ ...preferences, coachingStyle: e.target.value })}
                  style={{
                    width: "100%",
                    border: "1px solid var(--blue-50)",
                    borderRadius: "var(--radius-1)",
                    padding: "var(--space-2)",
                    fontSize: "var(--type-xs)",
                    fontFamily: "inherit",
                  }}
                >
                  <option value="compassionate">Compassionate & Supportive</option>
                  <option value="analytical">Analytical & Data-Driven</option>
                  <option value="motivational">Motivational & Energizing</option>
                  <option value="direct">Direct & Practical</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "var(--type-xs)", fontWeight: "500", color: "var(--ink-0)", marginBottom: "var(--space-2)" }}>
                  Response Length
                </label>
                <select
                  value={preferences.responseLength}
                  onChange={e => setPreferences({ ...preferences, responseLength: e.target.value })}
                  style={{
                    width: "100%",
                    border: "1px solid var(--blue-50)",
                    borderRadius: "var(--radius-1)",
                    padding: "var(--space-2)",
                    fontSize: "var(--type-xs)",
                    fontFamily: "inherit",
                  }}
                >
                  <option value="concise">Concise</option>
                  <option value="detailed">Detailed</option>
                  <option value="conversational">Conversational</option>
                </select>
              </div>
            </div>

            <button
              onClick={updatePreferences}
              style={{
                background: "var(--cyan)",
                color: "white",
                border: "none",
                padding: "var(--space-2) var(--space-3)",
                borderRadius: "var(--radius-1)",
                fontSize: "var(--type-xs)",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => (e.target.style.background = "var(--teal-700)")}
              onMouseLeave={(e) => (e.target.style.background = "var(--cyan)")}
            >
              Save Preferences
            </button>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "var(--space-4)", backgroundColor: "white" }}>
        <div style={{ maxWidth: "100%", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {messages.map(msg => (
            <div
              key={msg.id}
              style={{
                display: "flex",
                justifyContent: msg.type === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "60%",
                  padding: "var(--space-3)",
                  borderRadius: "var(--radius-2)",
                  background:
                    msg.type === "user"
                      ? "var(--cyan)"
                      : msg.type === "error"
                        ? "var(--red-100)"
                        : "var(--blue-50)",
                  color:
                    msg.type === "user"
                      ? "white"
                      : msg.type === "error"
                        ? "var(--red-700)"
                        : "var(--ink-0)",
                  borderBottomLeftRadius: msg.type !== "user" ? 0 : "var(--radius-2)",
                  borderBottomRightRadius: msg.type === "user" ? 0 : "var(--radius-2)",
                }}
              >
                <p style={{ fontSize: "var(--type-sm)", margin: 0, lineHeight: 1.5 }}>{msg.content}</p>
                <p
                  style={{
                    fontSize: "var(--type-xs)",
                    marginTop: "var(--space-2)",
                    opacity: msg.type === "user" ? 0.7 : 0.6,
                  }}
                >
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div
                style={{
                  padding: "var(--space-3)",
                  borderRadius: "var(--radius-2)",
                  background: "var(--blue-50)",
                  color: "var(--ink-0)",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  borderBottomLeftRadius: 0,
                }}
              >
                <Loader size={16} style={{ animation: "spin 1s linear infinite" }} />
                <p style={{ fontSize: "var(--type-sm)", margin: 0 }}>Coach is thinking...</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Recommendations Sidebar */}
      {showRecommendations && recommendations.length > 0 && (
        <div style={{ backgroundColor: "white", borderLeft: "1px solid var(--blue-50)", width: "300px", padding: "var(--space-3)", maxHeight: "400px", overflowY: "auto" }}>
          <h3 style={{ fontSize: "var(--type-sm)", fontWeight: "600", color: "var(--ink-0)", marginBottom: "var(--space-3)", display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <Lightbulb size={18} style={{ color: "var(--orange-700)" }} />
            Recommendations
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {recommendations.slice(0, 5).map(rec => (
              <div
                key={rec.id}
                style={{
                  border: "1px solid var(--blue-50)",
                  borderRadius: "var(--radius-1)",
                  padding: "var(--space-2)",
                  backgroundColor: "var(--blue-50)",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-2)", marginBottom: "var(--space-2)" }}>
                  <div style={{ backgroundColor: "var(--orange-700)", color: "white", padding: "var(--space-1)", borderRadius: "var(--radius-1)" }}>
                    <Lightbulb size={14} />
                  </div>
                  <p style={{ fontSize: "var(--type-xs)", fontWeight: "600", color: "var(--ink-0)", flex: 1, margin: 0 }}>
                    {rec.recommendation_text.substring(0, 50)}...
                  </p>
                </div>

                <div style={{ fontSize: "var(--type-xs)", color: "var(--ink-2)", display: "flex", flexDirection: "column", gap: "var(--space-1)", marginBottom: "var(--space-2)" }}>
                  <div>
                    <strong>Priority:</strong> {rec.priority_level}
                  </div>
                  <div>
                    <strong>Timeframe:</strong> {rec.time_frame}
                  </div>
                </div>

                <select
                  value={rec.recommendation_status}
                  onChange={e => updateRecommendationStatus(rec.id, e.target.value)}
                  style={{
                    width: "100%",
                    fontSize: "var(--type-xs)",
                    border: "1px solid var(--blue-50)",
                    borderRadius: "var(--radius-1)",
                    padding: "var(--space-1)",
                    fontFamily: "inherit",
                  }}
                >
                  <option value="offered">Offered</option>
                  <option value="accepted">Accepted</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div style={{ backgroundColor: "white", borderTop: "1px solid var(--blue-50)", padding: "var(--space-4)" }}>
        <div style={{ maxWidth: "100%" }}>
          <form onSubmit={sendMessage} style={{ display: "flex", gap: "var(--space-2)" }}>
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              placeholder="Ask your coach anything about your finances..."
              disabled={isLoading}
              style={{
                flex: 1,
                border: "1px solid var(--blue-50)",
                borderRadius: "var(--radius-1)",
                padding: "var(--space-2) var(--space-3)",
                backgroundColor: isLoading ? "var(--blue-50)" : "white",
                fontSize: "var(--type-sm)",
                fontFamily: "inherit",
                outline: "none",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--cyan)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--blue-50)")}
            />

            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              style={{
                background: "var(--cyan)",
                color: "white",
                border: "none",
                padding: "var(--space-2) var(--space-3)",
                borderRadius: "var(--radius-1)",
                fontWeight: "600",
                transition: "all 0.2s ease",
                cursor: isLoading || !inputMessage.trim() ? "not-allowed" : "pointer",
                opacity: isLoading || !inputMessage.trim() ? 0.5 : 1,
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
              }}
              onMouseEnter={(e) => !isLoading && !inputMessage.trim() && (e.target.style.background = "var(--teal-700)")}
              onMouseLeave={(e) => (e.target.style.background = "var(--cyan)")}
            >
              <Send size={18} />
            </button>

            <button
              type="button"
              onClick={generateRecommendation}
              disabled={isLoading}
              style={{
                background: "var(--orange-707)",
                color: "white",
                border: "none",
                padding: "var(--space-2) var(--space-3)",
                borderRadius: "var(--radius-1)",
                fontWeight: "600",
                transition: "all 0.2s ease",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.5 : 1,
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
              }}
              title="Generate a recommendation"
              onMouseEnter={(e) => !isLoading && (e.target.style.background = "#b45309")}
              onMouseLeave={(e) => (e.target.style.background = "var(--orange-707)")}
            >
              <Lightbulb size={18} />
            </button>
          </form>

          <div style={{ marginTop: "var(--space-2)", display: "flex", gap: "var(--space-2)", fontSize: "var(--type-xs)", color: "var(--ink-2)" }}>
            <button
              type="button"
              onClick={() => endSession(5)}
              style={{ background: "none", border: "none", color: "var(--cyan)", cursor: "pointer", textDecoration: "underline" }}
            >
              End with 5-star feedback
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setShowRecommendations(!showRecommendations)}
              style={{ background: "none", border: "none", color: "var(--cyan)", cursor: "pointer", textDecoration: "underline" }}
            >
              {showRecommendations ? "Hide" : "Show"} recommendations
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function for updating recommendation status
async function updateRecommendationStatus(recommendationId, status) {
  try {
    await fetch(`/api/coach/recommendations/${recommendationId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
  } catch (error) {
    console.error("Error updating recommendation:", error);
  }
}

export default AiCoachInterface;
