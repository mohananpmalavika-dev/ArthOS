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
  LineChart
} from "lucide-react";
import { OS_SHELL_ROUTES } from "../lib/routeMap.js";

function Header({
  activeHash = "#",
  saveStatusLabel = "Saved",
  saveStatusClass = "saved",
  onExport = () => {},
  isAuthenticated = false,
  user = null,
  onOpenAuth = () => {},
  onLogout = () => {},
  notificationBadgeCount = 0,
  onToggleNotification = () => {}
}) {
  const location = useLocation();
  const currentPath = location.pathname || "";

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
          const isHashLink = item.path?.startsWith("#");
          const active = isHashLink ? activeHash === item.path : currentPath === item.path;

          return isHashLink ? (
            <a
              href={item.path}
              key={item.id}
              className={active ? "active" : ""}
              aria-current={active ? "page" : undefined}
            >
              {item.label}
            </a>
          ) : (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.path === "/dashboard"}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              {item.label}
            </NavLink>
          );
        })}
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

        {/** Only show developer tools link when devMode is enabled in UI state. */}
        {typeof window !== "undefined" &&
        window.localStorage?.getItem("arth-os-dev-mode") === "true" ? (
          <a
            className="dev-intelligence-link"
            href="#intelligence"
            aria-label="Developer Intelligence"
          >
            <LineChart size={16} />
            <span>Dev Intelligence</span>
          </a>
        ) : null}

        {typeof window !== "undefined" &&
        window.localStorage?.getItem("arth-os-dev-mode") === "true" ? (
          <button
            type="button"
            className="model-icon-btn dev-qa-btn"
            title="QA: trigger interstitial to /future-you"
            onClick={() => {
              try {
                if (window.__arth_triggerInterstitial) {
                  window.__arth_triggerInterstitial('/future-you');
                } else {
                  // fallback: navigate directly
                  window.location.href = '/future-you';
                }
              } catch (e) {
                // noop
              }
            }}
          >
            QA
          </button>
        ) : null}

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
