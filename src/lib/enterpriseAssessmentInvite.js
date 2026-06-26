const INVITE_VERSION = "enterprise-customer-assessment-v1";

function bytesToBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value) {
  const padded = `${value}${"=".repeat((4 - (value.length % 4)) % 4)}`;
  const binary = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

function encodePayload(payload) {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  return bytesToBase64Url(bytes);
}

function decodePayload(token) {
  const bytes = base64UrlToBytes(token);
  return JSON.parse(new TextDecoder().decode(bytes));
}

function normalizeMobile(value) {
  return String(value || "").replace(/\D/g, "");
}

function normalizeLoanNumber(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function getCustomerLoanNumber(customer = {}) {
  return (
    customer.loanNumber || customer.loanAccountNumber || customer.loanAccount || customer.id || ""
  );
}

export function getCustomerMobile(customer = {}) {
  return (
    customer.mobile || customer.phone || customer.profile?.mobile || customer.profile?.phone || ""
  );
}

export function createCustomerAssessmentToken(customer = {}) {
  const now = Date.now();
  const payload = {
    version: INVITE_VERSION,
    issuedAt: now,
    expiresAt: now + 1000 * 60 * 60 * 24 * 30,
    nonce: Math.random().toString(36).slice(2, 10),
    customer: {
      id: customer.id,
      name: customer.name,
      mobile: getCustomerMobile(customer),
      loanNumber: getCustomerLoanNumber(customer),
      loanType: customer.loanType,
      loanBalance: customer.loanBalance,
      emi: customer.emi,
      monthlyIncome: customer.profile?.monthlyIncome,
      monthlyExpenses: customer.profile?.monthlyExpenses,
      emergencySavings:
        customer.profile?.emergencySavings ||
        Number(customer.profile?.emergencySavingsFixed || 0) +
          Number(customer.profile?.emergencySavingsDiscretionary || 0),
      totalDebt: customer.profile?.totalDebt || customer.loanBalance,
      incomeStability: customer.profile?.incomeStability
    }
  };

  return encodePayload(payload);
}

export function decodeCustomerAssessmentToken(token) {
  try {
    const payload = decodePayload(token);
    if (payload?.version !== INVITE_VERSION || !payload?.customer?.id) {
      return { valid: false, error: "Invalid assessment link." };
    }
    if (payload.expiresAt && Date.now() > payload.expiresAt) {
      return { valid: false, error: "This assessment link has expired." };
    }
    return { valid: true, payload };
  } catch {
    return { valid: false, error: "Invalid assessment link." };
  }
}

export function buildCustomerAssessmentLink(customer, origin = window.location.origin) {
  const token = createCustomerAssessmentToken(customer);
  return `${origin}/customer-assessment/${token}`;
}

export function verifyCustomerAssessmentAccess(payload, { mobile, loanNumber }) {
  const expectedMobile = normalizeMobile(payload?.customer?.mobile);
  const expectedLoanNumber = normalizeLoanNumber(payload?.customer?.loanNumber);
  const providedMobile = normalizeMobile(mobile);
  const providedLoanNumber = normalizeLoanNumber(loanNumber);

  if (!expectedMobile) {
    return { ok: false, error: "Mobile number is not configured for this customer." };
  }
  if (!expectedLoanNumber) {
    return { ok: false, error: "Loan number is not configured for this customer." };
  }
  if (providedMobile !== expectedMobile || providedLoanNumber !== expectedLoanNumber) {
    return { ok: false, error: "Mobile number or loan number does not match this invite." };
  }
  return { ok: true };
}
