// src/hooks/useUserInputData.js
// Hooks for accessing and persisting user input data to database

import { useState, useCallback, useContext } from "react";
import { AuthContext } from "../context/AuthContext";

/**
 * Hook to save and load assessment drafts from database
 */
export function useAssessmentDraft() {
  const { token } = useContext(AuthContext);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const saveDraft = useCallback(
    async (draftData, assessmentType = "v2") => {
      if (!token) {
        setError("Not authenticated");
        return null;
      }

      try {
        setLoading(true);
        const response = await fetch("/api/user/saveDraft", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            draft_data: draftData,
            assessment_type: assessmentType,
          }),
        });

        if (!response.ok) throw new Error("Failed to save draft");
        const result = await response.json();
        setDraft(result.data);
        setError(null);
        return result.data;
      } catch (err) {
        console.error("[useAssessmentDraft] Save error:", err);
        setError(err.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  const loadDraft = useCallback(
    async (assessmentType = "v2") => {
      if (!token) {
        setError("Not authenticated");
        return null;
      }

      try {
        setLoading(true);
        const response = await fetch(
          `/api/user/loadDraft?assessment_type=${assessmentType}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) throw new Error("Failed to load draft");
        const result = await response.json();
        if (result.data) {
          setDraft(result.data);
        }
        setError(null);
        return result.data;
      } catch (err) {
        console.error("[useAssessmentDraft] Load error:", err);
        setError(err.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  return { draft, loading, error, saveDraft, loadDraft };
}

/**
 * Hook to save user decisions to database
 */
export function useUserDecisions() {
  const { token } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const saveDecision = useCallback(
    async (decisionData, decisionType = "assessment", outcomeData = null) => {
      if (!token) {
        setError("Not authenticated");
        return null;
      }

      try {
        setLoading(true);
        const response = await fetch("/api/user/saveDecision", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            decision_data: decisionData,
            decision_type: decisionType,
            outcome_data: outcomeData,
          }),
        });

        if (!response.ok) throw new Error("Failed to save decision");
        const result = await response.json();
        setError(null);
        return result.data;
      } catch (err) {
        console.error("[useUserDecisions] Save error:", err);
        setError(err.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  return { loading, error, saveDecision };
}

/**
 * Hook to save telemetry events to database
 */
export function useTelemetry() {
  const { token } = useContext(AuthContext);
  const [sessionId] = useState(() => {
    // Generate or retrieve session ID
    const stored = sessionStorage.getItem("telemetry-session-id");
    if (stored) return stored;
    const newId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem("telemetry-session-id", newId);
    return newId;
  });
  const [error, setError] = useState(null);

  const logEvent = useCallback(
    async (eventType, eventData = {}) => {
      if (!token) return; // Silent fail for non-authenticated

      try {
        await fetch("/api/user/saveTelemetry", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            event_type: eventType,
            event_data: eventData,
            session_id: sessionId,
          }),
        });
      } catch (err) {
        console.warn("[useTelemetry] Log error:", err);
        setError(err.message);
      }
    },
    [token, sessionId]
  );

  return { error, logEvent, sessionId };
}

/**
 * Hook to save user preferences to database
 */
export function useUserPreferences() {
  const { token } = useContext(AuthContext);
  const [preferences, setPreferences] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const savePreference = useCallback(
    async (key, value) => {
      if (!token) {
        setError("Not authenticated");
        return null;
      }

      try {
        setLoading(true);
        const response = await fetch("/api/user/savePreference", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            preference_key: key,
            preference_value: value,
          }),
        });

        if (!response.ok) throw new Error("Failed to save preference");
        const result = await response.json();
        setPreferences((prev) => ({ ...prev, [key]: value }));
        setError(null);
        return result.data;
      } catch (err) {
        console.error("[useUserPreferences] Save error:", err);
        setError(err.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  return { preferences, loading, error, savePreference };
}
