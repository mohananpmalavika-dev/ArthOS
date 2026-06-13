// src/hooks/useUserAssessments.js
// Hook for fetching authenticated user's assessments and scores
// Requires useAuth hook context to get JWT token

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const API_BASE = "/api";

export function useUserAssessments() {
  const { token, isAuthenticated } = useAuth();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    limit: 50,
    offset: 0,
    total: 0,
    hasMore: false
  });

  const fetchAssessments = useCallback(
    async (limit = 50, offset = 0) => {
      if (!isAuthenticated || !token) {
        setError("Not authenticated");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_BASE}/user/assessments?limit=${limit}&offset=${offset}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          }
        );

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Failed to fetch assessments");
        }

        const data = await response.json();
        setAssessments(data.data || []);
        setPagination(data.pagination);
      } catch (err) {
        console.error("[useUserAssessments] Error:", err);
        setError(err.message || "Failed to fetch assessments");
      } finally {
        setLoading(false);
      }
    },
    [token, isAuthenticated]
  );

  // Auto-fetch on mount if authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchAssessments();
    }
  }, [isAuthenticated, token, fetchAssessments]);

  return {
    assessments,
    loading,
    error,
    pagination,
    refetch: fetchAssessments
  };
}

export function useUserScoreHistory() {
  const { token, isAuthenticated } = useAuth();
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [trends, setTrends] = useState(null);
  const [pagination, setPagination] = useState({
    limit: 50,
    offset: 0,
    total: 0,
    hasMore: false
  });

  const fetchScores = useCallback(
    async (limit = 50, offset = 0) => {
      if (!isAuthenticated || !token) {
        setError("Not authenticated");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE}/user/scores?limit=${limit}&offset=${offset}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Failed to fetch scores");
        }

        const data = await response.json();
        setScores(data.data || []);
        setTrends(data.trends || null);
        setPagination(data.pagination);
      } catch (err) {
        console.error("[useUserScoreHistory] Error:", err);
        setError(err.message || "Failed to fetch scores");
      } finally {
        setLoading(false);
      }
    },
    [token, isAuthenticated]
  );

  // Auto-fetch on mount if authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchScores();
    }
  }, [isAuthenticated, token, fetchScores]);

  return {
    scores,
    loading,
    error,
    trends,
    pagination,
    refetch: fetchScores
  };
}

export function useUserAssessmentDetail(assessmentId) {
  const { token, isAuthenticated } = useAuth();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAssessment = useCallback(
    async id => {
      if (!isAuthenticated || !token) {
        setError("Not authenticated");
        return;
      }

      if (!id) {
        setError("Assessment ID is required");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE}/user/assessment-detail?id=${id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Failed to fetch assessment");
        }

        const data = await response.json();
        setAssessment(data.data || null);
      } catch (err) {
        console.error("[useUserAssessmentDetail] Error:", err);
        setError(err.message || "Failed to fetch assessment");
      } finally {
        setLoading(false);
      }
    },
    [token, isAuthenticated]
  );

  // Auto-fetch when assessmentId changes
  useEffect(() => {
    if (isAuthenticated && token && assessmentId) {
      fetchAssessment(assessmentId);
    }
  }, [isAuthenticated, token, assessmentId, fetchAssessment]);

  return {
    assessment,
    loading,
    error,
    refetch: fetchAssessment
  };
}
