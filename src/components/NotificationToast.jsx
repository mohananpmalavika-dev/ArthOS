/**
 * NotificationToast — floating toast for score changes, milestones, etc.
 * Reads from notificationEngine localStorage and shows unread notifications
 * as animated toasts that auto-dismiss.
 */
import React, { useState, useEffect, useCallback } from "react";
import { X, Bell } from "lucide-react";
import { getNotifications, getUnreadCount, markNotificationRead } from "../engines/notificationEngine.js";

export default function NotificationToast() {
  const [currentToast, setCurrentToast] = useState(null);
  const [visible, setVisible] = useState(false);
  const [shownIds, setShownIds] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("arth-os-toast-shown") || "[]");
    } catch { return []; }
  });

  const dismiss = useCallback(() => {
    setVisible(false);
    setTimeout(() => setCurrentToast(null), 300);
  }, []);

  const showNext = useCallback(() => {
    const notifications = getNotifications();
    const unread = notifications.filter((n) => !n.read && !shownIds.includes(n.id));
    if (unread.length === 0) return;

    const next = unread[0];
    setCurrentToast(next);
    setShownIds((prev) => {
      const updated = [...prev, next.id];
      try {
        sessionStorage.setItem("arth-os-toast-shown", JSON.stringify(updated));
      } catch (error) {
        console.warn('[NotificationToast] Failed to persist shown toast IDs:', {
          numShown: updated.length,
          error: error?.message,
        });
      }
      return updated;
    });
    markNotificationRead(next.id);
    setVisible(true);
    setTimeout(dismiss, 5000);
  }, [shownIds, dismiss]);

  // When a new notification appears (poll every 2s)
  useEffect(() => {
    const interval = setInterval(() => {
      const count = getUnreadCount();
      const stored = document.querySelector("#__ARTH_TOAST_COUNT");
      const prev = stored ? parseInt(stored.textContent || "0") : 0;
      if (count > prev && !visible) {
        showNext();
      }
      if (stored) stored.textContent = String(count);
    }, 2000);

    return () => clearInterval(interval);
  }, [showNext, visible]);

  // Initial seed
  useEffect(() => {
    const el = document.createElement("span");
    el.id = "__ARTH_TOAST_COUNT";
    el.style.display = "none";
    el.textContent = String(getUnreadCount());
    document.body.appendChild(el);
    return () => el.remove();
  }, []);

  if (!currentToast) return null;

  return (
    <div className={`notification-toast ${visible ? "visible" : "hidden"}`}>
      <div className="notification-toast-inner">
        <span className="notification-toast-icon">{currentToast.icon || "🔔"}</span>
        <div className="notification-toast-content">
          <strong>{currentToast.title}</strong>
          <p>{currentToast.body}</p>
        </div>
        <button
          type="button"
          className="notification-toast-close"
          onClick={dismiss}
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
