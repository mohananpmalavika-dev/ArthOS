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
        
        // Check if response is ok and is JSON
        if (!response.ok) {
          console.error("Failed to fetch subscription:", response.status);
          setError("Could not load subscription");
          setTier("free");
          return;
        }
        
        // Verify content-type is JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          console.error("API returned non-JSON response");
          setError("Invalid response from server");
          setTier("free");
          return;
        }
        
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

        if (!response.ok) {
          console.error("Failed to upgrade subscription:", response.status);
          const contentType = response.headers.get("content-type");
          let errorMsg = "Upgrade failed";
          if (contentType && contentType.includes("application/json")) {
            try {
              const errData = await response.json();
              errorMsg = errData.message || "Upgrade failed";
            } catch {
              // Ignore JSON parse error, use default message
            }
          }
          setError(errorMsg);
          return false;
        }

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

      if (!response.ok) {
        console.error("Failed to cancel subscription:", response.status);
        const contentType = response.headers.get("content-type");
        let errorMsg = "Cancellation failed";
        if (contentType && contentType.includes("application/json")) {
          try {
            const errData = await response.json();
            errorMsg = errData.message || "Cancellation failed";
          } catch {
            // Ignore JSON parse error, use default message
          }
        }
        setError(errorMsg);
        return false;
      }

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
