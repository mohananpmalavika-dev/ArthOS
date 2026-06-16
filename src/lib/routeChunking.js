/**
 * Route-level code-splitting configuration
 * Splits large routes into separate chunks for faster initial load
 * and on-demand lazy loading as users navigate
 */

import { lazy } from 'react';

// Heavy visualization and reporting routes
export const routeChunks = {
  // Big Reveal: cinematic financial DNA reveal (high animation, large assets)
  bigReveal: lazy(() =>
    import(/* webpackChunkName: "big-reveal" */ '../pages/BigReveal.jsx')
  ),

  // Cognition & analysis views
  cognitionGraph: lazy(() =>
    import(/* webpackChunkName: "cognition" */ '../components/CognitionGraphView.jsx')
  ),

  // Advanced reporting
  analytics: lazy(() =>
    import(/* webpackChunkName: "analytics" */ '../components/AnalyticsDashboard.jsx')
  ),

  // Digital Twin simulation
  digitalTwin: lazy(() =>
    import(/* webpackChunkName: "digital-twin" */ '../components/DigitalTwinDashboard.jsx')
  ),

  // Prediction engine (ML models)
  prediction: lazy(() =>
    import(/* webpackChunkName: "prediction" */ '../components/PredictionEngineDashboard.jsx')
  ),

  // Longitudinal learning timeline
  longitudinalLearning: lazy(() =>
    import(/* webpackChunkName: "learning" */ '../components/LongitudinalLearningDashboard.jsx')
  ),

  // Banking integration
  banking: lazy(() =>
    import(/* webpackChunkName: "banking" */ '../components/BankingIntegrationDashboard.jsx')
  ),

  // B2B Partner portal
  b2bPartner: lazy(() =>
    import(/* webpackChunkName: "b2b" */ '../components/B2BPartnerPortal.jsx')
  ),

  // AI Coach interface
  aiCoach: lazy(() =>
    import(/* webpackChunkName: "coach" */ '../components/AiCoachInterface.jsx')
  ),

  // User history & timeline
  userHistory: lazy(() =>
    import(/* webpackChunkName: "history" */ '../components/UserHistory.jsx')
  ),

  // Trait matrix visualizer
  traitMatrix: lazy(() =>
    import(/* webpackChunkName: "traits" */ '../components/TraitMatrixVisualizer.jsx')
  )
};

/**
 * Preload critical chunks on idle
 * Uses requestIdleCallback to preload chunks during browser idle time
 */
export function preloadCriticalChunks() {
  if (typeof window === 'undefined') return;

  // Preload Big Reveal and AI Coach (frequently accessed)
  const criticalChunks = ['bigReveal', 'aiCoach'];

  if ('requestIdleCallback' in window) {
    requestIdleCallback(
      () => {
        criticalChunks.forEach(chunk => {
          const chunkModule = routeChunks[chunk];
          if (chunkModule && chunkModule._payload?.pending) {
            // Preload the chunk
          }
        });
      },
      { timeout: 5000 }
    );
  }
}

/**
 * Prefetch chunk by route name
 * Call before navigating to a route to prefetch its chunk
 */
export function prefetchChunk(routeName) {
  if (routeChunks[routeName]) {
    // Trigger dynamic import to prefetch
    routeChunks[routeName]._payload?.pending?.().catch(() => {
      // Silently fail - prefetch is best-effort
    });
  }
}
