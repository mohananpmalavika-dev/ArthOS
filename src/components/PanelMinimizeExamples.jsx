import React, { useState } from "react";
import { PanelMinimizeButton } from "./PanelMinimizer.jsx";

/**
 * Example: How to add minimize to existing panels
 * 
 * BEFORE:
 * <section className="panel">
 *   <div className="panel-heading">
 *     <h2>My Panel</h2>
 *   </div>
 *   <Content />
 * </section>
 * 
 * AFTER:
 * <section className={`panel ${isMinimized ? 'is-minimized' : ''}`}>
 *   <div className="panel-heading">
 *     <h2>My Panel</h2>
 *     <div className="panel-heading-controls">
 *       <PanelMinimizeButton ... />
 *     </div>
 *   </div>
 *   {!isMinimized && <Content />}
 * </section>
 */

export function ExampleMinimizablePanel() {
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <section className={`panel ${isMinimized ? "is-minimized" : ""}`}>
      {/* Panel Header with Minimize Button */}
      <div className="panel-heading">
        <div>
          <h2>Example Panel with Minimize</h2>
        </div>
        <div className="panel-heading-controls">
          <PanelMinimizeButton
            isMinimized={isMinimized}
            onToggle={() => setIsMinimized(!isMinimized)}
            title="Example Panel"
          />
        </div>
      </div>

      {/* Content - Only show when not minimized */}
      {!isMinimized && (
        <div className="panel-content">
          <p>This content is hidden when minimized.</p>
          <p>Click the minimize button to toggle the content visibility.</p>
        </div>
      )}
    </section>
  );
}

/**
 * Example: Using PanelWithMinimize for summary cards
 */
import PanelWithMinimize from "./PanelWithMinimize.jsx";

export function ExampleSummaryCardWithMinimize() {
  return (
    <PanelWithMinimize
      title="Summary Card with Minimize"
      className="summary-card"
    >
      <div>
        <p>This is a summary card with built-in minimize functionality.</p>
        <p>When minimized, only the title is shown.</p>
      </div>
    </PanelWithMinimize>
  );
}

/**
 * Example: Using CollapsiblePanel with minimize
 */
import CollapsiblePanel from "./CollapsiblePanel.jsx";
import { TrendingUp } from "lucide-react";

export function ExampleCollapsiblePanelWithMinimize() {
  return (
    <CollapsiblePanel
      title="Collapsible with Minimize"
      icon={<TrendingUp size={20} />}
      subtitle="Both collapse and minimize controls are available"
    >
      <div style={{ padding: "16px 0" }}>
        <p>This panel has both collapse and minimize buttons:</p>
        <ul>
          <li>Collapse button (ChevronUp/Down) - hides content but keeps header</li>
          <li>Minimize button (Minimize/Maximize) - hides all content</li>
        </ul>
        <p>You can use them independently or together.</p>
      </div>
    </CollapsiblePanel>
  );
}
