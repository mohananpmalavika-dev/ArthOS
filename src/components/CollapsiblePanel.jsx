import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";

const MAX_VISIBLE_LINES = 25;

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
  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [pageHeight, setPageHeight] = useState(null);
  const contentRef = useRef(null);
  const label = `${collapsed ? "Expand" : "Minimize"} ${title || "panel"}`;

  useEffect(() => {
    if (collapsed || !contentRef.current) {
      return undefined;
    }

    const content = contentRef.current;

    const measure = () => {
      const styles = window.getComputedStyle(content);
      const fontSize = parseFloat(styles.fontSize) || 16;
      const lineHeightValue = parseFloat(styles.lineHeight);
      const lineHeight = Number.isFinite(lineHeightValue) ? lineHeightValue : fontSize * 1.55;
      const nextPageHeight = Math.ceil(lineHeight * MAX_VISIBLE_LINES);
      const nextPageCount = Math.max(1, Math.ceil(content.scrollHeight / nextPageHeight));

      setPageHeight(nextPageHeight);
      setPageCount(nextPageCount);
      setPageIndex(current => Math.min(current, nextPageCount - 1));
    };

    measure();

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(content);
    window.addEventListener("resize", measure);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [collapsed, children]);

  const isPaginated = pageCount > 1 && pageHeight;
  const pageOffset = isPaginated ? pageIndex * pageHeight : 0;

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
        <>
          <div
            className={`collapsible-panel-viewport ${isPaginated ? "is-paginated" : ""}`}
            style={isPaginated ? { height: pageHeight } : undefined}
          >
            <div
              ref={contentRef}
              className={`collapsible-panel-content ${contentClassName}`.trim()}
              style={
                isPaginated
                  ? { transform: `translateY(-${pageOffset}px)` }
                  : undefined
              }
            >
              {children}
            </div>
          </div>

          {isPaginated && (
            <div className="collapsible-panel-pagination" aria-label={`${title || "Panel"} pages`}>
              <button
                type="button"
                className="collapsible-panel-page-button"
                onClick={() => setPageIndex(current => Math.max(0, current - 1))}
                disabled={pageIndex === 0}
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
                Previous
              </button>
              <span>
                Page {pageIndex + 1} of {pageCount}
              </span>
              <button
                type="button"
                className="collapsible-panel-page-button"
                onClick={() => setPageIndex(current => Math.min(pageCount - 1, current + 1))}
                disabled={pageIndex >= pageCount - 1}
                aria-label="Next page"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </Component>
  );
}
