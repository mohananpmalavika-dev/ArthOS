/**
 * AI Coach Chat Interface
 *
 * ARTH.OS V4 Context-First Coach Architecture
 * - Context panel shows user's financial situation, health score, and weekly mission
 * - Chat interface for personalized coaching below
 * - Integrated with assessment results for personalized guidance
 */

import React, { useState, useEffect, useRef } from "react";
import { normalizeScore } from "../lib/scoring-v2";
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

const AiCoachInterface = ({ userId, result, assessment, coachPrimaryConcern }) => {
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

  useEffect(() => {
    if (coachPrimaryConcern && !sessionActive) {
      startSession(coachPrimaryConcern);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coachPrimaryConcern, sessionActive]);

  // Load coaching memory and preferences
  const loadCoachingMemory = async () => {
    try {
      const res = await fetch(`/api/coach/memory`);
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
      const res = await fetch(`/api/coach/analytics`);
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
      <div className="coach-shell coach-start-page">
        <div className="coach-start-grid">
          <header className="coach-start-header">
            <div className="coach-icon-box">
              <Brain size={28} />
            </div>
            <div>
              <h1 className="coach-page-title">ARTH.OS Financial Coach</h1>
              <p className="coach-page-subtitle">
                Your AI-powered financial advisor for smarter spending, savings, and resilience.
              </p>
            </div>
          </header>

          <section className="coach-start-card">
            <div className="coach-card-heading">
              <div>
                <p className="coach-card-eyebrow">Coach Session</p>
                <h2 className="coach-card-title">Start a Coaching Conversation</h2>
              </div>
            </div>

            <div className="coach-topic-grid">
              {[
                { concern: "Spending Control", emoji: "💰", desc: "Build habit-level control over your spending." },
                { concern: "Savings Building", emoji: "🏦", desc: "Create a realistic savings path." },
                { concern: "Debt Reduction", emoji: "📉", desc: "Build a plan to reduce debt faster." },
                { concern: "Investment Strategy", emoji: "📈", desc: "Get clear next steps for investing." },
                { concern: "Belief Reframing", emoji: "🧠", desc: "Change how you think about money." },
                { concern: "General Guidance", emoji: "🎯", desc: "Ask any finance question you have." }
              ].map(option => (
                <button
                  key={option.concern}
                  className="coach-topic-button"
                  onClick={() => startSession(option.concern)}
                  disabled={isLoading}
                >
                  <div className="coach-topic-emoji">{option.emoji}</div>
                  <div className="coach-topic-copy">
                    <p className="coach-topic-label">{option.concern}</p>
                    <p className="coach-topic-desc">{option.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <button className="coach-main-button" onClick={() => startSession()} disabled={isLoading}>
              {isLoading ? "Starting..." : "Start Free-Form Session"}
            </button>
          </section>

          {analytics && (
            <section className="coach-stat-card-group">
              <h2 className="coach-stat-heading">Your Coaching Journey</h2>

              <div className="coach-stat-grid">
                <article className="coach-stat-card">
                  <div className="coach-stat-value">{analytics.totalSessions}</div>
                  <p className="coach-stat-label">Sessions</p>
                </article>
                <article className="coach-stat-card">
                  <div className="coach-stat-value">{analytics.totalRecommendations}</div>
                  <p className="coach-stat-label">Recommendations</p>
                </article>
                <article className="coach-stat-card">
                  <div className="coach-stat-value coach-stat-accent">{analytics.acceptanceRate}%</div>
                  <p className="coach-stat-label">Acceptance Rate</p>
                </article>
                <article className="coach-stat-card">
                  <div className="coach-stat-value coach-stat-accent">{analytics.averageUserSatisfaction || "N/A"}</div>
                  <p className="coach-stat-label">Avg Satisfaction</p>
                </article>
              </div>
            </section>
          )}
        </div>
      </div>
    );
  }

  // In active session
  const getMessageClass = type =>
    `coach-message ${type === "user" ? "coach-message-user" : type === "error" ? "coach-message-error" : "coach-message-coach"}`;

  return (
    <div className="coach-shell coach-active-session">
      <section className="coach-context-panel">
        <div className="coach-context-top">
          <div className="coach-context-icon">
            <Brain size={22} />
          </div>
          <div>
            <h1 className="coach-context-title">Your Financial Coach</h1>
            <p className="coach-context-subtitle">{messages.length} messages in this session</p>
          </div>
        </div>

        {(result || assessment) && (
          <div className="coach-context-grid">
            {result?.healthScore !== undefined && (
              <article className="coach-context-card">
                <span className="coach-context-label">Health Score</span>
                <strong className="coach-context-value">{normalizeScore(result?.healthScore ?? 0)}/100</strong>
                <span className="coach-context-note">{result.categoryBand?.label}</span>
              </article>
            )}
            {result?.survivalMonthsRaw !== undefined && (
              <article className="coach-context-card">
                <span className="coach-context-label">Runway</span>
                <strong className="coach-context-value">{Math.round(result.survivalMonthsRaw)} mo</strong>
                <span className="coach-context-note">Financial cushion</span>
              </article>
            )}
            {result?.awarenessGapDisplay && (
              <article className="coach-context-card">
                <span className="coach-context-label">Awareness Gap</span>
                <strong className="coach-context-value">{result.awarenessGapDisplay}</strong>
                <span className="coach-context-note">Hidden blind spot</span>
              </article>
            )}
            {assessment?.profile?.monthlyExpenses && (
              <article className="coach-context-card">
                <span className="coach-context-label">Monthly Spend</span>
                <strong className="coach-context-value">₹{(assessment.profile.monthlyExpenses / 1000).toFixed(0)}k</strong>
                <span className="coach-context-note">Core expenses</span>
              </article>
            )}
          </div>
        )}

        {result && (
          <div className="coach-context-summary">
            <strong>Coach Context:</strong> {
              (() => {
                const hs = normalizeScore(result?.healthScore ?? 0);
                return hs >= 80
                  ? `You're in good shape with ${result.categoryBand?.label}. Let's work on optimizing your growth.`
                  : hs >= 60
                    ? `Your situation is ${result.categoryBand?.label?.toLowerCase()}. Focus on strengthening your runway and reducing blind spots.`
                    : `You're under pressure. Let's create an action plan to improve your financial stability.`
              })()
            }
          </div>
        )}
      </section>

      <section className="coach-session-bar">
        <div className="coach-session-bar-left">
          <MessageCircle size={20} />
          <div>
            <h2>Financial Coach Chat</h2>
          </div>
        </div>

        <div className="coach-session-bar-actions">
          <button className="coach-icon-button" onClick={() => setShowSettings(!showSettings)}>
            <Settings size={18} />
          </button>
          <button className="coach-icon-button coach-end-button" onClick={() => endSession()}>
            <X size={18} />
          </button>
        </div>
      </section>

      {showSettings && (
        <section className="coach-settings-panel">
          <div className="coach-settings-grid">
            <div>
              <label>Coaching Style</label>
              <select
                value={preferences.coachingStyle}
                onChange={e => setPreferences({ ...preferences, coachingStyle: e.target.value })}
              >
                <option value="compassionate">Compassionate & Supportive</option>
                <option value="analytical">Analytical & Data-Driven</option>
                <option value="motivational">Motivational & Energizing</option>
                <option value="direct">Direct & Practical</option>
              </select>
            </div>
            <div>
              <label>Response Length</label>
              <select
                value={preferences.responseLength}
                onChange={e => setPreferences({ ...preferences, responseLength: e.target.value })}
              >
                <option value="concise">Concise</option>
                <option value="detailed">Detailed</option>
                <option value="conversational">Conversational</option>
              </select>
            </div>
          </div>

          <button className="coach-main-button coach-save-button" onClick={updatePreferences}>
            Save Preferences
          </button>
        </section>
      )}

      <div className="coach-chat-layout">
        <main className="coach-chat-main">
          <div className="coach-messages-wrapper">
            {messages.map(msg => (
              <div key={msg.id} className={`coach-message-row ${msg.type === "user" ? "coach-message-row-user" : "coach-message-row-coach"}`}>
                <div className={getMessageClass(msg.type)}>
                  <p>{msg.content}</p>
                  <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="coach-message-row coach-message-row-coach">
                <div className="coach-message coach-message-loading">
                  <Loader size={16} className="coach-message-loader" />
                  <span>Coach is thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <footer className="coach-input-pane">
            <form onSubmit={sendMessage} className="coach-input-form">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                placeholder="Ask your coach anything about your finances..."
                disabled={isLoading}
                className="coach-text-input"
              />
              <button type="submit" className="coach-submit-button" disabled={isLoading || !inputMessage.trim()}>
                <Send size={18} />
              </button>
              <button type="button" className="coach-recommend-button" onClick={generateRecommendation} disabled={isLoading}>
                <Lightbulb size={18} />
              </button>
            </form>

            <div className="coach-input-actions">
              <button type="button" className="coach-link-button" onClick={() => endSession(5)}>
                End with 5-star feedback
              </button>
              <button type="button" className="coach-link-button" onClick={() => setShowRecommendations(!showRecommendations)}>
                {showRecommendations ? "Hide" : "Show"} recommendations
              </button>
            </div>
          </footer>
        </main>

        {showRecommendations && recommendations.length > 0 && (
          <aside className="coach-recommendations-panel">
            <div className="coach-sidebar-heading">
              <Lightbulb size={18} />
              <h3>Recommendations</h3>
            </div>
            <div className="coach-recommend-list">
              {recommendations.slice(0, 5).map(rec => (
                <article key={rec.id} className="coach-recommend-card">
                  <div className="coach-recommend-card-top">
                    <Lightbulb size={14} />
                    <p>{rec.recommendation_text.substring(0, 50)}...</p>
                  </div>
                  <div className="coach-recommend-meta">
                    <span><strong>Priority:</strong> {rec.priority_level}</span>
                    <span><strong>Timeframe:</strong> {rec.time_frame}</span>
                  </div>
                  <select
                    value={rec.recommendation_status}
                    onChange={e => updateRecommendationStatus(rec.id, e.target.value)}
                    className="coach-select"
                  >
                    <option value="offered">Offered</option>
                    <option value="accepted">Accepted</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </article>
              ))}
            </div>
          </aside>
        )}
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
