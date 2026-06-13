import React, { useState } from "react";
import { ChevronDown, ChevronUp, Minimize2, Maximize2 } from "lucide-react";

export default function CollapsiblePanel({
  as: Component = "section",
  children,
  className = "",
  contentClassName = "",
  defaultCollapsed = false,
  defaultMinimized = false,
  headerClassName = "",
  icon = null,
  id,
  onMinimizeToggle,
  subtitle,
  subtitleClassName = "",
  title,
  titleClassName = ""
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [minimized, setMinimized] = useState(defaultMinimized);
  const label = `${collapsed ? "Expand" : "Collapse"} ${title || "panel"}`;

  const handleMinimizeToggle = () => {
    setMinimized(prev => !prev);
    onMinimizeToggle?.(!minimized);
  };

  return (
    <Component
      id={id}
      className={`${className} collapsible-panel ${collapsed ? "is-collapsed" : ""} ${minimized ? "is-minimized" : ""}`.trim()}
    >
      <div className={`${headerClassName} collapsible-panel-header`.trim()}>
        <div className="collapsible-panel-heading">
          {icon && <span className="collapsible-panel-icon">{icon}</span>}
          <div>
            {title && <h2 className={titleClassName}>{title}</h2>}
            {subtitle && <p className={subtitleClassName}>{subtitle}</p>}
          </div>
        </div>
        <div className="collapsible-panel-controls">
          <button
            type="button"
            className="collapsible-panel-minimize-btn"
            onClick={handleMinimizeToggle}
            aria-label={minimized ? `Restore ${title || "panel"}` : `Minimize ${title || "panel"}`}
            title={minimized ? `Restore ${title || "panel"}` : `Minimize ${title || "panel"}`}
          >
            {minimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button
            type="button"
            className="collapsible-panel-toggle"
            onClick={() => setCollapsed(value => !value)}
            aria-expanded={!collapsed}
            aria-label={label}
            title={label}
          >
            {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>

      {!minimized && !collapsed && (
        <div className={`collapsible-panel-content ${contentClassName}`.trim()}>
          {children}
        </div>
      )}
    </Component>
  );
}
