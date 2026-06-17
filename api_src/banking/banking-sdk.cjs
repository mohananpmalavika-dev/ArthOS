/* Banking SDK (CommonJS shim) */
const BankingSDK = {
  async fetchAccountData(userId, consentId, financialEntityId) {
    return [{ accountId: 'acc_demo', balance: 1000, currency: 'INR' }];
  }
};

module.exports = BankingSDK;
