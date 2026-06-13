/**
 * notificationEngine.js
 * Manages in-app notifications for score changes, milestones, streaks,
 * and checkin reminders. Stores in localStorage for persistence across sessions.
 */

const NOTIFICATIONS_KEY = "arth-os-notifications";
const SEEN_MILESTONES_KEY = "arth-os-seen-milestones";

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function safeRead(key) {
  if (!isBrowser()) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function safeWrite(key, value) {
  if (!isBrowser()) {
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("[notificationEngine] Failed to persist notifications:", {
      key,
      error: error?.message,
      code: error?.code
    });
  }
}

// --- Notifications ---

export function getNotifications() {
  return safeRead(NOTIFICATIONS_KEY);
}

export function getUnreadCount() {
  return getNotifications().filter(n => !n.read).length;
}

export function addNotification({ title, body, type, icon, badgeId, link }) {
  const notifications = getNotifications();
  notifications.unshift({
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title,
    body,
    type: type || "info",
    icon: icon || "🔔",
    badgeId: badgeId || null,
    link: link || null,
    read: false,
    createdAt: new Date().toISOString()
  });
  // Keep max 100 notifications
  if (notifications.length > 100) {
    notifications.length = 100;
  }
  safeWrite(NOTIFICATIONS_KEY, notifications);
  return notifications;
}

export function markNotificationRead(notifId) {
  const notifications = getNotifications();
  const idx = notifications.findIndex(n => n.id === notifId);
  if (idx !== -1) {
    notifications[idx].read = true;
    safeWrite(NOTIFICATIONS_KEY, notifications);
  }
}

export function markAllNotificationsRead() {
  const notifications = getNotifications();
  notifications.forEach(n => {
    n.read = true;
  });
  safeWrite(NOTIFICATIONS_KEY, notifications);
}

export function clearNotifications() {
  safeWrite(NOTIFICATIONS_KEY, []);
}

// --- Score change detection ---

/**
 * Compare new score against previous stored score.
 * If different, fires a notification and returns the delta.
 */
export function detectAndNotifyScoreChange(newScore, previousScore) {
  if (newScore == null || previousScore == null) {
    return null;
  }

  const delta = newScore - previousScore;
  if (delta === 0) {
    return delta;
  }

  if (delta > 0) {
    addNotification({
      title: "Score Improved! 🎉",
      body: `Your financial health score went up by ${delta} points to ${newScore}. Keep it up!`,
      type: "score_up",
      icon: "📈"
    });
  } else {
    addNotification({
      title: "Score Dropped",
      body: `Your financial health score decreased by ${Math.abs(delta)} points to ${newScore}. Review your assessment for areas to improve.`,
      type: "score_down",
      icon: "📉"
    });
  }

  return delta;
}

// --- Milestone notifications ---

/**
 * Add a notification for a newly unlocked milestone badge.
 */
export function notifyMilestoneUnlock(badge) {
  addNotification({
    title: `Badge Unlocked! ${badge.icon}`,
    body: `${badge.label}: ${badge.description}`,
    type: "milestone",
    icon: badge.icon || "🏅",
    badgeId: badge.id
  });
}

// --- Streak notifications ---

/**
 * Notify about a streak milestone being reached (3, 7, 14, 30 days).
 */
export function notifyStreakMilestone(streakDays) {
  const messages = {
    3: { body: "3-day check-in streak! You're building a healthy habit.", icon: "🌱" },
    7: { body: "7-day check-in streak! A full week of financial awareness.", icon: "🌿" },
    14: { body: "14-day check-in streak! Two weeks of consistent tracking.", icon: "🌳" },
    30: { body: "30-day check-in streak! You're a financial discipline master!", icon: "🏆" }
  };

  const msg = messages[streakDays];
  if (!msg) {
    return false;
  }

  addNotification({
    title: `Streak Milestone: ${streakDays} Days!`,
    body: msg.body,
    type: "streak",
    icon: msg.icon
  });
  return true;
}

// --- Checkin reminders ---

/**
 * Check if the user has checked in recently (within N days).
 * If not, add a notification suggesting a checkin.
 * Returns true if a reminder was added.
 */
export function checkCheckinReminder(lastCheckinDate, daysThreshold = 2) {
  if (!lastCheckinDate) {
    addNotification({
      title: "Daily Check-in Reminder",
      body: "You haven't completed a daily check-in yet. Take 30 seconds to track your financial mood.",
      type: "reminder",
      icon: "⏰",
      link: "#checkin"
    });
    return true;
  }

  const last = new Date(lastCheckinDate);
  const now = new Date();
  const daysSince = Math.floor((now - last) / (1000 * 60 * 60 * 24));

  if (daysSince >= daysThreshold) {
    addNotification({
      title: "Daily Check-in Reminder",
      body: `It's been ${daysSince} days since your last check-in. Keep your streak going!`,
      type: "reminder",
      icon: "⏰",
      link: "#checkin"
    });
    return true;
  }

  return false;
}

// --- Notifications from milestone engine (bridge function) ---

export function notifyNewMilestones(newlyUnlocked) {
  for (const badge of newlyUnlocked) {
    notifyMilestoneUnlock(badge);
  }
}

// --- Seen milestones tracking (for milestone popup dismissal) ---

export function getSeenMilestones() {
  return safeRead(SEEN_MILESTONES_KEY);
}

export function markMilestoneSeen(badgeId) {
  const seen = getSeenMilestones();
  if (!seen.includes(badgeId)) {
    seen.push(badgeId);
    safeWrite(SEEN_MILESTONES_KEY, seen);
  }
}

export function getUnseenMilestones(newlyUnlocked) {
  const seen = getSeenMilestones();
  return newlyUnlocked.filter(b => !seen.includes(b.id));
}
