const customerAssessments = new Map();

function keyFor(customerId) {
  return String(customerId || "").trim();
}

export function saveCustomerAssessmentSubmission({
  customerId,
  loanNumber,
  assessment,
  result,
  auditId,
  submittedAt = new Date().toISOString()
}) {
  const key = keyFor(customerId);
  if (!key) {
    throw new Error("customerId is required");
  }

  const submission = {
    id: `cas-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    customerId: key,
    loanNumber,
    submittedAt,
    assessment,
    result,
    auditId
  };

  const existing = customerAssessments.get(key) || [];
  customerAssessments.set(key, [submission, ...existing].slice(0, 20));
  return submission;
}

export function getLatestCustomerAssessment(customerId) {
  return customerAssessments.get(keyFor(customerId))?.[0] || null;
}

export function listCustomerAssessments(customerId) {
  return customerAssessments.get(keyFor(customerId)) || [];
}
