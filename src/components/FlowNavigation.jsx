import React, { useMemo, useState } from "react";
import {
  Home,
  ClipboardList,
  BarChart3,
  Brain,
  Target,
  Users,
  GitBranch,
  History,
  LineChart,
  ShieldCheck,
  MessageCircle,
  TrendingUp,
  Sparkles
} from "lucide-react";

export default function FlowNavigation({ activeHash, onNavigate }) {
  const [showDeveloperMenu, setShowDeveloperMenu] = useState(false);

  const coreNarrative = useMemo(
    () => [
      { id: "assess", hash: "#assessment", label: "Assessment", icon: ClipboardList, description: "Financial Health Quiz" },
      { id: "reality", hash: "#reality", label: "Reality", icon: Home, description: "Where am I?" },
      { id: "mind", hash: "#mind", label: "Why", icon: Brain, description: "Why am I here?" },
      { id: "future", hash: "#future", label: "Future", icon: Target, description: "What happens next?" },
      { id: "action", hash: "#action", label: "Actions", icon: GitBranch, description: "What should I do?" },
      { id: "coach", hash: "#coach", label: "Coach", icon: MessageCircle, description: "Help me execute" }
    ],
    []
  );

  const developerMenu = useMemo(
    () => [
      { id: "b2b", hash: "#b2b", label: "Partners", icon: Users, description: "B2B Portal" },
      {
        id: "developer-intelligence",
        hash: "#intelligence",
        aliases: ["#predictions"],
        label: "Developer Intelligence",
        icon: LineChart,
        description: "Internal intelligence layers"
      },
      { id: "admin", hash: "#admin", label: "Admin", icon: ShieldCheck, description: "Operations Console" }
    ],
    []
  );

  const isActive = hash => {
    const currentHash = activeHash || "#reality";
    const allItems = [...coreNarrative, ...developerMenu];
    const item = allItems.find(navItem => navItem.hash === hash);
    return currentHash === hash || (item?.aliases && item.aliases.includes(currentHash));
  };

  const handleNavClick = hash => {
    if (onNavigate) {
      onNavigate(hash);
    } else {
      window.location.hash = hash;
    }
  };

  return (
    <>
      <nav className="app-nav-tabs" aria-label="Financial Cognition Journey">
        {coreNarrative.map(item => {
          const Icon = item.icon;
          const active = isActive(item.hash);

          return (
            <button
              key={item.id}
              className={`app-nav-tab ${item.hash === "#assessment" ? "primary" : ""} ${active ? "active" : ""}`}
              onClick={() => handleNavClick(item.hash)}
              title={item.description}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={16} aria-hidden="true" />
              <span className="app-nav-tab-label">{item.label}</span>
              <small>{item.description}</small>
            </button>
          );
        })}
        
        {/* Developer Menu Toggle */}
        <button
          className="app-nav-tab app-nav-dev-toggle"
          onClick={() => setShowDeveloperMenu(!showDeveloperMenu)}
          title="Developer & Admin Tools"
          aria-expanded={showDeveloperMenu}
        >
          <Sparkles size={16} aria-hidden="true" />
          <span className="app-nav-tab-label">Dev</span>
          <small>Tools</small>
        </button>
      </nav>

      {/* Developer Menu Dropdown */}
      {showDeveloperMenu && (
        <nav className="app-nav-developer-menu" aria-label="Developer Tools">
          <div className="dev-menu-header">
            <p style={{ margin: 0, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-3)" }}>
              Intelligence & Administration
            </p>
          </div>
          <div className="dev-menu-items">
            {developerMenu.map(item => {
              const Icon = item.icon;
              const active = isActive(item.hash);

              return (
                <button
                  key={item.id}
                  className={`dev-menu-item ${active ? "active" : ""}`}
                  onClick={() => {
                    handleNavClick(item.hash);
                    setShowDeveloperMenu(false);
                  }}
                  title={item.description}
                >
                  <Icon size={14} />
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
