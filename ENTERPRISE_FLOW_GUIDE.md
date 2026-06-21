# ARTH.OS: Individual vs Enterprise Flow Comparison

## Overview

ARTH.OS has been designed with **two distinct user flows** to serve different market segments:

1. **Individual Flow** - Personal finance health assessment for consumers
2. **Enterprise Flow** - B2B white-label portal for banks and insurance companies

---

## Side-by-Side Comparison

### Individual Flow (Consumer)

#### Navigation Structure
- **Home** - Personal financial health overview
- **Assessment** - 16-field questionnaire for personal evaluation
- **Reports** - PDF export and historical scores
- **Cognition** - AI insights and blind spots
- **Simulator** - "What-if" scenarios for personal planning
- **Partners** - Financial service recommendations

#### Key Features
- ✅ Personal score tracking (0-1000 scale)
- ✅ Individual blind spot analysis
- ✅ Private financial assessment
- ✅ Anonymous telemetry (no PII stored)
- ✅ Habit tracking and goal setting
- ✅ PDF export of results
- ✅ Personalized recommendations

#### Data Visibility
- **User**: Only their own data
- **Privacy**: All data encrypted locally first
- **Sharing**: Optional peer comparison
- **Export**: Personal PDF reports

#### Use Case
Individual consumers assessing and improving their personal financial health.

---

### Enterprise Flow (Bank/Insurance)

#### Navigation Structure
- **Portfolio** - Aggregate dashboard of all customers
- **Customers** - Individual customer management and intelligence
- **Risk Alerts** - Real-time risk detection and monitoring
- **Compliance** - Regulatory reports (GDPR, PCI-DSS, Basel III, etc.)
- **Analytics** - Portfolio trends and performance metrics
- **Configuration** - API keys, webhooks, white-label settings

#### Key Features
- ✅ Portfolio-level risk dashboard
- ✅ Bulk customer scoring (15,000+ customers)
- ✅ Regulatory compliance reporting
- ✅ Real-time risk alerts
- ✅ Audit trail and compliance logging
- ✅ B2B API access
- ✅ White-label customization
- ✅ Role-based access control (RBAC)

#### Data Visibility
- **Institution**: All customer data in aggregate
- **Privacy**: GDPR/CCPA compliant data handling
- **Compliance**: Full audit trails
- **Export**: Compliance-ready reports

#### Use Case
Financial institutions (banks, insurers, fintech) monitoring customer portfolios and managing regulatory requirements.

---

## Key Differences

| Aspect | Individual | Enterprise |
|--------|-----------|-----------|
| **Primary User** | Individual Consumer | Financial Institution |
| **Data Scope** | Personal only | Bulk portfolio (1000s+) |
| **Focus** | Self-improvement | Risk management |
| **Compliance** | Privacy-first | Regulatory compliance |
| **Reporting** | Personal PDF | Compliance reports (GDPR, PCI-DSS, Basel III) |
| **Alerts** | Personal recommendations | Portfolio risk alerts |
| **APIs** | None | Full REST API |
| **Customization** | Limited | White-label capable |
| **Multi-tenant** | No | Yes |
| **User Roles** | Single user | Admin, Analyst, Viewer |

---

## Architecture Differences

### Individual App Flow
```
User
  ↓
Login/Register
  ↓
Assessment (16 fields)
  ↓
BAST Calculation (Personal Score)
  ↓
Results Display (Personal Dashboard)
  ↓
Export PDF / Share Results
```

### Enterprise Portal Flow
```
Bank/Insurance Institution
  ↓
Enterprise Login (SSO/OAuth)
  ↓
Portfolio Dashboard (Aggregate View)
  ├→ Risk Monitoring (Real-time alerts)
  ├→ Customer Intelligence (Bulk management)
  ├→ Compliance Reports (Regulatory)
  └→ Analytics (Trends & insights)
  ↓
API Integration (Optional)
  ├→ Bulk scoring
  ├→ Webhook notifications
  └→ Custom integrations
```

---

## Component Mapping

### Individual Components Used
- `FlowNavigation.jsx` - 6-tab navigation
- `AssessmentSection.jsx` - Assessment form
- `Dashboard.jsx` - Personal results
- `ExportPDF.jsx` - PDF export

### Enterprise Components (New)
- `EnterpriseFlowNavigation.jsx` - 6-tab navigation (different labels)
- `PortfolioDashboard.jsx` - Aggregate metrics
- `CustomerIntelligence.jsx` - Customer management table
- `ComplianceReports.jsx` - Regulatory reporting
- `EnterpriseBankPortal.jsx` - Main container

---

## Scoring Engine Adaptations

### Individual Scoring
```javascript
Input: Personal financial data (16 fields)
  ↓
BAST Calculation:
  - Behaviour (40%): Personal spending patterns
  - Awareness (30%): Personal financial literacy
  - Stability (30%): Personal income/expenses
  ↓
Output: Personal health score (0-1000)
```

### Enterprise Scoring
```javascript
Input: Bulk customer data
  ↓
Individual Scores: Each customer gets BAST score
  ↓
Aggregation:
  - Portfolio Average Score
  - Distribution by health band
  - Risk account identification
  ↓
Compliance Metrics:
  - Regulatory threshold monitoring
  - Audit trail logging
  ↓
Output: Portfolio health dashboard
```

---

## Feature Availability Matrix

### Assessment & Scoring
| Feature | Individual | Enterprise |
|---------|-----------|-----------|
| Personal assessment | ✅ | ❌ |
| Bulk scoring | ❌ | ✅ |
| BAST calculation | ✅ | ✅ |
| Real-time scores | ✅ | ✅ |

### Reporting & Compliance
| Feature | Individual | Enterprise |
|---------|-----------|-----------|
| PDF export | ✅ | ✅ (bulk) |
| GDPR compliance | ✅ | ✅ |
| PCI-DSS reports | ❌ | ✅ |
| Basel III reports | ❌ | ✅ |
| Audit trails | ❌ | ✅ |

### Monitoring & Alerts
| Feature | Individual | Enterprise |
|---------|-----------|-----------|
| Personal alerts | ✅ | ❌ |
| Portfolio risk alerts | ❌ | ✅ |
| Real-time monitoring | ❌ | ✅ |
| Threshold-based alerts | ❌ | ✅ |

### Integration & APIs
| Feature | Individual | Enterprise |
|---------|-----------|-----------|
| REST API | ❌ | ✅ |
| Webhooks | ❌ | ✅ |
| SSO/OAuth | ❌ | ✅ |
| White-label | ❌ | ✅ |
| Multi-tenant | ❌ | ✅ |

---

## Implementation Guide

### To Use Individual Flow (Default)
```jsx
import App from './App.jsx';  // Existing app
```

### To Use Enterprise Flow
```jsx
import EnterpriseBankPortal from './components/EnterpriseBankPortal.jsx';

function AppRouter() {
  // Route based on subdomain or path
  if (isEnterpriseMode) {
    return <EnterpriseBankPortal />;
  }
  return <App />;  // Individual flow
}
```

### Environment-Based Routing
```javascript
// .env.local
VITE_APP_MODE=individual  # or 'enterprise'

// App entry
if (import.meta.env.VITE_APP_MODE === 'enterprise') {
  return <EnterpriseBankPortal />;
}
```

---

## Deployment Scenarios

### Scenario 1: Consumer App
- **URL**: arth-os.com
- **Mode**: Individual flow
- **Auth**: Email/password
- **Data**: Anonymous scoring

### Scenario 2: Bank Integration
- **URL**: bank-subdomain.arth-os.com
- **Mode**: Enterprise flow
- **Auth**: OAuth + bank credentials
- **Data**: Encrypted bulk customer scoring

### Scenario 3: Insurance Partner
- **URL**: insurance.arth-os.com
- **Mode**: Enterprise flow (white-label)
- **Auth**: SSO (Active Directory)
- **Data**: Portfolio risk monitoring

---

## Styling Consistency

Both flows use the same design system:
- **Color Palette**: Purple, Cyan, Green, Amber, Red
- **Typography**: Sora (display), Inter (body)
- **Spacing**: 16px base unit
- **Border Radius**: 12px default
- **Responsive**: Mobile-first (375px → 1440px+)

---

## Migration Path

Individual users can upgrade to enterprise features:

1. **Phase 1**: Individual assesses themselves → Gets personal score
2. **Phase 2**: User's institution adopts ARTH.OS
3. **Phase 3**: Bulk scoring enabled for all customers
4. **Phase 4**: Portfolio monitoring and compliance reporting

---

## Next Steps

To implement in your fork:

1. Choose your deployment mode:
   ```bash
   # Individual (existing)
   npm run dev
   
   # Enterprise
   VITE_APP_MODE=enterprise npm run dev
   ```

2. Update routing in `src/App.jsx` or `src/AppRouter.jsx`

3. Configure environment variables:
   ```bash
   VITE_APP_MODE=enterprise
   VITE_ENTERPRISE_MODE=true
   ```

4. Test navigation and styling

5. Deploy to production with proper domain/subdomain routing

---

**Generated**: Enterprise Flow Implementation  
**Status**: Ready for deployment  
**Files Created**:
- `src/components/EnterpriseFlowNavigation.jsx`
- `src/components/PortfolioDashboard.jsx`
- `src/components/CustomerIntelligence.jsx`
- `src/components/ComplianceReports.jsx`
- `src/components/EnterpriseBankPortal.jsx`
- Enterprise CSS styling (added to `src/styles.css`)
