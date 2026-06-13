import React from "react";

export default function BehaviourDrivers({ drivers = [] }) {
  if (!drivers || drivers.length === 0) {
    return null;
  }

  return (
    <section className="behaviour-drivers-card result-card">
      <div className="result-heading">
        <h2>What Drives Your Score</h2>
      </div>

      <ul className="drivers-list">
        {drivers.map((d, i) => (
          <li key={i} className="driver-item">
            <div className="driver-title">{d.title}</div>
            <div className={`driver-impact ${d.impact < 0 ? "negative" : "positive"}`}>
              {d.impact}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
