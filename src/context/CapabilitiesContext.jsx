/**
 * Capabilities Context & Hook
 * 
 * Provides runtime capability checking for the frontend.
 * Handles feature flags, environment configuration, and role-based access.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

const CapabilitiesContext = createContext();

export function CapabilitiesProvider({ children }) {
  const { user } = useAuth();
  const [capabilities, setCapabilities] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  // Fetch capabilities from backend
  const fetchCapabilities = useCallback(async () => {
    if (!user?.role) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `/api/config/capabilities?query=all&role=${encodeURIComponent(user.role)}`
      );

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const data = await response.json();
      setCapabilities(data.capabilities || {});
      setLastFetched(new Date());
      setError(null);
    } catch (err) {
      console.error('[Capabilities] Failed to fetch:', err);
      setError(err.message);
      // Fallback to safe defaults if fetch fails
      setCapabilities({});
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  // Fetch on mount and when user role changes
  useEffect(() => {
    if (user?.role) {
      fetchCapabilities();
    } else {
      setCapabilities({});
      setLoading(false);
    }
  }, [user?.role, fetchCapabilities]);

  // Context value
  const value = {
    capabilities,
    loading,
    error,
    lastFetched,
    refetch: fetchCapabilities,
  };

  return (
    <CapabilitiesContext.Provider value={value}>
      {children}
    </CapabilitiesContext.Provider>
  );
}

/**
 * Hook: Check if a capability is enabled
 * @param {string|string[]} capabilityId - Single capability or array to check
 * @param {object} options - { requireAll, fallback }
 * @returns {boolean} Whether the capability/capabilities are enabled
 */
export function useCapability(capabilityId, options = {}) {
  const { capabilities } = useContext(CapabilitiesContext);
  const { requireAll = false, fallback = false } = options;

  // Handle array of capabilities
  if (Array.isArray(capabilityId)) {
    if (requireAll) {
      // ALL must be enabled
      return capabilityId.every(cap => capabilities[cap]?.enabled ?? fallback);
    } else {
      // ANY can be enabled
      return capabilityId.some(cap => capabilities[cap]?.enabled ?? fallback);
    }
  }

  // Single capability
  return capabilities[capabilityId]?.enabled ?? fallback;
}

/**
 * Hook: Get capability details including enabled status and reason
 * @param {string} capabilityId - The capability ID
 * @returns {object} { enabled, reason, status, description, category, ... }
 */
export function useCapabilityDetails(capabilityId) {
  const { capabilities } = useContext(CapabilitiesContext);
  return capabilities[capabilityId] || { enabled: false, reason: 'Unknown capability' };
}

/**
 * Hook: Get all capabilities in a category
 * @param {string} category - Category name (e.g., 'banking', 'ai', 'analytics')
 * @returns {object[]} Array of capabilities in that category
 */
export function useCapabilitiesByCategory(category) {
  const { capabilities } = useContext(CapabilitiesContext);
  return Object.values(capabilities).filter(cap => cap.category === category) || [];
}

/**
 * Hook: Get only enabled capabilities by category
 * @param {string} category - Category name
 * @returns {object[]} Array of enabled capabilities in that category
 */
export function useEnabledCapabilitiesByCategory(category) {
  const { capabilities } = useContext(CapabilitiesContext);
  return Object.values(capabilities)
    .filter(cap => cap.category === category && cap.enabled) || [];
}

/**
 * Hook: Get loading and error state
 * @returns {object} { loading, error, lastFetched, refetch }
 */
export function useCapabilitiesStatus() {
  const { loading, error, lastFetched, refetch } = useContext(CapabilitiesContext);
  return { loading, error, lastFetched, refetch };
}

/**
 * HOC: Wrap component to only render if capability is enabled
 * @param {React.Component} Component - Component to conditionally render
 * @param {string|string[]} requiredCapabilities - Capability/capabilities needed
 * @param {object} options - { fallback, requireAll }
 */
export function withCapability(Component, requiredCapabilities, options = {}) {
  const { fallback: FallbackComponent, requireAll = false } = options;

  return function CapabilityGatedComponent(props) {
    const isEnabled = useCapability(requiredCapabilities, { requireAll });

    if (!isEnabled) {
      if (FallbackComponent) {
        return <FallbackComponent {...props} />;
      }
      return null;
    }

    return <Component {...props} />;
  };
}

/**
 * Component: Feature disabled notice
 */
export function CapabilityDisabledNotice({ capabilityId, fallbackText = null }) {
  const details = useCapabilityDetails(capabilityId);

  return (
    <div
      style={{
        padding: '16px',
        backgroundColor: '#f5f5f5',
        border: '1px solid #ddd',
        borderRadius: '8px',
        textAlign: 'center',
        color: '#666',
      }}
    >
      <p>
        <strong>{details.name || capabilityId}</strong> is not available
      </p>
      {details.reason && (
        <p style={{ fontSize: '12px', margin: '8px 0 0 0', color: '#999' }}>
          {details.reason}
        </p>
      )}
      {fallbackText && <p style={{ fontSize: '13px', marginTop: '8px' }}>{fallbackText}</p>}
    </div>
  );
}

export default CapabilitiesContext;
