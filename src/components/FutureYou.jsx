import React from "react";
import { motion } from "framer-motion";

export default function FutureYou({ data = {} }) {
  const { age = 35, emergency = '₹0', debt = '₹0', stress = 'Unknown' } = data;

  return (
    <motion.div className="future-you-card" style={{ padding: 24, borderRadius: 14, background: 'linear-gradient(135deg, rgba(6,182,212,0.06), rgba(70,102,228,0.04))', border: '1px solid rgba(6,182,212,0.08)' }} animate={{ y: [0, -6, 0] }} transition={{ duration: 6, repeat: Infinity }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <div className="future-avatar" style={{ width: 96, height: 96, borderRadius: 12, background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18 }}>Future</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>You • {age}</div>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0 }}>Projected Snapshot</h3>
          <p style={{ margin: '6px 0 12px', color: 'var(--ink-3)' }}>A holographic glimpse of a focused, resilient future you.</p>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ padding: 12, borderRadius: 10, background: 'var(--white)', border: '1px solid var(--gray-100)' }}>
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Emergency Fund</div>
              <div style={{ fontWeight: 700 }}>{emergency}</div>
            </div>
            <div style={{ padding: 12, borderRadius: 10, background: 'var(--white)', border: '1px solid var(--gray-100)' }}>
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Debt</div>
              <div style={{ fontWeight: 700 }}>{debt}</div>
            </div>
            <div style={{ padding: 12, borderRadius: 10, background: 'var(--white)', border: '1px solid var(--gray-100)' }}>
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Stress</div>
              <div style={{ fontWeight: 700 }}>{stress}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
