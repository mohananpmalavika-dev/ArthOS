import React, { useState } from 'react';

function validateDecision({ category, notes }) {
  const errors = {};
  if (!category || category.trim().length < 2) errors.category = 'Category must be at least 2 characters';
  if (!notes || notes.trim().length < 5) errors.notes = 'Notes must be at least 5 characters';
  return errors;
}

export default function RecordDecision({ userId = 'demo', onSaved = () => {} }) {
  const [category, setCategory] = useState('general');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  async function handleSubmit(e) {
    e.preventDefault();
    const candidate = { category, notes };
    const errs = validateDecision(candidate);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    const decision = {
      category: category.trim(),
      notes: notes.trim(),
      goalAlignment: false,
      biasScore: 0,
      futureImpact: 0,
      valueConsistency: 0,
    };

    try {
      const res = await fetch('/api/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, decision }),
      });
      if (!res.ok) throw new Error('save failed');
      onSaved();
      setNotes('');
      setCategory('general');
      setErrors({});
    } catch (err) {
      console.warn('Could not save decision', err);
      alert('Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="record-decision engine-card" onSubmit={handleSubmit} style={{ padding: 12 }}>
      <h3 style={{ marginTop: 0 }}>Record Decision</h3>
      <div style={{ marginBottom: 8 }}>
        <label style={{ display: 'block', fontSize: 12, color: '#334155' }}>Category</label>
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ width: '100%', padding: 8, borderRadius: 6, border: errors.category ? '1px solid #ef4444' : '1px solid #e5e7eb' }}
        />
        {errors.category && <div style={{ color: '#ef4444', fontSize: 12 }}>{errors.category}</div>}
      </div>
      <div style={{ marginBottom: 8 }}>
        <label style={{ display: 'block', fontSize: 12, color: '#334155' }}>Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          style={{ width: '100%', padding: 8, borderRadius: 6, border: errors.notes ? '1px solid #ef4444' : '1px solid #e5e7eb' }}
        />
        {errors.notes && <div style={{ color: '#ef4444', fontSize: 12 }}>{errors.notes}</div>}
      </div>
      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <button type="submit" disabled={saving} className="primary-link" style={{ padding: '8px 12px' }}>
          {saving ? 'Saving…' : 'Save Decision'}
        </button>
        <button type="button" onClick={() => { setCategory('general'); setNotes(''); setErrors({}); }} style={{ padding: '8px 12px' }}>
          Reset
        </button>
      </div>
    </form>
  );
}
