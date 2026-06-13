/**
 * useSubscription Hook
 * Manages subscription state, feature access, and paywall logic
 */

import { useState, useEffect, useCallback } from "react";
import { hasFeature, canTakeAssessment } from "../lib/featureGating.js";

export function useSubscription(userId) {
  const [tier, setTier] = useState("free");
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch subscription on mount and when userId changes
  useEffect(() => {
    if (!userId) {
      setTier("free");
      setLoading(false);
      return;
    }

    const fetchSubscription = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/subscriptions/${userId}`);
        const data = await response.json();

        setSubscription(data);
        setTier(data.tier || "free");
        setError(null);
      } catch (err) {
        console.error("Error fetching subscription:", err);
        setError("Could not load subscription");
        setTier("free");
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [userId]);

  // Check if user has access to a feature
  const checkFeature = useCallback(feature => hasFeature(tier, feature), [tier]);

  // Check if user can take another assessment
  const checkAssessmentAvailable = useCallback(
    (assessmentsTaken = 0) => {
      return canTakeAssessment(tier, assessmentsTaken);
    },
    [tier]
  );

  // Upgrade subscription
  const upgradeSubscription = useCallback(
    async newTier => {
      if (!userId) {
        return false;
      }

      try {
        const response = await fetch(`/api/subscriptions/${userId}/upgrade`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId: newTier })
        });

        const result = await response.json();

        if (result.success || result.subscriptionId) {
          setTier(newTier);
          setSubscription(result);
          return true;
        }

        setError(result.message || "Upgrade failed");
        return false;
      } catch (err) {
        console.error("Error upgrading subscription:", err);
        setError("Failed to upgrade");
        return false;
      }
    },
    [userId]
  );

  // Cancel subscription
  const cancelSubscription = useCallback(async () => {
    if (!userId) {
      return false;
    }

    try {
      const response = await fetch(`/api/subscriptions/${userId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      const result = await response.json();

      if (result.success) {
        setTier("free");
        setSubscription(null);
        return true;
      }

      setError(result.message || "Cancellation failed");
      return false;
    } catch (err) {
      console.error("Error canceling subscription:", err);
      setError("Failed to cancel");
      return false;
    }
  }, [userId]);

  return {
    tier,
    subscription,
    loading,
    error,
    checkFeature,
    checkAssessmentAvailable,
    upgradeSubscription,
    cancelSubscription
  };
}

export default useSubscription;
