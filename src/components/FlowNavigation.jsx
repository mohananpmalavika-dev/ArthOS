import React, { useMemo } from "react";
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
  TrendingUp
} from "lucide-react";

export default function FlowNavigation({ activeHash, onNavigate }) {
  const navItems = useMemo(
    () => [
      { id: "reality", hash: "#reality", label: "Reality", icon: Home, description: "Current state" },
      { id: "mind", hash: "#mind", label: "Mind", icon: Brain, description: "Beliefs & bias" },
      { id: "future", hash: "#future", label: "Future", icon: Target, description: "Forecast" },
      { id: "action", hash: "#action", label: "Action", icon: GitBranch, description: "Mission plan" },
      { id: "coach", hash: "#coach", label: "Coach", icon: MessageCircle, description: "AI guidance" },
      { id: "assess", hash: "#assessment", label: "Assess", icon: ClipboardList, description: "Financial Health Quiz" },
      { id: "b2b", hash: "#b2b", label: "Partners", icon: Users, description: "B2B Portal" },
      { id: "predictions", hash: "#predictions", label: "Predictions", icon: LineChart, description: "Longitudinal Forecasting" },
      { id: "admin", hash: "#admin", label: "Admin", icon: ShieldCheck, description: "Operations Console" }
    ],
    []
  );

  const isActive = hash => {
    const currentHash = activeHash || "#home";
    const item = navItems.find(navItem => navItem.hash === hash);
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
    <nav className="app-nav-tabs" aria-label="Product flow navigation">
      {navItems.map(item => {
        const Icon = item.icon;
        const active = isActive(item.hash);

        return (
          <button
            key={item.id}
            className={`app-nav-tab ${active ? "active" : ""}`}
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
    </nav>
  );
}
