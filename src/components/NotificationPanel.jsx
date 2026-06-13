import React, { useState, useMemo, useEffect } from "react";
import PropTypes from "prop-types";
import { getNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead, clearNotifications } from "../engines/notificationEngine.js";
import { Bell, CheckCheck, Trash2, X } from "lucide-react";

/**
 * NotificationPanel — slide-out panel showing all in-app notifications.
 * Triggered by clicking the Bell icon in the header.
 */
function NotificationPanel({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = () => {
    setNotifications(getNotifications());
    setUnreadCount(getUnreadCount());
  };

  useEffect(() => {
    if (isOpen) refresh();
  }, [isOpen]);

  const handleMarkRead = (id) => {
    markNotificationRead(id);
    refresh();
  };

  const handleMarkAllRead = () => {
    markAllNotificationsRead();
    refresh();
  };

  const handleClearAll = () => {
    clearNotifications();
    refresh();
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "yesterday";
    return `${days}d ago`;
  };

  if (!isOpen) return null;

  return (
    <div className="notification-overlay" onClick={onClose}>
      <div className="notification-panel" onClick={(e) => e.stopPropagation()}>
        <div className="notification-panel-header">
          <div className="notification-panel-title">
            <Bell size={18} />
            <h3>Notifications</h3>
            {unreadCount > 0 && <span className="notification-badge-count">{unreadCount}</span>}
          </div>
          <div className="notification-panel-actions">
            {unreadCount > 0 && (
              <button type="button" className="notification-action-btn" onClick={handleMarkAllRead} title="Mark all as read">
                <CheckCheck size={16} />
              </button>
            )}
            {notifications.length > 0 && (
              <button type="button" className="notification-action-btn" onClick={handleClearAll} title="Clear all">
                <Trash2 size={16} />
              </button>
            )}
            <button type="button" className="notification-action-btn" onClick={onClose} title="Close">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="notification-list">
          {notifications.length === 0 ? (
            <div className="notification-empty">
              <Bell size={32} />
              <p>No notifications yet</p>
              <small>Complete assessments and track your progress to see updates here.</small>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`notification-item ${n.read ? "read" : "unread"}`}
                onClick={() => {
                  if (!n.read) handleMarkRead(n.id);
                }}
              >
                <span className="notification-icon">{n.icon}</span>
                <div className="notification-content">
                  <strong>{n.title}</strong>
                  <p>{n.body}</p>
                  <span className="notification-time">{timeAgo(n.createdAt)}</span>
                </div>
                {!n.read && <span className="notification-unread-dot" />}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

NotificationPanel.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default NotificationPanel;
