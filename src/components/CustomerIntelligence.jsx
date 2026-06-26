import React, { memo } from "react";
import { AlertTriangle } from "lucide-react";

const CustomerIntelligence = memo(() => {
  return (
    <div className="enterprise-customer-intelligence">
      <div className="enterprise-error-banner" role="alert" style={{ marginBottom: 16 }}>
        <AlertTriangle size={16} />
        <span style={{ fontWeight: 600 }}>Backend integration required.</span>
        Customer Intelligence (customers list + add) is currently placeholder-only.
        Connect enterprise customer endpoints and replace mock UI.
      </div>

      <div className="enterprise-section-header">
        <div>
          <h2 className="enterprise-section-title">Customer Intelligence</h2>
          <p className="enterprise-section-subtitle">Customer list integration pending</p>
        </div>
      </div>

      <div className="enterprise-card">
        <div className="enterprise-empty-state" style={{ padding: 20 }}>
          This screen intentionally does not render mock enterprise customer data. It will display real
          customer records once the enterprise backend endpoints are wired.
        </div>
      </div>
    </div>
  );
});

CustomerIntelligence.displayName = "CustomerIntelligence";

export default CustomerIntelligence;

