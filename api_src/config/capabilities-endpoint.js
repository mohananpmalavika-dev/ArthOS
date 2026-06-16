/**
 * Capabilities API Endpoint
 * GET /api/config/capabilities
 * 
 * Returns the capability registry for the current user.
 * Respects user role and environment configuration.
 */

import { getCapabilitiesStatus, getCapabilitiesByCategory, getCapability } from './capabilities.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Extract user info from context (if authenticated)
    // This would come from middleware in production
    const userRole = req.query.role || 'user'; // Default to user role
    const query = req.query.query || 'all'; // 'all', 'category', 'specific'

    const options = {
      userRole,
      forceDisabled: {}, // Could come from admin config
    };

    let capabilities;

    if (query === 'all') {
      // Return all capabilities with their status
      capabilities = getCapabilitiesStatus(options);
    } else if (query === 'category') {
      // Return capabilities for a specific category
      const category = req.query.category;
      if (!category) {
        return res.status(400).json({ error: 'Missing category parameter' });
      }
      capabilities = getCapabilitiesByCategory(category, { ...options, onlyEnabled: false });
    } else if (query === 'enabled') {
      // Return only enabled capabilities grouped by category
      const categories = [
        'core',
        'banking',
        'b2b',
        'analytics',
        'ml',
        'ai',
        'billing',
        'admin',
        'marketplace',
        'simulation',
        'ux',
        'engagement',
      ];

      capabilities = {};
      for (const category of categories) {
        capabilities[category] = getCapabilitiesByCategory(category, {
          ...options,
          onlyEnabled: true,
        });
      }
    } else if (query === 'specific') {
      // Return details for a specific capability
      const capId = req.query.capabilityId;
      if (!capId) {
        return res.status(400).json({ error: 'Missing capabilityId parameter' });
      }
      capabilities = getCapability(capId, options);
    } else {
      return res.status(400).json({ error: 'Invalid query parameter' });
    }

    return res.status(200).json({
      success: true,
      capabilities,
      userRole,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[capabilities] Error:', err);
    return res.status(500).json({
      error: 'Failed to fetch capabilities',
      message: err.message,
    });
  }
}
