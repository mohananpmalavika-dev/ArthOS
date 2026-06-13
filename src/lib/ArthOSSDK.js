/**
 * ArthOSSDK — Client-side SDK for ARTH.OS
 *
 * Used by the PartnerSdkDemo component and the partner portal.
 * For B2B partners integrating server-side, use ArthOSPartnerSDK (see ArthOSPartnerSDK.js).
 *
 * Blueprint §19: This SDK now supports:
 * - Partner registration (B2B onboarding)
 * - Embedded intelligence (health score, risk, biases, triggers)
 * - Partner API key authentication
 * - Marketplace provider registration
 */

import { integrations, registerProvider } from "./integrations.js";

export class ArthOSSDK {
  /**
   * @param {string} [baseUrl=''] - Base URL for API requests
   * @param {object} [options]
   * @param {string} [options.apiKey] - B2B partner API key (for authenticated requests)
   */
  constructor(baseUrl = "", options = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.apiKey = options.apiKey || "";
    this._headers = {
      "Content-Type": "application/json"
    };
    if (this.apiKey) {
      this._headers["Authorization"] = `Bearer ${this.apiKey}`;
    }
  }

  /**
   * Set or update the API key for B2B authenticated requests.
   */
  setApiKey(apiKey) {
    this.apiKey = apiKey;
    if (apiKey) {
      this._headers["Authorization"] = `Bearer ${apiKey}`;
    } else {
      delete this._headers["Authorization"];
    }
  }

  /**
   * Internal fetch wrapper.
   */
  async _fetch(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        ...this._headers,
        ...options.headers
      }
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Request failed: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }

  // ─── Existing endpoints ───

  async getHealthScore(userId) {
    return this._fetch(`/api/user/${encodeURIComponent(userId)}/score`);
  }

  async getRiskProfile(userId, userPayload = null) {
    return this._fetch(`/api/user/${encodeURIComponent(userId)}/risk`, {
      method: "POST",
      body: JSON.stringify({ user: userPayload })
    });
  }

  registerProvider(type, provider) {
    return registerProvider(type, provider);
  }

  // ─── B2B Partner Endpoints ───

  /**
   * Register a new B2B partner.
   * @param {object} params
   * @param {string} params.name - Company name
   * @param {string} params.email - Contact email
   * @param {string} [params.companyUrl]
   * @param {string} [params.tier='free'] - 'free' | 'starter' | 'pro' | 'enterprise'
   * @param {string} [params.useCase]
   * @returns {Promise<object>} { partner, apiKey }
   */
  async registerPartner({ name, email, companyUrl, tier, useCase }) {
    return this._fetch("/api/b2b/register", {
      method: "POST",
      body: JSON.stringify({ name, email, companyUrl, tier, useCase })
    });
  }

  /**
   * Get embedded finance intelligence for a user.
   * Requires a valid API key set via setApiKey() or constructor.
   * @param {object} params
   * @param {string} params.userId
   * @param {object} [params.profile]
   * @param {object} [params.behaviour]
   * @param {object} [params.awareness]
   * @param {object} [params.habits]
   * @returns {Promise<object>} Full intelligence response
   */
  async getIntelligence({ userId, profile, behaviour, awareness, habits }) {
    return this._fetch("/api/b2b/intelligence", {
      method: "POST",
      body: JSON.stringify({ userId, profile, behaviour, awareness, habits })
    });
  }

  /**
   * Get partner analytics (requires admin API key).
   * @param {string} [partnerId] - Optional: filter to specific partner
   * @returns {Promise<object>}
   */
  async getPartnerAnalytics(partnerId) {
    const query = partnerId ? `?partnerId=${encodeURIComponent(partnerId)}` : "";
    return this._fetch(`/api/b2b/admin${query}`);
  }

  /**
   * Admin: change a partner's tier.
   * @param {string} partnerId
   * @param {string} newTier
   * @returns {Promise<object>}
   */
  async changePartnerTier(partnerId, newTier) {
    return this._fetch("/api/b2b/admin/change-tier", {
      method: "POST",
      body: JSON.stringify({ partnerId, newTier })
    });
  }

  /**
   * Admin: suspend a partner.
   * @param {string} partnerId
   * @returns {Promise<object>}
   */
  async suspendPartner(partnerId) {
    return this._fetch("/api/b2b/admin/suspend", {
      method: "POST",
      body: JSON.stringify({ partnerId })
    });
  }

  /**
   * Admin: reactivate a partner.
   * @param {string} partnerId
   * @returns {Promise<object>}
   */
  async reactivatePartner(partnerId) {
    return this._fetch("/api/b2b/admin/reactivate", {
      method: "POST",
      body: JSON.stringify({ partnerId })
    });
  }

  /**
   * Admin: rotate a partner's API key.
   * @param {string} partnerId
   * @returns {Promise<object>}
   */
  async rotateApiKey(partnerId) {
    return this._fetch("/api/b2b/admin/rotate-key", {
      method: "POST",
      body: JSON.stringify({ partnerId })
    });
  }
}
