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
  Share2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { OS_SHELL_ROUTES } from "../lib/routeMap.js";
import { isSimpleViewMode, SIMPLE_SHELL_ROUTES } from "../lib/viewMode.js";

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
  devMode = false,
  viewMode = "classic"
}) {
  const location = useLocation();
  const currentPath = location.pathname || "";
  const navigate = useNavigate();
  const appRootPath = currentPath.startsWith("/demo") ? "/demo" : "/dashboard";
  const navRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startScroll = useRef(0);
  const [showNavControls, setShowNavControls] = useState(false);

  const scrollNav = delta => {
    const el = navRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: "smooth" });
  };

  useEffect(() => {
    // auto-scroll the active nav item into view on route change
    const el = navRef.current;
    if (!el) return;
    const active = el.querySelector("a.active");
    if (active) {
      try {
        active.scrollIntoView({ inline: "center", behavior: "smooth", block: "nearest" });
      } catch (e) {
        const rect = active.getBoundingClientRect();
        const parentRect = el.getBoundingClientRect();
        const offset = rect.left - parentRect.left - parentRect.width / 2 + rect.width / 2;
        el.scrollBy({ left: offset, behavior: "smooth" });
      }
    }
  }, [location.pathname]);

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;

    const update = () => {
      setShowNavControls(el.scrollWidth > el.clientWidth + 4);
    };

    update();
    window.addEventListener("resize", update);
    el.addEventListener("scroll", update);

    return () => {
      window.removeEventListener("resize", update);
      el.removeEventListener("scroll", update);
    };
  }, []);

  // drag-to-scroll handlers
  const handlePointerDown = e => {
    const el = navRef.current;
    if (!el) return;
    isDragging.current = true;
    startX.current = e.pageX || e.touches?.[0]?.pageX || 0;
    startScroll.current = el.scrollLeft;
    el.classList.add("dragging");
  };

  const handlePointerMove = e => {
    if (!isDragging.current) return;
    const el = navRef.current;
    const x = e.pageX || e.touches?.[0]?.pageX || 0;
    const dx = x - startX.current;
    el.scrollLeft = startScroll.current - dx;
  };

  const handlePointerUp = () => {
    if (!isDragging.current) return;
    const el = navRef.current;
    isDragging.current = false;
    el.classList.remove("dragging");
  };

  const handleKeyDown = e => {
    if (e.key === "ArrowRight") {
      scrollNav(160);
    } else if (e.key === "ArrowLeft") {
      scrollNav(-160);
    }
  };

  const navRoutes = isSimpleViewMode(viewMode) ? SIMPLE_SHELL_ROUTES : OS_SHELL_ROUTES;

  return (
    <header className="topbar">
      <Link className="brand" to="/dashboard" aria-label="ARTH.OS home">
        <span className="logo-word">
          ARTH.<span>OS</span>
        </span>
        <small>POWERED BY SANKHYA</small>
      </Link>

      <div className="nav-wrap">
        <button
          type="button"
          className={`nav-scroll-btn left ${showNavControls ? "visible" : "hidden"}`}
          aria-label="Scroll nav left"
          aria-hidden={!showNavControls}
          disabled={!showNavControls}
          onClick={() => scrollNav(-220)}
        >
          <ChevronLeft size={16} />
        </button>

        <nav
          ref={navRef}
          className="nav-links"
          aria-label="Primary navigation"
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {navRoutes.map(item => {
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

        <button
          type="button"
          className={`nav-scroll-btn right ${showNavControls ? "visible" : "hidden"}`}
          aria-label="Scroll nav right"
          aria-hidden={!showNavControls}
          disabled={!showNavControls}
          onClick={() => scrollNav(220)}
        >
          <ChevronRight size={16} />
        </button>
      </div>

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
  devMode: PropTypes.bool,
  viewMode: PropTypes.string
};

export default Header;
