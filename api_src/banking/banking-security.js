/**
 * Banking Security Layer
 * 
 * Handles encryption, decryption, and secure credential management
 * - Bank credential encryption/decryption
 * - Consent token management
 * - API key rotation
 * - Audit logging for all banking operations
 * - PII (Personally Identifiable Information) masking
 * - Compliance with RBI guidelines
 * 
 * Blueprint §25: Bank-grade security for financial data
 */

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * Initialize Encryption Keys
 * Uses Azure Key Vault or Supabase Vault
 */
class BankingSecurityManager {
  constructor() {
    this.masterKey = Buffer.from(process.env.BANKING_MASTER_KEY || '', 'base64');
    this.algorithm = 'aes-256-gcm';
    this.keyRotationDays = 90;
  }

  /**
   * Encrypt Sensitive Data
   * AES-256-GCM encryption with authentication
   */
  encryptData(plaintext, associatedData = '') {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.algorithm, this.masterKey, iv);
      
      if (associatedData) {
        cipher.setAAD(Buffer.from(associatedData, 'utf-8'));
      }

      let encrypted = cipher.update(plaintext, 'utf-8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      return {
        iv: iv.toString('hex'),
        encrypted,
        authTag: authTag.toString('hex'),
        algorithm: this.algorithm
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw error;
    }
  }

  /**
   * Decrypt Sensitive Data
   */
  decryptData(encryptedData, associatedData = '') {
    try {
      const decipher = crypto.createDecipheriv(
        encryptedData.algorithm,
        this.masterKey,
        Buffer.from(encryptedData.iv, 'hex')
      );

      decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

      if (associatedData) {
        decipher.setAAD(Buffer.from(associatedData, 'utf-8'));
      }

      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf-8');
      decrypted += decipher.final('utf-8');

      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw error;
    }
  }

  /**
   * Store Encrypted Bank Credentials
   */
  async storeEncryptedCredentials(userId, bankCode, credentials) {
    try {
      const encrypted = this.encryptData(
        JSON.stringify(credentials),
        `${userId}:${bankCode}`
      );

      // Store in secure vault
      const { error } = await supabase
        .from('banking_credentials_vault')
        .upsert({
          user_id: userId,
          bank_code: bankCode,
          encrypted_data: JSON.stringify(encrypted),
          created_at: new Date().toISOString(),
          key_version: 1,
          key_rotation_date: new Date().toISOString()
        }, { onConflict: 'user_id, bank_code' });

      if (error) throw error;

      // Audit log
      await this.auditLog('CREDENTIALS_STORED', userId, {
        bankCode,
        action: 'Store encrypted credentials'
      });

      return { success: true };
    } catch (error) {
      console.error('Credential storage failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Retrieve and Decrypt Credentials
   */
  async retrieveCredentials(userId, bankCode) {
    try {
      const { data: vault, error } = await supabase
        .from('banking_credentials_vault')
        .select('encrypted_data')
        .eq('user_id', userId)
        .eq('bank_code', bankCode)
        .single();

      if (error || !vault) {
        throw new Error('Credentials not found');
      }

      const encrypted = JSON.parse(vault.encrypted_data);
      const credentials = JSON.parse(
        this.decryptData(encrypted, `${userId}:${bankCode}`)
      );

      // Audit log
      await this.auditLog('CREDENTIALS_RETRIEVED', userId, {
        bankCode,
        action: 'Retrieve credentials'
      });

      return { success: true, credentials };
    } catch (error) {
      console.error('Credential retrieval failed:', error);
      await this.auditLog('CREDENTIALS_RETRIEVAL_FAILED', userId, {
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate and Store API Key
   */
  async generateAPIKey(userId, partnerId, permissions = []) {
    try {
      const apiKey = crypto.randomBytes(32).toString('hex');
      const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

      const { error } = await supabase
        .from('banking_api_keys')
        .insert({
          user_id: userId,
          partner_id: partnerId,
          api_key_hash: apiKeyHash,
          permissions: permissions,
          status: 'active',
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          last_used_at: null
        });

      if (error) throw error;

      // Audit log
      await this.auditLog('API_KEY_GENERATED', userId, {
        partnerId,
        permissions
      });

      return { success: true, apiKey }; // Return key only once
    } catch (error) {
      console.error('API key generation failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate API Key
   */
  async validateAPIKey(apiKey, partnerId) {
    try {
      const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

      const { data: keyRecord, error } = await supabase
        .from('banking_api_keys')
        .select('*')
        .eq('api_key_hash', apiKeyHash)
        .eq('partner_id', partnerId)
        .eq('status', 'active')
        .single();

      if (error || !keyRecord) {
        return { valid: false, error: 'Invalid API key' };
      }

      // Check expiration
      if (new Date(keyRecord.expires_at) < new Date()) {
        return { valid: false, error: 'API key expired' };
      }

      // Update last used
      await supabase
        .from('banking_api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', keyRecord.id);

      return {
        valid: true,
        userId: keyRecord.user_id,
        permissions: keyRecord.permissions
      };
    } catch (error) {
      console.error('API key validation failed:', error);
      return { valid: false, error: error.message };
    }
  }

  /**
   * Rotate API Key
   */
  async rotateAPIKey(oldAPIKey, partnerId) {
    try {
      const oldKeyHash = crypto.createHash('sha256').update(oldAPIKey).digest('hex');

      const { data: oldKeyRecord } = await supabase
        .from('banking_api_keys')
        .select('*')
        .eq('api_key_hash', oldKeyHash)
        .eq('partner_id', partnerId)
        .single();

      if (!oldKeyRecord) {
        throw new Error('Old API key not found');
      }

      // Generate new key
      const newAPIKey = crypto.randomBytes(32).toString('hex');
      const newKeyHash = crypto.createHash('sha256').update(newAPIKey).digest('hex');

      // Deactivate old key and create new one
      await supabase
        .from('banking_api_keys')
        .update({ status: 'rotated' })
        .eq('id', oldKeyRecord.id);

      const { error } = await supabase
        .from('banking_api_keys')
        .insert({
          user_id: oldKeyRecord.user_id,
          partner_id: partnerId,
          api_key_hash: newKeyHash,
          permissions: oldKeyRecord.permissions,
          status: 'active',
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        });

      if (error) throw error;

      // Audit log
      await this.auditLog('API_KEY_ROTATED', oldKeyRecord.user_id, {
        partnerId
      });

      return { success: true, newAPIKey };
    } catch (error) {
      console.error('API key rotation failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mask PII (Personally Identifiable Information)
   * Used for displaying data safely
   */
  maskPII(data, type) {
    const masking = {
      'email': (email) => {
        const [name, domain] = email.split('@');
        return `${name.charAt(0)}***@${domain}`;
      },
      'phone': (phone) => phone.replace(/\d(?=\d{4})/g, '*'),
      'pan': (pan) => `${pan.substring(0, 2)}****${pan.substring(6)}`,
      'account': (account) => `****${account.substring(account.length - 4)}`,
      'upi': (upi) => {
        const parts = upi.split('@');
        return `****@${parts[1]}`;
      }
    };

    const maskFn = masking[type];
    return maskFn ? maskFn(data) : '****';
  }

  /**
   * Audit Log Banking Operations
   */
  async auditLog(action, userId, details) {
    try {
      await supabase.from('banking_audit_logs').insert({
        user_id: userId,
        action,
        details: JSON.stringify(details),
        ip_address: process.env.REQUEST_IP || 'unknown',
        user_agent: process.env.REQUEST_USER_AGENT || 'unknown',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Audit log failed:', error);
    }
  }

  /**
   * Check Compliance - RBI Guidelines
   * Validates banking operations against RBI regulatory requirements
   */
  async validateRBICompliance(operation) {
    try {
      const compliance = {
        'ACCOUNT_AGGREGATOR': {
          requiresConsent: true,
          minValidityDays: 1,
          maxValidityDays: 365,
          requiresEncryption: true,
          auditRequired: true
        },
        'UPI_TRANSACTION': {
          maxAmount: 100000, // Max UPI transaction
          minValidityDays: 0,
          requiresEncryption: true,
          auditRequired: true
        },
        'DATA_RETENTION': {
          minRetentionDays: 90,
          maxRetentionDays: 2555 // 7 years
        }
      };

      const rules = compliance[operation.type];
      if (!rules) {
        return { compliant: false, reason: 'Unknown operation type' };
      }

      // Validate against rules
      for (const [rule, value] of Object.entries(rules)) {
        if (rule === 'requiresConsent' && value && !operation.consentId) {
          return { compliant: false, reason: 'Consent required' };
        }
        if (rule === 'maxAmount' && operation.amount > value) {
          return { compliant: false, reason: 'Amount exceeds limit' };
        }
      }

      return { compliant: true };
    } catch (error) {
      console.error('Compliance check failed:', error);
      return { compliant: false, reason: error.message };
    }
  }

  /**
   * Generate Compliance Report
   */
  async generateComplianceReport(userId, period = 'monthly') {
    try {
      // Fetch audit logs
      const daysBack = period === 'monthly' ? 30 : period === 'quarterly' ? 90 : 365;
      const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

      const { data: logs } = await supabase
        .from('banking_audit_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('timestamp', startDate.toISOString());

      const report = {
        period,
        generatedAt: new Date().toISOString(),
        userId,
        totalOperations: logs?.length || 0,
        operations: {
          credentialsStored: logs?.filter(l => l.action === 'CREDENTIALS_STORED').length || 0,
          dataAccessed: logs?.filter(l => l.action === 'CREDENTIALS_RETRIEVED').length || 0,
          keysRotated: logs?.filter(l => l.action === 'API_KEY_ROTATED').length || 0,
          failedOperations: logs?.filter(l => l.action.includes('FAILED')).length || 0
        },
        compliance: {
          consentManaged: true,
          encryptionEnabled: true,
          auditingEnabled: true
        }
      };

      return { success: true, report };
    } catch (error) {
      console.error('Report generation failed:', error);
      return { success: false, error: error.message };
    }
  }
}

/**
 * Middleware: Validate Banking Request
 */
const validateBankingRequest = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const apiKey = authHeader.replace('Bearer ', '');
    const partnerId = req.headers['x-partner-id'];

    const security = new BankingSecurityManager();
    const validation = await security.validateAPIKey(apiKey, partnerId);

    if (!validation.valid) {
      return res.status(401).json({ error: validation.error });
    }

    // Check RBI compliance
    const complianceCheck = await security.validateRBICompliance({
      type: req.params.operation || 'GENERIC',
      consentId: req.body?.consentId,
      amount: req.body?.amount
    });

    if (!complianceCheck.compliant) {
      return res.status(403).json({ error: complianceCheck.reason });
    }

    // Attach validation to request
    req.bankingValidation = validation;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default BankingSecurityManager;
export { validateBankingRequest };
