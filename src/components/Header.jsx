import React from "react";
import PropTypes from "prop-types";
import { Search, Bell, Download, LogIn, LogOut, CircleUserRound, ChevronDown } from "lucide-react";
import { NAV_ITEMS } from "../lib/copy.ts";

function Header({
  activeHash = "#home",
  saveState = "saving",
  saveStatusLabel = "Saved",
  saveStatusClass = "saved",
  onExport = () => {},
  onReset = () => {},
  onSave = () => {},
  isAuthenticated = false,
  user = null,
  onOpenAuth = () => {},
  onLogout = () => {},
  notificationBadgeCount = 0,
  onToggleNotification = () => {}
}) {
  return (
    <header className="topbar">
      <a className="brand" href="#home" aria-label="ARTH.OS home">
        <span className="logo-word">
          ARTH.<span>OS</span>
        </span>
        <small>POWERED BY SANKHYA</small>
      </a>

      <nav className="nav-links" aria-label="Primary navigation">
        {NAV_ITEMS.map(item => (
          <a
            href={item.href}
            key={item.label}
            className={activeHash === item.href ? "active" : ""}
            aria-current={activeHash === item.href ? "page" : undefined}
          >
            {item.label}
          </a>
        ))}
      </nav>

      <div className="model-header-actions" aria-label="Product actions">
        <span className={`header-sync save-state-${saveStatusClass}`}>{saveStatusLabel}</span>
        <button type="button" className="model-icon-btn" title="Search">
          <Search size={18} />
        </button>
        <button
          type="button"
          className="model-icon-btn notification-btn"
          title="Notifications"
          onClick={onToggleNotification}
        >
          <Bell size={18} />
          {notificationBadgeCount > 0 && (
            <span className="notification-badge-dot">{notificationBadgeCount}</span>
          )}
        </button>
        <button
          type="button"
          className="model-icon-btn"
          title="Export report as PDF"
          onClick={onExport}
        >
          <Download size={18} />
        </button>

        {isAuthenticated && user ? (
          <div className="auth-header-group">
            <span className="auth-header-user" title={user.email}>
              <CircleUserRound size={16} />
              <span>{user.name || user.email?.split("@")[0]}</span>
            </span>
            <button type="button" className="model-icon-btn" title="Sign out" onClick={onLogout}>
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button type="button" className="model-icon-btn" title="Sign in" onClick={onOpenAuth}>
            <LogIn size={18} />
          </button>
        )}

        <a className="model-avatar-btn" href="#admin" aria-label="Admin dashboard">
          <span>A</span>
          <ChevronDown size={15} />
        </a>
        <a className="model-start-btn" href="#assessment">
          Start Assessment
        </a>
      </div>
    </header>
  );
}

Header.propTypes = {
  activeHash: PropTypes.string,
  saveState: PropTypes.string,
  saveStatusLabel: PropTypes.string,
  saveStatusClass: PropTypes.string,
  onExport: PropTypes.func,
  onReset: PropTypes.func,
  onSave: PropTypes.func,
  isAuthenticated: PropTypes.bool,
  user: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string
  }),
  onOpenAuth: PropTypes.func,
  onLogout: PropTypes.func,
  notificationBadgeCount: PropTypes.number,
  onToggleNotification: PropTypes.func
};

export default Header;
