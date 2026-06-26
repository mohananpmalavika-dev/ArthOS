import React from "react";
import { useEnterpriseAuth } from "../../context/EnterpriseAuthContext.jsx";

export default function RequirePermission({ permission, fallback = null, children }) {
  const { hasPermission, loading } = useEnterpriseAuth();

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 160 }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!hasPermission(permission)) {
    return fallback;
  }

  return <>{children}</>;
}

