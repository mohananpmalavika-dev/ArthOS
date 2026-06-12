# Real Banking Integration Implementation Guide

**Blueprint §20-25: Banks, Lenders & Insurers Integrate into ARTH.OS**

> **Status:** Production-Ready Architecture  
> **Version:** 1.0  
> **Last Updated:** June 2026

---

## Overview

The Real Banking Integration layer enables seamless connection between ARTH.OS financial health assessments and the Indian banking ecosystem:

- **Account Aggregator (AA)**: RBI-compliant consent-based financial data aggregation
- **UPI Transactions**: Real-time UPI transaction ingestion and categorization
- **Bank Feeds**: Multi-bank account aggregation and transaction feeds
- **Insurance APIs**: Policy management, claims, and recommendations
- **Credit Integration**: CIBIL/credit score and lending opportunity matching
- **B2B SDK**: For lenders, fintechs, and banks to access ARTH.OS data

---

## Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    ARTH.OS Core                            │
│  Financial Health Assessment + Digital Twin Engine         │
└───────────────────┬────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │  Banking Integration  │
        │   Layer (v5 Schema)   │
        └───────┬───────────────┘
                │
    ┌───────────┼───────────┬───────────┬──────────────┐
    │           │           │           │              │
    ▼           ▼           ▼           ▼              ▼
┌────────┐ ┌──────┐ ┌─────────┐ ┌──────────┐ ┌────────────┐
│ Account│ │ UPI  │ │  Bank   │ │Insurance │ │ Lending &  │
│Aggreg. │ │Trans.│ │ Feeds   │ │ APIs     │ │ Credit     │
└────────┘ └──────┘ └─────────┘ └──────────┘ └────────────┘
    │           │           │           │              │
    └───────────┴───────────┴───────────┴──────────────┘
                    │
        ┌───────────┴───────────┐
        │  Security Layer       │
        │  Encryption & RBI     │
        │  Compliance           │
        └───────────────────────┘
                    │
        ┌───────────┴───────────┐
        │  Supabase PostgreSQL  │
        │  Vault & Storage      │
        └───────────────────────┘
```

---

## Database Schema (V5)

### New Tables (10 core entities)

1. **bank_connections** - OAuth/API connections to banks
2. **aa_consent_logs** - RBI Account Aggregator consent tracking
3. **bank_accounts** - Account snapshots from banks
4. **financial_transactions** - Normalized transactions (bank feeds + UPI)
5. **upi_transactions** - UPI-specific metadata
6. **insurance_policies** - Insurance policy catalog
7. **insurance_claims** - Claims management
8. **credit_profiles** - Credit bureau integration
9. **lending_opportunities** - Pre-approved offers from partners
10. **banking_sync_status** - Sync health & scheduling

Run migration:
```bash
psql -h db.supabase.co -U postgres -d arth_os -f migrations/V5__banking_integration_schema.sql
```

---

## Module: Account Aggregator (AA)

**File:** `api_src/banking/aa-connector.js`

### Features

- **Consent Generation**: Create RBI-compliant consent requests
- **Multi-Provider Support**: SETU, FINBOX, PERFIOS
- **Data Fetching**: Retrieve accounts, transactions, credit profiles
- **Automatic Categorization**: Tag transactions by spending category
- **Sync Management**: Track and manage data freshness

### Usage

```javascript
import AAConnector from './aa-connector.js';

// 1. Generate consent request
const consent = await AAConnector.generateConsentRequest(userId, {
  accounts: true,
  transactions: true,
  creditProfile: true,
  frequency: 'monthly'
});

// 2. User approves in AA provider UI
// 3. Webhook callback with financialEntityId
const callback = await AAConnector.handleConsentCallback(
  consentId,
  'approved',
  financialEntityId
);

// 4. Data fetched automatically
// Stored in: bank_accounts, financial_transactions, credit_profiles
```

### Configuration

```env
AA_PROVIDER=RBI-AA-001
AA_SETU_REQUEST_ID=your_request_id
AA_SETU_SECRET_KEY=your_secret_key
AA_FINBOX_REQUEST_ID=...
AA_FINBOX_SECRET_KEY=...
```

---

## Module: UPI Transaction Ingestion

**File:** `api_src/banking/upi-ingestion.js`

### Features

- **Real-time Webhooks**: Capture transactions from Google Pay, PhonePe, Paytm, WhatsApp Pay
- **Duplicate Detection**: UPI transaction ID deduplication
- **Fraud Detection**: Anomaly detection for unusual patterns
- **Balance Updates**: Real-time account balance sync
- **Merchant Tracking**: Identify merchant vs peer transfers

### Webhook Setup

Register with UPI providers for webhook callbacks:

```javascript
// Webhook endpoint: POST /api/banking/upi/webhook
{
  provider: 'GOOGLE_PAY',
  signature: 'hmac_sha256_signature',
  payload: {
    transactionId: 'TXN_123',
    senderUPI: 'user@provider',
    recipientUPI: 'merchant@bank',
    amount: 5000,
    timestamp: '2026-06-12T10:30:00Z',
    rrn: '123456789012',
    status: 'completed'
  }
}
```

### Configuration

```env
GOOGLE_PAY_WEBHOOK_SECRET=your_secret
PHONEPE_WEBHOOK_SECRET=your_secret
PAYTM_WEBHOOK_SECRET=your_secret
WHATSAPP_PAY_WEBHOOK_SECRET=your_secret
```

---

## Module: Bank Feeds

**File:** `api_src/banking/bank-feeds.js`

### Features

- **Open Banking APIs**: OAuth 2.0 with banks (HDFC, ICICI, Axis, YES, Kotak)
- **Transaction Normalization**: Standardize formats across banks
- **OFX Parsing**: Legacy bank file format support
- **Scheduled Sync**: Daily/weekly/monthly reconciliation
- **Multi-Account Support**: Aggregate across all user accounts

### OAuth Flow

```javascript
// 1. Initiate connection
const connection = await BankFeeds.initiateBankFeedConnection(
  userId,
  'HDFC',
  'accountNumber'
);

// User navigates to connection.oauthUrl
// 2. Bank redirects with code
// 3. Handle callback
const result = await BankFeeds.handleBankOAuthCallback(state, code);

// 4. Transactions synced to financial_transactions table
// 5. Balance updated in bank_accounts table
```

### Configuration

```env
BANK_OAUTH_CLIENT_ID_HDFC=your_client_id
BANK_OAUTH_CLIENT_SECRET_HDFC=your_client_secret
BANK_OAUTH_CLIENT_ID_ICICI=...
BANK_OAUTH_REDIRECT_URI=https://your-domain.com/banking/callback
```

---

## Module: Insurance APIs

**File:** `api_src/banking/insurance-apis.js`

### Features

- **Multi-Provider Integration**: Digit, Bajaj Allianz, HDFC ERGO, ICICI Lombard, Max Bupa
- **Policy Aggregation**: Fetch all active policies
- **Claims Management**: File and track insurance claims
- **Premium Reminders**: Automated due date notifications
- **Coverage Recommendations**: Personalized insurance suggestions based on financial profile

### Usage

```javascript
import InsuranceAPIs from './insurance-apis.js';

// Fetch all policies
const policies = await InsuranceAPIs.fetchUserInsurancePolicies(userId);

// Get recommendations
const recs = await InsuranceAPIs.getInsuranceRecommendations(userId);
// Returns: health insurance, life insurance, auto insurance recommendations

// File a claim
const claim = await InsuranceAPIs.fileInsuranceClaim(userId, policyId, {
  amount: 50000,
  reason: 'Medical hospitalization'
});

// Get premium reminders
const reminders = await InsuranceAPIs.getPremiumReminders(userId);
```

### Configuration

```env
DIGIT_API_KEY=your_key
BAJAJ_API_KEY=your_key
HDFC_ERGO_API_KEY=your_key
# ... for each provider
```

---

## Module: Banking Security

**File:** `api_src/banking/banking-security.js`

### Features

- **AES-256-GCM Encryption**: Bank-grade encryption for credentials
- **PII Masking**: Safe display of sensitive data
- **Audit Logging**: Complete compliance trail
- **API Key Rotation**: Secure key management
- **RBI Compliance**: Validates operations against regulatory requirements

### Usage

```javascript
import BankingSecurityManager from './banking-security.js';

const security = new BankingSecurityManager();

// Encrypt credentials
const encrypted = security.encryptData(
  JSON.stringify(credentials),
  `${userId}:${bankCode}`
);

// Store in vault
await security.storeEncryptedCredentials(userId, 'HDFC', credentials);

// Retrieve safely
const { credentials } = await security.retrieveCredentials(userId, 'HDFC');

// Generate API key for partner
const { apiKey } = await security.generateAPIKey(userId, 'PARTNER_001', [
  'read_accounts',
  'read_transactions',
  'read_credit_score'
]);

// Validate compliance
const compliance = await security.validateRBICompliance({
  type: 'ACCOUNT_AGGREGATOR',
  consentId: 'CONSENT_123',
  amount: 500000
});

// Generate audit report
const report = await security.generateComplianceReport(userId, 'monthly');
```

---

## Module: B2B Banking SDK

**File:** `api_src/banking/banking-sdk.js`

### For Lenders & Fintechs

```javascript
import ArthOSBankingSDK from '@arth-os/banking-sdk';

const sdk = new ArthOSBankingSDK({
  partnerId: 'HDFC_CREDIT',
  apiKey: process.env.PARTNER_API_KEY,
  environment: 'production'
});

// Request user financial data
const consent = await sdk.requestFinancialDataConsent(userId, {
  scopes: ['accounts', 'transactions', 'credit_score'],
  purpose: 'CREDIT_DECISIONING',
  validityDays: 365
});

// Check if user approved
const status = await sdk.checkConsentStatus(consentId);

// Fetch financial data
const data = await sdk.getFinancialData(consentId, {
  dataTypes: ['accounts', 'transactions', 'creditProfile'],
  limit: 100
});

// Get financial health score
const score = await sdk.getFinancialScore(userId);

// Create loan application
const app = await sdk.createLoanApplication(userId, {
  loanType: 'personal',
  requestedAmount: 500000,
  tenure: 36,
  purpose: 'Personal loan'
});

// Submit with documents
const submission = await sdk.submitLoanApplication(app.applicationId, [
  { type: 'PAN', url: '...' },
  { type: 'AADHAR', url: '...' }
]);
```

### Webhook Events

```javascript
// Register webhook
sdk.registerWebhook('transaction.received', 'https://your-api.com/webhooks/transactions');

// Handle in your backend
export const webhookHandler = async (req, res) => {
  const { eventType, data } = req.body;
  
  switch(eventType) {
    case 'consent.approved':
      // User gave consent - fetch their data
      break;
    case 'transaction.received':
      // New transaction detected
      break;
    case 'loan.approved':
      // Loan approved
      break;
  }
};
```

---

## API Endpoints

### Account Aggregator
```
POST   /api/banking/aa/consent/request      - Generate consent
POST   /api/banking/aa/consent/callback     - Handle callback
POST   /api/banking/aa/data/fetch           - Fetch AA data
POST   /api/banking/aa/consent/revoke       - Revoke consent
```

### UPI Transactions
```
POST   /api/banking/upi/webhook             - Receive UPI webhooks
GET    /api/banking/upi/transactions        - Get UPI transaction history
```

### Bank Feeds
```
POST   /api/banking/feeds/connect           - Initiate OAuth
POST   /api/banking/feeds/oauth/callback    - Handle OAuth callback
GET    /api/banking/accounts/summary        - Get account balances
GET    /api/banking/transactions/summary    - Get transaction summary
```

### Insurance
```
GET    /api/banking/insurance/policies      - Get all policies
GET    /api/banking/insurance/recommendations - Get recommendations
GET    /api/banking/insurance/reminders     - Get premium reminders
POST   /api/banking/insurance/claims        - File a claim
```

### Credit & Lending
```
GET    /api/banking/credit/profile          - Get credit profile
GET    /api/banking/lending/opportunities   - Get loan offers
```

### Sync Management
```
GET    /api/banking/sync/status             - Get sync health
POST   /api/banking/sync/settings           - Update sync settings
```

---

## Deployment Checklist

- [ ] Run V5 database migration
- [ ] Create Supabase RLS policies for banking tables
- [ ] Set up encryption keys in environment
- [ ] Configure AA provider credentials
- [ ] Register UPI webhook endpoints with providers
- [ ] Register bank OAuth applications
- [ ] Set up insurance provider API keys
- [ ] Deploy banking modules to Vercel
- [ ] Enable audit logging in production
- [ ] Set up Datadog/monitoring for banking operations
- [ ] Create customer support runbooks
- [ ] Document for B2B partners

---

## Security Best Practices

1. **Encryption**
   - All credentials encrypted at rest (AES-256-GCM)
   - SSL/TLS for all API communication
   - Separate encryption keys per user

2. **Access Control**
   - RBI compliance validation on all endpoints
   - API key rotation every 90 days
   - Partner-specific scopes for SDK access

3. **Audit Trail**
   - All banking operations logged
   - Monthly compliance reports
   - Webhook signature verification

4. **Data Retention**
   - Transactions: 7 years (per RBI guidelines)
   - Consent logs: 7 years
   - Audit logs: 1 year

---

## Impact & Metrics

### User Benefits
- ✅ Real-time financial data from all accounts
- ✅ Unified view of spending across UPI, cards, banks
- ✅ Insurance policy management
- ✅ Personalized lending offers
- ✅ Credit score tracking

### Bank/Lender Benefits
- ✅ Access to live financial data via SDK
- ✅ Pre-qualified borrower pool
- ✅ Faster loan decisioning
- ✅ Reduced fraud through behavioral analysis

### ARTH.OS Platform Impact
- ✅ Become the aggregation layer for Indian fintech
- ✅ Multiple revenue streams (B2B API licensing, data insights)
- ✅ Competitive advantage with real-time data
- ✅ Ecosystem expansion to 100M+ potential users

---

## Integration Timeline

**Phase 1 (Weeks 1-2):** Account Aggregator + Security
**Phase 2 (Weeks 3-4):** UPI + Bank Feeds
**Phase 3 (Weeks 5-6):** Insurance + Credit Integration
**Phase 4 (Weeks 7-8):** B2B SDK + Partner Onboarding

---

## Support & Documentation

- B2B SDK: https://docs.arth-os.com/banking-sdk
- RBI Compliance: See `banking-security.js` for validation rules
- Webhook: https://docs.arth-os.com/banking-webhooks
- Architecture: See diagram at top of this guide

---

**Next Steps:** Onboard first partner bank, test Account Aggregator flow end-to-end, prepare for regulatory certification.
