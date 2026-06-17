import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useLocation, useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { OS_SHELL_ROUTES, STORY_NAV_ITEMS, DEV_NAV_ITEMS } from "../lib/routeMap.js";
import { isSimpleViewMode, SIMPLE_SHELL_ROUTES } from "../lib/viewMode.js";

export default function FlowNavigation({ onNavigate, devMode, onToggleDev, viewMode = "classic" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showDeveloperMenu, setShowDeveloperMenu] = useState(false);

  const currentPath = location?.pathname || "";
  const isOSContext = OS_SHELL_ROUTES.some(route => route.path === currentPath);
  const coreNarrative = useMemo(() => {
    if (isSimpleViewMode(viewMode)) {
      return SIMPLE_SHELL_ROUTES;
    }
    return isOSContext ? OS_SHELL_ROUTES : STORY_NAV_ITEMS;
  }, [isOSContext, viewMode]);
  const developerMenu = useMemo(() => DEV_NAV_ITEMS, []);

  const isActive = item => {
    if (!item.path) {
      return false;
    }
    return currentPath === item.path || currentPath.endsWith(item.path);
  };

  const handleNavClick = item => {
    if (!item?.path) {
      return;
    }

    if (onNavigate) {
      onNavigate(item.path);
      return;
    }

    navigate(item.path);
  };

  return (
    <>
      <nav className="app-nav-tabs" aria-label="Financial Cognition Journey">
        {coreNarrative.map(item => {
          const Icon = item.icon;
          const active = isActive(item);

          return (
            <button
              key={item.id}
              className={`app-nav-tab ${item.id === "assessment" ? "primary" : ""} ${active ? "active" : ""}`}
              onClick={() => handleNavClick(item)}
              title={item.description}
              aria-current={active ? "page" : undefined}
            >
              {Icon && <Icon size={16} aria-hidden="true" />}
              <span className="app-nav-tab-label">{item.label}</span>
              <small>{item.description}</small>
            </button>
          );
        })}

        {!isSimpleViewMode(viewMode) && (
        <button
          className={`app-nav-tab app-nav-dev-toggle ${devMode ? "dev-active" : ""}`}
          onClick={() => {
            setShowDeveloperMenu(prev => !prev);
            if (onToggleDev) {
              onToggleDev();
            }
          }}
          title="Developer & Admin Tools"
          aria-expanded={showDeveloperMenu}
        >
          <Sparkles size={16} aria-hidden="true" />
          <span className="app-nav-tab-label">Dev</span>
          <small>Tools</small>
        </button>
        )}
      </nav>

      {showDeveloperMenu && !isSimpleViewMode(viewMode) && (
        <nav className="app-nav-developer-menu" aria-label="Developer Tools">
          <div className="dev-menu-header">
            <p className="dev-menu-title">Intelligence & Administration</p>
          </div>
          <div className="dev-menu-items">
            {developerMenu.map(item => {
              const Icon = item.icon;
              const active = isActive(item);

              return (
                <button
                  key={item.id}
                  className={`dev-menu-item ${active ? "active" : ""}`}
                  onClick={() => {
                    handleNavClick(item);
                    setShowDeveloperMenu(false);
                  }}
                  title={item.description}
                >
                  {Icon && <Icon size={14} />}
                  <span>{item.label}</span>
                  <small>{item.description}</small>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
}

FlowNavigation.propTypes = {
  onNavigate: PropTypes.func,
  devMode: PropTypes.bool,
  onToggleDev: PropTypes.func,
  viewMode: PropTypes.string
};
