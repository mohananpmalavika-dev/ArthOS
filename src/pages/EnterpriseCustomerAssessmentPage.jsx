import React, { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { AlertCircle, CheckCircle2, LockKeyhole } from "lucide-react";
import {
  decodeCustomerAssessmentToken,
  verifyCustomerAssessmentAccess
} from "../lib/enterpriseAssessmentInvite.js";
import { calculateFinancialHealthV2 } from "../lib/scoring-v2.js";

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildAssessment(customer, form) {
  const monthlyExpenses = toNumber(form.monthlyExpenses);
  const emergencySavings = toNumber(form.emergencySavings);
  const fixedSavings = Math.min(emergencySavings, Math.max(monthlyExpenses, 0));
  const discretionarySavings = Math.max(0, emergencySavings - fixedSavings);

  return {
    mode: "v2",
    profile: {
      monthlyIncome: toNumber(form.monthlyIncome),
      monthlyExpenses,
      monthlyLiabilities: toNumber(form.monthlyEMI),
      emergencySavingsFixed: fixedSavings,
      emergencySavingsDiscretionary: discretionarySavings,
      totalDebt: toNumber(form.totalDebt),
      incomeStability: form.incomeStability,
      dependentsBucket: "0_1",
      debtRepaymentRatePctOfIncome: 0.12,
      averageInterestRatePct: 10
    },
    behaviour: {
      emotionalMoneyLevel: form.emotionalMoneyLevel,
      socialInfluenceLevel: "sometimes",
      unplannedPurchaseFreq: form.unplannedPurchaseFreq,
      regretImpulseFreq: "sometimes",
      presentFutureMindset: "balance_both",
      avoidBalanceDuringStress: "sometimes",
      spendWhenBored: "sometimes",
      spendWhenStressed: form.spendWhenStressed,
      plannedPurchasesOnly: form.plannedPurchasesOnly,
      cashflowAwareness: "sometimes",
      subscriptionControl: "occasionally",
      impulseWaitRule: form.impulseWaitRule
    },
    awareness: {
      comparesLifestyleFreq: "occasionally",
      hasFinancialPlan: form.hasFinancialPlan,
      tracksExpenses: form.tracksExpenses,
      knowsTotalDebt: form.knowsTotalDebt,
      knowsMonthlyExpenses: form.knowsMonthlyExpenses,
      tracksSavingsRate: "not_sure",
      budgetCycle: "once_every_2_months",
      knowsTop3Expenses: "some"
    },
    habits: {
      habitCheckInsPerWeek: "1",
      debtPaymentDiscipline: "sometimes"
    },
    participant: {
      name: customer.name || "",
      mobile: customer.mobile || "",
      loanNumber: customer.loanNumber || ""
    }
  };
}

export default function EnterpriseCustomerAssessmentPage() {
  const { token } = useParams();
  const decoded = useMemo(() => decodeCustomerAssessmentToken(token), [token]);
  const customer = decoded.valid ? decoded.payload.customer : null;
  const [credentials, setCredentials] = useState({ mobile: "", loanNumber: "" });
  const [verified, setVerified] = useState(false);
  const [accessError, setAccessError] = useState(null);
  const [result, setResult] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState(() => ({
    monthlyIncome: customer?.monthlyIncome || "",
    monthlyExpenses: customer?.monthlyExpenses || "",
    monthlyEMI: customer?.emi || "",
    emergencySavings: customer?.emergencySavings || "",
    totalDebt: customer?.totalDebt || customer?.loanBalance || "",
    incomeStability: customer?.incomeStability || "mostly_consistent",
    emotionalMoneyLevel: "somewhat_emotional",
    unplannedPurchaseFreq: "sometimes",
    spendWhenStressed: "sometimes",
    plannedPurchasesOnly: "occasionally",
    impulseWaitRule: "sometimes",
    hasFinancialPlan: "some_plan",
    tracksExpenses: "sometimes",
    knowsTotalDebt: "partially",
    knowsMonthlyExpenses: "approximate"
  }));

  function updateField(name, value) {
    setForm(current => ({ ...current, [name]: value }));
  }

  function handleVerify(event) {
    event.preventDefault();
    const verification = verifyCustomerAssessmentAccess(decoded.payload, credentials);
    if (!verification.ok) {
      setAccessError(verification.error);
      return;
    }
    setAccessError(null);
    setVerified(true);
  }

  function handleSubmit(event) {
    event.preventDefault();
    const assessment = buildAssessment(customer, form);
    const nextResult = calculateFinancialHealthV2(assessment);
    setResult(nextResult);
    setSubmitted(true);

    try {
      window.localStorage.setItem(
        `arth-os-enterprise-customer-assessment:${customer.id}`,
        JSON.stringify({
          customerId: customer.id,
          loanNumber: customer.loanNumber,
          submittedAt: new Date().toISOString(),
          assessment,
          result: nextResult
        })
      );
    } catch {
      // Local storage is best-effort for this prototype link flow.
    }
  }

  if (!decoded.valid) {
    return (
      <main className="customer-assessment-page">
        <section className="customer-assessment-panel">
          <AlertCircle size={24} />
          <h1>Assessment link unavailable</h1>
          <p>{decoded.error}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="customer-assessment-page">
      <section className="customer-assessment-panel">
        <div className="customer-assessment-header">
          <div>
            <span className="enterprise-nav-badge">ARTH.OS Customer Assessment</span>
            <h1>{customer.name}</h1>
            <p>
              Complete this short financial assessment for loan account{" "}
              <strong>{customer.loanNumber}</strong>.
            </p>
          </div>
          <LockKeyhole size={24} />
        </div>

        {!verified ? (
          <form className="customer-assessment-form" onSubmit={handleVerify}>
            <label>
              Mobile number
              <input
                value={credentials.mobile}
                onChange={event =>
                  setCredentials(current => ({ ...current, mobile: event.target.value }))
                }
                inputMode="tel"
                placeholder="Enter registered mobile number"
              />
            </label>
            <label>
              Loan number password
              <input
                value={credentials.loanNumber}
                onChange={event =>
                  setCredentials(current => ({ ...current, loanNumber: event.target.value }))
                }
                placeholder="Enter loan number"
              />
            </label>
            {accessError && (
              <div className="enterprise-error-banner" role="alert">
                <AlertCircle size={16} />
                {accessError}
              </div>
            )}
            <button className="enterprise-btn-primary" type="submit">
              Unlock Assessment
            </button>
          </form>
        ) : (
          <form className="customer-assessment-form" onSubmit={handleSubmit}>
            <div className="enterprise-insight-strip">
              <CheckCircle2 size={16} />
              <strong>Verified</strong>
              <span>Your mobile number and loan number matched this invite.</span>
            </div>

            <div className="customer-assessment-grid">
              <label>
                Monthly income
                <input
                  type="number"
                  value={form.monthlyIncome}
                  onChange={event => updateField("monthlyIncome", event.target.value)}
                />
              </label>
              <label>
                Monthly expenses
                <input
                  type="number"
                  value={form.monthlyExpenses}
                  onChange={event => updateField("monthlyExpenses", event.target.value)}
                />
              </label>
              <label>
                Monthly EMI
                <input
                  type="number"
                  value={form.monthlyEMI}
                  onChange={event => updateField("monthlyEMI", event.target.value)}
                />
              </label>
              <label>
                Emergency savings
                <input
                  type="number"
                  value={form.emergencySavings}
                  onChange={event => updateField("emergencySavings", event.target.value)}
                />
              </label>
              <label>
                Total debt
                <input
                  type="number"
                  value={form.totalDebt}
                  onChange={event => updateField("totalDebt", event.target.value)}
                />
              </label>
              <label>
                Income stability
                <select
                  value={form.incomeStability}
                  onChange={event => updateField("incomeStability", event.target.value)}
                >
                  <option value="very_consistent">Very consistent</option>
                  <option value="mostly_consistent">Mostly consistent</option>
                  <option value="somewhat_variable">Somewhat variable</option>
                  <option value="highly_variable">Highly variable</option>
                </select>
              </label>
              <label>
                Expense tracking
                <select
                  value={form.tracksExpenses}
                  onChange={event => updateField("tracksExpenses", event.target.value)}
                >
                  <option value="regularly">Regularly</option>
                  <option value="sometimes">Sometimes</option>
                  <option value="rarely">Rarely</option>
                  <option value="never">Never</option>
                </select>
              </label>
              <label>
                Unplanned purchases
                <select
                  value={form.unplannedPurchaseFreq}
                  onChange={event => updateField("unplannedPurchaseFreq", event.target.value)}
                >
                  <option value="never">Never</option>
                  <option value="rarely">Rarely</option>
                  <option value="sometimes">Sometimes</option>
                  <option value="very_frequently">Very frequently</option>
                </select>
              </label>
            </div>

            <button className="enterprise-btn-primary" type="submit">
              Submit Assessment
            </button>

            {submitted && result && (
              <div className="customer-assessment-result">
                <strong>{result.healthScore}</strong>
                <span>{result.categoryBand?.label || "Financial health score"}</span>
                <p>{result.recommendedActionText}</p>
              </div>
            )}
          </form>
        )}
      </section>
    </main>
  );
}
