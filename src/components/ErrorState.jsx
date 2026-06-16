import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorState({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="error-state" role="alert" aria-live="polite">
      <div className="error-icon"><AlertCircle size={36} /></div>
      <div className="error-content">
        <h3>{title}</h3>
        {message && <p className="muted">{message}</p>}
        <div className="error-actions">
          {onRetry && (
            <button className="btn btn-primary" onClick={onRetry} aria-label="Retry">
              <RefreshCw size={14} /> Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
