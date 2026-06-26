import React, { memo, useState } from "react";
import {
  Search,
  Download,
  Filter,
  ChevronRight,
  Eye,
  AlertTriangle,
  TrendingUp,
  MoreVertical,
  UserPlus
} from "lucide-react";

const CustomerIntelligence = memo(() => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    id: "",
    accounts: 1,
    loanBalance: 0,
    onTimePaymentRate: 0.92
  });

  const [customers, setCustomers] = useState([
    {
      id: "CS-14523",
      name: "John Smith",
      email: "john.smith@email.com",
      band: "Resilient",
      status: "active",
      lastAssessment: "2024-06-15",
      riskLevel: "low",
      trend: "up",
      accounts: 3,
      loanBalance: 150000,
      onTimePaymentRate: 0.96,
      loanType: "Business Loan",
      creditScore: 760,
      dpd: 0
    },
    {
      id: "CS-18746",
      name: "Sarah Chen",
      email: "sarah.chen@email.com",
      band: "Fragile",
      status: "alert",
      lastAssessment: "2024-06-18",
      riskLevel: "high",
      trend: "down",
      accounts: 2,
      loanBalance: 98000,
      onTimePaymentRate: 0.68,
      loanType: "Personal Loan",
      creditScore: 610,
      dpd: 35
    },
    {
      id: "CS-92034",
      name: "Michael Johnson",
      email: "m.johnson@email.com",
      band: "Resilient",
      status: "active",
      lastAssessment: "2024-06-17",
      riskLevel: "low",
      trend: "up",
      accounts: 4,
      loanBalance: 420000,
      onTimePaymentRate: 0.98,
      loanType: "Mortgage",
      creditScore: 800,
      dpd: 0
    },
    {
      id: "CS-56789",
      name: "Emily Davis",
      email: "emily.davis@email.com",
      band: "Developing",
      status: "active",
      lastAssessment: "2024-06-16",
      riskLevel: "medium",
      trend: "stable",
      accounts: 2,
      loanBalance: 122000,
      onTimePaymentRate: 0.84,
      loanType: "Personal Loan",
      creditScore: 700,
      dpd: 12
    },
    {
      id: "CS-34521",
      name: "Robert Wilson",
      email: "r.wilson@email.com",
      band: "Critical",
      status: "alert",
      lastAssessment: "2024-06-19",
      riskLevel: "critical",
      trend: "down",
      accounts: 1,
      loanBalance: 82000,
      onTimePaymentRate: 0.54,
      loanType: "Personal Loan",
      creditScore: 540,
      dpd: 65
    }
  ]);

  const determineLoanType = (customer) => {
    const balance = customer.loanBalance || 0;
    if (balance >= 300000) return "Mortgage";
    if (balance >= 120000) return "Business Loan";
    if (balance >= 40000) return "Personal Loan";
    return "Micro Loan";
  };

  const deriveRiskLevel = (customer) => {
    const paymentRate = customer.onTimePaymentRate ?? 0;
    const loanBalance = customer.loanBalance ?? 0;

    if (paymentRate < 0.60 || loanBalance > 400000) {
      return "critical";
    }
    if (paymentRate < 0.75 || loanBalance > 250000) {
      return "high";
    }
    if (paymentRate < 0.85 || loanBalance > 120000) {
      return "medium";
    }
    return "low";
  };

  const deriveTrend = (customer) => {
    const paymentRate = customer.onTimePaymentRate ?? 0;
    if (paymentRate >= 0.95) return "up";
    if (paymentRate >= 0.80) return "stable";
    return "down";
  };

  const deriveCreditScore = (customer) => {
    const paymentRate = customer.onTimePaymentRate ?? 0.7;
    const loanBalance = customer.loanBalance ?? 0;
    const balanceFactor = Math.max(0, Math.min(1, 1 - loanBalance / 500000));
    const score = Math.round(300 + paymentRate * 400 + balanceFactor * 150 + (customer.accounts || 1) * 20);
    return Math.max(300, Math.min(850, score));
  };

  const deriveDaysPastDue = (customer) => {
    const paymentRate = customer.onTimePaymentRate ?? 0.7;
    if (paymentRate >= 0.95) return 0;
    if (paymentRate >= 0.85) return 7;
    if (paymentRate >= 0.70) return 28;
    if (paymentRate >= 0.50) return 60;
    return 90;
  };

  const calculateCustomerHealthScore = (customer) => {
    const paymentRate = customer.onTimePaymentRate ?? 0.7;
    const loanBalance = customer.loanBalance ?? 0;
    const accounts = customer.accounts ?? 1;
    const scoreFromPayment = Math.round(paymentRate * 50);
    const scoreFromBalance = Math.round(Math.max(0, 50 - loanBalance / 20000));
    const scoreFromAccounts = Math.min(20, accounts * 5);
    const trendBonus = customer.trend === "up" ? 15 : customer.trend === "stable" ? 8 : 0;

    return Math.max(0, Math.min(100, scoreFromPayment + scoreFromBalance + scoreFromAccounts + trendBonus));
  };

  const getHealthBand = (score) => {
    if (score >= 85) return "Strong";
    if (score >= 70) return "Resilient";
    if (score >= 55) return "Developing";
    if (score >= 40) return "Fragile";
    return "Critical";
  };

  const getBandColor = (band) => {
    switch (band) {
      case "Strong":
        return "#0f766e";
      case "Resilient":
        return "#15803d";
      case "Developing":
        return "#d97706";
      case "Fragile":
        return "#ea580c";
      case "Critical":
        return "#b91c1c";
      default:
        return "#374151";
    }
  };

  const getTrendIcon = (trend) => {
    if (trend === "up") return "↑";
    if (trend === "down") return "↓";
    return "→";
  };

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || c.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleAddCustomer = () => {
    if (!newCustomer.name || !newCustomer.id) {
      return;
    }

    const derivedRiskLevel = deriveRiskLevel(newCustomer);
    const derivedTrend = deriveTrend(newCustomer);
    const derivedCreditScore = deriveCreditScore(newCustomer);
    const derivedDpD = deriveDaysPastDue(newCustomer);
    const healthScore = calculateCustomerHealthScore({
      ...newCustomer,
      riskLevel: derivedRiskLevel,
      trend: derivedTrend
    });

    const customerEntry = {
      ...newCustomer,
      lastAssessment: new Date().toISOString().slice(0, 10),
      riskLevel: derivedRiskLevel,
      trend: derivedTrend,
      creditScore: derivedCreditScore,
      dpd: derivedDpD,
      loanType: determineLoanType(newCustomer),
      band: getHealthBand(healthScore),
      status: derivedRiskLevel === "high" || derivedRiskLevel === "critical" ? "alert" : "active"
    };

    setCustomers((prev) => [customerEntry, ...prev]);
    setShowAddForm(false);
    setNewCustomer({
      name: "",
      id: "",
      accounts: 1,
      loanBalance: 0,
      onTimePaymentRate: 0.92
    });
  };

  const handleExportList = () => {
    const rows = [
      ["Customer", "Customer ID", "Health Score", "Risk Level", "Last Assessment", "Accounts", "Loan Balance", "On-time Rate", "Trend", "Status"],
      ...filteredCustomers.map((customer) => [
        customer.name,
        customer.id,
        calculateCustomerHealthScore(customer),
        customer.riskLevel,
        customer.lastAssessment,
        customer.accounts,
        customer.loanBalance,
        `${Math.round((customer.onTimePaymentRate ?? 0) * 100)}%`,
        customer.status
      ])
    ];

    const csvContent = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "enterprise-customers.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="enterprise-customer-intelligence">
      {/* Header */}
      <div className="enterprise-section-header">
        <div>
          <h2 className="enterprise-section-title">Customer Intelligence</h2>
          <p className="enterprise-section-subtitle">
            Monitor and manage individual customer financial health
          </p>
        </div>
        <div className="enterprise-header-controls">
          <button className="enterprise-btn-secondary" onClick={() => setShowAddForm(true)}>
            <UserPlus size={16} />
            Add Customer
          </button>
          <button className="enterprise-btn-secondary" onClick={handleExportList}>
            <Download size={16} />
            Export List
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      {showAddForm && (
        <div className="enterprise-add-form">
          <div className="enterprise-add-form-row">
            <input
              type="text"
              placeholder="Customer name"
              value={newCustomer.name}
              onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
            />
            <input
              type="text"
              placeholder="Customer ID"
              value={newCustomer.id}
              onChange={(e) => setNewCustomer({ ...newCustomer, id: e.target.value })}
            />
          </div>
          <div className="enterprise-add-form-row">
            <input
              type="number"
              placeholder="Outstanding loan balance"
              value={newCustomer.loanBalance}
              onChange={(e) => setNewCustomer({ ...newCustomer, loanBalance: Number(e.target.value) })}
            />
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              placeholder="On-time payment rate (0-1)"
              value={newCustomer.onTimePaymentRate}
              onChange={(e) => setNewCustomer({ ...newCustomer, onTimePaymentRate: Number(e.target.value) })}
            />
          </div>
          <div className="enterprise-add-form-row">
            <button className="enterprise-btn-secondary" onClick={handleAddCustomer}>
              Save Customer
            </button>
            <button className="enterprise-btn-secondary" onClick={() => setShowAddForm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
      <div className="enterprise-search-bar">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Search by name or customer ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="enterprise-select-compact"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="alert">Alert</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Customers Table */}
      <div className="enterprise-table-container">
        <table className="enterprise-customers-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Health Score</th>
              <th>Credit Score</th>
              <th>Days Past Due</th>
              <th>Loan Balance</th>
              <th>On-time Rate</th>
              <th>Trend</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((customer) => (
              <tr key={customer.id} className={`status-${customer.status}`}>
                <td className="customer-cell">
                  <div className="customer-info">
                    <div className="customer-name">{customer.name}</div>
                    <div className="customer-id">{customer.id} ({customer.loanType})</div>
                  </div>
                </td>
                <td>
                  {(() => {
                    const score = calculateCustomerHealthScore(customer);
                    const band = getHealthBand(score);
                    return (
                      <div className="score-badge">
                        <span
                          className="score-value"
                          style={{ color: getBandColor(band) }}
                        >
                          {score}
                        </span>
                        <span className="score-band">{band}</span>
                      </div>
                    );
                  })()}
                </td>
                <td>{customer.creditScore}</td>
                <td>
                  <span
                    className={`dpd-badge ${
                      customer.dpd > 60
                        ? "dpd-critical"
                        : customer.dpd > 30
                        ? "dpd-high"
                        : customer.dpd > 0
                        ? "dpd-medium"
                        : "dpd-low"
                    }`}
                  >
                    {customer.dpd > 0 && <AlertTriangle size={14} />}
                    {customer.dpd} days
                  </span>
                </td>
                <td>₹{(customer.loanBalance / 1000).toFixed(0)}k</td>
                <td>{Math.round((customer.onTimePaymentRate ?? 0) * 100)}%</td>
                <td>
                  <span
                    className={`trend-indicator ${customer.trend}`}
                  >
                    {getTrendIcon(customer.trend)}
                  </span>
                </td>
                <td>
                  <button className="enterprise-btn-icon">
                    <Eye size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="enterprise-pagination">
        <button disabled={page === 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>← Previous</button>
        <span>Page {page}</span>
        <button onClick={() => setPage((prev) => prev + 1)}>Next →</button>
      </div>
    </div>
  );
});

CustomerIntelligence.displayName = "CustomerIntelligence";

export default CustomerIntelligence;