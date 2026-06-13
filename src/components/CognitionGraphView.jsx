import React from "react";
import { ArrowRight, CircleDot } from "lucide-react";

export default function CognitionGraphView({ nodes = [], edges = [] }) {
  if (nodes.length === 0) {
    return (
      <div
        style={{
          padding: 18,
          color: "var(--muted-3)",
          background: "var(--surface-3)",
          borderRadius: 16
        }}
      >
        <strong>No cognition graph data available yet.</strong>
        <p style={{ marginTop: 8, color: "var(--muted)" }}>
          Complete more assessments and reflections to populate the belief → bias → decision
          network.
        </p>
      </div>
    );
  }

  return (
    <div className="cognition-graph-view">
      <div className="graph-legend">Financial cognition network</div>
      <div className="graph-grid">
        {["beliefs", "biases", "emotions", "decisions", "outcomes"].map(group => (
          <div key={group} className="graph-column">
            <div className="graph-column-header">
              {group.charAt(0).toUpperCase() + group.slice(1)}
            </div>
            {nodes
              .filter(node => node.group === group)
              .map(node => (
                <div key={node.id} className="graph-node">
                  <CircleDot size={12} style={{ marginRight: 8 }} />
                  <span>{node.title}</span>
                </div>
              ))}
          </div>
        ))}
      </div>
      <div className="graph-edges">
        {edges.map((edge, index) => (
          <div key={index} className="graph-edge">
            <ArrowRight size={14} />
            <span>
              {edge.source} → {edge.target}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
