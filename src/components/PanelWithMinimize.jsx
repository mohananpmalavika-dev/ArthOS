import React, { useState } from "react";
import { PanelMinimizeButton } from "./PanelMinimizer.jsx";

/**
 * PanelWithMinimize
 * Wraps panel content and adds minimize functionality
 * Can be used as a drop-in replacement for summary-card sections
 */
export default function PanelWithMinimize({
  children,
  className = "",
  headerContent,
  title
}) {
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <div
      className={`panel-with-minimize ${isMinimized ? "is-minimized" : ""} ${className}`.trim()}
    >
      {/* Header */}
      <div className="panel-header-with-controls">
        <div className="panel-title-section">
          {headerContent}
        </div>
        <div className="panel-header-controls">
          <PanelMinimizeButton
            isMinimized={isMinimized}
            onToggle={() => setIsMinimized(!isMinimized)}
            title={title}
          />
        </div>
      </div>

      {/* Content - only show when not minimized */}
      {!isMinimized && (
        <div className="panel-content-section">
          {children}
        </div>
      )}

      {/* Minimized state */}
      {isMinimized && (
        <div className="minimized-placeholder">
          <span className="minimized-label">{title}</span>
        </div>
      )}
    </div>
  );
}
