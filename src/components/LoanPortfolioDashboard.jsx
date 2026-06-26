import React from "react";
import { Briefcase, TrendingUp, AlertTriangle, Users, DollarSign, BarChart2 } from "lucide-react";
import { ScoreCard } from "./ScoreCard"; 
import { CustomerIntelligence } from "./CustomerIntelligence";

const LoanPortfolioDashboard = () => {
  const portfolioSummary = {
    totalLoans: 1250,
    totalOutstanding: 85000000,
    averageHealthScore: 720,
    accountsInAlert: 42,
    par30: 5.2, // Percentage of Accounts > 30 DPD
  };

  return (
    <div className="enterprise-dashboard">
      <div className="enterprise-section-header">
        <div>
          <h2 className="enterprise-section-title">Loan Portfolio Dashboard</h2>
          <p className="enterprise-section-subtitle">
            An overview of the entire loan portfolio's health and risk metrics.
          </p>
        </div>
      </div>

      <div className="dashboard-grid">
        <ScoreCard
          icon={<Briefcase size={24} />}
          label="Total Active Loans"
          value={portfolioSummary.totalLoans.toLocaleString()}
          trend="up"
        />
        <ScoreCard
          icon={<DollarSign size={24} />}
          label="Total Outstanding Principal"
          value={`₹${(portfolioSummary.totalOutstanding / 10000000).toFixed(2)} Cr`}
          trend="up"
        />
        <ScoreCard
          icon={<TrendingUp size={24} />}
          label="Avg. Borrower Health"
          value={portfolioSummary.averageHealthScore}
          trend="down"
        />
        <ScoreCard
          icon={<AlertTriangle size={24} />}
          label="Accounts in High Risk"
          value={portfolioSummary.accountsInAlert}
          trend="up"
          className="alert"
        />
        <ScoreCard
          icon={<BarChart2 size={24} />}
          label="Portfolio at Risk (>30 DPD)"
          value={`${portfolioSummary.par30}%`}
          trend="up"
          className="alert"
        />
      </div>

      <div className="mt-8">
        <CustomerIntelligence />
      </div>
    </div>
  );
};

export default LoanPortfolioDashboard;