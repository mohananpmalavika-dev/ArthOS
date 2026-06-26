import { calculateFinancialHealthV2 } from "../src/lib/scoring-v2.js";
import {
  decodeCustomerAssessmentToken,
  verifyCustomerAssessmentAccess
} from "../src/lib/enterpriseAssessmentInvite.js";
import { saveCustomerAssessmentSubmission } from "./customer-assessment-store.js";
import { recordEnterpriseAuditEvent } from "./enterprise-audit-store.js";

function setCors(res) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function customerAssessmentHandler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { token, mobile, loanNumber, assessment } = req.body || {};
  if (!assessment || typeof assessment !== "object") {
    return res.status(400).json({ error: "Assessment payload is required" });
  }

  const decoded = decodeCustomerAssessmentToken(token);

  if (!decoded.valid) {
    return res.status(400).json({ error: decoded.error || "Invalid assessment link" });
  }

  const verification = verifyCustomerAssessmentAccess(decoded.payload, { mobile, loanNumber });
  if (!verification.ok) {
    recordEnterpriseAuditEvent({
      action: "Customer assessment verification failed",
      actor: decoded.payload.customer?.id || "borrower",
      status: "warning",
      customerId: decoded.payload.customer?.id,
      metadata: { reason: verification.error }
    });
    return res.status(401).json({ error: verification.error });
  }

  const result = calculateFinancialHealthV2(assessment);
  const submittedAt = new Date().toISOString();
  const audit = recordEnterpriseAuditEvent({
    action: "Customer assessment submitted",
    actor: decoded.payload.customer?.mobile || decoded.payload.customer?.id || "borrower",
    status: "success",
    customerId: decoded.payload.customer?.id,
    metadata: {
      loanNumber: decoded.payload.customer?.loanNumber,
      healthScore: result.healthScore,
      healthBand: result.categoryBand?.label,
      submittedAt
    }
  });
  const submission = saveCustomerAssessmentSubmission({
    customerId: decoded.payload.customer?.id,
    loanNumber: decoded.payload.customer?.loanNumber,
    assessment,
    result,
    auditId: audit.id,
    submittedAt
  });

  return res.status(201).json({
    ok: true,
    submissionId: submission.id,
    submittedAt,
    customerId: decoded.payload.customer?.id,
    result,
    auditId: audit.id
  });
}
