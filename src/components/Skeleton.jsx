import React from 'react';

export function Skeleton({ width = '100%', height = 16, style = {} }) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius: 4, background: 'linear-gradient(90deg,#eee,#f5f5f5,#eee)', ...style }}
      aria-hidden="true"
    />
  );
}

export function ListSkeleton({ count = 4 }) {
  return (
    <div className="list-skeleton">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="list-skeleton-item" style={{ marginBottom: 12 }}>
          <Skeleton height={14} width="60%" />
          <div style={{ height: 8 }} />
          <Skeleton height={12} width="100%" />
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton({ headerWidth = '42%', subtitleWidth = '62%', blockCount = 4, showHeader = true }) {
  return (
    <section className="page-skeleton" aria-busy="true">
      {showHeader && (
        <div className="page-skeleton-header">
          <Skeleton width={headerWidth} height={28} />
          <Skeleton width={subtitleWidth} height={16} style={{ marginTop: 12 }} />
        </div>
      )}
      <div className="page-skeleton-grid">
        {Array.from({ length: blockCount }).map((_, index) => (
          <div key={index} className="page-skeleton-card">
            <div className="page-skeleton-card-header">
              <Skeleton width="48%" height={18} />
              <Skeleton width="28%" height={14} />
            </div>
            <div className="page-skeleton-card-body">
              <Skeleton height={12} width="90%" />
              <Skeleton height={12} width="100%" style={{ marginTop: 14 }} />
              <Skeleton height={12} width="100%" />
              <Skeleton height={12} width="80%" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Skeleton;
