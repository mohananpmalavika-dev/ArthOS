/**
 * ARTH.OS Banking SDK
 * 
 * B2B SDK for lenders, banks, and fintechs to integrate with ARTH.OS
 * - SDK installation and initialization
 * - Consent management for lenders
 * - Loan application flows
 * - Real-time financial data access
 * - Webhook handlers for partner callbacks
 * 
 * Blueprint §24: Banking SDK for B2B partners
 * 
 * Usage:
 * ```javascript
 * import ArthOSBankingSDK from '@arth-os/banking-sdk';
 * 
 * const sdk = new ArthOSBankingSDK({
 *   partnerId: 'LENDER_001',
 *   apiKey: 'your_api_key',
 *   environment: 'production'
 * });
 * 
 * // Request user's financial data
 * const consent = await sdk.requestFinancialDataConsent(userId, {
 *   scopes: ['accounts', 'transactions', 'credit_score']
 * });
 * ```
 */

class ArthOSBankingSDK {
  constructor(config) {
    this.config = {
      environment: config.environment || 'sandbox',
      baseUrl: config.baseUrl || this.getBaseUrl(config.environment),
      partnerId: config.partnerId,
      apiKey: config.apiKey,
      timeout: config.timeout || 30000,
      ...config
    };

    this.validateConfig();
  }

  validateConfig() {
    if (!this.config.partnerId) {
      throw new Error('partnerId is required');
    }
    if (!this.config.apiKey) {
      throw new Error('apiKey is required');
    }
  }

  getBaseUrl(environment) {
    const baseUrls = {
      'sandbox': 'https://sandbox-api.arth-os.com/v1',
      'staging': 'https://staging-api.arth-os.com/v1',
      'production': 'https://api.arth-os.com/v1'
    };
    return baseUrls[environment] || baseUrls.sandbox;
  }

  /**
   * Request Financial Data Consent
   * Initiates consent flow for accessing user's financial data
   */
  async requestFinancialDataConsent(userId, options = {}) {
    try {
      const payload = {
        userId,
        partnerId: this.config.partnerId,
        scopes: options.scopes || ['accounts', 'transactions'],
        purpose: options.purpose || 'CREDIT_DECISIONING',
        dataFrequency: options.dataFrequency || 'one_time',
        validityDays: options.validityDays || 365
      };

      const response = await this.makeRequest(
        '/consent/request',
        'POST',
        payload
      );

      return {
        success: true,
        consentId: response.consentId,
        consentUrl: response.consentUrl, // User should navigate to this
        expiresAt: response.expiresAt
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Check Consent Status
   */
  async checkConsentStatus(consentId) {
    try {
      const response = await this.makeRequest(
        `/consent/${consentId}`,
        'GET'
      );

      return {
        success: true,
        status: response.status, // 'pending', 'approved', 'rejected', 'expired'
        approvedAt: response.approvedAt,
        expiresAt: response.expiresAt
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Fetch User Financial Data (with consent)
   */
  async getFinancialData(consentId, options = {}) {
    try {
      const params = new URLSearchParams({
        consentId,
        dataTypes: (options.dataTypes || ['accounts', 'transactions']).join(','),
        limit: options.limit || 100,
        offset: options.offset || 0
      });

      const response = await this.makeRequest(
        `/financial-data?${params}`,
        'GET'
      );

      return {
        success: true,
        accounts: response.accounts || [],
        transactions: response.transactions || [],
        creditProfile: response.creditProfile,
        insurance: response.insurance,
        freshness: response.freshness // 'real_time', 'end_of_day', etc.
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get User Financial Score
   */
  async getFinancialScore(userId) {
    try {
      const response = await this.makeRequest(
        `/users/${userId}/financial-score`,
        'GET'
      );

      return {
        success: true,
        healthScore: response.healthScore,
        behaviourScore: response.behaviourScore,
        riskScore: response.riskScore,
        creditScore: response.creditScore,
        survivalMonths: response.survivalMonths,
        recommendations: response.recommendations
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get Credit Profile
   */
  async getCreditProfile(userId, consentId) {
    try {
      const response = await this.makeRequest(
        `/users/${userId}/credit-profile`,
        'GET',
        { consentId }
      );

      return {
        success: true,
        creditScore: response.creditScore,
        utilization: response.utilization,
        history: response.history,
        riskFactors: response.riskFactors
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get Transaction History
   */
  async getTransactionHistory(userId, consentId, options = {}) {
    try {
      const params = new URLSearchParams({
        consentId,
        fromDate: options.fromDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        toDate: options.toDate || new Date().toISOString().split('T')[0],
        limit: options.limit || 100,
        category: options.category || 'all'
      });

      const response = await this.makeRequest(
        `/users/${userId}/transactions?${params}`,
        'GET'
      );

      return {
        success: true,
        transactions: response.transactions || [],
        summary: response.summary,
        categories: response.categories
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Create Loan Application
   */
  async createLoanApplication(userId, loanData) {
    try {
      const payload = {
        userId,
        loanType: loanData.loanType, // 'personal', 'auto', 'home', etc.
        requestedAmount: loanData.requestedAmount,
        tenure: loanData.tenure, // months
        purpose: loanData.purpose,
        metadata: loanData.metadata
      };

      const response = await this.makeRequest(
        '/loan-applications',
        'POST',
        payload
      );

      return {
        success: true,
        applicationId: response.applicationId,
        preApprovalLimit: response.preApprovalLimit,
        estimatedRate: response.estimatedRate,
        nextSteps: response.nextSteps
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Submit Loan Application
   */
  async submitLoanApplication(applicationId, documents = []) {
    try {
      const response = await this.makeRequest(
        `/loan-applications/${applicationId}/submit`,
        'POST',
        { documents }
      );

      return {
        success: true,
        status: response.status,
        referenceNumber: response.referenceNumber
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get Loan Offer
   */
  async getLoanOffer(userId) {
    try {
      const response = await this.makeRequest(
        `/users/${userId}/loan-offers`,
        'GET'
      );

      return {
        success: true,
        offers: response.offers || [],
        recommendations: response.recommendations
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Register Webhook
   * For receiving events from ARTH.OS
   */
  async registerWebhook(eventType, webhookUrl) {
    try {
      const response = await this.makeRequest(
        '/webhooks',
        'POST',
        {
          eventType,
          webhookUrl,
          active: true
        }
      );

      return {
        success: true,
        webhookId: response.webhookId
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Verify Webhook Signature
   * Call this in your webhook endpoint to verify the request is from ARTH.OS
   */
  verifyWebhookSignature(payload, signature, timestamp) {
    const crypto = require('crypto');
    
    const message = `${timestamp}.${JSON.stringify(payload)}`;
    const expectedSignature = crypto
      .createHmac('sha256', this.config.apiKey)
      .update(message)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Make HTTP Request
   * Internal utility for API calls
   */
  async makeRequest(endpoint, method = 'GET', data = null) {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      'X-Partner-ID': this.config.partnerId,
      'X-API-Key': this.config.apiKey,
      'X-Request-ID': this.generateRequestId()
    };

    const options = {
      method,
      headers,
      timeout: this.config.timeout
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  generateRequestId() {
    return `REQ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Event Types for Webhooks
 */
const EVENT_TYPES = {
  'CONSENT_APPROVED': 'consent.approved',
  'CONSENT_REJECTED': 'consent.rejected',
  'CONSENT_EXPIRED': 'consent.expired',
  'TRANSACTION_RECEIVED': 'transaction.received',
  'LOAN_APPROVED': 'loan.approved',
  'LOAN_REJECTED': 'loan.rejected',
  'CREDIT_SCORE_UPDATED': 'credit_score.updated',
  'FINANCIAL_DATA_UPDATED': 'financial_data.updated'
};

/**
 * Example Webhook Handler
 */
const webhookHandler = async (req, res) => {
  try {
    const sdk = new ArthOSBankingSDK({
      partnerId: process.env.PARTNER_ID,
      apiKey: process.env.PARTNER_API_KEY
    });

    // Verify signature
    const signature = req.headers['x-signature'];
    const timestamp = req.headers['x-timestamp'];
    
    if (!sdk.verifyWebhookSignature(req.body, signature, timestamp)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Handle event
    const { eventType, data } = req.body;

    switch (eventType) {
      case EVENT_TYPES.CONSENT_APPROVED:
        console.log('Consent approved for user:', data.userId);
        break;
      case EVENT_TYPES.TRANSACTION_RECEIVED:
        console.log('New transaction:', data.transaction);
        break;
      case EVENT_TYPES.LOAN_APPROVED:
        console.log('Loan approved:', data.applicationId);
        break;
      default:
        console.log('Unknown event:', eventType);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
};

export default ArthOSBankingSDK;
export { EVENT_TYPES, webhookHandler };
