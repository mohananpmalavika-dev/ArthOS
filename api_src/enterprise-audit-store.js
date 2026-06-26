const auditEvents = [
  {
    id: "aud-1",
    action: "Enterprise risk dashboard opened",
    actor: "loan.officer@arthos.demo",
    timestamp: "2026-06-26 09:12",
    status: "success",
    tenantId: "demo-nbfc"
  },
  {
    id: "aud-2",
    action: "Borrower risk report generated",
    actor: "risk.ops@arthos.demo",
    timestamp: "2026-06-26 08:44",
    status: "success",
    tenantId: "demo-nbfc"
  },
  {
    id: "aud-3",
    action: "Critical DPD alert acknowledged",
    actor: "collections@arthos.demo",
    timestamp: "2026-06-25 17:05",
    status: "warning",
    tenantId: "demo-nbfc"
  }
];

export function recordEnterpriseAuditEvent({
  action,
  actor = "system",
  status = "success",
  tenantId = "demo-nbfc",
  customerId = null,
  metadata = {}
}) {
  const event = {
    id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    action,
    actor,
    timestamp: new Date().toISOString(),
    status,
    tenantId,
    customerId,
    metadata
  };
  auditEvents.unshift(event);
  return event;
}

export function getEnterpriseAuditTrail({ limit = 20, tenantId } = {}) {
  const filtered = tenantId ? auditEvents.filter(event => event.tenantId === tenantId) : auditEvents;
  return filtered.slice(0, Math.max(1, Math.min(Number(limit) || 20, 100)));
}
