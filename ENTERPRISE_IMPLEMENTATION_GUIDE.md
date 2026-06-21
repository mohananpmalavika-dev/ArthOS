# Enterprise Flow Integration Guide

## Quick Start: 3 Steps to Add Enterprise Portal

### Step 1: Import Enterprise Portal Component
Add this to your routing layer (e.g., `src/AppRouter.jsx` or `src/App.jsx`):

```jsx
import EnterpriseBankPortal from "./components/EnterpriseBankPortal.jsx";
import App from "./App.jsx";  // Existing individual app

function AppRouter() {
  // Option A: Environment variable
  const isEnterprise = import.meta.env.VITE_APP_MODE === "enterprise";
  
  if (isEnterprise) {
    return <EnterpriseBankPortal />;
  }
  return <App />;  // Individual flow
}

export default AppRouter;
```

### Step 2: Environment Configuration
Update your `.env.local`:

```bash
# For individual flow (default)
VITE_APP_MODE=individual

# For enterprise flow
VITE_APP_MODE=enterprise

# Enterprise-specific configs (optional)
VITE_ENTERPRISE_API_URL=https://api.enterprise.arth-os.com
VITE_ENTERPRISE_NAME=Bank of Examples
```

### Step 3: Update Entry Point
In `src/main.jsx`:

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import AppRouter from './AppRouter.jsx'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>,
)
```

---

## Production Deployment

### Subdomain-Based Routing
Route different subdomains to different flows:

```javascript
// Detect subdomain and choose flow
function getAppMode() {
  const hostname = window.location.hostname;
  
  if (hostname.startsWith('enterprise.') || hostname.startsWith('bank.')) {
    return 'enterprise';
  }
  if (hostname.startsWith('api.')) {
    return 'api';  // API-only mode
  }
  return 'individual';  // Default
}

// Use in AppRouter
const mode = getAppMode();
```

**Deployment Examples:**
- `arth-os.com` → Individual flow
- `enterprise.arth-os.com` → Enterprise portal
- `api.arth-os.com/docs` → API documentation

### Environment-Specific Builds

```bash
# Development - Individual flow
npm run dev

# Development - Enterprise flow
VITE_APP_MODE=enterprise npm run dev

# Production build - Individual
npm run build

# Production build - Enterprise
VITE_APP_MODE=enterprise npm run build
```

---

## Component Usage

### Using Enterprise Navigation
```jsx
import EnterpriseFlowNavigation from "./components/EnterpriseFlowNavigation.jsx";

function MyEnterpriseApp() {
  const [activeTab, setActiveTab] = useState("#dashboard");

  return (
    <>
      <EnterpriseFlowNavigation activeHash={activeTab} />
      {/* Your content here */}
    </>
  );
}
```

### Using Portfolio Dashboard
```jsx
import PortfolioDashboard from "./components/PortfolioDashboard.jsx";

function Dashboard() {
  return <PortfolioDashboard />;
}
```

### Using Customer Intelligence
```jsx
import CustomerIntelligence from "./components/CustomerIntelligence.jsx";

function CustomerManager() {
  return <CustomerIntelligence />;
}
```

### Using Compliance Reports
```jsx
import ComplianceReports from "./components/ComplianceReports.jsx";

function Compliance() {
  return <ComplianceReports />;
}
```

---

## Styling

All enterprise components use the new CSS classes:
- `.enterprise-*` - All enterprise-specific styles
- Inherits design tokens from `:root` (colors, typography, etc.)
- Fully responsive (mobile, tablet, desktop)
- Dark theme optimized

### Custom Styling

Override enterprise styles in your CSS:

```css
/* Custom brand colors */
.enterprise-nav-logo {
  color: #your-brand-color;
}

.enterprise-nav-tab.active {
  color: #your-brand-color;
  border-bottom-color: #your-brand-color;
}

/* Custom font sizes */
.enterprise-section-title {
  font-size: 2rem;  /* Change from 1.8rem */
}
```

---

## Authentication Integration

### Individual Flow (Existing)
```jsx
import { useAuth } from "./context/AuthContext.jsx";

function App() {
  const { user, logout } = useAuth();
  // Existing auth logic
}
```

### Enterprise Flow (SSO/OAuth)
```jsx
import { useEnterpriseAuth } from "./context/EnterpriseAuthContext.jsx";

function EnterpriseBankPortal() {
  const { institution, user, logout } = useEnterpriseAuth();
  
  // institution = { id, name, customers: 15234 }
  // user = { role: 'admin', department: 'Risk' }
}
```

**Create `src/context/EnterpriseAuthContext.jsx`:**

```jsx
import React, { createContext, useContext } from 'react';

const EnterpriseAuthContext = createContext();

export function EnterpriseAuthProvider({ children }) {
  const [institution, setInstitution] = React.useState(null);
  const [user, setUser] = React.useState(null);

  const logout = () => {
    setInstitution(null);
    setUser(null);
  };

  return (
    <EnterpriseAuthContext.Provider value={{ institution, user, logout }}>
      {children}
    </EnterpriseAuthContext.Provider>
  );
}

export function useEnterpriseAuth() {
  return useContext(EnterpriseAuthContext);
}
```

---

## Data Integration

### Sample Mock Data (for development)

```jsx
// PortfolioDashboard.jsx already includes mock data
const portfolioMetrics = {
  totalCustomers: 15234,
  averageScore: 642,
  scoreChange: 12,
  riskAccounts: 2341,
  complianceScore: 98.5,
  revenue: 2340000
};
```

### Real Data Integration

Replace mock data with API calls:

```jsx
// In PortfolioDashboard.jsx
import { useEffect, useState } from 'react';

function PortfolioDashboard() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    // Fetch from your API
    fetch('/api/enterprise/portfolio/metrics')
      .then(res => res.json())
      .then(data => setMetrics(data));
  }, []);

  if (!metrics) return <div>Loading...</div>;

  return (
    // Use metrics from API instead of mock data
  );
}
```

---

## API Endpoints (Reference)

```javascript
// GET /api/enterprise/portfolio/metrics
// Returns: { totalCustomers, averageScore, riskAccounts, etc. }

// GET /api/enterprise/customers
// Returns: [{ id, name, score, band, status, riskLevel }, ...]

// GET /api/enterprise/customers/:customerId
// Returns: { id, name, email, score, assessments: [...], transactions: [...] }

// GET /api/enterprise/compliance/reports
// Returns: [{ id, name, status, date, type }, ...]

// GET /api/enterprise/alerts
// Returns: [{ id, customerId, issue, severity, date }, ...]

// POST /api/enterprise/reports/generate
// Body: { type: 'monthly' | 'quarterly', format: 'pdf' | 'xlsx' }
// Returns: { reportId, status, downloadUrl }
```

---

## Testing

### Unit Tests for Enterprise Components

```javascript
// test/components/PortfolioDashboard.test.jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PortfolioDashboard from '../src/components/PortfolioDashboard';

describe('PortfolioDashboard', () => {
  it('renders portfolio metrics', () => {
    render(<PortfolioDashboard />);
    expect(screen.getByText('Portfolio Overview')).toBeInTheDocument();
    expect(screen.getByText(/Total Customers/)).toBeInTheDocument();
  });

  it('displays score distribution', () => {
    render(<PortfolioDashboard />);
    expect(screen.getByText('Health Score Distribution')).toBeInTheDocument();
  });
});
```

Run tests:
```bash
npm test -- test/components/PortfolioDashboard.test.jsx
```

---

## Troubleshooting

### Enterprise components not showing
```bash
# Check environment mode
echo $VITE_APP_MODE

# If not set, explicitly set it
export VITE_APP_MODE=enterprise
npm run dev
```

### Styling not applied
```css
/* Ensure enterprise CSS is loaded */
/* Check that src/styles.css is imported in main.jsx */
import './styles.css'
```

### Mock data not visible
- Check browser DevTools → Elements tab
- Verify component is rendering
- Check console for errors

---

## Next Steps

1. **Integrate real data** - Connect to your backend APIs
2. **Add authentication** - Set up SSO/OAuth for enterprise users
3. **Configure white-labeling** - Customize colors and branding
4. **Deploy** - Use subdomain routing for production
5. **Monitor** - Set up error tracking and analytics

---

**Files Needed**:
- ✅ `src/components/EnterpriseFlowNavigation.jsx`
- ✅ `src/components/PortfolioDashboard.jsx`
- ✅ `src/components/CustomerIntelligence.jsx`
- ✅ `src/components/ComplianceReports.jsx`
- ✅ `src/components/EnterpriseBankPortal.jsx`
- ✅ Enterprise CSS (in `src/styles.css`)

**Status**: Ready for implementation ✅
