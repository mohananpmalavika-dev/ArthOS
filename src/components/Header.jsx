import React from "react";
import PropTypes from "prop-types";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  Search,
  Bell,
  Download,
  LogIn,
  LogOut,
  CircleUserRound,
  ChevronDown,
  LineChart,
  Share2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { OS_SHELL_ROUTES } from "../lib/routeMap.js";

function Header({
  saveStatusLabel = "Saved",
  saveStatusClass = "saved",
  onExport = () => {},
  isAuthenticated = false,
  user = null,
  onOpenAuth = () => {},
  onLogout = () => {},
  notificationBadgeCount = 0,
  onToggleNotification = () => {},
  onShareAssessment = () => {},
  pushEnabled = false,
  onEnableNotifications = () => {},
  showShareActions = false,
  showPushActions = false,
  devMode = false
}) {
  const location = useLocation();
  const currentPath = location.pathname || "";
  const navigate = useNavigate();
  const appRootPath = currentPath.startsWith("/demo") ? "/demo" : "/dashboard";

  return (
    <header className="topbar">
      <Link className="brand" to="/dashboard" aria-label="ARTH.OS home">
        <span className="logo-word">
          ARTH.<span>OS</span>
        </span>
        <small>POWERED BY SANKHYA</small>
      </Link>

      <nav className="nav-links" aria-label="Primary navigation">
        {OS_SHELL_ROUTES.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.path === "/dashboard"}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <Icon size={15} aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="model-header-actions" aria-label="Product actions">
        <span className={`header-sync save-state-${saveStatusClass}`}>{saveStatusLabel}</span>
        <button type="button" className="model-icon-btn" title="Search">
          <Search size={18} />
        </button>
        {showShareActions && (
          <button
            type="button"
            className="model-icon-btn"
            title="Share assessment"
            onClick={onShareAssessment}
          >
            <Share2 size={18} />
          </button>
        )}
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
        {showPushActions && (
          <button
            type="button"
            className="model-icon-btn"
            title={pushEnabled ? "Push notifications enabled" : "Enable push notifications"}
            onClick={onEnableNotifications}
          >
            <Bell size={18} />
          </button>
        )}
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

        {/** Only show developer tools link when devMode is enabled in UI state. */}
        {devMode ? (
          <button
            type="button"
            className="dev-intelligence-link"
            onClick={() => navigate(`${appRootPath}/intelligence`)}
            aria-label="Developer Intelligence"
          >
            <LineChart size={16} />
            <span>Dev Intelligence</span>
          </button>
        ) : null}

        {devMode ? (
          <button
            type="button"
            className="model-icon-btn dev-qa-btn"
            title="QA: trigger interstitial to /future-you"
            onClick={() => {
              try {
                if (window.__arth_triggerInterstitial) {
                  window.__arth_triggerInterstitial("/future-you");
                } else {
                  navigate("/future-you");
                }
              } catch {
                // noop
              }
            }}
          >
            QA
          </button>
        ) : null}

        <button
          type="button"
          className="model-avatar-btn"
          onClick={() => navigate("/dashboard/admin")}
          aria-label="Admin dashboard"
        >
          <span>A</span>
          <ChevronDown size={15} />
        </button>
        <button type="button" className="model-start-btn" onClick={() => navigate("/assessment")}>
          Start Assessment
        </button>
      </div>
    </header>
  );
}

Header.propTypes = {
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
  onToggleNotification: PropTypes.func,
  onShareAssessment: PropTypes.func,
  onEnableNotifications: PropTypes.func,
  pushEnabled: PropTypes.bool,
  showShareActions: PropTypes.bool,
  showPushActions: PropTypes.bool,
  devMode: PropTypes.bool
};

export default Header;
