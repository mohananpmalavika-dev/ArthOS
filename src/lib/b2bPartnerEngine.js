/**
 * B2B Partner Engine — Core business logic for ARTH.OS Partner Layer
 *
 * Handles:
 * - Partner registration & onboarding
 * - API key generation & validation
 * - Tiered plan management (free/starter/pro/enterprise)
 * - Usage tracking & rate limiting
 * - Revenue share computation & auto-billing
 * - Invoice generation
 * - Webhook dispatch
 * - Embedded finance intelligence API logic
 * - Partner-level analytics aggregation
 *
 * Blueprint §19: B2B/OS Layer — full B2B2C monetization path.
 */

// ─── In-memory stores (in production, replace with DB) ───
const partners = new Map();
const apiKeys = new Map();
const usageLog = [];
const revenueLog = [];
const invoices = new Map();
const webhookRegistrations = new Map(); // partnerId -> [{ url, events, active }]

// ─── Tier definitions ───
export const PARTNER_TIERS = {
  free: {
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    rateLimit: { requestsPerMinute: 10, requestsPerMonth: 500 },
    features: ['health_score', 'risk_profile_basic'],
    revenueSharePct: 0,
    maxUsers: 50,
    apiKeys: 2,
  },
  starter: {
    name: 'Starter',
    monthlyPrice: 299,
    annualPrice: 2990, // ~17% discount
    rateLimit: { requestsPerMinute: 60, requestsPerMonth: 10000 },
    features: ['health_score', 'risk_profile', 'behaviour_insights', 'basic_recommendations'],
    revenueSharePct: 15,
    maxUsers: 1000,
    apiKeys: 5,
  },
  pro: {
    name: 'Pro',
    monthlyPrice: 999,
    annualPrice: 9990,
    rateLimit: { requestsPerMinute: 300, requestsPerMonth: 100000 },
    features: [
      'health_score', 'risk_profile', 'behaviour_insights',
      'basic_recommendations', 'cognitive_biases', 'emotional_triggers',
      'forecast_engine', 'marketplace_recommendations', 'decision_intelligence',
    ],
    revenueSharePct: 10,
    maxUsers: 50000,
    apiKeys: 25,
  },
  enterprise: {
    name: 'Enterprise',
    monthlyPrice: 4999,
    annualPrice: 49990,
    rateLimit: { requestsPerMinute: 1000, requestsPerMonth: 1000000 },
    features: [
      'health_score', 'risk_profile', 'behaviour_insights',
      'basic_recommendations', 'cognitive_biases', 'emotional_triggers',
      'forecast_engine', 'marketplace_recommendations', 'decision_intelligence',
      'financial_twin', 'custom_models', 'dedicated_support', 'white_label',
    ],
    revenueSharePct: 5,
    maxUsers: Infinity,
    apiKeys: 100,
  },
};

// ─── Webhook event types ───
export const WEBHOOK_EVENTS = {
  PARTNER_CREATED: 'partner.created',
  PARTNER_TIER_CHANGED: 'partner.tier_changed',
  PARTNER_SUSPENDED: 'partner.suspended',
  PARTNER_REACTIVATED: 'partner.reactivated',
  PARTNER_API_KEY_ROTATED: 'partner.api_key_rotated',
  INVOICE_CREATED: 'invoice.created',
  INVOICE_PAID: 'invoice.paid',
  INVOICE_OVERDUE: 'invoice.overdue',
  USAGE_THRESHOLD: 'usage.threshold', // 80% of monthly limit
  SUBSCRIPTION_RENEWED: 'subscription.renewed',
  REVENUE_SHARE_RECORDED: 'revenue_share.recorded',
};

// ─── Utility ───

function generateApiKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = 'arth_';
  for (let i = 0; i < 48; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

function generatePartnerId() {
  return `prt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

function generateInvoiceId() {
  return `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

function getCurrentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getNextBillingDate() {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
}

function daysBetween(d1, d2) {
  const diff = new Date(d2) - new Date(d1);
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

// ─── Core API ───

export class B2BPartnerEngine {
  constructor() {
    this._webhookDeliveryInProgress = false;
  }

  /**
   * Register a new partner.
   */
  registerPartner({ name, email, companyUrl, tier = 'free', useCase, billingCycle = 'monthly' }) {
    if (!name || !email) {
      throw new Error('Partner name and email are required');
    }
    const tierConfig = PARTNER_TIERS[tier];
    if (!tierConfig) {
      throw new Error(`Invalid tier: ${tier}. Valid tiers: ${Object.keys(PARTNER_TIERS).join(', ')}`);
    }

    const partnerId = generatePartnerId();
    const apiKey = generateApiKey();

    const monthlyPrice = billingCycle === 'annual' ? tierConfig.annualPrice / 12 : tierConfig.monthlyPrice;

    const partner = {
      id: partnerId,
      name,
      email,
      companyUrl: companyUrl || '',
      tier,
      tierName: tierConfig.name,
      useCase: useCase || '',
      status: 'active',
      billingCycle: billingCycle || 'monthly',
      apiKeyCount: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalUsers: 0,
      metrics: {
        totalRequests: 0,
        requestsThisMonth: 0,
        activeUsersThisMonth: new Set(),
      },
      billing: {
        monthlyPrice,
        annualPrice: tierConfig.annualPrice,
        revenueSharePct: tierConfig.revenueSharePct,
        nextBillingDate: getNextBillingDate(),
        paymentStatus: 'active', // active, past_due, cancelled
        paymentMethod: null,
      },
      features: [...tierConfig.features],
    };

    partners.set(partnerId, partner);
    apiKeys.set(apiKey, { partnerId, tier, createdAt: new Date().toISOString(), active: true });

    // Create initial invoice for paid plans
    if (monthlyPrice > 0) {
      this.createInvoice(partnerId, monthlyPrice, 'subscription_init');
    }

    // Dispatch webhook
    this._dispatchWebhook(WEBHOOK_EVENTS.PARTNER_CREATED, { partnerId, name, email, tier });

    return { partner, apiKey };
  }

  /**
   * Validate an API key and return the partner.
   */
  validateApiKey(apiKey) {
    if (!apiKey) return null;
    const keyData = apiKeys.get(apiKey);
    if (!keyData || !keyData.active) return null;
    const partner = partners.get(keyData.partnerId);
    if (!partner || partner.status !== 'active') return null;
    // Check payment status
    if (partner.billing.paymentStatus === 'past_due' || partner.billing.paymentStatus === 'cancelled') {
      return null;
    }
    return partner;
  }

  /**
   * Get rate limit info for response headers.
   */
  getRateLimitHeaders(partner) {
    if (!partner) return {};
    const tierConfig = PARTNER_TIERS[partner.tier];
    if (!tierConfig) return {};

    const currentMonth = getCurrentMonth();
    const monthlyRequests = usageLog.filter(
      (log) => log.partnerId === partner.id && log.month === currentMonth
    );

    const oneMinuteAgo = Date.now() - 60_000;
    const recentRequests = usageLog.filter(
      (log) => log.partnerId === partner.id && log.timestamp > oneMinuteAgo
    );

    return {
      'X-RateLimit-Limit': String(tierConfig.rateLimit.requestsPerMinute),
      'X-RateLimit-Remaining': String(Math.max(0, tierConfig.rateLimit.requestsPerMinute - recentRequests.length)),
      'X-RateLimit-Reset': String(Math.ceil((oneMinuteAgo + 60_000 - Date.now()) / 1000)),
      'X-RateLimit-Monthly-Limit': String(tierConfig.rateLimit.requestsPerMonth),
      'X-RateLimit-Monthly-Remaining': String(Math.max(0, tierConfig.rateLimit.requestsPerMonth - monthlyRequests.length)),
    };
  }

  /**
   * Check rate limit for a partner.
   */
  checkRateLimit(partner) {
    if (!partner) return false;
    const tierConfig = PARTNER_TIERS[partner.tier];
    if (!tierConfig) return false;

    const oneMinuteAgo = Date.now() - 60_000;
    const recentRequests = usageLog.filter(
      (log) => log.partnerId === partner.id && log.timestamp > oneMinuteAgo
    );
    if (recentRequests.length >= tierConfig.rateLimit.requestsPerMinute) {
      return false;
    }

    const currentMonth = getCurrentMonth();
    const monthlyRequests = usageLog.filter(
      (log) => log.partnerId === partner.id && log.month === currentMonth
    );
    if (monthlyRequests.length >= tierConfig.rateLimit.requestsPerMonth) {
      return false;
    }

    // Check usage threshold (80%) and dispatch webhook once
    const usagePct = monthlyRequests.length / tierConfig.rateLimit.requestsPerMonth;
    if (usagePct >= 0.8 && usagePct < 0.85) {
      this._dispatchWebhook(WEBHOOK_EVENTS.USAGE_THRESHOLD, {
        partnerId: partner.id,
        usagePct: Math.round(usagePct * 100),
        requestsUsed: monthlyRequests.length,
        requestsLimit: tierConfig.rateLimit.requestsPerMonth,
      });
    }

    return true;
  }

  /**
   * Log an API usage event.
   */
  logUsage({ partnerId, endpoint, userId, tier }) {
    const now = Date.now();
    usageLog.push({
      partnerId,
      endpoint,
      userId: userId || 'anonymous',
      tier: tier || 'free',
      timestamp: now,
      month: getCurrentMonth(),
    });

    const partner = partners.get(partnerId);
    if (partner) {
      partner.metrics.totalRequests++;
      partner.metrics.requestsThisMonth++;
      if (userId) {
        partner.metrics.activeUsersThisMonth.add(userId);
      }
    }
  }

  // ─── Billing & Subscription ───

  /**
   * Create an invoice for a partner.
   */
  createInvoice(partnerId, amount, source = 'subscription_renewal') {
    const partner = partners.get(partnerId);
    if (!partner) throw new Error('Partner not found');

    const invoiceId = generateInvoiceId();
    const now = new Date().toISOString();
    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const invoice = {
      id: invoiceId,
      partnerId,
      partnerName: partner.name,
      amount,
      currency: 'USD',
      source,
      status: 'pending', // pending, paid, overdue, cancelled
      createdAt: now,
      dueDate,
      paidAt: null,
      billingCycle: partner.billingCycle,
      period: getCurrentMonth(),
      lineItems: [
        {
          description: `${partner.tierName} Plan - ${partner.billingCycle} billing`,
          amount,
          quantity: 1,
        },
      ],
    };

    invoices.set(invoiceId, invoice);

    this._dispatchWebhook(WEBHOOK_EVENTS.INVOICE_CREATED, {
      invoiceId,
      partnerId,
      amount,
      dueDate,
    });

    return invoice;
  }

  /**
   * Mark an invoice as paid.
   */
  payInvoice(invoiceId, paymentReference = 'manual') {
    const invoice = invoices.get(invoiceId);
    if (!invoice) throw new Error('Invoice not found');

    invoice.status = 'paid';
    invoice.paidAt = new Date().toISOString();
    invoice.paymentReference = paymentReference;

    // Update partner billing
    const partner = partners.get(invoice.partnerId);
    if (partner) {
      partner.billing.paymentStatus = 'active';
      partner.billing.nextBillingDate = getNextBillingDate();
      partner.updatedAt = new Date().toISOString();
    }

    this.revenueLog.push({
      partnerId: invoice.partnerId,
      amount: invoice.amount,
      source: 'subscription',
      month: getCurrentMonth(),
      invoiceId,
      recordedAt: new Date().toISOString(),
    });

    this._dispatchWebhook(WEBHOOK_EVENTS.INVOICE_PAID, {
      invoiceId,
      partnerId: invoice.partnerId,
      amount: invoice.amount,
      paymentReference,
    });

    return invoice;
  }

  /**
   * Process subscription renewal for all active partners on paid plans.
   * Called by a cron job or scheduler.
   */
  processSubscriptionRenewals() {
    const renewed = [];
    const now = new Date();

    for (const [partnerId, partner] of partners) {
      if (partner.status !== 'active') continue;
      if (partner.billing.monthlyPrice <= 0) continue;
      if (partner.billing.paymentStatus === 'cancelled') continue;

      const nextBilling = new Date(partner.billing.nextBillingDate);
      if (now >= nextBilling) {
        // Auto-create new invoice
        const invoice = this.createInvoice(partnerId, partner.billing.monthlyPrice, 'subscription_renewal');

        // Auto-pay (in production, this would charge the payment method)
        // For demo purposes, mark as paid
        this.payInvoice(invoice.id, 'auto_renewal');

        partner.billing.nextBillingDate = getNextBillingDate();
        partner.updatedAt = now.toISOString();

        this._dispatchWebhook(WEBHOOK_EVENTS.SUBSCRIPTION_RENEWED, {
          partnerId,
          invoiceId: invoice.id,
          amount: partner.billing.monthlyPrice,
          nextBillingDate: partner.billing.nextBillingDate,
        });

        renewed.push({ partnerId, invoiceId: invoice.id, amount: partner.billing.monthlyPrice });
      }
    }

    return renewed;
  }

  /**
   * Compute revenue share for a partner for a given month.
   */
  computeRevenueShare(partnerId, month) {
    const partner = partners.get(partnerId);
    if (!partner) throw new Error('Partner not found');

    const monthLogs = usageLog.filter(
      (log) => log.partnerId === partnerId && log.month === month
    );

    const partnerRevenue = revenueLog
      .filter((r) => r.partnerId === partnerId && r.month === month)
      .reduce((sum, r) => sum + r.amount, 0);

    // If partner is monetizing their users through the intelligence layer,
    // ARTH.OS takes a percentage
    const arthosShare = partnerRevenue * (partner.billing.revenueSharePct / 100);

    return {
      partnerId,
      partnerName: partner.name,
      month,
      tier: partner.tier,
      revenueSharePct: partner.billing.revenueSharePct,
      totalPartnerRevenue: partnerRevenue,
      arthosShare: Math.round(arthosShare * 100) / 100,
      partnerNetShare: Math.round((partnerRevenue - arthosShare) * 100) / 100,
      totalApiRequests: monthLogs.length,
      activeUsers: partner.metrics.activeUsersThisMonth.size,
    };
  }

  /**
   * Get billing history for a partner.
   */
  getBillingHistory(partnerId) {
    const partnerInvoices = [];
    for (const [, invoice] of invoices) {
      if (invoice.partnerId === partnerId) {
        partnerInvoices.push(invoice);
      }
    }
    return partnerInvoices.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /**
   * Get invoice by ID.
   */
  getInvoice(invoiceId) {
    return invoices.get(invoiceId) || null;
  }

  // ─── Webhook System ───

  /**
   * Register a webhook URL for a partner.
   */
  registerWebhook(partnerId, url, events = Object.values(WEBHOOK_EVENTS)) {
    const partner = partners.get(partnerId);
    if (!partner) throw new Error('Partner not found');

    if (!webhookRegistrations.has(partnerId)) {
      webhookRegistrations.set(partnerId, []);
    }

    const registration = {
      url,
      events,
      active: true,
      createdAt: new Date().toISOString(),
      lastDelivery: null,
      failureCount: 0,
    };

    webhookRegistrations.get(partnerId).push(registration);
    return registration;
  }

  /**
   * Get webhook registrations for a partner.
   */
  getWebhooks(partnerId) {
    return webhookRegistrations.get(partnerId) || [];
  }

  /**
   * Delete a webhook registration.
   */
  deleteWebhook(partnerId, url) {
    const hooks = webhookRegistrations.get(partnerId);
    if (!hooks) throw new Error('No webhooks found for partner');
    const index = hooks.findIndex((h) => h.url === url);
    if (index === -1) throw new Error('Webhook not found');
    hooks.splice(index, 1);
    return true;
  }

  /**
   * Internal webhook dispatcher.
   * Fires and forgets — does not block the main flow.
   */
  async _dispatchWebhook(event, payload) {
    for (const [partnerId, hooks] of webhookRegistrations) {
      for (const hook of hooks) {
        if (!hook.active) continue;
        if (!hook.events.includes(event) && !hook.events.includes('*')) continue;

        const body = {
          event,
          timestamp: new Date().toISOString(),
          data: payload,
        };

        // Fire and forget — don't block
        fetch(hook.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
          .then((res) => {
            hook.lastDelivery = new Date().toISOString();
            if (!res.ok) hook.failureCount++;
          })
          .catch(() => {
            hook.failureCount++;
          });
      }
    }
  }

  // ─── Partner Management ───

  /**
   * Change tier and update billing.
   */
  changeTier(partnerId, newTier, billingCycle) {
    const partner = partners.get(partnerId);
    if (!partner) throw new Error('Partner not found');
    const tierConfig = PARTNER_TIERS[newTier];
    if (!tierConfig) throw new Error(`Invalid tier: ${newTier}`);

    const oldTier = partner.tier;

    partner.tier = newTier;
    partner.tierName = tierConfig.name;
    partner.features = [...tierConfig.features];
    if (billingCycle) partner.billingCycle = billingCycle;
    partner.billing.monthlyPrice = billingCycle === 'annual' ? tierConfig.annualPrice / 12 : tierConfig.monthlyPrice;
    partner.billing.annualPrice = tierConfig.annualPrice;
    partner.billing.revenueSharePct = tierConfig.revenueSharePct;
    partner.billing.nextBillingDate = getNextBillingDate();
    partner.updatedAt = new Date().toISOString();

    // Create prorated invoice
    if (partner.billing.monthlyPrice > 0) {
      this.createInvoice(partnerId, partner.billing.monthlyPrice, 'tier_change');
    }

    this._dispatchWebhook(WEBHOOK_EVENTS.PARTNER_TIER_CHANGED, {
      partnerId,
      oldTier,
      newTier,
      monthlyPrice: partner.billing.monthlyPrice,
    });

    return partner;
  }

  /**
   * Suspend a partner.
   */
  suspendPartner(partnerId, reason = 'payment_failure') {
    const partner = partners.get(partnerId);
    if (!partner) throw new Error('Partner not found');
    partner.status = 'suspended';
    partner.billing.paymentStatus = 'past_due';
    partner.updatedAt = new Date().toISOString();

    this._dispatchWebhook(WEBHOOK_EVENTS.PARTNER_SUSPENDED, { partnerId, reason });
    return partner;
  }

  /**
   * Reactivate a partner.
   */
  reactivatePartner(partnerId) {
    const partner = partners.get(partnerId);
    if (!partner) throw new Error('Partner not found');
    partner.status = 'active';
    partner.billing.paymentStatus = 'active';
    partner.updatedAt = new Date().toISOString();

    this._dispatchWebhook(WEBHOOK_EVENTS.PARTNER_REACTIVATED, { partnerId });
    return partner;
  }

  /**
   * Rotate API key.
   */
  rotateApiKey(partnerId) {
    const partner = partners.get(partnerId);
    if (!partner) throw new Error('Partner not found');

    const newKey = generateApiKey();
    partner.apiKeyCount++;
    partner.updatedAt = new Date().toISOString();
    apiKeys.set(newKey, { partnerId, tier: partner.tier, createdAt: new Date().toISOString(), active: true });

    this._dispatchWebhook(WEBHOOK_EVENTS.PARTNER_API_KEY_ROTATED, { partnerId });

    return { apiKey: newKey, previousKeyCount: partner.apiKeyCount - 1 };
  }

  /**
   * Revoke a specific API key.
   */
  revokeApiKey(apiKey) {
    const keyData = apiKeys.get(apiKey);
    if (!keyData) throw new Error('API key not found');
    keyData.active = false;
    return true;
  }

  /**
   * Record a revenue event.
   */
  recordRevenue({ partnerId, amount, source, invoiceId }) {
    const entry = {
      partnerId,
      amount,
      source: source || 'subscription',
      month: getCurrentMonth(),
      invoiceId: invoiceId || null,
      recordedAt: new Date().toISOString(),
    };
    revenueLog.push(entry);

    this._dispatchWebhook(WEBHOOK_EVENTS.REVENUE_SHARE_RECORDED, {
      partnerId,
      amount,
      source,
    });

    return entry;
  }

  // ─── Analytics ───

  /**
   * Get partner analytics.
   */
  getPartnerAnalytics(partnerId) {
    const partner = partners.get(partnerId);
    if (!partner) throw new Error('Partner not found');

    const currentMonth = getCurrentMonth();
    const monthlyUsage = usageLog.filter(
      (log) => log.partnerId === partnerId && log.month === currentMonth
    );
    const monthlyRevenue = revenueLog
      .filter((r) => r.partnerId === partnerId && r.month === currentMonth)
      .reduce((sum, r) => sum + r.amount, 0);

    const endpointBreakdown = {};
    for (const log of monthlyUsage) {
      endpointBreakdown[log.endpoint] = (endpointBreakdown[log.endpoint] || 0) + 1;
    }

    const activeUsers = partner.metrics.activeUsersThisMonth.size;
    const activeUsersList = Array.from(partner.metrics.activeUsersThisMonth);

    const partnerBilling = this.getBillingHistory(partnerId);
    const recentInvoices = partnerBilling.slice(0, 6);
    const totalRevenueShare = revenueLog
      .filter((r) => r.partnerId === partnerId)
      .reduce((sum, r) => sum + r.amount, 0);

    const webhooks = this.getWebhooks(partnerId);

    return {
      partnerId,
      partnerName: partner.name,
      email: partner.email,
      tier: partner.tier,
      tierName: partner.tierName,
      status: partner.status,
      billingCycle: partner.billingCycle,
      totalRequests: partner.metrics.totalRequests,
      requestsThisMonth: monthlyUsage.length,
      rateLimit: PARTNER_TIERS[partner.tier].rateLimit,
      activeUsers,
      activeUsersList,
      endpointBreakdown,
      monthlyRevenue,
      totalRevenueShare,
      monthlyPrice: partner.billing.monthlyPrice,
      annualPrice: partner.billing.annualPrice,
      revenueSharePct: partner.billing.revenueSharePct,
      paymentStatus: partner.billing.paymentStatus,
      nextBillingDate: partner.billing.nextBillingDate,
      features: partner.features,
      createdAt: partner.createdAt,
      billing: partner.billing,
      recentInvoices,
      webhookCount: webhooks.length,
      rateLimitHeaders: this.getRateLimitHeaders(partner),
    };
  }

  /**
   * Get ALL partner analytics (admin view).
   */
  getAllPartnerAnalytics() {
    const all = [];
    for (const [partnerId] of partners) {
      try {
        all.push(this.getPartnerAnalytics(partnerId));
      } catch {
        // skip invalid
      }
    }
    return {
      totalPartners: all.length,
      activePartners: all.filter((p) => p.status === 'active').length,
      totalRequests: usageLog.length,
      totalRevenue: revenueLog.reduce((sum, r) => sum + r.amount, 0),
      monthlyRecurringRevenue: all.reduce((sum, p) => sum + (p.status === 'active' ? p.monthlyPrice : 0), 0),
      partnersByTier: Object.keys(PARTNER_TIERS).reduce((acc, tier) => {
        acc[tier] = all.filter((p) => p.tier === tier).length;
        return acc;
      }, {}),
      partnersByStatus: {
        active: all.filter((p) => p.status === 'active').length,
        suspended: all.filter((p) => p.status === 'suspended').length,
        cancelled: all.filter((p) => p.status === 'cancelled').length,
      },
      partners: all,
    };
  }

  /**
   * Get partner by ID.
   */
  getPartner(partnerId) {
    return partners.get(partnerId) || null;
  }

  /**
   * Get all partners (for internal use).
   */
  _getAllPartners() {
    const all = [];
    for (const [, partner] of partners) {
      all.push(partner);
    }
    return all;
  }

  /**
   * Check if a partner has access to a specific feature.
   */
  hasFeature(partner, feature) {
    if (!partner) return false;
    return partner.features.includes(feature);
  }

  /**
   * Check if a partner can add more users.
   */
  canAddUser(partner) {
    if (!partner) return false;
    const tierConfig = PARTNER_TIERS[partner.tier];
    if (!tierConfig) return false;
    if (tierConfig.maxUsers === Infinity) return true;
    return partner.metrics.activeUsersThisMonth.size < tierConfig.maxUsers;
  }

  /**
   * Check if a partner can create more API keys.
   */
  canCreateApiKey(partner) {
    if (!partner) return false;
    const tierConfig = PARTNER_TIERS[partner.tier];
    if (!tierConfig) return false;
    return partner.apiKeyCount < tierConfig.apiKeys;
  }

  /**
   * Cancel a partner's subscription.
   */
  cancelSubscription(partnerId) {
    const partner = partners.get(partnerId);
    if (!partner) throw new Error('Partner not found');
    partner.status = 'cancelled';
    partner.billing.paymentStatus = 'cancelled';
    partner.updatedAt = new Date().toISOString();
    return partner;
  }
}

// Singleton export
export const b2bPartnerEngine = new B2BPartnerEngine();
