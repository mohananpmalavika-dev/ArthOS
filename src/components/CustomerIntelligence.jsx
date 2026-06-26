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
    score: 0,
    band: "Developing",
    status: "active",
    lastAssessment: "2024-06-20",
    riskLevel: "medium",
    trend: "stable",
    accounts: 1,
    totalDeposits: 0
  });

  const [customers, setCustomers] = useState([
    {
      id: "CS-14523",
      name: "John Smith",
      email: "john.smith@email.com",
      score: 645,
      band: "Resilient",
      status: "active",
      lastAssessment: "2024-06-15",
      riskLevel: "low",
      trend: "up",
      accounts: 3,
      totalDeposits: 125000
    },
    {
      id: "CS-18746",
      name: "Sarah Chen",
      email: "sarah.chen@email.com",
      score: 385,
      band: "Fragile",
      status: "alert",
      lastAssessment: "2024-06-18",
      riskLevel: "high",
      trend: "down",
      accounts: 2,
      totalDeposits: 45000
    },
    {
      id: "CS-92034",
      name: "Michael Johnson",
      email: "m.johnson@email.com",
      score: 720,
      band: "Resilient",
      status: "active",
      lastAssessment: "2024-06-17",
      riskLevel: "low",
      trend: "up",
      accounts: 4,
      totalDeposits: 350000
    },
    {
      id: "CS-56789",
      name: "Emily Davis",
      email: "emily.davis@email.com",
      score: 480,
      band: "Developing",
      status: "active",
      lastAssessment: "2024-06-16",
      riskLevel: "medium",
      trend: "stable",
      accounts: 2,
      totalDeposits: 78000
    },
    {
      id: "CS-34521",
      name: "Robert Wilson",
      email: "r.wilson@email.com",
      score: 180,
      band: "Critical",
      status: "alert",
      lastAssessment: "2024-06-19",
      riskLevel: "critical",
      trend: "down",
      accounts: 1,
      totalDeposits: 12000
    }
  ];

  const getBandColor = (band) => {
    const colors = {
      Critical: "#ef4444",
      Fragile: "#f97316",
      Developing: "#eab308",
      Resilient: "#22c55e",
      Sovereign: "#06b6d4"
    };
    return colors[band] || "#666";
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
    setCustomers((prev) => [newCustomer, ...prev]);
    setShowAddForm(false);
    setNewCustomer({
      name: "",
      id: "",
      score: 0,
      band: "Developing",
      status: "active",
      lastAssessment: "2024-06-20",
      riskLevel: "medium",
      trend: "stable",
      accounts: 1,
      totalDeposits: 0
    });
  };

  const handleExportList = () => {
    const rows = [
      ["Customer", "Customer ID", "Health Score", "Risk Level", "Last Assessment", "Accounts", "Deposits", "Trend", "Status"],
      ...filteredCustomers.map((customer) => [
        customer.name,
        customer.id,
        customer.score,
        customer.riskLevel,
        customer.lastAssessment,
        customer.accounts,
        customer.totalDeposits,
        customer.trend,
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
              placeholder="Total deposits"
              value={newCustomer.totalDeposits}
              onChange={(e) => setNewCustomer({ ...newCustomer, totalDeposits: Number(e.target.value) })}
            />
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
              <th>Risk Level</th>
              <th>Last Assessment</th>
              <th>Accounts</th>
              <th>Deposits</th>
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
                    <div className="customer-id">{customer.id}</div>
                  </div>
                </td>
                <td>
                  <div className="score-badge">
                    <span
                      className="score-value"
                      style={{ color: getBandColor(customer.band) }}
                    >
                      {customer.score}
                    </span>
                    <span className="score-band">{customer.band}</span>
                  </div>
                </td>
                <td>
                  <span
                    className={`risk-badge risk-${customer.riskLevel}`}
                  >
                    {customer.riskLevel === "critical" && (
                      <AlertTriangle size={14} />
                    )}
                    {customer.riskLevel.charAt(0).toUpperCase() +
                      customer.riskLevel.slice(1)}
                  </span>
                </td>
                <td>{customer.lastAssessment}</td>
                <td>{customer.accounts}</td>
                <td>₹{(customer.totalDeposits / 1000).toFixed(0)}k</td>
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
