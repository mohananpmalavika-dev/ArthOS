/**
 * useNotificationState Hook
 * Centralizes notification and alert-related state
 * - Notification panel visibility
 * - Badge counts
 * - Newly unlocked milestones
 */

import { useState, useCallback } from "react";

export function useNotificationState() {
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [notificationBadgeCount, setNotificationBadgeCount] = useState(0);
  const [newlyUnlockedMilestones, setNewlyUnlockedMilestones] = useState([]);
  const [pendingFollowUps, setPendingFollowUps] = useState([]);

  const toggleNotificationPanel = useCallback(() => {
    setShowNotificationPanel(prev => !prev);
  }, []);

  const clearNotificationBadge = useCallback(() => {
    setNotificationBadgeCount(0);
  }, []);

  const addMilestone = useCallback(milestone => {
    setNewlyUnlockedMilestones(prev => [...prev, milestone]);
  }, []);

  const clearMilestones = useCallback(() => {
    setNewlyUnlockedMilestones([]);
  }, []);

  const addFollowUp = useCallback(followUp => {
    setPendingFollowUps(prev => [...prev, followUp]);
  }, []);

  const clearFollowUps = useCallback(() => {
    setPendingFollowUps([]);
  }, []);

  return {
    // State
    showNotificationPanel,
    setShowNotificationPanel,
    notificationBadgeCount,
    setNotificationBadgeCount,
    newlyUnlockedMilestones,
    setNewlyUnlockedMilestones,
    pendingFollowUps,
    setPendingFollowUps,
    // Methods
    toggleNotificationPanel,
    clearNotificationBadge,
    addMilestone,
    clearMilestones,
    addFollowUp,
    clearFollowUps
  };
}
