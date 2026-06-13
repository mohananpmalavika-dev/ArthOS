/**
 * Roast Analytics Service
 *
 * Tracks viral share metrics for the Financial Roast
 * - Share events (WhatsApp, Twitter, Facebook, etc.)
 * - CTA clicks (Generate Your Own)
 * - Roast view metrics
 * - Conversion funnel from share → generation
 */

const ROAST_ANALYTICS_KEY = "arth-os-roast-analytics";

export class RoastAnalytics {
  constructor() {
    this.data = this.loadData();
  }

  /**
   * Track a share event
   */
  trackShare(platform, payload = {}) {
    const event = {
      type: "share",
      platform,
      timestamp: new Date().toISOString(),
      ...payload
    };

    this.data.shares.push(event);
    this.persistData();

    // Also send to backend/analytics service if available
    this.sendToBackend("roast_share", { platform, ...payload });

    return event;
  }

  /**
   * Track when user clicks "Generate Your Own"
   */
  trackGenerateYourOwnCTA(source = "roast_view") {
    const event = {
      type: "cta_click",
      source,
      timestamp: new Date().toISOString()
    };

    this.data.ctaClicks.push(event);
    this.persistData();

    this.sendToBackend("roast_cta_click", { source });

    return event;
  }

  /**
   * Track roast view (when someone lands on /roast/:id)
   */
  trackRoastView(roastId, source = "unknown") {
    const event = {
      type: "roast_view",
      roastId,
      source, // 'whatsapp', 'twitter', 'direct', etc.
      timestamp: new Date().toISOString()
    };

    this.data.views.push(event);
    this.persistData();

    this.sendToBackend("roast_view", { roastId, source });

    return event;
  }

  /**
   * Track roast generation completion
   */
  trackRoastGenerated(personalityType, score) {
    const event = {
      type: "roast_generated",
      personalityType,
      score: Math.round(score),
      timestamp: new Date().toISOString()
    };

    this.data.generated.push(event);
    this.persistData();

    this.sendToBackend("roast_generated", { personalityType, score });

    return event;
  }

  /**
   * Get aggregated metrics
   */
  getMetrics() {
    const now = new Date();
    const lastDay = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const shares24h = this.data.shares.filter(s => new Date(s.timestamp) > lastDay);
    const views24h = this.data.views.filter(v => new Date(v.timestamp) > lastDay);
    const ctaClicks24h = this.data.ctaClicks.filter(c => new Date(c.timestamp) > lastDay);

    const sharesWeek = this.data.shares.filter(s => new Date(s.timestamp) > lastWeek);
    const viewsWeek = this.data.views.filter(v => new Date(v.timestamp) > lastWeek);

    // Platform breakdown (24h)
    const platformBreakdown = {};
    shares24h.forEach(s => {
      platformBreakdown[s.platform] = (platformBreakdown[s.platform] || 0) + 1;
    });

    // Conversion rate (views → CTA clicks)
    const conversionRate24h =
      views24h.length > 0 ? ((ctaClicks24h.length / views24h.length) * 100).toFixed(1) : 0;
    const conversionRateWeek =
      viewsWeek.length > 0
        ? (
            (this.data.ctaClicks.filter(c => new Date(c.timestamp) > lastWeek).length /
              viewsWeek.length) *
            100
          ).toFixed(1)
        : 0;

    // Top personalities
    const personalityBreakdown = {};
    this.data.generated.forEach(g => {
      personalityBreakdown[g.personalityType] = (personalityBreakdown[g.personalityType] || 0) + 1;
    });

    return {
      last24h: {
        shares: shares24h.length,
        views: views24h.length,
        ctaClicks: ctaClicks24h.length,
        conversionRate: conversionRate24h + "%",
        platformBreakdown
      },
      lastWeek: {
        shares: sharesWeek.length,
        views: viewsWeek.length,
        conversionRate: conversionRateWeek + "%"
      },
      allTime: {
        totalShares: this.data.shares.length,
        totalViews: this.data.views.length,
        totalCTAClicks: this.data.ctaClicks.length,
        totalGenerated: this.data.generated.length,
        personalityBreakdown,
        avgScore:
          this.data.generated.length > 0
            ? (
                this.data.generated.reduce((sum, g) => sum + g.score, 0) /
                this.data.generated.length
              ).toFixed(1)
            : 0
      }
    };
  }

  /**
   * Get viral coefficient (estimated)
   * (New shares generated from views) / Total existing shares
   */
  getViralCoefficient() {
    // This is a simplified estimation
    // In production, would need more sophisticated tracking
    const totalShares = this.data.shares.length;
    const totalViews = this.data.views.length;

    if (totalViews === 0) {
      return 0;
    }

    // Approximate: number of new roasts generated from shared links
    const fromSharedLinks = this.data.generated.filter(
      g => g.timestamp > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;

    return totalShares > 0 ? (fromSharedLinks / totalShares).toFixed(2) : 0;
  }

  /**
   * Export metrics for dashboard
   */
  exportMetrics() {
    return {
      metrics: this.getMetrics(),
      viralCoefficient: this.getViralCoefficient(),
      allEvents: {
        shares: this.data.shares,
        views: this.data.views,
        ctaClicks: this.data.ctaClicks,
        generated: this.data.generated
      }
    };
  }

  /**
   * Clear local analytics (for testing)
   */
  clear() {
    this.data = this.initData();
    this.persistData();
  }

  /**
   * Private methods
   */

  initData() {
    return {
      shares: [],
      views: [],
      ctaClicks: [],
      generated: []
    };
  }

  loadData() {
    try {
      if (typeof localStorage === "undefined") {
        return this.initData();
      }
      const stored = localStorage.getItem(ROAST_ANALYTICS_KEY);
      return stored ? JSON.parse(stored) : this.initData();
    } catch (err) {
      console.warn("Failed to load roast analytics:", err);
      return this.initData();
    }
  }

  persistData() {
    try {
      if (typeof localStorage === "undefined") {
        return;
      }
      localStorage.setItem(ROAST_ANALYTICS_KEY, JSON.stringify(this.data));
    } catch (err) {
      console.warn("Failed to persist roast analytics:", err);
    }
  }

  /**
   * Send analytics to backend (if backend endpoint available)
   */
  sendToBackend(eventType, payload) {
    // This would send to an actual analytics backend
    // For now, just log
    console.log(`[Roast Analytics] ${eventType}:`, payload);

    // In production, would call:
    // fetch('/api/analytics/roast', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ eventType, payload, timestamp: new Date().toISOString() })
    // }).catch(err => console.warn('Analytics send failed:', err));
  }
}

// Export singleton instance
export const roastAnalytics = new RoastAnalytics();
