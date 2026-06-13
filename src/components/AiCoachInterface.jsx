/**
 * AI Coach Chat Interface
 *
 * Real-time conversation interface with ARTH.OS Financial Coach.
 * Features:
 * - Live conversation with GPT-powered coach
 * - Conversation memory and context
 * - Personalized recommendations
 * - Session management
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
  Star
} from "lucide-react";

const AICoachrInterface = ({ userId }) => {
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-600 text-white p-3 rounded-lg">
                <MessageCircle size={28} />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">ARTH.OS Financial Coach</h1>
                <p className="text-gray-600 mt-1">
                  Your AI-powered financial advisor powered by your cognition data
                </p>
              </div>
            </div>
          </div>

          {/* Start Session Options */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Start a Coaching Session</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
                  className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition disabled:opacity-50"
                >
                  <p className="text-2xl mb-2">{option.emoji}</p>
                  <p className="font-semibold text-gray-900">{option.concern}</p>
                  <p className="text-sm text-gray-600">{option.desc}</p>
                </button>
              ))}
            </div>

            <button
              onClick={() => startSession()}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
            >
              {isLoading ? "Starting..." : "Start Free-Form Session"}
            </button>
          </div>

          {/* Statistics */}
          {analytics && (
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Your Coaching Journey</h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded">
                  <p className="text-3xl font-bold text-blue-600">{analytics.totalSessions}</p>
                  <p className="text-sm text-gray-600 mt-1">Sessions</p>
                </div>

                <div className="text-center p-4 bg-green-50 rounded">
                  <p className="text-3xl font-bold text-green-600">
                    {analytics.totalRecommendations}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Recommendations</p>
                </div>

                <div className="text-center p-4 bg-purple-50 rounded">
                  <p className="text-3xl font-bold text-purple-600">{analytics.acceptanceRate}%</p>
                  <p className="text-sm text-gray-600 mt-1">Acceptance Rate</p>
                </div>

                <div className="text-center p-4 bg-orange-50 rounded">
                  <p className="text-3xl font-bold text-orange-600">
                    {analytics.averageUserSatisfaction || "N/A"}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Avg Satisfaction</p>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white p-2 rounded">
            <MessageCircle size={20} />
          </div>
          <div>
            <h1 className="font-bold text-gray-900">Financial Coach</h1>
            <p className="text-xs text-gray-500">{messages.length} messages in this session</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-gray-100 rounded transition"
          >
            <Settings size={20} className="text-gray-600" />
          </button>
          <button onClick={() => endSession()} className="p-2 hover:bg-red-100 rounded transition">
            <X size={20} className="text-red-600" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gray-50 border-b p-4">
          <div className="max-w-4xl mx-auto">
            <h3 className="font-semibold text-gray-900 mb-4">Coaching Preferences</h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Coaching Style
                </label>
                <select
                  value={preferences.coachingStyle}
                  onChange={e => setPreferences({ ...preferences, coachingStyle: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="compassionate">Compassionate & Supportive</option>
                  <option value="analytical">Analytical & Data-Driven</option>
                  <option value="motivational">Motivational & Energizing</option>
                  <option value="direct">Direct & Practical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Response Length
                </label>
                <select
                  value={preferences.responseLength}
                  onChange={e => setPreferences({ ...preferences, responseLength: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="concise">Concise</option>
                  <option value="detailed">Detailed</option>
                  <option value="conversational">Conversational</option>
                </select>
              </div>
            </div>

            <button
              onClick={updatePreferences}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
            >
              Save Preferences
            </button>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-lg px-4 py-3 rounded-lg ${
                  msg.type === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : msg.type === "error"
                      ? "bg-red-100 text-red-800 rounded-bl-none"
                      : "bg-gray-100 text-gray-900 rounded-bl-none"
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    msg.type === "user" ? "text-blue-100" : "text-gray-500"
                  }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 px-4 py-3 rounded-lg rounded-bl-none flex items-center gap-2">
                <Loader size={16} className="animate-spin" />
                <p className="text-sm">Coach is thinking...</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Recommendations Sidebar */}
      {showRecommendations && recommendations.length > 0 && (
        <div className="bg-white border-l border-gray-200 w-80 p-4 max-h-96 overflow-y-auto">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Lightbulb size={18} className="text-yellow-600" />
            Recommendations
          </h3>

          <div className="space-y-3">
            {recommendations.slice(0, 5).map(rec => (
              <div key={rec.id} className="border border-gray-200 rounded p-3">
                <div className="flex items-start gap-2 mb-2">
                  <div className="bg-yellow-100 text-yellow-700 p-1 rounded">
                    <Lightbulb size={14} />
                  </div>
                  <p className="text-sm font-semibold text-gray-900 flex-1">
                    {rec.recommendation_text.substring(0, 50)}...
                  </p>
                </div>

                <div className="text-xs text-gray-600 space-y-1">
                  <p>
                    <strong>Priority:</strong> {rec.priority_level}
                  </p>
                  <p>
                    <strong>Timeframe:</strong> {rec.time_frame}
                  </p>
                </div>

                <select
                  value={rec.recommendation_status}
                  onChange={e => updateRecommendationStatus(rec.id, e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded mt-2 px-2 py-1"
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
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={sendMessage} className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              placeholder="Ask your coach anything about your finances..."
              disabled={isLoading}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 disabled:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50 flex items-center gap-2"
            >
              <Send size={18} />
            </button>

            <button
              type="button"
              onClick={generateRecommendation}
              disabled={isLoading}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50 flex items-center gap-2"
              title="Generate a recommendation"
            >
              <Lightbulb size={18} />
            </button>
          </form>

          <div className="mt-3 flex gap-2 text-xs text-gray-600">
            <button
              type="button"
              onClick={() => endSession(5)}
              className="text-blue-600 hover:underline"
            >
              End with 5-star feedback
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setShowRecommendations(!showRecommendations)}
              className="text-blue-600 hover:underline"
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

export default AICoachrInterface;
