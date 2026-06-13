/**
 * ArthOSPartnerSDK — Server-side SDK for ARTH.OS B2B Partners
 *
 * This is the library that partner companies integrate into their backend
 * to embed ARTH.OS financial intelligence into their products.
 *
 * Blueprint §19: B2B/OS Layer — enables B2B2C monetization path.
 *
 * Usage (partner backend):
 *   const sdk = new ArthOSPartnerSDK({ apiKey: 'arth_...', environment: 'production' });
 *   const result = await sdk.getIntelligence({ userId: 'user_123', profile: {...} });
 *
 * Features:
 * - Health score & risk profile
 * - Behaviour insights & cognitive biases
 * - Emotional triggers & forecast
 * - Marketplace recommendations
 * - Usage analytics & monitoring
 * - Auto-retry, rate-limit handling
 */

const DEFAULT_CONFIG = {
  environment: "production",
  baseUrl: "",
  retryCount: 2,
  retryDelay: 1000,
  timeout: 10000
};

const ENVIRONMENTS = {
  production: "https://api.arthos.io",
  staging: "https://staging-api.arthos.io",
  development: "http://localhost:5173"
};

export class ArthOSPartnerSDK {
  constructor({
    apiKey,
    environment = "production",
    baseUrl,
    retryCount,
    retryDelay,
    timeout
  } = {}) {
    if (!apiKey) {
      throw new Error("ArthOSPartnerSDK: apiKey is required. Get one at https://arthos.io/b2b");
    }

    this.apiKey = apiKey;
    this.config = {
      ...DEFAULT_CONFIG,
      environment,
      baseUrl: baseUrl || ENVIRONMENTS[environment] || ENVIRONMENTS.production,
      retryCount: retryCount ?? DEFAULT_CONFIG.retryCount,
      retryDelay: retryDelay ?? DEFAULT_CONFIG.retryDelay,
      timeout: timeout ?? DEFAULT_CONFIG.timeout
    };
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      lastRequestTime: null,
      rateLimited: false
    };
  }

  /**
   * Core request method with retry logic and rate-limit handling.
   */
  async _request(endpoint, payload) {
    const url = `${this.config.baseUrl}${endpoint}`;

    for (let attempt = 0; attempt <= this.config.retryCount; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        this.metrics.totalRequests++;
        this.metrics.lastRequestTime = Date.now();

        // Rate limited — apply backoff
        if (response.status === 429) {
          this.metrics.rateLimited = true;
          if (attempt < this.config.retryCount) {
            const retryAfter = response.headers.get("Retry-After");
            const delay = retryAfter
              ? parseInt(retryAfter, 10) * 1000
              : this.config.retryDelay * (attempt + 1);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          throw new ArthOSPartnerError(
            "Rate limit exceeded. Upgrade your plan at https://arthos.io/b2b",
            429
          );
        }

        // Unauthorized — don't retry
        if (response.status === 401) {
          this.metrics.failedRequests++;
          throw new ArthOSPartnerError(
            "Invalid API key. Check your credentials or generate a new key.",
            401
          );
        }

        if (!response.ok) {
          this.metrics.failedRequests++;
          const errorBody = await response.json().catch(() => ({}));
          throw new ArthOSPartnerError(
            errorBody.error || `Request failed with status ${response.status}`,
            response.status,
            errorBody
          );
        }

        this.metrics.successfulRequests++;
        return response.json();
      } catch (err) {
        if (err instanceof ArthOSPartnerError) {
          throw err;
        }

        // Abort/timeout
        if (err.name === "AbortError") {
          if (attempt < this.config.retryCount) {
            await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
            continue;
          }
          this.metrics.failedRequests++;
          throw new ArthOSPartnerError("Request timed out", 408);
        }

        // Network error — retry
        if (attempt < this.config.retryCount) {
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * (attempt + 1)));
          continue;
        }

        this.metrics.failedRequests++;
        throw new ArthOSPartnerError(`Network error: ${err.message}`, 0);
      }
    }
  }

  /**
   * Get full financial intelligence for a user.
   * This is the primary endpoint partners use.
   *
   * @param {object} params
   * @param {string} params.userId - Your internal user ID
   * @param {object} [params.profile] - Financial profile data
   * @param {object} [params.behaviour] - Behavioural answers
   * @param {object} [params.awareness] - Awareness answers
   * @param {object} [params.habits] - Habits data
   * @returns {Promise<object>} Full intelligence response
   */
  async getIntelligence({ userId, profile, behaviour, awareness, habits }) {
    if (!userId) {
      throw new ArthOSPartnerError("userId is required for getIntelligence", 400);
    }
    return this._request("/api/b2b/intelligence", {
      userId,
      profile,
      behaviour,
      awareness,
      habits
    });
  }

  /**
   * Quick health score (lightweight — only health score, no full analysis).
   * Useful for real-time dashboards where partners only need the score.
   *
   * @param {object} params
   * @param {string} params.userId
   * @param {object} [params.profile]
   * @returns {Promise<object>} { healthScore, category, components }
   */
  async getHealthScore({ userId, profile }) {
    const result = await this.getIntelligence({
      userId,
      profile,
      behaviour: {},
      awareness: {}
    });
    return result.healthScore;
  }

  /**
   * Get risk profile only (lighter payload).
   *
   * @param {object} params
   * @param {string} params.userId
   * @param {object} [params.profile]
   * @param {object} [params.behaviour]
   * @param {object} [params.awareness]
   * @returns {Promise<object>} { score, level, calibration }
   */
  async getRiskProfile({ userId, profile, behaviour, awareness }) {
    const result = await this.getIntelligence({
      userId,
      profile,
      behaviour,
      awareness
    });
    return result.riskProfile;
  }

  /**
   * Get cognitive biases for a user.
   *
   * @param {object} params
   * @param {string} params.userId
   * @param {object} [params.profile]
   * @param {object} [params.behaviour]
   * @returns {Promise<object>} bias profile
   */
  async getCognitiveBiases({ userId, profile, behaviour }) {
    const result = await this.getIntelligence({
      userId,
      profile,
      behaviour
    });
    return result.cognitiveBiases;
  }

  /**
   * Get partner usage analytics.
   *
   * @returns {Promise<object>} { totalRequests, successfulRequests, failedRequests, rateLimited }
   */
  getUsageMetrics() {
    return { ...this.metrics };
  }

  /**
   * Reset usage metrics (e.g., after reconnecting).
   */
  resetMetrics() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      lastRequestTime: null,
      rateLimited: false
    };
  }

  /**
   * Update configuration at runtime.
   */
  updateConfig(updates) {
    this.config = { ...this.config, ...updates };
    if (updates.environment && ENVIRONMENTS[updates.environment]) {
      this.config.baseUrl = ENVIRONMENTS[updates.environment];
    }
  }
}

/**
 * Custom error class for SDK errors.
 */
export class ArthOSPartnerError extends Error {
  constructor(message, statusCode, body) {
    super(message);
    this.name = "ArthOSPartnerError";
    this.statusCode = statusCode;
    this.body = body;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Example usage (for documentation generation):
 *
 * ```js
 * // In partner's backend (Node.js)
 * import { ArthOSPartnerSDK } from 'arthos-partner-sdk';
 *
 * const sdk = new ArthOSPartnerSDK({
 *   apiKey: process.env.ARTHOS_API_KEY,
 *   environment: 'production',
 * });
 *
 * // When a user fills out a financial profile in partner's app:
 * try {
 *   const intelligence = await sdk.getIntelligence({
 *     userId: req.user.id,
 *     profile: {
 *       monthlyIncome: 85000,
 *       monthlyExpenses: 52000,
 *       emergencySavingsFixed: 200000,
 *       totalDebt: 500000,
 *     },
 *     behaviour: {
 *       spendWhenStressed: 'sometimes',
 *       regretImpulseFreq: 'rarely',
 *     },
 *   });
 *
 *   console.log('Health score:', intelligence.healthScore.score);
 *   console.log('Risk level:', intelligence.riskProfile.level);
 *   console.log('Bias load:', intelligence.cognitiveBiases.biasLoad);
 *
 *   // Use intelligence to personalize partner's product
 *   if (intelligence.healthScore.score < 40) {
 *     // Offer financial wellness features
 *   }
 * } catch (err) {
 *   if (err.statusCode === 429) {
 *     // Handle rate limiting
 *   }
 *   console.error('ARTH.OS SDK error:', err.message);
 * }
 * ```
 */
