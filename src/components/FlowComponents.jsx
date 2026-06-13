import React from "react";

export function FlowSection({ id, active = false, title, description, badge, children }) {
  return (
    <section className={`flow-section ${active ? "active" : ""}`} id={id}>
      <div className="flow-section-container">
        {(title || description || badge) && (
          <div className="flow-section-header">
            {title && <h1>{title}</h1>}
            {description && <p>{description}</p>}
            {badge && <span>{badge}</span>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

export function FlowCard({ title, description, meta, icon: Icon, children, onClick, href }) {
  const className = "flow-card";
  const content = (
    <>
      {Icon && (
        <div className="flow-card-icon">
          <Icon size={24} />
        </div>
      )}
      {title && <div className="flow-card-title">{title}</div>}
      {description && <div className="flow-card-desc">{description}</div>}
      {children}
      {meta && <div className="flow-card-meta">{meta}</div>}
    </>
  );

  if (href) {
    return (
      <a href={href} className={className}>
        {content}
      </a>
    );
  }

  return (
    <div className={className} onClick={onClick} style={onClick ? { cursor: "pointer" } : {}}>
      {content}
    </div>
  );
}

export function FlowCardsGrid({ children }) {
  return <div className="flow-cards-grid">{children}</div>;
}

export function FlowHighlightCard({ title, description, ctaLabel, onCta, visual, children }) {
  return (
    <div className="flow-highlight-card">
      <div className="flow-highlight-content">
        {title && <h2>{title}</h2>}
        {description && <p>{description}</p>}
        {children}
        {ctaLabel && (
          <button className="flow-highlight-cta" onClick={onCta}>
            {ctaLabel}
          </button>
        )}
      </div>
      {visual && <div className="flow-highlight-visual">{visual}</div>}
    </div>
  );
}

export function FlowProgressTracker({ items, currentIndex = 0 }) {
  return (
    <div className="flow-progress-tracker">
      {items.map((item, idx) => (
        <div
          key={`progress-${idx}`}
          className={`flow-progress-item ${
            idx < currentIndex ? "completed" : idx === currentIndex ? "active" : ""
          }`}
        >
          <div className="flow-progress-number">{idx + 1}</div>
          <div className="flow-progress-content">
            <div className="flow-progress-label">{item.label}</div>
            {item.description && <div className="flow-progress-desc">{item.description}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
