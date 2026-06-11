import React, { useEffect, useState } from 'react';

export default function DecisionHistory({ userId = 'demo', refreshSignal = 0 }) {
  const [decisions, setDecisions] = useState([]);
  const [trend, setTrend] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (mounted) setLoading(true);
      try {
        const res = await fetch(`/api/decision?userId=${encodeURIComponent(userId)}`);
        if (!res.ok) throw new Error('Failed to load');
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          if (mounted) setDecisions([]);
          return;
        }
        const json = await res.json();
        if (mounted) {
          setDecisions(json.decisions || []);
          setTrend(json.trend || null);
        }
      } catch (err) {
        console.warn('Could not load decisions', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [userId, refreshSignal]);

  function formatRelativeTime(ts) {
    try {
      const then = new Date(ts);
      const diff = Date.now() - then.getTime();
      const s = Math.floor(diff / 1000);
      if (s < 60) return `${s}s ago`;
      const m = Math.floor(s / 60);
      if (m < 60) return `${m}m ago`;
      const h = Math.floor(m / 60);
      if (h < 24) return `${h}h ago`;
      const d = Math.floor(h / 24);
      return `${d}d ago`;
    } catch (e) {
      return '';
    }
  }

  return (
    <div className="decision-history engine-card" style={{ padding: 12 }}>
      <h3 style={{ marginTop: 0 }}>Decision History</h3>
      {trend && !loading && (
        <div style={{ marginBottom: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ padding: '4px 8px', borderRadius: 999, background: '#e0f2fe', color: '#0369a1', fontSize: 12 }}>
            {trend.trend}
          </span>
          <span style={{ color: '#475569', fontSize: 12 }}>
            Avg quality {trend.currentScore}%
          </span>
        </div>
      )}
      {loading && <div>Loading…</div>}
      {!loading && decisions.length === 0 && <div style={{ color: '#6b7280' }}>No decisions yet</div>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {decisions.map((d, i) => (
          <li key={i} style={{ padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
              <div>
                <div style={{ fontWeight: 600 }}>{d.category}</div>
                {d.overallDecisionQuality !== undefined && (
                  <div style={{ fontSize: 12, color: '#0f766e' }}>Quality {Math.round(d.overallDecisionQuality)}%</div>
                )}
              </div>
              <div style={{ fontSize: 12, color: '#6b7280' }} title={new Date(d.recorded_at || d.timestamp || Date.now()).toLocaleString()}>{formatRelativeTime(d.recorded_at || d.timestamp || Date.now())}</div>
            </div>
            <div style={{ color: '#374151', marginTop: 4 }}>{d.notes}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
