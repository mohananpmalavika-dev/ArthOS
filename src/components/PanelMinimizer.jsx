import React, { useState } from "react";
import { Minimize2, Maximize2 } from "lucide-react";

/**
 * PanelMinimizer Hook
 * Provides minimize state management for any panel component
 */
export function useMinimize(initialMinimized = false) {
  const [isMinimized, setIsMinimized] = useState(initialMinimized);

  return {
    isMinimized,
    setIsMinimized,
    toggleMinimize: () => setIsMinimized(prev => !prev)
  };
}

/**
 * PanelMinimizeButton
 * Reusable button component for minimize/restore actions
 */
export function PanelMinimizeButton({ isMinimized, onToggle, title = "Panel" }) {
  return (
    <button
      type="button"
      className="panel-minimize-button"
      onClick={onToggle}
      aria-label={isMinimized ? `Restore ${title}` : `Minimize ${title}`}
      title={isMinimized ? `Restore ${title}` : `Minimize ${title}`}
    >
      {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
    </button>
  );
}

/**
 * MinimizablePanel Wrapper
 * Wraps any panel content and adds minimize functionality
 */
export default function MinimizablePanel({
  children,
  className = "",
  headerContent,
  isMinimized = false,
  onMinimizeToggle,
  title
}) {
  return (
    <div className={`minimizable-panel ${isMinimized ? "is-minimized" : ""} ${className}`.trim()}>
      {isMinimized && (
        <div className="minimized-header">
          <div className="minimized-title">{title}</div>
          <PanelMinimizeButton
            isMinimized={true}
            onToggle={onMinimizeToggle}
            title={title}
          />
        </div>
      )}
      {!isMinimized && children}
    </div>
  );
}
