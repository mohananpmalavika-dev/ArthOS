import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function CollapsiblePanel({
  as: Component = "section",
  children,
  className = "",
  contentClassName = "",
  defaultCollapsed = false,
  headerClassName = "",
  icon = null,
  id,
  subtitle,
  subtitleClassName = "",
  title,
  titleClassName = ""
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const label = `${collapsed ? "Expand" : "Minimize"} ${title || "panel"}`;

  return (
    <Component
      id={id}
      className={`${className} collapsible-panel ${collapsed ? "is-collapsed" : ""}`.trim()}
    >
      <div className={`${headerClassName} collapsible-panel-header`.trim()}>
        <div className="collapsible-panel-heading">
          {icon && <span className="collapsible-panel-icon">{icon}</span>}
          <div>
            {title && <h2 className={titleClassName}>{title}</h2>}
            {subtitle && <p className={subtitleClassName}>{subtitle}</p>}
          </div>
        </div>
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

      {!collapsed && (
        <div className={`collapsible-panel-content ${contentClassName}`.trim()}>{children}</div>
      )}
    </Component>
  );
}
