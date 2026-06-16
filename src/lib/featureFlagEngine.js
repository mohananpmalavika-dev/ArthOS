/**
 * Feature Flags & Experiment Engine
 * Centralized A/B testing, feature toggles, and variant assignment
 * Supports server-side and client-side flags
 */

import { useState, useEffect, useContext, createContext } from 'react';

// Feature flag definitions with default values
export const FEATURES = {
  // UI/UX experiments
  BIG_REVEAL_V2: 'big_reveal_v2', // New animation effects
  COACHING_GUIDED_MODE: 'coaching_guided_mode', // Step-by-step coaching
  DASHBOARD_REDESIGN: 'dashboard_redesign', // New dashboard layout

  // Performance features
  OFFLINE_MODE: 'offline_mode', // Full offline support
  AGGRESSIVE_CACHING: 'aggressive_caching', // Aggressive data caching

  // Data features
  BANKING_SYNC: 'banking_sync', // Banking account sync
  TRANSACTION_CLASSIFICATION: 'transaction_classification', // AI transaction labeling

  // Retention features
  PUSH_NOTIFICATIONS: 'push_notifications', // Push notifications
  EMAIL_DIGEST: 'email_digest' // Weekly email digest
};

// Experiment variants (A/B groups)
export const VARIANTS = {
  CONTROL: 'control',
  TREATMENT: 'treatment',
  TREATMENT_2: 'treatment_2'
};

class FeatureFlagManager {
  constructor() {
    this.flags = {};
    this.variants = {};
    this.userId = null;
    this.sessionId = null;
  }

  /**
   * Initialize flags from localStorage + server
   */
  async initialize(userId) {
    this.userId = userId;
    this.sessionId = this._generateSessionId();

    // Load from localStorage first (for instant availability)
    const cached = this._loadFromCache();
    if (cached) {
      this.flags = cached.flags;
      this.variants = cached.variants;
    }

    // Fetch from server in background for fresh data
    try {
      const response = await fetch(`/api/features?userId=${encodeURIComponent(userId)}`, {
        signal: AbortSignal.timeout(3000) // Don't wait more than 3s
      });

      if (response.ok) {
        const data = await response.json();
        this.flags = data.flags || {};
        this.variants = data.variants || {};
        this._saveToCache();
      }
    } catch (err) {
      console.warn('Failed to fetch feature flags:', err);
      // Continue with cached/default flags
    }
  }

  /**
   * Check if a feature is enabled for user
   */
  isEnabled(featureName) {
    return this.flags[featureName] === true;
  }

  /**
   * Get experiment variant for a feature
   */
  getVariant(featureName) {
    return this.variants[featureName] || VARIANTS.CONTROL;
  }

  /**
   * Check if user is in treatment group
   */
  isTreatment(featureName) {
    const variant = this.getVariant(featureName);
    return variant !== VARIANTS.CONTROL;
  }

  /**
   * Record experiment event (for analytics)
   */
  recordExperimentEvent(featureName, eventType, metadata = {}) {
    if (typeof window === 'undefined') return;

    const event = {
      type: 'experiment_event',
      feature: featureName,
      variant: this.getVariant(featureName),
      eventType,
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      metadata
    };

    // Send to analytics endpoint (non-blocking)
    fetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    }).catch(() => {
      // Silently fail
    });
  }

  /**
   * Prefetch flags for a feature before using it
   */
  async prefetchFeature(featureName) {
    if (!this.flags[featureName]) {
      try {
        const response = await fetch(
          `/api/features/${featureName}?userId=${encodeURIComponent(this.userId)}`,
          { signal: AbortSignal.timeout(2000) }
        );
        if (response.ok) {
          const data = await response.json();
          this.flags[featureName] = data.enabled;
          this.variants[featureName] = data.variant;
          this._saveToCache();
        }
      } catch (err) {
        console.warn(`Failed to prefetch feature ${featureName}:`, err);
      }
    }
  }

  // Private methods
  _saveToCache() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(
        'arth-os-feature-flags',
        JSON.stringify({
          flags: this.flags,
          variants: this.variants,
          timestamp: Date.now()
        })
      );
    } catch (e) {
      console.warn('Could not save feature flags to cache:', e);
    }
  }

  _loadFromCache() {
    if (typeof window === 'undefined') return null;
    try {
      const cached = localStorage.getItem('arth-os-feature-flags');
      if (cached) {
        const parsed = JSON.parse(cached);
        // Cache valid for 24 hours
        if (Date.now() - parsed.timestamp < 86400000) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not load feature flags from cache:', e);
    }
    return null;
  }

  _generateSessionId() {
    if (typeof window === 'undefined') return 'server-session';
    if (!window.__sessionId) {
      window.__sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
    return window.__sessionId;
  }
}

// Singleton instance
export const featureFlagManager = new FeatureFlagManager();

// React Context & Hook
const FeatureFlagContext = createContext();

export function FeatureFlagProvider({ children, userId }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    featureFlagManager.initialize(userId).then(() => setIsReady(true));
  }, [userId]);

  return (
    <FeatureFlagContext.Provider value={{ isReady }}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlag(featureName) {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error('useFeatureFlag must be used within FeatureFlagProvider');
  }

  const isEnabled = featureFlagManager.isEnabled(featureName);
  const variant = featureFlagManager.getVariant(featureName);
  const isTreatment = featureFlagManager.isTreatment(featureName);

  return {
    isEnabled,
    variant,
    isTreatment,
    recordEvent: (eventType, metadata) =>
      featureFlagManager.recordExperimentEvent(featureName, eventType, metadata),
    prefetch: () => featureFlagManager.prefetchFeature(featureName)
  };
}

/**
 * Wrapper to conditionally render based on feature flag
 */
export function FeatureGate({ feature, children, fallback = null }) {
  const { isEnabled } = useFeatureFlag(feature);
  return isEnabled ? children : fallback;
}
