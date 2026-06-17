/* AA Connector (CommonJS shim) */
const { createClient } = require('@supabase/supabase-js');
const BankingSDK = require('./banking-sdk.cjs');

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

const AAConnector = {
  async generateConsentRequest(userId, dataScope) {
    // Minimal stub: create a consent record and return a consentId and url
    const consentId = `cons_${Date.now()}`;
    try {
      await supabase.from('aa_consents').insert([{ id: consentId, user_id: userId, data_scope: dataScope, status: 'requested', created_at: new Date().toISOString() }]);
    } catch (e) {
      // ignore
    }
    return { success: true, consentId, consentUrl: `https://aa.example/consent/${consentId}` };
  },

  async handleConsentCallback(consentId, status, financialEntityId) {
    try {
      await supabase.from('aa_consents').update({ status, financial_entity_id: financialEntityId }).eq('id', consentId);
    } catch (e) {}
    return { success: true, consentId, status };
  },

  async fetchAAData(userId, consentId, financialEntityId) {
    // Delegate to banking SDK minimal data fetch
    const data = await BankingSDK.fetchAccountData(userId, consentId, financialEntityId).catch(() => []);
    return { success: true, data };
  },

  async revokeConsent(userId, consentId) {
    try {
      await supabase.from('aa_consents').update({ status: 'revoked' }).eq('id', consentId).eq('user_id', userId);
    } catch (e) {}
    return { success: true, consentId };
  }
};

module.exports = AAConnector;
