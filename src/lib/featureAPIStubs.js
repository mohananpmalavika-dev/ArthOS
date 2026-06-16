/**
 * API Stub Handlers for Feature Implementation
 * Deploy these endpoints to your backend
 * Mock versions for development
 */

export const featureAPIHandlers = {
  /**
   * Feature Flags API
   * GET /api/features?userId={userId}
   */
  getFeatureFlags: async (userId) => {
    return {
      flags: {
        big_reveal_v2: true,
        coaching_guided_mode: false,
        dashboard_redesign: true,
        offline_mode: true,
        aggressive_caching: true,
        banking_sync: true,
        transaction_classification: false,
        push_notifications: false,
        email_digest: true
      },
      variants: {
        big_reveal_v2: 'control',
        coaching_guided_mode: 'control',
        dashboard_redesign: 'treatment',
        offline_mode: 'control'
      }
    };
  },

  /**
   * Get single feature flag
   * GET /api/features/{featureName}?userId={userId}
   */
  getFeature: async (featureName, userId) => {
    const flags = await featureAPIHandlers.getFeatureFlags(userId);
    return {
      enabled: flags.flags[featureName] || false,
      variant: flags.variants[featureName] || 'control'
    };
  },

  /**
   * Analytics Events API
   * POST /api/analytics/events
   */
  recordEvent: async (event) => {
    console.log('Event recorded:', event);
    return { success: true };
  },

  /**
   * Data Export API
   * POST /api/user/export
   * Body: { format: 'json' | 'csv' }
   */
  exportUserData: async (userId, format = 'json') => {
    const data = {
      personal: {
        id: userId,
        email: 'user@example.com',
        createdAt: new Date().toISOString()
      },
      assessments: [
        // Mock assessment data
      ],
      banking: [
        // Mock banking data
      ],
      insights: [
        // Mock insights
      ]
    };

    if (format === 'csv') {
      return convertToCSV(data);
    }
    return JSON.stringify(data, null, 2);
  },

  /**
   * Account Deletion API
   * DELETE /api/user/delete
   * Body: { backup: boolean }
   */
  deleteAccount: async (userId, backup = false) => {
    console.log(`Deleting account for ${userId}, backup: ${backup}`);

    if (backup) {
      // Create backup before deletion
      await featureAPIHandlers.exportUserData(userId, 'json');
    }

    // Delete from database
    return { success: true, deletedAt: new Date().toISOString() };
  },

  /**
   * Update Retention Policy
   * PATCH /api/user/retention/{categoryId}
   * Body: { retention: 'immediate' | customDate }
   */
  updateRetentionPolicy: async (userId, categoryId, retention) => {
    console.log(`Updated retention for ${categoryId} to ${retention}`);
    return { success: true };
  }
};

/**
 * Mock Service Worker handlers (for MSW integration)
 * Use this in development/testing
 */
export const mockHandlers = [
  // Feature Flags
  http.get('/api/features', ({ request }) => {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    return HttpResponse.json(featureAPIHandlers.getFeatureFlags(userId));
  }),

  http.get('/api/features/:featureName', ({ params, request }) => {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    return HttpResponse.json(featureAPIHandlers.getFeature(params.featureName, userId));
  }),

  // Analytics
  http.post('/api/analytics/events', async ({ request }) => {
    const event = await request.json();
    return HttpResponse.json(featureAPIHandlers.recordEvent(event));
  }),

  // Data Management
  http.post('/api/user/export', async ({ request }) => {
    const { format } = await request.json();
    const data = await featureAPIHandlers.exportUserData('user-123', format);
    return new HttpResponse(data, {
      headers: {
        'Content-Type': format === 'csv' ? 'text/csv' : 'application/json',
        'Content-Disposition': `attachment; filename="export.${format}"`
      }
    });
  }),

  http.delete('/api/user/delete', async ({ request }) => {
    const { backup } = await request.json();
    const result = await featureAPIHandlers.deleteAccount('user-123', backup);
    return HttpResponse.json(result);
  }),

  http.patch('/api/user/retention/:categoryId', async ({ params, request }) => {
    const { retention } = await request.json();
    const result = await featureAPIHandlers.updateRetentionPolicy('user-123', params.categoryId, retention);
    return HttpResponse.json(result);
  })
];

/**
 * Helper to convert data to CSV format
 */
function convertToCSV(data) {
  let csv = 'Data Export from ArthOS\n';
  csv += `Export Date: ${new Date().toISOString()}\n\n`;

  // Personal data
  csv += 'PERSONAL INFORMATION\n';
  csv += `ID,Email,Created\n`;
  csv += `${data.personal.id},${data.personal.email},${data.personal.createdAt}\n\n`;

  // Assessments
  if (data.assessments.length > 0) {
    csv += 'ASSESSMENTS\n';
    csv += 'Date,Score,Category\n';
    data.assessments.forEach(a => {
      csv += `${a.date},${a.score},${a.category}\n`;
    });
    csv += '\n';
  }

  return csv;
}
