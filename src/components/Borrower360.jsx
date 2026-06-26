import React, { useEffect, useMemo, useState } from "react";
import { User, Briefcase, Calendar, TrendingUp, AlertTriangle, DollarSign, CheckCircle, XCircle } from "lucide-react";
import ScoreRing from "./ScoreRing";
import { predictLoanDefault } from "../lib/serverEngineClient.js";
import NextBestActionCard from "./NextBestActionCard";

const Borrower360 = ({ customer }) => {
  // Mock data for demonstration
  const history = useMemo(() => {
    if (!customer) return null;
    // In a real app, this data would be fetched from a backend
    return {
      paymentHistory: [
        { date: "2024-06-05", status: "paid" },
        { date: "2024-05-05", status: "paid" },
        { date: "2024-04-10", status: "late" },
        { date: "2024-03-05", status: "paid" },
      ],
      customerHistory: [
        { date: "2024-04-01", dpd: 0 },
        { date: "2024-05-01", dpd: 0 },
        { date: "2024-06-01", dpd: customer.dpd },
      ],
    };
  }, [customer]);

  const [defaultRisk, setDefaultRisk] = useState(null);
  const [riskLoading, setRiskLoading] = useState(false);
  const [riskError, setRiskError] = useState(null);

  useEffect(() => {
    if (!customer || !history) {
      return;
    }

    let cancelled = false;

    async function loadDefaultRisk() {
      setRiskLoading(true);
      setRiskError(null);
      setDefaultRisk(null);

      try {
        const result = await predictLoanDefault(customer, history);
        if (!cancelled) {
          setDefaultRisk(result);
        }
      } catch (error) {
        if (!cancelled) {
          setRiskError(error.message || "Unable to load default risk");
        }
      } finally {
        if (!cancelled) {
          setRiskLoading(false);
        }
      }
    }

    loadDefaultRisk();

    return () => {
      cancelled = true;
    };
  }, [customer, history]);

  if (!customer) {
    return <div>Select a customer to see their 360° profile.</div>;
  }

  const healthScore = customer.creditScore; 
  const riskCategory = defaultRisk ? defaultRisk.riskCategory : riskLoading ? "Loading" : "Unavailable";
  const explanationPath =
    defaultRisk?.explanation?.explanationPath?.length > 0
      ? defaultRisk.explanation.explanationPath
      : defaultRisk?.explanation?.topReasons || [];

  return (
    <div className="borrower-360-dashboard">
      <div className="enterprise-section-header">
        <div>
          <h2 className="enterprise-section-title">Borrower 360°</h2>
          <p className="enterprise-section-subtitle">
            A complete financial profile for <strong>{customer.name}</strong> (ID: {customer.id})
          </p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="main-panel">
          <div className="panel">
            <h3 className="panel-title">Loan Details</h3>
            <div className="details-grid">
              <div><span>Loan Type:</span> <strong>{customer.loanType}</strong></div>
              <div><span>Loan Amount:</span> <strong>₹{customer.loanBalance.toLocaleString()}</strong></div>
              <div><span>Interest Rate:</span> <strong>9.5%</strong></div>
              <div><span>Term:</span> <strong>36 months</strong></div>
              <div><span>Disbursal Date:</span> <strong>2023-01-15</strong></div>
              <div><span>Next Payment Due:</span> <strong>2024-07-05</strong></div>
            </div>
          </div>

          <div className="panel mt-4">
            <h3 className="panel-title">Payment History</h3>
            <ul className="payment-history">
              <li className="paid">
                <CheckCircle size={16} />
                <span>June 2024 - ₹5,200 - Paid on time</span>
              </li>
              <li className="paid">
                <CheckCircle size={16} />
                <span>May 2024 - ₹5,200 - Paid on time</span>
              </li>
              <li className="late">
                <AlertTriangle size={16} />
                <span>April 2024 - ₹5,200 - Paid 5 days late</span>
              </li>
               <li className="paid">
                <CheckCircle size={16} />
                <span>March 2024 - ₹5,200 - Paid on time</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="sidebar">
          <div className="panel">
            <h3 className="panel-title">Risk Analysis</h3>
            <div className="risk-analysis">
              <ScoreRing score={healthScore} />
              <div className="health-score-summary">
                <strong>{healthScore}</strong>
                <span>Credit Score</span>
              </div>
              <div className="risk-metric">
                <span>Default Risk</span>
                <strong className={riskCategory.toLowerCase().replace(" ", "-")}>
                  {defaultRisk ? `${riskCategory} (${defaultRisk.riskScore}%)` : riskCategory}
                </strong>
              </div>
              {riskError && <p className="enterprise-error-text">{riskError}</p>}
              <div className="risk-metric">
                <span>Days Past Due</span>
                <strong>{customer.dpd}</strong>
              </div>
              {explanationPath.length > 0 && (
                <div className="risk-explanation">
                  <span>Reason path</span>
                  <ol>
                    {explanationPath.map(reason => (
                      <li key={reason.code}>
                        <strong>{reason.label}</strong>
                        <small>{reason.detail}</small>
                        {reason.value !== null && reason.value !== undefined && (
                          <em>Evidence: {String(reason.value)}</em>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>
           <div className="panel mt-4">
            <NextBestActionCard customer={customer} defaultRisk={defaultRisk} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Borrower360;
